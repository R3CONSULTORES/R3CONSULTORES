
import React, { useState, useMemo } from 'react';
import { ChevronDownIcon } from '../../Icons'; 
import { formatCurrency } from '../../../utils/formatters'; 
import { normalizeTextForSearch } from '../../../views/iva/ivaUtils'; 
import type { AuxiliarData, IvaDescontableCategory } from '../../../types'; 

interface IvaDescontableBreakdownProps {
    auxiliarData: AuxiliarData[];
    selectedIvaAccounts: Map<string, boolean>;
    percentages: { gravado: number; otros: number };
    ivaDescontableClassification: Map<string, IvaDescontableCategory>;
}

export const IvaDescontableBreakdown: React.FC<IvaDescontableBreakdownProps> = ({ 
    auxiliarData, selectedIvaAccounts, percentages, ivaDescontableClassification 
}) => {
    const [expandedRows, setExpandedRows] = useState(new Set<string>());

    const isDevolucionesVentasAccount = (accountName: string) => {
        const normalized = normalizeTextForSearch(accountName);
        return normalized.includes('devoluciones en ventas') && !normalized.includes('compras');
    };

    const classifyIvaAccount = (accountName: string): 'compras' | 'servicios' => {
        const normalized = normalizeTextForSearch(accountName);
        const serviceKeywords = ['servicio', 'honorario', 'arrendamiento', 'aseo', 'vigilancia', 'temporal', 'transporte'];
        return serviceKeywords.some(kw => normalized.includes(kw)) ? 'servicios' : 'compras';
    };

    const breakdown = useMemo(() => {
        const result = {
            descontable: { compras: 0, servicios: 0, accounts: { compras: [] as any[], servicios: [] as any[] } },
            transitorio: { compras: 0, servicios: 0, accounts: { compras: [] as any[], servicios: [] as any[] } },
        };
        const pDeclaracion = percentages.gravado / 100;
        const accounts = new Map<string, { nombre: string, valor: number }>();
        
        if (auxiliarData) {
            auxiliarData.forEach(row => {
                if (row.Cuenta.startsWith('2408') && selectedIvaAccounts.get(row.Cuenta) && ivaDescontableClassification.get(row.Cuenta) !== 'no_tener_en_cuenta') {
                    const current = accounts.get(row.Cuenta) || { nombre: row.Cuenta.substring(row.Cuenta.split(' ')[0].length).trim(), valor: 0 };
                    current.valor += row.Debitos;
                    accounts.set(row.Cuenta, current);
                }
            });
        }
        
        accounts.forEach(({ nombre, valor }, cuenta) => {
            if (isDevolucionesVentasAccount(nombre)) return;
            const code = cuenta.split(' ')[0];
            const classification = classifyIvaAccount(nombre);
            const valorProrrateado = valor * pDeclaracion;
            const accountDetail = { cuenta, nombre, valor: valorProrrateado };
            
            if (code.startsWith('240802')) {
                result.descontable[classification] += valorProrrateado;
                result.descontable.accounts[classification].push(accountDetail);
            } else if (code.startsWith('240803')) {
                result.transitorio[classification] += valorProrrateado;
                result.transitorio.accounts[classification].push(accountDetail);
            }
        });
        return result;
    }, [auxiliarData, selectedIvaAccounts, percentages, ivaDescontableClassification]);

    const toggleRow = (key: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) newSet.delete(key); else newSet.add(key);
            return newSet;
        });
    };

    const renderDetailRow = (key: string, label: string, comprasValue: number, serviciosValue: number, accounts: { compras: any[], servicios: any[] }) => {
        const isExpanded = expandedRows.has(key);
        const total = comprasValue + serviciosValue;
        const hasDetails = accounts.compras.length > 0 || accounts.servicios.length > 0;

        return (
            <React.Fragment key={key}>
                <tr className={`border-b border-slate-100 transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                    <td className="p-4 font-medium text-slate-800">
                        <div className="flex items-center">
                            {hasDetails && (
                                <button onClick={() => toggleRow(key)} className={`mr-3 p-1 rounded-full bg-white border border-slate-200 hover:border-[#f6b034] text-slate-400 hover:text-[#f6b034] transition-all`}>
                                    <ChevronDownIcon className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                            {label}
                        </div>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600">{formatCurrency(comprasValue)}</td>
                    <td className="p-4 text-right font-mono text-slate-600">{formatCurrency(serviciosValue)}</td>
                    <td className="p-4 text-right font-mono font-bold text-[#000040]">{formatCurrency(total)}</td>
                </tr>
                {isExpanded && (
                    <tr>
                        <td colSpan={4} className="p-4 bg-slate-50 border-b border-slate-100">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">Cuentas Compras</h4>
                                    {accounts.compras.length > 0 ? (
                                        <ul className="text-xs space-y-1">
                                            {accounts.compras.map(acc => (
                                                <li key={acc.cuenta} className="flex justify-between">
                                                    <span className="text-slate-600">{acc.cuenta}</span>
                                                    <span className="font-mono text-slate-800">{formatCurrency(acc.valor)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-xs italic text-gray-400">Sin registros</p>}
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">Cuentas Servicios</h4>
                                     {accounts.servicios.length > 0 ? (
                                        <ul className="text-xs space-y-1">
                                            {accounts.servicios.map(acc => (
                                                <li key={acc.cuenta} className="flex justify-between">
                                                    <span className="text-slate-600">{acc.cuenta}</span>
                                                    <span className="font-mono text-slate-800">{formatCurrency(acc.valor)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-xs italic text-gray-400">Sin registros</p>}
                                </div>
                            </div>
                        </td>
                    </tr>
                )}
            </React.Fragment>
        );
    };

    const totalCompras = breakdown.descontable.compras + breakdown.transitorio.compras;
    const totalServicios = breakdown.descontable.servicios + breakdown.transitorio.servicios;
    const granTotal = totalCompras + totalServicios;

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="min-w-full text-sm">
                <thead className="bg-[#f8fafc] text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="p-4 text-left w-[40%]">Concepto IVA</th>
                        <th className="p-4 text-right">Compras (Bienes)</th>
                        <th className="p-4 text-right">Servicios</th>
                        <th className="p-4 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {renderDetailRow('descontable', 'DESCONTABLE NO PRORRATEADO', breakdown.descontable.compras, breakdown.descontable.servicios, breakdown.descontable.accounts)}
                    {renderDetailRow('transitorio', 'DESCONTABLE TRANSITORIO', breakdown.transitorio.compras, breakdown.transitorio.servicios, breakdown.transitorio.accounts)}
                    <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                        <td className="p-4">TOTAL</td>
                        <td className="p-4 text-right font-mono">{formatCurrency(totalCompras)}</td>
                        <td className="p-4 text-right font-mono">{formatCurrency(totalServicios)}</td>
                        <td className="p-4 text-right font-mono text-[#000040]">{formatCurrency(granTotal)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
