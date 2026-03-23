
import React, { useMemo } from 'react';
import { formatCurrency } from '../../../utils/formatters';
import type { AuxiliarData, IvaDescontableCategory } from '../../../types';
import { normalizeTextForSearch, isDevolucionesComprasAccountFuzzy } from '../../../views/iva/ivaUtils';

interface SimulacionProrrateoProps {
    totalDescontable: number;
    totalTransitorio: number;
    filterType: 'descontable' | 'transitorio' | 'ambos';
    percentageDeductible: number;
    percentageExpense: number;
    auxiliarData: AuxiliarData[];
    selectedIvaAccounts: Map<string, boolean>;
    ivaDescontableClassification: Map<string, IvaDescontableCategory>;
}

export const SimulacionProrrateo: React.FC<SimulacionProrrateoProps> = ({
    totalDescontable,
    totalTransitorio,
    filterType,
    percentageDeductible,
    percentageExpense,
    auxiliarData,
    selectedIvaAccounts,
    ivaDescontableClassification
}) => {
    
    // 1. Summary Calculation
    const calculation = useMemo(() => {
        const factorDed = percentageDeductible / 100;
        const factorExp = percentageExpense / 100;

        let baseProrrateo = 0;
        let baseDirecta = 0;
        let labelProrrateo = "";
        let labelDirecta = "";

        if (filterType === 'descontable') {
            baseProrrateo = totalDescontable;
            baseDirecta = totalTransitorio;
            labelProrrateo = "IVA Descontable (240802)";
            labelDirecta = "IVA Transitorio (240803)";
        } else if (filterType === 'transitorio') {
            baseProrrateo = totalTransitorio;
            baseDirecta = totalDescontable;
            labelProrrateo = "IVA Transitorio (240803)";
            labelDirecta = "IVA Descontable (240802)";
        } else { // ambos
            baseProrrateo = totalDescontable + totalTransitorio;
            baseDirecta = 0;
            labelProrrateo = "Todo el IVA (Desc + Trans)";
            labelDirecta = "Ninguno";
        }

        const prorrateoToDecl = baseProrrateo * factorDed;
        const prorrateoToExp = baseProrrateo * factorExp;

        const directToDecl = baseDirecta; 
        const directToExp = 0; 

        return {
            prorrateo: { label: labelProrrateo, base: baseProrrateo, decl: prorrateoToDecl, exp: prorrateoToExp },
            directa: { label: labelDirecta, base: baseDirecta, decl: directToDecl, exp: directToExp },
            total: {
                base: baseProrrateo + baseDirecta,
                decl: prorrateoToDecl + directToDecl,
                exp: prorrateoToExp + directToExp
            }
        };
    }, [totalDescontable, totalTransitorio, filterType, percentageDeductible, percentageExpense]);

    // 2. Detailed Breakdown Calculation
    const detailedRows = useMemo(() => {
        if (!auxiliarData) return [];

        const accountsAgg = new Map<string, { nombre: string, base: number, type: 'Desc' | 'Trans' }>();

        auxiliarData.forEach(row => {
            if (!row.Cuenta.startsWith('2408')) return;
            if (!selectedIvaAccounts.get(row.Cuenta)) return;
            if (ivaDescontableClassification.get(row.Cuenta) === 'no_tener_en_cuenta') return;
            
            if (isDevolucionesComprasAccountFuzzy(row.Cuenta)) return; 
            const normalized = normalizeTextForSearch(row.Cuenta);
            if (normalized.includes('devoluciones en ventas')) return;

            const code = row.Cuenta.split(' ')[0];
            let type: 'Desc' | 'Trans' | null = null;
            
            if (code.startsWith('240802')) type = 'Desc';
            else if (code.startsWith('240803')) type = 'Trans';
            
            if (!type) return;

            if (row.Debitos > 0) {
                const current = accountsAgg.get(row.Cuenta) || { 
                    nombre: row.Cuenta.substring(code.length).trim(), 
                    base: 0,
                    type 
                };
                current.base += row.Debitos;
                accountsAgg.set(row.Cuenta, current);
            }
        });

        const rows = Array.from(accountsAgg.entries()).map(([cuenta, data]) => {
            let isProrated = false;

            if (filterType === 'ambos') {
                isProrated = true;
            } else if (filterType === 'descontable' && data.type === 'Desc') {
                isProrated = true;
            } else if (filterType === 'transitorio' && data.type === 'Trans') {
                isProrated = true;
            }

            const decl = isProrated ? data.base * (percentageDeductible / 100) : data.base;
            const exp = isProrated ? data.base * (percentageExpense / 100) : 0;

            return {
                cuenta,
                nombre: data.nombre,
                type: data.type,
                treatment: isProrated ? 'Prorrateo' : '100%',
                base: data.base,
                decl,
                exp
            };
        });

        return rows.sort((a, b) => b.base - a.base);

    }, [auxiliarData, selectedIvaAccounts, ivaDescontableClassification, filterType, percentageDeductible, percentageExpense]);

    return (
        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            {/* Summary Header */}
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Simulación de Impacto</h4>
            </div>
            
            {/* Summary Table */}
            <table className="w-full text-xs">
                <thead className="bg-white border-b border-slate-100">
                    <tr>
                        <th className="py-2 px-2 text-left font-semibold text-slate-500">Concepto</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-500">Base</th>
                        <th className="py-2 px-2 text-right font-semibold text-emerald-600">A Declaración</th>
                        <th className="py-2 px-2 text-right font-semibold text-red-600">Al Gasto</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {/* Row 1: Prorated */}
                    <tr>
                        <td className="py-2 px-2 text-slate-700">
                            <span className="block font-bold">Sometido a Prorrateo</span>
                            <span className="text-[10px] text-slate-500">{calculation.prorrateo.label}</span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-600">{formatCurrency(calculation.prorrateo.base)}</td>
                        <td className="py-2 px-2 text-right font-mono text-emerald-600 bg-emerald-50/50">
                            {formatCurrency(calculation.prorrateo.decl)}
                            <div className="text-[9px] opacity-70">{percentageDeductible.toFixed(1)}%</div>
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-red-600 bg-red-50/50">
                            {formatCurrency(calculation.prorrateo.exp)}
                            <div className="text-[9px] opacity-70">{percentageExpense.toFixed(1)}%</div>
                        </td>
                    </tr>

                    {/* Row 2: Direct */}
                    {calculation.directa.base > 0 && (
                        <tr>
                            <td className="py-2 px-2 text-slate-700">
                                <span className="block font-bold">Pasa Directo (100%)</span>
                                <span className="text-[10px] text-slate-500">{calculation.directa.label}</span>
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-600">{formatCurrency(calculation.directa.base)}</td>
                            <td className="py-2 px-2 text-right font-mono text-emerald-600 bg-emerald-50/50">
                                {formatCurrency(calculation.directa.decl)}
                                <div className="text-[9px] opacity-70">100%</div>
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-300 bg-red-50/50">
                                $ 0
                            </td>
                        </tr>
                    )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                        <td className="py-2 px-2 text-slate-800">TOTAL FINAL</td>
                        <td className="py-2 px-2 text-right font-mono text-slate-800">{formatCurrency(calculation.total.base)}</td>
                        <td className="py-2 px-2 text-right font-mono text-emerald-700 border-l border-slate-200">{formatCurrency(calculation.total.decl)}</td>
                        <td className="py-2 px-2 text-right font-mono text-red-700 border-l border-slate-200">{formatCurrency(calculation.total.exp)}</td>
                    </tr>
                </tfoot>
            </table>

            {/* Separator */}
            <div className="h-px bg-slate-200 my-0"></div>

            {/* Detailed Breakdown */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Detalle de Cuentas</h4>
                <span className="text-[10px] text-slate-400">{detailedRows.length} cuentas procesadas</span>
            </div>

            <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="py-2 px-2 text-left font-semibold">Cuenta / Nombre</th>
                            <th className="py-2 px-2 text-center font-semibold">Tipo</th>
                            <th className="py-2 px-2 text-center font-semibold">Tratamiento</th>
                            <th className="py-2 px-2 text-right font-semibold">Base</th>
                            <th className="py-2 px-2 text-right font-semibold text-emerald-600 bg-emerald-50">Declaración</th>
                            <th className="py-2 px-2 text-right font-semibold text-red-600 bg-red-50">Gasto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {detailedRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2 px-2 text-slate-700 max-w-[150px]">
                                    <div className="font-bold text-slate-800">{row.cuenta.split(' ')[0]}</div>
                                    <div className="truncate text-slate-500 text-[10px]" title={row.nombre}>{row.nombre}</div>
                                </td>
                                <td className="py-2 px-2 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${row.type === 'Desc' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                        {row.type}
                                    </span>
                                </td>
                                <td className="py-2 px-2 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${row.treatment === '100%' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                        {row.treatment}
                                    </span>
                                </td>
                                <td className="py-2 px-2 text-right font-mono text-slate-600">
                                    {formatCurrency(row.base)}
                                </td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                                    {formatCurrency(row.decl)}
                                </td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-red-700 bg-red-50/30">
                                    {formatCurrency(row.exp)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
