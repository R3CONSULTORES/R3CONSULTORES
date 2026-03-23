

import React from 'react';
import type { AppState, IvaDescontableCategory, LiquidationCalculations } from '../../../types';
import { LiquidacionFinalTable } from '../tables/LiquidacionFinalTable';
import { ProjectedIncomeStatement } from '../tables/ProjectedIncomeStatement';
import { IvaDescontableBreakdown } from '../tables/IvaDescontableBreakdown';
import { formatCurrency } from '../../../utils/formatters';

// --- NATIVE SVG ICONS ---

const BanknotesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
);

const TargetIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
);

const CalculatorIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5a2.25 2.25 0 0 1 2.25 2.25v12a2.25 2.25 0 0 1-2.25 2.25H8.25a2.25 2.25 0 0 1-2.25-2.25V8.25A2.25 2.25 0 0 1 8.25 6Z" />
    </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941" />
    </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
);

const PercentIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
);

// --- INTERNAL COMPONENT: SIMULATION INPUT CARD ---

interface SimulationInputCardProps {
    title: string;
    icon: React.ReactNode;
    value: number | string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    colorClass?: string;
    description?: string;
    isPercentage?: boolean;
}

const SimulationInputCard: React.FC<SimulationInputCardProps> = ({ title, icon, value, onChange, colorClass = "text-slate-800", description, isPercentage }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg bg-gray-50 ${colorClass}`}>
                {icon}
            </div>
            <h4 className="font-bold text-xs text-slate-600 uppercase tracking-wide">{title}</h4>
        </div>
        <div className="relative mt-auto">
            {!isPercentage && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-base">$</span>}
            <input
                type={isPercentage ? "number" : "text"}
                value={value}
                onChange={onChange}
                className={`w-full py-2 border border-gray-200 rounded-lg text-right font-mono text-lg font-bold text-slate-800 focus:ring-2 focus:ring-[#f6b034] focus:border-[#f6b034] outline-none transition-all placeholder-gray-300 ${isPercentage ? 'pr-8 pl-3' : 'pl-6 pr-3'}`}
                placeholder="0"
            />
            {isPercentage && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>}
        </div>
        {description && <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">{description}</p>}
    </div>
);

// --- MAIN COMPONENT ---

interface LiquidacionFinalViewProps {
    files: AppState['files'];
    liquidationCalculations: LiquidationCalculations | null;
    projectionCalculations: {
        ivaDescontableFactProrrateado: number;
        facturaBruto: number;
        facturaIva: number;
        facturaNeto: number;
        ivaAPagarProyectado: number;
    } | null;
    incomeStatementCalculations: { totalIngNetos: number; costosGastosPeriodo: number } | null;
    sobrantes: number;
    onSobrantesChange: (value: number) => void;
    ivaDeseado: number;
    onIvaDeseadoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    facturaIvaRate: number;
    onFacturaIvaRateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    selectedIvaAccounts: Map<string, boolean>;
    prorrateoPercentages: { gravado: number; otros: number };
    ivaDescontableClassification: Map<string, IvaDescontableCategory>;
}

export const LiquidacionFinalView: React.FC<LiquidacionFinalViewProps> = ({
    files,
    liquidationCalculations,
    projectionCalculations,
    incomeStatementCalculations,
    sobrantes,
    onSobrantesChange,
    ivaDeseado,
    onIvaDeseadoChange,
    facturaIvaRate,
    onFacturaIvaRateChange,
    selectedIvaAccounts,
    prorrateoPercentages,
    ivaDescontableClassification
}) => {

    if (!liquidationCalculations || !files.iva_auxiliar || !projectionCalculations || !incomeStatementCalculations) {
        return (
            <div className="bg-white p-10 rounded-xl shadow-md text-center">
                <p className="text-gray-500">Genere la liquidación en la pestaña 'Control' y configure el prorrateo para ver la liquidación final.</p>
            </div>
        );
    }

    const handleSobrantesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        onSobrantesChange(Number(value) || 0);
    };

    // Calculate Savings KPI
    const savings = liquidationCalculations.ivaAPagarReal - projectionCalculations.ivaAPagarProyectado;
    const isPositiveSavings = savings > 100; // Small tolerance

    return (
        <div className="space-y-8 animate-fadeIn pb-12">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-[#000040] flex items-center gap-3">
                    <CalculatorIcon className="w-8 h-8 text-[#f6b034]" />
                    Simulador de Cierre Fiscal
                </h2>
                <p className="text-slate-500 text-sm mt-1 ml-11">
                    Ajuste los parámetros para proyectar el impuesto a pagar y evaluar estrategias de optimización.
                </p>
            </div>

            {/* TOP ROW: INPUTS & KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Col 1: Sobrantes */}
                <SimulationInputCard
                    title="Saldo a Favor Anterior"
                    icon={<BanknotesIcon className="w-5 h-5" />}
                    value={sobrantes === 0 ? '' : sobrantes.toLocaleString('es-CO')}
                    onChange={handleSobrantesChange}
                    colorClass="text-blue-600 bg-blue-50"
                    description="Saldos previos a favor."
                />

                {/* Col 2: Rate (MOVED HERE) */}
                <SimulationInputCard
                    title="Tarifa Proyección"
                    icon={<PercentIcon className="w-5 h-5" />}
                    value={facturaIvaRate}
                    onChange={onFacturaIvaRateChange}
                    colorClass="text-orange-600 bg-orange-50"
                    description="% IVA factura simulada."
                    isPercentage={true}
                />

                {/* Col 3: Meta */}
                <SimulationInputCard
                    title="Meta de IVA a Pagar"
                    icon={<TargetIcon className="w-5 h-5" />}
                    value={ivaDeseado === 0 ? '' : ivaDeseado.toLocaleString('es-CO')}
                    onChange={onIvaDeseadoChange}
                    colorClass="text-purple-600 bg-purple-50"
                    description="Objetivo de pago final."
                />

                {/* Col 4: KPI Ahorro */}
                <div className={`
                    p-4 rounded-xl shadow-sm border transition-all duration-500 flex flex-col justify-center items-center text-center h-full min-h-[140px]
                    ${isPositiveSavings 
                        ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100' 
                        : 'bg-gray-50 border-gray-200'}
                `}>
                    <div className={`mb-2 p-2 rounded-full ${isPositiveSavings ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
                        <SparklesIcon className="w-6 h-6" />
                    </div>
                    <h4 className={`text-xs font-bold uppercase tracking-wide mb-1 ${isPositiveSavings ? 'text-emerald-800' : 'text-gray-500'}`}>
                        Ahorro Potencial
                    </h4>
                    <span className={`text-2xl font-mono font-bold transition-all duration-500 ${isPositiveSavings ? 'text-emerald-600 scale-110' : 'text-gray-400'}`}>
                        {formatCurrency(savings)}
                    </span>
                </div>
            </div>

            {/* MIDDLE ROW: MAIN LIQUIDATION TABLE */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <CalculatorIcon className="w-5 h-5 text-[#f6b034]" />
                        Liquidación Definitiva
                    </h3>
                    {projectionCalculations.ivaDescontableFactProrrateado > 0 && (
                        <span className="text-xs font-bold bg-[#f6b034] text-[#000040] px-2 py-1 rounded">
                            Simulación Activa
                        </span>
                    )}
                </div>
                
                <LiquidacionFinalTable 
                    {...liquidationCalculations} 
                    ivaDescontableFactProrrateado={projectionCalculations.ivaDescontableFactProrrateado}
                    sobrantes={sobrantes}
                    onSobrantesChange={(val) => onSobrantesChange(val)}
                />
            </div>

            {/* BOTTOM SECTION: DETAILS & INCOME STATEMENT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Desglose IVA Descontable */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-px bg-gray-300 flex-grow"></div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detalle Descontables</span>
                        <div className="h-px bg-gray-300 flex-grow"></div>
                    </div>
                    <IvaDescontableBreakdown 
                        auxiliarData={files.iva_auxiliar}
                        selectedIvaAccounts={selectedIvaAccounts}
                        percentages={prorrateoPercentages}
                        ivaDescontableClassification={ivaDescontableClassification}
                    />
                </div>

                {/* Impacto en Renta */}
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-px bg-gray-300 flex-grow"></div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Impacto Financiero</span>
                        <div className="h-px bg-gray-300 flex-grow"></div>
                    </div>
                    
                    {/* The table now handles its own containment */}
                    <ProjectedIncomeStatement 
                        totalIngNetos={incomeStatementCalculations.totalIngNetos}
                        costosGastosPeriodo={incomeStatementCalculations.costosGastosPeriodo}
                        facturaASolicitar={projectionCalculations.facturaBruto}
                    />
                </div>
            </div>
        </div>
    );
};