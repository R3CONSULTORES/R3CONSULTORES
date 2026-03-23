
import React, { useState } from 'react';
import type { IvaSectionResult, IvaCategoryData, DianDocumentDetail, VatCategory } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { ChevronDownIcon } from '../../Icons';

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

export const LiquidationSection: React.FC<LiquidationSectionProps> = ({ 
    title, data, isPurchase = false, comments, onCommentChange, onShowDianDetails, ivaTransactionVatOverrides, onTransactionOverride 
}) => {
    const [expandedAccounts, setExpandedAccounts] = useState(new Set<string>());

    const toggleExpand = (cuenta: string) => {
        setExpandedAccounts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(cuenta)) newSet.delete(cuenta);
            else newSet.add(cuenta);
            return newSet;
        });
    };
    
    const renderCategory = (categoryTitle: string, categoryData: IvaCategoryData) => {
        if (categoryData.accounts.length === 0 && categoryData.totalDian === 0) return null;
        const isDevolucion = categoryTitle.toLowerCase().includes('devoluciones');
        
        return (
            <>
                <tr className="bg-gray-50 border-b border-gray-100">
                    <td colSpan={7} className="py-2 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        {categoryTitle}
                    </td>
                </tr>
                {categoryData.accounts.map((acc) => {
                    const isExpanded = expandedAccounts.has(acc.cuenta);
                    const hasDocuments = acc.documentos && acc.documentos.length > 0;
                    return (
                        <React.Fragment key={acc.cuenta}>
                            <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                <td className="py-3 px-4 w-[15%] font-mono text-sm text-slate-700">
                                    <div className="flex items-center">
                                        {hasDocuments && (
                                            <button onClick={() => toggleExpand(acc.cuenta)} className="p-1 rounded-full hover:bg-slate-200 transition-colors mr-2 text-slate-400 hover:text-slate-600">
                                                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                        <span>{acc.cuenta}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 w-[30%] text-sm text-slate-600">{acc.nombre}</td>
                                <td className="py-3 px-4 w-[18%] text-right font-mono tabular-nums text-sm text-slate-700">
                                    {formatCurrency(isDevolucion ? -acc.valorAuxiliar : acc.valorAuxiliar)}
                                </td>
                                <td className="py-3 px-4 w-[18%]"></td>
                                <td className="py-3 px-4 w-[9%]"></td>
                                {!isPurchase && (
                                    <td className="py-3 px-4 w-[10%]">
                                        <input
                                            type="text"
                                            value={comments.get(acc.cuenta) || ''}
                                            onChange={(e) => onCommentChange(acc.cuenta, e.target.value)}
                                            className="w-full text-xs py-1 px-2 border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-700 placeholder-slate-400 transition-all"
                                            placeholder="Comentario..."
                                        />
                                    </td>
                                )}
                            </tr>
                             {isExpanded && hasDocuments && (
                                <tr>
                                    <td colSpan={7} className="p-0 bg-slate-50 border-y border-slate-200 shadow-inner">
                                        <div className="max-h-60 overflow-y-auto px-6 py-4">
                                            <table className="min-w-full text-xs">
                                                <thead className="text-slate-600 font-semibold border-b border-slate-300">
                                                    <tr>
                                                        <th className="pb-2 text-left w-1/4 pl-2">Documento</th>
                                                        <th className="pb-2 text-left w-1/2">Nota</th>
                                                        <th className="pb-2 text-right w-1/4 pr-2">Valor</th>
                                                        <th className="pb-2 text-left w-1/4 pl-4">Reclasificar</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {acc.documentos!.map((doc, index) => (
                                                        <tr key={doc.key} className="hover:bg-slate-100/50">
                                                            <td className="py-2 pl-2 font-mono text-slate-700">{doc.docNum}</td>
                                                            <td className="py-2 truncate max-w-[200px] text-slate-700" title={doc.nota}>{doc.nota}</td>
                                                            <td className="py-2 pr-2 text-right font-mono tabular-nums text-slate-900 font-bold">{formatCurrency(doc.valor)}</td>
                                                            <td className="py-2 pl-4">
                                                                <select
                                                                    value={ivaTransactionVatOverrides.get(doc.key) || 'no_clasificado'}
                                                                    onChange={(e) => onTransactionOverride(doc.key, e.target.value as VatCategory)}
                                                                    className="w-full text-[10px] py-1 pl-2 pr-6 border border-gray-300 rounded bg-white text-slate-800 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm hover:border-slate-400"
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
                    )
                })}
                <tr className="bg-slate-50/80 border-t border-slate-200 font-semibold text-slate-700">
                    <td colSpan={2} className="py-3 px-4 text-right text-xs uppercase tracking-wide">
                        TOTAL {categoryTitle}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-sm">
                        {formatCurrency(isDevolucion ? -categoryData.totalAuxiliar : categoryData.totalAuxiliar)}
                    </td>
                    <td 
                        className="py-3 px-4 text-right font-mono tabular-nums text-sm cursor-pointer hover:text-emerald-600 hover:underline transition-colors"
                        onClick={() => onShowDianDetails(`Detalle DIAN - ${categoryTitle}`, categoryData.dianDocuments || [])}
                        title="Ver detalle DIAN"
                    >
                        {formatCurrency(categoryData.totalDian)}
                        {(categoryData.totalDianGravado || categoryData.totalDianOtros) && (
                            <div className="text-[10px] font-normal text-slate-400 mt-0.5 leading-tight">
                                {categoryData.totalDianGravado !== 0 && <span>G: {formatCurrency(categoryData.totalDianGravado!)}</span>}
                                {categoryData.totalDianGravado !== 0 && categoryData.totalDianOtros !== 0 && <span className="mx-1">|</span>}
                                {categoryData.totalDianOtros !== 0 && <span>O: {formatCurrency(categoryData.totalDianOtros!)}</span>}
                            </div>
                         )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-sm font-bold text-slate-800">
                        {formatCurrency((isDevolucion ? -categoryData.totalAuxiliar : categoryData.totalAuxiliar) - categoryData.totalDian)}
                    </td>
                    {!isPurchase && <td />}
                </tr>
            </>
        );
    };

    const renderNetoTotalRow = (
        title: string, 
        mainCategoryData: IvaCategoryData, 
        devolucionCategoryData: IvaCategoryData,
        // bgColor argument is ignored in favor of the new design spec
    ) => {
        const netoAux = mainCategoryData.totalAuxiliar - devolucionCategoryData.totalAuxiliar;
        const netoDian = mainCategoryData.totalDian + devolucionCategoryData.totalDian; 
        
        if (netoAux === 0 && netoDian === 0 && mainCategoryData.accounts.length === 0 && devolucionCategoryData.accounts.length === 0) return null;
        
        const netoDianGravado = (mainCategoryData.totalDianGravado || 0) + (devolucionCategoryData.totalDianGravado || 0);
        const netoDianOtros = (mainCategoryData.totalDianOtros || 0) + (devolucionCategoryData.totalDianOtros || 0);
        const allDocs = [...(mainCategoryData.dianDocuments || []), ...(devolucionCategoryData.dianDocuments || [])];

        return (
            <tr className="bg-emerald-50 border-t-2 border-emerald-100 text-emerald-900 font-bold">
                <td colSpan={2} className="py-4 px-4 text-right text-sm uppercase tracking-wide">
                    {title}
                </td>
                <td className="py-4 px-4 text-right font-mono tabular-nums text-base">
                    {formatCurrency(netoAux)}
                </td>
                <td 
                    className="py-4 px-4 text-right font-mono tabular-nums text-base cursor-pointer hover:text-emerald-700 transition-colors"
                    onClick={() => onShowDianDetails(`Detalle DIAN - ${title}`, allDocs)}
                >
                    {formatCurrency(netoDian)}
                     {(netoDianGravado !== 0 || netoDianOtros !== 0) && (
                        <div className="text-[10px] font-normal text-emerald-700/70 mt-0.5 leading-tight">
                            {netoDianGravado !== 0 && <span>G: {formatCurrency(netoDianGravado)}</span>}
                            {netoDianGravado !== 0 && netoDianOtros !== 0 && <span className="mx-1">|</span>}
                            {netoDianOtros !== 0 && <span>O: {formatCurrency(netoDianOtros)}</span>}
                        </div>
                    )}
                </td>
                <td className="py-4 px-4 text-right font-mono tabular-nums text-base">
                    {formatCurrency(netoAux - netoDian)}
                </td>
                 {!isPurchase && <td />}
            </tr>
        )
    };

    const otrosIngresosData: IvaCategoryData = {
        accounts: [...data.exentos.accounts, ...data.excluidos.accounts, ...data.noGravados.accounts],
        totalAuxiliar: data.exentos.totalAuxiliar + data.excluidos.totalAuxiliar + data.noGravados.totalAuxiliar,
        totalDian: data.exentos.totalDian + data.excluidos.totalDian + data.noGravados.totalDian,
        totalDianGravado: (data.exentos.totalDianGravado || 0) + (data.excluidos.totalDianGravado || 0) + (data.noGravados.totalDianGravado || 0),
        totalDianOtros: (data.exentos.totalDianOtros || 0) + (data.excluidos.totalDianOtros || 0) + (data.noGravados.totalDianOtros || 0),
        dianDocuments: [
            ...(data.exentos.dianDocuments || []),
            ...(data.excluidos.dianDocuments || []),
            ...(data.noGravados.dianDocuments || []),
        ],
    };
    const otrosDevolucionesData: IvaCategoryData = {
        accounts: [...data.devolucionesExentas.accounts, ...data.devolucionesExcluidas.accounts, ...data.devolucionesNoGravadas.accounts],
        totalAuxiliar: data.devolucionesExentas.totalAuxiliar + data.devolucionesExcluidas.totalAuxiliar + data.devolucionesNoGravadas.totalAuxiliar,
        totalDian: data.devolucionesExentas.totalDian + data.devolucionesExcluidas.totalDian + data.devolucionesNoGravadas.totalDian,
        totalDianGravado: (data.devolucionesExentas.totalDianGravado || 0) + (data.devolucionesExcluidas.totalDianGravado || 0) + (data.devolucionesNoGravadas.totalDianGravado || 0),
        totalDianOtros: (data.devolucionesExentas.totalDianOtros || 0) + (data.devolucionesExcluidas.totalDianOtros || 0) + (data.devolucionesNoGravadas.totalDianOtros || 0),
        dianDocuments: [
            ...(data.devolucionesExentas.dianDocuments || []),
            ...(data.devolucionesExcluidas.dianDocuments || []),
            ...(data.devolucionesNoGravadas.dianDocuments || []),
        ],
    };

    // Cálculos para el Gran Total (Cierre Contable)
    const netoGravadosAux = data.gravados.totalAuxiliar - data.devolucionesGravadas.totalAuxiliar;
    const netoGravadosDian = data.gravados.totalDian + data.devolucionesGravadas.totalDian;

    const netoOtrosAux = otrosIngresosData.totalAuxiliar - otrosDevolucionesData.totalAuxiliar;
    const netoOtrosDian = otrosIngresosData.totalDian + otrosDevolucionesData.totalDian;

    const granTotalAux = netoGravadosAux + netoOtrosAux;
    const granTotalDian = netoGravadosDian + netoOtrosDian;
    const granTotalDif = granTotalAux - granTotalDian;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-white">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="text-xs text-slate-400 mt-1">Desglose detallado por cuentas y cruce con reporte DIAN</p>
             </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[15%]">Cuenta</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[30%]">{isPurchase ? 'Compras/Gastos' : 'Ingresos'}</th>
                            <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">Auxiliar</th>
                            <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">DIAN</th>
                            <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-[9%]">Diferencia</th>
                            {!isPurchase && <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[10%]">Comentarios</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {renderCategory("Ingresos Gravados", data.gravados)}
                        {renderCategory("Devoluciones Gravadas", data.devolucionesGravadas)}
                        {renderNetoTotalRow("NETO INGRESOS GRAVADOS", data.gravados, data.devolucionesGravadas)}
                        
                        {/* Spacer Row */}
                        <tr className="h-4 bg-white"><td colSpan={7}></td></tr>

                        {renderCategory("Otros Ingresos (Exentos, Excluidos, No Gravados)", otrosIngresosData)}
                        {renderCategory("Devoluciones Otros Ingresos", otrosDevolucionesData)}
                        {renderNetoTotalRow("NETO OTROS INGRESOS", otrosIngresosData, otrosDevolucionesData)}

                        {/* Spacer before Grand Total */}
                        <tr className="h-2 bg-white"><td colSpan={7}></td></tr>

                        {/* Grand Total Row (Accounting Close Style) */}
                        <tr className="bg-slate-100 border-t-4 border-double border-slate-300 font-bold text-slate-900">
                            <td colSpan={2} className="py-4 px-4 text-right text-sm uppercase tracking-wide">
                                TOTAL INGRESOS NETOS
                            </td>
                            <td className="py-4 px-4 text-right font-mono tabular-nums text-base">
                                {formatCurrency(granTotalAux)}
                            </td>
                            <td className="py-4 px-4 text-right font-mono tabular-nums text-base">
                                {formatCurrency(granTotalDian)}
                            </td>
                            <td className="py-4 px-4 text-right font-mono tabular-nums text-base">
                                {formatCurrency(granTotalDif)}
                            </td>
                            {!isPurchase && <td />}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
