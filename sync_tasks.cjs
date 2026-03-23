require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function matchesNitRule(clientNitStr, rule) {
    if (!rule || !clientNitStr) return false;
    
    if (rule.includes('-')) {
        const parts = rule.split('-');
        if (parts.length === 2) {
            const start = parseInt(parts[0], 10);
            const end = parseInt(parts[1], 10);
            const lastTwo = parseInt(clientNitStr.slice(-2), 10);
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

async function run() {
    console.log("Downloading calendar...");
    const { data: calendar, error: calErr } = await supabase.from('calendario_tributario').select('*');
    if (calErr) {
        console.error("Error downloading calendar:", calErr);
        return;
    }

    console.log("Fetching clients...");
    const { data: clients, error: clErr } = await supabase.from('app_clients').select('*');
    if (clErr) {
        console.error("Error fetching clients:", clErr);
        return;
    }

    console.log(`Found ${clients.length} clients to sync.`);

    let totalTasksInserted = 0;

    for (const client of clients) {
        if (!client || client.status === 'Inactivo') continue;
        
        const clientIdStr = client.nit || client.cedula || '';
        if (!clientIdStr) continue;

        const rps = client.responsabilidades_nacionales || {};
        const requiredTaxes = [];
        
        if (rps.iva === 'bimestral') requiredTaxes.push('IVA Bimestral');
        if (rps.iva === 'cuatrimestral') requiredTaxes.push('IVA Cuatrimestral');
        if (rps.consumo) requiredTaxes.push('INC Bimestral');
        if (rps.rteFte) requiredTaxes.push('Retefuente');
        if (rps.exogenas) requiredTaxes.push('Exógena Nal');
        
        if (rps.gmf) requiredTaxes.push('GMF');
        if (rps.impuestoPatrimonio) requiredTaxes.push('Impuesto al patrimonio');
        if (rps.preciosTransferencia) requiredTaxes.push('Precios de Transferencia');
        if (rps.gasolina) requiredTaxes.push('Gasolina y ACPM');
        if (rps.carbono) requiredTaxes.push('Carbono');
        if (rps.plasticos) requiredTaxes.push('Plásticos');
        if (rps.bebidasUltraprocesadas) requiredTaxes.push('Bebidas Ultraprocesadas');

        if (client.tipo_contribuyente === 'Régimen Simple') {
            requiredTaxes.push('Anticipo Simple', 'Activos Exterior');
            if (rps.iva === 'bimestral' || rps.iva === 'cuatrimestral') {
                 requiredTaxes.push('IVA anual Simple');
            }
        } else if (rps.renta) {
            if (client.tipo_contribuyente === 'Gran Contribuyente' || client.tipo_contribuyente === 'Gran Contribuyente autorretenedor') {
                requiredTaxes.push('Renta GC', 'Activos Exterior');
            } else if (client.tipo_persona === 'Persona Jurídica') {
                requiredTaxes.push('Renta PJ', 'Activos Exterior');
            } else {
                requiredTaxes.push('Renta PN', 'Activos Exterior');
            }
        }

        const tasks = [];
        const taxSet = new Set(requiredTaxes);
        const cuotas = rps.cuotasRenta || { cuota1: true, cuota2: true, cuota3: true };

        for (const record of calendar) {
            const imp = record.impuesto;
            if (!taxSet.has(imp)) continue;
            if (!matchesNitRule(clientIdStr, record.nit_digitos)) continue;
            
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
                    if (!cuotas.cuota1) continue;
                }
            }

            let rawDate = record.fecha_limite;
            let formattedDate = rawDate;
            if (rawDate && rawDate.includes('/')) {
                const parts = rawDate.split('/');
                if (parts.length === 3) {
                    formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }

            const cleanTitle = `${imp} (${record.periodo})`;
            const safePeriodoStr = record.periodo.replace(/[^a-zA-Z0-9 -]/g, '').trim().replace(/\s+/g, '_');
            const deadlineId = `${client.id}_${imp}_${safePeriodoStr}`;
            
            tasks.push({
                title: cleanTitle,
                client_id: client.id,
                user_id: client.user_id,
                due_date: formattedDate,
                status: 'por-presentar',
                is_auto_generated: true,
                deadline_id: deadlineId
            });
        }

        // Apply tasks
        if (tasks.length > 0) {
            // Delete old
            const { error: delErr } = await supabase.from('app_tasks').delete().eq('client_id', client.id).eq('is_auto_generated', true);
            if (delErr) {
                console.error(`Error deleting tasks for ${client.id}:`, delErr);
                continue;
            }

            // Insert new
            const { error: insErr } = await supabase.from('app_tasks').insert(tasks);
            if (insErr) {
                console.error(`Error inserting tasks for ${client.id}:`, insErr);
            } else {
                //console.log(`Inserted ${tasks.length} tasks for client ${client.id}`);
                totalTasksInserted += tasks.length;
            }
        }
    }

    console.log(`Done! Synchronized and generated ${totalTasksInserted} total tasks!`);
}

run();
