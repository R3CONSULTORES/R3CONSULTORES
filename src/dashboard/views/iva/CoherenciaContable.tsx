
import React, { useState, useContext } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import type { AuxiliarData, CoherenciaFinding } from '@/dashboard/types';
import { ChevronDownIcon, CheckCircleIcon } from '@/dashboard/components/Icons';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
}).format(value);

const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, ' ');
};

interface CoherenciaContableProps {
    hideControls?: boolean;
}

const CoherenciaContable: React.FC<CoherenciaContableProps> = ({ hideControls = false }) => {
    const context = useContext(AppContext);
    const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

    if (!context) return <div>Cargando...</div>;
    const { appState, updateAppState, showLoading, hideLoading, showError } = context;
    const { coherenciaContableResult: findings } = appState;

    const canAnalyze = !!appState.files.iva_auxiliar;

    const toggleExpand = (docId: string) => {
        setExpandedDocs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(docId)) {
                newSet.delete(docId);
            } else {
                newSet.add(docId);
            }
            return newSet;
        });
    };

    const handleAnalyze = () => {
        if (!canAnalyze) {
            showError("Cargue el 'Auxiliar General (IVA)' primero.");
            return;
        }
        showLoading("Analizando coherencia contable...");

        setTimeout(() => {
            try {
                const auxiliar = appState.files.iva_auxiliar!;
                const groupedByDoc = new Map<string, AuxiliarData[]>();
                auxiliar.forEach(mov => {
                    const docNum = mov.DocNum.trim();
                    if (!docNum) return;
                    if (!groupedByDoc.has(docNum)) {
                        groupedByDoc.set(docNum, []);
                    }
                    groupedByDoc.get(docNum)!.push(mov);
                });

                const newFindings: CoherenciaFinding[] = [];

                groupedByDoc.forEach((movimientos, docNum) => {
                    if (movimientos.length === 0) return;
                    const firstMov = movimientos[0];
                    const docIdBase = `${docNum}-${firstMov.Fecha}`;

                    // Rule 1.1: Débito en Cuenta de Ingreso
                    movimientos.forEach((mov, index) => {
                        if (mov.Cuenta.startsWith('4') && !mov.Cuenta.startsWith('4175') && mov.Debitos > 0) {
                            newFindings.push({
                                id: `${docIdBase}-DEBITO_INGRESO-${index}`,
                                docNum,
                                fecha: firstMov.Fecha,
                                tercero: firstMov.Tercero,
                                inconsistencia: `Débito en cuenta de Ingreso (${mov.Cuenta}).`,
                                accionSugerida: "Las cuentas de ingreso no deben debitarse. Si es una devolución, usar cuenta 4175.",
                                movimientos,
                                lineasInconsistentes: [index]
                            });
                        }
                    });

                    // Rule 1.2: Crédito en Cuenta de Devolución
                    movimientos.forEach((mov, index) => {
                        if (mov.Cuenta.startsWith('4175') && mov.Creditos > 0) {
                            newFindings.push({
                                id: `${docIdBase}-CREDITO_DEVOLUCION-${index}`,
                                docNum,
                                fecha: firstMov.Fecha,
                                tercero: firstMov.Tercero,
                                inconsistencia: `Crédito en cuenta de Devolución en Ventas (${mov.Cuenta}).`,
                                accionSugerida: "Las devoluciones en ventas son de naturaleza débito.",
                                movimientos,
                                lineasInconsistentes: [index]
                            });
                        }
                    });

                    // Rule 2.1: Débito en IVA Generado (con contexto)
                    const hasSalesReturn = movimientos.some(m => m.Cuenta.startsWith('4175') && m.Debitos > 0);
                    const hasPurchaseOrExpense = movimientos.some(m => ['5', '6', '1', '7'].some(p => m.Cuenta.startsWith(p)) && m.Debitos > 0);
                    
                    movimientos.forEach((mov, index) => {
                        if (mov.Cuenta.startsWith('240801') && mov.Debitos > 0) {
                            if (!hasSalesReturn) {
                                let inconsistencia = `Débito en IVA Generado (${mov.Cuenta}) sin devolución en ventas aparente.`;
                                let accionSugerida = "Un débito en IVA Generado usualmente acompaña una devolución (débito en 4175). Verificar transacción.";

                                if (hasPurchaseOrExpense) {
                                    inconsistencia = `Uso de cuenta de IVA Generado (${mov.Cuenta}) en una compra/gasto.`;
                                    accionSugerida = "Corregir a una cuenta de IVA Descontable (ej. 240802).";
                                }

                                newFindings.push({
                                    id: `${docIdBase}-DEBITO_IVA_GEN-${index}`,
                                    docNum,
                                    fecha: firstMov.Fecha,
                                    tercero: firstMov.Tercero,
                                    inconsistencia,
                                    accionSugerida,
                                    movimientos,
                                    lineasInconsistentes: [index]
                                });
                            }
                        }
                    });

                    // Rule 2.2: Crédito en IVA Descontable
                    const hasPurchaseReturn = movimientos.some(m => ['5', '6', '1', '7'].some(p => m.Cuenta.startsWith(p)) && m.Creditos > 0);
                    movimientos.forEach((mov, index) => {
                        if (mov.Cuenta.startsWith('240802') && mov.Creditos > 0 && !hasPurchaseReturn) {
                            newFindings.push({
                                id: `${docIdBase}-CREDITO_IVA_DESC-${index}`,
                                docNum,
                                fecha: firstMov.Fecha,
                                tercero: firstMov.Tercero,
                                inconsistencia: `Crédito anómalo en IVA Descontable (${mov.Cuenta}).`,
                                accionSugerida: "Un crédito en IVA Descontable usualmente acompaña una devolución en compras. Verificar.",
                                movimientos,
                                lineasInconsistentes: [index]
                            });
                        }
                    });

                    // Rule 3.1: Crédito en Gasto/Costo/Inventario (con contexto de devolución)
                    movimientos.forEach((mov, index) => {
                        // User specified classes 5, 6, 7
                        if (['5', '6', '7'].some(p => mov.Cuenta.startsWith(p)) && mov.Creditos > 0) {
                            // Check for context indicating a purchase return.
                            // A return typically involves debiting the supplier (22), debiting cash (11), or crediting deductible VAT (240802).
                            const isPurchaseReturnContext = movimientos.some(m =>
                                (m.Cuenta.startsWith('22') && m.Debitos > 0) || // Debit to supplier
                                (m.Cuenta.startsWith('11') && m.Debitos > 0) || // Debit to cash/bank
                                (m.Cuenta.startsWith('240802') && m.Creditos > 0) // Credit to deductible VAT
                            );
                    
                            // Also check for keywords in the document number or note
                            const hasReturnKeyword = normalizeText(docNum).includes('nc') || 
                                                     normalizeText(firstMov.Nota).includes('devolucion');
                    
                            // If it's not a return, then it's an inconsistency.
                            if (!isPurchaseReturnContext && !hasReturnKeyword) {
                                newFindings.push({
                                    id: `${docIdBase}-CREDITO_GASTO-${index}`,
                                    docNum,
                                    fecha: firstMov.Fecha,
                                    tercero: firstMov.Tercero,
                                    inconsistencia: `Crédito en cuenta de Gasto/Costo (${mov.Cuenta}) sin contexto de devolución.`,
                                    accionSugerida: "Las cuentas de Gasto/Costo son de naturaleza débito. Si no es una devolución en compras, verifique la contabilización.",
                                    movimientos,
                                    lineasInconsistentes: [index]
                                });
                            }
                        }
                    });
                });

                updateAppState({ coherenciaContableResult: newFindings });
                hideLoading();

            } catch (error) {
                hideLoading();
                showError(error instanceof Error ? error.message : "Error desconocido durante el análisis.");
            }
        }, 50);
    };


    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            {!hideControls && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-700">Auditor de Lógica Contable</h2>
                        <p className="text-sm text-slate-500">Detecta inconsistencias en la naturaleza de las cuentas dentro de cada transacción.</p>
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={!canAnalyze}
                        className="w-full sm:w-auto bg-slate-800 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Analizar Coherencia del Auxiliar
                    </button>
                </div>
            )}
            
            <div>
                {!findings ? (
                     <div className="text-center py-10 text-slate-500">
                        <p>Los hallazgos de coherencia contable aparecerán aquí.</p>
                        {!canAnalyze && <p className="text-sm text-red-500 mt-2">Por favor, cargue el archivo 'Auxiliar General (IVA)' primero.</p>}
                    </div>
                ) : findings.length === 0 ? (
                    <div className="text-center py-10 text-green-600 bg-green-50 rounded-lg">
                        <p className="font-semibold text-lg">¡Sin Inconsistencias!</p>
                        <p>No se encontraron hallazgos de lógica contable en el archivo analizado.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-slate-800">Hallazgos ({findings.length})</h3>
                        <div className="border rounded-lg overflow-x-auto shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-100">
                                     <tr>
                                        <th className="py-2 px-3 font-medium text-slate-600 text-left w-10"></th>
                                        <th className="py-2 px-3 font-medium text-slate-600 text-left">Documento</th>
                                        <th className="py-2 px-3 font-medium text-slate-600 text-left">Tercero</th>
                                        <th className="py-2 px-3 font-medium text-slate-600 text-left w-[30%]">Inconsistencia Detectada</th>
                                        <th className="py-2 px-3 font-medium text-slate-600 text-left w-[30%]">Acción Sugerida</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {findings.map(finding => {
                                        const isExpanded = expandedDocs.has(finding.id);
                                        return (
                                            <React.Fragment key={finding.id}>
                                                <tr className="hover:bg-amber-50/50 bg-amber-50/20">
                                                    <td className="p-2 text-center">
                                                        <button onClick={() => toggleExpand(finding.id)} className="p-1 rounded-full hover:bg-slate-200">
                                                            <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    </td>
                                                    <td className="p-2 font-semibold text-slate-800">{finding.docNum}</td>
                                                    <td className="p-2 text-slate-600 truncate" title={finding.tercero}>{finding.tercero}</td>
                                                    <td className="p-2 text-red-800 font-medium text-xs">{finding.inconsistencia}</td>
                                                    <td className="p-2 text-slate-800 font-medium text-xs">{finding.accionSugerida}</td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={5} className="p-0 bg-amber-50/30">
                                                            <div className="p-4">
                                                                <p className="text-xs font-semibold text-slate-700 mb-2">Detalle de la Transacción para {finding.docNum}:</p>
                                                                <table className="min-w-full text-xs bg-white rounded shadow-inner">
                                                                    <thead className="bg-slate-200">
                                                                        <tr>
                                                                            <th className="p-1 text-left text-slate-700">Cuenta</th>
                                                                            <th className="p-1 text-left text-slate-700">Nota</th>
                                                                            <th className="p-1 text-right text-slate-700">Débito</th>
                                                                            <th className="p-1 text-right text-slate-700">Crédito</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {finding.movimientos.map((mov, i) => (
                                                                            <tr key={i} className={`border-t ${finding.lineasInconsistentes.includes(i) ? 'font-bold bg-red-100' : ''}`}>
                                                                                <td className="p-1 text-slate-800">{mov.Cuenta}</td>
                                                                                <td className="p-1 text-slate-800">{mov.Nota}</td>
                                                                                <td className="p-1 text-right text-slate-800">{formatCurrency(mov.Debitos)}</td>
                                                                                <td className="p-1 text-right text-slate-800">{formatCurrency(mov.Creditos)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoherenciaContable;
