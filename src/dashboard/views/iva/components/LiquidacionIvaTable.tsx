import React from 'react';
import { formatCurrency } from '@/dashboard/utils/formatters';
import type { AuxiliarData, DianData } from '@/dashboard/types';

interface LiquidacionIvaTableProps {
    auxiliar: AuxiliarData[];
    dian: DianData[];
    selectedIvaAccounts: Map<string, boolean>;
    onAccountSelectionChange: (cuenta: string) => void;
    ivaCalculado19: number;
    totalIvaGeneradoBrutoBp: number;
    totalIvaDevolucionesVentasBp: number;
    ivaVentasDian: number;
    ivaDevolucionesVentasDian: number;
    totalIvaDescontableBp: number;
    totalIvaTransitorioBp: number;
    totalIvaDevolucionesComprasBp: number;
    ivaComprasDian: number;
    ivaDevolucionesComprasDian: number;
}

const LiquidacionIvaTable: React.FC<LiquidacionIvaTableProps> = ({ 
    auxiliar, dian, selectedIvaAccounts, onAccountSelectionChange, ivaCalculado19,
    totalIvaGeneradoBrutoBp, totalIvaDevolucionesVentasBp, ivaVentasDian, ivaDevolucionesVentasDian,
    totalIvaDescontableBp, totalIvaTransitorioBp, totalIvaDevolucionesComprasBp, ivaComprasDian, ivaDevolucionesComprasDian
}) => {
    const formatDiff = (aux: number, dianVal: number) => {
        const diff = aux - dianVal;
        return (
            <span className={Math.abs(diff) > 1000 ? 'text-red-600 font-bold' : 'text-slate-800'}>
                {formatCurrency(diff)}
            </span>
        );
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2 flex items-center">
                <span className="bg-slate-900 text-white p-2 rounded-lg mr-3">📊</span>
                RESUMEN DE SALDOS IVA (BALANCE VS DIAN)
            </h3>
            
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-900 text-white font-bold text-xs">
                        <tr>
                            <th className="py-2 px-3 text-left w-[40%]">CONCEPTO</th>
                            <th className="py-2 px-3 text-right w-[20%]">AUXILIAR / BP</th>
                            <th className="py-2 px-3 text-right w-[20%]">DIAN</th>
                            <th className="py-2 px-3 text-right w-[20%]">DIFERENCIA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {/* IVA GENERADO */}
                        <tr className="bg-slate-50 font-bold"><td colSpan={4} className="py-2 px-3 text-slate-700">IVA GENERADO</td></tr>
                        <tr>
                            <td className="py-2 px-3 pl-6">IVA Generado Bruto</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(totalIvaGeneradoBrutoBp)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(ivaVentasDian)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatDiff(totalIvaGeneradoBrutoBp, ivaVentasDian)}</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 pl-6">(-) Devoluciones en Ventas</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(-totalIvaDevolucionesVentasBp)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(-ivaDevolucionesVentasDian)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatDiff(-totalIvaDevolucionesVentasBp, -ivaDevolucionesVentasDian)}</td>
                        </tr>
                        <tr className="bg-blue-50 font-bold">
                            <td className="py-2 px-3">NETO IVA GENERADO</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(totalIvaGeneradoBrutoBp - totalIvaDevolucionesVentasBp)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(ivaVentasDian - ivaDevolucionesVentasDian)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatDiff(totalIvaGeneradoBrutoBp - totalIvaDevolucionesVentasBp, ivaVentasDian - ivaDevolucionesVentasDian)}</td>
                        </tr>

                        {/* IVA DESCONTABLE */}
                        <tr className="bg-slate-50 font-bold"><td colSpan={4} className="py-2 px-3 text-slate-700 pt-4">IVA DESCONTABLE</td></tr>
                        <tr>
                            <td className="py-2 px-3 pl-6">IVA Descontable (Real)</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(totalIvaDescontableBp)}</td>
                            <td className="py-2 px-3 text-right font-mono" rowSpan={2}>{formatCurrency(ivaComprasDian)}</td>
                            <td className="py-2 px-3 text-right font-mono" rowSpan={2}>{formatDiff(totalIvaDescontableBp + totalIvaTransitorioBp, ivaComprasDian)}</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 pl-6 italic text-slate-500">IVA Transitorio (Pendiente Prorrateo)</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-500">{formatCurrency(totalIvaTransitorioBp)}</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 pl-6">(-) Devoluciones en Compras</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(-totalIvaDevolucionesComprasBp)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(-ivaDevolucionesComprasDian)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatDiff(-totalIvaDevolucionesComprasBp, -ivaDevolucionesComprasDian)}</td>
                        </tr>
                        <tr className="bg-green-50 font-bold">
                            <td className="py-2 px-3">NETO IVA DESCONTABLE</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(totalIvaDescontableBp + totalIvaTransitorioBp - totalIvaDevolucionesComprasBp)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(ivaComprasDian - ivaDevolucionesComprasDian)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatDiff(totalIvaDescontableBp + totalIvaTransitorioBp - totalIvaDevolucionesComprasBp, ivaComprasDian - ivaDevolucionesComprasDian)}</td>
                        </tr>

                        {/* SALDO FINAL */}
                        <tr className="bg-slate-900 text-white font-bold text-base">
                            <td className="py-3 px-3">SALDO A FAVOR / PAGAR ESTIMADO</td>
                            <td className="py-3 px-3 text-right font-mono">{formatCurrency((totalIvaGeneradoBrutoBp - totalIvaDevolucionesVentasBp) - (totalIvaDescontableBp + totalIvaTransitorioBp - totalIvaDevolucionesComprasBp))}</td>
                            <td className="py-3 px-3 text-right font-mono">{formatCurrency((ivaVentasDian - ivaDevolucionesVentasDian) - (ivaComprasDian - ivaDevolucionesComprasDian))}</td>
                            <td className="py-3 px-3 text-right font-mono">{formatDiff((totalIvaGeneradoBrutoBp - totalIvaDevolucionesVentasBp) - (totalIvaDescontableBp + totalIvaTransitorioBp - totalIvaDevolucionesComprasBp), (ivaVentasDian - ivaDevolucionesVentasDian) - (ivaComprasDian - ivaDevolucionesComprasDian))}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                <p className="text-sm text-amber-800 font-medium">
                    <span className="font-bold">Nota de Reconciliación:</span> Este resumen utiliza el Balance de Prueba (Auxiliar) como fuente de verdad contable y lo contrasta con la información capturada de la DIAN. Las diferencias en rojo deben ser auditadas.
                </p>
            </div>
        </div>
    );
};

export default LiquidacionIvaTable;
