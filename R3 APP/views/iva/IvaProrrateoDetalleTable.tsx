
import React, { useMemo } from 'react';
import type { AuxiliarData, IvaDescontableCategory } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { normalizeTextForSearch, isDevolucionesComprasAccountFuzzy } from './ivaUtils';

interface IvaProrrateoDetalleTableProps {
    auxiliarData: AuxiliarData[];
    percentages: { gravado: number; otros: number };
    selectedIvaAccounts: Map<string, boolean>;
    filterType: 'descontable' | 'transitorio' | 'ambos';
    ivaDescontableClassification: Map<string, IvaDescontableCategory>;
}

const IvaProrrateoDetalleTable: React.FC<IvaProrrateoDetalleTableProps> = ({ 
    auxiliarData, 
    percentages, 
    selectedIvaAccounts, 
    filterType,
    ivaDescontableClassification
}) => {

    const rows = useMemo(() => {
        const factorDeducible = percentages.gravado / 100;
        const accountsMap = new Map<string, { nombre: string; base: number }>();

        auxiliarData.forEach(row => {
            // 1. Filtros Básicos
            if (!row.Cuenta.startsWith('2408')) return;
            if (!selectedIvaAccounts.get(row.Cuenta)) return;
            if (ivaDescontableClassification.get(row.Cuenta) === 'no_tener_en_cuenta') return;

            // Ignorar Devoluciones en Ventas (se manejan en otro lado) y Devoluciones en Compras (son créditos)
            const normalizedName = normalizeTextForSearch(row.Cuenta);
            if (normalizedName.includes('devoluciones en ventas') && !normalizedName.includes('compras')) return;
            if (isDevolucionesComprasAccountFuzzy(row.Cuenta)) return;

            const code = row.Cuenta.split(' ')[0];
            const isDescontable = code.startsWith('240802');
            const isTransitorio = code.startsWith('240803');

            // 2. Filtro por Tipo (Radio Button)
            if (filterType === 'descontable' && !isDescontable) return;
            if (filterType === 'transitorio' && !isTransitorio) return;
            if (filterType === 'ambos' && (!isDescontable && !isTransitorio)) return;

            // 3. Agregación (Sumar Débitos)
            if (row.Debitos > 0) {
                const current = accountsMap.get(row.Cuenta) || { 
                    nombre: row.Cuenta.substring(code.length).trim(), 
                    base: 0 
                };
                current.base += row.Debitos;
                accountsMap.set(row.Cuenta, current);
            }
        });

        // 4. Cálculo de Prorrateo por Fila
        const result = Array.from(accountsMap.entries()).map(([cuenta, data]) => {
            const deducible = data.base * factorDeducible;
            const gasto = data.base - deducible; // Usar resta para cuadre matemático exacto
            return {
                cuenta,
                nombre: data.nombre,
                base: data.base,
                deducible,
                gasto
            };
        });

        return result.sort((a, b) => a.cuenta.localeCompare(b.cuenta));
    }, [auxiliarData, percentages, selectedIvaAccounts, filterType, ivaDescontableClassification]);

    const totals = useMemo(() => {
        return rows.reduce((acc, row) => ({
            base: acc.base + row.base,
            deducible: acc.deducible + row.deducible,
            gasto: acc.gasto + row.gasto
        }), { base: 0, deducible: 0, gasto: 0 });
    }, [rows]);

    if (rows.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mt-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex justify-between items-center">
                <span>Detalle de Distribución por Cuenta</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    Coeficiente: {percentages.gravado.toFixed(2)}%
                </span>
            </h3>
            
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-900 text-white">
                        <tr>
                            <th className="py-3 px-4 text-left font-semibold w-[15%]">Cuenta</th>
                            <th className="py-3 px-4 text-left font-semibold w-[35%]">Nombre de la Cuenta</th>
                            <th className="py-3 px-4 text-right font-semibold w-[16%]">Valor Bruto (IVA)</th>
                            <th className="py-3 px-4 text-right font-semibold w-[17%] bg-green-900/30 text-green-100">Parte a Declaración</th>
                            <th className="py-3 px-4 text-right font-semibold w-[17%] bg-orange-900/30 text-orange-100">Parte al Gasto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {rows.map((row, index) => (
                            <tr key={row.cuenta} className={index % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-gray-50 hover:bg-slate-100'}>
                                <td className="py-2 px-4 font-mono text-slate-800">{row.cuenta.split(' ')[0]}</td>
                                <td className="py-2 px-4 text-slate-800">{row.nombre}</td>
                                <td className="py-2 px-4 text-right font-mono text-slate-900 font-medium">
                                    {formatCurrency(row.base)}
                                </td>
                                <td className="py-2 px-4 text-right font-mono text-green-700 font-medium bg-green-50/30">
                                    {formatCurrency(row.deducible)}
                                </td>
                                <td className="py-2 px-4 text-right font-mono text-orange-700 font-medium bg-orange-50/30">
                                    {formatCurrency(row.gasto)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                        <tr>
                            <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wide">Totales</td>
                            <td className="py-3 px-4 text-right font-mono">{formatCurrency(totals.base)}</td>
                            <td className="py-3 px-4 text-right font-mono text-green-800 bg-green-100/50">{formatCurrency(totals.deducible)}</td>
                            <td className="py-3 px-4 text-right font-mono text-orange-800 bg-orange-100/50">{formatCurrency(totals.gasto)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default IvaProrrateoDetalleTable;
