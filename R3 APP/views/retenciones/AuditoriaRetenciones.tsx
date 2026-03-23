import React, { useState, useContext, useCallback } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { findRuleForTransaction, RETENTION_ACCOUNT_CONCEPTS } from '../../utils/retencionesData';
import type { RetencionFinding, AuxiliarData, TipoHallazgo } from '../../types';
import { ChevronDownIcon } from '../../components/Icons';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
}).format(value);

const AuditoriaRetenciones: React.FC = () => {
    const context = useContext(AppContext);
    const [providerType, setProviderType] = useState<'declarante' | 'no-declarante'>('declarante');
    const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

    if (!context) return <div>Loading context...</div>;
    const { appState, updateAppState, showLoading, hideLoading, showError } = context;

    const { retencion_compras: compras, retencion_auxiliar: auxiliar } = appState.files;
    const canAnalyze = !!compras && !!auxiliar;

    const toggleExpand = (docNum: string) => {
        setExpandedDocs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(docNum)) {
                newSet.delete(docNum);
            } else {
                newSet.add(docNum);
            }
            return newSet;
        });
    };
    
    const handleFindingUpdate = useCallback((findingId: string, field: 'omitted' | 'omitComment', value: boolean | string) => {
        if (!appState.retencionesResult) return;

        const updatedFindings = appState.retencionesResult.map(finding => {
            if (finding.id === findingId) {
                return { ...finding, [field]: value };
            }
            return finding;
        });

        updateAppState({ retencionesResult: updatedFindings });
    }, [appState.retencionesResult, updateAppState]);


    const handleAnalyze = () => {
        if (!canAnalyze) {
            showError("Cargue el 'Informe Compras (Retenciones)' y el 'Auxiliar General (Retenciones)' primero.");
            return;
        }
        showLoading("Analizando retenciones...");

        setTimeout(() => {
            try {
                const auxiliarMap = new Map<string, AuxiliarData[]>();
                auxiliar.forEach(mov => {
                    const docKey = mov.DocNum.toLowerCase().trim();
                    if (!docKey) return;
                    if (!auxiliarMap.has(docKey)) auxiliarMap.set(docKey, []);
                    auxiliarMap.get(docKey)!.push(mov);
                });

                const findings: RetencionFinding[] = [];

                compras.forEach(compra => {
                    const docKey = compra.Documento.toLowerCase().trim();
                    const movimientos = auxiliarMap.get(docKey) || [];
                    if (movimientos.length === 0) return;

                    const retencionMovs = movimientos.filter(m => m.Cuenta.startsWith('2365'));
                    const totalDebitosRete = retencionMovs.reduce((sum, m) => sum + m.Debitos, 0);
                    const totalCreditosRete = retencionMovs.reduce((sum, m) => sum + m.Creditos, 0);

                    // **Paso 1: Regla de Oro de los Signos**
                    const isDevolucion = compra.VentaNeta < 0;
                    if (!isDevolucion && totalDebitosRete > 0) {
                        findings.push({
                            id: `${compra.Documento}-SIGNO_INCORRECTO`,
                            docNum: compra.Documento,
                            proveedor: compra.Cliente,
                            nit: compra.NIT,
                            fecha: compra.Fecha,
                            base: compra.VentaNeta,
                            retencionAplicada: totalCreditosRete - totalDebitosRete,
                            tipoHallazgo: 'SIGNO_INCORRECTO',
                            inconsistenciaDetectada: 'Signo Incorrecto. Se aplicó un débito a la retención en una compra.',
                            accionRecomendada: 'Revisar causación. Retenciones en compras deben ser créditos (aumentan la cuenta por pagar).',
                            movimientos,
                        });
                        return; // Hallazgo crítico, no seguir analizando
                    }
                    if (isDevolucion && totalCreditosRete > 0) {
                         findings.push({
                            id: `${compra.Documento}-SIGNO_INCORRECTO`,
                            docNum: compra.Documento,
                            proveedor: compra.Cliente,
                            nit: compra.NIT,
                            fecha: compra.Fecha,
                            base: compra.VentaNeta,
                            retencionAplicada: totalCreditosRete - totalDebitosRete,
                            tipoHallazgo: 'SIGNO_INCORRECTO',
                            inconsistenciaDetectada: 'Signo Incorrecto. Se aplicó un crédito a la retención en una devolución.',
                            accionRecomendada: 'Revisar causación. Retenciones en devoluciones deben ser débitos (disminuyen la cuenta por pagar).',
                            movimientos,
                        });
                        return; // Hallazgo crítico
                    }

                    const retencionAplicada = isDevolucion ? totalDebitosRete : totalCreditosRete;
                    const base = Math.abs(compra.VentaNeta);
                    
                    // **Paso 2: Análisis Diferenciado**
                    const costMovs = movimientos.filter(m => ['14', '5', '6'].some(p => m.Cuenta.startsWith(p)));
                    const uniqueCostAccounts = [...new Set(costMovs.map(m => m.Cuenta))];

                    // Determinar si es Persona Jurídica o Natural
                    const cleanNit = compra.NIT.replace(/\D/g, '');
                    const personType = (cleanNit.length === 9 && (cleanNit.startsWith('8') || cleanNit.startsWith('9'))) ? 'pj' : 'pn';

                    if (uniqueCostAccounts.length === 1) {
                        // **Transacción Simple (2A)**
                        const costAccount = uniqueCostAccounts[0];
                        const rule = findRuleForTransaction(costAccount, providerType === 'declarante', personType);
                        if (!rule) return;

                        const retencionEsperada = base >= rule.base ? base * rule.rate : 0;
                        let hallazgo: TipoHallazgo | null = null;
                        let inconsistencia = '';
                        let accion = '';
                        
                        if (base >= rule.base && retencionAplicada < 0.01) {
                            hallazgo = 'RETENCION_OMITIDA';
                            inconsistencia = `Retención Omitida. Base de ${formatCurrency(base)} para '${rule.concept}' excede mínimo de ${formatCurrency(rule.base)}.`;
                            accion = `Aplicar retención del ${rule.rate * 100}% (${formatCurrency(retencionEsperada)}). Verificar si es autorretenedor.`;
                        } else if (base < rule.base && retencionAplicada > 0.01) {
                            hallazgo = 'RETENCION_INDEBIDA';
                            inconsistencia = `Retención Indebida. Se aplicó retención sobre base de ${formatCurrency(base)} (mínimo: ${formatCurrency(rule.base)}).`;
                            accion = 'Reversar la retención practicada, no correspondía según la base.';
                        } else if (Math.abs(retencionAplicada - retencionEsperada) > 1) { // Tol. $1
                            hallazgo = 'TARIFA_INCORRECTA';
                            inconsistencia = `Cálculo Incorrecto para ${personType.toUpperCase()}. Se aplicó ${formatCurrency(retencionAplicada)} pero se esperaba ${formatCurrency(retencionEsperada)} (${rule.rate * 100}%).`;
                            accion = 'Corregir el valor de la retención. Validar base y tarifa aplicada.';
                        }

                        if (hallazgo) {
                            findings.push({
                                id: `${compra.Documento}-${hallazgo}`,
                                docNum: compra.Documento,
                                proveedor: compra.Cliente, nit: compra.NIT, fecha: compra.Fecha,
                                base: base,
                                retencionAplicada: retencionAplicada,
                                tipoHallazgo: hallazgo,
                                inconsistenciaDetectada: inconsistencia,
                                accionRecomendada: accion,
                                movimientos: movimientos,
                                concepto: rule.concept,
                                retencionEsperada: retencionEsperada,
                            });
                        }

                    } else if (uniqueCostAccounts.length > 1) {
                        // **Transacción Múltiple (2B)**
                        const costConcepts = new Set(uniqueCostAccounts.flatMap(acc => {
                            const rule = findRuleForTransaction(acc, providerType === 'declarante', personType);
                            return rule ? [rule.concept.split(' ')[0]] : []; // Use first word of concept
                        }));
                        
                        const retencionConcepts = new Set(retencionMovs.map(mov => {
                            const accPrefix = Object.keys(RETENTION_ACCOUNT_CONCEPTS).find(p => mov.Cuenta.startsWith(p));
                            return accPrefix ? RETENTION_ACCOUNT_CONCEPTS[accPrefix] : null;
                        }).filter(Boolean));
                        
                        // If there's retention but no clear link to cost concepts, flag it.
                        if (retencionConcepts.size > 0 && costConcepts.size > 0) {
                            let isCoherent = false;
                            for (const rc of retencionConcepts) {
                                for (const cc of costConcepts) {
                                    if (rc!.toLowerCase().includes(cc!.toLowerCase()) || cc!.toLowerCase().includes(rc!.toLowerCase())) {
                                        isCoherent = true;
                                        break;
                                    }
                                }
                                if (isCoherent) break;
                            }

                            if (!isCoherent) {
                                findings.push({
                                    id: `${compra.Documento}-COHERENCIA_LOGICA`,
                                    docNum: compra.Documento,
                                    proveedor: compra.Cliente, nit: compra.NIT, fecha: compra.Fecha,
                                    base: base,
                                    retencionAplicada: retencionAplicada,
                                    tipoHallazgo: 'COHERENCIA_LOGICA',
                                    inconsistenciaDetectada: `Posible Incoherencia. Retención por (${[...retencionConcepts].join(', ')}) en gasto por (${[...costConcepts].join(', ')}).`,
                                    accionRecomendada: 'Auditoría Manual: Verificar que las cuentas de retención y gasto sean lógicas entre sí.',
                                    movimientos: movimientos,
                                });
                            }
                        }
                    }
                });
                
                updateAppState({ retencionesResult: findings });
                hideLoading();
            } catch (error) {
                hideLoading();
                showError(error instanceof Error ? error.message : "Error desconocido durante el análisis.");
            }
        }, 50);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b mb-6">
                <div className="flex-grow">
                    <label htmlFor="provider-type" className="block text-sm font-medium text-gray-700 mb-1">
                        Asumir que los proveedores son:
                    </label>
                    <select
                        id="provider-type"
                        value={providerType}
                        onChange={e => setProviderType(e.target.value as 'declarante' | 'no-declarante')}
                        className="w-full sm:w-auto mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm rounded-md"
                    >
                        <option value="declarante">Declarantes de Renta</option>
                        <option value="no-declarante">No Declarantes de Renta</option>
                    </select>
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={!canAnalyze}
                    className="w-full sm:w-auto bg-slate-800 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Generar Auditoría
                </button>
            </div>

            <div id="retenciones-results-container">
                {!appState.retencionesResult ? (
                    <div className="text-center py-10 text-gray-500">
                        <p>Los hallazgos de la auditoría aparecerán aquí.</p>
                        {!canAnalyze && <p className="text-sm text-red-500 mt-2">Por favor, cargue los archivos requeridos en la pestaña 'Carga de Archivos'.</p>}
                    </div>
                ) : appState.retencionesResult.length === 0 ? (
                    <div className="text-center py-10 text-green-600 bg-green-50 rounded-lg">
                        <p className="font-semibold text-lg">¡Felicitaciones!</p>
                        <p>No se encontraron hallazgos en la auditoría con los criterios seleccionados.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800">Hallazgos ({appState.retencionesResult.length})</h3>
                        <div className="border rounded-lg overflow-x-auto shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-2 px-3 font-medium text-gray-600 text-left w-10"></th>
                                        <th className="py-2 px-3 font-medium text-gray-600 text-center">Omitir</th>
                                        <th className="py-2 px-3 font-medium text-gray-600 text-left w-48">Comentario</th>
                                        <th className="py-2 px-3 font-medium text-gray-600 text-left">Documento</th>
                                        <th className="py-2 px-3 font-medium text-gray-600 text-left">Proveedor</th>
                                        <th className="py-2 px-3 font-medium text-gray-600 text-right">Base</th>
                                        <th className="py-2 px-3 font-medium text-gray-600 text-right">Rete. Aplicada</th>
                                        <th className="py-2 px-3 font-medium text-gray-600 text-left w-[25%]">Inconsistencia</th>
                                        <th className="py-2 px-3 font-medium text-gray-600 text-left w-[25%]">Acción Recomendada</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {appState.retencionesResult.map(finding => {
                                        const isExpanded = expandedDocs.has(finding.docNum);
                                        const isOmitted = finding.omitted;
                                        return (
                                            <React.Fragment key={finding.id}>
                                                <tr className={isOmitted ? 'bg-slate-200 opacity-70' : 'hover:bg-red-50/50 bg-red-50/20'}>
                                                    <td className="p-2 text-center">
                                                        <button onClick={() => toggleExpand(finding.docNum)} className="p-1 rounded-full hover:bg-gray-200">
                                                            <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-400 text-slate-600 focus:ring-slate-500" checked={!!isOmitted} onChange={() => handleFindingUpdate(finding.id, 'omitted', !isOmitted)} />
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="text" className="w-full text-xs p-1 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500 bg-white text-slate-900" placeholder="Justificación..." value={finding.omitComment || ''} onChange={(e) => handleFindingUpdate(finding.id, 'omitComment', e.target.value)} />
                                                    </td>
                                                    <td className="p-2 font-semibold text-gray-800">{finding.docNum}</td>
                                                    <td className="p-2 text-gray-600 truncate" title={finding.proveedor}>{finding.proveedor}</td>
                                                    <td className="p-2 text-gray-800 text-right font-mono">{formatCurrency(finding.base)}</td>
                                                    <td className="p-2 text-red-600 font-bold text-right font-mono">{formatCurrency(finding.retencionAplicada)}</td>
                                                    <td className="p-2 text-red-800 font-medium text-xs">{finding.inconsistenciaDetectada}</td>
                                                    <td className="p-2 text-slate-800 font-medium text-xs">{finding.accionRecomendada}</td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className={isOmitted ? 'bg-slate-200 opacity-70' : 'bg-red-50/40'}>
                                                        <td colSpan={9} className="p-0">
                                                            <div className="p-4">
                                                                <p className="text-xs font-semibold text-gray-700 mb-2">Detalle del Auxiliar para {finding.docNum}:</p>
                                                                <table className="min-w-full text-xs bg-white rounded shadow-inner">
                                                                    <thead>
                                                                        <tr className="bg-gray-200">
                                                                            <th className="p-1 text-left text-gray-700">Cuenta</th>
                                                                            <th className="p-1 text-left text-gray-700">Nota</th>
                                                                            <th className="p-1 text-right text-gray-700">Débito</th>
                                                                            <th className="p-1 text-right text-gray-700">Crédito</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {finding.movimientos.map((mov, i) => (
                                                                            <tr key={i} className={`border-t ${mov.Cuenta.startsWith('2365') ? 'font-bold bg-yellow-100' : (['14','5','6'].some(p=>mov.Cuenta.startsWith(p)) ? 'bg-blue-50' : '')}`}>
                                                                                <td className="p-1 text-gray-800">{mov.Cuenta}</td>
                                                                                <td className="p-1 text-gray-800">{mov.Nota}</td>
                                                                                <td className="p-1 text-right text-gray-800">{formatCurrency(mov.Debitos)}</td>
                                                                                <td className="p-1 text-right text-gray-800">{formatCurrency(mov.Creditos)}</td>
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

export default AuditoriaRetenciones;