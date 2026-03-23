
import React from 'react';

// Native SVG Icons
const ChartPieIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
    </svg>
);

const CurrencyDollarIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

interface ProrrateoKPIsProps {
    percentages: { gravado: number; others: number };
}

export const ProrrateoKPIs: React.FC<ProrrateoKPIsProps> = ({ percentages }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Card 1: Computable */}
            <div className="relative overflow-hidden bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ChartPieIcon className="w-24 h-24 text-emerald-900" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600">
                            <ChartPieIcon className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Porcentaje Computable</h4>
                    </div>
                    <p className="text-sm text-emerald-700 font-medium mb-4">IVA Descontable (Declaración)</p>
                    
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-extrabold text-emerald-900 tracking-tight">
                            {percentages.gravado.toFixed(2)}
                        </span>
                        <span className="text-xl font-bold text-emerald-700">%</span>
                    </div>
                </div>

                <div className="w-full bg-white/50 h-2 rounded-full mt-4 overflow-hidden">
                    <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${percentages.gravado}%` }}
                    ></div>
                </div>
            </div>

            {/* Card 2: Expense */}
            <div className="relative overflow-hidden bg-orange-50 border border-orange-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CurrencyDollarIcon className="w-24 h-24 text-orange-900" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-orange-600">
                            <CurrencyDollarIcon className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider">Porcentaje No Computable</h4>
                    </div>
                    <p className="text-sm text-orange-700 font-medium mb-4">Mayor Valor del Gasto</p>

                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-extrabold text-orange-900 tracking-tight">
                            {percentages.others.toFixed(2)}
                        </span>
                        <span className="text-xl font-bold text-orange-700">%</span>
                    </div>
                </div>

                <div className="w-full bg-white/50 h-2 rounded-full mt-4 overflow-hidden">
                    <div 
                        className="h-full bg-orange-500 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${percentages.others}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};
