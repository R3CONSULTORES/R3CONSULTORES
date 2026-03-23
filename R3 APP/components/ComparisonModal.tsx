import React, { useMemo } from 'react';
import type { ComparisonResult, AnyFinding, Diferencia, RetencionFinding, CoherenciaFinding, DocumentoDiscrepancia, DocumentoDiscrepanciaClasificacion } from '../types';
import { XMarkIcon, CheckCircleIcon } from './Icons';

// Declare jsPDF from CDN script
declare const jspdf: any;

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
}).format(value);

const ComparisonTable: React.FC<{
    title: string;
    items: any[];
    columns: { header: string; accessor: (item: any) => React.ReactNode; className?: string }[];
    colorClass: string;
}> = ({ title, items, columns, colorClass }) => {
    if (items.length === 0) return null;

    return (
        <div>
            <h4 className={`text-md font-semibold mb-1 p-2 rounded-t-md ${colorClass}`}>{title} ({items.length})</h4>
            <div className="max-h-60 overflow-y-auto border border-t-0 rounded-b-md shadow-sm">
                <table className="min-w-full text-xs">
                    <thead className="bg-slate-100 sticky top-0">
                        <tr>
                            {columns.map((col, i) => (
                                <th key={i} className={`py-2 px-3 text-left font-medium text-slate-600 ${col.className || ''}`}>{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {items.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                                {columns.map((col, i) => (
                                    <td key={i} className={`py-1 px-3 text-slate-700 ${col.className || ''}`}>{col.accessor(item)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Type Guards
const isDiferencia = (f: AnyFinding): f is Diferencia => 'valorWO' in f && 'valorDIAN' in f && 'nit' in f && !('docNum' in f);
const isRetencionFinding = (f: AnyFinding): f is RetencionFinding => 'tipoHallazgo' in f;
const isCoherenciaFinding = (f: AnyFinding): f is CoherenciaFinding => 'inconsistencia' in f && 'accionSugerida' in f;
const isIvaClasificacionFinding = (f: AnyFinding): f is DocumentoDiscrepanciaClasificacion => 'baseGravadaWo' in f;
const isIvaDiscrepanciaFinding = (f: AnyFinding): f is DocumentoDiscrepancia => 'valorWo' in f && 'valorDian' in f && 'docNum' in f;

interface ComparisonModalProps {
    result: ComparisonResult;
    onClose: () => void;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ result, onClose }) => {

    const categorizedResults = useMemo(() => {
        const { corregidos, nuevos, modificados, identicos } = result;
        
        const filter = (arr: { categoria: string; hallazgo: AnyFinding }[], typeGuard: (f: AnyFinding) => boolean) => arr.filter(i => typeGuard(i.hallazgo));
        const filterModificados = (arr: { categoria: string; hallazgoAntes: AnyFinding, hallazgoDespues: AnyFinding }[], typeGuard: (f: AnyFinding) => boolean) => arr.filter(i => typeGuard(i.hallazgoAntes));

        return {
            contable: {
                corregidos: filter(corregidos, isDiferencia),
                nuevos: filter(nuevos, isDiferencia),
                modificados: filterModificados(modificados, isDiferencia),
                identicos: filter(identicos, isDiferencia),
            },
            retenciones: {
                corregidos: filter(corregidos, isRetencionFinding),
                nuevos: filter(nuevos, isRetencionFinding),
                modificados: filterModificados(modificados, isRetencionFinding),
                identicos: filter(identicos, isRetencionFinding),
            },
            coherencia: {
                corregidos: filter(corregidos, isCoherenciaFinding),
                nuevos: filter(nuevos, isCoherenciaFinding),
                modificados: filterModificados(modificados, isCoherenciaFinding),
                identicos: filter(identicos, isCoherenciaFinding),
            },
            ivaDiscrepancia: {
                corregidos: filter(corregidos, isIvaDiscrepanciaFinding),
                nuevos: filter(nuevos, isIvaDiscrepanciaFinding),
                modificados: filterModificados(modificados, isIvaDiscrepanciaFinding),
                identicos: filter(identicos, isIvaDiscrepanciaFinding),
            },
            ivaClasificacion: {
                corregidos: filter(corregidos, isIvaClasificacionFinding),
                nuevos: filter(nuevos, isIvaClasificacionFinding),
                modificados: filterModificados(modificados, isIvaClasificacionFinding),
                identicos: filter(identicos, isIvaClasificacionFinding),
            }
        };
    }, [result]);

    const noFindingsAtAll = Object.values(result).every((arr: any[]) => arr.length === 0);

    const handleDownloadPdf = () => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        let cursorY = 20;
    
        doc.setFontSize(18);
        doc.text("Informe Comparativo de Hallazgos Pendientes", 105, cursorY, { align: 'center' });
        cursorY += 15;
    
        const checkPageBreak = (height: number) => {
            if (cursorY + height > 280) {
                doc.addPage();
                cursorY = 20;
            }
        };

        const addTable = (title: string, head: string[][], body: any[][], columnStyles: any = {}, color = '#000000') => {
            if (body.length > 0) {
                checkPageBreak(20);
                doc.setFontSize(13);
                doc.setTextColor(color);
                doc.text(title, 15, cursorY);
                cursorY += 8;

                doc.autoTable({
                    startY: cursorY,
                    head: head,
                    body: body,
                    theme: 'grid',
                    headStyles: { fillColor: '#1e293b', fontSize: 7, cellPadding: 1 },
                    styles: { fontSize: 6, cellPadding: 1 },
                    columnStyles,
                    didDrawPage: (data: any) => { cursorY = data.cursor.y; }
                });
                cursorY = doc.autoTable.previous.finalY + 10;
            }
        };
        
        const allNew = [...categorizedResults.contable.nuevos, ...categorizedResults.retenciones.nuevos, ...categorizedResults.coherencia.nuevos, ...categorizedResults.ivaDiscrepancia.nuevos, ...categorizedResults.ivaClasificacion.nuevos];
        const newBody = allNew.map(i => {
            if (isDiferencia(i.hallazgo)) return [i.categoria, i.hallazgo.nit, i.hallazgo.nombre, formatCurrency(i.hallazgo.diferencia)];
            if (isRetencionFinding(i.hallazgo)) return [i.categoria, i.hallazgo.nit, i.hallazgo.proveedor, i.hallazgo.inconsistenciaDetectada];
            if (isCoherenciaFinding(i.hallazgo)) return [i.categoria, i.hallazgo.docNum, i.hallazgo.tercero, i.hallazgo.inconsistencia];
            if (isIvaDiscrepanciaFinding(i.hallazgo)) return [i.categoria, i.hallazgo.nit, i.hallazgo.docNum, i.hallazgo.observacion];
            if (isIvaClasificacionFinding(i.hallazgo)) return [i.categoria, i.hallazgo.nit, i.hallazgo.docNum, i.hallazgo.observacion];
            return [];
        });
        addTable(`Nuevos Hallazgos (${newBody.length})`, [['Categoría', 'ID 1', 'ID 2', 'Detalle']], newBody, { 0: { cellWidth: 35 }, 1: { cellWidth: 25 }, 2: { cellWidth: 40 }, 3: { cellWidth: 'auto'} }, '#D32F2F');

        const allModified = [...categorizedResults.contable.modificados, ...categorizedResults.retenciones.modificados]; // Add other types if needed
        const modifiedBody = allModified.map(i => {
            if(isDiferencia(i.hallazgoAntes)) {
                return [i.categoria, i.hallazgoAntes.nit, formatCurrency(i.hallazgoAntes.diferencia), formatCurrency((i.hallazgoDespues as Diferencia).diferencia)];
            }
             if(isRetencionFinding(i.hallazgoAntes)) {
                return [i.categoria, i.hallazgoAntes.docNum, `${formatCurrency(i.hallazgoAntes.base)} / ${formatCurrency(i.hallazgoAntes.retencionAplicada)}`, `${formatCurrency((i.hallazgoDespues as RetencionFinding).base)} / ${formatCurrency((i.hallazgoDespues as RetencionFinding).retencionAplicada)}` ];
            }
            return [];
        });
        addTable(`Hallazgos Modificados (${modifiedBody.length})`, [['Categoría', 'ID', 'Valor Anterior', 'Valor Nuevo']], modifiedBody, { 0: { cellWidth: 35 }}, '#F57C00');
        
        const allIdentical = [...categorizedResults.contable.identicos, ...categorizedResults.retenciones.identicos, ...categorizedResults.coherencia.identicos, ...categorizedResults.ivaDiscrepancia.identicos, ...categorizedResults.ivaClasificacion.identicos];
        const identicalBody = allIdentical.map(i => {
            if (isDiferencia(i.hallazgo)) return [i.categoria, i.hallazgo.nit, i.hallazgo.nombre, formatCurrency(i.hallazgo.diferencia)];
            if (isRetencionFinding(i.hallazgo)) return [i.categoria, i.hallazgo.nit, i.hallazgo.proveedor, i.hallazgo.inconsistenciaDetectada];
            if (isCoherenciaFinding(i.hallazgo)) return [i.categoria, i.hallazgo.docNum, i.hallazgo.tercero, i.hallazgo.inconsistencia];
            if (isIvaDiscrepanciaFinding(i.hallazgo)) return [i.categoria, i.hallazgo.nit, i.hallazgo.docNum, i.hallazgo.observacion];
            if (isIvaClasificacionFinding(i.hallazgo)) return [i.categoria, i.hallazgo.nit, i.hallazgo.docNum, i.hallazgo.observacion];
            return [];
        });
        addTable(`Hallazgos Sin Cambios (Pendientes) (${identicalBody.length})`, [['Categoría', 'ID 1', 'ID 2', 'Detalle']], identicalBody, { 0: { cellWidth: 35 }, 1: { cellWidth: 25 }, 2: { cellWidth: 40 }, 3: { cellWidth: 'auto'} }, '#1976D2');
        
        doc.save(`Comparacion_Hallazgos_Pendientes.pdf`);
    };
    
    const renderSection = (
        title: string, 
        data: { corregidos: any[], nuevos: any[], modificados: any[], identicos: any[] },
        columns: {
            base: { header: string; accessor: (item: any) => React.ReactNode; className?: string }[],
            modificados: { header: string; accessor: (item: any) => React.ReactNode; className?: string }[]
        }
    ) => {
        const hasData = data.corregidos.length + data.nuevos.length + data.modificados.length + data.identicos.length > 0;
        if (!hasData) return null;
        
        return (
            <div>
                <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mb-4">{title}</h3>
                <div className="space-y-4">
                    <ComparisonTable title="Corregidos" items={data.corregidos} columns={columns.base} colorClass="bg-green-100 text-green-800" />
                    <ComparisonTable title="Nuevos" items={data.nuevos} columns={columns.base} colorClass="bg-red-100 text-red-800" />
                    <ComparisonTable title="Modificados" items={data.modificados} columns={columns.modificados} colorClass="bg-amber-100 text-amber-800" />
                    <ComparisonTable title="Sin Cambios (Pendientes)" items={data.identicos} columns={columns.base} colorClass="bg-blue-100 text-blue-800" />
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800">Resultado de la Comparación</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100"><XMarkIcon /></button>
                </header>
                <main className="p-6 overflow-y-auto space-y-8">
                    {noFindingsAtAll ? (
                         <div className="text-slate-500 text-center italic p-10 bg-slate-50 rounded-lg border border-slate-200 flex flex-col items-center justify-center space-y-3">
                            <CheckCircleIcon className="w-12 h-12 text-green-500" />
                            <h3 className="text-lg font-semibold text-slate-700">Sin Hallazgos</h3>
                            <p>No se encontraron hallazgos en ninguna de las dos revisiones seleccionadas.</p>
                        </div>
                    ) : (
                        <>
                            {renderSection('Conciliación Contable', categorizedResults.contable, {
                                base: [
                                    { header: 'Área', accessor: i => i.categoria },
                                    { header: 'NIT', accessor: i => i.hallazgo.nit },
                                    { header: 'Nombre', accessor: i => i.hallazgo.nombre },
                                    { header: 'Valor', accessor: i => formatCurrency(i.hallazgo.diferencia), className: "text-right font-mono" }
                                ],
                                modificados: [
                                    { header: 'Área', accessor: i => i.categoria },
                                    { header: 'NIT', accessor: i => i.hallazgoAntes.nit },
                                    { header: 'Nombre', accessor: i => i.hallazgoAntes.nombre },
                                    { header: 'Valor Anterior', accessor: i => formatCurrency(i.hallazgoAntes.diferencia), className: "text-right font-mono text-red-600" },
                                    { header: 'Valor Nuevo', accessor: i => formatCurrency(i.hallazgoDespues.diferencia), className: "text-right font-mono text-green-700" },
                                ]
                            })}
                             {renderSection('Retenciones', categorizedResults.retenciones, {
                                base: [
                                    { header: 'Documento', accessor: i => i.hallazgo.docNum },
                                    { header: 'Proveedor', accessor: i => i.hallazgo.proveedor },
                                    { header: 'Inconsistencia', accessor: i => <span className="truncate" title={i.hallazgo.inconsistenciaDetectada}>{i.hallazgo.inconsistenciaDetectada}</span> },
                                    { header: 'Valor', accessor: i => formatCurrency(i.hallazgo.retencionAplicada), className: "text-right font-mono" }
                                ],
                                modificados: [
                                     { header: 'Documento', accessor: i => i.hallazgoAntes.docNum },
                                     { header: 'Proveedor', accessor: i => i.hallazgoAntes.proveedor },
                                     { header: 'Valor Anterior', accessor: i => formatCurrency(i.hallazgoAntes.retencionAplicada), className: "text-right font-mono text-red-600" },
                                     { header: 'Valor Nuevo', accessor: i => formatCurrency(i.hallazgoDespues.retencionAplicada), className: "text-right font-mono text-green-700" }
                                ]
                            })}
                            {renderSection('Coherencia Contable', categorizedResults.coherencia, {
                                base: [
                                    { header: 'Documento', accessor: i => i.hallazgo.docNum },
                                    { header: 'Tercero', accessor: i => i.hallazgo.tercero },
                                    { header: 'Inconsistencia', accessor: i => <span className="truncate" title={i.hallazgo.inconsistencia}>{i.hallazgo.inconsistencia}</span> },
                                ],
                                modificados: [
                                     { header: 'Documento', accessor: i => i.hallazgoAntes.docNum },
                                     { header: 'Tercero', accessor: i => i.hallazgoAntes.tercero },
                                     { header: 'Inconsistencia', accessor: i => <span className="truncate" title={i.hallazgoDespues.inconsistencia}>{i.hallazgoDespues.inconsistencia}</span> },
                                ]
                            })}
                             {renderSection('Revisión IVA (Faltantes/Diferencias)', categorizedResults.ivaDiscrepancia, {
                                base: [
                                    { header: 'Documento', accessor: i => i.hallazgo.docNum },
                                    { header: 'NIT', accessor: i => i.hallazgo.nit },
                                    { header: 'Observación', accessor: i => i.hallazgo.observacion },
                                    { header: 'Valor', accessor: i => formatCurrency(i.hallazgo.diferencia), className: "text-right font-mono" }
                                ],
                                modificados: [
                                     { header: 'Documento', accessor: i => i.hallazgoAntes.docNum },
                                     { header: 'NIT', accessor: i => i.hallazgoAntes.nit },
                                     { header: 'Valor Anterior', accessor: i => formatCurrency(i.hallazgoAntes.diferencia), className: "text-right font-mono text-red-600" },
                                     { header: 'Valor Nuevo', accessor: i => formatCurrency(i.hallazgoDespues.diferencia), className: "text-right font-mono text-green-700" }
                                ]
                            })}
                             {renderSection('Revisión IVA (Clasificación de Ingresos)', categorizedResults.ivaClasificacion, {
                                base: [
                                    { header: 'Documento', accessor: i => i.hallazgo.docNum },
                                    { header: 'NIT', accessor: i => i.hallazgo.nit },
                                    { header: 'Observación', accessor: i => i.hallazgo.observacion },
                                    { header: 'Valor', accessor: i => formatCurrency(i.hallazgo.diferenciaTotal), className: "text-right font-mono" }
                                ],
                                modificados: [
                                     { header: 'Documento', accessor: i => i.hallazgoAntes.docNum },
                                     { header: 'NIT', accessor: i => i.hallazgoAntes.nit },
                                     { header: 'Valor Anterior', accessor: i => formatCurrency(i.hallazgoAntes.diferenciaTotal), className: "text-right font-mono text-red-600" },
                                     { header: 'Valor Nuevo', accessor: i => formatCurrency(i.hallazgoDespues.diferenciaTotal), className: "text-right font-mono text-green-700" }
                                ]
                            })}
                        </>
                    )}
                </main>
                 <footer className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
                     <button 
                        onClick={handleDownloadPdf} 
                        disabled={noFindingsAtAll}
                        className="bg-amber-500 text-slate-900 font-semibold py-2 px-6 rounded-lg hover:bg-amber-400 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        Descargar PDF de Pendientes
                    </button>
                    <button onClick={onClose} className="bg-slate-800 text-white font-semibold py-2 px-6 rounded-lg hover:bg-slate-700">Cerrar</button>
                </footer>
            </div>
        </div>
    );
};

export default ComparisonModal;