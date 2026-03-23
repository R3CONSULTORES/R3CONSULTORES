import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import type { IvaDescontableCategory } from '@/dashboard/types';
import { formatCurrency } from '@/dashboard/utils/formatters';

const IVA_DESCONTABLE_CATEGORY_LABELS: Record<IvaDescontableCategory, string> = {
    'no_clasificado_descontable': 'Sin Clasificar',
    'bienes_5': 'Por compras de bienes gravados a la tarifa del 5%',
    'bienes_g': 'Por compras de bienes gravados a la tarifa general',
    'servicios_5': 'Por compras de servicios gravados a la tarifa del 5%',
    'servicios_g': 'Por compras de servicios gravados a la tarifa general',
    'no_tener_en_cuenta': 'No tener en cuenta',
};


const ClasificacionIvaDescontable: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { appState, updateAppState } = context;
    const { files: { iva_auxiliar: auxiliar }, ivaDescontableClassification } = appState;

    const accountsToClassify = useMemo(() => {
        if (!auxiliar) return [];
        const accounts = new Map<string, { totalDebitos: number }>();
        
        auxiliar.forEach(row => {
            const code = row.Cuenta?.split(' ')[0] || '';
            if (row.Cuenta && (code.startsWith('240802') || code.startsWith('240803'))) {
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

    const summaryData = useMemo(() => {
        const summary: Record<Exclude<IvaDescontableCategory, 'no_clasificado_descontable' | 'no_tener_en_cuenta'>, number> = {
            'bienes_5': 0,
            'bienes_g': 0,
            'servicios_5': 0,
            'servicios_g': 0,
        };

        accountsToClassify.forEach(({ cuenta, totalDebitos }) => {
            const category = ivaDescontableClassification.get(cuenta) || 'no_clasificado_descontable';
            if (category !== 'no_clasificado_descontable' && category !== 'no_tener_en_cuenta') {
                summary[category] += totalDebitos;
            }
        });
        return summary;
    }, [accountsToClassify, ivaDescontableClassification]);

    const handleClassificationChange = (cuenta: string, category: IvaDescontableCategory) => {
        const newMap = new Map(ivaDescontableClassification);
        if (category === 'no_clasificado_descontable') {
            newMap.delete(cuenta);
        } else {
            newMap.set(cuenta, category);
        }
        updateAppState({ ivaDescontableClassification: newMap });
    };
    
    if (!auxiliar) {
        return (
            <div className="bg-white p-10 rounded-xl shadow-md text-center">
                <p className="text-gray-500">Cargue el archivo Auxiliar General (IVA) en la pestaña 'Control' para empezar.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Clasificar Cuentas de IVA Descontable para Formulario 300</h2>
                <p className="text-sm text-gray-600 mb-4">Asigne a cada cuenta de IVA descontable (240802...) o transitorio (240803...) la categoría correcta para diligenciar los renglones del impuesto descontable en el Formulario 300.</p>
                <div className="max-h-[60vh] overflow-y-auto border rounded-lg shadow-sm">
                     <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="py-2 px-3 text-left font-medium text-gray-600 w-1/3">Cuenta</th>
                                <th className="py-2 px-3 text-right font-medium text-gray-600 w-1/4">Total Débitos (IVA)</th>
                                <th className="py-2 px-3 text-left font-medium text-gray-600">Clasificación para F-300</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {accountsToClassify.map(({ cuenta, totalDebitos }) => (
                                <tr key={cuenta}>
                                    <td className="p-2 px-3 text-gray-800 font-medium">{cuenta}</td>
                                    <td className="p-2 px-3 text-right font-mono text-slate-800">{formatCurrency(totalDebitos)}</td>
                                    <td className="p-2 px-3">
                                        <select
                                            value={ivaDescontableClassification.get(cuenta) || 'no_clasificado_descontable'}
                                            onChange={(e) => handleClassificationChange(cuenta, e.target.value as IvaDescontableCategory)}
                                            className="w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 text-sm"
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
             <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Resumen IVA Descontable Clasificado</h2>
                 <table className="min-w-full text-sm">
                    <thead className="bg-slate-800 text-white font-semibold">
                        <tr>
                            <th className="py-2 px-3 text-left">Concepto</th>
                            <th className="py-2 px-3 text-right">Total IVA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {Object.entries(summaryData).map(([key, value]) => (
                            <tr key={key} className="hover:bg-gray-50">
                                <td className="p-2 px-3 text-gray-800">{IVA_DESCONTABLE_CATEGORY_LABELS[key as Exclude<IvaDescontableCategory, 'no_clasificado_descontable' | 'no_tener_en_cuenta'>]}</td>
                                <td className="p-2 px-3 text-right font-mono font-semibold text-gray-800">{formatCurrency(value as number)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-200 font-bold text-slate-800">
                        <tr>
                            <td className="py-2 px-3 text-right">TOTAL CLASIFICADO</td>
                            <td className="py-2 px-3 text-right font-mono">
                                {formatCurrency((Object.values(summaryData) as number[]).reduce((sum, val) => sum + val, 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default ClasificacionIvaDescontable;