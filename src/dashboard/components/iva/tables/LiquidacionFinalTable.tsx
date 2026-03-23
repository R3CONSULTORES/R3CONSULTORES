
import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

interface LiquidacionFinalTableProps {
    ivaGeneradoVentas: number;
    devolucionesComprasProrrateadas: number;
    devolucionesVentas: number;
    ivaDescontableFinal: number;
    ivaTransitorioFinal: number;
    retencionIva: number;
    ivaAPagarReal: number;
    ivaDescontableFactProrrateado: number;
    sobrantes: number;
    onSobrantesChange: (value: number) => void;
}

const Row = ({ 
    label, 
    real, 
    proy, 
    isHeader = false, 
    isTotal = false, 
    isNegative = false,
    highlightProy = false 
}: { 
    label: string, 
    real: number, 
    proy: number, 
    isHeader?: boolean, 
    isTotal?: boolean,
    isNegative?: boolean,
    highlightProy?: boolean
}) => {
    const baseClass = "grid grid-cols-12 gap-4 py-3 px-4 border-b border-gray-100 items-center transition-colors hover:bg-slate-50";
    const headerClass = "bg-slate-100 font-bold text-slate-600 text-xs uppercase tracking-wider py-2 border-b border-gray-200";
    const totalClass = "bg-[#1e293b] text-white py-4 mt-2 rounded-lg font-bold text-lg shadow-md border-none";
    
    if (isHeader) {
        return (
            <div className={`grid grid-cols-12 gap-4 px-4 ${headerClass}`}>
                <div className="col-span-6">Concepto</div>
                <div className="col-span-3 text-right">Escenario Real</div>
                <div className="col-span-3 text-right text-indigo-700">Con Simulación</div>
            </div>
        );
    }

    if (isTotal) {
        return (
            <div className={`grid grid-cols-12 gap-4 px-6 items-center ${totalClass}`}>
                <div className="col-span-6">TOTAL IVA A PAGAR</div>
                <div className="col-span-3 text-right font-mono opacity-80 text-base">{formatCurrency(real)}</div>
                <div className="col-span-3 text-right font-mono text-xl text-[#f6b034]">{formatCurrency(proy)}</div>
            </div>
        );
    }

    return (
        <div className={baseClass}>
            <div className="col-span-6 text-sm font-medium text-slate-700 flex items-center">
                {isNegative && <span className="text-red-400 mr-2 font-bold">-</span>}
                {label}
            </div>
            <div className="col-span-3 text-right font-mono text-sm text-slate-600">
                {formatCurrency(real)}
            </div>
            <div className={`col-span-3 text-right font-mono text-sm ${highlightProy ? 'text-indigo-600 font-bold bg-indigo-50 px-2 rounded' : 'text-slate-800'}`}>
                {formatCurrency(proy)}
            </div>
        </div>
    );
};

const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
        {title}
    </div>
);

export const LiquidacionFinalTable: React.FC<LiquidacionFinalTableProps> = ({
    ivaGeneradoVentas,
    devolucionesComprasProrrateadas,
    devolucionesVentas,
    ivaDescontableFinal,
    ivaTransitorioFinal,
    retencionIva,
    ivaAPagarReal,
    ivaDescontableFactProrrateado,
    sobrantes,
    // onSobrantesChange is handled in parent via props for input sync, but here we just display value logic
}) => {
    
    const totalIvaGenReal = ivaGeneradoVentas + devolucionesComprasProrrateadas;
    const totalIvaDescontableReal = devolucionesVentas + ivaDescontableFinal + ivaTransitorioFinal;
    const totalIvaDescontableProyectado = totalIvaDescontableReal + ivaDescontableFactProrrateado;
    const ivaAPagarProyectado = totalIvaGenReal - totalIvaDescontableProyectado - retencionIva - sobrantes;
    
    return (
        <div className="flex flex-col bg-white">
            <Row label="" real={0} proy={0} isHeader />
            
            <SectionHeader title="Generado" />
            <Row label="IVA Generado en Ventas" real={ivaGeneradoVentas} proy={ivaGeneradoVentas} />
            <Row label="IVA Recup. en Dev. Compras (Prorrateado)" real={devolucionesComprasProrrateadas} proy={devolucionesComprasProrrateadas} />
            <div className="px-4"><div className="border-b border-slate-200"></div></div>
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50/50 font-bold text-slate-700 text-sm">
                <div className="col-span-6 text-right pr-4">Total Generado</div>
                <div className="col-span-3 text-right font-mono">{formatCurrency(totalIvaGenReal)}</div>
                <div className="col-span-3 text-right font-mono">{formatCurrency(totalIvaGenReal)}</div>
            </div>

            <SectionHeader title="Descontable" />
            <Row label="IVA Dev. en Ventas" real={devolucionesVentas} proy={devolucionesVentas} isNegative />
            <Row label="IVA Descontable (Prorrateado)" real={ivaDescontableFinal} proy={ivaDescontableFinal} isNegative />
            <Row label="IVA Transitorio (Prorrateado)" real={ivaTransitorioFinal} proy={ivaTransitorioFinal} isNegative />
            <Row 
                label="IVA Fac. Proyectada (Estrategia)" 
                real={0} 
                proy={ivaDescontableFactProrrateado} 
                isNegative 
                highlightProy={ivaDescontableFactProrrateado > 0} 
            />
            <div className="px-4"><div className="border-b border-slate-200"></div></div>
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50/50 font-bold text-slate-700 text-sm">
                <div className="col-span-6 text-right pr-4">Total Descontable</div>
                <div className="col-span-3 text-right font-mono">{formatCurrency(totalIvaDescontableReal)}</div>
                <div className="col-span-3 text-right font-mono text-indigo-700">{formatCurrency(totalIvaDescontableProyectado)}</div>
            </div>

            <SectionHeader title="Deducciones Finales" />
            <Row label="Retenciones de IVA (ReteIVA)" real={retencionIva} proy={retencionIva} isNegative />
            <Row label="Saldo a Favor Anterior (Sobrantes)" real={sobrantes} proy={sobrantes} isNegative />

            <div className="p-4">
                <Row label="" real={ivaAPagarReal} proy={ivaAPagarProyectado} isTotal />
            </div>
        </div>
    );
};
