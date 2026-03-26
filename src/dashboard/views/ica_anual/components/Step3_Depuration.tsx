import React, { useState, useMemo } from 'react';
import { IcaAnualState, IcaAnualAction } from '../types';
import { processExcelFile, ParsedIncomeRow } from '../utils/excelParser';
import { analyzeOrphanRowsWithAI } from '../utils/aiClassifier';
import { formatCurrency } from '@/dashboard/utils/formatters';
import { DocumentArrowUpIcon, FunnelIcon, SparklesIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface Step3Props {
  state: IcaAnualState;
  dispatch: React.Dispatch<IcaAnualAction>;
}

export const Step3_Depuration: React.FC<Step3Props> = ({ state, dispatch }) => {
  const [rows, setRows] = useState<ParsedIncomeRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterText, setFilterText] = useState('');
  
  // A helper to pick the main CIIU to assign rows by default
  const defaultCiiu = state.activities.find(a => a.isMain) || state.activities[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!defaultCiiu) {
       alert("Error: No hay actividades creadas. Regrese al Paso 2.");
       return;
    }

    setIsProcessing(true);
    try {
      const parsedRows = await processExcelFile(file, state.config.municipality, defaultCiiu.id);
      setRows(parsedRows);
    } catch (err: any) {
      alert("Error procesando Excel: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
      setIsProcessing(true);
      try {
          const newRows = await analyzeOrphanRowsWithAI(rows, state.activities);
          setRows(newRows);
      } catch (err: any) {
          alert(err.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleUpdateRow = (id: string, updates: Partial<ParsedIncomeRow>) => {
    setRows(r => r.map(row => row.id === id ? { ...row, ...updates } : row));
  };

  // Aggregations for the top indicators
  const stats = useMemo(() => {
      let gross = 0;
      let returns = 0; // The debits on local gravable
      let foreign = 0;
      let excluded = 0;
      let exempt = 0;

      rows.forEach(r => {
          gross += r.credito;
          
          if (r.jurisdiccion === 'FORANEO') {
              foreign += r.ingresoNeto; // Net foraneo
              // We usually also take out foraneo from gross, or treat it as reduction. 
              // Wait, renglón 8 is Total Ingresos Ordinarios y Extra (Créditos totales de 4xx).
              // Renglón 9: Menos ingresos fuera del municipio (Netos o Brutos?) Anejamos netos de devoluciones foráneas.
          } else {
              // Local
              if (r.tratamiento === 'EXCLUIDO') excluded += r.ingresoNeto;
              else if (r.tratamiento === 'EXENTO') exempt += r.ingresoNeto;
              else {
                  // Gravado Local -> its debits are considered returns/deductions
                  returns += r.debito;
              }
          }
      });

      return { gross, returns, foreign, excluded, exempt };
  }, [rows]);

  const commitToGlobalStateAndProceed = () => {
      // 1. Distribute Net Taxable Base across activities
      // First, reset all bases
      const updatedActivities = state.activities.map(a => ({ ...a, taxableBase: 0 }));
      
      // Calculate Gravados Local distribution
      rows.forEach(r => {
          if (r.jurisdiccion === 'LOCAL' && r.tratamiento === 'GRAVADO') {
              const act = updatedActivities.find(a => a.id === r.ciiuId);
              if (act) {
                  // The real base is Credit - Debit. If negative, math catches it later.
                  act.taxableBase = (act.taxableBase || 0) + (r.credito - r.debito);
              }
          }
      });

      // 2. Prevent negative bases
      updatedActivities.forEach(a => {
          if (a.taxableBase! < 0) a.taxableBase = 0;
      });

      // 3. Update Reducer Arrays
      dispatch({ type: 'SET_ACTIVITIES', payload: updatedActivities });
      dispatch({ type: 'UPDATE_DEPURATION', payload: {
          grossIncome: stats.gross,
          returns: stats.returns,
          exports: 0, // Separate logic if needed
          assetSales: 0,
          excludedActivities: stats.excluded,
          exemptActivities: stats.exempt,
          otherDeductions: stats.foreign // Storing foreign here or creating new property
      } });

      // TODO: the reducer types could need 'foreign' to match exactly. I will reuse otherDeductions for it for now, 
      // or modify to have a clean JSON structure later.
      
      dispatch({ type: 'NEXT_STEP' });
  };

  const filteredRows = rows.filter(r => 
      r.cuenta.includes(filterText) || 
      r.descripcion.toLowerCase().includes(filterText.toLowerCase()) || 
      r.tercero.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* HEADER EXCEL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
              <h3 className="font-bold text-xl text-slate-800">Depuración de Cuentas (Ingresos)</h3>
              <p className="text-slate-500 text-sm mt-1">Sube tu auxiliar contable. Extraeremos automáticamente las cuentas de resultados (Nivel 4) y descontaremos devoluciones y movimientos foráneos.</p>
          </div>
          
          <div className="flex flex-col items-center">
             <label className="relative cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all flex items-center gap-2">
                 <DocumentArrowUpIcon className="w-5 h-5" />
                 {isProcessing ? "Analizando Excel..." : "Subir Auxiliar (.xlsx)"}
                 <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                 />
             </label>
          </div>
      </div>

      {/* DASHBOARD RESUMEN */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Bruto (Créditos)</span>
                <p className="font-mono font-bold text-slate-800 text-lg mt-1">{formatCurrency(stats.gross)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-blue-500">Foráneos (Fuera del MP)</span>
                <p className="font-mono font-bold text-blue-800 text-lg mt-1">{formatCurrency(stats.foreign)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <span className="text-[10px] uppercase font-bold text-red-500">Devol. Locales (Débitos)</span>
                <p className="font-mono font-bold text-red-800 text-lg mt-1">{formatCurrency(stats.returns)}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-600">Exentos / Excluidos</span>
                <p className="font-mono font-bold text-amber-800 text-lg mt-1">{formatCurrency(stats.exempt + stats.excluded)}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Base Gravable Neta</span>
                <p className="font-mono font-bold text-emerald-800 text-xl mt-1">
                    {formatCurrency(Math.max(0, stats.gross - stats.foreign - stats.returns - stats.exempt - stats.excluded))}
                </p>
            </div>
        </div>
      )}

      {/* TABLA DE AUDITORÍA */}
      {rows.length > 0 && (
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                 <div className="relative w-72">
                     <FunnelIcon className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                     <input 
                        type="text" 
                        placeholder="Buscar cuenta o detalle..." 
                        value={filterText}
                        onChange={e => setFilterText(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-slate-900 outline-none"
                     />
                 </div>
                 
                 <button 
                   onClick={handleAnalyzeWithAI}
                   disabled={isProcessing}
                   className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-bold shadow-sm disabled:opacity-50"
                 >
                    <SparklesIcon className="w-4 h-4" />
                    Analizar vacíos con IA
                 </button>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto">
               <table className="w-full text-xs text-left min-w-[max-content]">
                   <thead className="bg-slate-100 text-slate-600 sticky top-0 shadow-sm z-10">
                       <tr>
                           <th className="p-3">Cuenta</th>
                           <th className="p-3 w-64">Descripción / Tercero</th>
                           <th className="p-3 text-right">Crédito</th>
                           <th className="p-3 text-right">Débito</th>
                           <th className="p-3">Jurisdicción</th>
                           <th className="p-3">Actividad (CIIU)</th>
                           <th className="p-3">Tratamiento</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                       {filteredRows.map(r => (
                           <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                               <td className="p-3 font-mono text-slate-500">{r.cuenta}</td>
                               <td className="p-3 max-w-[250px] truncate" title={`${r.descripcion} | ${r.tercero}`}>
                                   <strong className="text-slate-800">{r.descripcion} {r.aiSuggested && <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded-sm">IA</span>}</strong>
                                   <div className="text-slate-400 text-[10px] mt-0.5">{r.tercero}</div>
                               </td>
                               <td className="p-3 text-right text-slate-800 font-mono">{r.credito > 0 ? formatCurrency(r.credito) : '-'}</td>
                               <td className="p-3 text-right text-red-500 font-mono">{r.debito > 0 ? formatCurrency(r.debito) : '-'}</td>
                               
                               <td className="p-3 w-32">
                                    <select 
                                        value={r.jurisdiccion} 
                                        onChange={e => handleUpdateRow(r.id, { jurisdiccion: e.target.value as any })}
                                        className={`w-full p-1.5 rounded-md font-bold ${r.jurisdiccion === 'FORANEO' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}
                                    >
                                        <option value="LOCAL">LOCAL</option>
                                        <option value="FORANEO">FORÁNEO</option>
                                    </select>
                               </td>
                               
                               <td className="p-3 w-40">
                                    <select 
                                        value={r.ciiuId}
                                        onChange={e => handleUpdateRow(r.id, { ciiuId: e.target.value })}
                                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium"
                                    >
                                        {state.activities.map(a => (
                                            <option key={a.id} value={a.id}>{a.code}</option>
                                        ))}
                                    </select>
                               </td>

                               <td className="p-3 w-32">
                                    <select 
                                        value={r.tratamiento} 
                                        onChange={e => handleUpdateRow(r.id, { tratamiento: e.target.value as any })}
                                        className={`w-full p-1.5 rounded-md font-bold text-center border-none focus:ring-0 ${r.tratamiento === 'EXENTO' ? 'bg-purple-100 text-purple-700' : r.tratamiento === 'EXCLUIDO' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                                    >
                                        <option value="GRAVADO">GRAVADO</option>
                                        <option value="EXCLUIDO">EXCLUIDO</option>
                                        <option value="EXENTO">EXENTO</option>
                                    </select>
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center rounded-b-2xl">
                 <div className="flex gap-2 items-center text-sm text-slate-500">
                     <InformationCircleIcon className="w-5 h-5 text-blue-500" />
                     {rows.length} movimientos procesados en RAM (Local).
                 </div>
            </div>
         </div>
      )}

      {/* Navegación Inferior */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
        <button 
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className="text-slate-500 font-bold hover:text-slate-800 transition-colors"
        >
          Volver a Actividades
        </button>
        <button 
          onClick={commitToGlobalStateAndProceed}
          disabled={rows.length === 0}
          className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          Calcular Bases {'>'}
        </button>
      </div>

    </div>
  );
};
