import React, { useReducer, useEffect, useState, useMemo } from 'react';
import { icaAnualReducer, initialState } from './icaAnualReducer';
import { icaService, IcaMunicipality } from './services/icaService';
import { formatCurrency } from '@/dashboard/utils/formatters';
import { ChevronRightIcon, ChevronLeftIcon, BuildingOfficeIcon, CalculatorIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import { Step2_Activities } from './components/Step2_Activities';
import { Step3_Depuration } from './components/Step3_Depuration';
import { Step4_Results } from './components/Step4_Results';

const IcaAnualView: React.FC = () => {
  const [state, dispatch] = useReducer(icaAnualReducer, initialState);
  const [municipios, setMunicipios] = useState<IcaMunicipality[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMunicipios = async () => {
      try {
        const data = await icaService.getMunicipios();
        setMunicipios(data);
      } catch (err) {
        console.error("Error cargando municipios:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMunicipios();
  }, []);

  // Derive the selected municipality's rates
  const selectedMunicipio = useMemo(() => 
    municipios.find(m => m.nombre === state.config.municipality),
    [municipios, state.config.municipality]
  );

  const renderStepHeader = () => {
    const steps = [
      { id: 0, label: 'Configuración', icon: BuildingOfficeIcon },
      { id: 1, label: 'Ingresos', icon: CalculatorIcon },
      { id: 2, label: 'Depuración', icon: DocumentCheckIcon },
      { id: 3, label: 'Resultado', icon: CalculatorIcon },
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center relative z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  state.step >= s.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <span className={`mt-2 text-xs font-semibold ${state.step >= s.id ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 -mt-6 transition-all ${state.step > idx ? 'bg-slate-900' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-[#f8fafc] min-h-screen">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">LIQUIDADOR ICA ANUAL</h1>
          <p className="text-slate-500 mt-1">Gestión profesional de impuestos municipales para R3 Consultores</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <span className="text-sm font-semibold text-slate-700">AÑO GRAVABLE: </span>
          <span className="text-sm font-bold text-slate-900">{state.config.year}</span>
        </div>
      </header>

      {renderStepHeader()}

      <main className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8">
          {state.step === 0 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">Configuración de la Empresa</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Municipio de Operación</label>
                  <select 
                    value={state.config.municipality}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const selectedMun = municipios.find(m => m.nombre === selectedName);
                      dispatch({ 
                        type: 'SET_CONFIG', 
                        payload: { 
                          municipality: selectedName, 
                          municipalityId: selectedMun?.id || '' 
                        } 
                      });
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900 font-medium"
                  >
                    <option value="">Seleccione un municipio...</option>
                    {municipios.map(m => (
                      <option key={m.id} value={m.nombre}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Año Gravable</label>
                   <input 
                    type="number" 
                    value={state.config.year}
                    onChange={(e) => dispatch({ type: 'SET_CONFIG', payload: { year: parseInt(e.target.value) } })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900 font-medium"
                   />
                </div>
              </div>
              <button 
                onClick={() => dispatch({ type: 'NEXT_STEP' })}
                disabled={!state.config.municipality}
                className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                EMPEZAR LIQUIDACIÓN
                <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {state.step > 0 && <div className="hidden">Espacio reservado para debugging si es necesario.</div>}

          {state.step === 1 && (
            <Step2_Activities state={state} dispatch={dispatch} />
          )}

          {state.step === 2 && (
            <Step3_Depuration state={state} dispatch={dispatch} />
          )}

          {state.step === 3 && (
            <Step4_Results 
              state={state} 
              dispatch={dispatch} 
              avisosRate={selectedMunicipio?.avisos_tableros_rate ?? 15}
              bomberilRate={selectedMunicipio?.bomberil_rate ?? 0}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default IcaAnualView;
