
import ExcelJS from 'exceljs';
import type { 
    AppState, 
    LiquidationCalculations, 
    IvaSectionResult, 
    IvaDescontableCategory,
    VatCategory,
    CompraVatCategory,
    AuxiliarData
} from '../types';
import { normalizeTextForSearch, isDevolucionesComprasAccountFuzzy } from '../views/iva/ivaUtils';

// --- STYLES PALETTE (MATCHING UI) ---
const PALETTE = {
    emerald: { text: 'FF047857', bg: 'FFECFDF5', border: 'FF10B981' }, // Emerald-700, Emerald-50, Emerald-500
    rose: { text: 'FFBE123C', bg: 'FFFFF1F2', border: 'FFF43F5E' },    // Rose-700, Rose-50, Rose-500
    slate: { header: 'FF1E293B', text: 'FF334155', bg: 'FFF8FAFC', border: 'FFE2E8F0' }, // Slate-800, Slate-700
    white: 'FFFFFFFF',
    brand: 'FF107C41' // Excel Green
};

const STYLES = {
    headerTitle: {
        font: { name: 'Calibri', size: 16, bold: true, color: { argb: PALETTE.slate.header } },
        alignment: { horizontal: 'center' as const }
    },
    sectionHeader: {
        font: { name: 'Calibri', size: 12, bold: true, color: { argb: PALETTE.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.slate.header } } as ExcelJS.Fill,
        alignment: { vertical: 'middle' as const, horizontal: 'left' as const }
    },
    tableHeader: {
        font: { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.slate.text } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } } as ExcelJS.Fill, // Slate-200
        border: { bottom: { style: 'thin', color: { argb: 'FF94A3B8' } } } as Partial<ExcelJS.Borders>
    },
    currency: '"$"#,##0.00;[Red]\-"$"#,##0.00',
    percent: '0.00%',
    greenText: { color: { argb: PALETTE.emerald.text } },
    redText: { color: { argb: PALETTE.rose.text } },
    bold: { bold: true }
};

interface ExcelGenerationParams {
    fileName: string;
    razonSocial: string;
    nit: string;
    periodo: string;
    liquidationCalculations: LiquidationCalculations;
    prorrateoPercentages: { gravado: number; otros: number };
    ingresosData: IvaSectionResult;
    files: AppState['files'];
    ivaDescontableClassification: Map<string, IvaDescontableCategory>;
    formulario300Data: any;
    selectedIvaAccounts: Map<string, boolean>;
    incomeAccountVatClassification: Map<string, VatCategory>;
    comprasAccountVatClassification?: Map<string, CompraVatCategory>;
}

export const generateProfessionalExcel = async (params: ExcelGenerationParams) => {
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'R3 Consultores';
    workbook.created = new Date();

    // --- SHEET 1: REPORTE EJECUTIVO (VISUAL REPLICA) ---
    const sheet = workbook.addWorksheet('Reporte Ejecutivo', {
        views: [{ showGridLines: false, zoomScale: 90 }]
    });

    // Column Setup
    sheet.columns = [
        { width: 3 },  // A: Spacer
        { width: 45 }, // B: Concepto
        { width: 15 }, // C: Tarifa/Tipo
        { width: 25 }, // D: Base / Valor 1
        { width: 25 }, // E: IVA / Valor 2
        { width: 25 }, // F: Extra / Check
    ];

    let currentRow = 2;

    // --- HEADER ---
    sheet.mergeCells(`B${currentRow}:F${currentRow}`);
    const titleCell = sheet.getCell(`B${currentRow}`);
    titleCell.value = "REPORTE DE VALIDACIÓN Y LIQUIDACIÓN DE IVA";
    titleCell.style = { font: { name: 'Calibri', size: 18, bold: true, color: { argb: PALETTE.brand } }, alignment: { horizontal: 'center' } };
    currentRow++;

    sheet.mergeCells(`B${currentRow}:F${currentRow}`);
    const subCell = sheet.getCell(`B${currentRow}`);
    subCell.value = `${params.razonSocial} | ${params.nit} | Periodo: ${params.periodo}`;
    subCell.style = { font: { size: 11, italic: true, color: { argb: 'FF64748B' } }, alignment: { horizontal: 'center' } };
    currentRow += 2;

    // --- CARD 1: AUDITORÍA DE INGRESOS ---
    addSectionHeader(sheet, currentRow, "1. AUDITORÍA DE INGRESOS VS. IVA");
    currentRow++;

    // Table Header
    const tHeadRow = sheet.getRow(currentRow);
    tHeadRow.values = [, 'Concepto', 'Tarifa', 'Base Gravable', 'IVA Asociado', 'Estado'];
    applyRowStyle(tHeadRow, STYLES.tableHeader);
    currentRow++;

    const ing = params.ingresosData;
    const data = params.formulario300Data;
    
    // Rows
    const incomeRows = [
        { label: 'Op. Gravadas 5%', base: data.r27, rate: 0.05, iva: data.r58 },
        { label: 'Op. Gravadas General', base: data.r28, rate: 0.19, iva: data.r59 },
        { label: 'A.I.U (Base Especial)', base: data.r29, rate: 0.19, iva: data.r60 },
        { label: 'Op. Exentas / Excluidas', base: (data.r35 || 0) + (data.r39 || 0) + (data.r40 || 0), rate: 0, iva: 0 },
    ];

    incomeRows.forEach(row => {
        if (row.base !== 0 || row.iva !== 0) {
            const r = sheet.getRow(currentRow);
            r.getCell(2).value = row.label;
            r.getCell(3).value = row.rate;
            r.getCell(3).numFmt = STYLES.percent;
            r.getCell(4).value = row.base;
            r.getCell(4).numFmt = STYLES.currency;
            r.getCell(5).value = row.iva;
            r.getCell(5).numFmt = STYLES.currency;
            
            // Check logic
            const calcIva = row.base * row.rate;
            const diff = Math.abs(calcIva - row.iva);
            const isOk = diff < 1000;
            r.getCell(6).value = isOk ? "OK" : "Revisar";
            r.getCell(6).font = isOk ? { color: { argb: PALETTE.emerald.text }, bold: true } : { color: { argb: PALETTE.rose.text }, bold: true };
            
            currentRow++;
        }
    });

    // Returns Row (Red style)
    const returnsBase = data.r42 || 0;
    const returnsIva = data.r79 || 0;
    if (returnsBase > 0 || returnsIva > 0) {
        const rRet = sheet.getRow(currentRow);
        rRet.values = [, '(-) Devoluciones en Ventas', '', -returnsBase, -returnsIva];
        rRet.font = { color: { argb: PALETTE.rose.text } };
        rRet.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.rose.bg } };
        rRet.getCell(4).numFmt = STYLES.currency;
        rRet.getCell(5).numFmt = STYLES.currency;
        currentRow++;
    }

    // Totals Row (Green style)
    const totalIngresos = incomeRows.reduce((s, r) => s + r.base, 0) - returnsBase;
    const totalIvaIng = incomeRows.reduce((s, r) => s + r.iva, 0) - returnsIva;

    const rTot = sheet.getRow(currentRow);
    rTot.values = [, 'INGRESOS NETOS', '', totalIngresos, totalIvaIng];
    rTot.font = { color: { argb: PALETTE.emerald.text }, bold: true };
    rTot.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.emerald.bg } };
    rTot.getCell(2).font = { bold: true, color: { argb: PALETTE.emerald.text } };
    rTot.getCell(4).numFmt = STYLES.currency;
    rTot.getCell(5).numFmt = STYLES.currency;
    
    // Border Top for total
    rTot.getCell(4).border = { top: { style: 'double', color: { argb: PALETTE.emerald.border } } };
    rTot.getCell(5).border = { top: { style: 'double', color: { argb: PALETTE.emerald.border } } };

    currentRow += 3;

    // --- CARD 2: DEPURACIÓN DEL IMPUESTO ---
    addSectionHeader(sheet, currentRow, "2. DEPURACIÓN DEL IMPUESTO A PAGAR");
    currentRow++;

    // Cascada Logic
    const lc = params.liquidationCalculations;
    const ivaGenBruto = lc.totalIvaGeneradoBrutoBp; // Pure generated from 240801/etc
    const ivaRecupDevCompras = data.r66 || 0;
    const totalGenerado = ivaGenBruto + ivaRecupDevCompras; // This matches F300 logic more closely if separated

    const descontableTotal = data.r81 || 0; // Includes returns in sales logic if any
    const saldoParcial = (data.r58 + data.r59 + data.r60 + data.r66) - data.r81; // Using Form data for consistency with Card 2
    
    const saldoFavorAnt = data.r84 || 0;
    const reteIva = data.r85 || 0;
    const saldoFinal = saldoParcial - saldoFavorAnt - reteIva;
    const esSaldoFavor = saldoFinal <= 0;

    // Rendering Cascade
    const addDepRow = (label: string, value: number, styleType: 'normal'|'red'|'green'|'bold'|'total' = 'normal') => {
        const r = sheet.getRow(currentRow);
        r.getCell(2).value = label;
        r.getCell(5).value = value;
        r.getCell(5).numFmt = STYLES.currency;
        
        if (styleType === 'red') r.font = { color: { argb: PALETTE.rose.text } };
        if (styleType === 'green') r.font = { color: { argb: PALETTE.emerald.text } };
        if (styleType === 'bold') {
            r.font = { bold: true }; 
            r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate-100
        }
        if (styleType === 'total') {
            r.font = { bold: true, size: 12, color: { argb: value <= 0 ? PALETTE.emerald.text : PALETTE.rose.text } };
            r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: value <= 0 ? PALETTE.emerald.bg : PALETTE.rose.bg } };
            r.getCell(2).border = { top: { style: 'medium' }, bottom: { style: 'medium' } };
            r.getCell(5).border = { top: { style: 'medium' }, bottom: { style: 'medium' } };
        }
        currentRow++;
    };

    addDepRow("Total IVA Generado Bruto", ivaGenBruto);
    if (ivaRecupDevCompras > 0) addDepRow("(+) IVA Recup. en Dev. Compras", ivaRecupDevCompras, 'red');
    addDepRow("(-) IVA Descontable Total (Neto)", descontableTotal, 'green');
    addDepRow("(=) Saldo Parcial", saldoParcial, 'bold');
    if (saldoFavorAnt > 0) addDepRow("(-) Saldo a Favor Periodo Anterior", saldoFavorAnt, 'green');
    if (reteIva > 0) addDepRow("(-) Retenciones por IVA (ReteIVA)", reteIva, 'green');
    currentRow++; // Gap
    addDepRow(esSaldoFavor ? "(=) SALDO A FAVOR NETO" : "(=) SALDO A PAGAR NETO", Math.abs(saldoFinal), 'total');

    currentRow += 3;

    // --- CARD 3: SIMULACIÓN DE PRORRATEO (DETALLE) ---
    addSectionHeader(sheet, currentRow, "3. DETALLE DE PRORRATEO DE IVA (SIMULACIÓN)");
    currentRow++;

    // A. Resumen Prorrateo
    const pDed = params.prorrateoPercentages.gravado / 100;
    const pGas = params.prorrateoPercentages.otros / 100;
    
    // We need to recalculate the simulation totals to match the view exactly
    // Using logic from SimulacionProrrateo.tsx
    let baseProrrateo = 0; // Transitorio (240803) usually
    // Assuming default view "Transitorio" as it is common.
    // However, to be precise, let's look at what accounts are actually Transitorio
    let totalTransitorioBase = 0;
    
    const detailedRows: any[] = [];
    
    if (params.files.iva_auxiliar) {
        params.files.iva_auxiliar.forEach(row => {
            if (!row.Cuenta.startsWith('2408') || !params.selectedIvaAccounts.get(row.Cuenta)) return;
            if (params.ivaDescontableClassification.get(row.Cuenta) === 'no_tener_en_cuenta') return;
            
            // Exclude Returns logic
            const normalized = normalizeTextForSearch(row.Cuenta);
            if (normalized.includes('devoluciones en ventas')) return;
            if (isDevolucionesComprasAccountFuzzy(row.Cuenta)) return;

            if (row.Debitos > 0) {
                const code = row.Cuenta.split(' ')[0];
                const type = code.startsWith('240802') ? 'Directo' : (code.startsWith('240803') ? 'Transitorio' : 'Otro');
                
                // If direct, 100% deducible. If Transitorio, apply P%.
                const isProratable = type === 'Transitorio'; 
                const deducible = isProratable ? row.Debitos * pDed : row.Debitos;
                const gasto = isProratable ? row.Debitos * pGas : 0;
                
                detailedRows.push({
                    cuenta: row.Cuenta,
                    nombre: row.Cuenta.substring(code.length).trim(),
                    tipo: type,
                    base: row.Debitos,
                    deducible,
                    gasto
                });

                if (isProratable) totalTransitorioBase += row.Debitos;
            }
        });
    }

    // Sort by base desc
    detailedRows.sort((a, b) => b.base - a.base);

    // Summary Header
    sheet.getCell(`B${currentRow}`).value = `Coeficiente Aplicado: ${(pDed * 100).toFixed(2)}%`;
    sheet.getCell(`B${currentRow}`).font = { italic: true, color: { argb: 'FF64748B' } };
    currentRow++;

    // Detail Table Header
    const detHead = sheet.getRow(currentRow);
    detHead.values = [, 'Cuenta / Nombre', 'Tipo', 'Base IVA', 'A Declaración', 'Al Gasto'];
    detHead.eachCell((cell, num) => {
        if (num > 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.slate.header } };
            cell.font = { color: { argb: PALETTE.white }, bold: true };
            cell.alignment = { horizontal: 'center' };
        }
    });
    // Specific colors for last cols headers
    detHead.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }; // Dark Green
    detHead.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9F1239' } }; // Dark Red

    currentRow++;

    // Detailed Rows
    detailedRows.forEach(row => {
        const r = sheet.getRow(currentRow);
        r.getCell(2).value = row.cuenta; // Full name
        r.getCell(3).value = row.tipo;
        r.getCell(3).alignment = { horizontal: 'center' };
        r.getCell(4).value = row.base;
        r.getCell(4).numFmt = STYLES.currency;
        
        r.getCell(5).value = row.deducible;
        r.getCell(5).numFmt = STYLES.currency;
        r.getCell(5).font = { color: { argb: PALETTE.emerald.text }, bold: true };
        
        r.getCell(6).value = row.gasto;
        r.getCell(6).numFmt = STYLES.currency;
        r.getCell(6).font = { color: { argb: PALETTE.rose.text } }; // Red if > 0

        if (row.gasto === 0) r.getCell(6).font = { color: { argb: 'FFCBD5E1' } }; // Light gray if 0

        currentRow++;
    });

    // Total Detail
    const sumBase = detailedRows.reduce((s, r) => s + r.base, 0);
    const sumDed = detailedRows.reduce((s, r) => s + r.deducible, 0);
    const sumGas = detailedRows.reduce((s, r) => s + r.gasto, 0);

    const rSum = sheet.getRow(currentRow);
    rSum.values = [, 'TOTALES', '', sumBase, sumDed, sumGas];
    rSum.font = { bold: true };
    rSum.getCell(4).numFmt = STYLES.currency;
    rSum.getCell(5).numFmt = STYLES.currency;
    rSum.getCell(6).numFmt = STYLES.currency;
    rSum.getCell(4).border = { top: { style: 'double' } };
    rSum.getCell(5).border = { top: { style: 'double' } };
    rSum.getCell(6).border = { top: { style: 'double' } };

    // Export
    const buffer = await workbook.xlsx.writeBuffer();
    saveExcelFile(buffer, `${params.fileName}.xlsx`);
};

// --- HELPERS ---

function addSectionHeader(sheet: ExcelJS.Worksheet, row: number, text: string) {
    sheet.mergeCells(`B${row}:F${row}`);
    const cell = sheet.getCell(`B${row}`);
    cell.value = text;
    cell.fill = STYLES.sectionHeader.fill;
    cell.font = STYLES.sectionHeader.font;
    cell.alignment = STYLES.sectionHeader.alignment;
    // Add border
    cell.border = { top: { style: 'medium', color: { argb: PALETTE.brand } } };
}

function applyRowStyle(row: ExcelJS.Row, style: any) {
    row.eachCell((cell, colNumber) => {
        if (colNumber > 1) { // Skip spacer col A
            if (style.font) cell.font = style.font;
            if (style.fill) cell.fill = style.fill;
            if (style.border) cell.border = style.border;
            if (style.alignment) cell.alignment = style.alignment;
        }
    });
}

const saveExcelFile = (buffer: ArrayBuffer, fileName: string) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
};
