
import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

// Simple ChartBar icon inline to avoid dependency issues
const ChartBarIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
);

interface ProjectedIncomeStatementProps {
    totalIngNetos: number;
    costosGastosPeriodo: number;
    facturaASolicitar: number;
}

export const ProjectedIncomeStatement: React.FC<ProjectedIncomeStatementProps> = ({
    totalIngNetos,
    costosGastosPeriodo,
    facturaASolicitar,
}) => {
    const totalCostosGastos = costosGastosPeriodo + facturaASolicitar;
    const utilidadPerdida = totalIngNetos - totalCostosGastos;
    const isUtilidad = utilidadPerdida >= 0;

    const formatPercentage = (value: number, base: number) => {
        if (base === 0) return '0,00%';
        const percentage = (value / base) * 100;
        return percentage.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    };

    const ReportRow = ({ 
        label, 
        value, 
        isHighlighted = false, 
        isSimulation = false,
        isResult = false
    }: { 
        label: string, 
        value: number, 
        isHighlighted?: boolean, 
        isSimulation?: boolean,
        isResult?: boolean
    }) => {
        let bgClass = "bg-white";
        let textClass = "text-slate-600";
        let borderClass = "border-b border-slate-100";

        if (isSimulation) {
            bgClass = "bg-indigo-50";
            textClass = "text-indigo-700 font-semibold";
        }
        if (isHighlighted) {
            bgClass = "bg-slate-50 font-bold";
            textClass = "text-slate-800";
        }
        if (isResult) {
            bgClass = isUtilidad ? "bg-emerald-100 border-t-2 border-emerald-500" : "bg-rose-100 border-t-2 border-rose-500";
            textClass = isUtilidad ? "text-emerald-800 font-bold" : "text-rose-800 font-bold";
            borderClass = ""; // No bottom border for result
        }

        return (
            <div className={`flex justify-between items-center p-4 ${bgClass} ${borderClass}`}>
                <div className="flex flex-col">
                    <span className={`${isResult ? 'text-lg' : 'text-sm'} ${textClass}`}>
                        {label} {isSimulation && <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded ml-2 uppercase tracking-wide">(Simulado)</span>}
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className={`font-mono ${isResult ? 'text-xl' : 'text-base'} ${textClass}`}>
                        {formatCurrency(value)}
                    </span>
                    {!label.startsWith('TOTAL ING') && (
                        <span className={`text-xs ${isResult ? (isUtilidad ? 'text-emerald-700' : 'text-rose-700') : 'text-slate-400'}`}>
                            {formatPercentage(value, totalIngNetos)} del ingreso
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="bg-slate-800 text-white p-4 flex items-center gap-3">
                <div className="p-2 bg-slate-700 rounded-lg">
                    <ChartBarIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="font-bold text-lg">Impacto en Rentabilidad</h3>
            </div>

            {/* Body */}
            <div className="flex-grow flex flex-col">
                <ReportRow label="INGRESOS NETOS (REALES)" value={totalIngNetos} isHighlighted />
                
                <ReportRow label="Costos y Gastos del Periodo" value={costosGastosPeriodo} />
                
                {facturaASolicitar > 0 && (
                    <ReportRow label="Factura Proyectada" value={facturaASolicitar} isSimulation />
                )}
                
                <ReportRow label="TOTAL COSTOS Y GASTOS" value={totalCostosGastos} isHighlighted />
                
                <div className="mt-auto">
                    <ReportRow 
                        label={isUtilidad ? 'UTILIDAD BRUTA' : 'PÉRDIDA BRUTA'} 
                        value={utilidadPerdida} 
                        isResult 
                    />
                </div>
            </div>
        </div>
    );
};
