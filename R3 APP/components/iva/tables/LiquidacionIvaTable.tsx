

import React, { useMemo } from 'react';
import { formatCurrency } from '../../../utils/formatters'; 
import { normalizeTextForSearch, isDevolucionesComprasAccountFuzzy } from '../../../views/iva/ivaUtils'; 
import type { AuxiliarData, DianData, IvaDescontableCategory, LiquidationCalculations } from '../../../types'; 

interface LiquidacionIvaTableProps {
    auxiliar: AuxiliarData[];
    dian: DianData[];
    selectedIvaAccounts: Map<string, boolean>;
    onAccountSelectionChange: (cuenta: string) => void;
    ivaDescontableClassification: Map<string, IvaDescontableCategory>;
    calculations: LiquidationCalculations;
}

// --- NATIVE SVG ICONS ---

const CheckCircleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);

const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
);

// --- CUSTOM SWITCH COMPONENT ---
const IOSSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div 
        onClick={onChange}
        className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out flex items-center ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}
    >
        <div 
            className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </div>
);

// --- HELPER RENDERING FUNCTIONS ---

const renderDifference = (valBp: number, valDian: number) => {
    const diff = valBp - valDian;
    const isZero = Math.abs(diff) < 100; // Tolerancia $100

    if (isZero) {
        return (
            <div className="flex justify-end items-center text-slate-400 gap-1 bg-slate-50 px-2 py-1 rounded-md">
                <span className="text-xs font-bold">Ok</span>
                <CheckCircleIcon className="w-4 h-4" />
            </div>
        );
    }

    return (
        <div className="flex justify-end items-center text-red-600 gap-1 bg-red-50 px-2 py-1 rounded-md border border-red-100">
            <span className="font-bold font-mono text-sm">{formatCurrency(diff)}</span>
            <ExclamationTriangleIcon className="w-4 h-4 animate-pulse" />
        </div>
    );
};

export const LiquidacionIvaTable: React.FC<LiquidacionIvaTableProps> = ({ 
    auxiliar, selectedIvaAccounts, onAccountSelectionChange, ivaDescontableClassification, calculations
}) => {
    const { 
        ivaCalculado19, totalIvaGeneradoBrutoBp, totalIvaDevolucionesVentasBp, ivaVentasDian, ivaDevolucionesVentasDian,
        totalIvaDescontableBp, totalIvaTransitorioBp, totalIvaDevolucionesComprasBp, ivaComprasDian, ivaDevolucionesComprasDian
    } = calculations;

    // --- LOGIC ---
    const isIvaGeneradoAccount = (accountName: string) => {
        const normalized = normalizeTextForSearch(accountName);
        return normalized.includes('iva gen') || normalized.includes('iva generado');
    };
    const isDevolucionesVentasAccount = (accountName: string) => {
        const normalized = normalizeTextForSearch(accountName);
        return normalized.includes('devoluciones en ventas') && !normalized.includes('compras');
    };
    const isIvaDescontableAccount = (accountCode: string) => accountCode.startsWith('240802');
    const isIvaTransitorioAccount = (accountCode: string) => accountCode.startsWith('240803');
    
    const all2408Accounts = useMemo(() => {
        const accounts = new Map<string, { nombre: string, creditos: number, debitos: number }>();
        auxiliar.filter(row => row.Cuenta.startsWith('2408')).forEach(row => {
            const current = accounts.get(row.Cuenta) || { nombre: row.Cuenta.split(' ').slice(1).join(' ').trim(), creditos: 0, debitos: 0 };
            current.creditos += row.Creditos;
            current.debitos += row.Debitos;
            accounts.set(row.Cuenta, current);
        });
        return Array.from(accounts.entries()).map(([cuenta, data]) => ({ cuenta, ...data }));
    }, [auxiliar]);

    const ivaGeneradoAccounts = useMemo(() => all2408Accounts.filter(({ cuenta }) => isIvaGeneradoAccount(cuenta)), [all2408Accounts]);
    const ivaDevolucionesVentasAccounts = useMemo(() => all2408Accounts.filter(({ cuenta }) => isDevolucionesVentasAccount(cuenta)), [all2408Accounts]);
    
    const ivaDescontableAccounts = useMemo(() => all2408Accounts.filter(({ cuenta }) => {
        if (ivaDescontableClassification.get(cuenta) === 'no_tener_en_cuenta') return false;
        return isIvaDescontableAccount(cuenta.split(' ')[0]) && !isDevolucionesVentasAccount(cuenta) && !isDevolucionesComprasAccountFuzzy(cuenta);
    }), [all2408Accounts, ivaDescontableClassification]);

    const ivaTransitorioAccounts = useMemo(() => all2408Accounts.filter(({ cuenta }) => {
        if (ivaDescontableClassification.get(cuenta) === 'no_tener_en_cuenta') return false;
        return isIvaTransitorioAccount(cuenta.split(' ')[0]);
    }), [all2408Accounts, ivaDescontableClassification]);

    const ivaDevolucionesComprasAccounts = useMemo(() => all2408Accounts.filter(({ cuenta }) => isDevolucionesComprasAccountFuzzy(cuenta)), [all2408Accounts]);

    const totalIvaGeneradoNetoBp = totalIvaGeneradoBrutoBp - totalIvaDevolucionesVentasBp;
    const totalIvaGeneradoNetoDian = ivaVentasDian - ivaDevolucionesVentasDian;
    const totalIvaDescYTransBp = totalIvaDescontableBp + totalIvaTransitorioBp;
    const totalIvaDescontableNetoBp = totalIvaDescYTransBp - totalIvaDevolucionesComprasBp;
    const totalIvaDescontableNetoDian = ivaComprasDian - ivaDevolucionesComprasDian;
    
    return (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4 flex items-center gap-2">
                Resumen Liquidación IVA
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Contable vs DIAN</span>
            </h2>
            
            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm border-collapse">
                    <thead>
                        {/* HEADER GENERAL */}
                        <tr className="bg-slate-900 text-white">
                            <th className="p-3 border-r border-slate-700 text-center w-16">Incluir</th>
                            <th className="p-3 border-r border-slate-700 text-left w-32">Código</th>
                            <th className="p-3 border-r border-slate-700 text-left">Concepto / Cuenta</th>
                            <th className="p-3 border-r border-slate-700 text-right w-32">Valor BP</th>
                            <th className="p-3 border-r border-slate-700 text-right w-32">Valor DIAN</th>
                            <th className="p-3 text-right w-40">Diferencia</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* SECCIÓN: IVA GENERADO */}
                        <tr className="bg-slate-100/80">
                            <td colSpan={6} className="py-2 px-4 font-bold text-slate-700 text-xs uppercase tracking-wider">
                                1. IVA Generado (Ventas)
                            </td>
                        </tr>
                        
                        {ivaGeneradoAccounts.map(({ cuenta, nombre, creditos }) => (
                             <tr key={cuenta} className="hover:bg-slate-50 transition-colors">
                                <td className="p-2 text-center">
                                    <div className="flex justify-center">
                                        <IOSSwitch 
                                            checked={selectedIvaAccounts.get(cuenta) ?? false} 
                                            onChange={() => onAccountSelectionChange(cuenta)} 
                                        />
                                    </div>
                                </td>
                                <td className="p-2 font-mono text-slate-600 text-xs">{cuenta.split(' ')[0]}</td>
                                <td className="p-2 text-slate-700">{nombre}</td>
                                <td className="p-2 text-right font-mono text-slate-800">{formatCurrency(creditos)}</td>
                                <td className="p-2 bg-slate-50/50"></td>
                                <td className="p-2"></td>
                            </tr>
                        ))}
                        
                        {/* Subtotales Generado */}
                        <tr className="bg-blue-50/30 font-semibold text-slate-800 border-t border-slate-200">
                            <td colSpan={3} className="p-3 text-right text-xs uppercase">Total Generado Bruto</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(totalIvaGeneradoBrutoBp)}</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(ivaVentasDian)}</td>
                            <td className="p-3">{renderDifference(totalIvaGeneradoBrutoBp, ivaVentasDian)}</td>
                        </tr>

                        <tr className="bg-white">
                            <td colSpan={3} className="p-2 text-right text-xs text-slate-500">(-) Devoluciones en Ventas</td>
                            <td className="p-2 text-right font-mono text-red-600">{formatCurrency(-totalIvaDevolucionesVentasBp)}</td>
                            <td className="p-2 text-right font-mono text-red-600">{formatCurrency(-ivaDevolucionesVentasDian)}</td>
                            <td className="p-2">{renderDifference(-totalIvaDevolucionesVentasBp, -ivaDevolucionesVentasDian)}</td>
                        </tr>

                        <tr className="bg-slate-800 text-white font-bold">
                            <td colSpan={3} className="p-3 text-right">TOTAL IVA GENERADO NETO</td>
                            <td className="p-3 text-right font-mono text-lg">{formatCurrency(totalIvaGeneradoNetoBp)}</td>
                            <td className="p-3 text-right font-mono text-slate-300">{formatCurrency(totalIvaGeneradoNetoDian)}</td>
                            <td className="p-3 bg-slate-900">{renderDifference(totalIvaGeneradoNetoBp, totalIvaGeneradoNetoDian)}</td>
                        </tr>

                        {/* SECCIÓN: IVA DESCONTABLE */}
                        <tr><td colSpan={6} className="h-4 bg-white"></td></tr>
                        <tr className="bg-slate-100/80">
                            <td colSpan={6} className="py-2 px-4 font-bold text-slate-700 text-xs uppercase tracking-wider">
                                2. IVA Descontable (Compras)
                            </td>
                        </tr>

                        {ivaDescontableAccounts.map(({ cuenta, nombre, debitos }) => (
                             <tr key={cuenta} className="hover:bg-slate-50 transition-colors">
                                <td className="p-2 text-center">
                                    <div className="flex justify-center">
                                        <IOSSwitch 
                                            checked={selectedIvaAccounts.get(cuenta) ?? false} 
                                            onChange={() => onAccountSelectionChange(cuenta)} 
                                        />
                                    </div>
                                </td>
                                <td className="p-2 font-mono text-slate-600 text-xs">{cuenta.split(' ')[0]}</td>
                                <td className="p-2 text-slate-700">{nombre}</td>
                                <td className="p-2 text-right font-mono text-slate-800">{formatCurrency(debitos)}</td>
                                <td className="p-2 bg-slate-50/50"></td>
                                <td className="p-2"></td>
                             </tr>
                        ))}
                        
                        {ivaTransitorioAccounts.map(({ cuenta, nombre, debitos }) => (
                             <tr key={cuenta} className="hover:bg-slate-50 transition-colors bg-amber-50/30">
                                 <td className="p-2 text-center">
                                    <div className="flex justify-center">
                                        <IOSSwitch 
                                            checked={selectedIvaAccounts.get(cuenta) ?? false} 
                                            onChange={() => onAccountSelectionChange(cuenta)} 
                                        />
                                    </div>
                                </td>
                                <td className="p-2 font-mono text-slate-600 text-xs">{cuenta.split(' ')[0]}</td>
                                <td className="p-2 text-slate-700">{nombre} <span className="text-xs text-amber-600 font-bold ml-2">(Transitorio)</span></td>
                                <td className="p-2 text-right font-mono text-slate-800">{formatCurrency(debitos)}</td>
                                <td className="p-2 bg-slate-50/50"></td>
                                <td className="p-2"></td>
                             </tr>
                        ))}

                        <tr className="bg-indigo-50/30 font-semibold text-slate-800 border-t border-slate-200">
                            <td colSpan={3} className="p-3 text-right text-xs uppercase">Total Descontable + Transitorio</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(totalIvaDescYTransBp)}</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(ivaComprasDian)}</td>
                            <td className="p-3">{renderDifference(totalIvaDescYTransBp, ivaComprasDian)}</td>
                        </tr>

                        <tr className="bg-white">
                            <td colSpan={3} className="p-2 text-right text-xs text-slate-500">(-) Devoluciones en Compras</td>
                            <td className="p-2 text-right font-mono text-red-600">{formatCurrency(-totalIvaDevolucionesComprasBp)}</td>
                            <td className="p-2 text-right font-mono text-red-600">{formatCurrency(-ivaDevolucionesComprasDian)}</td>
                            <td className="p-2">{renderDifference(-totalIvaDevolucionesComprasBp, -ivaDevolucionesComprasDian)}</td>
                        </tr>

                        <tr className="bg-slate-800 text-white font-bold">
                            <td colSpan={3} className="p-3 text-right">TOTAL IVA DESCONTABLE NETO</td>
                            <td className="p-3 text-right font-mono text-lg">{formatCurrency(totalIvaDescontableNetoBp)}</td>
                            <td className="p-3 text-right font-mono text-slate-300">{formatCurrency(totalIvaDescontableNetoDian)}</td>
                            <td className="p-3 bg-slate-900">{renderDifference(totalIvaDescontableNetoBp, totalIvaDescontableNetoDian)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};