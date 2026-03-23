
import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import type { FileType, FileStatus, Client } from '@/dashboard/types';
import CargaStep from './contable/CargaStep';
import RevisionStep from './contable/RevisionStep'; 
import CoherenciaStep from './contable/CoherenciaStep'; 
import RevisionContableStep from './contable/RevisionContableStep'; 
import ValidacionStep from './contable/ValidacionStep';
import { AppContext } from '@/dashboard/contexts/AppContext';

import { ArrowUpTrayIcon, DocumentMagnifyingGlassIcon, UsersIcon, CheckIcon, ReviewIcon, ChevronDownIcon, SearchIcon } from '@/dashboard/components/Icons';

interface ContableReviewProps {
    embedded?: boolean;
}

// --- CUSTOM CLIENT SELECTOR (ANTI-AUTOCOMPLETE ARCHITECTURE) ---
// Este componente usa un DIV como disparador para evitar que el navegador sugiera datos.
// El input de búsqueda solo existe dentro del menú desplegable.
const CustomClientSelector: React.FC<{ 
    clients: Client[], 
    selectedClient: string, 
    onSelect: (clientName: string) => void 
}> = ({ clients, selectedClient, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filtrado
    const filtered = useMemo(() => {
        if (!searchTerm) return clients;
        const lower = searchTerm.toLowerCase();
        return clients.filter(c => {
            const name = c.tipoPersona === 'Persona Jurídica' ? c.razonSocial : c.nombreCompleto;
            const nit = c.nit || c.cedula || '';
            return (name?.toLowerCase() || '').includes(lower) || (nit || '').includes(lower);
        });
    }, [clients, searchTerm]);

    const handleSelectClient = (client: Client) => {
        const name = client.tipoPersona === 'Persona Jurídica' ? client.razonSocial : client.nombreCompleto;
        onSelect(name || '');
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            {/* 1. TRIGGER: DIV (OBLIGATORIO PARA EVITAR AUTOCOMPLETE EN VISTA INICIAL) */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full bg-white border rounded-xl px-4 py-3 flex justify-between items-center cursor-pointer transition-all duration-200 shadow-sm
                    ${isOpen ? 'border-[#f6b034] ring-2 ring-[#f6b034]/20' : 'border-gray-200 hover:border-gray-300'}
                `}
            >
                <span className={`text-sm truncate font-medium ${selectedClient ? 'text-gray-900' : 'text-gray-400'}`}>
                    {selectedClient || "Seleccione el Cliente..."}
                </span>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* 2. EL MENÚ FLOTANTE */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black/5 animate-fadeIn">
                    {/* Input de Búsqueda INTERNO (Solo visible al abrir) */}
                    <div className="p-3 bg-gray-50 border-b border-gray-100">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#f6b034] focus:ring-1 focus:ring-[#f6b034]"
                                placeholder="Escribe para filtrar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoComplete="off"
                                name="client_search_hidden_unique_id"
                                data-form-type="other"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    
                    {/* Lista */}
                    <ul className="max-h-60 overflow-y-auto custom-scrollbar-light">
                        {filtered.length > 0 ? (
                            filtered.map(client => {
                                const name = client.tipoPersona === 'Persona Jurídica' ? client.razonSocial : client.nombreCompleto;
                                return (
                                    <li
                                        key={client.id}
                                        onClick={() => handleSelectClient(client)}
                                        className="px-4 py-3 hover:bg-[#f6b034]/10 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                    >
                                        <div className="text-sm font-bold text-[#1e293b]">{name}</div>
                                        <div className="text-xs text-gray-500">NIT: {client.nit || client.cedula}</div>
                                    </li>
                                );
                            })
                        ) : (
                            <li className="p-4 text-center text-gray-400 text-sm italic">No hay resultados</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};


const ContableReview: React.FC<ContableReviewProps> = ({ embedded = false }) => {
    // CAMBIO 1: Definir estado con el nuevo ID unificado
    const [activeTab, setActiveTab] = useState<'carga' | 'explorador' | 'auditoria_integral' | 'validacion'>('carga');
        
    const context = useContext(AppContext);

    if (!context) {
        return <div>Loading context...</div>;
    }
    const { appState, updateAppState } = context;
    const { razonSocial, periodo, tipoPeriodo } = appState;

    const periodOptions = useMemo(() => {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const bimestres = ['Enero - Febrero', 'Marzo - Abril', 'Mayo - Junio', 'Julio - Agosto', 'Septiembre - Octubre', 'Noviembre - Diciembre'];
        const cuatrimestres = ['1er Cuatrimestre (Ene-Abr)', '2do Cuatrimestre (May-Ago)', '3er Cuatrimestre (Sep-Dic)'];

        switch (tipoPeriodo) {
            case 'mensual': return meses;
            case 'bimestral': return bimestres;
            case 'cuatrimestral': return cuatrimestres;
            default: return [];
        }
    }, [tipoPeriodo]);

    useEffect(() => {
        if (periodOptions.length > 0 && !periodOptions.includes(periodo)) {
             updateAppState({ periodo: periodOptions[0] });
        }
    }, [periodOptions, periodo, updateAppState]);

    const allBaseFilesLoaded = !!(appState.files.auxiliar && appState.files.compras && appState.files.ventas && appState.files.dian);
    
    const conciliacionCompleted = !!appState.conciliacionResultados;
    const coherenciaCompleted = !!appState.coherenciaContableResult;
    const revisionCompleted = conciliacionCompleted || coherenciaCompleted;

    // CAMBIO 2: Redefinir array de steps
    const steps = [
        { id: 'carga' as const, label: 'Carga', icon: <ArrowUpTrayIcon />, completed: allBaseFilesLoaded },
        { id: 'explorador' as const, label: 'Explorador', icon: <DocumentMagnifyingGlassIcon />, completed: false },
        { id: 'auditoria_integral' as const, label: 'Auditoría Integral', icon: <ReviewIcon />, completed: revisionCompleted },
        { id: 'validacion' as const, label: 'Validación', icon: <UsersIcon />, completed: !!appState.validationResult },
    ];

    const handleStepClick = (stepId: 'carga' | 'explorador' | 'auditoria_integral' | 'validacion') => {
        if (stepId === 'carga') {
             setActiveTab(stepId);
             return;
        }
        if (allBaseFilesLoaded) {
            setActiveTab(stepId);
        }
    };
    
    return (
        <>
            {!embedded && (
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Herramienta de Conciliación Contable</h1>
                    <p className="text-slate-500 mt-1">Siga los pasos para cargar, revisar y conciliar la información contable.</p>
                </header>
            )}
            
            {!embedded && (
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                     <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-3">Información del Período</h2>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Razón Social</label>
                            <CustomClientSelector 
                                clients={appState.clients} 
                                selectedClient={razonSocial} 
                                onSelect={(name) => updateAppState({ razonSocial: name })} 
                            />
                        </div>
                         <div>
                            <label htmlFor="periodo" className="block text-sm font-medium text-slate-600 mb-2">Período a Verificar</label>
                            <div className="relative">
                                <select
                                    id="periodo"
                                    value={periodo}
                                    onChange={(e) => updateAppState({ periodo: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#f6b034]/50 focus:border-[#f6b034] text-sm text-gray-900 cursor-pointer"
                                >
                                    {periodOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de Período</label>
                             <div className="flex rounded-xl shadow-sm border border-gray-200 bg-gray-50 p-1">
                                <button
                                    onClick={() => updateAppState({ tipoPeriodo: 'mensual' })}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${tipoPeriodo === 'mensual' ? 'bg-white text-[#1e293b] shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Mensual
                                </button>
                                <button
                                    onClick={() => updateAppState({ tipoPeriodo: 'bimestral' })}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${tipoPeriodo === 'bimestral' ? 'bg-white text-[#1e293b] shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Bimestral
                                </button>
                                 <button
                                    onClick={() => updateAppState({ tipoPeriodo: 'cuatrimestral' })}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${tipoPeriodo === 'cuatrimestral' ? 'bg-white text-[#1e293b] shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Cuatri
                                </button>
                             </div>
                        </div>
                     </div>
                </div>
            )}

            {/* Stepper Navigation */}
            <nav className="mb-10" aria-label="Progress">
                <ol role="list" className="flex justify-between items-center border border-slate-200 rounded-lg shadow-md bg-white p-2 space-x-2">
                    {steps.map((step, stepIdx) => {
                        const isCompleted = step.completed;
                        const isActive = activeTab === step.id;
                        const isEnabled = isCompleted || isActive || (step.id !== 'carga' && allBaseFilesLoaded);

                        return (
                            <li key={step.label} className={`flex-1 relative ${!isEnabled ? 'opacity-60' : ''}`}>
                                {isActive && (
                                    <div 
                                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0"
                                        style={{
                                            borderLeft: '8px solid transparent',
                                            borderRight: '8px solid transparent',
                                            borderBottom: '8px solid #ffffff'
                                        }}
                                        aria-hidden="true"
                                    ></div>
                                )}
                                <button
                                    onClick={() => handleStepClick(step.id)}
                                    disabled={!isEnabled}
                                    className={`
                                        w-full h-full flex flex-col sm:flex-row items-center justify-center text-center p-3 rounded-md transition-colors group
                                        ${isActive ? 'bg-amber-50' : (isEnabled ? 'hover:bg-slate-100' : '')}
                                        ${!isEnabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                >
                                    <span className={`
                                        flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 flex-shrink-0
                                        ${isActive ? 'border-amber-500 bg-amber-500' : (isCompleted ? 'border-green-500 bg-green-500' : (isEnabled ? 'border-slate-400 group-hover:border-slate-600' : 'border-slate-300 bg-slate-100'))}
                                        ${!isEnabled ? 'filter grayscale' : ''}
                                    `}>
                                        {isCompleted && !isActive ? 
                                            <CheckIcon className="w-6 h-6 text-white" /> : 
                                            <span className={`w-6 h-6 transition-colors ${isActive ? 'text-white' : (isEnabled ? 'text-slate-500' : 'text-slate-400')}`}>
                                                {step.icon}
                                            </span>
                                        }
                                    </span>
                                    <span className={`mt-2 sm:mt-0 sm:ml-3 font-medium text-xs transition-colors ${isActive ? 'text-amber-600' : (isCompleted ? 'text-green-600' : (isEnabled ? 'text-slate-700' : 'text-slate-500'))}`}>{step.label}</span>
                                </button>
                                {stepIdx < steps.length - 1 && (
                                    <div className="absolute top-1/2 right-0 transform -translate-y-1/2 -mr-3 hidden sm:block" aria-hidden="true">
                                        <svg className="h-5 w-5 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>


            <div className="bg-white p-1 rounded-lg">
                <div style={{ display: activeTab === 'carga' ? 'block' : 'none' }}>
                    <CargaStep />
                </div>
                <div style={{ display: activeTab === 'explorador' ? 'block' : 'none' }}>
                    <RevisionStep />
                </div>
                
                {/* --- CAMBIO 3: SECCIÓN UNIFICADA AUDITORÍA INTEGRAL --- */}
                {activeTab === 'auditoria_integral' && (
                    <div className="space-y-12 animate-in fade-in duration-300 pb-10">
                        
                        {/* SECCIÓN 1: CRUCES DIAN */}
                        <section className="scroll-mt-6" id="seccion-cruces">
                            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200">
                                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Cruce de Información Exógena</h2>
                                    <p className="text-sm text-slate-500">Contabilidad vs. Reportes DIAN</p>
                                </div>
                            </div>
                            
                            <RevisionContableStep /> 
                        </section>

                        {/* SECCIÓN 2: COHERENCIA */}
                        <section className="scroll-mt-6" id="seccion-coherencia">
                            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200">
                                <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Análisis de Coherencia</h2>
                                    <p className="text-sm text-slate-500">Naturaleza de cuentas y anomalías contables</p>
                                </div>
                            </div>

                            <CoherenciaStep />
                        </section>

                    </div>
                )}

                <div style={{ display: activeTab === 'validacion' ? 'block' : 'none' }}>
                    <ValidacionStep />
                </div>
            </div>
        </>
    );
};

export default ContableReview;
