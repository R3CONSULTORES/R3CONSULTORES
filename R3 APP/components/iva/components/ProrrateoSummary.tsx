
import React from 'react';
import type { IvaSectionResult } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface ProrrateoSummaryProps {
    ingresosData: IvaSectionResult;
    ventaActivosFijos: number;
    onVentaActivosFijosChange: (value: number) => void;
    percentages: { gravado: number; otros: number };
}

export const ProrrateoSummary: React.FC<ProrrateoSummaryProps> = ({ ingresosData, ventaActivosFijos, onVentaActivosFijosChange, percentages }) => {
    const brutoGravado = ingresosData.gravados.totalAuxiliar;
    const otrosIngresosBrutos = ingresosData.exentos.totalAuxiliar + ingresosData.excluidos.totalAuxiliar + ingresosData.noGravados.totalAuxiliar;
    const totalIngresosProrrateo = brutoGravado + otrosIngresosBrutos;
    
    const formatPercentage = (value: number) => {
        if (isNaN(value) || !isFinite(value)) return '0,00%';
        return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        onVentaActivosFijosChange(Number(value) || 0);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Resumen de Proporcionalidad</h3>
            
            <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Concepto Ingresos</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor Base</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Participación</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {/* Row 1: Gravados */}
                        <tr className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-medium text-slate-700">
                                Ingresos Brutos Gravados
                            </td>
                            <td className="px-6 py-4 text-right font-mono tabular-nums text-slate-600">
                                {formatCurrency(brutoGravado)}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    {formatPercentage(percentages.gravado)}
                                </span>
                            </td>
                        </tr>

                        {/* Row 2: Otros */}
                        <tr className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-medium text-slate-700">
                                Otros Ingresos (Exentos, Excluidos, No Gravados)
                            </td>
                            <td className="px-6 py-4 text-right font-mono tabular-nums text-slate-600">
                                {formatCurrency(otrosIngresosBrutos)}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    {formatPercentage(percentages.otros)}
                                </span>
                            </td>
                        </tr>

                        {/* Row 3: Activos Fijos (Editable) */}
                        <tr className="bg-slate-50/30">
                            <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-2">
                                Ingresos x Venta Activos Fijos
                                <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 rounded text-slate-500 font-normal">Excluir</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="relative rounded-md shadow-sm max-w-[140px] ml-auto">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-500 sm:text-xs">$</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={ventaActivosFijos === 0 ? '' : ventaActivosFijos.toLocaleString('es-CO')}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-md border-gray-300 pl-7 pr-3 py-1.5 text-right font-mono text-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                        placeholder="0"
                                    />
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right text-xs text-slate-400 font-mono">
                                {formatPercentage(totalIngresosProrrateo > 0 ? (ventaActivosFijos / totalIngresosProrrateo) * 100 : 0)}
                            </td>
                        </tr>
                    </tbody>
                    <tfoot className="bg-slate-50">
                        <tr>
                            <td className="px-6 py-4 font-bold text-slate-800">
                                TOTAL BASE PRORRATEO
                            </td>
                            <td className="px-6 py-4 text-right font-bold font-mono tabular-nums text-slate-900">
                                {formatCurrency(totalIngresosProrrateo)}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                                100%
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs text-slate-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <p>
                    <span className="font-bold text-blue-700">Nota:</span> Los ingresos por venta de activos fijos se excluyen de la base de cálculo según normativa vigente.
                </p>
                <p>Total Ingresos + Activos Fijos: <span className="font-mono font-medium">{formatCurrency(totalIngresosProrrateo + ventaActivosFijos)}</span></p>
            </div>
        </div>
    );
};
