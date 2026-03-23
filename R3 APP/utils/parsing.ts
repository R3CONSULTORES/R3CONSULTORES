
import type { AuxiliarData, DianData, RetencionBaseData, ValidationData, VentasComprasData } from '../types';

// The XLSX library is loaded from a script tag in index.html, so we declare it here.
declare const XLSX: any;

export const calcularDV = (numero: string): string => {
    if (!/^\d+$/.test(numero) || numero.length === 0) return '';
    const pesos = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
    let suma = 0;
    const offset = pesos.length - numero.length;
    for (let i = 0; i < numero.length; i++) {
        suma += parseInt(numero[i], 10) * pesos[i + offset];
    }
    const residuo = suma % 11;
    if (residuo < 2) {
        return String(residuo);
    } else {
        return String(11 - residuo);
    }
};

export const parseExcelFile = (file: File): Promise<any[][]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                if (!event.target?.result) {
                    return reject(new Error("No se pudo leer el archivo."));
                }
                const data = new Uint8Array(event.target.result as ArrayBuffer);
                const workbook = XLSX.read(data);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
                resolve(json);
            } catch (error) {
                console.error("Error al parsear el archivo Excel:", error);
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
};

const normalizeText = (text: string | null | undefined): string => {
    if (typeof text !== 'string') return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, ' ');
};

const cleanNumber = (value: any): number => {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        let cleaned = value.replace(/\./g, '');
        cleaned = cleaned.replace(/,/g, '.');
        cleaned = cleaned.trim();
        if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
            cleaned = '-' + cleaned.substring(1, cleaned.length - 1);
        }
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
    return 0;
};

const convertExcelDate = (excelDate: any): Date | null => {
    if (typeof excelDate === 'number' && excelDate > 1) {
        try {
            const excelEpoch = new Date(1899, 11, 30);
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            const daysAdjustment = excelDate > 59 ? -1 : 0;
            const date = new Date(excelEpoch.getTime() + (excelDate + daysAdjustment) * millisecondsPerDay);
            if (isNaN(date.getTime())) return null;
            return date;
        } catch (e) { return null; }
    }
    if (typeof excelDate === 'string') {
        let date: Date | null = null;
        let parts = excelDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (parts) date = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
        else {
            parts = excelDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
            if (parts) date = new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
            else {
                try { date = new Date(excelDate); } catch (e) { }
            }
        }
        if (date && !isNaN(date.getTime())) return date;
    }
    if (excelDate instanceof Date && !isNaN(excelDate.getTime())) {
        return excelDate;
    }
    return null;
};


const formatDate = (dateObj: Date | null): string => {
    if (!dateObj || isNaN(dateObj.getTime())) return 'N/A';
    try {
        let day = ('0' + dateObj.getDate()).slice(-2);
        let month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
        let year = dateObj.getFullYear();
        if (year < 1900 || year > 2100) return 'Fecha Inválida';
        return `${day}/${month}/${year}`;
    } catch (e) { return 'Error Fecha'; }
};

function findHeaderRow(sheetData: any[][], requiredHeaderGroups: (string | string[])[], optionalHeaders: string[] = []): { headerRowIndex: number, columnMap: Record<string, number> } {
    const columnMap: Record<string, number> = {};
    let headerRowIndex = -1;

    for (let i = 0; i < Math.min(sheetData.length, 20); i++) {
        const row = sheetData[i];
        if (!Array.isArray(row)) continue;

        const normalizedRow = row.map(cell => normalizeText(String(cell === null || cell === undefined ? '' : cell)));
        
        Object.keys(columnMap).forEach(key => delete columnMap[key]);
        let foundGroups = 0;

        requiredHeaderGroups.forEach(group => {
            const groupArray = Array.isArray(group) ? group : [group];
            let foundInGroup = false;
            for (const header of groupArray) {
                const index = normalizedRow.indexOf(header);
                if (index !== -1) {
                    columnMap[header] = index;
                    foundInGroup = true;
                    break;
                }
            }
            if (foundInGroup) foundGroups++;
        });

        if (foundGroups === requiredHeaderGroups.length) {
            headerRowIndex = i;
            // Add optional headers if found
            optionalHeaders.forEach(optHeader => {
                const index = normalizedRow.indexOf(optHeader);
                if (index !== -1) {
                    columnMap[optHeader] = index;
                }
            });
            return { headerRowIndex, columnMap };
        }
    }

    const missingGroups = requiredHeaderGroups.filter(group => {
        const groupArray = Array.isArray(group) ? group : [group];
        return !groupArray.some(header => header in columnMap);
    }).map(g => `(${(Array.isArray(g) ? g.join(' o ') : g)})`);

    if (missingGroups.length > 0) {
        throw new Error(`Columnas requeridas no encontradas: ${missingGroups.join(', ')}`);
    } else {
        throw new Error(`No se pudo encontrar la fila de cabecera con todas las columnas requeridas.`);
    }
}

export const processAuxiliar = (sheetData: any[][], currentNits: Map<string, string>): { data: AuxiliarData[], nits: Map<string, string> } => {
    const headers = [['cuenta'], ['tercero'], ['fecha'], ['nota'], ['doc num'], ['debitos'], ['creditos']];
    const optional = ['cheque', 'saldo'];
    const { headerRowIndex, columnMap } = findHeaderRow(sheetData, headers, optional);

    const dataRows = sheetData.slice(headerRowIndex + 1);
    const processedData: AuxiliarData[] = [];
    const nits = new Map(currentNits);
    let currentCuenta = '';

    dataRows.forEach(row => {
        if (!Array.isArray(row) || row.every(cell => cell === null || cell === '')) return;

        const cuentaVal = row[columnMap['cuenta']];
        if (cuentaVal && normalizeText(String(cuentaVal))) {
            const normalizedCuentaText = normalizeText(String(cuentaVal));
            if (normalizedCuentaText.startsWith('total')) {
                return; // It's a total row, skip it.
            }
            currentCuenta = String(cuentaVal).trim(); // It's a new account row.
        }

        const nota = String(row[columnMap['nota']] || '').trim();
        if (normalizeText(nota).includes('saldo inicial') || nota === '') return;

        const debitosVal = row[columnMap['debitos']];
        const creditosVal = row[columnMap['creditos']];
        if (cleanNumber(debitosVal) === 0 && cleanNumber(creditosVal) === 0) {
            return; // Not a transaction (could be an account header, which we've already processed)
        }

        if (!currentCuenta) {
            return; // Skip transactions without an account context
        }

        const terceroVal = String(row[columnMap['tercero']] || '');
        const match = terceroVal.match(/(.*)Nit:\s*([\d\.-]+)/i);
        let nombreTercero = terceroVal.trim();
        let nitTercero = '';
        if (match) {
            nombreTercero = match[1].trim();
            nitTercero = match[2].trim().replace(/\./g, '').replace(/-.*/, '');
        }

        if (nitTercero && !nits.has(nitTercero)) {
            nits.set(nitTercero, nombreTercero);
        }

        processedData.push({
            id: `aux-row-${processedData.length}`,
            Cuenta: currentCuenta,
            Tercero: nombreTercero,
            NIT: nitTercero,
            Fecha: formatDate(convertExcelDate(row[columnMap['fecha']])),
            Nota: nota,
            DocNum: String(row[columnMap['doc num']] || '').replace(/\(.*\)/g, '').trim(),
            Debitos: cleanNumber(debitosVal),
            Creditos: cleanNumber(creditosVal),
        });
    });

    if (processedData.length === 0) throw new Error("No se encontraron datos válidos en Auxiliar.");
    return { data: processedData, nits };
};

const processVentasCompras = (sheetData: any[][], currentNits: Map<string, string>, type: 'Ventas' | 'Compras'): { data: VentasComprasData[], nits: Map<string, string> } => {
    const headers = [['documento'], ['fecha'], ['cliente'], ['venta neta'], ['iva']];
    const optional = ['dias', 'descuento', 'ret iva', 'ret ica', 'ret fuente', 'valor total'];
    const { headerRowIndex, columnMap } = findHeaderRow(sheetData, headers, optional);
    const dataRows = sheetData.slice(headerRowIndex + 1);
    const processedData: VentasComprasData[] = [];
    const nits = new Map(currentNits);
    const idPrefix = type === 'Ventas' ? 'venta' : 'compra';

    dataRows.forEach(row => {
        if (!Array.isArray(row) || row.every(cell => cell === null || cell === '')) return;
        const clienteVal = String(row[columnMap['cliente']] || '');
        const docVal = String(row[columnMap['documento']] || '');
        if (!normalizeText(clienteVal) || !normalizeText(docVal)) return;

        const match = clienteVal.match(/^(\d+)\s+(.*)/);
        let nombreCliente = clienteVal.trim(), nitCliente = '';
        if (match) { nitCliente = match[1].trim(); nombreCliente = match[2].trim(); }
        
        if (nitCliente && !nits.has(nitCliente)) {
            nits.set(nitCliente, nombreCliente);
        }
        
        const ventaNeta = cleanNumber(row[columnMap['venta neta']]);
        const iva = cleanNumber(row[columnMap['iva']]);
        
        processedData.push({
            id: `${idPrefix}-row-${processedData.length}`,
            Documento: docVal.replace(/\(.*\)/g, '').trim(),
            FechaObj: convertExcelDate(row[columnMap['fecha']]),
            Fecha: formatDate(convertExcelDate(row[columnMap['fecha']])),
            Cliente: nombreCliente, NIT: nitCliente,
            VentaNeta: ventaNeta,
            IVA: iva,
            Dias: String(row[columnMap['dias']] || 'N/A'),
            Descuento: cleanNumber(row[columnMap['descuento']]),
            RetIVA: cleanNumber(row[columnMap['ret iva']]),
            RetICA: cleanNumber(row[columnMap['ret ica']]),
            RetFuente: cleanNumber(row[columnMap['ret fuente']]),
            ValorTotal: cleanNumber(row[columnMap['valor total']]),
        });
    });

    if (processedData.length === 0) throw new Error(`No se encontraron datos válidos en ${type}.`);
    return { data: processedData, nits };
};

export const processVentas = (sheetData: any[][], nits: Map<string, string>) => processVentasCompras(sheetData, nits, 'Ventas');
export const processCompras = (sheetData: any[][], nits: Map<string, string>) => processVentasCompras(sheetData, nits, 'Compras');

export const processDian = (sheetData: any[][], currentNits: Map<string, string>): { data: DianData[], nits: Map<string, string> } => {
    const headers = [
        ['tipo de documento'], ['folio'], ['prefijo'], ['nit emisor'], ['nombre emisor'],
        ['nit receptor'], ['nombre receptor'], ['iva'], ['total'], ['grupo'],
        ['fecha emisión', 'fecha emision', 'fecha recepción']
    ];
    const optional = [
        'ica', 'ic', 'inc', 'timbre', 'inc bolsas', 'in carbono', 'in combustibles',
        'ic datos', 'icl', 'inpp', 'ibua', 'icui', 'rete iva', 'rete renta', 'rete ica'
    ];
    const { headerRowIndex, columnMap } = findHeaderRow(sheetData, headers, optional);
    const fechaKey = ['fecha emisión', 'fecha emision', 'fecha recepción'].find(k => k in columnMap)!;

    const dataRows = sheetData.slice(headerRowIndex + 1);
    const processedData: DianData[] = [];
    const nits = new Map(currentNits);

    const allTaxAndRetentionHeaders = [
        'iva', 'ica', 'ic', 'inc', 'timbre', 'inc bolsas', 'in carbono', 'in combustibles',
        'ic datos', 'icl', 'inpp', 'ibua', 'icui', 'rete iva', 'rete renta', 'rete ica'
    ];
    
    const headerToPropertyMap: Record<string, keyof DianData> = {
        'ica': 'ICA', 'ic': 'IC', 'inc': 'INC', 'timbre': 'Timbre',
        'inc bolsas': 'INCBolsas', 'in carbono': 'INCarbono', 'in combustibles': 'INCombustibles',
        'ic datos': 'ICDatos', 'icl': 'ICL', 'inpp': 'INPP', 'ibua': 'IBUA', 'icui': 'ICUI',
        'rete iva': 'ReteIVA', 'rete renta': 'ReteRenta', 'rete ica': 'ReteICA'
    };


    dataRows.forEach(row => {
        if (!Array.isArray(row) || !normalizeText(String(row[columnMap['folio']] || ''))) return;
        
        const tipoDoc = normalizeText(String(row[columnMap['tipo de documento']] || ''));
        const docTypesToIgnore = ['nomina electronica', 'applications response', 'nomina individual'];
        if (docTypesToIgnore.some(term => tipoDoc.includes(term))) {
            return; // Skip payroll and other non-relevant docs
        }

        const factor = tipoDoc.includes('nota de credito') ? -1 : 1;
        
        let totalImpuestosYRetenciones = 0;
        allTaxAndRetentionHeaders.forEach(key => {
            if (key in columnMap) {
                totalImpuestosYRetenciones += cleanNumber(row[columnMap[key]]);
            }
        });

        const total = cleanNumber(row[columnMap['total']]);
        const base = total - totalImpuestosYRetenciones;

        const nitEmisor = String(row[columnMap['nit emisor']] || '').replace(/\D/g, '');
        const nitReceptor = String(row[columnMap['nit receptor']] || '').replace(/\D/g, '');
        const nombreEmisor = String(row[columnMap['nombre emisor']] || '');
        const nombreReceptor = String(row[columnMap['nombre receptor']] || '');

        if (nitEmisor && !nits.has(nitEmisor)) nits.set(nitEmisor, nombreEmisor);
        if (nitReceptor && !nits.has(nitReceptor)) nits.set(nitReceptor, nombreReceptor);
        
        const folio = String(row[columnMap['folio']] || '').trim();
        const prefijo = String(row[columnMap['prefijo']] || '').trim();
        
        const processedRow: DianData = {
            id: `dian-row-${processedData.length}`,
            TipoDeDocumento: String(row[columnMap['tipo de documento']] || ''),
            Folio: folio, Prefijo: prefijo,
            DocumentoDIAN: (prefijo ? prefijo + ' ' : '') + folio,
            FechaObj: convertExcelDate(row[columnMap[fechaKey]]),
            Fecha: formatDate(convertExcelDate(row[columnMap[fechaKey]])),
            NITEMISOR: nitEmisor, NombreEmisor: nombreEmisor,
            NITReceptor: nitReceptor, NombreReceptor: nombreReceptor,
            IVA: cleanNumber(row[columnMap['iva']]) * factor,
            Base: base * factor,
            Total: total * factor,
            Grupo: String(row[columnMap['grupo']] || ''),
        };
        
        for (const header of Object.keys(headerToPropertyMap)) {
            if (header in columnMap) {
                const propName = headerToPropertyMap[header];
                // @ts-ignore
                processedRow[propName] = cleanNumber(row[columnMap[header]]) * factor;
            }
        }
        processedData.push(processedRow);
    });

    if (processedData.length === 0) throw new Error("No se encontraron datos válidos en DIAN.");
    return { data: processedData, nits };
};

export const processValidation = (sheetData: any[][]): Map<string, ValidationData> => {
    const headers: (string|string[])[] = [['nit'], ['dv'], ['estado'], ['razon_social', 'primer_apellido']];
    const optional = ['razon_social', 'primer_apellido', 'segundo_apellido', 'primer_nombre', 'otros_nombres'];
    const { headerRowIndex, columnMap } = findHeaderRow(sheetData, headers, optional);

    const dataRows = sheetData.slice(headerRowIndex + 1);
    const processedMap = new Map<string, ValidationData>();

    const razonSocialKey = ['razon_social', 'razon social'].find(k => k in columnMap);
    const primerNombreKey = ['primer_nombre', 'primer nombre'].find(k => k in columnMap);
    const primerApellidoKey = ['primer_apellido', 'primer apellido'].find(k => k in columnMap);

    dataRows.forEach(row => {
        const nit = String(row[columnMap['nit']] || '').replace(/\D/g, '');
        if (!nit) return;
        
        let nombre = 'N/A';
        if (razonSocialKey && row[columnMap[razonSocialKey]]) {
            nombre = String(row[columnMap[razonSocialKey]] || '').trim();
        } else if (primerApellidoKey && row[columnMap[primerApellidoKey]]) {
            nombre = [
                row[columnMap[primerApellidoKey]] || '',
                row[columnMap['segundo_apellido']] || '',
                row[columnMap[primerNombreKey]] || '',
                row[columnMap['otros_nombres']] || ''
            ].join(' ').replace(/\s+/g, ' ').trim();
        }

        processedMap.set(nit, {
            nombreValidado: nombre,
            estado: String(row[columnMap['estado']] || 'N/A').trim(),
            dv: String(row[columnMap['dv']] || ''),
        });
    });

    if (processedMap.size === 0) throw new Error("No se encontraron NITs válidos en el archivo de validación.");
    return processedMap;
};

export const processRetencionBase = (sheetData: any[][]): { data: RetencionBaseData[] } => {
    const headers = [['codigo'], ['cuenta/documento'], ['fecha'], ['tercero'], ['valor'], ['%'], ['base']];
    const { headerRowIndex, columnMap } = findHeaderRow(sheetData, headers);

    const dataRows = sheetData.slice(headerRowIndex + 1);
    const processedData: RetencionBaseData[] = [];
    let currentCodigo = '';

    dataRows.forEach(row => {
        if (!Array.isArray(row) || row.every(cell => cell === null || cell === '')) return;

        const codigoVal = row[columnMap['codigo']];
        const docVal = row[columnMap['cuenta/documento']];

        if (codigoVal && normalizeText(String(codigoVal))) {
            const normalizedCodigoText = normalizeText(String(codigoVal));
            if (normalizedCodigoText.startsWith('total')) {
                return; // Skip total rows
            }
            currentCodigo = String(codigoVal).trim();
            // This is an account header row, don't process as a transaction if there's no doc
            if (!docVal) return;
        }

        const terceroVal = String(row[columnMap['tercero']] || '');
        if (!docVal && !terceroVal) return; // Skip if no document or tercero, likely a sub-header or empty
        
        if (!currentCodigo) {
            return; // Skip transactions without an account context
        }

        const porcentajeRaw = row[columnMap['%']];
        let porcentaje = 0;
        if (typeof porcentajeRaw === 'number') {
            porcentaje = porcentajeRaw; // Assume it's already a decimal (e.g., 0.1 for 10%)
        } else if (typeof porcentajeRaw === 'string') {
            const cleaned = porcentajeRaw.replace(/%/g, '').replace(/,/g, '.').trim();
            const num = parseFloat(cleaned);
            if (!isNaN(num)) {
                 // If the original value was > 1, it's likely a percentage like 10.00, so divide by 100
                porcentaje = num > 1 ? num / 100 : num;
            }
        }
        
        processedData.push({
            // FIX: Add a unique ID to each row for consistent handling in the UI.
            id: `retbase-row-${processedData.length}`,
            Codigo: currentCodigo,
            CuentaDocumento: String(docVal || '').trim(),
            Fecha: formatDate(convertExcelDate(row[columnMap['fecha']])),
            Tercero: terceroVal,
            Valor: cleanNumber(row[columnMap['valor']]),
            Porcentaje: porcentaje,
            Base: cleanNumber(row[columnMap['base']]),
        });
    });

    if (processedData.length === 0) throw new Error("No se encontraron datos válidos en el archivo de Retención con Bases.");
    return { data: processedData };
};