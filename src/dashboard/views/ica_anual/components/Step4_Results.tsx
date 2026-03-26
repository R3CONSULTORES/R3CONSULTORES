import React, { useMemo, useState } from 'react';
import { IcaAnualState, IcaAnualAction } from '../types';
import { calculateIcaFormulario, IcaFormulario } from '../utils/icaAlgorithms';
import { generateIcaPDF } from '../utils/pdfExporter';
import { generatePapelesExcel } from '../utils/excelExporter';
import { formatCurrency } from '@/dashboard/utils/formatters';
import { DocumentArrowDownIcon, TableCellsIcon, CalculatorIcon } from '@heroicons/react/24/outline';

interface Step4Props {
  state: IcaAnualState;
  dispatch: React.Dispatch<IcaAnualAction>;
  avisosRate: number;
  bomberilRate: number;
}

const Row: React.FC<{ num: string; label: string; value: number; bold?: boolean; highlight?: string }> = ({ num, label, value, bold, highlight }) => (
  <tr className={`border-b border-slate-100 ${highlight || ''} ${bold ? 'font-bold bg-slate-50' : ''}`}>
    <td className="p-3 text-center text-xs font-mono text-slate-400 w-16">{num}</td>
    <td className="p-3 text-sm text-slate-700">{label}</td>
    <td className={`p-3 text-right font-mono ${bold ? 'text-lg text-slate-900' : 'text-slate-800'}`}>
      {formatCurrency(value)}
    </td>
  </tr>
);

export const Step4_Results: React.FC<Step4Props> = ({ state, dispatch, avisosRate, bomberilRate }) => {
  const [retenciones, setRetenciones] = useState(state.results.retentions);
  const [autoretenciones, setAutoretenciones] = useState(state.results.selfRetentions);
  const [anticipos, setAnticipos] = useState(state.results.advances);
  const [sanciones, setSanciones] = useState(state.results.sanctions);
  const [intereses, setIntereses] = useState(state.results.interest);

  const currentResults = useMemo(() => ({
    ...state.results,
    retentions: retenciones,
    selfRetentions: autoretenciones,
    advances: anticipos,
    sanctions: sanciones,
    interest: intereses,
  }), [retenciones, autoretenciones, anticipos, sanciones, intereses, state.results]);

  const formulario: IcaFormulario = useMemo(() => {
    return calculateIcaFormulario(state.activities, state.depuration, currentResults, avisosRate, bomberilRate);
  }, [state.activities, state.depuration, currentResults, avisosRate, bomberilRate]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn">
      {/* HEADER */}
      <div className="text-center bg-gradient-to-r from-slate-900 to-slate-700 text-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-extrabold tracking-tight">LIQUIDACIÓN PRIVADA DEL IMPUESTO DE INDUSTRIA Y COMERCIO</h2>
        <div className="flex justify-center gap-8 mt-4 text-sm opacity-80">
          <span>Municipio: <strong className="text-white">{state.config.municipality}</strong></span>
          <span>Año Gravable: <strong className="text-white">{state.config.year}</strong></span>
        </div>
      </div>

      {/* SECCIÓN B: DEPURACIÓN DE INGRESOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-800 text-white p-4 flex items-center gap-3">
          <CalculatorIcon className="w-5 h-5" />
          <h3 className="font-bold text-sm uppercase tracking-wider">Sección B — Depuración de Ingresos</h3>
        </div>
        <table className="w-full">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50">
            <tr>
              <th className="p-3 text-center w-16">Rng</th>
              <th className="p-3 text-left">Concepto</th>
              <th className="p-3 text-right w-48">Valor ($)</th>
            </tr>
          </thead>
          <tbody>
            <Row num="8" label="Total Ingresos Brutos Ordinarios y Extraordinarios" value={formulario.renglon8_totalBruto} />
            <Row num="9" label="(-) Ingresos obtenidos fuera del municipio" value={formulario.renglon9_fueraMunicipio} />
            <Row num="10" label="Total Ingresos en el Municipio" value={formulario.renglon10_ingresosLocales} bold />
            <Row num="11" label="(-) Devoluciones, rebajas y descuentos" value={formulario.renglon11_devoluciones} />
            <Row num="12" label="(-) Exportaciones" value={formulario.renglon12_exportaciones} />
            <Row num="13" label="(-) Venta de Activos Fijos" value={formulario.renglon13_activosFijos} />
            <Row num="14" label="(-) Actividades Excluidas" value={formulario.renglon14_excluidos} />
            <Row num="15" label="(-) Actividades Exentas" value={formulario.renglon15_exentos} highlight="bg-purple-50/50" />
            <Row num="16" label="TOTAL INGRESOS GRAVABLES" value={formulario.renglon16_baseGravable} bold highlight="bg-emerald-50" />
          </tbody>
        </table>
      </div>

      {/* SECCIÓN C: DISCRIMINACIÓN POR ACTIVIDADES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-800 text-white p-4 flex items-center gap-3">
          <TableCellsIcon className="w-5 h-5" />
          <h3 className="font-bold text-sm uppercase tracking-wider">Sección C — Discriminación por Actividad Económica</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50">
            <tr>
              <th className="p-3 text-left">Código CIIU</th>
              <th className="p-3 text-left">Descripción</th>
              <th className="p-3 text-right">Ingresos Gravados</th>
              <th className="p-3 text-center">Tarifa (x1000)</th>
              <th className="p-3 text-right">Impuesto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {formulario.seccionC.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-slate-800">{row.ciiuCode}</td>
                <td className="p-3 text-slate-600">{row.description}</td>
                <td className="p-3 text-right font-mono">{formatCurrency(row.ingresosGravados)}</td>
                <td className="p-3 text-center font-mono font-bold text-blue-700">{row.tarifa}</td>
                <td className="p-3 text-right font-mono font-bold">{formatCurrency(row.impuesto)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900 text-white font-bold">
            <tr>
              <td colSpan={4} className="p-4 text-right uppercase text-sm">Renglón 20 — Impuesto ICA</td>
              <td className="p-4 text-right font-mono text-lg">{formatCurrency(formulario.renglon20_impuestoIca)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* SECCIÓN D: COMPLEMENTARIOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-800 text-white p-4">
          <h3 className="font-bold text-sm uppercase tracking-wider">Sección D — Liquidación Complementaria</h3>
        </div>
        <table className="w-full">
          <tbody>
            <Row num="25" label={`Impuesto de Avisos y Tableros (${avisosRate}%)`} value={formulario.renglon25_avisosTableros} />
            <Row num="26" label={`Sobretasa Bomberil (${bomberilRate}%)`} value={formulario.renglon26_sobretasaBomberil} />
            <Row num="33" label="TOTAL IMPUESTO A CARGO" value={formulario.renglon33_totalImpuesto} bold highlight="bg-amber-50" />
          </tbody>
        </table>
      </div>

      {/* SECCIÓN E: DESCUENTOS Y SALDO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-800 text-white p-4">
          <h3 className="font-bold text-sm uppercase tracking-wider">Sección E — Descuentos y Saldo a Pagar</h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Retenciones practicadas (R34)', value: retenciones, setter: setRetenciones },
            { label: 'Autoretenciones (R35)', value: autoretenciones, setter: setAutoretenciones },
            { label: 'Anticipo año anterior (R36)', value: anticipos, setter: setAnticipos },
            { label: 'Sanciones (R37)', value: sanciones, setter: setSanciones },
            { label: 'Intereses de mora (R38)', value: intereses, setter: setIntereses },
          ].map((field, i) => (
            <div key={i}>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{field.label}</label>
              <input
                type="number"
                value={field.value}
                onChange={e => field.setter(Number(e.target.value) || 0)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-mono text-right focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
          ))}
        </div>

        {/* TOTAL FINAL */}
        <div className={`p-6 ${formulario.renglon39_totalPagar >= 0 ? 'bg-emerald-50 border-t-4 border-emerald-500' : 'bg-blue-50 border-t-4 border-blue-500'}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-slate-800 uppercase">
              {formulario.renglon39_totalPagar >= 0 ? 'Renglón 39 — Total a Pagar' : 'Renglón 39 — Saldo a Favor'}
            </span>
            <span className={`text-3xl font-extrabold font-mono ${formulario.renglon39_totalPagar >= 0 ? 'text-emerald-700' : 'text-blue-700'}`}>
              {formatCurrency(Math.abs(formulario.renglon39_totalPagar))}
            </span>
          </div>
        </div>
      </div>

      {/* BOTONES DE EXPORTACIÓN */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
        <button 
          onClick={() => generateIcaPDF(formulario, state.config)}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          Descargar Borrador PDF
        </button>
        <button 
          onClick={() => generatePapelesExcel(formulario, state.config, state.activities)}
          className="flex items-center justify-center gap-2 bg-white text-slate-800 font-bold py-3 px-8 rounded-xl shadow border-2 border-slate-200 hover:bg-slate-50 transition-all"
        >
          <TableCellsIcon className="w-5 h-5" />
          Exportar Papeles de Trabajo
        </button>
      </div>

      {/* Navegación */}
      <div className="flex justify-between items-center pt-6 border-t border-slate-200">
        <button
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className="text-slate-500 font-bold hover:text-slate-800 transition-colors"
        >
          Volver a Depuración
        </button>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="px-6 py-2 bg-red-50 text-red-700 font-bold rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
        >
          Nueva Liquidación
        </button>
      </div>
    </div>
  );
};
