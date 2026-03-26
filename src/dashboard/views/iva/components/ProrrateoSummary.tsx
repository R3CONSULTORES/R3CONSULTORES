import React from 'react';
import { formatCurrency } from '@/dashboard/utils/formatters';
import type { IvaSectionResult } from '@/dashboard/types';

interface ProrrateoSummaryProps {
    ingresosData: IvaSectionResult;
    ventaActivosFijos: number;
    onVentaActivosFijosChange: (value: number) => void;
    percentages: { gravado: number; otros: number };
}

const ProrrateoSummary: React.FC<ProrrateoSummaryProps> = ({ ingresosData, ventaActivosFijos, onVentaActivosFijosChange, percentages }) => {
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
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="border border-gray-400">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-900 text-white font-bold">
                        <tr>
                            <th colSpan={3} className="py-2 px-3 text-center text-base">PROPORCIONALIDAD INGRESOS</th>
                        </tr>
                        <tr className="bg-slate-700">
                            <th className="py-2 px-3 text-left w-[60%] font-bold">TOTAL INGRESOS BRUTOS PARA PRORRATEO</th>
                            <th className="py-2 px-3 text-right font-mono">{formatCurrency(totalIngresosProrrateo)}</th>
                            <th className="w-[20%]"></th>
                        </tr>
                        <tr className="bg-slate-600 font-semibold">
                            <th colSpan={3} className="py-1 px-3 text-center tracking-widest">PROPORCIÓN</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-800 bg-white">
                        <tr className="border-t border-gray-300">
                            <td className="py-2 px-3 font-medium">TOTAL INGRESOS BRUTOS GRAVADOS</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(brutoGravado)}</td>
                            <td className="py-2 px-3 text-right font-mono bg-gray-200">{formatPercentage(percentages.gravado)}</td>
                        </tr>
                        <tr className="border-t border-gray-300">
                            <td className="py-2 px-3 font-medium">Otros Ingresos (Exentos, Excluidos, No Gravados)</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(otrosIngresosBrutos)}</td>
                            <td className="py-2 px-3 text-right font-mono bg-gray-200">{formatPercentage(percentages.otros)}</td>
                        </tr>
                        <tr className="border-t border-gray-300">
                            <td className="py-2 px-3 font-medium">INGRESOS X VENTA DE ACTIVOS FIJOS</td>
                            <td className="py-2 px-3 text-right font-mono">
                                <input
                                    type="text"
                                    value={ventaActivosFijos === 0 ? '' : ventaActivosFijos.toLocaleString('es-CO')}
                                    onChange={handleInputChange}
                                    className="w-full p-1 border border-gray-300 rounded-md shadow-sm text-right font-mono text-slate-800 bg-white focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                                    placeholder="0"
                                />
                            </td>
                            <td className="py-2 px-3 text-right font-mono bg-gray-200">{formatPercentage(totalIngresosProrrateo > 0 ? (ventaActivosFijos / totalIngresosProrrateo) * 100 : 0)}</td>
                        </tr>
                    </tbody>
                    <tfoot className="bg-slate-200 font-bold text-slate-800">
                        <tr className="border-t-2 border-gray-400">
                            <td className="py-2 px-3">TOTAL</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(totalIngresosProrrateo + ventaActivosFijos)}</td>
                            <td className="py-2 px-3 text-right font-mono bg-gray-200">{formatPercentage(totalIngresosProrrateo > 0 ? ((totalIngresosProrrateo + ventaActivosFijos) / totalIngresosProrrateo) * 100: 0)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default ProrrateoSummary;
