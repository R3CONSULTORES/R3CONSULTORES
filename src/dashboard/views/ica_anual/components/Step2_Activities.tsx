import React, { useState, useEffect } from 'react';
import { IcaAnualState, IcaAnualAction, CiiuActivity } from '../types';
import { icaService, IcaTarifa } from '../services/icaService';
import { PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Step2Props {
  state: IcaAnualState;
  dispatch: React.Dispatch<IcaAnualAction>;
}

export const Step2_Activities: React.FC<Step2Props> = ({ state, dispatch }) => {
  const [availableTarifas, setAvailableTarifas] = useState<IcaTarifa[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Custom form inputs
  const [selectedCiiu, setSelectedCiiu] = useState('');
  const [manualTarifa, setManualTarifa] = useState<number | ''>('');
  const [manualCode, setManualCode] = useState('');
  const [manualDesc, setManualDesc] = useState('');

  useEffect(() => {
    if (state.config.municipalityId) {
      setLoading(true);
      icaService.getTarifasByMunicipio(state.config.municipalityId)
        .then(data => setAvailableTarifas(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [state.config.municipalityId]);

  const handleAddActivity = () => {
    let newActivity: CiiuActivity;
    
    if (selectedCiiu) {
      const tarifa = availableTarifas.find(t => t.codigo_ciiu === selectedCiiu);
      if (!tarifa) return;
      newActivity = {
        id: crypto.randomUUID(),
        code: tarifa.codigo_ciiu,
        description: tarifa.descripcion,
        rate: tarifa.tarifa_mil,
        isMain: state.activities.length === 0, 
        taxableBase: 0
      };
    } else {
      if (!manualCode || manualTarifa === '' || !manualDesc) return;
      newActivity = {
        id: crypto.randomUUID(),
        code: manualCode,
        description: manualDesc,
        rate: Number(manualTarifa),
        isMain: state.activities.length === 0,
        taxableBase: 0
      };
    }
    
    if (state.activities.some(a => a.code === newActivity.code)) {
      alert("La actividad ya está en la lista.");
      return;
    }

    dispatch({ type: 'SET_ACTIVITIES', payload: [...state.activities, newActivity] });
    setSelectedCiiu('');
    setManualCode('');
    setManualDesc('');
    setManualTarifa('');
  };

  const handleRemoveActivity = (id: string) => {
    const newActs = state.activities.filter(a => a.id !== id);
    if (newActs.length > 0 && !newActs.some(a => a.isMain)) {
      newActs[0].isMain = true;
    }
    dispatch({ type: 'SET_ACTIVITIES', payload: newActs });
  };

  const handleSetMain = (id: string) => {
    const newActs = state.activities.map(a => ({
      ...a,
      isMain: a.id === id
    }));
    dispatch({ type: 'SET_ACTIVITIES', payload: newActs });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900">Actividades Sujetas a Impuesto</h3>
            <p className="text-sm text-blue-700 mt-1">
              Agrega los códigos CIIU que aplican para <strong>{state.config.municipality}</strong> ({state.config.year}). Las tarifas por mil se cargarán automáticamente de nuestra base de datos territorial.
            </p>
          </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h4 className="font-bold text-slate-800 mb-4">Agregar Actividad</h4>
        
        {loading ? (
          <div className="text-sm text-slate-500 animate-pulse">Cargando matriz tarifaria del municipio...</div>
        ) : availableTarifas.length > 0 ? (
          <div className="flex gap-4 items-end flex-col sm:flex-row">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Buscar en el Acuerdo Municipal</label>
              <select 
                value={selectedCiiu}
                onChange={e => setSelectedCiiu(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
              >
                <option value="">-- Seleccionar Código CIIU --</option>
                {availableTarifas.map(t => (
                  <option key={t.codigo_ciiu} value={t.codigo_ciiu}>
                    {t.codigo_ciiu} - {t.descripcion.length > 70 ? t.descripcion.substring(0, 70) + '...' : t.descripcion} ({t.tarifa_mil}x1000)
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleAddActivity}
              disabled={!selectedCiiu}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <PlusIcon className="w-5 h-5" /> Agregar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
             <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
               No hay tarifas precargadas para este municipio. Ingresa la actividad manualmente.
             </p>
             <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CIIU</label>
                  <input type="text" value={manualCode} onChange={e=>setManualCode(e.target.value)} placeholder="Ej: 4711" className="w-full p-2.5 border rounded-xl bg-slate-50"/>
                </div>
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descripción</label>
                  <input type="text" value={manualDesc} onChange={e=>setManualDesc(e.target.value)} placeholder="Comercio al por menor..." className="w-full p-2.5 border rounded-xl bg-slate-50"/>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tarifa xMil</label>
                  <div className="flex gap-2">
                    <input type="number" step="0.1" value={manualTarifa} onChange={e=>setManualTarifa(Number(e.target.value))} placeholder="7.0" className="w-full text-right p-2.5 border rounded-xl bg-slate-50"/>
                    <button onClick={handleAddActivity} disabled={!manualCode || !manualDesc || manualTarifa===''} className="bg-slate-900 text-white p-2.5 rounded-xl disabled:opacity-50">
                        <PlusIcon className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {state.activities.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
           <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                  <tr>
                      <th className="p-4 w-24">CIIU</th>
                      <th className="p-4">Descripción</th>
                      <th className="p-4 text-center w-24">Tarifa</th>
                      <th className="p-4 text-center w-32">Principal</th>
                      <th className="p-4 text-center w-16">Quitar</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.activities.map(act => (
                  <tr key={act.id} className="hover:bg-slate-50 group">
                      <td className="p-4 font-bold text-slate-800">{act.code}</td>
                      <td className="p-4 text-slate-600">{act.description}</td>
                      <td className="p-4 text-center font-mono font-bold text-blue-700 bg-blue-50/50">{act.rate}</td>
                      <td className="p-4 text-center">
                        <input 
                          type="radio" 
                          checked={act.isMain} 
                          onChange={() => handleSetMain(act.id)} 
                          className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer" 
                        />
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleRemoveActivity(act.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Navegación Inferior */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
        <button 
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className="text-slate-500 font-bold hover:text-slate-800 transition-colors"
        >
          Volver a Configuración
        </button>
        <button 
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
          disabled={state.activities.length === 0}
          className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:transform-none"
        >
          Continuar a Depuración
        </button>
      </div>

    </div>
  );
};
