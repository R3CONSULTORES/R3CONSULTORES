
import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import { ReviewIcon, PropertyTaxIcon, ScaleIcon, CheckCircleIcon, ArrowRightIcon, BoltIcon, DocumentChartBarIcon, ConfigIcon, TrendingUpIcon, ClockIcon } from '@/dashboard/components/Icons';
import ContableReview from './ContableReview';
import IvaReview from './IvaReview';
import RetencionesReview from './RetencionesReview';
import Informe from './Informe';
import Configuracion from './Configuracion';
import type { SavedProyeccion } from '@/dashboard/types';

type WorkspaceStep = 'setup' | 'hub' | 'contable' | 'iva' | 'retenciones' | 'informe' | 'config';

const ModuleCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    status: 'pending' | 'completed';
    onClick: () => void;
    description: string;
}> = ({ title, icon, status, onClick, description }) => (
    <div 
        onClick={onClick}
        className={`relative bg-white p-6 rounded-xl shadow-md border-2 transition-all cursor-pointer hover:shadow-lg group
            ${status === 'completed' ? 'border-green-500' : 'border-transparent hover:border-[#f6b034]'}
        `}
    >
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-white text-slate-400 border border-slate-100 group-hover:bg-[#f6b034]/20 group-hover:text-[#1e293b] group-hover:border-transparent transition-all'}`}>
                {icon}
            </div>
            {status === 'completed' && <CheckCircleIcon className="w-6 h-6 text-green-500" />}
        </div>
        <h3 className="text-lg font-bold text-[#1e293b] mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">{description}</p>
        <div className="flex items-center text-sm font-semibold text-[#1e293b] group-hover:text-[#f6b034] transition-colors">
            {status === 'completed' ? 'Repasar / Editar' : 'Iniciar Revisión'} 
            <ArrowRightIcon className="w-4 h-4 ml-1" />
        </div>
    </div>
);

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
}).format(value);

const ProjectionTrackingCard: React.FC<{ projection: SavedProyeccion, onClick: () => void }> = ({ projection, onClick }) => {
    // FIX: Safe access to snapshotMes1 properties using optional chaining and fallbacks
    // Use history as fallback if snapshotMes1 (legacy structure) is null
    const realIVA = projection.snapshotMes1?.ivaGeneradoReal 
        ?? projection.history?.find(h => !h.isProjected)?.ivaGenerado 
        ?? 0;

    const totalProjectedIVA = projection.resultadoCalculado?.totalesBimestre?.totalGenerado 
        ?? (realIVA > 0 ? realIVA * 2 : 1000000); // Avoid division by zero, decent default for visual

    const progress = Math.min(100, Math.max(0, (realIVA / totalProjectedIVA) * 100));

    const isClosed = projection.status === 'Cerrado';

    return (
        <div onClick={onClick} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-b-4 hover:border-b-[#f6b034] group h-full flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-20 transition-opacity">
                <TrendingUpIcon className="w-24 h-24 text-[#1e293b]" />
            </div>
            
            <div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <p className="text-[10px] font-bold text-[#1e293b] uppercase tracking-wide mb-1">Proyección Activa</p>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">{projection.periodo}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${isClosed ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-green-50 text-green-700 border-green-200 flex items-center gap-1'}`}>
                        {isClosed ? 'Cerrado' : <><ClockIcon className="w-3 h-3"/> En Curso</>}
                    </span>
                </div>

                <div className="space-y-4 relative z-10">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500 font-medium">Acumulado (Mes 1)</span>
                            <span className="font-mono font-bold text-slate-700">{formatCurrency(realIVA)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-[#1e293b] h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-end pt-3 border-t border-slate-100 mt-4 relative z-10">
                <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Meta de Pago</p>
                    <p className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(projection.metaDefinida || 0)}</p>
                </div>
                <span className="text-xs text-[#1e293b] font-bold group-hover:text-[#f6b034] transition-colors">
                    Ver Detalles &rarr;
                </span>
            </div>
        </div>
    );
};


const RevisionWorkspace: React.FC = () => {
    const context = useContext(AppContext);
    const [step, setStep] = useState<WorkspaceStep>(() => {
        // Check directly on init if we have a client and period set (e.g. from loading a revision)
        if (context && context.appState.razonSocial && context.appState.periodo) {
            return 'hub';
        }
        return 'setup';
    });
    const [modulesStatus, setModulesStatus] = useState({
        contable: 'pending' as 'pending' | 'completed',
        iva: 'pending' as 'pending' | 'completed',
        retenciones: 'pending' as 'pending' | 'completed',
    });

    // Local state for smart period selection
    const [periodType, setPeriodType] = useState<'mensual' | 'bimestral' | 'cuatrimestral'>('mensual');
    const [periodNumber, setPeriodNumber] = useState<number>(1); // 1-12 for monthly, 1-6 for bi, 1-3 for quatri
    const [selectedMonths, setSelectedMonths] = useState<number[]>([]); // 0-11 indices

    // --- ESTADOS PARA SELECTOR DE CLIENTE PERSONALIZADO ---
    const [isClientOpen, setIsClientOpen] = useState(false);
    const [clientSearch, setClientSearch] = useState("");
    const clientSelectorRef = useRef<HTMLDivElement>(null);

    // Cerrar el selector al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clientSelectorRef.current && !clientSelectorRef.current.contains(event.target as Node)) {
                setIsClientOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!context) return <div>Cargando...</div>;
    const { appState, updateAppState, showError } = context;

    // Auto-detect completion status based on data presence
    useEffect(() => {
        setModulesStatus({
            contable: appState.conciliacionResultados ? 'completed' : 'pending',
            iva: appState.ivaLiquidationResult ? 'completed' : 'pending',
            retenciones: appState.retencionesResult ? 'completed' : 'pending',
        });
    }, [appState.conciliacionResultados, appState.ivaLiquidationResult, appState.retencionesResult]);

    // Auto-configure period type based on client selection
    useEffect(() => {
        if (appState.razonSocial && appState.clients.length > 0) {
            const client = appState.clients.find(c => 
                (c.tipoPersona === 'Persona Jurídica' ? c.razonSocial : c.nombreCompleto) === appState.razonSocial
            );
            
            if (client) {
                const ivaFreq = client.responsabilidadesNacionales?.iva;
                if (ivaFreq === 'bimestral') {
                    setPeriodType('bimestral');
                    setPeriodNumber(1);
                } else if (ivaFreq === 'cuatrimestral') {
                    setPeriodType('cuatrimestral');
                    setPeriodNumber(1);
                } else {
                    setPeriodType('mensual');
                    setPeriodNumber(new Date().getMonth() + 1);
                }
            }
        }
    }, [appState.razonSocial, appState.clients]);

    // Update available months when period type or number changes
    useEffect(() => {
        let months: number[] = [];
        if (periodType === 'mensual') {
            months = [periodNumber - 1];
        } else if (periodType === 'bimestral') {
            const startMonth = (periodNumber - 1) * 2;
            months = [startMonth, startMonth + 1];
        } else if (periodType === 'cuatrimestral') {
            const startMonth = (periodNumber - 1) * 4;
            months = [startMonth, startMonth + 1, startMonth + 2, startMonth + 3];
        }
        setSelectedMonths(months);
    }, [periodType, periodNumber]);

    const handleStartWorkspace = () => {
        if (!appState.razonSocial) {
            showError("Por favor seleccione un Cliente.");
            return;
        }
        if (selectedMonths.length === 0) {
             showError("Por favor seleccione al menos un mes para revisar.");
             return;
        }

        // Construct the period string
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const selectedMonthNames = selectedMonths.sort((a,b) => a-b).map(m => monthNames[m]);
        
        let finalPeriodString = selectedMonthNames.join(" - ");
        if (periodType === 'bimestral') finalPeriodString += ` (Bimestre ${periodNumber})`;
        if (periodType === 'cuatrimestral') finalPeriodString += ` (Cuatrimestre ${periodNumber})`;
        
        updateAppState({ 
            periodo: finalPeriodString,
            tipoPeriodo: periodType, // Keep track of the base type in app state
            // We could store selectedMonths in appState if needed for logic later
            ivaPeriodo: finalPeriodString,
            ivaTipoPeriodo: periodType
        });

        setStep('hub');
    };

    const handleFullRevision = () => {
        setStep('contable');
    };

    const handleMonthToggle = (monthIndex: number) => {
        setSelectedMonths(prev => {
            if (prev.includes(monthIndex)) {
                return prev.filter(m => m !== monthIndex);
            } else {
                return [...prev, monthIndex].sort((a,b) => a-b);
            }
        });
    };

    // Find relevant projection for the current view
    const activeProjection = useMemo(() => {
        if (!appState.savedProjections || !appState.razonSocial) return null;
        // Find the most recent projection for this client
        return appState.savedProjections.find(p => p.clientName === appState.razonSocial);
    }, [appState.savedProjections, appState.razonSocial]);


    const renderSetup = () => {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        
        let periodOptions: { value: number, label: string }[] = [];
        let monthsInPeriod: number[] = [];

        if (periodType === 'mensual') {
             periodOptions = monthNames.map((m, i) => ({ value: i + 1, label: m }));
             monthsInPeriod = [periodNumber - 1];
        } else if (periodType === 'bimestral') {
            periodOptions = [1, 2, 3, 4, 5, 6].map(n => ({ value: n, label: `Bimestre ${n} (${monthNames[(n-1)*2]} - ${monthNames[(n-1)*2+1]})` }));
            const start = (periodNumber - 1) * 2;
            monthsInPeriod = [start, start + 1];
        } else if (periodType === 'cuatrimestral') {
             periodOptions = [1, 2, 3].map(n => ({ value: n, label: `Cuatrimestre ${n} (${monthNames[(n-1)*4]} - ${monthNames[(n*4)-1]})` }));
             const start = (periodNumber - 1) * 4;
             monthsInPeriod = [start, start + 1, start + 2, start + 3];
        }

        return (
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-[#1e293b]">Mesa de Trabajo</h1>
                    <p className="text-slate-500 mt-2">Configure el cliente y el periodo para iniciar una sesión de revisión integral.</p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-xl shadow-[#1e293b]/5 border-t-4 border-[#f6b034]">
                    <div className="grid grid-cols-1 gap-6 mb-8">
                        {/* Selector de Cliente Personalizado (Anti-Autocomplete) */}
                        <div className="relative" ref={clientSelectorRef}>
                            <label className="block text-sm font-bold text-[#1e293b] mb-2">1. Seleccione el Cliente</label>
                            
                            {/* TRIGGER (El DIV que parece input) */}
                            <div 
                                onClick={() => {
                                    setIsClientOpen(!isClientOpen);
                                    // Al abrir, si ya hay un cliente seleccionado, ponerlo en el buscador
                                    if (!isClientOpen && appState.razonSocial) setClientSearch(""); 
                                }}
                                className={`
                                    w-full bg-white cursor-pointer border rounded-xl px-4 py-3 flex items-center justify-between shadow-sm transition-all
                                    ${isClientOpen ? 'border-[#f6b034] ring-2 ring-[#f6b034]/20' : 'border-gray-200 hover:border-gray-300'}
                                `}
                            >
                                <span className={`text-sm font-medium ${appState.razonSocial ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {appState.razonSocial || 'Buscar por Razón Social o Nombre...'}
                                </span>
                                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isClientOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>

                            {/* MENÚ FLOTANTE (Solo visible si isClientOpen es true) */}
                            {isClientOpen && (
                                <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                                    {/* Buscador Interno */}
                                    <div className="p-3 bg-gray-50 border-b border-gray-100">
                                        <input 
                                            autoFocus
                                            type="text" 
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#f6b034]"
                                            placeholder="Filtrar lista..."
                                            value={clientSearch}
                                            onChange={(e) => setClientSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoComplete="off"
                                            name="client_search_unique_id_ws"
                                        />
                                    </div>
                                    
                                    {/* Lista de Resultados */}
                                    <ul className="max-h-60 overflow-y-auto custom-scrollbar">
                                        {appState.clients
                                            .filter(c => {
                                                const search = clientSearch.toLowerCase();
                                                const name = (c.razonSocial || c.nombreCompleto || '').toLowerCase();
                                                const nit = (c.nit || c.cedula || '').toLowerCase();
                                                return name.includes(search) || nit.includes(search);
                                            })
                                            .map(c => (
                                                <li 
                                                    key={c.id}
                                                    onClick={() => {
                                                        // Actualiza el estado global
                                                        updateAppState({ 
                                                            razonSocial: c.tipoPersona === 'Persona Jurídica' ? c.razonSocial : c.nombreCompleto,
                                                        });
                                                        setIsClientOpen(false);
                                                        setClientSearch("");
                                                    }}
                                                    className="px-4 py-3 hover:bg-[#f6b034]/10 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                                >
                                                    <div className="text-sm font-bold text-[#1e293b]">
                                                        {c.tipoPersona === 'Persona Jurídica' ? c.razonSocial : c.nombreCompleto}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        NIT: {c.nit || c.cedula}
                                                    </div>
                                                </li>
                                            ))
                                        }
                                        {appState.clients.length === 0 && (
                                            <li className="p-4 text-center text-gray-400 text-sm italic">No hay clientes registrados</li>
                                        )}
                                        {appState.clients.length > 0 && appState.clients.filter(c => {
                                            const search = clientSearch.toLowerCase();
                                            const name = (c.razonSocial || c.nombreCompleto || '').toLowerCase();
                                            const nit = (c.nit || c.cedula || '').toLowerCase();
                                            return name.includes(search) || nit.includes(search);
                                        }).length === 0 && (
                                            <li className="p-4 text-center text-gray-400 text-sm italic">No se encontraron resultados</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Period Configuration */}
                        <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-[#1e293b] mb-2">2. Período General</label>
                                    {/* FIX: Explicit white background and dark text */}
                                    <select 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#f6b034] focus:border-[#f6b034] outline-none bg-white text-gray-900"
                                        value={periodNumber}
                                        onChange={(e) => setPeriodNumber(Number(e.target.value))}
                                    >
                                        {periodOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#1e293b] mb-2">3. Meses a Revisar</label>
                                    {/* FIX: White background container */}
                                    <div className="grid grid-cols-2 gap-2 bg-white p-2 border border-gray-300 rounded-lg">
                                        {monthsInPeriod.map(mIndex => (
                                            <label key={mIndex} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-slate-50 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedMonths.includes(mIndex)}
                                                    onChange={() => handleMonthToggle(mIndex)}
                                                    className="w-4 h-4 text-[#1e293b] border-slate-300 rounded focus:ring-[#1e293b] accent-[#f6b034]"
                                                />
                                                <span className="text-sm text-gray-900">{monthNames[mIndex]}</span>
                                            </label>
                                        ))}
                                        {monthsInPeriod.length === 0 && <span className="text-xs text-gray-400 p-1">Seleccione un período...</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleStartWorkspace}
                            disabled={selectedMonths.length === 0 || !appState.razonSocial}
                            className="w-full bg-[#1e293b] text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-[#1a2332] hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            <BoltIcon className="w-6 h-6 text-[#f6b034]" />
                            Iniciar Sesión de Revisión
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderHub = () => {
        // --- CÁLCULO DE ESTADO REAL (SIN MOCK DATA) ---
        
        // 1. Revisión Contable
        const isContableComplete = !!appState.conciliacionResultados;
        const areContableFilesLoaded = !!(appState.files.auxiliar && appState.files.dian && appState.files.ventas && appState.files.compras);

        let contableProgress = 0;
        let contableStatusText = "Auditoría Pendiente";
        let contableRisks = 0;

        if (isContableComplete) {
            contableProgress = 100;
            contableStatusText = "Auditado";
            const res = appState.conciliacionResultados!;
            contableRisks = (res.ingresos?.length || 0) + (res.ivaGen?.length || 0) + (res.compras?.length || 0) + (res.ivaDesc?.length || 0);
        } else if (areContableFilesLoaded) {
            contableProgress = 50;
            contableStatusText = "Archivos Cargados";
        }

        // 2. Revisión IVA
        const isIvaComplete = !!appState.ivaLiquidationResult;
        const areIvaFilesLoaded = !!(appState.files.iva_auxiliar && appState.files.iva_dian);
        const hasIvaClassification = (appState.incomeAccountVatClassification && appState.incomeAccountVatClassification.size > 0);

        let ivaProgress = 0;
        let ivaStatusText = "Pendiente";
        const ivaTotalPagar = appState.ivaLiquidationResult?.resumen?.saldoAPagar || 0;

        if (isIvaComplete) {
            ivaProgress = 100;
            ivaStatusText = "Liquidado";
        } else if (hasIvaClassification) {
            ivaProgress = 60;
            ivaStatusText = "En Clasificación";
        } else if (areIvaFilesLoaded) {
            ivaProgress = 30;
            ivaStatusText = "Archivos Cargados";
        }

        // 3. Revisión Retenciones
        const isReteComplete = !!appState.retencionesResult;
        const areReteFilesLoaded = !!(appState.files.retencion_auxiliar && appState.files.retencion_base);

        let reteProgress = 0;
        let reteStatusText = "Pendiente";
        let reteRisks = 0;
        const totalRteFte = appState.retencionesResult?.filter(r => !r.omitted).reduce((acc, curr) => acc + (curr.retencionAplicada || 0), 0) || 0;

        if (isReteComplete) {
            reteProgress = 100;
            reteStatusText = "Auditado";
            reteRisks = appState.retencionesResult?.filter(r => !r.omitted).length || 0;
        } else if (areReteFilesLoaded) {
            reteProgress = 40;
            reteStatusText = "Archivos Cargados";
        }

        // 4. ICA Anual (Merged to workspace)
        const icaStatusText = activeProjection?.status === 'Cerrado' ? 'Cerrado' : (activeProjection ? 'En Curso' : 'Pendiente');
        const icaTotal = activeProjection?.metaDefinida || 0;

        // 5. Bloqueo Proyección (Flujo de Caja)
        const isProjectionUnlocked = contableProgress === 100 && ivaProgress === 100 && reteProgress === 100;

        // Custom Node Component for the Taller
        const WorkspaceNode = ({ title, icon, progress, statusText, risks, primaryMetric, primaryValue, onClick, isLocked = false, isIca = false }: any) => {
            return (
                <div 
                    onClick={isLocked ? undefined : onClick}
                    className={`relative w-72 p-5 rounded-2xl transition-all duration-300 flex flex-col justify-between group
                        ${isLocked ? 'bg-white/50 border-2 border-dashed border-slate-100 cursor-not-allowed opacity-70' : 'bg-[#1e293b]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] cursor-pointer hover:-translate-y-2 hover:border-[#f6b034]/50 hover:shadow-[#f6b034]/10'}
                    `}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${isLocked ? 'bg-slate-200 text-slate-400' : 'bg-[#f6b034]/20 text-[#f6b034] shadow-[0_0_15px_rgba(246,176,52,0.15)]'}`}>
                            {icon}
                        </div>
                        {isLocked ? (
                            <span className="bg-slate-100 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-200">Bloqueado</span>
                        ) : progress === 100 || isIca ? (
                            <span className="bg-[#f6b034]/10 text-[#f6b034] text-[10px] font-bold px-2 py-1 rounded-full border border-[#f6b034]/20 flex items-center gap-1">
                                <CheckCircleIcon className="w-3 h-3" /> {isIca ? icaStatusText : 'Completado'}
                            </span>
                        ) : (
                            <span className="bg-white/10 text-slate-300 text-[10px] font-bold px-2 py-1 rounded-full border border-white/10">
                                {statusText}
                            </span>
                        )}
                    </div>
                    
                    <div className="mb-4">
                        <h3 className={`text-lg font-bold mb-1 ${isLocked ? 'text-slate-500' : 'text-white'}`}>{title}</h3>
                        {!isLocked && primaryMetric && (
                            <div className="mt-2 bg-[#0f172a]/50 rounded-lg p-2 border border-white/5">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{primaryMetric}</p>
                                <p className="text-sm font-mono font-bold text-[#f6b034]">{formatCurrency(primaryValue)}</p>
                            </div>
                        )}
                        {isLocked && (
                            <p className="text-xs text-slate-400 mt-2">Complete los módulos anteriores para desbloquear.</p>
                        )}
                    </div>

                    {!isLocked && (
                        <div className="mt-auto border-t border-white/10 pt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-300 font-medium">Progreso</span>
                                <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-[#f6b034] h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                            <button className="text-white hover:text-[#f6b034] transition-colors p-1" title="Generar Micro-Informe PDF" onClick={(e) => { e.stopPropagation(); alert("Generando micro-informe PDF..."); }}>
                                <DocumentChartBarIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div className="pb-20">
                {/* HEADER WIDGET & TÍTULOS */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1e293b]">Taller de Liquidación</h1>
                        <p className="text-slate-500 text-lg mt-1">Ecosistema modular de validación e impuestos.</p>
                    </div>

                    {/* WIDGET DE RESUMEN TEMPORAL (LIQUID GLASS) */}
                    <div className="bg-[#1e293b] backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl flex flex-wrap items-center gap-4 sm:gap-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div>
                                <p className="text-[10px] text-[#f6b034] uppercase tracking-wider font-bold mb-0.5">Contexto Activo</p>
                                <p className="text-sm text-white font-semibold leading-tight">{appState.razonSocial}</p>
                                <p className="text-xs text-slate-400">{appState.periodo}</p>
                            </div>
                            <div className="h-10 w-px bg-white/10"></div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">IVA Prelim</p>
                                <p className="text-sm text-white font-mono font-bold leading-tight">{formatCurrency(ivaTotalPagar)}</p>
                            </div>
                            <div className="h-10 w-px bg-white/10"></div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">RteFte Prelim</p>
                                <p className="text-sm text-white font-mono font-bold leading-tight">{formatCurrency(totalRteFte)}</p>
                            </div>
                            <div className="h-10 w-px bg-white/10"></div>
                            <div className="flex gap-2">
                                <button onClick={() => setStep('config')} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Configuración">
                                    <ConfigIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => setStep('setup')} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Cambiar Cliente">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* THE NODE GRAPH CANVAS */}
                <div className="relative w-full max-w-5xl mx-auto py-10 flex flex-col items-center">
                    {/* Level 1: Contable */}
                    <div className="z-10 relative">
                        <WorkspaceNode 
                            title="Auditoría Contable" 
                            icon={<ReviewIcon className="w-7 h-7" />} 
                            progress={contableProgress} 
                            statusText={contableStatusText} 
                            risks={contableRisks}
                            primaryMetric={contableProgress === 100 ? "Hallazgos" : undefined}
                            primaryValue={contableProgress === 100 ? contableRisks : undefined}
                            onClick={() => setStep('contable')} 
                        />
                    </div>

                    {/* Connecting Array down to Level 2 */}
                    <div className="relative w-full h-24 my-2 opacity-60">
                         {/* Central trunk */}
                         <div className="absolute left-1/2 top-0 bottom-1/2 w-0.5 bg-gradient-to-b from-[#f6b034] to-[#f6b034]/40 -translate-x-1/2"></div>
                         {/* Horizontal distributor */}
                         <div className="absolute left-[16%] right-[16%] top-1/2 h-0.5 bg-[#f6b034]/40"></div>
                         {/* Drops to nodes */}
                         <div className="absolute left-[16%] top-1/2 bottom-0 w-0.5 bg-gradient-to-b from-[#f6b034]/40 to-[#f6b034]/80 text-[#f6b034] flex justify-center items-end">
                            <div className="w-2 h-2 rounded-full bg-[#f6b034] translate-y-1 shadow-[0_0_8px_#f6b034]"></div>
                         </div>
                         <div className="absolute left-1/2 top-1/2 bottom-0 w-0.5 bg-gradient-to-b from-[#f6b034]/40 to-[#f6b034]/80 text-[#f6b034] flex justify-center items-end -translate-x-1/2">
                            <div className="w-2 h-2 rounded-full bg-[#f6b034] translate-y-1 shadow-[0_0_8px_#f6b034]"></div>
                         </div>
                         <div className="absolute right-[16%] top-1/2 bottom-0 w-0.5 bg-gradient-to-b from-[#f6b034]/40 to-[#f6b034]/80 text-[#f6b034] flex justify-center items-end">
                            <div className="w-2 h-2 rounded-full bg-[#f6b034] translate-y-1 shadow-[0_0_8px_#f6b034]"></div>
                         </div>
                    </div>

                    {/* Level 2: Liquidación Tax Cluster (IVA, Retenciones, ICA) */}
                    <div className="z-10 w-full flex flex-col md:flex-row justify-between gap-6 relative">
                        {/* Subtle background highlight for the cluster block */}
                        <div className="absolute inset-[-2rem] bg-[#1e293b]/[0.02] rounded-3xl border border-[#1e293b]/5 -z-10 pointer-events-none"></div>

                        <WorkspaceNode 
                            title="Revisión de IVA" 
                            icon={<PropertyTaxIcon className="w-7 h-7" />} 
                            progress={ivaProgress} 
                            statusText={ivaStatusText} 
                            primaryMetric="Saldo a Pagar"
                            primaryValue={ivaTotalPagar}
                            onClick={() => setStep('iva')} 
                        />
                         <WorkspaceNode 
                            title="Revisión Retenciones" 
                            icon={<ScaleIcon className="w-7 h-7" />} 
                            progress={reteProgress} 
                            statusText={reteStatusText} 
                            risks={reteRisks}
                            primaryMetric="Total RteFte"
                            primaryValue={totalRteFte}
                            onClick={() => setStep('retenciones')} 
                        />
                         <WorkspaceNode 
                            title="ICA Anual" 
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                                </svg>
                            } 
                            progress={activeProjection ? 100 : 0} 
                            statusText={icaStatusText} 
                            primaryMetric="Proyección ICA"
                            primaryValue={icaTotal}
                            isIca={true}
                            onClick={() => {
                                // Transition to Proyecciones ICA. If context function exists to flip module:
                                context.setActiveModule('ica-anual');
                            }} 
                        />
                    </div>

                    {/* Connecting line down to Level 3 */}
                    <div className="relative w-full h-20 my-2 opacity-60">
                         {/* Gather from 3 nodes - for simplicity just straight down from center node (Retenciones) */}
                         <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#f6b034]/80 to-[#f6b034]/20 border-r border-dashed border-[#f6b034] -translate-x-1/2 shadow-[0_0_10px_#f6b034]"></div>
                         <div className="absolute left-1/2 bottom-0 w-2 h-2 rounded-full bg-[#f6b034]/50 translate-y-1 -translate-x-1/2"></div>
                    </div>

                    {/* Level 3: Flujo de Caja (Proyecciones) */}
                    <div className="z-10 relative">
                        <WorkspaceNode 
                            title="Flujo de Caja" 
                            icon={<TrendingUpIcon className="w-7 h-7" />} 
                            progress={0} 
                            statusText="Bloqueado" 
                            isLocked={!isProjectionUnlocked}
                            onClick={() => context.setActiveModule('proyecciones-portfolio')} 
                        />
                    </div>
                </div>

                <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-xl shadow-lg mx-auto max-w-5xl group hover:border-[#f6b034]/30 transition-colors">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Informe Maestro Consolidado</h3>
                        <p className="text-slate-500 mt-1">Generar documento maestro con auditoría integral, hallazgos y liquidaciones.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                             onClick={handleFullRevision}
                             className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Ver Resumen Global
                        </button>
                        <button 
                            onClick={() => setStep('informe')}
                            className="px-8 py-3 bg-[#1e293b] text-white font-bold rounded-xl hover:bg-[#0f172a] hover:shadow-[0_8px_20px_rgba(246,176,52,0.3)] transition-all flex items-center gap-2 relative overflow-hidden group/btn"
                        >
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#f6b034]/0 via-[#f6b034]/20 to-[#f6b034]/0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></span>
                            <DocumentChartBarIcon className="w-5 h-5 text-[#f6b034]" />
                            <span className="relative z-10 text-[#f6b034]">Descargar Master PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderModuleWrapper = (Component: React.FC<{ embedded?: boolean; defaultClientName?: string }>, moduleKey: keyof typeof modulesStatus | 'config', title: string) => (
        <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-6 bg-[#1e293b] p-4 rounded-lg text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <button onClick={() => setStep('hub')} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <div>
                        <h2 className="text-xl font-bold">{title}</h2>
                        <p className="text-xs text-slate-300">{appState.razonSocial} - {appState.periodo}</p>
                    </div>
                </div>
                <button 
                    onClick={() => setStep('hub')}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors flex items-center gap-2"
                >
                    <CheckCircleIcon className="w-4 h-4" />
                    {moduleKey === 'config' ? 'Volver' : 'Guardar y Volver'}
                </button>
            </div>
            <div className="bg-slate-100 rounded-xl">
                <Component embedded={true} defaultClientName={appState.razonSocial} />
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-6">
            {step === 'setup' && renderSetup()}
            {step === 'hub' && renderHub()}
            {step === 'contable' && renderModuleWrapper(ContableReview, 'contable', 'Revisión Contable')}
            {step === 'iva' && renderModuleWrapper(IvaReview, 'iva', 'Revisión de Impuesto a las Ventas')}
            {step === 'retenciones' && renderModuleWrapper(RetencionesReview, 'retenciones', 'Revisión de Retenciones')}
            {step === 'config' && renderModuleWrapper(Configuracion, 'config', 'Configuración de Cuentas')}
            {step === 'informe' && (
                <div className="animate-fadeIn">
                     <div className="flex items-center mb-4">
                        <button onClick={() => setStep('hub')} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                            Volver a la Mesa de Trabajo
                        </button>
                    </div>
                    <Informe />
                </div>
            )}
        </div>
    );
};

export default RevisionWorkspace;
