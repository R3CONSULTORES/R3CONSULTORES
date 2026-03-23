
import React from 'react';
import type { AppState, IvaDescontableCategory, LiquidationCalculations } from '../../../types';
import { LiquidacionIvaTable } from '../tables/LiquidacionIvaTable';
import { IvaDescontableBreakdown } from '../tables/IvaDescontableBreakdown';
import ProrrateoIvaDevolucionesTable from '../../../views/iva/ProrrateoIvaDevolucionesTable';
import { ProrrateoKPIs } from '@/dashboard/components/iva/components/ProrrateoKPIs';
import { SegmentedControl } from '@/dashboard/components/iva/components/SegmentedControl';
import { SimulacionProrrateo } from '@/dashboard/components/iva/components/SimulacionProrrateo';

// --- NATIVE SVG ICONS ---

const FilterIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
);

interface ProrrateoViewProps {
    files: AppState['files'];
    liquidationCalculations: LiquidationCalculations | null;
    selectedIvaAccounts: Map<string, boolean>;
    handleAccountSelectionChange: (cuenta: string) => void;
    prorrateoPercentages: { gravado: number; otros: number };
    ivaTypeFilter: 'descontable' | 'transitorio' | 'ambos';
    setIvaTypeFilter: (filter: 'descontable' | 'transitorio' | 'ambos') => void;
    ivaDescontableClassification: Map<string, IvaDescontableCategory>;
}

export const ProrrateoView: React.FC<ProrrateoViewProps> = ({
    files,
    liquidationCalculations,
    selectedIvaAccounts,
    handleAccountSelectionChange,
    prorrateoPercentages,
    ivaTypeFilter,
    setIvaTypeFilter,
    ivaDescontableClassification
}) => {
    
    if (!liquidationCalculations || !files.iva_auxiliar || !files.iva_dian) {
        return (
            <div className="bg-white p-10 rounded-xl shadow-md text-center">
                <p className="text-gray-500">Genere la liquidación en la pestaña 'Control' para ver los resultados aquí.</p>
            </div>
        );
    }

    const filterOptions = [
        { label: 'Solo Descontable (240802)', value: 'descontable' },
        { label: 'Solo Transitorio (240803)', value: 'transitorio' },
        { label: 'Ambos (Prudente)', value: 'ambos' },
    ];

    const getHelpText = () => {
        switch (ivaTypeFilter) {
            case 'descontable': return "Aplica el prorrateo únicamente a las cuentas marcadas como '240802'. El '240803' se toma al 100% como deducible.";
            case 'transitorio': return "Aplica el prorrateo únicamente a las cuentas '240803'. El '240802' se toma al 100% como deducible.";
            case 'ambos': return "Aplica el porcentaje de prorrateo a TODAS las cuentas de IVA descontable y transitorio. Es el método más conservador.";
            default: return "";
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-[#1e293b]">Análisis de Prorrateo y Devoluciones</h2>
                <p className="text-slate-500 text-sm mt-1">Distribución proporcional del IVA común basada en los ingresos del periodo.</p>
            </div>

            {/* Top Section: KPIs & Config (Stacked Vertically for better space) */}
            <div className="flex flex-col gap-6">
                {/* 1. KPIs */}
                <div className="w-full">
                    <ProrrateoKPIs percentages={{ gravado: prorrateoPercentages.gravado, others: prorrateoPercentages.otros }} />
                </div>

                {/* 2. Config Panel & Simulation */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
                    {/* Header & Controls Row */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 pb-4">
                        <div className="max-w-md">
                            <div className="flex items-center gap-2 mb-1">
                                <FilterIcon className="w-5 h-5 text-[#f6b034]" />
                                <h3 className="font-bold text-[#1e293b] text-sm uppercase tracking-wide">Configuración de Cálculo</h3>
                            </div>
                            <p className="text-xs text-slate-400 mb-2">Seleccione la base gravable a castigar con el porcentaje de gasto.</p>
                            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex gap-2 items-start">
                                <InfoIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-800 leading-snug">
                                    {getHelpText()}
                                </p>
                            </div>
                        </div>
                        
                        <div className="w-full md:w-auto flex-shrink-0">
                            <SegmentedControl 
                                options={filterOptions} 
                                value={ivaTypeFilter} 
                                onChange={(val) => setIvaTypeFilter(val as any)} 
                            />
                        </div>
                    </div>

                    {/* NEW SIMULATION COMPONENT WITH DETAIL - Stacked Below */}
                    <div className="w-full">
                        <SimulacionProrrateo
                            totalDescontable={liquidationCalculations.totalIvaDescontableBp}
                            totalTransitorio={liquidationCalculations.totalIvaTransitorioBp}
                            filterType={ivaTypeFilter}
                            percentageDeductible={prorrateoPercentages.gravado}
                            percentageExpense={prorrateoPercentages.otros}
                            auxiliarData={files.iva_auxiliar}
                            selectedIvaAccounts={selectedIvaAccounts}
                            ivaDescontableClassification={ivaDescontableClassification}
                        />
                    </div>
                </div>
            </div>

            {/* Middle Section: Main Table */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-px bg-slate-200 flex-grow"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detalle de Cuentas</span>
                    <div className="h-px bg-slate-200 flex-grow"></div>
                </div>
                
                <LiquidacionIvaTable
                    auxiliar={files.iva_auxiliar}
                    dian={files.iva_dian}
                    selectedIvaAccounts={selectedIvaAccounts}
                    onAccountSelectionChange={handleAccountSelectionChange}
                    ivaDescontableClassification={ivaDescontableClassification}
                    calculations={liquidationCalculations}
                />
            </div>

            {/* Bottom Section: Results & Devoluciones */}
            <div className="grid grid-cols-1 gap-8">
                <IvaDescontableBreakdown 
                    auxiliarData={files.iva_auxiliar}
                    percentages={prorrateoPercentages}
                    selectedIvaAccounts={selectedIvaAccounts}
                    ivaDescontableClassification={ivaDescontableClassification}
                />
                
                <ProrrateoIvaDevolucionesTable
                    auxiliarData={files.iva_auxiliar}
                    percentages={prorrateoPercentages}
                    selectedIvaAccounts={selectedIvaAccounts}
                />
            </div>
        </div>
    );
};
