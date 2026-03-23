import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import type { RetencionBaseData, LiquidacionSummary, TransactionDetail, ClassificationData, AuxiliarData, ConceptSummary } from '../../types';
import { XMarkIcon } from '../../components/Icons';


const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return '$ -';
    }
     const formatted = new Intl.NumberFormat('es-CO', {
        style: 'decimal',
        maximumFractionDigits: 0,
    }).format(value);
    return `$ ${formatted}`;
};

const valueClass = (value: number | undefined) => {
    return (value ?? 0) === 0 ? 'text-gray-500' : 'text-slate-800';
};

const CONCEPTOS_ORDENADOS = [
    'Honorarios', 'Comisiones', 'Servicios', 'Rendimientos financieros e intereses',
    'Arrendamientos (Muebles e inmuebles)', 'Regalias y explotacion de la propiedad intelectual',
    'Dividendos y participaciones', 'Compras', 'Transacciones con tarjetas débito y crédito',
    'Contratos de construccion', 'Enajenación de activos fijos de per. naturales ante notarios y autoridades de tránsito',
    'Renta de trabajo'
];

const DISABLED_CONCEPTS_FOR_PJ = [
    'Renta de trabajo',
    'Enajenación de activos fijos de per. naturales ante notarios y autoridades de tránsito'
];

const CONCEPTO_MAP: Record<string, string[]> = {
    'Honorarios': ['236515'],
    'Comisiones': ['236520'],
    'Servicios': ['236525', '236550', '236555', '236560'],
    'Rendimientos financieros e intereses': ['236530'],
    'Arrendamientos (Muebles e inmuebles)': ['236510'],
    'Compras': ['236505', '236540', '236565', '236570'],
    'Contratos de construccion': ['236535'],
    'Transacciones con tarjetas débito y crédito': ['236599'], // Placeholder account
};

const FUZZY_CONCEPT_KEYWORDS: Record<string, string[]> = {
    'Honorarios': ['honorario', 'honorarios'],
    'Comisiones': ['comision', 'comisiones'],
    'Servicios': ['servicio', 'servicios', 'aseo', 'vigilancia', 'temporal', 'transporte'],
    'Rendimientos financieros e intereses': ['rendimiento', 'interes', 'financiero'],
    'Arrendamientos (Muebles e inmuebles)': ['arriendo', 'arrendamiento', 'arrendamientos'],
    'Contratos de construccion': ['construccion', 'obra', 'urbanizacion'],
};
const LEVENSHTEIN_THRESHOLD = 2; // Allow up to 2 typos

const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) { matrix[0][i] = i; }
    for (let j = 0; j <= b.length; j++) { matrix[j][0] = j; }
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,      // Deletion
                matrix[j - 1][i] + 1,      // Insertion
                matrix[j - 1][i - 1] + cost // Substitution
            );
        }
    }
    return matrix[b.length][a.length];
};

const normalizeForFuzzy = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

const getAutomaticConcept = (accountCode: string, accountName: string): string => {
    const accountToConceptMap = new Map<string, string>();
    for (const [concept, prefixes] of Object.entries(CONCEPTO_MAP)) {
        prefixes.forEach(prefix => accountToConceptMap.set(prefix, concept));
    }

    let concepto = 'Compras'; // Default concept

    const foundPrefix = [...accountToConceptMap.keys()].sort((a, b) => b.length - a.length).find(p => accountCode.startsWith(p));
    if (foundPrefix) {
        concepto = accountToConceptMap.get(foundPrefix)!;
    }

    if (concepto === 'Compras' && accountName) {
        const normalizedAccountWords = normalizeForFuzzy(accountName).split(' ');
        let bestMatchConcept: string | null = null;
        let minDistance = LEVENSHTEIN_THRESHOLD + 1;

        for (const word of normalizedAccountWords) {
            if (word.length < 4) continue;
            for (const [conceptKey, keywords] of Object.entries(FUZZY_CONCEPT_KEYWORDS)) {
                for (const keyword of keywords) {
                    const distance = levenshteinDistance(word, keyword);
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestMatchConcept = conceptKey;
                    }
                }
            }
        }
        
        if (bestMatchConcept && minDistance <= LEVENSHTEIN_THRESHOLD) {
            concepto = bestMatchConcept;
        }
    }
    return concepto;
};


const LiquidacionRetenciones: React.FC = () => {
    const context = useContext(AppContext);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [modalData, setModalData] = useState<{ title: string; transactions: TransactionDetail[] } | null>(null);
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);

    if (!context) return <div>Loading...</div>;
    const { appState, updateAppState, showLoading, hideLoading, showError } = context;
    const { liquidacionSummary: summary, liquidacionTarifaIng: tarifaIng, liquidacionAutorretencionSource: autorretencionSource, conceptOverrides, transactionConceptOverrides, needsRegeneration } = appState;
    
    const canGenerate = 
        appState.fileUploadStatus['retencion_base'].status === 'success' &&
        appState.fileUploadStatus['retencion_auxiliar'].status === 'success' &&
        appState.fileUploadStatus['retencion_ventas'].status === 'success';

    const getConceptForAccount = (fullCodigo: string, accountName: string): string => {
        const specificOverride = conceptOverrides.get(fullCodigo);
        if (specificOverride) return specificOverride;
        const accountCode = fullCodigo.split(' ')[0];
        return getAutomaticConcept(accountCode, accountName);
    };
    
    const handleGenerate = () => {
        const { retencion_base: baseData, retencion_auxiliar: auxData, retencion_ventas: ventasData } = appState.files;

        if (!baseData || !auxData || !ventasData) {
            showError("Cargue los archivos 'Auxiliar con Bases', 'Auxiliar General' e 'Informe Ventas' en la pestaña de Carga primero.");
            return;
        }

        showLoading("Generando liquidación...");

        setTimeout(() => {
            try {
                const pjWarningConcepts = new Set<string>();
                const terceroToNitMap = new Map<string, string>();
                const normalizeTercero = (name: string) => name.trim().toLowerCase();
                auxData.forEach(row => {
                    if (row.NIT && row.Tercero && !terceroToNitMap.has(normalizeTercero(row.Tercero))) {
                        terceroToNitMap.set(normalizeTercero(row.Tercero), row.NIT);
                    }
                });

                const newSummary: LiquidacionSummary = {
                    pj: {} as ClassificationData, pn: {} as ClassificationData, reteIva: 0, 
                    exonerados: { base_aux: 0, retencion_contab: 0, tarifa_promedio: 0, base_ing: 0, retencion_ing_calc: 0, diferencia_ret: 0 }
                };
                CONCEPTOS_ORDENADOS.forEach(c => {
                    newSummary.pj[c] = { base: 0, retencion: 0, transactions: [] };
                    newSummary.pn[c] = { base: 0, retencion: 0, transactions: [] };
                });

                baseData.forEach((row, index) => {
                    const nit = terceroToNitMap.get(normalizeTercero(row.Tercero));
                    if (!nit) return;
                    
                    if (row.Codigo.startsWith('236575')) return;

                    const transactionId = `tx-${index}-${row.CuentaDocumento.replace(/\s/g, '')}-${nit}`;

                    const cleanNit = nit.replace(/\D/g, '');
                    const personType = (cleanNit.length === 9 && (cleanNit.startsWith('8') || cleanNit.startsWith('9'))) ? 'pj' : 'pn';
                    
                    const txOverride = transactionConceptOverrides.get(transactionId);
                    const accountName = row.Codigo.split(' ').slice(1).join(' ');
                    const concepto = txOverride || getConceptForAccount(row.Codigo, accountName);
                    
                    if (personType === 'pj' && DISABLED_CONCEPTS_FOR_PJ.includes(concepto)) {
                        pjWarningConcepts.add(concepto);
                        return;
                    }

                    const transactionDetail: TransactionDetail = {
                        id: transactionId,
                        cuenta: row.Codigo,
                        tercero: row.Tercero,
                        nit: nit || 'N/A',
                        docNum: row.CuentaDocumento,
                        base: row.Base,
                        valor: row.Valor,
                        porcentaje: row.Base !== 0 ? (row.Valor / row.Base) * 100 : 0,
                        concepto: concepto,
                    };

                    const target = newSummary[personType];
                    if (target[concepto]) {
                        target[concepto].base += row.Base;
                        target[concepto].retencion += row.Valor;
                        target[concepto].transactions.push(transactionDetail);
                    }
                });
                
                if (pjWarningConcepts.size > 0) {
                    const conceptsStr = [...pjWarningConcepts].join(', ');
                    showError(`Alerta: Los conceptos [${conceptsStr}] no aplican a Personas Jurídicas. Se han excluido sus valores del total de PJ.`);
                }

                auxData.forEach(m => {
                    if (m.Cuenta.startsWith('2367')) {
                        newSummary.reteIva += m.Creditos - m.Debitos;
                    }
                });

                const base_ing = ventasData.reduce((sum, venta) => sum + venta.VentaNeta, 0);
                
                let base_aux = 0;
                let retencion_contab = 0;
                baseData.forEach(row => {
                    if (row.Codigo.startsWith('236575')) { // Autorretenciones
                        base_aux += row.Base;
                        retencion_contab += row.Valor;
                    }
                });
                
                const tarifa_promedio = base_aux > 0 ? (retencion_contab / base_aux) : 0;
                const retencion_ing_calc = base_ing * (tarifaIng / 100);
                const diferencia_ret = retencion_ing_calc - retencion_contab;

                newSummary.exonerados = {
                    base_ing, base_aux, retencion_contab, tarifa_promedio,
                    retencion_ing_calc, diferencia_ret
                };

                updateAppState({ liquidacionSummary: newSummary, needsRegeneration: false });
            } catch(e) {
                showError(e instanceof Error ? e.message : "Error al procesar la liquidación.");
            } finally {
                hideLoading();
            }
        }, 50);
    };

    const uniqueAccounts = useMemo(() => {
        const baseData = appState.files.retencion_base;
        if (!baseData) return [];
        const accounts = new Map<string, string>();
        baseData.forEach(row => {
            if (!accounts.has(row.Codigo) && row.Codigo.startsWith('2365') && !row.Codigo.startsWith('236575')) {
                const namePart = row.Codigo.split(' ').slice(1).join(' ');
                accounts.set(row.Codigo, namePart);
            }
        });
        return Array.from(accounts.entries()).map(([codigo, name]) => ({ codigo, name }));
    }, [appState.files.retencion_base]);

    const handleOverrideChange = (codigo: string, newConcept: string) => {
        const newOverrides = new Map(conceptOverrides);
        if (newConcept === 'Automático') {
            newOverrides.delete(codigo);
        } else {
            newOverrides.set(codigo, newConcept);
        }
        updateAppState({ conceptOverrides: newOverrides, needsRegeneration: true });
    };

    const handleTransactionOverrideChange = (transactionId: string, newConcept: string) => {
        const newOverrides = new Map(transactionConceptOverrides);
        if (newConcept === 'Automático') {
            newOverrides.delete(transactionId);
        } else {
            newOverrides.set(transactionId, newConcept);
        }
        updateAppState({
            transactionConceptOverrides: newOverrides,
            needsRegeneration: true
        });

        setModalData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                transactions: prev.transactions.filter(tx => tx.id !== transactionId)
            };
        });
    };

    const openDetailModal = (concepto: string, personType: 'pj' | 'pn') => {
        if (!summary) return;
        const conceptData = summary[personType]?.[concepto] as ConceptSummary | undefined;
        if (!conceptData || !conceptData.transactions || conceptData.transactions.length === 0) return;
    
        setModalData({
            title: `Detalle de: ${concepto} - ${personType === 'pj' ? 'Personas Jurídicas' : 'Personas Naturales'}`,
            transactions: [...conceptData.transactions].sort((a, b) => b.base - a.base),
        });
    };
    
    const totalPJ = summary ? (Object.values(summary.pj) as ConceptSummary[]).reduce((acc, val) => ({ base: acc.base + (val.base || 0), retencion: acc.retencion + (val.retencion || 0) }), { base: 0, retencion: 0 }) : { base: 0, retencion: 0 };
    const totalPN = summary ? (Object.values(summary.pn) as ConceptSummary[]).reduce((acc, val) => ({ base: acc.base + (val.base || 0), retencion: acc.retencion + (val.retencion || 0) }), { base: 0, retencion: 0 }) : { base: 0, retencion: 0 };
        
    const autorretencionAPagar = summary ? (autorretencionSource === 'contable' ? summary.exonerados.retencion_contab : summary.exonerados.retencion_ing_calc) : 0;
    const totalAPagar = summary ? totalPJ.retencion + totalPN.retencion + summary.reteIva + autorretencionAPagar : 0;


    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            {isPanelOpen && (
                 <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-xl font-semibold text-gray-800">Panel de Reclasificación de Conceptos</h3>
                            <button onClick={() => setIsPanelOpen(false)} className="text-gray-500 hover:text-gray-800">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto">
                            <p className="text-sm text-gray-600 mb-4">Ajuste el concepto para una cuenta específica (ej: "23651501 Asesorias"). Esta regla tiene la máxima prioridad.</p>
                            <div className="border rounded-lg shadow-sm">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="py-2 px-3 text-left font-medium text-gray-600 w-1/3">Cuenta Específica</th>
                                            <th className="py-2 px-3 text-left font-medium text-gray-600 w-1/3">Concepto Automático</th>
                                            <th className="py-2 px-3 text-left font-medium text-gray-600 w-1/3">Nuevo Concepto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {uniqueAccounts.map(({ codigo, name }) => {
                                            const autoConcept = getAutomaticConcept(codigo.split(' ')[0], name);
                                            const currentConcept = conceptOverrides.get(codigo) || 'Automático';
                                            return (
                                                <tr key={codigo}>
                                                    <td className="p-2 px-3 text-gray-800 font-medium">{codigo}</td>
                                                    <td className="p-2 px-3 text-gray-600 italic">{autoConcept}</td>
                                                    <td className="p-2 px-3">
                                                        <select
                                                            value={currentConcept}
                                                            onChange={(e) => handleOverrideChange(codigo, e.target.value)}
                                                            className="w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 text-sm"
                                                        >
                                                            <option value="Automático">Automático</option>
                                                            {CONCEPTOS_ORDENADOS.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                         <div className="p-4 border-t bg-gray-50 text-right">
                            <button onClick={() => setIsPanelOpen(false)} className="bg-slate-900 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-slate-700">
                                Cerrar
                            </button>
                        </div>
                    </div>
                 </div>
            )}

            {modalData && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setModalData(null)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-xl font-semibold text-gray-800">{modalData.title}</h3>
                            <button onClick={() => setModalData(null)} className="text-gray-500 hover:text-gray-800">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <div className="border rounded-lg shadow-sm">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="py-2 px-3 text-left font-medium text-gray-700">Cuenta</th>
                                            <th className="py-2 px-3 text-left font-medium text-gray-700">Tercero</th>
                                            <th className="py-2 px-3 text-left font-medium text-gray-700">Documento</th>
                                            <th className="py-2 px-3 text-right font-medium text-gray-700">Base</th>
                                            <th className="py-2 px-3 text-right font-medium text-gray-700">Retención</th>
                                            <th className="py-2 px-3 text-right font-medium text-gray-700">Porcentaje</th>
                                            <th className="py-2 px-3 text-left font-medium text-gray-700 w-1/4">Reclasificar A</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {modalData.transactions.map((tx) => {
                                            const autoConcept = getAutomaticConcept(tx.cuenta.split(' ')[0], tx.cuenta.split(' ').slice(1).join(' '));
                                            const currentOverride = transactionConceptOverrides.get(tx.id);
                                            const selectedValue = currentOverride || 'Automático';
                                            
                                            return (
                                                <tr key={tx.id}>
                                                    <td className="py-1 px-3 text-gray-800 font-medium truncate max-w-[200px]" title={tx.cuenta}>{tx.cuenta}</td>
                                                    <td className="py-1 px-3 text-gray-800 truncate max-w-[200px]" title={tx.tercero}>{tx.tercero}</td>
                                                    <td className="py-1 px-3 text-gray-800">{tx.docNum}</td>
                                                    <td className="py-1 px-3 text-gray-800 text-right font-mono">{formatCurrency(tx.base)}</td>
                                                    <td className="py-1 px-3 text-gray-800 text-right font-mono font-semibold">{formatCurrency(tx.valor)}</td>
                                                    <td className="py-1 px-3 text-gray-800 text-right font-mono">{tx.porcentaje.toFixed(2)}%</td>
                                                    <td className="py-1 px-3">
                                                        <select
                                                            value={selectedValue}
                                                            onChange={(e) => handleTransactionOverrideChange(tx.id, e.target.value)}
                                                            className="w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 text-sm"
                                                        >
                                                            <option value="Automático">Automático ({autoConcept})</option>
                                                            {CONCEPTOS_ORDENADOS.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 text-right">
                            <button onClick={() => setModalData(null)} className="bg-slate-900 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-slate-700">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
                 <div className="lg:col-span-3">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Generar Liquidación</h3>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-grow">
                            <label htmlFor="tarifa-ing" className="block text-sm font-medium text-gray-700 mb-1">Tarifa Ingresos (%)</label>
                            <input 
                                type="number" id="tarifa-ing" step="0.01" value={tarifaIng}
                                onChange={(e) => updateAppState({ liquidacionTarifaIng: parseFloat(e.target.value) || 0, needsRegeneration: !!summary })}
                                className="w-full md:w-40 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 text-sm"
                            />
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={!canGenerate}
                            className="w-full md:w-auto bg-slate-900 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed relative"
                        >
                            {needsRegeneration ? "Regenerar Liquidación" : "Generar Liquidación"}
                            {needsRegeneration && <span className="absolute top-0 right-0 -mt-2 -mr-2 px-2 py-1 bg-amber-400 text-slate-800 text-xs font-bold rounded-full">!</span>}
                        </button>
                        {summary && (
                            <button
                                onClick={() => setIsPanelOpen(true)}
                                className="w-full md:w-auto bg-white text-slate-800 border border-slate-800 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Ajustar Conceptos
                            </button>
                        )}
                    </div>
                     {!canGenerate && <p className="text-xs text-red-500 mt-2">Requiere 'Auxiliar con Bases', 'Auxiliar General' e 'Informe Ventas' de la pestaña de Carga.</p>}
                </div>
            </div>

            {summary && (
                <div className="overflow-x-auto border-2 border-slate-700 rounded-lg p-1">
                    <table className="min-w-full text-sm" style={{minWidth: '1000px'}}>
                        <thead>
                            <tr className="bg-slate-900 text-amber-400 font-bold">
                                <th className="p-2 border-r border-slate-600 text-center w-[25%]">CONCEPTO</th>
                                <th colSpan={2} className="p-2 border-r border-slate-600 text-center">PERSONAS JURÍDICAS</th>
                                <th colSpan={2} className="p-2 text-center">PERSONAS NATURALES</th>
                            </tr>
                            <tr className="bg-slate-900 text-white font-semibold">
                                <td className="p-1 border-r border-slate-600"></td>
                                <td className="p-1 border-r border-slate-600 text-center w-[18.75%]">BASE</td>
                                <td className="p-1 border-r border-slate-600 text-center w-[18.75%]">RETENCIÓN</td>
                                <td className="p-1 border-r border-slate-600 text-center w-[18.75%]">BASE</td>
                                <td className="p-1 text-center w-[18.75%]">RETENCIÓN</td>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                            {CONCEPTOS_ORDENADOS.map(concepto => {
                                const isDisabledForPJ = DISABLED_CONCEPTS_FOR_PJ.includes(concepto);
                                const pjConcept = summary.pj[concepto] as ConceptSummary | undefined;
                                const pnConcept = summary.pn[concepto] as ConceptSummary | undefined;
                                const hasPjData = (pjConcept?.transactions?.length ?? 0) > 0;
                                const hasPnData = (pnConcept?.transactions?.length ?? 0) > 0;
                                const pjHoverKey = `pj-${concepto}`;
                                const pnHoverKey = `pn-${concepto}`;

                                return (
                                <tr key={concepto}>
                                    <td className="p-1 px-2 border-r border-gray-300 font-medium text-slate-800">{concepto}</td>
                                    
                                    {isDisabledForPJ ? (
                                        <>
                                            <td className="p-1 px-2 border-r border-gray-300 text-center text-slate-500 bg-slate-100" title="Concepto no aplicable para Personas Jurídicas.">-</td>
                                            <td className="p-1 px-2 border-r border-gray-300 text-center text-slate-500 bg-slate-100 font-semibold" title="Concepto no aplicable para Personas Jurídicas.">-</td>
                                        </>
                                    ) : (
                                        <>
                                            <td onClick={() => hasPjData && openDetailModal(concepto, 'pj')} onMouseEnter={() => hasPjData && setHoveredCell(pjHoverKey)} onMouseLeave={() => setHoveredCell(null)} className={`p-1 px-2 border-r border-gray-300 text-right ${valueClass(pjConcept?.base)} ${hasPjData ? 'cursor-pointer' : ''} ${hoveredCell === pjHoverKey ? 'bg-amber-100' : ''}`}>{formatCurrency(pjConcept?.base)}</td>
                                            <td onClick={() => hasPjData && openDetailModal(concepto, 'pj')} onMouseEnter={() => hasPjData && setHoveredCell(pjHoverKey)} onMouseLeave={() => setHoveredCell(null)} className={`p-1 px-2 border-r border-gray-300 text-right font-semibold ${valueClass(pjConcept?.retencion)} ${hasPjData ? 'cursor-pointer' : ''} ${hoveredCell === pjHoverKey ? 'bg-amber-100' : ''}`}>{formatCurrency(pjConcept?.retencion)}</td>
                                        </>
                                    )}

                                    <td onClick={() => hasPnData && openDetailModal(concepto, 'pn')} onMouseEnter={() => hasPnData && setHoveredCell(pnHoverKey)} onMouseLeave={() => setHoveredCell(null)} className={`p-1 px-2 border-r border-gray-300 text-right ${valueClass(pnConcept?.base)} ${hasPnData ? 'cursor-pointer' : ''} ${hoveredCell === pnHoverKey ? 'bg-amber-100' : ''}`}>{formatCurrency(pnConcept?.base)}</td>
                                    <td onClick={() => hasPnData && openDetailModal(concepto, 'pn')} onMouseEnter={() => hasPnData && setHoveredCell(pnHoverKey)} onMouseLeave={() => setHoveredCell(null)} className={`p-1 px-2 text-right font-semibold ${valueClass(pnConcept?.retencion)} ${hasPnData ? 'cursor-pointer' : ''} ${hoveredCell === pnHoverKey ? 'bg-amber-100' : ''}`}>{formatCurrency(pnConcept?.retencion)}</td>
                                </tr>
                                );
                            })}
                             <tr className="bg-slate-900 text-white font-bold">
                                <td className="p-2 px-2 border-r border-slate-600 text-center">TOTAL</td>
                                <td className="p-2 px-2 border-r border-slate-600 text-right">{formatCurrency(totalPJ.base)}</td>
                                <td className="p-2 px-2 border-r border-slate-600 text-right">{formatCurrency(totalPJ.retencion)}</td>
                                <td className="p-2 px-2 border-r border-slate-600 text-right">{formatCurrency(totalPN.base)}</td>
                                <td className="p-2 px-2 text-right">{formatCurrency(totalPN.retencion)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="my-3 grid grid-cols-5 gap-px">
                        <div className="col-span-1 p-2 bg-slate-900 text-amber-400 font-bold text-center">RETE IVA</div>
                        <div className={`col-span-4 p-2 bg-slate-100 text-right font-bold text-lg ${valueClass(summary.reteIva)}`}>{formatCurrency(summary.reteIva)}</div>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-2 px-1">Contribuyentes exonerados de aportes (art. 114-1 E.T.)</h3>
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-900 text-white font-semibold">
                            <tr>
                                <th className="p-2 text-center w-28">Usar en Total</th>
                                <th className="p-2 text-left">Concepto</th>
                                <th className="p-2 text-right">Base</th>
                                <th className="p-2 text-right w-24">Tarifa</th>
                                <th className="p-2 text-right">Retención</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className={`border-l border-r border-gray-300 transition-colors ${autorretencionSource === 'calculada' ? 'bg-green-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <td className="p-2 text-center align-middle border-b border-gray-300">
                                    <input
                                        type="radio" name="autorretencion" id="autorretencion_calculada" value="calculada"
                                        checked={autorretencionSource === 'calculada'}
                                        onChange={(e) => updateAppState({ liquidacionAutorretencionSource: e.target.value as 'contable' | 'calculada', needsRegeneration: true })}
                                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300"
                                    />
                                </td>
                                <td className="p-2 align-middle border-b border-gray-300">
                                    <label htmlFor="autorretencion_calculada" className="font-medium text-slate-800 cursor-pointer">Cálculo sobre Ingresos</label>
                                </td>
                                <td className={`p-2 text-right align-middle border-b border-gray-300 ${valueClass(summary.exonerados.base_ing)}`}>{formatCurrency(summary.exonerados.base_ing)}</td>
                                <td className={`p-2 text-right align-middle border-b border-gray-300 text-slate-800`}>{tarifaIng.toFixed(2)}%</td>
                                <td className={`p-2 text-right align-middle border-b border-gray-300 font-semibold ${valueClass(summary.exonerados.retencion_ing_calc)}`}>{formatCurrency(summary.exonerados.retencion_ing_calc)}</td>
                            </tr>
                            <tr className={`border-l border-r border-b border-gray-300 transition-colors ${autorretencionSource === 'contable' ? 'bg-green-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <td className="p-2 text-center align-middle">
                                    <input
                                        type="radio" name="autorretencion" id="autorretencion_contable" value="contable"
                                        checked={autorretencionSource === 'contable'}
                                        onChange={(e) => updateAppState({ liquidacionAutorretencionSource: e.target.value as 'contable' | 'calculada', needsRegeneration: true })}
                                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300"
                                    />
                                </td>
                                <td className="p-2 align-middle">
                                    <label htmlFor="autorretencion_contable" className="font-medium text-slate-800 cursor-pointer">Registro Contable</label>
                                </td>
                                <td className={`p-2 text-right align-middle ${valueClass(summary.exonerados.base_aux)}`}>{formatCurrency(summary.exonerados.base_aux)}</td>
                                <td className={`p-2 text-right align-middle text-slate-800`}>{(summary.exonerados.tarifa_promedio * 100).toFixed(2)}%</td>
                                <td className={`p-2 text-right align-middle font-semibold ${valueClass(summary.exonerados.retencion_contab)}`}>{formatCurrency(summary.exonerados.retencion_contab)}</td>
                            </tr>
                        </tbody>
                    </table>
                   
                     <div className="mt-4 grid grid-cols-5 gap-px">
                        <div className="col-span-3 p-3 bg-green-600 text-white font-bold text-lg text-center">TOTAL A PAGAR</div>
                        <div className="col-span-2 p-3 bg-green-100 text-right font-bold text-2xl text-green-800">{formatCurrency(totalAPagar)}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiquidacionRetenciones;