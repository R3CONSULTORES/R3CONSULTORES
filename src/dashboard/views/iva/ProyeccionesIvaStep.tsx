
import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import { formatCurrency } from '@/dashboard/utils/formatters';
import type { SavedProyeccion, MonthlySnapshot } from '@/dashboard/types';
import { BoltIcon, CheckCircleIcon, ClockIcon, LockClosedIcon, XMarkIcon, ChevronDownIcon } from '@/dashboard/components/Icons';
import { normalizeTextForSearch, isDevolucionesComprasAccountFuzzy } from './ivaUtils';

// --- ICONS & HELPERS ---
const PencilSquareIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
    </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.49 1.45 49.196 49.196 0 00-15.774 0 .75.75 0 01-.49-1.45 48.818 48.818 0 013.876-.512v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
    </svg>
);

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// --- HELPER: PERIOD MAPPING ---
const getMonthsForPeriod = (periodo: string, tipo: string): number[] => {
    if (!periodo) return [0];
    
    // Mensual
    if (tipo === 'mensual') {
        const idx = MONTH_NAMES.indexOf(periodo);
        return idx !== -1 ? [idx] : [0];
    }
    
    // Bimestral
    if (tipo === 'bimestral') {
        if (periodo.includes('Enero')) return [0, 1];
        if (periodo.includes('Marzo')) return [2, 3];
        if (periodo.includes('Mayo')) return [4, 5];
        if (periodo.includes('Julio')) return [6, 7];
        if (periodo.includes('Septiembre')) return [8, 9];
        if (periodo.includes('Noviembre')) return [10, 11];
    }

    // Cuatrimestral
    if (tipo === 'cuatrimestral') {
        if (periodo.includes('1er')) return [0, 1, 2, 3];
        if (periodo.includes('2do')) return [4, 5, 6, 7];
        if (periodo.includes('3er')) return [8, 9, 10, 11];
    }

    return [0]; // Fallback
};

// --- HELPER: FIRESTORE SANITIZATION ---
// Elimina undefined recursivamente para evitar crashes en Firebase
const sanitizeData = (data: any): any => {
    return JSON.parse(JSON.stringify(data, (key, value) => {
        if (value === undefined) return null;
        return value;
    }));
};


// --- COMPONENTS ---

const ProyeccionesIvaStep: React.FC = () => {
    const context = useContext(AppContext);
    
    // --- LOCAL STATE ---
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [history, setHistory] = useState<MonthlySnapshot[]>([]);
    
    // Configuration Params (Persisted)
    const [saldoFavorAnterior, setSaldoFavorAnterior] = useState(0);
    const [metaPagar, setMetaPagar] = useState(0);
    const [coeficienteProrrateo, setCoeficienteProrrateo] = useState(100); 
    
    // Simulation Params (Transient)
    const [ajusteIngresosPct, setAjusteIngresosPct] = useState(0);
    const [ajusteComprasPct, setAjusteComprasPct] = useState(0);

    // Month Selection for Draft
    const [selectedDraftMonth, setSelectedDraftMonth] = useState<number | null>(null);

    // Keep track of the current projection ID to enable updates
    const [currentProjectionId, setCurrentProjectionId] = useState<string | null>(null);

    if (!context) return null;
    const { appState, saveProyeccion, updateProyeccion, updateAppState, showNotification, showError } = context;
    const { ivaLiquidationResult, files: { iva_auxiliar: auxiliar }, razonSocial, ivaPeriodo, ivaTipoPeriodo, ivaDescontableClassification } = appState;

    // --- 0. CALCULATE VALID MONTHS BASED ON PERIOD ---
    const validMonths = useMemo(() => getMonthsForPeriod(ivaPeriodo, ivaTipoPeriodo), [ivaPeriodo, ivaTipoPeriodo]);
    
    // Ensure draft month is valid for current period
    useEffect(() => {
        // If selected draft month is not in the valid range, reset it to the first valid month
        if (selectedDraftMonth === null || !validMonths.includes(selectedDraftMonth)) {
            setSelectedDraftMonth(validMonths[0]);
        }
    }, [validMonths, selectedDraftMonth]);

    // --- 1. LOAD HISTORY ---
    useEffect(() => {
        const existing = appState.savedProjections.find(p => p.clientName === razonSocial); 
        
        if (existing) {
            setCurrentProjectionId(existing.id); // Store ID for updates
            if (existing.history) {
                setHistory(existing.history);
            }
            if (existing.parametros) {
                setSaldoFavorAnterior(existing.parametros.saldoFavorAnterior || 0);
                setAjusteIngresosPct(existing.parametros.ajusteIngresosPct || 0);
                setAjusteComprasPct(existing.parametros.ajusteComprasPct || 0);
                setCoeficienteProrrateo((existing.parametros.coeficienteProrrateo || 1) * 100);
            }
            setMetaPagar(existing.metaDefinida || 0);
        } else {
            setCurrentProjectionId(null);
        }
    }, [appState.savedProjections, razonSocial]);


    // --- 2. CALCULATE CURRENT DRAFT (FROM RAM FILES) ---
    const currentDraftSnapshot = useMemo((): MonthlySnapshot | null => {
        // Defensive check: Ensure required data is present
        if (!ivaLiquidationResult?.ingresos || !auxiliar || selectedDraftMonth === null) return null;

        // A. Prorrateo REAL del mes actual (basado en archivo cargado)
        const ing = ivaLiquidationResult.ingresos;
        const totalIngresosProrrateo = ing.gravados.totalAuxiliar + ing.exentos.totalAuxiliar + ing.excluidos.totalAuxiliar + ing.noGravados.totalAuxiliar;
        const realProrationFactor = totalIngresosProrrateo > 0 ? (ing.gravados.totalAuxiliar / totalIngresosProrrateo) : 1;

        // B. Extraer Valores
        let rawGenBruto = 0;
        let rawDevVentas = 0;
        let rawDescBruto = 0;
        let rawDevCompras = 0;
        let reteIva = 0;
        let comprasBrutas = 0;

        auxiliar.forEach(row => {
             const code = row.Cuenta.split(' ')[0];
             const name = row.Cuenta.substring(code.length).trim();
             const normalizedName = normalizeTextForSearch(name);

             if (['5','6','7'].some(p => code.startsWith(p))) {
                 comprasBrutas += row.Debitos - row.Creditos;
             }

             if (!row.Cuenta.startsWith('2408') && !row.Cuenta.startsWith('135517')) return;

             if (row.Cuenta.startsWith('135517')) {
                 reteIva += row.Debitos - row.Creditos;
                 return;
             }

             if (ivaDescontableClassification.get(row.Cuenta) === 'no_tener_en_cuenta') return;

             if (normalizedName.includes('iva gen')) {
                 rawGenBruto += row.Creditos;
             } else if (normalizedName.includes('devoluciones en ventas') && !normalizedName.includes('compras')) {
                 rawDevVentas += row.Debitos;
             } else if (isDevolucionesComprasAccountFuzzy(row.Cuenta)) {
                 rawDevCompras += row.Creditos;
             } else if (code.startsWith('240802') || code.startsWith('240803')) {
                 rawDescBruto += row.Debitos;
             }
        });

        const ivaGenerado = rawGenBruto + (rawDevCompras * realProrationFactor); 
        const ivaDescontable = rawDevVentas + (rawDescBruto * realProrationFactor); 

        return {
            periodLabel: MONTH_NAMES[selectedDraftMonth],
            monthIndex: selectedDraftMonth,
            isProjected: false,
            timestamp: Date.now(),
            ivaGenerado,
            ivaDescontable,
            reteIva,
            ingresosBrutos: totalIngresosProrrateo,
            comprasBrutas
        };
    }, [ivaLiquidationResult, auxiliar, ivaDescontableClassification, selectedDraftMonth]);


    // --- 3. TIMELINE & ACCUMULATION LOGIC (FILTERED BY PERIOD) ---
    const timelineData = useMemo(() => {
        const data: MonthlySnapshot[] = [];
        let accumulatedBalance = -saldoFavorAnterior; 

        // Important: We iterate only over validMonths for the visualization
        for (const i of validMonths) {
            // 1. Is it in History?
            const historyItem = history.find(h => h.monthIndex === i);
            
            if (historyItem) {
                data.push({ ...historyItem, status: 'closed' } as any);
                accumulatedBalance += (historyItem.ivaGenerado - historyItem.ivaDescontable - historyItem.reteIva);
            } 
            // 2. Is it the Current Draft?
            else if (currentDraftSnapshot && currentDraftSnapshot.monthIndex === i) {
                data.push({ ...currentDraftSnapshot, status: 'draft' } as any);
                accumulatedBalance += (currentDraftSnapshot.ivaGenerado - currentDraftSnapshot.ivaDescontable - currentDraftSnapshot.reteIva);
            } 
            // 3. Is it Future? (Project it)
            else {
                // Future/Empty
                data.push({
                     periodLabel: MONTH_NAMES[i],
                     monthIndex: i,
                     isProjected: true,
                     timestamp: 0,
                     ivaGenerado: 0, ivaDescontable: 0, reteIva: 0, ingresosBrutos: 0, comprasBrutas: 0,
                     status: 'future'
                 } as any);
            }
        }
        
        return { months: data, finalBalance: accumulatedBalance };
    }, [history, currentDraftSnapshot, saldoFavorAnterior, validMonths]);


    // --- 4. ACTIONS ---

    const handleCloseMonth = () => {
        if (!currentDraftSnapshot) return;
        
        if (history.some(h => h.monthIndex === currentDraftSnapshot.monthIndex)) {
            if (!window.confirm(`El mes de ${currentDraftSnapshot.periodLabel} ya está cerrado. ¿Desea sobrescribirlo?`)) {
                return;
            }
        }

        const newHistory = [
            ...history.filter(h => h.monthIndex !== currentDraftSnapshot.monthIndex),
            currentDraftSnapshot
        ].sort((a, b) => a.monthIndex - b.monthIndex);

        setHistory(newHistory);
        handleSave(newHistory);
        showNotification("Mes cerrado y guardado en el historial.");
    };

    const handleSave = (historyToSave: MonthlySnapshot[]) => {
        // Defensive check: Do not save if there is absolutely no data to save
        // Exception: If we are deleting, historyToSave might be empty, which is valid.

        // Construct basic payload
        const rawPayload = {
            clientName: razonSocial || 'Sin Cliente',
            periodo: ivaPeriodo || '',
            status: 'En Curso' as const,
            history: historyToSave || [],
            parametros: {
                saldoFavorAnterior: saldoFavorAnterior || 0,
                ajusteIngresosPct: ajusteIngresosPct || 0,
                ajusteComprasPct: ajusteComprasPct || 0,
                coeficienteProrrateo: (coeficienteProrrateo || 0) / 100
            },
            metaDefinida: metaPagar || 0,
            // EXPLICIT NULLS INSTEAD OF UNDEFINED
            snapshotMes1: null, 
            resultadoCalculado: null 
        };

        // Deep sanitize to remove any unexpected undefined values
        const cleanPayload = sanitizeData(rawPayload);

        if (currentProjectionId) {
            updateProyeccion(currentProjectionId, cleanPayload);
        } else {
            saveProyeccion(cleanPayload);
        }
    };

    const handleDeleteMonth = (index: number) => {
        const monthName = MONTH_NAMES[index];
        if (window.confirm(`¿Está seguro de eliminar el historial cerrado de ${monthName}? Esta acción recalculará los acumulados.`)) {
            // Filter locally first for immediate UI feedback
            const newHistory = history.filter(h => h.monthIndex !== index);
            setHistory(newHistory);
            
            // Persist to Firestore
            handleSave(newHistory);
            
            showNotification(`Historial de ${monthName} eliminado.`);
        }
    };

    const clearDraft = () => {
        updateAppState({
            files: {
                ...appState.files,
                iva_auxiliar: null,
                iva_dian: null
            },
            ivaLiquidationResult: null,
            ivaNeedsRecalculation: false
        });
    };

    // Calculate Totals for Display (Only for visible months in current period logic + previous balance)
    const totalAccumulated = timelineData.months
        .filter((m: any) => m.status === 'closed' || m.status === 'draft')
        .reduce((sum, m) => sum + ((m.ivaGenerado || 0) - (m.ivaDescontable || 0) - (m.reteIva || 0)), 0);
    
    const finalProjectedBalance = totalAccumulated - saldoFavorAnterior;
    const gap = Math.max(0, finalProjectedBalance - metaPagar);

    // Dynamic grid cols based on number of months to show
    const gridColsClass = validMonths.length <= 2 ? 'grid-cols-2 max-w-lg mx-auto' : 'grid-cols-4 max-w-3xl mx-auto';

    // --- RENDER ---

    return (
        <div className="space-y-8 pb-20 animate-fadeIn">
            
            {/* HEADER & CONFIG */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#1e293b]">Gestor de Historial Tributario</h2>
                        <p className="text-slate-500 text-sm">
                            Control del periodo: <span className="font-semibold text-slate-800">{ivaPeriodo}</span> ({selectedYear})
                        </p>
                    </div>
                     <div className="text-right">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Saldo a Favor Anterior</label>
                         <input 
                            type="text" 
                            value={saldoFavorAnterior.toLocaleString('es-CO')}
                            onChange={(e) => {
                                const val = Number(e.target.value.replace(/\D/g, ''));
                                setSaldoFavorAnterior(val);
                            }}
                            onBlur={() => handleSave(history)}
                            className="text-right border border-slate-300 rounded px-2 py-1 font-mono text-slate-700 w-40 focus:ring-amber-500 focus:border-amber-500"
                        />
                    </div>
                </div>

                {/* TIMELINE VISUALIZATION (FILTERED) */}
                <div className="relative py-8">
                    <div className="absolute top-1/2 left-10 right-10 h-1 bg-slate-100 -translate-y-1/2 rounded-full z-0"></div>
                    <div className={`grid ${gridColsClass} gap-8 relative z-10`}>
                        {timelineData.months.map((m: any) => (
                            <div key={m.monthIndex} className="flex flex-col items-center group relative">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all relative
                                    ${m.status === 'closed' ? 'bg-emerald-500 border-emerald-600 text-white shadow-md scale-110 cursor-pointer hover:bg-emerald-600' : 
                                      m.status === 'draft' ? 'bg-blue-500 border-blue-600 text-white shadow-md scale-110 animate-pulse-slow' : 
                                      'bg-white border-slate-300 text-slate-400'}
                                `}>
                                    {m.status === 'closed' && <CheckCircleIcon className="w-6 h-6"/>}
                                    {m.status === 'draft' && <PencilSquareIcon className="w-5 h-5"/>}
                                    {m.status === 'future' && (m.monthIndex + 1)}

                                    {/* Delete Button (Overlay on hover for closed items) */}
                                    {m.status === 'closed' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteMonth(m.monthIndex); }}
                                            className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1 border border-red-300 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                                            title="Eliminar este mes del historial"
                                        >
                                            <TrashIcon className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <span className={`text-xs mt-2 font-bold uppercase tracking-wider ${m.status !== 'future' ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {MONTH_NAMES[m.monthIndex]}
                                </span>
                                {m.status === 'draft' && <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded mt-1">Borrador</span>}
                                {m.status === 'closed' && <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded mt-1">Guardado</span>}
                                
                                {/* Hover Tooltip for Closed Months */}
                                {m.status === 'closed' && (
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-xs p-2 rounded shadow-lg z-20 w-40 text-center">
                                        <p className="font-bold border-b border-slate-600 pb-1 mb-1">{m.periodLabel}</p>
                                        <p>Saldo: {formatCurrency((m.ivaGenerado || 0) - (m.ivaDescontable || 0) - (m.reteIva || 0))}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* DASHBOARD SEMÁFORO (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Meta */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Meta de Pago (Máximo)</h3>
                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={metaPagar.toLocaleString('es-CO')}
                            onChange={(e) => setMetaPagar(Number(e.target.value.replace(/\D/g, '')))}
                            onBlur={() => handleSave(history)}
                            className="text-2xl font-bold text-slate-800 w-full border-none focus:ring-0 p-0 placeholder-slate-300"
                            placeholder="0"
                        />
                        <span className="text-slate-400 text-sm">COP</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Defina cuánto está dispuesto a pagar en el formulario final.</p>
                </div>

                {/* 2. Acumulado Real */}
                <div className="bg-slate-50 p-6 rounded-2xl shadow-inner border border-slate-200">
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Acumulado a la Fecha</h3>
                    <div className="text-3xl font-bold text-slate-800 font-mono">
                        {formatCurrency(finalProjectedBalance)}
                    </div>
                    <div className="flex gap-2 mt-2 text-xs">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            Histórico: {history.filter(h => validMonths.includes(h.monthIndex)).length} mes(es)
                        </span>
                        {currentDraftSnapshot && (
                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                + {currentDraftSnapshot.periodLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* 3. Semáforo / Gap */}
                <div className={`p-6 rounded-2xl shadow-sm border-2 transition-colors ${gap > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <h3 className={`${gap > 0 ? 'text-red-600' : 'text-green-600'} text-xs font-bold uppercase tracking-wider mb-2`}>
                        {gap > 0 ? 'ALERTA: Supera Meta' : 'META CUMPLIDA'}
                    </h3>
                    <div className={`text-3xl font-bold font-mono ${gap > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {gap > 0 ? formatCurrency(gap) : 'En rango'}
                    </div>
                    {gap > 0 && (
                        <p className="text-xs text-red-600 mt-2 font-medium">
                            Necesitas generar <strong>{formatCurrency(gap)}</strong> adicionales de IVA descontable (Compras aprox: {formatCurrency(gap / 0.19)}).
                        </p>
                    )}
                </div>
            </div>

            {/* ACTION AREA */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <BoltIcon className="w-5 h-5 text-amber-400" />
                        Acciones del Mes Actual
                    </h3>
                    
                    {/* Period Selector for Draft */}
                    {validMonths.length > 1 && (
                        <div className="flex gap-4 mt-3 bg-slate-800 p-1.5 rounded-lg w-fit">
                            {validMonths.map(m => (
                                <label key={m} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-slate-700 transition-colors">
                                    <input 
                                        type="radio" 
                                        name="draftMonth" 
                                        checked={selectedDraftMonth === m}
                                        onChange={() => setSelectedDraftMonth(m)}
                                        className="text-[#f6b034] focus:ring-[#f6b034] bg-slate-600 border-slate-500"
                                    />
                                    <span className={`text-sm ${selectedDraftMonth === m ? 'text-white font-bold' : 'text-slate-400'}`}>
                                        {MONTH_NAMES[m]}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                    
                    {currentDraftSnapshot ? (
                         <p className="text-slate-300 text-sm mt-2">
                            Datos cargados para <strong>{currentDraftSnapshot.periodLabel}</strong>. Saldo del mes: {formatCurrency((currentDraftSnapshot.ivaGenerado || 0) - (currentDraftSnapshot.ivaDescontable || 0) - (currentDraftSnapshot.reteIva || 0))}
                        </p>
                    ) : (
                        <p className="text-slate-400 text-sm mt-2 italic">
                            No hay datos en borrador. Cargue archivos en la pestaña 'Control' para procesar el mes seleccionado.
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                     {currentDraftSnapshot && (
                        <>
                             <button 
                                onClick={clearDraft}
                                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
                            >
                                Limpiar Borrador
                            </button>
                            <button 
                                onClick={handleCloseMonth}
                                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-emerald-500/30 transition-all font-bold flex items-center gap-2"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                Cerrar {currentDraftSnapshot.periodLabel}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* DETAILED HISTORY TABLE */}
            {history.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <h3 className="p-4 bg-slate-50 font-bold text-slate-700 border-b border-slate-200">Detalle Histórico</h3>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Mes</th>
                                <th className="p-4 text-right">Ingresos Brutos</th>
                                <th className="p-4 text-right">IVA Generado</th>
                                <th className="p-4 text-right">Compras Brutas</th>
                                <th className="p-4 text-right">IVA Descontable</th>
                                <th className="p-4 text-right">ReteIVA</th>
                                <th className="p-4 text-right">Saldo Mes</th>
                                <th className="p-4 text-center w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.filter(row => validMonths.includes(row.monthIndex)).map(row => (
                                <tr key={row.monthIndex} className="hover:bg-slate-50 group">
                                    <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                                        <LockClosedIcon className="w-3 h-3 text-slate-400" />
                                        {row.periodLabel}
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-600">{formatCurrency(row.ingresosBrutos || 0)}</td>
                                    <td className="p-4 text-right font-mono text-red-600">{formatCurrency(row.ivaGenerado || 0)}</td>
                                    <td className="p-4 text-right font-mono text-slate-600">{formatCurrency(row.comprasBrutas || 0)}</td>
                                    <td className="p-4 text-right font-mono text-green-600">{formatCurrency(row.ivaDescontable || 0)}</td>
                                    <td className="p-4 text-right font-mono text-green-600">{formatCurrency(row.reteIva || 0)}</td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                                        {formatCurrency((row.ivaGenerado || 0) - (row.ivaDescontable || 0) - (row.reteIva || 0))}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => handleDeleteMonth(row.monthIndex)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar historial"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {/* Current Draft Row if exists */}
                            {currentDraftSnapshot && validMonths.includes(currentDraftSnapshot.monthIndex) && (
                                <tr className="bg-blue-50/50 animate-pulse-slow">
                                     <td className="p-4 font-bold text-blue-800 flex items-center gap-2">
                                        <PencilSquareIcon className="w-3 h-3" />
                                        {currentDraftSnapshot.periodLabel} (Borrador)
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-600">{formatCurrency(currentDraftSnapshot.ingresosBrutos || 0)}</td>
                                    <td className="p-4 text-right font-mono text-red-600">{formatCurrency(currentDraftSnapshot.ivaGenerado || 0)}</td>
                                    <td className="p-4 text-right font-mono text-slate-600">{formatCurrency(currentDraftSnapshot.comprasBrutas || 0)}</td>
                                    <td className="p-4 text-right font-mono text-green-600">{formatCurrency(currentDraftSnapshot.ivaDescontable || 0)}</td>
                                    <td className="p-4 text-right font-mono text-green-600">{formatCurrency(currentDraftSnapshot.reteIva || 0)}</td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                                        {formatCurrency((currentDraftSnapshot.ivaGenerado || 0) - (currentDraftSnapshot.ivaDescontable || 0) - (currentDraftSnapshot.reteIva || 0))}
                                    </td>
                                    <td></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProyeccionesIvaStep;
