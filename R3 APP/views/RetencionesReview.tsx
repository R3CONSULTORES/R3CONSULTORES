
import React, { useState, useContext, useMemo, useEffect } from 'react';
import CargaRetencionesStep from './retenciones/CargaRetencionesStep';
import AuditoriaRetenciones from './retenciones/AuditoriaRetenciones';
import LiquidacionRetenciones from './retenciones/LiquidacionRetenciones';
import ExploradorDocRetenciones from './retenciones/ExploradorDocRetenciones';
import { AppContext } from '../../contexts/AppContext';

type RetencionesTab = 'carga' | 'auditoria' | 'liquidacion' | 'exploradorDoc';

interface RetencionesReviewProps {
    embedded?: boolean;
}

const RetencionesReview: React.FC<RetencionesReviewProps> = ({ embedded = false }) => {
    const [activeTab, setActiveTab] = useState<RetencionesTab>('carga');
    const context = useContext(AppContext);

    if (!context) return null;
    const { appState, updateAppState } = context;
    const { razonSocial, periodo, tipoPeriodo, clients } = appState;

    const canExplore = !!(appState.files.retencion_auxiliar || appState.files.retencion_compras || appState.files.retencion_ventas || appState.files.retencion_base);

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

    const tabs = [
        { id: 'carga' as const, label: 'Carga de Archivos', needsRecalculation: false, disabled: false },
        { id: 'exploradorDoc' as const, label: 'Explorador Doc', needsRecalculation: false, disabled: !canExplore },
        { id: 'auditoria' as const, label: 'Auditoría de Retenciones', needsRecalculation: appState.retencionesNeedsRecalculation, disabled: false },
        { id: 'liquidacion' as const, label: 'Liquidación de Retenciones', needsRecalculation: appState.retencionesNeedsRecalculation, disabled: false },
    ];

    return (
        <>
            {!embedded && (
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-800">Módulo de Retenciones</h1>
                    <p className="text-slate-500 mt-1">Herramientas para auditar y liquidar retenciones en la fuente.</p>
                </header>
            )}

            {!embedded && (
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                     <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-3">Información del Período</h2>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="razon-social-retenciones" className="block text-sm font-medium text-slate-600 mb-1">Razón Social</label>
                            <input 
                                type="text" 
                                id="razon-social-retenciones"
                                list="clientes-list-retenciones"
                                value={razonSocial}
                                onChange={(e) => updateAppState({ razonSocial: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm bg-white text-slate-900 placeholder-slate-400"
                                placeholder="Escriba o seleccione un cliente"
                            />
                             <datalist id="clientes-list-retenciones">
                                {clients.map(client => (
                                    <option 
                                        key={client.id} 
                                        value={client.tipoPersona === 'Persona Jurídica' ? client.razonSocial : client.nombreCompleto} 
                                    />
                                ))}
                            </datalist>
                        </div>
                         <div>
                            <label htmlFor="periodo-retenciones" className="block text-sm font-medium text-slate-600 mb-1">Período a Verificar</label>
                            <select
                                id="periodo-retenciones"
                                value={periodo}
                                onChange={(e) => updateAppState({ periodo: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm bg-white text-slate-900"
                            >
                                {periodOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Período</label>
                             <div className="flex flex-col sm:flex-row rounded-md shadow-sm">
                                <button
                                    onClick={() => updateAppState({ tipoPeriodo: 'mensual' })}
                                    className={`flex-1 px-4 py-2 text-sm font-medium border rounded-t-md sm:rounded-l-md sm:rounded-tr-none transition-colors ${tipoPeriodo === 'mensual' ? 'bg-slate-900 text-white border-slate-900 z-10' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                                >
                                    Mensual
                                </button>
                                <button
                                    onClick={() => updateAppState({ tipoPeriodo: 'bimestral' })}
                                    className={`flex-1 px-4 py-2 text-sm font-medium border-l border-r border-b sm:border-t sm:border-b sm:border-l-0 transition-colors ${tipoPeriodo === 'bimestral' ? 'bg-slate-900 text-white border-slate-900 z-10' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                                >
                                    Bimestral
                                </button>
                                 <button
                                    onClick={() => updateAppState({ tipoPeriodo: 'cuatrimestral' })}
                                    className={`flex-1 px-4 py-2 text-sm font-medium border rounded-b-md sm:rounded-r-md sm:rounded-bl-none transition-colors ${tipoPeriodo === 'cuatrimestral' ? 'bg-slate-900 text-white border-slate-900 z-10' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                                >
                                    Cuatrimestral
                                </button>
                             </div>
                        </div>
                     </div>
                </div>
            )}

            <div className="mb-8">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                                disabled={tab.disabled}
                                className={`
                                    group relative inline-flex items-center py-2 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'border-amber-500 text-amber-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }
                                    ${tab.disabled ? 'text-slate-300 cursor-not-allowed' : ''}
                                `}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                            >
                                {tab.label}
                                {tab.needsRecalculation && (
                                    <span className="ml-2 px-2 py-0.5 bg-amber-400 text-slate-800 text-xs font-bold rounded-full">!</span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div>
               <div style={{ display: activeTab === 'carga' ? 'block' : 'none' }}>
                    <CargaRetencionesStep />
                </div>
                <div style={{ display: activeTab === 'exploradorDoc' ? 'block' : 'none' }}>
                    <ExploradorDocRetenciones />
                </div>
               <div style={{ display: activeTab === 'auditoria' ? 'block' : 'none' }}>
                    <AuditoriaRetenciones />
                </div>
                <div style={{ display: activeTab === 'liquidacion' ? 'block' : 'none' }}>
                    <LiquidacionRetenciones />
                </div>
            </div>
        </>
    );
};

export default RetencionesReview;
