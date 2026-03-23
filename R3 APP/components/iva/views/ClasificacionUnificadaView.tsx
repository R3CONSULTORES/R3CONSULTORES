
import React, { useMemo } from 'react';
import type { AppState, CompraVatCategory, IvaDescontableCategory } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface ClasificacionUnificadaViewProps {
    files: AppState['files'];
    comprasAccountVatClassification: Map<string, CompraVatCategory>;
    onComprasClassificationChange: (cuenta: string, category: CompraVatCategory) => void;
    ivaDescontableClassification: Map<string, IvaDescontableCategory>;
    onIvaClassificationChange: (cuenta: string, category: IvaDescontableCategory) => void;
}

const COMPRA_VAT_CATEGORY_LABELS: Record<CompraVatCategory, string> = {
    'no_clasificado': 'Sin Clasificar',
    'bienes_gravados_5': 'Bienes gravados al 5%',
    'bienes_gravados_g': 'Bienes gravados a tarifa general',
    'servicios_gravados_5': 'Servicios gravados al 5%',
    'servicios_gravados_g': 'Servicios gravados a tarifa general',
    'excluidos_exentos_no_gravados': 'B/S excluidos, exentos y no gravados',
};

const IVA_DESCONTABLE_CATEGORY_LABELS: Record<IvaDescontableCategory, string> = {
    'no_clasificado_descontable': 'Sin Clasificar',
    'bienes_5': 'Por compras de bienes (5%)',
    'bienes_g': 'Por compras de bienes (General)',
    'servicios_5': 'Por compras de servicios (5%)',
    'servicios_g': 'Por compras de servicios (General)',
    'no_tener_en_cuenta': 'No tener en cuenta',
};

export const ClasificacionUnificadaView: React.FC<ClasificacionUnificadaViewProps> = ({
    files,
    comprasAccountVatClassification,
    onComprasClassificationChange,
    ivaDescontableClassification,
    onIvaClassificationChange
}) => {
    const { iva_auxiliar: auxiliar } = files;

    const comprasData = useMemo(() => {
        if (!auxiliar) return [];
        const accounts = new Map<string, { totalDebitos: number }>();
        const prefixes = ['5', '6', '7'];
        
        auxiliar.forEach(row => {
            if (row.Cuenta && prefixes.some(p => row.Cuenta.startsWith(p))) {
                const current = accounts.get(row.Cuenta) || { totalDebitos: 0 };
                current.totalDebitos += row.Debitos;
                accounts.set(row.Cuenta, current);
            }
        });
        
        return Array.from(accounts.entries())
            .map(([cuenta, data]) => ({ cuenta, ...data }))
            .filter(item => item.totalDebitos > 0)
            .sort((a, b) => a.cuenta.localeCompare(b.cuenta));
    }, [auxiliar]);

    const ivaData = useMemo(() => {
        if (!auxiliar) return [];
        const accounts = new Map<string, { totalDebitos: number }>();
        
        auxiliar.forEach(row => {
            if (row.Cuenta && row.Cuenta.startsWith('2408')) {
                const current = accounts.get(row.Cuenta) || { totalDebitos: 0 };
                current.totalDebitos += row.Debitos;
                accounts.set(row.Cuenta, current);
            }
        });
        
        return Array.from(accounts.entries())
            .map(([cuenta, data]) => ({ cuenta, ...data }))
            .filter(item => item.totalDebitos > 0)
            .sort((a, b) => a.cuenta.localeCompare(b.cuenta));
    }, [auxiliar]);

    if (!auxiliar) {
        return (
            <div className="bg-white p-10 rounded-xl shadow-md text-center">
                <p className="text-gray-500">Cargue el archivo Auxiliar General (IVA) en la pestaña 'Control' para empezar.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
            {/* PANEL 1: GASTOS Y COSTOS */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-slate-50">
                    <h3 className="font-bold text-[#000040] text-lg">1. Clasificación de Gastos y Costos</h3>
                    <p className="text-xs text-slate-500">Cuentas 5, 6 y 7. Se usarán para la base de compras.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-0">
                    <table className="min-w-full text-sm">
                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="py-2 px-3 text-left font-semibold text-slate-600 w-1/3 bg-slate-50">Cuenta</th>
                                <th className="py-2 px-3 text-right font-semibold text-slate-600 w-1/4 bg-slate-50">Valor Débito</th>
                                <th className="py-2 px-3 text-left font-semibold text-slate-600 bg-slate-50">Categoría Compra</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {comprasData.map(({ cuenta, totalDebitos }) => (
                                <tr key={cuenta} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-2 px-3 text-slate-800 font-medium text-xs break-words max-w-[200px]" title={cuenta}>
                                        {cuenta}
                                    </td>
                                    <td className="p-2 px-3 text-right font-mono text-slate-700 text-xs">
                                        {formatCurrency(totalDebitos)}
                                    </td>
                                    <td className="p-2 px-3">
                                        <select
                                            value={comprasAccountVatClassification.get(cuenta) || 'no_clasificado'}
                                            onChange={(e) => onComprasClassificationChange(cuenta, e.target.value as CompraVatCategory)}
                                            className={`w-full p-1.5 border rounded-md text-xs shadow-sm focus:ring-[#f6b034] focus:border-[#f6b034] outline-none transition-colors ${
                                                comprasAccountVatClassification.has(cuenta) 
                                                ? 'bg-blue-50 border-blue-200 text-blue-800 font-medium' 
                                                : 'bg-white border-gray-300 text-slate-600'
                                            }`}
                                        >
                                            {Object.entries(COMPRA_VAT_CATEGORY_LABELS).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PANEL 2: CUENTAS DE IVA */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-slate-50">
                    <h3 className="font-bold text-[#000040] text-lg">2. Clasificación de IVA Descontable</h3>
                    <p className="text-xs text-slate-500">Cuentas 2408. Se usarán para los impuestos descontables.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-0">
                    <table className="min-w-full text-sm">
                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="py-2 px-3 text-left font-semibold text-slate-600 w-1/3 bg-slate-50">Cuenta</th>
                                <th className="py-2 px-3 text-right font-semibold text-slate-600 w-1/4 bg-slate-50">Valor Débito</th>
                                <th className="py-2 px-3 text-left font-semibold text-slate-600 bg-slate-50">Categoría IVA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {ivaData.map(({ cuenta, totalDebitos }) => (
                                <tr key={cuenta} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-2 px-3 text-slate-800 font-medium text-xs break-words max-w-[200px]" title={cuenta}>
                                        {cuenta}
                                    </td>
                                    <td className="p-2 px-3 text-right font-mono text-slate-700 text-xs">
                                        {formatCurrency(totalDebitos)}
                                    </td>
                                    <td className="p-2 px-3">
                                        <select
                                            value={ivaDescontableClassification.get(cuenta) || 'no_clasificado_descontable'}
                                            onChange={(e) => onIvaClassificationChange(cuenta, e.target.value as IvaDescontableCategory)}
                                            className={`w-full p-1.5 border rounded-md text-xs shadow-sm focus:ring-[#f6b034] focus:border-[#f6b034] outline-none transition-colors ${
                                                ivaDescontableClassification.has(cuenta) 
                                                ? 'bg-green-50 border-green-200 text-green-800 font-medium' 
                                                : 'bg-white border-gray-300 text-slate-600'
                                            }`}
                                        >
                                            {Object.entries(IVA_DESCONTABLE_CATEGORY_LABELS).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
