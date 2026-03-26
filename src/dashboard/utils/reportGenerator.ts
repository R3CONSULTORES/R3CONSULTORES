
import type { AppState, Diferencia, RetencionFinding, AnalisisCuenta, ValidationResult, GroupedDiscrepancy, DocumentoDiscrepancia, DocumentoDiscrepanciaClasificacion, CoherenciaFinding } from '@/dashboard/types';

// Declare globals from CDN scripts for jsPDF, JSZip, FileSaver, and XLSX
declare const jspdf: any;
declare const JSZip: any;
declare const saveAs: any;
import * as XLSX from 'xlsx';

interface AiAnalysisResult {
    resumenEjecutivo?: string;
    analisisIngresos?: string;
    analisisIvaGenerado?: string;
    analisisCompras?: string;
    analisisIvaDescontable?: string;
    analisisRetenciones?: string;
    analisisTerceros?: string;
    conclusion?: string;
}


const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) return '$ 0';
    const roundedValue = Math.round(value);
    const formatted = new Intl.NumberFormat('es-CO', {
        style: 'decimal',
        maximumFractionDigits: 0,
    }).format(roundedValue);
    return `$ ${formatted}`;
};

const waitForLibrary = (name: string, timeout = 5000): Promise<any> => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if ((window as any)[name]) {
                clearInterval(interval);
                resolve((window as any)[name]);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                reject(new Error(`La librería '${name}' no se cargó en ${timeout / 1000} segundos.`));
            }
        }, 100);
    });
};

const getFormattedDateForFilename = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Clean text for PDF (remove markdown)
const cleanText = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '-')
        .replace(/###/g, '')
        .replace(/##/g, '')
        .replace(/`/g, '');
};

export const generatePdfReport = async (appState: AppState, includedReports: Record<string, boolean>, aiAnalysis?: AiAnalysisResult) => {
    const jspdfLib = await waitForLibrary('jspdf');
    const { jsPDF } = jspdfLib;

    const { resumenDiferencias, retencionesResult, validationResult, coherenciaContableResult, razonSocial } = appState;

    const doc = new jsPDF();
    let cursorY = 25; // Start lower
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 15;
    const contentWidth = pageWidth - (marginX * 2);

    // --- Helpers ---

    const checkPageBreak = (heightNeeded: number) => {
        if (cursorY + heightNeeded > 275) {
            doc.addPage();
            cursorY = 25;
        }
    };

    const printTitle = (text: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(text.toUpperCase(), pageWidth / 2, cursorY, { align: 'center' });
        cursorY += 8;
    };

    const printSubtitle = (text: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text(text.toUpperCase(), pageWidth / 2, cursorY, { align: 'center' });
        cursorY += 15;
    };

    const printSectionHeader = (text: string) => {
        checkPageBreak(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(text, marginX, cursorY);
        cursorY += 8;
    };

    const printParagraph = (text: string) => {
        if (!text) return;
        checkPageBreak(20); // Approx check
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        // Conditional Color for Risk Warnings
        if (/Riesgo Alto|Sanción|Error Crítico|Rechazo/i.test(text)) {
            doc.setTextColor(220, 38, 38); // Red
        } else {
            doc.setTextColor(31, 41, 55); // Dark Grey
        }

        const clean = cleanText(text);
        const lines = doc.splitTextToSize(clean, contentWidth);
        doc.text(lines, marginX, cursorY, { align: 'justify', maxWidth: contentWidth });
        const dim = doc.getTextDimensions(lines);
        cursorY += dim.h + 6;
        
        // Reset color
        doc.setTextColor(0,0,0); 
    };

    const commonTableStyles = {
        theme: 'striped',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: [31, 41, 55] },
        headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: marginX, right: marginX }
    };

    // --- Report Content ---

    // Header
    printTitle("INFORME DE HALLAZGOS - CONCILIACIÓN FISCAL");
    printSubtitle(`EMPRESA: ${razonSocial || 'N/A'}  |  FECHA: ${new Date().toLocaleDateString()}`);

    // Intro
    printSectionHeader("INTRODUCCIÓN");
    if (aiAnalysis?.resumenEjecutivo) {
        printParagraph(aiAnalysis.resumenEjecutivo);
    } else {
        printParagraph("El presente informe detalla los hallazgos encontrados durante la conciliación entre los registros contables y la información reportada por la DIAN, enfocándose en riesgos de sanción y errores de calidad del dato.");
    }

    // Helper for Differences Tables (Contable)
    const printDiferenciaTable = (title: string, data: Diferencia[], analysis?: string) => {
        printSectionHeader(title);
        if (analysis) printParagraph(analysis);

        if (!data || data.length === 0) {
            printParagraph("No se encontraron diferencias significativas en esta sección.");
            return;
        }

        const body = data.map(row => [
            row.nit,
            row.nombre.substring(0, 40),
            formatCurrency(row.valorWO),
            formatCurrency(row.valorDIAN),
            formatCurrency(row.diferencia)
        ]);

        // Add Total Row
        const totalWO = data.reduce((s, i) => s + i.valorWO, 0);
        const totalDIAN = data.reduce((s, i) => s + i.valorDIAN, 0);
        const totalDif = data.reduce((s, i) => s + i.diferencia, 0);
        
        // Add empty row for spacing if needed, then Total
        body.push(['', 'TOTAL', formatCurrency(totalWO), formatCurrency(totalDIAN), formatCurrency(totalDif)]);

        doc.autoTable({
            startY: cursorY,
            head: [['NIT', 'Nombre', 'Valor WO', 'Valor DIAN', 'Diferencia']],
            body: body,
            ...commonTableStyles,
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { halign: 'right', cellWidth: 30 },
                3: { halign: 'right', cellWidth: 30 },
                4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
            },
            didParseCell: (data: any) => {
                // Logic for Difference Column (Index 4)
                if (data.section === 'body' && data.column.index === 4) {
                    const raw = data.cell.raw.toString();
                    if (raw.includes('-') || raw.includes('(')) {
                        data.cell.styles.textColor = [220, 38, 38]; // Red
                    }
                }
                // Bold Total Row
                if (data.section === 'body' && data.row.index === body.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [229, 231, 235]; // Gray 200
                }
            },
            didDrawPage: (d: any) => cursorY = d.cursor.y + 10
        });
        // Update cursor after table if not paginated inside autoTable (jspdf-autotable handles page breaks internally, but we need to sync our cursor)
        cursorY = doc.lastAutoTable.finalY + 10; 
    };

    // --- 1. MÓDULO CONTABLE ---
    if (includedReports.contable && resumenDiferencias) {
        printDiferenciaTable("1.0 HALLAZGOS EN INGRESOS", resumenDiferencias.ingresos, aiAnalysis?.analisisIngresos);
        printDiferenciaTable("2.0 HALLAZGOS EN IVA GENERADO", resumenDiferencias.ivaGen, aiAnalysis?.analisisIvaGenerado);
        printDiferenciaTable("3.0 HALLAZGOS EN COMPRAS", resumenDiferencias.compras, aiAnalysis?.analisisCompras);
        printDiferenciaTable("4.0 HALLAZGOS EN IVA DESCONTABLE", resumenDiferencias.ivaDesc, aiAnalysis?.analisisIvaDescontable);
    }

    // --- 2. MÓDULO RETENCIONES ---
    if (includedReports.retenciones && retencionesResult) {
        printSectionHeader("5.0 AUDITORÍA DE RETENCIONES");
        if (aiAnalysis?.analisisRetenciones) printParagraph(aiAnalysis.analisisRetenciones);

        const activeFindings = retencionesResult.filter(r => !r.omitted);
        
        if (activeFindings.length === 0) {
            printParagraph("No se detectaron inconsistencias en la auditoría de retenciones.");
        } else {
            const body = activeFindings.map(f => [
                f.docNum,
                f.proveedor.substring(0, 35),
                f.inconsistenciaDetectada, // Use short text here ideally
                formatCurrency(f.base),
                formatCurrency(f.retencionAplicada)
            ]);

            doc.autoTable({
                startY: cursorY,
                head: [['Documento', 'Proveedor', 'Inconsistencia', 'Base', 'Ret. Aplicada']],
                body: body,
                ...commonTableStyles,
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 45 },
                    2: { cellWidth: 'auto' },
                    3: { halign: 'right', cellWidth: 25 },
                    4: { halign: 'right', cellWidth: 25 }
                },
                didParseCell: (data: any) => {
                    // Inconsistencia Column (Index 2) - Check for keywords
                    if (data.section === 'body' && data.column.index === 2) {
                        const text = data.cell.raw.toString().toLowerCase();
                        if (text.includes('omitida') || text.includes('indebida') || text.includes('incorrecto') || text.includes('signo')) {
                            data.cell.styles.textColor = [220, 38, 38];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                },
                didDrawPage: (d: any) => cursorY = d.cursor.y + 10
            });
            cursorY = doc.lastAutoTable.finalY + 10;
        }
    }

    // --- 3. MÓDULO COHERENCIA (NUEVO) ---
    if (includedReports.coherencia && coherenciaContableResult) {
        printSectionHeader("6.0 AUDITORÍA DE COHERENCIA Y PARTIDA DOBLE");
        
        if (coherenciaContableResult.length === 0) {
            printParagraph("No se encontraron registros con incoherencias de naturaleza contable o descuadres.");
        } else {
            const body = coherenciaContableResult.flatMap(finding => {
                const isDescuadre = finding.inconsistencia.toLowerCase().includes('partida doble');
                
                if (isDescuadre) {
                    // Document level issue
                    return [{
                        doc: finding.docNum,
                        cuenta: 'TOTAL DOC',
                        glosa: 'DESCUADRE CONTABLE',
                        debito: formatCurrency(finding.totalDebitos || 0),
                        credito: formatCurrency(finding.totalCreditos || 0),
                        hallazgo: finding.inconsistencia,
                        type: 'descuadre'
                    }];
                } else {
                    // Line level issues (Nature)
                    // If finding has lineasInconsistentes, map them. Otherwise summary.
                    if (finding.lineasInconsistentes && finding.lineasInconsistentes.length > 0) {
                        return finding.lineasInconsistentes.map(idx => {
                            const mov = finding.movimientos[idx];
                            return {
                                doc: finding.docNum,
                                cuenta: mov.Cuenta,
                                glosa: mov.Nota.substring(0, 35),
                                debito: formatCurrency(mov.Debitos),
                                credito: formatCurrency(mov.Creditos),
                                hallazgo: finding.inconsistencia,
                                type: finding.inconsistencia.toLowerCase().includes('advertencia') ? 'advertencia' : 'error'
                            };
                        });
                    }
                    // Fallback
                    return [{
                        doc: finding.docNum,
                        cuenta: 'VARIAS',
                        glosa: 'ERROR GENERAL',
                        debito: '-',
                        credito: '-',
                        hallazgo: finding.inconsistencia,
                        type: 'error'
                    }];
                }
            });

            doc.autoTable({
                startY: cursorY,
                head: [['Documento', 'Cuenta', 'Concepto/Glosa', 'Débito', 'Crédito', 'Hallazgo']],
                body: body.map(r => [r.doc, r.cuenta, r.glosa, r.debito, r.credito, r.hallazgo]),
                ...commonTableStyles,
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 'auto' },
                    3: { halign: 'right', cellWidth: 20 },
                    4: { halign: 'right', cellWidth: 20 },
                    5: { cellWidth: 40 }
                },
                didParseCell: (data: any) => {
                    if (data.section === 'body') {
                        const rowType = body[data.row.index].type;
                        
                        // Rule: Descuadres -> Red Bold Row
                        if (rowType === 'descuadre') {
                            data.cell.styles.textColor = [220, 38, 38]; // Red
                            data.cell.styles.fontStyle = 'bold';
                        }
                        // Rule: Error Naturaleza -> Red Text in Hallazgo
                        else if (rowType === 'error' && data.column.index === 5) {
                            data.cell.styles.textColor = [220, 38, 38]; // Red
                        }
                        // Rule: Advertencia -> Orange/Amber Text in Hallazgo
                        else if (rowType === 'advertencia' && data.column.index === 5) {
                            data.cell.styles.textColor = [217, 119, 6]; // Amber-600
                        }
                    }
                },
                didDrawPage: (d: any) => cursorY = d.cursor.y + 10
            });
            cursorY = doc.lastAutoTable.finalY + 10;
        }
    }

    // --- 4. VALIDACIÓN TERCEROS ---
    if (includedReports.validacion && validationResult) {
        printSectionHeader("7.0 VALIDACIÓN DE TERCEROS (DIAN)");
        if (aiAnalysis?.analisisTerceros) printParagraph(aiAnalysis.analisisTerceros);

        const inactivos = validationResult.inactivos;
        
        if (inactivos.length > 0) {
            checkPageBreak(30);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(`NITs No Activos/Registrados (${inactivos.length})`, marginX, cursorY);
            cursorY += 6;

            const body = inactivos.map(i => [i.nit, i.nombreWO, i.data.estado]);
            doc.autoTable({
                startY: cursorY,
                head: [['NIT', 'Nombre (WO)', 'Estado DIAN']],
                body: body,
                ...commonTableStyles,
                didParseCell: (data: any) => {
                    if (data.section === 'body' && data.column.index === 2) {
                        data.cell.styles.textColor = [220, 38, 38];
                    }
                },
                didDrawPage: (d: any) => cursorY = d.cursor.y + 10
            });
            cursorY = doc.lastAutoTable.finalY + 10;
        } else {
            printParagraph("Todos los terceros validados se encuentran Activos en la DIAN.");
        }
    }

    // --- 5. CONCILIACIÓN FISCAL (NUEVO) ---
    if (includedReports.contable && resumenDiferencias) {
        printSectionHeader("8.0 CONCILIACIÓN DE INGRESOS Y COSTOS (CRUCE DIAN)");
        
        // Combine Ingresos and Compras for general reconciliation overview
        const combinedData = [...resumenDiferencias.ingresos, ...resumenDiferencias.compras]
            .sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia));

        if (combinedData.length === 0) {
            printParagraph("No se encontraron diferencias reportables entre Contabilidad y DIAN.");
        } else {
            const body = combinedData.slice(0, 50).map(row => [
                row.nit,
                row.nombre.substring(0, 35),
                formatCurrency(row.valorWO),
                formatCurrency(row.valorDIAN),
                formatCurrency(row.diferencia)
            ]);

            doc.autoTable({
                startY: cursorY,
                head: [['NIT', 'Tercero', 'Valor Contable (WO)', 'Valor Reportado (DIAN)', 'Diferencia']],
                body: body,
                ...commonTableStyles,
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 'auto' },
                    2: { halign: 'right', cellWidth: 30 },
                    3: { halign: 'right', cellWidth: 30 },
                    4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
                },
                didParseCell: (data: any) => {
                    // Diferencia Negative -> Red
                    if (data.section === 'body' && data.column.index === 4) {
                        const valStr = data.cell.raw.toString();
                        if (valStr.includes('-') || valStr.includes('(')) {
                            data.cell.styles.textColor = [220, 38, 38];
                        }
                    }
                },
                didDrawPage: (d: any) => cursorY = d.cursor.y + 10
            });
            cursorY = doc.lastAutoTable.finalY + 10;
            
            if (combinedData.length > 50) {
                printParagraph(`Nota: Se muestran los 50 terceros con mayor diferencia. Total terceros con discrepancia: ${combinedData.length}.`);
            }
        }
    }

    // CONCLUSION
    printSectionHeader("CONCLUSIÓN Y RECOMENDACIONES");
    const conclusion = aiAnalysis?.conclusion || "Se recomienda proceder con la corrección de los hallazgos identificados para mitigar riesgos de sanción y asegurar la integridad de la información tributaria.";
    printParagraph(conclusion);

    // SIGNATURE
    checkPageBreak(40);
    cursorY += 20;
    doc.line(marginX, cursorY, marginX + 60, cursorY); // Line
    cursorY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text("Firma Auditor / Revisor", marginX, cursorY);
    cursorY += 5;
    doc.setFont('helvetica', 'normal');
    doc.text("TP:", marginX, cursorY);

    const clientNameForFile = razonSocial || 'Cliente';
    const nombreArchivo = `INFORME EJECUTIVO ${clientNameForFile} ${getFormattedDateForFilename()}.pdf`;
    doc.save(nombreArchivo);
};

export const generateZipArchive = async (appState: AppState) => {
    const { razonSocial, files, fileUploadStatus } = appState;

    await Promise.all([
        waitForLibrary('JSZip'),
        waitForLibrary('saveAs')
    ]);

    const zip = new JSZip();
    const folderMapping: { [key: string]: (keyof AppState['files'])[] } = {
        'revision_contable': ['auxiliar', 'compras', 'ventas', 'dian'],
        'validacion': ['validacion'],
        'retenciones': ['retencion_auxiliar', 'retencion_compras', 'retencion_ventas', 'retencion_base'],
        'iva': ['iva_auxiliar', 'iva_dian'],
    };

    for (const folderName in folderMapping) {
        const fileTypes = folderMapping[folderName];
        const folder = zip.folder(folderName);
        for (const fileType of fileTypes) {
            let dataToSheet = files[fileType];
            if (!dataToSheet) continue;
            let dataArray: any[] = (dataToSheet instanceof Map) 
                ? Array.from(dataToSheet.entries()).map(([key, value]) => ({ nit_buscado: key, ...value }))
                : (Array.isArray(dataToSheet) ? dataToSheet : []);

            if (dataArray.length === 0) continue;
            const ws = XLSX.utils.json_to_sheet(dataArray);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Datos');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            if (folder) folder.file(fileUploadStatus[fileType].name || `${fileType}.xlsx`, wbout);
        }
    }
    const clientNameForFile = razonSocial || 'Cliente';
    const zipName = `ANEXOS ${clientNameForFile} ${getFormattedDateForFilename()}.zip`;
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, zipName);
};
