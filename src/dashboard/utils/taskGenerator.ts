import type { Client, Task } from '../types';
import { supabase } from '../../lib/supabase';

// Helper to determine if a client NIT matches the rule
function matchesNitRule(clientNitStr: string, rule: string): boolean {
    if (!rule || !clientNitStr) return false;
    
    // Rango: "01-05", "96-00"
    if (rule.includes('-')) {
        const parts = rule.split('-');
        if (parts.length === 2) {
            const start = parseInt(parts[0], 10);
            const end = parseInt(parts[1], 10);
            // El rango asume los dos últimos dígitos
            const lastTwo = parseInt(clientNitStr.slice(-2), 10);
            // Casos especiales como 96-00 donde el final envuelve al 100
            if (start > end && end === 0) {
                 return lastTwo >= start || lastTwo === 0;
            }
            return lastTwo >= start && lastTwo <= end;
        }
    }
    
    const targetLength = rule.length;
    const targetDigits = clientNitStr.slice(-targetLength);
    return targetDigits === rule || parseInt(targetDigits, 10) === parseInt(rule, 10);
}

export async function generateTaxTasksForClient(client: Client, year?: number): Promise<Partial<Task>[]> {
    if (!client || client.status === 'Inactivo') return [];
    
    // Obtenemos el ID de validación (cédula o NIT real numérico)
    const clientIdStr = client.nit || client.cedula || '';
    if (!clientIdStr) return [];

    const rps = client.responsabilidadesNacionales || ({} as Client['responsabilidadesNacionales']);
    const requiredTaxes: string[] = [];
    
    // Mapeamos las responsabilidades del cliente a los nombres EXACTOS de Supabase (y futuros)
    if (rps.iva === 'bimestral') requiredTaxes.push('IVA Bimestral');
    if (rps.iva === 'cuatrimestral') requiredTaxes.push('IVA Cuatrimestral');
    if (rps.consumo) requiredTaxes.push('INC Bimestral');
    if (rps.rteFte) requiredTaxes.push('Retefuente');
    if (rps.exogenas) requiredTaxes.push('Exógena Nal');
    
    // Nuevas responsabilidades futuras
    if (rps.gmf) requiredTaxes.push('GMF');
    if (rps.impuestoPatrimonio) requiredTaxes.push('Impuesto al patrimonio');
    if (rps.preciosTransferencia) requiredTaxes.push('Precios de Transferencia');
    if (rps.gasolina) requiredTaxes.push('Gasolina y ACPM');
    if (rps.carbono) requiredTaxes.push('Carbono');
    if (rps.plasticos) requiredTaxes.push('Plásticos');
    if (rps.bebidasUltraprocesadas) requiredTaxes.push('Bebidas Ultraprocesadas');

    // Mapeo especial para rentas y SIMPLE
    if (client.tipoContribuyente === 'Régimen Simple') {
        requiredTaxes.push('Anticipo Simple', 'Activos Exterior'); // Asumimos que SIMPLE puede tener activos
        // En los calendarios hay 'IVA anual Simple'
        if (rps.iva === 'bimestral' || rps.iva === 'cuatrimestral') {
             requiredTaxes.push('IVA anual Simple');
        }
    } else if (rps.renta) {
        if (client.tipoContribuyente === 'Gran Contribuyente' || client.tipoContribuyente === 'Gran Contribuyente autorretenedor') {
            requiredTaxes.push('Renta GC');
            requiredTaxes.push('Activos Exterior');
        } else if (client.tipoPersona === 'Persona Jurídica') {
            requiredTaxes.push('Renta PJ');
            requiredTaxes.push('Activos Exterior');
        } else {
            requiredTaxes.push('Renta PN');
            requiredTaxes.push('Activos Exterior');
        }
    }

    // Usamos el cliente de Supabase para traer los vencimientos.
    // Como la tabla de vencimientos (~550 rows) es pequeña, la bajamos completa y la filtramos en memoria
    // para procesar la lógica compleja de NITs (ej. rangos "01-05" o "96-00").
    const { data: calendar, error } = await supabase.from('calendario_tributario').select('*');
    
    if (error || !calendar) {
        console.error("Error al traer el calendario tributario de Supabase:", error);
        return [];
    }

    const tasks: Partial<Task>[] = [];
    const taxSet = new Set(requiredTaxes);
    const cuotas = rps.cuotasRenta || { cuota1: true, cuota2: true, cuota3: true };

    for (const record of calendar) {
        const imp = record.impuesto;
        
        // El impuesto debe ser uno de los requeridos
        if (!taxSet.has(imp)) continue;
        
        // El NIT debe encajar con la regla
        if (!matchesNitRule(clientIdStr, record.nit_digitos)) continue;
        
        // Filtro condicional para cuotas de renta
        if (imp.startsWith('Renta')) {
            const pLower = record.periodo.toLowerCase();
            if (imp === 'Renta GC') {
                if (!cuotas.cuota1 && pLower.includes('primera cuota')) continue;
                if (!cuotas.cuota2 && pLower.includes('segunda cuota')) continue;
                if (!cuotas.cuota3 && pLower.includes('tercera cuota')) continue;
            } else if (imp === 'Renta PJ') {
                if (!cuotas.cuota1 && pLower.includes('primera cuota')) continue;
                if (!cuotas.cuota2 && pLower.includes('segunda cuota')) continue;
            } else if (imp === 'Renta PN') {
                if (!cuotas.cuota1) continue; // Si es PN y apagó la casilla de cuota única (1) no se genera
            }
        }

        // Si pasa todos los filtros, preparamos la tarea
        // Transformamos dd/mm/yyyy a string compatible si fuera necesario, la BD ya tiene "YYYY-MM-DD"
        let rawDate = record.fecha_limite;
        let formattedDate = rawDate;
        
        if (rawDate && rawDate.includes('/')) {
            // Conversión rápida de posible formato dd/mm/yyyy a yyyy-mm-dd
            const parts = rawDate.split('/');
            if (parts.length === 3) {
                formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        // Título limpio para la app
        const cleanTitle = `${imp} (${record.periodo})`;
        // Generar un ID único repetible en base al año (aunque actualmente json asume 2026)
        // Se preserva la lógica de reemplazo para que no queden duplicados al sincronizar
        const safePeriodoStr = record.periodo.replace(/[^a-zA-Z0-9 -]/g, '').trim().replace(/\s+/g, '_');
        const deadlineId = `${client.id}_${imp}_${safePeriodoStr}`;
        
        tasks.push({
            title: cleanTitle,
            clientId: client.id,
            dueDate: formattedDate,
            status: 'por-presentar',
            isAutoGenerated: true,
            deadlineId: deadlineId
        });
    }

    return tasks;
}
