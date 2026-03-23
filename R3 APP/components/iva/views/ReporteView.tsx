
import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../utils/formatters';
import type { AuxiliarData, VatCategory, IvaDescontableCategory } from '../../../types';
import { ChevronDownIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowDownIcon } from '../../Icons';
import { SimulacionProrrateo } from '../components/SimulacionProrrateo';

// --- ICONS ---
const TableCellsIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 18.375V5.625ZM21 9.375A.375.375 0 0 0 20.625 9h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375-.375v-1.5Zm0 3.75a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375.375v-1.5Zm0 3.75a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375.375v-1.5Zm10.875 18.75a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375.375v-1.5Zm0 3.75h7.5a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375.375v-1.5Zm-9-3.75h7.5a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375.375v-1.5Z" clipRule="evenodd" />
    </svg>
);

const ChartPieIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
    </svg>
);

const QuestionMarkCircleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75S2.25 17.385 2.25 12zM12 17.25a.75.75 0 110-1.5.75.75 0 010 1.5zm-4.968-9.206a4.125 4.125 0 001.969 3.095c.535.28.87.84.87 1.459 0 .531-.208 1.022-.553 1.396a.75.75 0 11-1.127-1.016c.156-.169.255-.386.255-.63 0-.166-.095-.316-.24-.393a2.625 2.625 0 01-1.253-1.97 2.625 2.625 0 015.249 0c0 .93-.541 1.762-1.373 2.185-.802.408-1.26.858-1.347 1.344a.75.75 0 11-1.492-.158c.143-.807.82-1.5 1.96-2.079a4.125 4.125 0 00-2.02-7.168z" clipRule="evenodd" />
    </svg>
);

// --- EXPANDABLE ROW COMPONENT ---

interface ExpandableRowProps {
    label: React.ReactNode;
    base?: number;
    rateLabel?: string;
    ivaValue: number;
    isValid?: boolean;
    isTotal?: boolean;
    auxiliarData?: AuxiliarData[];
    filter?: (row: AuxiliarData) => boolean;
    sourceName?: string;
    rowClassName?: string;
    valueColumnType?: 'base' | 'impuesto';
}

const ExpandableRow: React.FC<ExpandableRowProps> = ({ 
    label, base, rateLabel, ivaValue, isValid = true, isTotal = false, 
    auxiliarData, filter, sourceName = "Auxiliar Contable", rowClassName = "",
    valueColumnType = 'base'
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const transactions = useMemo(() => {
        if (!isExpanded || !auxiliarData || !filter) return [];
        return auxiliarData.filter(filter);
    }, [isExpanded, auxiliarData, filter]);

    const displayTransactions = transactions.slice(0, 10);
    const hasMore = transactions.length > 10;
    const canExpand = !!filter && !!auxiliarData;

    return (
        <>
            <tr 
                onClick={() => canExpand && setIsExpanded(!isExpanded)}
                className={`transition-colors border-b border-slate-100 ${canExpand ? 'cursor-pointer hover:bg-slate-50' : ''} ${isExpanded ? 'bg-slate-50' : ''} ${rowClassName}`}
            >
                <td className="py-3 px-4 text-slate-700 font-medium flex items-center gap-2">
                    {canExpand && (
                        <div className={`p-1 rounded-full transition-colors ${isExpanded ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}>
                            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : '-rotate-90'}`} />
                        </div>
                    )}
                    <span className={!canExpand ? 'pl-7' : ''}>{label}</span>
                </td>
                <td className="py-3 px-4 text-center">
                    {rateLabel && <span className={`px-2 py-0.5 rounded text-xs font-bold ${rateLabel === '0%' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>{rateLabel}</span>}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {base !== undefined ? formatCurrency(base) : '-'}
                </td>
                <td className={`py-3 px-4 text-right font-mono ${ivaValue ? 'font-bold text-slate-800' : 'text-slate-300'}`}>
                    {ivaValue !== 0 ? formatCurrency(ivaValue) : '-'}
                </td>
                {!isTotal && (
                    <td className="py-3 px-4 text-center">
                        {isValid ? (
                            <CheckCircleIcon className="w-5 h-5 text-[#107C41] mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <ExclamationCircleIcon className="w-5 h-5 text-orange-500 mx-auto" />
                        )}
                    </td>
                )}
                {isTotal && <td></td>}
            </tr>
            
            {/* EXPANDED PANEL */}
            {isExpanded && (
                <tr>
                    <td colSpan={5} className="p-0 border-b border-slate-200">
                        <div className="bg-slate-50 p-4 shadow-inner">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                    Detalle de Transacciones
                                </h4>
                                <span className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
                                    {sourceName}: {transactions.length} registros
                                </span>
                            </div>
                            
                            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                                <table className="min-w-full text-xs">
                                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                                        <tr>
                                            <th className="py-2 px-3 text-left">Fecha</th>
                                            <th className="py-2 px-3 text-left">Documento</th>
                                            <th className="py-2 px-3 text-left">Tercero</th>
                                            <th className="py-2 px-3 text-left w-1/3">Detalle / Cuenta</th>
                                            <th className="py-2 px-3 text-right">
                                                {valueColumnType === 'impuesto' ? 'Valor Impuesto' : 'Valor Base'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {displayTransactions.map((tx, idx) => (
                                            <tr key={`${tx.id}-${idx}`} className="hover:bg-slate-50">
                                                <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{tx.Fecha}</td>
                                                <td className="py-2 px-3 font-mono text-slate-700">{tx.DocNum}</td>
                                                <td className="py-2 px-3 text-slate-600 truncate max-w-[150px]" title={tx.Tercero}>{tx.Tercero}</td>
                                                <td className="py-2 px-3 text-slate-500">
                                                    <div className="font-medium text-slate-700">{tx.Cuenta}</div>
                                                    <div className="truncate max-w-[200px]" title={tx.Nota}>{tx.Nota}</div>
                                                </td>
                                                <td className={`py-2 px-3 text-right font-mono text-slate-800 ${valueColumnType ? 'bg-amber-50/50 font-bold' : ''}`}>
                                                    {formatCurrency(tx.Creditos > 0 ? tx.Creditos : tx.Debitos)}
                                                    <span className="text-[9px] ml-1 text-slate-400">
                                                        {tx.Creditos > 0 ? 'CR' : 'DB'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {hasMore && (
                                <div className="text-center mt-2">
                                    <span className="text-xs text-slate-400 italic">
                                        Mostrando 10 de {transactions.length} registros. Ver todos en el Explorador.
                                    </span>
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};


interface ReporteViewProps {
    formulario300Data: any;
    liquidationCalculations?: any;
    prorrateoPercentages?: { gravado: number; otros: number };
    auxiliarData?: AuxiliarData[];
    incomeClassifications?: Map<string, VatCategory>;
    ivaDescontableClassification?: Map<string, IvaDescontableCategory>;
    selectedIvaAccounts?: Map<string, boolean>; // Nueva prop opcional
}

export const ReporteView: React.FC<ReporteViewProps> = ({ 
    formulario300Data, 
    liquidationCalculations,
    prorrateoPercentages,
    auxiliarData,
    incomeClassifications,
    ivaDescontableClassification,
    selectedIvaAccounts
}) => {
    if (!formulario300Data) return null;

    const data = formulario300Data;

    // --- CARD 1 DATA ---
    const incomeRows = [
        { 
            id: 'grav_5',
            label: 'Op. Gravadas 5%', 
            base: data.r27, 
            rate: 0.05, 
            rateLabel: '5%', 
            iva: data.r58,
            filter: (row: AuxiliarData) => {
                 const code = row.Cuenta.split(' ')[0];
                 return false; 
            }
        },
        { 
            id: 'grav_19',
            label: 'Op. Gravadas General', 
            base: data.r28, 
            rate: 0.19, 
            rateLabel: '19%', 
            iva: data.r59,
            filter: (row: AuxiliarData) => {
                const code = row.Cuenta.split(' ')[0];
                return code.startsWith('4') && incomeClassifications?.get(code) === 'gravado';
            }
        },
        { 
            id: 'aiu',
            label: 'A.I.U (Base Especial)', 
            base: data.r29, 
            rate: 0.19, 
            rateLabel: '19%', 
            iva: data.r60,
            filter: undefined 
        },
        { 
            id: 'exentas',
            label: 'Op. Exentas / Excluidas / No Grav.', 
            base: (data.r35 || 0) + (data.r39 || 0) + (data.r40 || 0), 
            rate: 0, 
            rateLabel: '0%', 
            iva: 0,
            filter: (row: AuxiliarData) => {
                const code = row.Cuenta.split(' ')[0];
                const type = incomeClassifications?.get(code);
                return code.startsWith('4') && (type === 'exento' || type === 'excluido' || type === 'no_gravado');
            }
        },
    ];
    const returnsBase = data.r42 || 0;
    const returnsIva = data.r79 || 0;

    const totalIngresosBrutos = incomeRows.reduce((acc, row) => acc + (row.base || 0), 0);
    const totalIvaGeneradoBruto = incomeRows.reduce((acc, row) => acc + (row.iva || 0), 0);
    const totalIngresosNetos = totalIngresosBrutos - returnsBase;
    const totalIvaNeto = totalIvaGeneradoBruto - returnsIva;

    // --- CARD 2 DATA ---
    const ivaGeneradoOperaciones = (data.r58 || 0) + (data.r59 || 0) + (data.r60 || 0);
    const ivaRecuperadoDevCompras = data.r66 || 0;
    const ivaDescontableTotal = data.r81 || 0; 
    
    const totalGenerado = ivaGeneradoOperaciones + ivaRecuperadoDevCompras;
    const saldoParcial = totalGenerado - ivaDescontableTotal;

    const saldoFavorAnterior = data.r84 || 0;
    const retencionesIva = data.r85 || 0;
    const saldoNeto = saldoParcial - saldoFavorAnterior - retencionesIva;
    const esSaldoAFavor = saldoNeto <= 0;

    // Default active accounts if not provided
    const activeAccounts = useMemo(() => {
        if (selectedIvaAccounts) return selectedIvaAccounts;
        const defaults = new Map<string, boolean>();
        if (auxiliarData) {
            auxiliarData.forEach(row => {
                if(row.Cuenta.startsWith('2408')) defaults.set(row.Cuenta, true);
            });
        }
        return defaults;
    }, [selectedIvaAccounts, auxiliarData]);


    return (
        <div className="min-h-screen bg-slate-50 p-6 animate-fadeIn pb-20">
            {/* Header */}
            <div className="bg-[#107C41] text-white p-4 rounded-t-xl shadow-md flex items-center gap-3">
                <TableCellsIcon className="w-6 h-6" />
                <h2 className="text-lg font-bold tracking-wide">Centro de Reportes y Validación</h2>
            </div>

            {/* CARD 1: Ingresos Validation */}
            <div className="bg-white border-t-4 border-[#107C41] shadow-lg rounded-b-xl overflow-hidden mb-6">
                <div className="p-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        Auditoría de Ingresos vs. IVA
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">Cruce Automático</span>
                    </h3>

                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="py-3 px-4 text-left">Concepto</th>
                                    <th className="py-3 px-4 text-center w-24">Tarifa</th>
                                    <th className="py-3 px-4 text-right w-48">Base</th>
                                    <th className="py-3 px-4 text-right w-48">IVA Asociado</th>
                                    <th className="py-3 px-4 text-center w-20">Check</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incomeRows.map((row) => (
                                    <ExpandableRow
                                        key={row.id}
                                        label={row.label}
                                        base={row.base}
                                        rateLabel={row.rateLabel}
                                        ivaValue={row.iva}
                                        auxiliarData={auxiliarData}
                                        filter={row.filter}
                                        valueColumnType="base"
                                        isValid={Math.abs((row.base * row.rate) - row.iva) < 1000}
                                    />
                                ))}
                                <ExpandableRow
                                    label={<span className="text-rose-700">(-) Devoluciones en Ventas</span>}
                                    base={returnsBase}
                                    ivaValue={returnsIva}
                                    rowClassName="bg-rose-50/30"
                                    isTotal={true} // Hides check icon
                                    // Filter for Sales Returns (4175 or 2408 db with return keywords)
                                    auxiliarData={auxiliarData}
                                    filter={(row) => row.Cuenta.startsWith('4175')}
                                    valueColumnType="base"
                                />
                            </tbody>
                            <tfoot className="bg-[#E6F4EA] border-t-2 border-[#107C41]">
                                <tr>
                                    <td className="py-4 px-4 font-bold text-[#107C41] uppercase">Ingresos Netos</td>
                                    <td className="py-4 px-4 text-center"></td>
                                    <td className="py-4 px-4 text-right font-mono font-bold text-[#107C41] text-base">{formatCurrency(totalIngresosNetos)}</td>
                                    <td className="py-4 px-4 text-right font-mono font-bold text-[#107C41] text-base">{formatCurrency(totalIvaNeto)}</td>
                                    <td className="py-4 px-4"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            <div className="flex justify-center -my-3 relative z-10 mb-3">
                <div className="bg-slate-100 rounded-full p-2 border border-slate-300 shadow-sm text-slate-400">
                    <ArrowDownIcon className="w-6 h-6" />
                </div>
            </div>

            {/* CARD 2: Depuración de Impuesto a Pagar */}
            <div className="bg-white border-t-4 border-slate-600 shadow-lg rounded-xl overflow-hidden mb-6">
                <div className="p-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        Depuración del Impuesto a Pagar
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">Cálculo Definitivo</span>
                    </h3>

                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="py-3 px-6 text-left">Concepto</th>
                                    <th className="py-3 px-6 text-right w-48">Valor</th>
                                    <th className="py-3 px-6 text-left w-48">Nota</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* Base Generado */}
                                <ExpandableRow 
                                    label="Total IVA Generado Bruto"
                                    ivaValue={totalIvaNeto}
                                    isTotal={true}
                                    auxiliarData={auxiliarData}
                                    filter={(row) => row.Cuenta.startsWith('2408') && row.Creditos > 0}
                                    valueColumnType="impuesto"
                                />
                                {/* Dev Compras */}
                                <tr className="bg-red-50/30 hover:bg-red-50">
                                    <td className="py-3 px-6 text-red-700 font-medium">(+) IVA Recuperado en Dev. Compras</td>
                                    <td className="py-3 px-6 text-right font-mono text-red-600 font-bold">{formatCurrency(ivaRecuperadoDevCompras)}</td>
                                    <td className="py-3 px-6 text-xs text-red-400">Renglón 66</td>
                                </tr>
                                {/* Descontable Total */}
                                <ExpandableRow
                                    label={<span className="text-emerald-700 font-medium">(-) IVA Descontable Total (Neto Prorrateo)</span>}
                                    ivaValue={ivaDescontableTotal}
                                    isTotal={true}
                                    rowClassName="hover:bg-emerald-50"
                                    // Drill down shows all deductible candidates
                                    auxiliarData={auxiliarData}
                                    filter={(row) => row.Cuenta.startsWith('240802')}
                                    valueColumnType="impuesto"
                                />
                                {/* Saldo Parcial */}
                                <tr className="bg-slate-100 font-bold border-t border-slate-300">
                                    <td className="py-3 px-6 text-slate-800 uppercase">(=) Saldo Parcial (Casilla 82/83)</td>
                                    <td className="py-3 px-6 text-right font-mono text-slate-900 text-base">{formatCurrency(Math.abs(saldoParcial))}</td>
                                    <td className="py-3 px-6 text-xs text-slate-500">{saldoParcial >= 0 ? 'A Pagar' : 'A Favor'}</td>
                                </tr>
                                {/* Saldo Favor Anterior */}
                                <tr className="hover:bg-emerald-50">
                                    <td className="py-3 px-6 text-emerald-700 font-medium">(-) Saldo a Favor Periodo Anterior</td>
                                    <td className="py-3 px-6 text-right font-mono text-emerald-600 font-bold">({formatCurrency(saldoFavorAnterior)})</td>
                                    <td className="py-3 px-6 text-xs text-emerald-500">Renglón 84</td>
                                </tr>
                                {/* Retenciones */}
                                <ExpandableRow
                                    label={
                                        <div className="flex items-center gap-2 text-emerald-700 font-medium">
                                            (-) Retenciones por IVA (ReteIVA)
                                            <div className="group relative">
                                                <QuestionMarkCircleIcon className="w-4 h-4 text-emerald-400 cursor-help" />
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                                                    Valor tomado de certificados (Cuentas 135517)
                                                </span>
                                            </div>
                                        </div>
                                    }
                                    ivaValue={retencionesIva}
                                    isTotal={true}
                                    rowClassName="hover:bg-emerald-50"
                                    auxiliarData={auxiliarData}
                                    filter={(row) => row.Cuenta.startsWith('135517')}
                                    valueColumnType="impuesto"
                                />
                            </tbody>
                            <tfoot className={`border-t-2 ${!esSaldoAFavor ? 'bg-rose-100 border-rose-500' : 'bg-emerald-100 border-emerald-500'}`}>
                                <tr>
                                    <td className={`py-4 px-6 font-bold uppercase text-lg ${!esSaldoAFavor ? 'text-rose-800' : 'text-emerald-800'}`}>
                                        {!esSaldoAFavor ? '(=) SALDO A PAGAR NETO' : '(=) SALDO A FAVOR NETO'}
                                    </td>
                                    <td className={`py-4 px-6 text-right font-mono font-bold text-xl ${!esSaldoAFavor ? 'text-rose-900' : 'text-emerald-900'}`}>
                                        {formatCurrency(Math.abs(saldoNeto))}
                                    </td>
                                    <td className="py-4 px-6 text-xs font-medium">
                                        <span className="flex items-center gap-1 text-slate-600"><CheckCircleIcon className="w-4 h-4 text-green-600"/> Cálculo verificado</span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* CARD 3: Impacto del Prorrateo (Reemplazada por componente Simulación) */}
            <div className="bg-white border-t-4 border-amber-500 shadow-lg rounded-xl overflow-hidden">
                <div className="p-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <ChartPieIcon className="w-6 h-6 text-amber-500" />
                        Impacto del Prorrateo de IVA
                    </h3>

                    {liquidationCalculations && auxiliarData && prorrateoPercentages && ivaDescontableClassification ? (
                         <SimulacionProrrateo
                            totalDescontable={liquidationCalculations.totalIvaDescontableBp}
                            totalTransitorio={liquidationCalculations.totalIvaTransitorioBp}
                            filterType="transitorio" 
                            percentageDeductible={prorrateoPercentages.gravado}
                            percentageExpense={prorrateoPercentages.otros}
                            auxiliarData={auxiliarData}
                            selectedIvaAccounts={activeAccounts}
                            ivaDescontableClassification={ivaDescontableClassification}
                        />
                    ) : (
                        <p className="text-gray-500 italic text-center py-4">Faltan datos para mostrar la simulación.</p>
                    )}
                </div>
            </div>

        </div>
    );
};
