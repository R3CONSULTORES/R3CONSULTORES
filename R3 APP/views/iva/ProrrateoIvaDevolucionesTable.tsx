
import React, { useMemo } from 'react';
import type { AuxiliarData } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { isDevolucionesComprasAccountFuzzy } from './ivaUtils';

// --- NATIVE SVG ICONS ---

const ReceiptPercentIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
    </svg>
);

const ArrowDownTrayIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v9.768l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);

const ArchiveBoxIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
        <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);

interface ProrrateoIvaDevolucionesTableProps {
    auxiliarData: AuxiliarData[];
    percentages: { gravado: number; otros: number };
    selectedIvaAccounts: Map<string, boolean>;
}

const ProrrateoIvaDevolucionesTable: React.FC<ProrrateoIvaDevolucionesTableProps> = ({ auxiliarData, percentages, selectedIvaAccounts }) => {

    const devolucionesData = useMemo(() => {
        const pDeclaracion = percentages.gravado / 100;
        const pGasto = percentages.otros / 100;
        
        let totalCreditos = 0;
        auxiliarData.forEach(row => {
            if (isDevolucionesComprasAccountFuzzy(row.Cuenta) && selectedIvaAccounts.get(row.Cuenta)) {
                totalCreditos += row.Creditos;
            }
        });
        
        const paraDeclaracion = totalCreditos * pDeclaracion;
        const paraGasto = totalCreditos * pGasto;

        return {
            total: totalCreditos,
            paraDeclaracion,
            paraGasto,
        };
    }, [auxiliarData, percentages, selectedIvaAccounts]);

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mt-8 border border-gray-100">
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded-lg text-[#f6b034]">
                    <ReceiptPercentIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-white font-bold text-lg leading-tight">Prorrateo de IVA en Devoluciones</h2>
                    <p className="text-slate-400 text-xs">Distribución proporcional en devoluciones de compras</p>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex flex-col">
                
                {/* Total Row */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white">
                    <div className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                        TOTAL IVA Devoluciones (Créditos)
                    </div>
                    <div className="text-2xl font-bold font-mono text-slate-900">
                        {formatCurrency(devolucionesData.total)}
                    </div>
                </div>

                {/* Distribution Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Left: Deductible (Green) */}
                    <div className="p-6 bg-emerald-50/50 border-l-4 border-emerald-500 hover:bg-emerald-50 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-emerald-700">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase">IVA a Disminuir (Declaración)</span>
                        </div>
                        <div className="text-3xl font-extrabold font-mono text-emerald-800 mb-1">
                            {formatCurrency(devolucionesData.paraDeclaracion)}
                        </div>
                        <p className="text-xs text-emerald-600 font-medium opacity-80">
                            Aplicable al renglón de devoluciones (Proporción: {percentages.gravado.toFixed(2)}%)
                        </p>
                    </div>

                    {/* Right: Expense (Orange) */}
                    <div className="p-6 bg-orange-50/50 border-l-4 border-orange-500 hover:bg-orange-50 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-orange-700">
                            <ArchiveBoxIcon className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase">Mayor Valor del Gasto</span>
                        </div>
                        <div className="text-3xl font-extrabold font-mono text-orange-800 mb-1">
                            {formatCurrency(devolucionesData.paraGasto)}
                        </div>
                        <p className="text-xs text-orange-600 font-medium opacity-80">
                            No descontable tributariamente (Proporción: {percentages.otros.toFixed(2)}%)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProrrateoIvaDevolucionesTable;
