import React, { useState } from 'react';
import { ChevronDownIcon } from '@/dashboard/components/Icons';
import { formatCurrency } from '@/dashboard/utils/formatters';
import type { IvaSectionResult, IvaCategoryData, DianDocumentDetail, VatCategory } from '@/dashboard/types';

interface LiquidationSectionProps {
    title: string;
    data: IvaSectionResult;
    isPurchase?: boolean;
    comments: Map<string, string>;
    onCommentChange: (cuenta: string, comment: string) => void;
    onShowDianDetails: (title: string, documents: DianDocumentDetail[]) => void;
    ivaTransactionVatOverrides: Map<string, VatCategory>;
    onTransactionOverride: (txKey: string, category: VatCategory) => void;
}

const LiquidationSection: React.FC<LiquidationSectionProps> = ({ 
    title, 
    data, 
    isPurchase = false, 
    comments, 
    onCommentChange, 
    onShowDianDetails, 
    ivaTransactionVatOverrides, 
    onTransactionOverride 
}) => {
    const [expandedAccounts, setExpandedAccounts] = useState(new Set<string>());

    const toggleExpand = (cuenta: string) => {
        setExpandedAccounts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(cuenta)) {
                newSet.delete(cuenta);
            } else {
                newSet.add(cuenta);
            }
            return newSet;
        });
    };

    const renderCategory = (categoryTitle: string, categoryData: IvaCategoryData) => {
        if (categoryData.accounts.length === 0 && categoryData.totalDian === 0) return null;
        const isDevolucion = categoryTitle.toLowerCase().includes('devoluciones');
        return (
            <React.Fragment key={categoryTitle}>
                <tr className="bg-slate-100"><td colSpan={7} className="py-1 px-3 text-sm font-semibold text-slate-700">{categoryTitle}</td></tr>
                {categoryData.accounts.map((acc) => {
                    const isExpanded = expandedAccounts.has(acc.cuenta);
                    const hasDocuments = acc.documentos && acc.documentos.length > 0;
                    return (
                        <React.Fragment key={acc.cuenta}>
                            <tr>
                                <td className="py-1 px-3 w-[15%] font-mono text-slate-800">
                                    <div className="flex items-center">
                                        {hasDocuments && (
                                            <button onClick={() => toggleExpand(acc.cuenta)} className="p-0.5 rounded-full hover:bg-slate-200 transition-colors mr-2">
                                                <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                        <span>{acc.cuenta}</span>
                                    </div>
                                </td>
                                <td className="py-1 px-3 w-[30%] text-slate-800">{acc.nombre}</td>
                                <td className="py-1 px-3 w-[18%] text-right font-mono text-slate-800">{formatCurrency(isDevolucion ? -acc.valorAuxiliar : acc.valorAuxiliar)}</td>
                                <td className="py-1 px-3 w-[18%]"></td>
                                <td className="py-1 px-3 w-[9%]"></td>
                                {!isPurchase && (
                                    <td className="py-1 px-3 w-[10%]">
                                        <input
                                            type="text"
                                            value={comments.get(acc.cuenta) || ''}
                                            onChange={(e) => onCommentChange(acc.cuenta, e.target.value)}
                                            className="w-full text-xs p-1 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500 bg-white text-slate-900"
                                            placeholder="Añadir comentario..."
                                        />
                                    </td>
                                )}
                            </tr>
                            {isExpanded && hasDocuments && (
                                <tr>
                                    <td colSpan={7} className="p-0 bg-slate-50">
                                        <div className="max-h-48 overflow-y-auto px-4 py-2">
                                            <table className="min-w-full text-xs">
                                                <thead className="bg-gray-200 text-gray-700 sticky top-0">
                                                    <tr>
                                                        <th className="p-1 text-left font-semibold w-1/4">Documento</th>
                                                        <th className="p-1 text-left font-semibold w-1/2">Nota</th>
                                                        <th className="p-1 text-right font-semibold w-1/4">Valor</th>
                                                        <th className="p-1 text-left font-semibold w-1/4">Reclasificar</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white">
                                                    {acc.documentos!.map((doc) => (
                                                        <tr key={doc.key} className="border-t border-gray-200 text-slate-800">
                                                            <td className="p-1 font-mono">{doc.docNum}</td>
                                                            <td className="p-1 truncate" title={doc.nota}>{doc.nota}</td>
                                                            <td className="p-1 text-right font-mono">{formatCurrency(doc.valor)}</td>
                                                            <td className="p-1">
                                                                <select
                                                                    value={ivaTransactionVatOverrides.get(doc.key) || 'no_clasificado'}
                                                                    onChange={(e) => onTransactionOverride(doc.key, e.target.value as VatCategory)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-full text-xs p-0.5 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500 bg-white text-slate-900"
                                                                >
                                                                    <option value="no_clasificado">Automático</option>
                                                                    <option value="gravado">Gravado</option>
                                                                    <option value="exento">Exento</option>
                                                                    <option value="excluido">Excluido</option>
                                                                    <option value="no_gravado">No Gravado</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    );
                })}
                <tr className="font-bold text-slate-800 border-t border-b border-gray-300">
                    <td colSpan={2} className="py-2 px-3 text-right">TOTAL {categoryTitle.toUpperCase()}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(isDevolucion ? -categoryData.totalAuxiliar : categoryData.totalAuxiliar)}</td>
                    <td 
                        className="py-2 px-3 text-right font-mono cursor-pointer hover:bg-amber-100 transition-colors"
                        onClick={() => onShowDianDetails(`Detalle DIAN - ${categoryTitle}`, categoryData.dianDocuments || [])}
                    >
                        {formatCurrency(categoryData.totalDian)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                         {formatCurrency(categoryData.difference)}
                    </td>
                    {!isPurchase && <td className="py-2 px-3"></td>}
                </tr>
            </React.Fragment>
        );
    };

    return (
        <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b-2 border-slate-900 pb-1">{title}</h3>
            <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
                <table className="min-w-full text-xs">
                    <thead className="bg-slate-900 text-white">
                        <tr>
                            <th className="py-2 px-3 text-left font-semibold uppercase tracking-wider">Cuenta</th>
                            <th className="py-2 px-3 text-left font-semibold uppercase tracking-wider">Nombre</th>
                            <th className="py-2 px-3 text-right font-semibold uppercase tracking-wider">Auxiliar</th>
                            <th className="py-2 px-3 text-right font-semibold uppercase tracking-wider">DIAN</th>
                            <th className="py-2 px-3 text-right font-semibold uppercase tracking-wider">Diferencia</th>
                            {!isPurchase && <th className="py-2 px-3 text-left font-semibold uppercase tracking-wider">Comentarios</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {renderCategory("Gravado", data.gravado)}
                        {renderCategory("Exento", data.exento)}
                        {renderCategory("Excluido", data.excluido)}
                        {renderCategory("No Gravado", data.no_gravado)}
                        {renderCategory("Devoluciones", data.devoluciones)}
                        <tr className="bg-slate-900 text-white font-bold text-sm">
                            <td colSpan={2} className="py-3 px-3 text-right">TOTAL {title.toUpperCase()}</td>
                            <td className="py-3 px-3 text-right font-mono">{formatCurrency(data.totalAuxiliar)}</td>
                            <td className="py-3 px-3 text-right font-mono">{formatCurrency(data.totalDian)}</td>
                            <td className="py-3 px-3 text-right font-mono">{formatCurrency(data.totalDifference)}</td>
                            {!isPurchase && <td className="py-3 px-3"></td>}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LiquidationSection;
