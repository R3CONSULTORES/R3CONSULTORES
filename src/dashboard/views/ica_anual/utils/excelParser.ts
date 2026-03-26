import * as XLSX from 'xlsx';

export interface ParsedIncomeRow {
    id: string;
    cuenta: string;
    descripcion: string;
    tercero: string;
    credito: number;
    debito: number;
    ingresoNeto: number;
    jurisdiccion: 'LOCAL' | 'FORANEO';
    tratamiento: 'GRAVADO' | 'EXCLUIDO' | 'EXENTO';
    ciiuId: string;
    aiSuggested?: boolean;
}

/**
 * Procesa un archivo auxiliar contable (.xlsx).
 * Detecta encabezados dinámicamente con una lista amplia de sinónimos.
 * Soporta el patrón de "cuenta heredada" (la cuenta aparece en la primera fila
 * del grupo y las filas debajo la heredan hasta el siguiente grupo o fila "Total").
 */
export const processExcelFile = async (
    file: File,
    municipalityName: string,
    defaultCiiuId: string
): Promise<ParsedIncomeRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

                // ============ 1. DETECTAR ENCABEZADOS ============
                let headerRowIndex = -1;
                let cuentaIdx = -1;
                let descIdx = -1;
                let terceroIdx = -1;
                let debitoIdx = -1;
                let creditoIdx = -1;

                // Buscar en las primeras 30 filas por los encabezados
                for (let i = 0; i < Math.min(30, json.length); i++) {
                    const row = json[i];
                    if (!row || !Array.isArray(row)) continue;

                    const rowStr = row.map(c => String(c).toLowerCase().trim());

                    // Sinónimos amplios para cada columna clave
                    const cIdx = rowStr.findIndex(s =>
                        s === 'cuenta' || s === 'codigo' || s === 'código' ||
                        s === 'cuenta contable' || s === 'cod cuenta' || s === 'cta'
                    );
                    const dsIdx = rowStr.findIndex(s =>
                        s === 'nota' || s === 'detalle' || s === 'descripcion' || s === 'descripción' ||
                        s === 'concepto' || s === 'observacion' || s === 'observación' || s === 'glosa'
                    );
                    const trIdx = rowStr.findIndex(s =>
                        s === 'tercero' || s === 'nit' || s === 'cliente' ||
                        s === 'nombre tercero' || s === 'razon social' || s === 'razón social'
                    );
                    const dbIdx = rowStr.findIndex(s =>
                        s === 'debito' || s === 'débito' || s === 'debitos' || s === 'débitos' ||
                        s === 'debe' || s === 'valor debito' || s === 'valor débito'
                    );
                    const crIdx = rowStr.findIndex(s =>
                        s === 'credito' || s === 'crédito' || s === 'creditos' || s === 'créditos' ||
                        s === 'haber' || s === 'valor credito' || s === 'valor crédito'
                    );

                    // Necesitamos al menos Cuenta + (Débito O Crédito)
                    if (cIdx !== -1 && (dbIdx !== -1 || crIdx !== -1)) {
                        headerRowIndex = i;
                        cuentaIdx = cIdx;
                        descIdx = dsIdx !== -1 ? dsIdx : -1;
                        terceroIdx = trIdx !== -1 ? trIdx : -1;
                        debitoIdx = dbIdx;
                        creditoIdx = crIdx;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    throw new Error(
                        "No se pudo detectar la estructura del Auxiliar Contable. " +
                        "Se esperan columnas como: 'Cuenta', 'Nota/Detalle/Descripción', 'Débitos', 'Créditos'. " +
                        "Revisa que tu archivo tenga encabezados en las primeras 30 filas."
                    );
                }

                // ============ 2. PARSEAR FILAS CON HERENCIA DE CUENTA ============
                const results: ParsedIncomeRow[] = [];
                let currentCuenta = ''; // Para el patrón de herencia

                for (let i = headerRowIndex + 1; i < json.length; i++) {
                    const row = json[i];
                    if (!row || !Array.isArray(row)) continue;

                    const rawCuenta = String(row[cuentaIdx] || '').trim();

                    // Si la celda de cuenta tiene contenido, actualizar la cuenta actual
                    if (rawCuenta !== '') {
                        // Ignorar filas "Total" (son subtotales del software contable)
                        if (rawCuenta.toLowerCase().startsWith('total ')) continue;
                        
                        // Extraer solo el código numérico del inicio (ej: "41309504 UTILIDAD" -> "41309504")
                        const cuentaMatch = rawCuenta.match(/^(\d+)/);
                        if (cuentaMatch) {
                            currentCuenta = cuentaMatch[1];
                        } else {
                            currentCuenta = rawCuenta;
                        }
                    }

                    // Solo procesar cuentas de ingresos (empiezan con "4")
                    if (!currentCuenta.startsWith('4')) continue;

                    // Extraer valores numéricos
                    const deb = debitoIdx !== -1 ? (Number(row[debitoIdx]) || 0) : 0;
                    const cred = creditoIdx !== -1 ? (Number(row[creditoIdx]) || 0) : 0;

                    // Ignorar filas sin movimiento y filas de saldo inicial sin detalle de tercero
                    if (deb === 0 && cred === 0) continue;

                    const desc = descIdx !== -1 ? String(row[descIdx] || '').trim() : '';
                    const ter = terceroIdx !== -1 ? String(row[terceroIdx] || '').trim() : '';

                    // Ignorar filas de "SALDO INICIAL" sin tercero (son acumulados, no movimientos reales)
                    if (desc.toUpperCase().includes('SALDO INICIAL') && ter === '') continue;

                    results.push({
                        id: crypto.randomUUID(),
                        cuenta: currentCuenta,
                        descripcion: desc,
                        tercero: ter,
                        debito: deb,
                        credito: cred,
                        ingresoNeto: Math.max(0, cred - deb),
                        jurisdiccion: 'LOCAL',
                        tratamiento: 'GRAVADO',
                        ciiuId: defaultCiiuId
                    });
                }

                // ============ 3. APLICAR HEURÍSTICAS ============
                applyHeuristics(results, municipalityName);

                resolve(results);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error("Error leyendo el archivo"));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Aplica reglas heurísticas deterministas para clasificar jurisdicción y tratamiento.
 * Detecta menciones a otros municipios en la descripción/tercero para marcar FORÁNEO.
 */
const applyHeuristics = (rows: ParsedIncomeRow[], localMunicipality: string) => {
    const localMunLower = localMunicipality.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Municipios principales de Colombia para detección heurística
    const knownCities = [
        'bogota', 'medellin', 'cali', 'barranquilla', 'cartagena', 'bucaramanga',
        'manizales', 'pereira', 'cucuta', 'ibague', 'santa marta', 'valledupar',
        'villavicencio', 'pasto', 'monteria', 'neiva', 'armenia', 'popayan',
        'sincelejo', 'tulua', 'floridablanca', 'envigado', 'palmira', 'soledad',
        'bello', 'dosquebradas', 'riohacha', 'tunja',
        // Municipios del Cesar (contexto minero)
        'la jagua de ibirico', 'becerril', 'chiriguana', 'codazzi', 'el paso',
        'la paz', 'manaure', 'san diego', 'san martin', 'aguachica',
        'agustin codazzi', 'bosconia', 'curumani'
    ];

    rows.forEach(row => {
        const textRaw = `${row.descripcion} ${row.tercero}`;
        const textNormalized = textRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // 1. Detección de Jurisdicción por patrones como "JURISDICCION XXXX"
        const jurisdiccionMatch = textNormalized.match(/jurisdicci[oó]n\s+(.+?)[\.\,\s]*$/i) 
            || textNormalized.match(/jurisdicci[oó]n\s+(.+?)[\.\,]/i);
        
        if (jurisdiccionMatch) {
            const cityMentioned = jurisdiccionMatch[1].trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            // Si la jurisdicción mencionada NO es la local, es foráneo
            if (!cityMentioned.includes(localMunLower) && !localMunLower.includes(cityMentioned)) {
                row.jurisdiccion = 'FORANEO';
            }
            return; // Ya tenemos la clasificación exacta
        }

        // 2. Detección genérica por mención de otras ciudades
        for (const city of knownCities) {
            if (city !== localMunLower && textNormalized.includes(city)) {
                row.jurisdiccion = 'FORANEO';
                break;
            }
        }

        // 3. Detección de tratamiento
        if (textNormalized.includes('exportaci')) {
            row.tratamiento = 'EXENTO';
        }
        if (textNormalized.includes('activo fijo') || textNormalized.includes('inmueble propio')) {
            row.tratamiento = 'EXCLUIDO';
        }
    });
};
