
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import type { AuxiliarData, CoherenciaFinding } from '../../types';
import { ChevronDownIcon, CheckCircleIcon, InfoIcon } from '../../components/Icons';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
}).format(value);

const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, ' ');
};

/**
 * Función de Normalización de IDs de Documento
 * Elimina prefijos, espacios y caracteres no numéricos para agrupar correctamente
 * asientos que pueden tener inconsistencias en el DocNum.
 */
const getNormalizedDocId = (docNum: string | null | undefined): string => {
    if (!docNum) return "SIN_ID";
    
    const docStr = String(docNum).trim();
    if (docStr === "") return "SIN_ID";

    // Estrategia Agresiva: Extraer solo los dígitos.
    const digitsOnly = docStr.replace(/\D/g, '');
    
    // Si hay dígitos, usarlos como clave. Si es puramente alfanumérico (ej: "AJUSTE"), usar el texto limpio.
    return digitsOnly.length > 0 ? digitsOnly : docStr.toUpperCase();
};

type Severity = 'error' | 'warning';
type FilterType = 'todos' | 'errores' | 'advertencias';

interface ExtendedFinding extends CoherenciaFinding {
    severity: Severity;
}

// Lista Blanca Fuerte: Palabras que justifican INEQUÍVOCAMENTE un crédito en gasto.
const STRONG_JUSTIFICATION_KEYWORDS = [
    'anulacion', 'anulación', 
    'reclasificacion', 'reclasificación', 
    'ajuste', 
    'correccion', 'corrección', 
    'cierre', 
    'traslado',
    'reversion', 'reversión',
    'nota credito', 'nc', 'dcto', 'descuento',
    'prov', 'provision', 'menor valor'
];

const CoherenciaStep: React.FC = () => {
    const context = useContext(AppContext);
    const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
    const [activeFilter, setActiveFilter] = useState<FilterType>('todos');

    if (!context) return <div>Cargando...</div>;
    const { appState, updateAppState, showLoading, hideLoading, showError } = context;
    const { coherenciaContableResult: rawFindings } = appState;

    const canAnalyze = !!appState.files.auxiliar;

    // Enrich findings with severity based on Logic
    const findings: ExtendedFinding[] | null = useMemo(() => {
        if (!rawFindings) return null;
        return rawFindings.map(f => {
            let severity: Severity = 'error';
            
            // La severidad ahora viene determinada principalmente por el mensaje generado en el análisis
            if (f.inconsistencia.toLowerCase().includes('advertencia') || f.inconsistencia.toLowerCase().includes('posible')) {
                severity = 'warning';
            } 
            else if (f.inconsistencia.includes('descuadrado por partida doble')) {
                severity = 'error';
            } 
            
            return { ...f, severity };
        });
    }, [rawFindings]);

    const filteredFindings = useMemo(() => {
        if (!findings) return [];
        if (activeFilter === 'todos') return findings;
        if (activeFilter === 'errores') return findings.filter(f => f.severity === 'error');
        if (activeFilter === 'advertencias') return findings.filter(f => f.severity === 'warning');
        return [];
    }, [findings, activeFilter]);

    const counts = useMemo(() => {
        if (!findings) return { error: 0, warning: 0 };
        return {
            error: findings.filter(f => f.severity === 'error').length,
            warning: findings.filter(f => f.severity === 'warning').length
        };
    }, [findings]);

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
            showError("Cargue el 'Auxiliar General' en el Paso 1 primero.");
            return;
        }
        showLoading("Analizando coherencia contable...");

        setTimeout(() => {
            try {
                const auxiliar = appState.files.auxiliar!;
                const groupedByDoc = new Map<string, AuxiliarData[]>();
                
                // 1. AGRUPACIÓN POR DOCUMENTO
                auxiliar.forEach(mov => {
                    const docKey = getNormalizedDocId(mov.DocNum);
                    if (!groupedByDoc.has(docKey)) {
                        groupedByDoc.set(docKey, []);
                    }
                    groupedByDoc.get(docKey)!.push(mov);
                });

                const newFindings: CoherenciaFinding[] = [];

                groupedByDoc.forEach((movimientos, docKey) => {
                    if (movimientos.length === 0) return;
                    const firstMov = movimientos[0];
                    const displayDocNum = firstMov.DocNum || docKey;
                    const docIdBase = `${docKey}-${firstMov.Fecha}`;

                    // --- REGLA 1: PARTIDA DOBLE ---
                    const totalDebitos = movimientos.reduce((sum, m) => sum + m.Debitos, 0);
                    const totalCreditos = movimientos.reduce((sum, m) => sum + m.Creditos, 0);
                    const diferencia = totalDebitos - totalCreditos;

                    if (Math.abs(diferencia) >= 1) { 
                        newFindings.push({
                            id: `${docIdBase}-PARTIDA_DOBLE`,
                            docNum: displayDocNum,
                            fecha: firstMov.Fecha,
                            tercero: firstMov.Tercero,
                            inconsistencia: 'Documento descuadrado por partida doble.',
                            accionSugerida: 'Verificar los movimientos del documento para identificar la causa del descuadre.',
                            movimientos,
                            lineasInconsistentes: [],
                            totalDebitos,
                            totalCreditos,
                            diferencia,
                        });
                    }

                    // --- REGLA 2: NATURALEZA DE INGRESOS ---
                    movimientos.forEach((mov, index) => {
                        if (mov.Cuenta.startsWith('4') && !mov.Cuenta.startsWith('4175') && mov.Debitos > 0) {
                            newFindings.push({
                                id: `${docIdBase}-DEBITO_INGRESO-${index}`,
                                docNum: displayDocNum,
                                fecha: firstMov.Fecha,
                                tercero: firstMov.Tercero,
                                inconsistencia: `Débito en cuenta de Ingreso (${mov.Cuenta}).`,
                                accionSugerida: "Las cuentas de ingreso no deben debitarse. Si es una devolución, usar cuenta 4175.",
                                movimientos,
                                lineasInconsistentes: [index]
                            });
                        }
                    });

                    // --- REGLA 3: NATURALEZA DE DEVOLUCIONES EN VENTAS ---
                    movimientos.forEach((mov, index) => {
                        if (mov.Cuenta.startsWith('4175') && mov.Creditos > 0) {
                            newFindings.push({
                                id: `${docIdBase}-CREDITO_DEVOLUCION-${index}`,
                                docNum: displayDocNum,
                                fecha: firstMov.Fecha,
                                tercero: firstMov.Tercero,
                                inconsistencia: `Crédito en cuenta de Devolución en Ventas (${mov.Cuenta}).`,
                                accionSugerida: "Las devoluciones en ventas son de naturaleza débito.",
                                movimientos,
                                lineasInconsistentes: [index]
                            });
                        }
                    });

                    // --- REGLA 4: IVA GENERADO E IVA DESCONTABLE ---
                    const hasSalesReturn = movimientos.some(m => m.Cuenta.startsWith('4175') && m.Debitos > 0);
                    const hasPurchaseOrExpense = movimientos.some(m => ['5', '6', '1', '7'].some(p => m.Cuenta.startsWith(p)) && m.Debitos > 0);
                    const hasPurchaseReturn = movimientos.some(m => ['5', '6', '1', '7'].some(p => m.Cuenta.startsWith(p)) && m.Creditos > 0);

                    movimientos.forEach((mov, index) => {
                        if (mov.Cuenta.startsWith('240801') && mov.Debitos > 0) {
                            if (!hasSalesReturn) {
                                let inconsistencia = `Débito en IVA Generado (${mov.Cuenta}) sin devolución aparente.`;
                                let accionSugerida = "Verificar si es una devolución en ventas.";
                                if (hasPurchaseOrExpense) {
                                    inconsistencia = `Uso de IVA Generado (${mov.Cuenta}) en una compra/gasto.`;
                                    accionSugerida = "Corregir a cuenta de IVA Descontable (240802).";
                                }
                                newFindings.push({
                                    id: `${docIdBase}-DEBITO_IVA_GEN-${index}`,
                                    docNum: displayDocNum,
                                    fecha: firstMov.Fecha,
                                    tercero: firstMov.Tercero,
                                    inconsistencia,
                                    accionSugerida,
                                    movimientos,
                                    lineasInconsistentes: [index]
                                });
                            }
                        }
                        if (mov.Cuenta.startsWith('240802') && mov.Creditos > 0 && !hasPurchaseReturn) {
                            newFindings.push({
                                id: `${docIdBase}-CREDITO_IVA_DESC-${index}`,
                                docNum: displayDocNum,
                                fecha: firstMov.Fecha,
                                tercero: firstMov.Tercero,
                                inconsistencia: `Crédito anómalo en IVA Descontable (${mov.Cuenta}).`,
                                accionSugerida: "Verificar si es una devolución en compras.",
                                movimientos,
                                lineasInconsistentes: [index]
                            });
                        }
                    });

                    // --- REGLA 6: NATURALEZA DE GASTOS Y COSTOS (REGLA DE ORO) ---
                    movimientos.forEach((mov, index) => {
                        if (['5', '6', '7'].some(p => mov.Cuenta.startsWith(p)) && mov.Creditos > 0) {
                            
                            // VALIDACIÓN 1: CUENTA PURA (Devoluciones en compras)
                            if (mov.Cuenta.startsWith('6225')) {
                                return; // VÁLIDO: Es una devolución en compras. Ignorar.
                            }

                            // VALIDACIÓN 2: HEURÍSTICA FUERTE DE GLOSA (STRONG WHITELIST)
                            const note = normalizeText(mov.Nota);
                            const docText = normalizeText(displayDocNum);
                            
                            const isStronglyJustified = STRONG_JUSTIFICATION_KEYWORDS.some(kw => note.includes(kw) || docText.includes(kw));

                            if (isStronglyJustified) {
                                return; // VÁLIDO: La glosa justifica el movimiento explícitamente. Ignorar.
                            }

                            // VALIDACIÓN 3: CONTEXTO TRANSACCIONAL (Contrapartida)
                            // Si no hay justificación en texto, buscamos si hay contrapartida en Pasivo (22, 23, 26) o Caja (11).
                            const isContextJustified = movimientos.some(m =>
                                (m.Cuenta.startsWith('22') || m.Cuenta.startsWith('23') || m.Cuenta.startsWith('11') || m.Cuenta.startsWith('26')) &&
                                m.Debitos > 0
                            );

                            if (isContextJustified) {
                                // SEVERIDAD: ADVERTENCIA (Warning)
                                newFindings.push({
                                    id: `${docIdBase}-WARN_CREDITO_GASTO-${index}`,
                                    docNum: displayDocNum,
                                    fecha: firstMov.Fecha,
                                    tercero: firstMov.Tercero,
                                    inconsistencia: `Advertencia: Crédito en Gasto (${mov.Cuenta}) con nota ambigua pero posible reversión.`,
                                    accionSugerida: "El sistema detectó una contrapartida débito en Pasivo/Caja, sugiriendo una anulación. Verifique si la nota debería ser más explícita.",
                                    movimientos,
                                    lineasInconsistentes: [index]
                                });
                            } else {
                                // SEVERIDAD: ERROR (Error)
                                newFindings.push({
                                    id: `${docIdBase}-ERR_CREDITO_GASTO-${index}`,
                                    docNum: displayDocNum,
                                    fecha: firstMov.Fecha,
                                    tercero: firstMov.Tercero,
                                    inconsistencia: `Crédito en cuenta de Gasto/Costo (${mov.Cuenta}) sin justificación aparente.`,
                                    accionSugerida: "Las cuentas de Gasto/Costo son de naturaleza débito. Si no es una anulación explícita, verifique si es un ingreso mal clasificado.",
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

    const renderMovimientosTable = (movimientos: AuxiliarData[], lineasInconsistentes: number[] = []) => (
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
                {movimientos.map((mov, i) => (
                    <tr key={i} className={`border-t ${lineasInconsistentes.includes(i) ? 'font-bold bg-amber-100' : ''}`}>
                        <td className="p-1 text-slate-800">{mov.Cuenta}</td>
                        <td className="p-1 text-slate-800 truncate max-w-[300px]" title={mov.Nota}>{mov.Nota}</td>
                        <td className="p-1 text-right text-slate-800">{formatCurrency(mov.Debitos)}</td>
                        <td className="p-1 text-right text-slate-800">{formatCurrency(mov.Creditos)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-700">Auditoría de Coherencia</h2>
                    <p className="text-sm text-slate-500">Detecta inconsistencias lógicas en las transacciones contables.</p>
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={!canAnalyze}
                    className="w-full sm:w-auto bg-slate-900 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Analizar Coherencia
                </button>
            </div>
            
            <div>
                {!findings ? (
                     <div className="text-center py-10 text-slate-500">
                        <p>Los hallazgos de coherencia aparecerán aquí.</p>
                        {!canAnalyze && <p className="text-sm text-red-500 mt-2">Por favor, cargue el archivo 'Auxiliar General' en la pestaña Carga.</p>}
                    </div>
                ) : findings.length === 0 ? (
                    <div className="text-center py-10 text-green-600 bg-green-50 rounded-lg">
                        <CheckCircleIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="font-semibold text-lg">¡Sin Inconsistencias!</p>
                        <p>No se encontraron hallazgos de lógica contable.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Filter Bar */}
                        <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg w-fit mb-4">
                            <button 
                                onClick={() => setActiveFilter('todos')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeFilter === 'todos' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Todos ({findings.length})
                            </button>
                            <button 
                                onClick={() => setActiveFilter('errores')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeFilter === 'errores' ? 'bg-red-100 text-red-800 ring-1 ring-red-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                Errores ({counts.error})
                            </button>
                            <button 
                                onClick={() => setActiveFilter('advertencias')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeFilter === 'advertencias' ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                Advertencias ({counts.warning})
                            </button>
                        </div>

                        {/* Results List */}
                        <div className="space-y-3">
                            {filteredFindings.map(finding => {
                                const isExpanded = expandedDocs.has(finding.id);
                                const isError = finding.severity === 'error';
                                
                                const containerClasses = isError 
                                    ? 'border-l-4 border-l-red-500 bg-red-50/30 hover:bg-red-50/60' 
                                    : 'border-l-4 border-l-amber-400 bg-amber-50/30 hover:bg-amber-50/60';
                                
                                // SVG In-Line para garantizar color rojo en Error
                                const icon = isError 
                                    ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-600">
                                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                        </svg>
                                    )
                                    : <InfoIcon className="w-5 h-5 text-amber-600" />;

                                return (
                                    <div key={finding.id} className={`border border-slate-200 rounded-md overflow-hidden transition-all ${containerClasses}`}>
                                        <div className="p-3 flex items-center gap-4 cursor-pointer" onClick={() => toggleExpand(finding.id)}>
                                            <div className="flex-shrink-0">{icon}</div>
                                            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{finding.docNum}</p>
                                                    <p className="text-xs text-slate-500">{finding.fecha}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-700 uppercase">Tercero</p>
                                                    <p className="text-xs text-slate-600 truncate" title={finding.tercero}>{finding.tercero}</p>
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-bold ${isError ? 'text-red-700' : 'text-amber-700'}`}>{finding.inconsistencia}</p>
                                                    {finding.diferencia && <p className="text-xs font-mono font-bold">Descuadre: {formatCurrency(finding.diferencia)}</p>}
                                                </div>
                                            </div>
                                            <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                        
                                        {isExpanded && (
                                            <div className="border-t border-slate-200 p-4 bg-white">
                                                <div className="mb-3">
                                                    <span className="text-xs font-bold text-slate-700 uppercase">Acción Sugerida: </span>
                                                    <span className="text-xs text-slate-600">{finding.accionSugerida}</span>
                                                </div>
                                                {renderMovimientosTable(finding.movimientos, finding.lineasInconsistentes)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {filteredFindings.length === 0 && (
                                <div className="text-center py-8 text-slate-400 italic">
                                    No hay hallazgos en esta categoría.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoherenciaStep;
