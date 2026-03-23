import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import type { FileType, AppState, IvaLiquidationResult, VatCategory, IvaSectionResult, DianData, AuxiliarData, IvaCategoryData, CompraVatCategory, IvaDocumentDetail, IvaDescontableCategory, VentasComprasData, DianDocumentDetail } from '@/dashboard/types';
import { XMarkIcon, ChevronDownIcon } from '@/dashboard/components/Icons';
import Formulario300 from './views/iva/Formulario300';
import ClasificacionIvaDescontable from './views/iva/ClasificacionIvaDescontable';
import FileUploadCard from '@/dashboard/components/FileUploadCard';
import { parseExcelFile, processAuxiliar, processDian, processVentas, processCompras } from '@/dashboard/utils/parsing';
import RevisionIvaStep from './views/iva/RevisionIvaStep';
import { formatCurrency } from '@/dashboard/utils/formatters';
import { isDevolucionesComprasAccountFuzzy, normalizeTextForSearch } from './views/iva/ivaUtils';
import ClasificacionComprasTab from './views/iva/ClasificacionComprasTab';
import ProrrateoIvaDevolucionesTable from './views/iva/ProrrateoIvaDevolucionesTable';
import CoherenciaContable from './views/iva/CoherenciaContable';
import ExploradorDoc from './views/iva/ExploradorDoc';
import ProyeccionesIvaStep from './views/iva/ProyeccionesIvaStep';

interface AccountInfo {
    cuenta: string;
    nombre: string;
}

const ClasificacionModal: React.FC<{
    title: string;
    description: string;
    accounts: AccountInfo[];
    classifications: Map<string, VatCategory>;
    onClassificationChange: (cuenta: string, category: VatCategory) => void;
    onClose: () => void;
}> = ({ title, description, accounts, classifications, onClassificationChange, onClose }) => {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto">
                    <p className="text-sm text-gray-600 mb-4">{description}</p>
                    <div className="border rounded-lg shadow-sm">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="py-2 px-3 text-left font-medium text-gray-600 w-1/4">Cuenta</th>
                                    <th className="py-2 px-3 text-left font-medium text-gray-600 w-1/2">Nombre</th>
                                    <th className="py-2 px-3 text-left font-medium text-gray-600 w-1/4">Categoría IVA</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {accounts.map(({ cuenta, nombre }) => (
                                    <tr key={cuenta}>
                                        <td className="p-2 px-3 text-gray-800 font-mono">{cuenta}</td>
                                        <td className="p-2 px-3 text-gray-700">{nombre}</td>
                                        <td className="p-2 px-3">
                                            <select
                                                value={classifications.get(cuenta) || 'no_clasificado'}
                                                onChange={(e) => onClassificationChange(cuenta, e.target.value as VatCategory)}
                                                className="w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 text-sm bg-white text-slate-900"
                                            >
                                                <option value="no_clasificado">No Clasificado</option>
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
                </div>
                <div className="p-4 border-t bg-gray-50 text-right">
                    <button onClick={onClose} className="bg-slate-900 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-slate-700">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

const LiquidationSection: React.FC<{ 
    title: string; 
    data: IvaSectionResult; 
    isPurchase?: boolean;
    comments: Map<string, string>;
    onCommentChange: (cuenta: string, comment: string) => void;
    onShowDianDetails: (title: string, documents: DianDocumentDetail[]) => void;
    ivaTransactionVatOverrides: Map<string, VatCategory>;
    onTransactionOverride: (txKey: string, category: VatCategory) => void;
}> = ({ title, data, isPurchase = false, comments, onCommentChange, onShowDianDetails, ivaTransactionVatOverrides, onTransactionOverride }) => {
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
            <>
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
                                                    {acc.documentos!.map((doc, index) => (
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
                    )
                })}
                <tr className="font-bold text-slate-800 border-t border-b border-gray-300">
                    <td colSpan={2} className="py-2 px-3 text-right">TOTAL {categoryTitle.toUpperCase()}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(isDevolucion ? -categoryData.totalAuxiliar : categoryData.totalAuxiliar)}</td>
                    <td 
                        className="py-2 px-3 text-right font-mono cursor-pointer hover:bg-amber-100 transition-colors"
                        onClick={() => onShowDianDetails(`Detalle DIAN - ${categoryTitle}`, categoryData.dianDocuments || [])}
                    >
                        {formatCurrency(categoryData.totalDian)}
                        {(categoryData.totalDianGravado || categoryData.totalDianOtros) && (
                            <div className="text-xs font-normal text-slate-600 leading-tight">
                                {categoryData.totalDianGravado !== 0 && <span>G: {formatCurrency(categoryData.totalDianGravado!)}</span>}
                                {categoryData.totalDianGravado !== 0 && categoryData.totalDianOtros !== 0 && <br/>}
                                {categoryData.totalDianOtros !== 0 && <span>O: {formatCurrency(categoryData.totalDianOtros!)}</span>}
                            </div>
                         )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency((isDevolucion ? -categoryData.totalAuxiliar : categoryData.totalAuxiliar) - categoryData.totalDian)}</td>
                    {!isPurchase && <td />}
                </tr>
            </>
        );
    };

    const renderNetoTotalRow = (
        title: string, 
        mainCategoryData: IvaCategoryData, 
        devolucionCategoryData: IvaCategoryData,
        bgColor: string
    ) => {
        const netoAux = mainCategoryData.totalAuxiliar - devolucionCategoryData.totalAuxiliar;
        const netoDian = mainCategoryData.totalDian + devolucionCategoryData.totalDian; // Devoluciones DIAN are negative
        if (netoAux === 0 && netoDian === 0 && mainCategoryData.accounts.length === 0 && devolucionCategoryData.accounts.length === 0) return null;
        
        const netoDianGravado = (mainCategoryData.totalDianGravado || 0) + (devolucionCategoryData.totalDianGravado || 0);
        const netoDianOtros = (mainCategoryData.totalDianOtros || 0) + (devolucionCategoryData.totalDianOtros || 0);
        const allDocs = [...(mainCategoryData.dianDocuments || []), ...(devolucionCategoryData.dianDocuments || [])];

        return (
            <tr className={`${bgColor} font-bold text-slate-900`}>
                <td colSpan={2} className="py-2 px-3 text-right">{title}</td>
                <td className="py-2 px-3 text-right font-mono">{formatCurrency(netoAux)}</td>
                <td 
                    className="py-2 px-3 text-right font-mono cursor-pointer hover:bg-amber-200 transition-colors"
                    onClick={() => onShowDianDetails(`Detalle DIAN - ${title}`, allDocs)}
                >
                    {formatCurrency(netoDian)}
                     {(netoDianGravado !== 0 || netoDianOtros !== 0) && (
                        <div className="text-xs font-normal text-slate-600 leading-tight">
                            {netoDianGravado !== 0 && <span>G: {formatCurrency(netoDianGravado)}</span>}
                            {netoDianGravado !== 0 && netoDianOtros !== 0 && <br/>}
                            {netoDianOtros !== 0 && <span>O: {formatCurrency(netoDianOtros)}</span>}
                        </div>
                    )}
                </td>
                <td className="py-2 px-3 text-right font-mono">{formatCurrency(netoAux - netoDian)}</td>
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

    return (
        <div className="mb-6 border rounded-lg overflow-hidden">
             <h3 className="text-xl font-semibold text-slate-800 p-3 bg-slate-200">{title}</h3>
            <table className="min-w-full text-sm">
                <thead className="bg-slate-900 text-white">
                    <tr>
                        <th className="py-2 px-3 text-left w-[15%] font-semibold">CUENTA</th>
                        <th className="py-2 px-3 text-left w-[30%] font-semibold">{isPurchase ? 'COMPRAS/GASTOS' : 'INGRESOS'}</th>
                        <th className="py-2 px-3 text-right w-[18%] font-semibold">AUXILIAR</th>
                        <th className="py-2 px-3 text-right w-[18%] font-semibold">DIAN</th>
                        <th className="py-2 px-3 text-right w-[9%] font-semibold">DIF</th>
                        {!isPurchase && <th className="py-2 px-3 text-left w-[10%] font-semibold">COMENTARIOS</th>}
                    </tr>
                </thead>
                <tbody>
                    {renderCategory("Ingresos Gravados", data.gravados)}
                    {renderCategory("Devoluciones Gravadas", data.devolucionesGravadas)}
                    {renderNetoTotalRow("NETO INGRESOS GRAVADOS", data.gravados, data.devolucionesGravadas, "bg-blue-200")}
                    
                    <tr><td colSpan={7} className="pt-6"></td></tr>

                    {renderCategory("Otros Ingresos (Exentos, Excluidos, No Gravados)", otrosIngresosData)}
                    {renderCategory("Devoluciones Otros Ingresos", otrosDevolucionesData)}
                    {renderNetoTotalRow("NETO OTROS INGRESOS", otrosIngresosData, otrosDevolucionesData, "bg-blue-200")}
                </tbody>
            </table>
        </div>
    );
};

interface ProrrateoSummaryProps {
    ingresosData: IvaSectionResult;
    ventaActivosFijos: number;
    onVentaActivosFijosChange: (value: number) => void;
    percentages: { gravado: number; otros: number };
}

const ProrrateoSummary: React.FC<ProrrateoSummaryProps> = ({ ingresosData, ventaActivosFijos, onVentaActivosFijosChange, percentages }) => {
    const brutoGravado = ingresosData.gravados.totalAuxiliar;
    const otrosIngresosBrutos = ingresosData.exentos.totalAuxiliar + ingresosData.excluidos.totalAuxiliar + ingresosData.noGravados.totalAuxiliar;
    const totalIngresosProrrateo = brutoGravado + otrosIngresosBrutos;
    
    const formatPercentage = (value: number) => {
        if (isNaN(value) || !isFinite(value)) return '0,00%';
        return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        onVentaActivosFijosChange(Number(value) || 0);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="border border-gray-400">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-900 text-white font-bold">
                        <tr>
                            <th colSpan={3} className="py-2 px-3 text-center text-base">PROPORCIONALIDAD INGRESOS</th>
                        </tr>
                        <tr className="bg-slate-700">
                            <th className="py-2 px-3 text-left w-[60%] font-bold">TOTAL INGRESOS BRUTOS PARA PRORRATEO</th>
                            <th className="py-2 px-3 text-right font-mono">{formatCurrency(totalIngresosProrrateo)}</th>
                            <th className="w-[20%]"></th>
                        </tr>
                        <tr className="bg-slate-600 font-semibold">
                            <th colSpan={3} className="py-1 px-3 text-center tracking-widest">PROPORCIÓN</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-800 bg-white">
                        <tr className="border-t border-gray-300">
                            <td className="py-2 px-3 font-medium">TOTAL INGRESOS BRUTOS GRAVADOS</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(brutoGravado)}</td>
                            <td className="py-2 px-3 text-right font-mono bg-gray-200">{formatPercentage(percentages.gravado)}</td>
                        </tr>
                        <tr className="border-t border-gray-300">
                            <td className="py-2 px-3 font-medium">Otros Ingresos (Exentos, Excluidos, No Gravados)</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(otrosIngresosBrutos)}</td>
                            <td className="py-2 px-3 text-right font-mono bg-gray-200">{formatPercentage(percentages.otros)}</td>
                        </tr>
                        <tr className="border-t border-gray-300">
                            <td className="py-2 px-3 font-medium">INGRESOS X VENTA DE ACTIVOS FIJOS</td>
                            <td className="py-2 px-3 text-right font-mono">
                                <input
                                    type="text"
                                    value={ventaActivosFijos === 0 ? '' : ventaActivosFijos.toLocaleString('es-CO')}
                                    onChange={handleInputChange}
                                    className="w-full p-1 border border-gray-300 rounded-md shadow-sm text-right font-mono text-slate-800 bg-white focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                                    placeholder="0"
                                />
                            </td>
                            <td className="py-2 px-3 text-right font-mono bg-gray-200">{formatPercentage(totalIngresosProrrateo > 0 ? (ventaActivosFijos / totalIngresosProrrateo) * 100 : 0)}</td>
                        </tr>
                    </tbody>
                    <tfoot className="bg-slate-200 font-bold text-slate-800">
                        <tr className="border-t-2 border-gray-400">
                            <td className="py-2 px-3">TOTAL</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(totalIngresosProrrateo + ventaActivosFijos)}</td>
                            <td className="py-2 px-3 text-right font-mono bg-gray-200">{formatPercentage(totalIngresosProrrateo > 0 ? ((totalIngresosProrrateo + ventaActivosFijos) / totalIngresosProrrateo) * 100: 0)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};


const LiquidacionIvaTable: React.FC<{ 
    auxiliar: AuxiliarData[];
    dian: DianData[];
    selectedIvaAccounts: Map<string, boolean>;
    onAccountSelectionChange: (cuenta: string) => void;
    ivaCalculado19: number;
    totalIvaGeneradoBrutoBp: number;
    totalIvaDevolucionesVentasBp: number;
    ivaVentasDian: number;
    ivaDevolucionesVentasDian: number;
    totalIvaDescontableBp: number;
    totalIvaTransitorioBp: number;
    totalIvaDevolucionesComprasBp: number;
    ivaComprasDian: number;
    ivaDevolucionesComprasDian: number;
}> = ({ 
    auxiliar, dian, selectedIvaAccounts, onAccountSelectionChange, ivaCalculado19,
    totalIvaGeneradoBrutoBp, totalIvaDevolucionesVentasBp, ivaVentasDian, ivaDevolucionesVentasDian,
    totalIvaDescontableBp, totalIvaTransitorioBp, totalIvaDevolucionesComprasBp, ivaComprasDian, ivaDevolucionesComprasDian
}) => {

    const context = useContext(AppContext);
    if (!context) return null;
    const { appState } = context;


    const isIvaGeneradoAccount = (accountName: string) => {
        const normalized = normalizeTextForSearch(accountName);
        return normalized.includes('iva gen') || normalized.includes('iva generado');
    };

    const isDevolucionesVentasAccount = (accountName: string) => {
        const normalized = normalizeTextForSearch(accountName);
        if (normalized.includes('compras')) return false;
        return normalized.includes('devoluciones en ventas');
    };

    const isIvaDescontableAccount = (accountCode: string) => accountCode.startsWith('240802');
    const isIvaTransitorioAccount = (accountCode: string) => accountCode.startsWith('240803');
    
    const all2408Accounts = useMemo(() => {
        const accounts = new Map<string, { nombre: string, creditos: number, debitos: number }>();
        auxiliar
            .filter(row => row.Cuenta.startsWith('2408'))
            .forEach(row => {
                const current = accounts.get(row.Cuenta) || { nombre: row.Cuenta.split(' ').slice(1).join(' ').trim(), creditos: 0, debitos: 0 };
                current.creditos += row.Creditos;
                current.debitos += row.Debitos;
                accounts.set(row.Cuenta, current);
            });
        return Array.from(accounts.entries()).map(([cuenta, data]) => ({ cuenta, ...data }));
    }, [auxiliar]);

    const ivaGeneradoAccounts = useMemo(() => all2408Accounts.filter(({ cuenta }) => isIvaGeneradoAccount(cuenta)), [all2408Accounts]);
    const ivaDevolucionesVentasAccounts = useMemo(() => all2408Accounts.filter(({ cuenta }) => isDevolucionesVentasAccount(cuenta)), [all2408Accounts]);
    
    const ivaDescontableAccounts = useMemo(() => all2408Accounts.filter(({ cuenta }) => {
        if (appState.ivaDescontableClassification.get(cuenta) === 'no_tener_en_cuenta') {
            return false;
        }
        return isIvaDescontableAccount(cuenta.split(' ')[0]) && !isDevolucionesVentasAccount(cuenta) && !isDevolucionesComprasAccountFuzzy(cuenta);
    }), [all2408Accounts, appState.ivaDescontableClassification]);

    const ivaTransitorioAccounts = useMemo(() => all2408Accounts.filter(({ cuenta }) => {
        if (appState.ivaDescontableClassification.get(cuenta) === 'no_tener_en_cuenta') {
            return false;
        }
        return isIvaTransitorioAccount(cuenta.split(' ')[0]);
    }), [all2408Accounts, appState.ivaDescontableClassification]);

    const ivaDevolucionesComprasAccounts = useMemo(() => all2408Accounts.filter(({ cuenta }) => isDevolucionesComprasAccountFuzzy(cuenta)), [all2408Accounts]);

    const totalIvaGeneradoNetoBp = totalIvaGeneradoBrutoBp - totalIvaDevolucionesVentasBp;
    const totalIvaGeneradoNetoDian = ivaVentasDian - ivaDevolucionesVentasDian;
    const totalIvaDescYTransBp = totalIvaDescontableBp + totalIvaTransitorioBp;
    const totalIvaDescontableNetoBp = totalIvaDescYTransBp - totalIvaDevolucionesComprasBp;
    const totalIvaDescontableNetoDian = ivaComprasDian - ivaDevolucionesComprasDian;
    
    return (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 border-b pb-3">Resumen Liquidación IVA</h2>
            <div className="border-2 border-slate-600">
                <table className="min-w-full text-sm border-collapse">
                    <tbody>
                        {/* IVA GENERADO Section */}
                        <tr className="bg-slate-900 text-white font-bold">
                            <th colSpan={6} className="p-2 border border-slate-500 text-left text-base">IVA GENERADO</th>
                        </tr>
                        <tr className="bg-slate-900 text-white font-semibold">
                            <th className="p-2 border border-slate-500 text-center w-12">INC</th>
                            <th className="p-2 border border-slate-500 text-left w-[15%]">CÓDIGO</th>
                            <th className="p-2 border border-slate-500 text-left w-[35%]">CONCEPTO</th>
                            <th className="p-2 border border-slate-500 text-center w-[12.5%]">VALOR BP</th>
                            <th className="p-2 border border-slate-500 text-center w-[12.5%]">VALOR DIAN</th>
                            <th className="p-2 border border-slate-500 text-center w-[12.5%]">DIFERENCIA</th>
                        </tr>
                        {ivaGeneradoAccounts.map(({ cuenta, nombre, creditos }) => (
                             <tr key={cuenta} className="border-b border-gray-300 bg-white text-black">
                                <td className="p-1 px-2 border border-gray-400 text-center">
                                    <input type="checkbox" checked={selectedIvaAccounts.get(cuenta) ?? false} onChange={() => onAccountSelectionChange(cuenta)} className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded" />
                                </td>
                                <td className="p-1 px-2 border border-gray-400 font-mono">{cuenta.split(' ')[0]}</td>
                                <td className="p-1 px-2 border border-gray-400">{nombre}</td>
                                <td className="p-1 px-2 border border-gray-400 text-right font-mono bg-gray-100">{formatCurrency(creditos)}</td>
                                <td colSpan={2} className="border-r border-gray-400"></td>
                            </tr>
                        ))}
                        <tr className="font-bold bg-slate-200 text-black">
                            <td colSpan={3} className="p-2 px-2 border border-slate-500 text-left">TOTAL IVA GENERADO BRUTO</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(totalIvaGeneradoBrutoBp)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(ivaVentasDian)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(totalIvaGeneradoBrutoBp - ivaVentasDian)}</td>
                        </tr>
                        <tr className="font-bold bg-slate-200 text-black">
                            <td colSpan={3} className="p-2 px-2 border border-slate-500 text-left">IVA 19% S/INGRESOS GRAVADOS BP</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(ivaCalculado19)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-100" colSpan={1}></td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(totalIvaGeneradoBrutoBp - ivaCalculado19)}</td>
                        </tr>
                        {ivaDevolucionesVentasAccounts.map(({ cuenta, nombre, debitos }) => (
                             <tr key={cuenta} className="border-b border-gray-300 bg-white text-black">
                                <td className="p-1 px-2 border border-gray-400 text-center">
                                    <input type="checkbox" checked={selectedIvaAccounts.get(cuenta) ?? false} onChange={() => onAccountSelectionChange(cuenta)} className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded" />
                                </td>
                                <td className="p-1 px-2 border border-gray-400 font-mono">{cuenta.split(' ')[0]}</td>
                                <td className="p-1 px-2 border border-gray-400">{nombre}</td>
                                <td className="p-1 px-2 border border-gray-400 text-right font-mono bg-gray-100">{formatCurrency(-debitos)}</td>
                                <td colSpan={2} className="border-r border-gray-400"></td>
                            </tr>
                        ))}
                         <tr className="font-bold bg-slate-200 text-black">
                            <td colSpan={3} className="p-2 px-2 border border-slate-500 text-left">(-) DEVOLUCIONES EN VENTAS</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(-totalIvaDevolucionesVentasBp)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(-ivaDevolucionesVentasDian)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(-(totalIvaDevolucionesVentasBp - ivaDevolucionesVentasDian))}</td>
                        </tr>
                        <tr className="font-bold bg-slate-300 text-black">
                            <td colSpan={3} className="p-2 px-2 border border-slate-500 text-left text-base">TOTAL IVA GENERADO</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono text-base bg-slate-200">{formatCurrency(totalIvaGeneradoNetoBp)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono text-base bg-slate-200">{formatCurrency(totalIvaGeneradoNetoDian)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono text-base bg-slate-200">{formatCurrency(totalIvaGeneradoNetoBp - totalIvaGeneradoNetoDian)}</td>
                        </tr>
                        
                        {/* Spacer */}
                        <tr><td colSpan={6} className="py-4 bg-white"></td></tr>

                        {/* IVA DESCONTABLE Section */}
                        <tr className="bg-slate-900 text-white font-bold">
                            <th colSpan={6} className="p-2 border border-slate-500 text-left text-base">IVA DESCONTABLE</th>
                        </tr>
                        <tr className="bg-slate-900 text-white font-semibold">
                            <th className="p-2 border border-slate-500 text-center w-12">INC</th>
                            <th className="p-2 border border-slate-500 text-left w-[15%]">CÓDIGO</th>
                            <th className="p-2 border border-slate-500 text-left w-[35%]">CONCEPTO</th>
                            <th className="p-2 border border-slate-500 text-center w-[12.5%]">VALOR BP</th>
                            <th className="p-2 border border-slate-500 text-center w-[12.5%]">VALOR DIAN</th>
                            <th className="p-2 border border-slate-500 text-center w-[12.5%]">DIFERENCIA</th>
                        </tr>
                        {ivaDescontableAccounts.map(({ cuenta, nombre, debitos }) => (
                             <tr key={cuenta} className="border-b border-gray-300 bg-white text-black">
                                <td className="p-1 px-2 border border-gray-400 text-center">
                                    <input type="checkbox" checked={selectedIvaAccounts.get(cuenta) ?? false} onChange={() => onAccountSelectionChange(cuenta)} className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded" />
                                </td>
                                <td className="p-1 px-2 border border-gray-400 font-mono">{cuenta.split(' ')[0]}</td>
                                <td className="p-1 px-2 border border-gray-400">{nombre}</td>
                                <td className="p-1 px-2 border border-gray-400 text-right font-mono bg-gray-100">{formatCurrency(debitos)}</td>
                                <td className="border-r border-gray-400"></td>
                                <td className="border-r border-gray-400"></td>
                             </tr>
                        ))}
                        <tr className="font-bold bg-slate-200 text-black">
                            <td colSpan={3} className="p-2 px-2 border-r border-slate-500 text-left">TOTAL IVA DESCONTABLE</td>
                            <td className="p-2 px-2 border-l border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(totalIvaDescontableBp)}</td>
                            <td className="border-r border-slate-500"></td>
                            <td className="border-r border-slate-500"></td>
                        </tr>
                        {ivaTransitorioAccounts.map(({ cuenta, nombre, debitos }) => (
                             <tr key={cuenta} className="border-b border-gray-300 bg-white text-black">
                                 <td className="p-1 px-2 border border-gray-400 text-center">
                                    <input type="checkbox" checked={selectedIvaAccounts.get(cuenta) ?? false} onChange={() => onAccountSelectionChange(cuenta)} className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded" />
                                </td>
                                <td className="p-1 px-2 border border-gray-400 font-mono">{cuenta.split(' ')[0]}</td>
                                <td className="p-1 px-2 border border-gray-400">{nombre}</td>
                                <td className="p-1 px-2 border border-gray-400 text-right font-mono bg-gray-100">{formatCurrency(debitos)}</td>
                                <td className="border-r border-gray-400"></td>
                                <td className="border-r border-gray-400"></td>
                             </tr>
                        ))}
                        <tr className="font-bold bg-slate-200 text-black">
                            <td colSpan={3} className="p-2 px-2 border-r border-slate-500 text-left">TOTAL IVA TRANSITORIO</td>
                            <td className="p-2 px-2 border-l border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(totalIvaTransitorioBp)}</td>
                            <td className="border-r border-slate-500"></td>
                            <td className="border-r border-slate-500"></td>
                        </tr>
                        <tr className="font-bold bg-slate-300 text-black">
                            <td colSpan={3} className="p-2 px-2 border border-slate-500 text-left">TOTAL IVA DESCONTABLE Y TRANSITORIO</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-200">{formatCurrency(totalIvaDescYTransBp)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-200">{formatCurrency(ivaComprasDian)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-200">{formatCurrency(totalIvaDescYTransBp - ivaComprasDian)}</td>
                        </tr>
                        {ivaDevolucionesComprasAccounts.map(({ cuenta, nombre, creditos }) => (
                             <tr key={cuenta} className="border-b border-gray-300 bg-white text-black">
                                 <td className="p-1 px-2 border border-gray-400 text-center">
                                    <input type="checkbox" checked={selectedIvaAccounts.get(cuenta) ?? false} onChange={() => onAccountSelectionChange(cuenta)} className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded" />
                                </td>
                                <td className="p-1 px-2 border border-gray-400 font-mono">{cuenta.split(' ')[0]}</td>
                                <td className="p-1 px-2 border border-gray-400">{nombre}</td>
                                <td className="p-1 px-2 border border-gray-400 text-right font-mono bg-gray-100">{formatCurrency(-creditos)}</td>
                                <td className="border-r border-gray-400"></td>
                                <td className="border-r border-gray-400"></td>
                            </tr>
                        ))}
                         <tr className="font-bold bg-slate-200 text-black">
                            <td colSpan={3} className="p-2 px-2 border border-slate-500 text-left">(-) DEVOLUCIONES EN COMPRAS</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(-totalIvaDevolucionesComprasBp)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(-ivaDevolucionesComprasDian)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono bg-slate-100">{formatCurrency(-(totalIvaDevolucionesComprasBp - ivaDevolucionesComprasDian))}</td>
                        </tr>
                         <tr className="font-bold bg-slate-300 text-black">
                            <td colSpan={3} className="p-2 px-2 border border-slate-500 text-left text-base">TOTAL IVA DESCONTABLE</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono text-base bg-slate-200">{formatCurrency(totalIvaDescontableNetoBp)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono text-base bg-slate-200">{formatCurrency(totalIvaDescontableNetoDian)}</td>
                            <td className="p-2 px-2 border border-slate-500 text-right font-mono text-base bg-slate-200">{formatCurrency(totalIvaDescontableNetoBp - totalIvaDescontableNetoDian)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface IvaDescontableBreakdownProps {
    auxiliarData: AuxiliarData[];
    selectedIvaAccounts: Map<string, boolean>;
    percentages: { gravado: number; otros: number };
    ivaDescontableClassification: Map<string, IvaDescontableCategory>;
}

const IvaDescontableBreakdown: React.FC<IvaDescontableBreakdownProps> = ({ auxiliarData, selectedIvaAccounts, percentages, ivaDescontableClassification }) => {
    const [expandedRows, setExpandedRows] = useState(new Set<string>());

    const isDevolucionesVentasAccount = (accountName: string) => {
        const normalized = normalizeTextForSearch(accountName);
        if (normalized.includes('compras')) return false;
        return normalized.includes('devoluciones en ventas');
    };

    const classifyIvaAccount = (accountName: string): 'compras' | 'servicios' => {
        const normalized = normalizeTextForSearch(accountName);
        const serviceKeywords = ['servicio', 'honorario', 'arrendamiento', 'aseo', 'vigilancia', 'temporal', 'transporte'];
        if (serviceKeywords.some(kw => normalized.includes(kw))) {
            return 'servicios';
        }
        return 'compras';
    };

    const breakdown = useMemo(() => {
        const result = {
            descontable: { compras: 0, servicios: 0, accounts: { compras: [] as any[], servicios: [] as any[] } },
            transitorio: { compras: 0, servicios: 0, accounts: { compras: [] as any[], servicios: [] as any[] } },
        };
        
        const pDeclaracion = percentages.gravado / 100;

        const accounts = new Map<string, { nombre: string, valor: number }>();
        auxiliarData.forEach(row => {
            if (
                row.Cuenta.startsWith('2408') && 
                selectedIvaAccounts.get(row.Cuenta) &&
                ivaDescontableClassification.get(row.Cuenta) !== 'no_tener_en_cuenta'
            ) {
                const current = accounts.get(row.Cuenta) || { nombre: row.Cuenta.substring(row.Cuenta.split(' ')[0].length).trim(), valor: 0 };
                current.valor += row.Debitos;
                accounts.set(row.Cuenta, current);
            }
        });
        
        accounts.forEach(({ nombre, valor }, cuenta) => {
            if (isDevolucionesVentasAccount(nombre)) return;

            const code = cuenta.split(' ')[0];
            const classification = classifyIvaAccount(nombre);
            
            const valorProrrateado = valor * pDeclaracion;
            const accountDetail = { cuenta, nombre, valor: valorProrrateado };
            
            if (code.startsWith('240802')) { // Descontable
                result.descontable[classification] += valorProrrateado;
                result.descontable.accounts[classification].push(accountDetail);
            } else if (code.startsWith('240803')) { // Transitorio
                result.transitorio[classification] += valorProrrateado;
                result.transitorio.accounts[classification].push(accountDetail);
            }
        });

        return result;

    }, [auxiliarData, selectedIvaAccounts, percentages, ivaDescontableClassification]);

    const toggleRow = (key: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) newSet.delete(key);
            else newSet.add(key);
            return newSet;
        });
    };

    const renderDetailRow = (key: string, label: string, comprasValue: number, serviciosValue: number, accounts: { compras: any[], servicios: any[] }) => {
        const isExpanded = expandedRows.has(key);
        const total = comprasValue + serviciosValue;
        const hasDetails = accounts.compras.length > 0 || accounts.servicios.length > 0;

        return (
            <React.Fragment>
                <tr className="bg-white hover:bg-gray-50 text-black">
                    <td className="p-2 border-r border-gray-300 font-medium text-slate-800">
                        <div className="flex items-center">
                            {hasDetails && (
                                <button onClick={() => toggleRow(key)} className="mr-2 p-1 rounded-full hover:bg-gray-200">
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                            {label}
                        </div>
                    </td>
                    <td className="p-2 border-r border-gray-300 text-right font-mono">{formatCurrency(comprasValue)}</td>
                    <td className="p-2 border-r border-gray-300 text-right font-mono">{formatCurrency(serviciosValue)}</td>
                    <td className="p-2 text-right font-mono font-semibold">{formatCurrency(total)}</td>
                </tr>
                {isExpanded && (
                    <tr>
                        <td colSpan={4} className="p-2 bg-gray-50 text-black">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-xs mb-1">Cuentas Compras</h4>
                                    {accounts.compras.length > 0 ? (
                                        <ul className="text-xs list-disc pl-5">
                                            {accounts.compras.map(acc => <li key={acc.cuenta}>{acc.cuenta}: <span className="font-mono">{formatCurrency(acc.valor)}</span></li>)}
                                        </ul>
                                    ) : <p className="text-xs italic text-gray-500">N/A</p>}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-xs mb-1">Cuentas Servicios</h4>
                                     {accounts.servicios.length > 0 ? (
                                        <ul className="text-xs list-disc pl-5">
                                            {accounts.servicios.map(acc => <li key={acc.cuenta}>{acc.cuenta}: <span className="font-mono">{formatCurrency(acc.valor)}</span></li>)}
                                        </ul>
                                    ) : <p className="text-xs italic text-gray-500">N/A</p>}
                                </div>
                            </div>
                        </td>
                    </tr>
                )}
            </React.Fragment>
        );
    };

    const totalCompras = breakdown.descontable.compras + breakdown.transitorio.compras;
    const totalServicios = breakdown.descontable.servicios + breakdown.transitorio.servicios;
    const granTotal = totalCompras + totalServicios;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mt-8">
            <table className="min-w-full text-sm border-collapse border-2 border-slate-400">
                <thead className="bg-slate-900 text-white">
                    <tr>
                        <th className="p-2 border-r border-slate-500 text-left w-[40%]">IVA</th>
                        <th className="p-2 border-r border-slate-500 text-center">IVA DESCTABLE COMPRAS</th>
                        <th className="p-2 border-r border-slate-500 text-center">IVA DESCTABLE SERVICIOS</th>
                        <th className="p-2 text-center">TOTAL DESCONTABLE</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 text-black">
                    {renderDetailRow('descontable', 'DESCONTABLE NO PRORRATEADO', breakdown.descontable.compras, breakdown.descontable.servicios, breakdown.descontable.accounts)}
                    {renderDetailRow('transitorio', 'DESCONTABLE TRANSITORIO', breakdown.transitorio.compras, breakdown.transitorio.servicios, breakdown.transitorio.accounts)}
                    <tr className="bg-slate-200 font-bold text-slate-800">
                        <td className="p-2 border-r border-t-2 border-slate-400">TOTAL</td>
                        <td className="p-2 border-r border-t-2 border-slate-400 text-right font-mono">{formatCurrency(totalCompras)}</td>
                        <td className="p-2 border-r border-t-2 border-slate-400 text-right font-mono">{formatCurrency(totalServicios)}</td>
                        <td className="p-2 border-t-2 border-slate-400 text-right font-mono">{formatCurrency(granTotal)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

interface LiquidacionFinalProps {
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

const LiquidacionFinal: React.FC<LiquidacionFinalProps> = ({
    ivaGeneradoVentas,
    devolucionesComprasProrrateadas,
    devolucionesVentas,
    ivaDescontableFinal,
    ivaTransitorioFinal,
    retencionIva,
    ivaAPagarReal,
    ivaDescontableFactProrrateado,
    sobrantes,
    onSobrantesChange
}) => {
    
    const handleSobrantesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        onSobrantesChange(Number(value) || 0);
    };

    const totalIvaGenReal = ivaGeneradoVentas + devolucionesComprasProrrateadas;
    const totalIvaDescontableReal = devolucionesVentas + ivaDescontableFinal + ivaTransitorioFinal;
    const totalIvaDescontableProyectado = totalIvaDescontableReal + ivaDescontableFactProrrateado;
    const ivaAPagarProyectado = totalIvaGenReal - totalIvaDescontableProyectado - retencionIva - sobrantes;
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Liquidación Final de IVA</h2>
            <div className="border-2 border-slate-600">
                <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-slate-900 text-white font-bold text-base">
                        <tr>
                            <th className="p-2 border-r border-slate-500 text-left w-1/2">CONCEPTO</th>
                            <th className="p-2 text-center w-1/4">REAL</th>
                            <th className="p-2 text-center w-1/4">PROYECTADO</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-800 text-base">
                        <tr className="bg-white"><td className="p-2 text-left font-semibold">IVA Generado en Ventas</td><td className="p-2 text-right font-mono">{formatCurrency(ivaGeneradoVentas)}</td><td className="p-2 text-right font-mono">{formatCurrency(ivaGeneradoVentas)}</td></tr>
                        <tr className="bg-white"><td className="p-2 text-left font-semibold">IVA Recuperado en Devoluciones de Compras (prorrateado)</td><td className="p-2 text-right font-mono">{formatCurrency(devolucionesComprasProrrateadas)}</td><td className="p-2 text-right font-mono">{formatCurrency(devolucionesComprasProrrateadas)}</td></tr>
                        <tr className="bg-slate-200 font-bold"><td className="p-2 text-left">TOTAL IVA GENERADO</td><td className="p-2 text-right font-mono">{formatCurrency(totalIvaGenReal)}</td><td className="p-2 text-right font-mono">{formatCurrency(totalIvaGenReal)}</td></tr>

                        <tr className="bg-white"><td className="p-2 text-left font-semibold">(-) IVA Devoluciones en Ventas</td><td className="p-2 text-right font-mono">{formatCurrency(devolucionesVentas)}</td><td className="p-2 text-right font-mono">{formatCurrency(devolucionesVentas)}</td></tr>
                        <tr className="bg-white"><td className="p-2 text-left font-semibold">(-) IVA Descontable (prorrateado)</td><td className="p-2 text-right font-mono">{formatCurrency(ivaDescontableFinal)}</td><td className="p-2 text-right font-mono">{formatCurrency(ivaDescontableFinal)}</td></tr>
                        <tr className="bg-white"><td className="p-2 text-left font-semibold">(-) IVA Transitorio (prorrateado)</td><td className="p-2 text-right font-mono">{formatCurrency(ivaTransitorioFinal)}</td><td className="p-2 text-right font-mono">{formatCurrency(ivaTransitorioFinal)}</td></tr>
                        <tr className="bg-white"><td className="p-2 text-left font-semibold">(-) IVA Descontable Factura Proyectada (prorrateado)</td><td className="p-2 text-right font-mono text-gray-400">$ 0</td><td className="p-2 text-right font-mono">{formatCurrency(ivaDescontableFactProrrateado)}</td></tr>
                        <tr className="bg-slate-200 font-bold"><td className="p-2 text-left">TOTAL IVA DESCONTABLE</td><td className="p-2 text-right font-mono">{formatCurrency(totalIvaDescontableReal)}</td><td className="p-2 text-right font-mono">{formatCurrency(totalIvaDescontableProyectado)}</td></tr>

                        <tr className="bg-white"><td className="p-2 text-left font-semibold">(-) Retención de IVA que le practicaron</td><td className="p-2 text-right font-mono">{formatCurrency(retencionIva)}</td><td className="p-2 text-right font-mono">{formatCurrency(retencionIva)}</td></tr>
                        <tr className="bg-white">
                            <td className="p-2 text-left font-semibold align-middle">(-) Sobrantes de IVA del periodo anterior</td>
                            <td colSpan={2} className="p-1">
                                <input
                                    type="text"
                                    value={sobrantes === 0 ? '' : sobrantes.toLocaleString('es-CO')}
                                    onChange={handleSobrantesChange}
                                    className="w-full p-1 border-gray-300 bg-yellow-100 rounded-md shadow-sm text-right font-mono text-base placeholder-gray-400"
                                    placeholder="0"
                                />
                            </td>
                        </tr>

                        <tr className="bg-green-600 text-white font-bold text-lg"><td className="p-3 text-left">TOTAL IVA A PAGAR</td><td className="p-3 text-right font-mono">{formatCurrency(ivaAPagarReal)}</td><td className="p-3 text-right font-mono">{formatCurrency(ivaAPagarProyectado)}</td></tr>

                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface ProjectedIncomeStatementProps {
    totalIngNetos: number;
    costosGastosPeriodo: number;
    facturaASolicitar: number;
}

const ProjectedIncomeStatement: React.FC<ProjectedIncomeStatementProps> = ({
    totalIngNetos,
    costosGastosPeriodo,
    facturaASolicitar,
}) => {
    const totalCostosGastos = costosGastosPeriodo + facturaASolicitar;
    const utilidadPerdida = totalIngNetos - totalCostosGastos;

    const formatPercentage = (value: number, base: number) => {
        if (base === 0) return '0,00%';
        const percentage = (value / base) * 100;
        return percentage.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    };

    const renderRow = (label: string, value: number, isHeaderOrTotal = false, isFinal = false) => (
        <tr className={isHeaderOrTotal ? 'bg-slate-300 font-bold' : (isFinal ? 'bg-white font-bold' : 'bg-white')}>
            <td className={`p-2 border-r border-slate-400 text-slate-800`}>{label}</td>
            <td className={`p-2 border-r border-slate-400 text-right font-mono text-slate-800`}>{formatCurrency(value)}</td>
            <td className={`p-2 text-right font-mono text-slate-800`}>{label.startsWith('TOTAL ING') ? '%' : formatPercentage(value, totalIngNetos)}</td>
        </tr>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mt-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Estado de Resultados Proyectado</h2>
            <div className="border-2 border-slate-500">
                <table className="min-w-full text-sm">
                    <tbody>
                        {renderRow('TOTAL ING NETOS DEL PERIODO', totalIngNetos, true)}
                        {renderRow('COSTOS Y GASTOS DEL PERIODO', costosGastosPeriodo)}
                        {renderRow('FACTURA A SOLICITAR', facturaASolicitar)}
                        {renderRow('TOTAL COSTOS Y GASTOS DEL PERIODO', totalCostosGastos, true)}
                        {renderRow(utilidadPerdida >= 0 ? 'UTILIDAD BRUTA' : 'PÉRDIDA BRUTA', utilidadPerdida, false, true)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const IvaReview: React.FC = () => {
    const context = useContext(AppContext);
    const [activeTab, setActiveTab] = useState<'control' | 'proyecciones' | 'clasificacion_compras' | 'clasificacion_iva_descontable' | 'prorrateo' | 'liquidacion' | 'formulario_300' | 'revision' | 'coherencia' | 'exploradorDoc'>('control');
    const [modal, setModal] = useState<'none' | 'ingresos'>('none');
    const [dianDetailModal, setDianDetailModal] = useState<{ title: string; documents: DianDocumentDetail[] } | null>(null);
    const [ventaActivosFijos, setVentaActivosFijos] = useState<number>(0);
    const [selectedIvaAccounts, setSelectedIvaAccounts] = useState<Map<string, boolean>>(new Map());
    const [ivaTypeFilter, setIvaTypeFilter] = useState<'descontable' | 'transitorio' | 'ambos'>('descontable');
    const [ivaDeseado, setIvaDeseado] = useState<number>(0);
    const [facturaIvaRate, setFacturaIvaRate] = useState<number>(19);
    const [sobrantes, setSobrantes] = useState<number>(0);
    const [formDataSource, setFormDataSource] = useState<'proyectado' | 'real'>('proyectado');
    

    if (!context) return <div>Loading context...</div>;
    const { appState, updateAppState, showLoading, hideLoading, showError } = context;
    const { ivaLiquidationResult, files, ivaPeriodo, ivaTipoPeriodo, fileUploadStatus } = appState;

    const allBaseFilesLoaded = !!(appState.files.iva_auxiliar && appState.files.iva_dian && appState.files.iva_ventas && appState.files.iva_compras);

    const periodOptions = useMemo(() => {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const bimestres = ['Enero - Febrero', 'Marzo - Abril', 'Mayo - Junio', 'Julio - Agosto', 'Septiembre - Octubre', 'Noviembre - Diciembre'];
        const cuatrimestres = ['1er Cuatrimestre (Ene-Abr)', '2do Cuatrimestre (May-Ago)', '3er Cuatrimestre (Sep-Dic)'];

        switch (ivaTipoPeriodo) {
            case 'mensual': return meses;
            case 'bimestral': return bimestres;
            case 'cuatrimestral': return cuatrimestres;
            default: return [];
        }
    }, [ivaTipoPeriodo]);

    useEffect(() => {
        if (periodOptions.length > 0 && !periodOptions.includes(ivaPeriodo)) {
            updateAppState({ ivaPeriodo: periodOptions[0] });
        }
    }, [periodOptions, ivaPeriodo, updateAppState]);

    const incomeAccounts = useMemo(() => {
        if (!appState.files.iva_auxiliar) return [];
        const accounts = new Map<string, string>();
        appState.files.iva_auxiliar.forEach(row => {
            if (row.Cuenta && (row.Cuenta.startsWith('4'))) {
                const [code, ...nameParts] = row.Cuenta.split(' ');
                if (!accounts.has(code)) accounts.set(code, nameParts.join(' '));
            }
        });
        return Array.from(accounts.entries()).map(([cuenta, nombre]) => ({ cuenta, nombre }));
    }, [appState.files.iva_auxiliar]);
    
    useEffect(() => {
        if (appState.files.iva_auxiliar) {
            const initialSelection = new Map<string, boolean>();
            appState.files.iva_auxiliar.forEach(row => {
                if (row.Cuenta.startsWith('2408') && !initialSelection.has(row.Cuenta)) {
                    initialSelection.set(row.Cuenta, true);
                }
            });
            setSelectedIvaAccounts(initialSelection);
        }
    }, [appState.files.iva_auxiliar]);
    
    const handleCommentChange = (cuenta: string, comment: string) => {
        const newComments = new Map(appState.ivaIncomeComments);
        newComments.set(cuenta, comment);
        updateAppState({ ivaIncomeComments: newComments });
    };

    const handleTransactionOverride = (txKey: string, newCategory: VatCategory) => {
        const newOverrides = new Map(appState.ivaTransactionVatOverrides);
        if (newCategory === 'no_clasificado') {
            newOverrides.delete(txKey);
        } else {
            newOverrides.set(txKey, newCategory);
        }
        updateAppState({ 
            ivaTransactionVatOverrides: newOverrides,
            ivaNeedsRecalculation: true,
        });
    };


    const handleAccountSelectionChange = (cuenta: string) => {
        setSelectedIvaAccounts(prev => {
            const newMap = new Map(prev);
            newMap.set(cuenta, !newMap.get(cuenta));
            return newMap;
        });
    };
    
    const handleShowDianDetails = (title: string, documents: DianDocumentDetail[]) => {
        if (documents && documents.length > 0) {
            setDianDetailModal({ title, documents });
        }
    };

    const handleFileChange = async (fileType: FileType, file: File) => {
        if (fileType !== 'iva_auxiliar' && fileType !== 'iva_dian' && fileType !== 'iva_ventas' && fileType !== 'iva_compras') return;

        updateAppState({
            fileUploadStatus: {
                ...appState.fileUploadStatus,
                [fileType]: { status: 'loading', name: file.name }
            }
        });
        showLoading(`Procesando ${file.name}...`);
        
        try {
            const rawData = await parseExcelFile(file);
            const updatePayload: Partial<AppState> = {};
            let processedData: any;

            if (fileType === 'iva_auxiliar') {
                const auxResult = processAuxiliar(rawData, appState.allNits);
                processedData = auxResult.data;
                updatePayload.allNits = auxResult.nits;
            } else if (fileType === 'iva_ventas') {
                 const ventasResult = processVentas(rawData, appState.allNits);
                 processedData = ventasResult.data;
                 updatePayload.allNits = ventasResult.nits;
            } else if (fileType === 'iva_compras') {
                const comprasResult = processCompras(rawData, appState.allNits);
                processedData = comprasResult.data;
                updatePayload.allNits = comprasResult.nits;
           } else { // iva_dian
                const dianResult = processDian(rawData, appState.allNits);
                processedData = dianResult.data;
                updatePayload.allNits = dianResult.nits;
            }

            updatePayload.files = {
                ...appState.files,
                [fileType]: processedData
            };
            updatePayload.fileUploadStatus = {
                ...appState.fileUploadStatus,
                [fileType]: { status: 'success', name: file.name }
            };
            
            updateAppState(updatePayload);

        } catch (error) {
            const errorMessage = error instanceof Error ? `Error al procesar: ${error.message}` : String(error);
            showError(`Error en ${file.name}: ${errorMessage}`);
            updateAppState({
                fileUploadStatus: {
                    ...appState.fileUploadStatus,
                    [fileType]: { status: 'error', name: file.name }
                }
            });
        } finally {
            hideLoading();
        }
    };


    const handleGenerate = () => {
        if (!allBaseFilesLoaded) {
            showError("Asegúrese de que los archivos 'Auxiliar', 'Ventas', 'Compras' y 'DIAN' para IVA estén cargados.");
            return;
        }
        showLoading("Generando liquidación de IVA...");

        setTimeout(() => {
            try {
                const { files: { iva_auxiliar: auxiliar, iva_dian: dian, iva_ventas: ventas, iva_compras }, incomeAccountVatClassification, purchaseAccountVatClassification, ivaTransactionVatOverrides } = appState;
                
                const blankSection = (): IvaSectionResult => ({
                    gravados: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] }, devolucionesGravadas: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] },
                    exentos: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] }, devolucionesExentas: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] },
                    excluidos: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] }, devolucionesExcluidas: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] },
                    noGravados: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] }, devolucionesNoGravadas: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] },
                });
                
                const newResult: IvaLiquidationResult = {
                    ingresos: blankSection(),
                    compras: blankSection(),
                    resumen: { ivaGenerado: 0, ivaDescontable: 0, saldoAPagar: 0 }
                };
                
                interface PopulatedDoc {
                    cuenta: string;
                    nombre: string;
                    valor: number;
                    isIncome: boolean;
                    docDetail: IvaDocumentDetail;
                }
                
                const normalizeDocKey = (doc: string | null | undefined): string => {
                    if (!doc) return '';
                    let s = doc.toString().toLowerCase().trim();
                    const parts = s.split(/\s+/);
                    if (parts.length > 1 && /^[a-z]+$/.test(parts[0]) && /^[a-z]/.test(parts[1])) {
                        s = parts.slice(1).join(' ');
                    }
                    return s.replace(/[^a-z0-9]/g, '');
                };

                const auxiliarMapByDoc = new Map<string, AuxiliarData[]>();
                auxiliar!.forEach(row => {
                    const docKey = normalizeDocKey(row.DocNum);
                    if (docKey) {
                        (auxiliarMapByDoc.get(docKey) || auxiliarMapByDoc.set(docKey, []).get(docKey))!.push(row);
                    }
                });
                
                const allDocuments: PopulatedDoc[] = [];

                // Process Ventas
                ventas!.forEach(venta => {
                    const docKey = normalizeDocKey(venta.Documento);
                    const movimientos = auxiliarMapByDoc.get(docKey) || [];
                    const incomeMov = movimientos.find(m => m.Cuenta.startsWith('4'));
                    const cuentaCode = incomeMov ? incomeMov.Cuenta.split(' ')[0] : '4_NO_ASIGNADA';
                    const cuentaName = incomeMov ? incomeMov.Cuenta.substring(cuentaCode.length).trim() : 'Ingreso sin cuenta en Auxiliar';
                    
                    // Determine if it's a return based on account code (4175) or document name (nc)
                    const isReturnAccount = cuentaCode.startsWith('4175');
                    const isCreditNote = normalizeTextForSearch(venta.Documento).includes('nc');
                    const absoluteVentaNeta = Math.abs(venta.VentaNeta);
                    const balance = (isReturnAccount || isCreditNote) ? -absoluteVentaNeta : absoluteVentaNeta;

                    const txKey = `${cuentaCode}-${venta.Documento}-${balance}`;

                    allDocuments.push({
                        cuenta: cuentaCode,
                        nombre: cuentaName,
                        valor: balance,
                        isIncome: true,
                        docDetail: { docNum: venta.Documento, nota: `Venta a ${venta.Cliente}`, valor: balance, key: txKey }
                    });
                });

                // Process Compras
                const saleDocKeys = new Set(ventas!.map(v => normalizeDocKey(v.Documento)));
                const processedPurchaseDocs = new Set<string>();

                auxiliar!.forEach(row => {
                    const docKey = normalizeDocKey(row.DocNum);
                    if (!docKey || saleDocKeys.has(docKey) || processedPurchaseDocs.has(docKey)) return;

                    const code = row.Cuenta?.split(' ')[0] || '';
                    if (['14', '5', '6', '7'].some(p => code.startsWith(p))) {
                        const movsForDoc = auxiliarMapByDoc.get(docKey) || [];
                        let baseCompra = movsForDoc.reduce((sum, mov) => {
                            if (['14', '5', '6', '7'].some(p => mov.Cuenta.startsWith(p))) {
                                return sum + mov.Debitos - mov.Creditos;
                            }
                            return sum;
                        }, 0);
                        
                        if (baseCompra !== 0) {
                            const firstMov = movsForDoc[0];
                            const purchaseAccountCode = firstMov.Cuenta.split(' ')[0];
                            const purchaseAccountName = firstMov.Cuenta.substring(purchaseAccountCode.length).trim();
                            const txKey = `${purchaseAccountCode}-${firstMov.DocNum}-${baseCompra}`;

                             allDocuments.push({
                                cuenta: purchaseAccountCode,
                                nombre: purchaseAccountName,
                                valor: baseCompra,
                                isIncome: false,
                                docDetail: { docNum: firstMov.DocNum, nota: firstMov.Nota, valor: baseCompra, key: txKey }
                            });
                        }
                        processedPurchaseDocs.add(docKey);
                    }
                });

                // Classify and aggregate all documents
                allDocuments.forEach(doc => {
                    const accountClassificationMap = doc.isIncome ? incomeAccountVatClassification : purchaseAccountVatClassification;
                    const accountCategory = accountClassificationMap.get(doc.cuenta) || 'no_clasificado';
                    const finalCategory = ivaTransactionVatOverrides.get(doc.docDetail.key) || accountCategory;
                    
                    if (finalCategory === 'no_clasificado' || doc.valor === 0) return;

                    const isReturn = doc.valor < 0;
                    const targetSection = doc.isIncome ? newResult.ingresos : newResult.compras;
                    
                    let targetCategoryKey: keyof IvaSectionResult | null = null;
                    switch(finalCategory) {
                        case 'gravado': targetCategoryKey = isReturn ? 'devolucionesGravadas' : 'gravados'; break;
                        case 'exento': targetCategoryKey = isReturn ? 'devolucionesExentas' : 'exentos'; break;
                        case 'excluido': targetCategoryKey = isReturn ? 'devolucionesExcluidas' : 'excluidos'; break;
                        case 'no_gravado': targetCategoryKey = isReturn ? 'devolucionesNoGravadas' : 'noGravados'; break;
                    }

                    if (targetCategoryKey) {
                        const categoryData = targetSection[targetCategoryKey];
                        categoryData.totalAuxiliar += Math.abs(doc.valor);

                        let accountDetail = categoryData.accounts.find(a => a.cuenta === doc.cuenta);
                        if (!accountDetail) {
                            accountDetail = { cuenta: doc.cuenta, nombre: doc.nombre, valorAuxiliar: 0, documentos: [] };
                            categoryData.accounts.push(accountDetail);
                        }
                        accountDetail.valorAuxiliar += Math.abs(doc.valor);
                        accountDetail.documentos!.push(doc.docDetail);
                    }
                });

                // DIAN Data processing
                dian!.forEach(row => {
                    const normalizedGrupo = normalizeTextForSearch(row.Grupo);
                    const normalizedTipoDoc = normalizeTextForSearch(row.TipoDeDocumento);
                    const isEmitido = normalizedGrupo.includes('emitido');
                    
                    const allowedDocTypes = [
                        'factura electronica',
                        'nota de credito electronica',
                        'nota debito electronica'
                    ];

                    if (!isEmitido || !allowedDocTypes.includes(normalizedTipoDoc)) {
                        return; // Only process specific emitted documents for income section
                    }
                
                    const iva = row.IVA;
                    const total = row.Total;
                    const baseGravada = (iva !== 0) ? (iva / 0.19) : 0;
                    const baseNoGravada = total - iva - baseGravada;
                
                    const targetSection = newResult.ingresos;
                    const isCreditNote = normalizedTipoDoc.includes('nota de credito');
                
                    const docDetail = { docNum: row.DocumentoDIAN, fecha: row.Fecha, baseGravada, baseOtros: baseNoGravada, total };
                
                    if (isCreditNote) {
                        if (baseGravada !== 0) {
                            targetSection.devolucionesGravadas.totalDian += baseGravada;
                            targetSection.devolucionesGravadas.totalDianGravado = (targetSection.devolucionesGravadas.totalDianGravado || 0) + baseGravada;
                            targetSection.devolucionesGravadas.dianDocuments?.push({ ...docDetail, baseOtros: 0, total: baseGravada });
                        }
                        if (baseNoGravada !== 0) {
                             targetSection.devolucionesNoGravadas.totalDian += baseNoGravada;
                             targetSection.devolucionesNoGravadas.totalDianOtros = (targetSection.devolucionesNoGravadas.totalDianOtros || 0) + baseNoGravada;
                             targetSection.devolucionesNoGravadas.dianDocuments?.push({ ...docDetail, baseGravada: 0, total: baseNoGravada });
                        }
                    } else {
                        if (baseGravada !== 0) {
                            targetSection.gravados.totalDian += baseGravada;
                            targetSection.gravados.totalDianGravado = (targetSection.gravados.totalDianGravado || 0) + baseGravada;
                            targetSection.gravados.dianDocuments?.push({ ...docDetail, baseOtros: 0, total: baseGravada });
                        }
                        if (baseNoGravada !== 0) {
                            targetSection.noGravados.totalDian += baseNoGravada;
                            targetSection.noGravados.totalDianOtros = (targetSection.noGravados.totalDianOtros || 0) + baseNoGravada;
                            targetSection.noGravados.dianDocuments?.push({ ...docDetail, baseGravada: 0, total: baseNoGravada });
                        }
                    }
                });
                
                updateAppState({ ivaLiquidationResult: newResult, ivaNeedsRecalculation: false });

            } catch (error) {
                showError(error instanceof Error ? error.message : "Error al generar liquidación");
            } finally {
                hideLoading();
            }
        }, 50);
    };
    
    const prorrateoPercentages = useMemo(() => {
        if (!appState.ivaLiquidationResult) return { gravado: 0, otros: 0 };
        const data = appState.ivaLiquidationResult.ingresos;
        const brutoGravado = data.gravados.totalAuxiliar;
        const otrosIngresosBrutos = data.exentos.totalAuxiliar + data.excluidos.totalAuxiliar + data.noGravados.totalAuxiliar;
        const totalIngresosProrrateo = brutoGravado + otrosIngresosBrutos;
        if (totalIngresosProrrateo === 0) return { gravado: 100, otros: 0 };
        return {
            gravado: (brutoGravado / totalIngresosProrrateo) * 100,
            otros: (otrosIngresosBrutos / totalIngresosProrrateo) * 100,
        };
    }, [appState.ivaLiquidationResult]);

    const liquidationCalculations = useMemo(() => {
        if (!appState.files.iva_auxiliar || !appState.ivaLiquidationResult || !appState.files.iva_dian) return null;

        const { iva_auxiliar: auxiliar, iva_dian: dian } = appState.files;
        const pDeclaracion = prorrateoPercentages.gravado / 100;

        // Base Calculations from Auxiliar
        let totalIvaGeneradoBrutoBp = 0, totalIvaDevolucionesVentasBp = 0;
        let totalIvaDescontableBp = 0, totalIvaTransitorioBp = 0, totalIvaDevolucionesComprasBp = 0;

        auxiliar.forEach(row => {
            if (!row.Cuenta.startsWith('2408') || !selectedIvaAccounts.get(row.Cuenta)) return;
            
            if (appState.ivaDescontableClassification.get(row.Cuenta) === 'no_tener_en_cuenta') return;

            const code = row.Cuenta.split(' ')[0];
            const name = row.Cuenta.substring(code.length).trim();
            const normalizedName = normalizeTextForSearch(name);

            if (normalizedName.includes('iva gen')) totalIvaGeneradoBrutoBp += row.Creditos;
            else if (normalizedName.includes('devoluciones en ventas') && !normalizedName.includes('compras')) totalIvaDevolucionesVentasBp += row.Debitos;
            else if (isDevolucionesComprasAccountFuzzy(row.Cuenta)) totalIvaDevolucionesComprasBp += row.Creditos;
            else if (code.startsWith('240802')) totalIvaDescontableBp += row.Debitos;
            else if (code.startsWith('240803')) totalIvaTransitorioBp += row.Debitos;
        });
        
        // DIAN Calculations
        const { ivaVentasDian, ivaDevolucionesVentasDian, ivaComprasDian, ivaDevolucionesComprasDian } = dian.reduce((acc, row) => {
            const isIngresoDian = normalizeTextForSearch(row.Grupo).includes('emitido') && !normalizeTextForSearch(row.TipoDeDocumento).includes('documento soporte');
            if (isIngresoDian) {
                if (row.IVA < 0) acc.ivaDevolucionesVentasDian += Math.abs(row.IVA);
                else acc.ivaVentasDian += row.IVA;
            } else {
                if (row.IVA < 0) acc.ivaDevolucionesComprasDian += Math.abs(row.IVA);
                else acc.ivaComprasDian += row.IVA;
            }
            return acc;
        }, { ivaVentasDian: 0, ivaDevolucionesVentasDian: 0, ivaComprasDian: 0, ivaDevolucionesComprasDian: 0 });

        // Final Liquidation Values
        const ivaGeneradoVentas = totalIvaGeneradoBrutoBp;
        const devolucionesComprasProrrateadas = totalIvaDevolucionesComprasBp * pDeclaracion;
        const devolucionesVentas = totalIvaDevolucionesVentasBp;

        const ivaDescontableFinal = (ivaTypeFilter === 'descontable' || ivaTypeFilter === 'ambos') 
            ? totalIvaDescontableBp * pDeclaracion 
            : totalIvaDescontableBp;
        
        const ivaTransitorioFinal = (ivaTypeFilter === 'transitorio' || ivaTypeFilter === 'ambos')
            ? totalIvaTransitorioBp * pDeclaracion
            : totalIvaTransitorioBp;

        const retencionIva = auxiliar.filter(r => r.Cuenta.startsWith('135517')).reduce((sum, r) => sum + r.Debitos - r.Creditos, 0);
        
        const totalIvaGenReal = ivaGeneradoVentas + devolucionesComprasProrrateadas;
        const totalIvaDescontableReal = devolucionesVentas + ivaDescontableFinal + ivaTransitorioFinal;
        const ivaAPagarReal = totalIvaGenReal - totalIvaDescontableReal - retencionIva - sobrantes;

        return {
            ivaGeneradoVentas,
            devolucionesComprasProrrateadas,
            devolucionesVentas,
            ivaDescontableFinal,
            ivaTransitorioFinal,
            retencionIva,
            ivaAPagarReal,
            // Pass-through for LiquidacionIvaTable
            ivaCalculado19: appState.ivaLiquidationResult.ingresos.gravados.totalAuxiliar * 0.19,
            totalIvaGeneradoBrutoBp, totalIvaDevolucionesVentasBp, ivaVentasDian, ivaDevolucionesVentasDian,
            totalIvaDescontableBp, totalIvaTransitorioBp, totalIvaDevolucionesComprasBp, ivaComprasDian, ivaDevolucionesComprasDian,
        };

    }, [appState.files, appState.ivaLiquidationResult, selectedIvaAccounts, prorrateoPercentages, ivaTypeFilter, sobrantes, appState.ivaDescontableClassification]);

    const projectionCalculations = useMemo(() => {
        if (!liquidationCalculations) {
            return {
                ivaDescontableFactProrrateado: 0,
                facturaBruto: 0,
                facturaIva: 0,
                facturaNeto: 0,
                ivaAPagarProyectado: 0,
            };
        }

        const { 
            ivaGeneradoVentas, devolucionesComprasProrrateadas, devolucionesVentas, 
            ivaDescontableFinal, ivaTransitorioFinal, retencionIva 
        } = liquidationCalculations;

        const totalIvaGenReal = ivaGeneradoVentas + devolucionesComprasProrrateadas;
        const totalIvaDescontableReal = devolucionesVentas + ivaDescontableFinal + ivaTransitorioFinal;
        const ivaAPagarRealSinSobrantes = totalIvaGenReal - totalIvaDescontableReal - retencionIva;
        
        const ivaDescontableFactProrrateado = ivaAPagarRealSinSobrantes - ivaDeseado - sobrantes;

        let facturaBruto = 0, facturaIva = 0, facturaNeto = 0;
        const prorrateoGravado = prorrateoPercentages.gravado / 100;
        
        if (ivaDescontableFactProrrateado > 0 && prorrateoGravado > 0 && facturaIvaRate > 0) {
            facturaIva = ivaDescontableFactProrrateado / prorrateoGravado;
            facturaBruto = facturaIva / (facturaIvaRate / 100);
            facturaNeto = facturaBruto + facturaIva;
        }

        const totalIvaDescontableProyectado = totalIvaDescontableReal + Math.max(0, ivaDescontableFactProrrateado);
        const ivaAPagarProyectado = totalIvaGenReal - totalIvaDescontableProyectado - retencionIva - sobrantes;

        return {
            ivaDescontableFactProrrateado: Math.max(0, ivaDescontableFactProrrateado),
            facturaBruto,
            facturaIva,
            facturaNeto,
            ivaAPagarProyectado,
        };
    }, [liquidationCalculations, ivaDeseado, facturaIvaRate, prorrateoPercentages, sobrantes]);

    const incomeStatementCalculations = useMemo(() => {
        if (!appState.ivaLiquidationResult || !appState.files.iva_auxiliar) {
            return { totalIngNetos: 0, costosGastosPeriodo: 0 };
        }
    
        const ingresosData = appState.ivaLiquidationResult.ingresos;
        const totalIngBrutos = ingresosData.gravados.totalAuxiliar + ingresosData.exentos.totalAuxiliar + ingresosData.excluidos.totalAuxiliar + ingresosData.noGravados.totalAuxiliar;
        const totalDevoluciones = ingresosData.devolucionesGravadas.totalAuxiliar + ingresosData.devolucionesExentas.totalAuxiliar + ingresosData.devolucionesExcluidas.totalAuxiliar + ingresosData.devolucionesNoGravadas.totalAuxiliar;
        const totalIngNetos = totalIngBrutos - totalDevoluciones;
    
        const costosGastosPeriodo = appState.files.iva_auxiliar.reduce((sum, row) => {
            if (['5', '6', '7'].some(p => row.Cuenta.startsWith(p))) {
                sum += row.Debitos - row.Creditos;
            }
            return sum;
        }, 0);
    
        return { totalIngNetos, costosGastosPeriodo };
    
    }, [appState.ivaLiquidationResult, appState.files.iva_auxiliar]);
    
    const formulario300Data = useMemo(() => {
        if (!ivaLiquidationResult || !files.iva_auxiliar || !liquidationCalculations || !projectionCalculations) {
            return null;
        }

        // Helper to get accounts for compras classification
        const comprasAccounts = new Map<string, { totalDebitos: number }>();
        if (files.iva_auxiliar) {
            const prefixes = ['5', '6', '7'];
            files.iva_auxiliar.forEach(row => {
                if (row.Cuenta && prefixes.some(p => row.Cuenta.startsWith(p))) {
                    const current = comprasAccounts.get(row.Cuenta) || { totalDebitos: 0 };
                    current.totalDebitos += row.Debitos;
                    comprasAccounts.set(row.Cuenta, current);
                }
            });
        }

        // Helper to get accounts for IVA descontable classification
        const ivaAccounts = new Map<string, { totalDebitos: number }>();
        if(files.iva_auxiliar) {
            files.iva_auxiliar.forEach(row => {
                const code = row.Cuenta?.split(' ')[0] || '';
                if (row.Cuenta && (code.startsWith('240802') || code.startsWith('240803'))) {
                    const current = ivaAccounts.get(row.Cuenta) || { totalDebitos: 0 };
                    current.totalDebitos += row.Debitos;
                    ivaAccounts.set(row.Cuenta, current);
                }
            });
        }
    
        const { devolucionesComprasProrrateadas, devolucionesVentas, retencionIva } = liquidationCalculations;
        const { ivaDescontableFactProrrateado } = projectionCalculations;
        
        const ivaProyectadoAdicional = formDataSource === 'proyectado' ? ivaDescontableFactProrrateado : 0;

        const ing = ivaLiquidationResult.ingresos;
    
        // INGRESOS (Sección B)
        const r28_base = ing.gravados.totalAuxiliar;
        const r35_base = ing.exentos.totalAuxiliar;
        const r39_base = ing.excluidos.totalAuxiliar;
        const r40_base = ing.noGravados.totalAuxiliar;
        const r41_totalIngresosBrutos = r28_base + r35_base + r39_base + r40_base;
        const r42_totalDevoluciones = ing.devolucionesGravadas.totalAuxiliar + ing.devolucionesExentas.totalAuxiliar + ing.devolucionesExcluidas.totalAuxiliar + ing.devolucionesNoGravadas.totalAuxiliar;
        const r43_ingresosNetos = r41_totalIngresosBrutos - r42_totalDevoluciones;
    
        // COMPRAS (Sección C)
        const comprasSummary = Array.from(comprasAccounts.entries()).reduce((acc, [cuenta, data]) => {
            const category = appState.comprasAccountVatClassification.get(cuenta);
            if (category && category !== 'no_clasificado') {
                acc[category] = (acc[category] || 0) + data.totalDebitos;
            }
            return acc;
        }, {} as Record<Exclude<CompraVatCategory, 'no_clasificado'>, number>);

        const r50_base = comprasSummary.bienes_gravados_5 || 0;
        const r51_base = comprasSummary.bienes_gravados_g || 0;
        const r52_base = comprasSummary.servicios_gravados_5 || 0;
        const r53_base = comprasSummary.servicios_gravados_g || 0;
        const r54_base = comprasSummary.excluidos_exentos_no_gravados || 0;
        const r55_totalComprasBrutas = r50_base + r51_base + r52_base + r53_base + r54_base;
        const r56_devCompras = 0; // Not implemented yet
        const r57_comprasNetas = r55_totalComprasBrutas - r56_devCompras;
    
        // LIQUIDACIÓN (Sección D)
        const totalIvaGenerado = liquidationCalculations.ivaGeneradoVentas;
        const pDeclaracion = prorrateoPercentages.gravado / 100;
    
        const ivaDescontableClasificado = Array.from(ivaAccounts.entries()).reduce((acc, [cuenta, data]) => {
            const category = appState.ivaDescontableClassification.get(cuenta);
            if (category && category !== 'no_clasificado_descontable' && category !== 'no_tener_en_cuenta') {
                acc[category] = (acc[category] || 0) + (data.totalDebitos * pDeclaracion);
            }
            return acc;
        }, {} as Record<Exclude<IvaDescontableCategory, 'no_clasificado_descontable' | 'no_tener_en_cuenta'>, number>);
    
        const r71_iva = ivaDescontableClasificado.bienes_5 || 0;
        const r72_iva = (ivaDescontableClasificado.bienes_g || 0) + ivaProyectadoAdicional;
        const r74_iva = ivaDescontableClasificado.servicios_5 || 0;
        const r75_iva = ivaDescontableClasificado.servicios_g || 0;
    
        const r77_totalImpuestoPagado = r71_iva + r72_iva + r74_iva + r75_iva;
        const r79_ivaResultanteDevVentas = devolucionesVentas;
        const r81_totalImpuestosDescontables = r77_totalImpuestoPagado + r79_ivaResultanteDevVentas;
        const r66_ivaRecuperadoDevCompras = devolucionesComprasProrrateadas;
        const r67_totalImpuestoGenerado = totalIvaGenerado + r66_ivaRecuperadoDevCompras;
        const r82_saldoPagarPeriodo = Math.max(0, r67_totalImpuestoGenerado - r81_totalImpuestosDescontables);
        const r83_saldoFavorPeriodo = Math.max(0, r81_totalImpuestosDescontables - r67_totalImpuestoGenerado);
        const r85_retenciones = retencionIva;

        return {
            // Ingresos
            r27: 0, r28: r28_base, r29: 0, r35: r35_base, r39: r39_base, r40: r40_base,
            r41: r41_totalIngresosBrutos, r42: r42_totalDevoluciones, r43: r43_ingresosNetos,
            // Compras
            r50: r50_base, r51: r51_base, r52: r52_base, r53: r53_base, r54: r54_base,
            r55: r55_totalComprasBrutas, r56: r56_devCompras, r57: r57_comprasNetas,
            // Liquidación
            r58: 0, r59: totalIvaGenerado, r60: 0,
            r66: r66_ivaRecuperadoDevCompras, r67: r67_totalImpuestoGenerado,
            r71: r71_iva, r72: r72_iva, r74: r74_iva, r75: r75_iva,
            r77: r77_totalImpuestoPagado, r79: r79_ivaResultanteDevVentas,
            r81: r81_totalImpuestosDescontables,
            r82: r82_saldoPagarPeriodo, r83: r83_saldoFavorPeriodo, r85: r85_retenciones,
        };
    }, [ivaLiquidationResult, files.iva_auxiliar, liquidationCalculations, projectionCalculations, appState.comprasAccountVatClassification, appState.ivaDescontableClassification, prorrateoPercentages, formDataSource]);
    
    const handleIvaDeseadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setIvaDeseado(Number(value) || 0);
    };
    
    const handleFacturaIvaRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFacturaIvaRate(Number(e.target.value) || 0);
    };

    const tabs = [
        { id: 'control' as const, label: 'Control' },
        { id: 'proyecciones' as const, label: 'Proyecciones' },
        { id: 'clasificacion_compras' as const, label: 'Clasificación Compras' },
        { id: 'clasificacion_iva_descontable' as const, label: 'Clasificación IVA Descontable' },
        { id: 'prorrateo' as const, label: 'Prorrateo' },
        { id: 'liquidacion' as const, label: 'Liquidación' },
        { id: 'formulario_300' as const, label: 'Formulario 300', disabled: !appState.ivaLiquidationResult },
        { id: 'revision' as const, label: 'Revisión', disabled: !appState.ivaLiquidationResult },
        { id: 'coherencia' as const, label: 'Coherencia Contable', disabled: !allBaseFilesLoaded },
        { id: 'exploradorDoc' as const, label: 'Explorador Doc', disabled: !allBaseFilesLoaded },
    ];

    return (
        <>
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-800">Liquidación y Proyección de IVA</h1>
                <p className="text-slate-500 mt-1">Clasifique sus ingresos/compras y compare los valores del Auxiliar contra la DIAN.</p>
            </header>

            {dianDetailModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setDianDetailModal(null)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-xl font-semibold text-gray-800">{dianDetailModal.title}</h3>
                            <button onClick={() => setDianDetailModal(null)} className="text-gray-500 hover:text-gray-800">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <div className="border rounded-lg shadow-sm">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="py-2 px-3 text-left font-medium text-gray-700">Documento DIAN</th>
                                            <th className="py-2 px-3 text-left font-medium text-gray-700">Fecha</th>
                                            <th className="py-2 px-3 text-right font-medium text-gray-700">Base Gravada</th>
                                            <th className="py-2 px-3 text-right font-medium text-gray-700">Base Otros</th>
                                            <th className="py-2 px-3 text-right font-medium text-gray-700">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {dianDetailModal.documents.map((doc, index) => (
                                            <tr key={`${doc.docNum}-${index}`}>
                                                <td className="py-1 px-3 text-gray-800 font-mono">{doc.docNum}</td>
                                                <td className="py-1 px-3 text-gray-800">{doc.fecha}</td>
                                                <td className="py-1 px-3 text-gray-800 text-right font-mono">{formatCurrency(doc.baseGravada)}</td>
                                                <td className="py-1 px-3 text-gray-800 text-right font-mono">{formatCurrency(doc.baseOtros)}</td>
                                                <td className="py-1 px-3 text-gray-800 text-right font-mono font-semibold">{formatCurrency(doc.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-200 font-bold">
                                        <tr className="text-slate-800">
                                            <td colSpan={2} className="py-2 px-3 text-right">TOTALES</td>
                                            <td className="py-2 px-3 text-right font-mono">
                                                {formatCurrency(dianDetailModal.documents.reduce((sum, doc) => sum + doc.baseGravada, 0))}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono">
                                                {formatCurrency(dianDetailModal.documents.reduce((sum, doc) => sum + doc.baseOtros, 0))}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono">
                                                {formatCurrency(dianDetailModal.documents.reduce((sum, doc) => sum + doc.total, 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 text-right">
                            <button onClick={() => setDianDetailModal(null)} className="bg-slate-900 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-slate-700">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">Información del Período</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="periodo-iva" className="block text-sm font-medium text-gray-700 mb-1">Período a Verificar</label>
                        <select
                            id="periodo-iva"
                            value={ivaPeriodo}
                            onChange={(e) => updateAppState({ ivaPeriodo: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 text-sm bg-white text-slate-900"
                        >
                            {periodOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Período</label>
                         <div className="flex rounded-md shadow-sm">
                            <button
                                onClick={() => updateAppState({ ivaTipoPeriodo: 'mensual' })}
                                className={`flex-1 px-4 py-2 text-sm font-medium border rounded-l-md transition-colors ${ivaTipoPeriodo === 'mensual' ? 'bg-slate-900 text-white border-slate-900 z-10' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => updateAppState({ ivaTipoPeriodo: 'bimestral' })}
                                className={`flex-1 px-4 py-2 text-sm font-medium border-t border-b transition-colors ${ivaTipoPeriodo === 'bimestral' ? 'bg-slate-900 text-white border-slate-900 z-10' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                Bimestral
                            </button>
                             <button
                                onClick={() => updateAppState({ ivaTipoPeriodo: 'cuatrimestral' })}
                                className={`flex-1 px-4 py-2 text-sm font-medium border rounded-r-md transition-colors ${ivaTipoPeriodo === 'cuatrimestral' ? 'bg-slate-900 text-white border-slate-900 z-10' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                Cuatrimestral
                            </button>
                         </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 bg-white rounded-xl shadow-md p-2">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                                disabled={tab.disabled}
                                className={`
                                    group whitespace-nowrap inline-flex items-center py-2 px-2 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-amber-500 text-amber-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }
                                    ${tab.disabled ? 'text-gray-400 cursor-not-allowed hover:border-transparent hover:text-gray-400' : ''}
                                `}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {modal === 'ingresos' && <ClasificacionModal title="Clasificar Cuentas de Ingresos" description="Asigne una categoría de IVA a cada cuenta de ingresos (código '4') y devoluciones (código '4175')." accounts={incomeAccounts} classifications={appState.incomeAccountVatClassification} onClassificationChange={(c, v) => updateAppState({ incomeAccountVatClassification: new Map(appState.incomeAccountVatClassification).set(c, v), ivaNeedsRecalculation: true })} onClose={() => setModal('none')} />}
            
            <div className="mt-8">
                <div style={{ display: activeTab === 'control' ? 'block' : 'none' }}>
                    <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                        <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Panel de Prorrateo y Control</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">1. Carga de Archivos para IVA</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                     <FileUploadCard
                                        key="iva_auxiliar"
                                        fileType="iva_auxiliar"
                                        status={fileUploadStatus['iva_auxiliar'].status}
                                        fileName={fileUploadStatus['iva_auxiliar'].name}
                                        onFileChange={handleFileChange}
                                    />
                                     <FileUploadCard
                                        key="iva_ventas"
                                        fileType="iva_ventas"
                                        status={fileUploadStatus['iva_ventas'].status}
                                        fileName={fileUploadStatus['iva_ventas'].name}
                                        onFileChange={handleFileChange}
                                    />
                                    <FileUploadCard
                                        key="iva_compras"
                                        fileType="iva_compras"
                                        status={fileUploadStatus['iva_compras'].status}
                                        fileName={fileUploadStatus['iva_compras'].name}
                                        onFileChange={handleFileChange}
                                    />
                                    <FileUploadCard
                                        key="iva_dian"
                                        fileType="iva_dian"
                                        status={fileUploadStatus['iva_dian'].status}
                                        fileName={fileUploadStatus['iva_dian'].name}
                                        onFileChange={handleFileChange}
                                    />
                                </div>
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">2. Acciones</h3>
                                <div className="flex flex-col gap-4">
                                    <button 
                                        onClick={() => setModal('ingresos')} 
                                        disabled={!appState.files.iva_auxiliar} 
                                        className="bg-white text-slate-800 border border-slate-800 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed"
                                    >
                                        Clasificar Cuentas de Ingresos
                                    </button>
                                    <button 
                                        onClick={handleGenerate} 
                                        disabled={!allBaseFilesLoaded} 
                                        className={`relative w-full font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed ${appState.ivaNeedsRecalculation ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' : 'bg-slate-900 hover:bg-slate-700 text-white'}`}
                                    >
                                         {appState.ivaNeedsRecalculation && <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                                        {appState.ivaNeedsRecalculation ? 'Recalcular Base de Datos' : 'Generar Base de Datos'}
                                    </button>
                                </div>
                                {!allBaseFilesLoaded && <p className="text-xs text-red-500 mt-2">Requiere cargar 'Auxiliar', 'Ventas', 'Compras' y 'DIAN'.</p>}
                            </div>
                        </div>
                    </div>
                    {appState.ivaLiquidationResult ? (
                        <div className="space-y-8">
                            <LiquidationSection 
                                title="INGRESOS" 
                                data={appState.ivaLiquidationResult.ingresos} 
                                comments={appState.ivaIncomeComments}
                                onCommentChange={handleCommentChange}
                                onShowDianDetails={handleShowDianDetails}
                                ivaTransactionVatOverrides={appState.ivaTransactionVatOverrides}
                                onTransactionOverride={handleTransactionOverride}
                            />
                            <ProrrateoSummary 
                                ingresosData={appState.ivaLiquidationResult.ingresos} 
                                ventaActivosFijos={ventaActivosFijos}
                                onVentaActivosFijosChange={setVentaActivosFijos}
                                percentages={prorrateoPercentages}
                            />
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-xl shadow-md text-center">
                            <p className="text-gray-500">Cargue los archivos y genere la base de datos para ver los resultados del control.</p>
                        </div>
                    )}
                </div>

                <div style={{ display: activeTab === 'proyecciones' ? 'block' : 'none' }}>
                    <ProyeccionesIvaStep />
                </div>
                
                <div style={{ display: activeTab === 'clasificacion_compras' ? 'block' : 'none' }}>
                    <ClasificacionComprasTab />
                </div>
                
                <div style={{ display: activeTab === 'clasificacion_iva_descontable' ? 'block' : 'none' }}>
                    <ClasificacionIvaDescontable />
                </div>

                <div style={{ display: activeTab === 'prorrateo' ? 'block' : 'none' }}>
                     {appState.ivaLiquidationResult && appState.files.iva_auxiliar && appState.files.iva_dian && liquidationCalculations ? (
                        <>
                            <LiquidacionIvaTable
                                auxiliar={appState.files.iva_auxiliar}
                                dian={appState.files.iva_dian}
                                selectedIvaAccounts={selectedIvaAccounts}
                                onAccountSelectionChange={handleAccountSelectionChange}
                                {...liquidationCalculations}
                            />
                            <div className="my-8 border-t-4 border-dashed border-slate-300"></div>

                            {appState.ivaLiquidationResult && (
                                <div className="mb-6">
                                    <div className="w-80 border-2 border-slate-600">
                                        <div className="bg-slate-900 text-white text-center font-bold p-1">PRORRATEO</div>
                                        <div className="flex">
                                            <div className="w-1/2 text-center p-2 border-r border-slate-600 bg-white text-slate-800 font-mono text-lg" title="Porcentaje para Declaración">{prorrateoPercentages.gravado.toFixed(2)}%</div>
                                            <div className="w-1/2 text-center p-2 bg-white text-slate-800 font-mono text-lg" title="Porcentaje para Gasto">{prorrateoPercentages.otros.toFixed(2)}%</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="bg-white p-4 rounded-xl shadow-md mb-6">
                                <fieldset className="flex items-center space-x-6">
                                    <legend className="text-base font-medium text-gray-900 mr-4">Prorratear:</legend>
                                    <div className="flex items-center">
                                        <input id="descontable" name="iva-type" type="radio" value="descontable" checked={ivaTypeFilter === 'descontable'} onChange={(e) => setIvaTypeFilter(e.target.value as any)} className="h-4 w-4 border-gray-300 text-slate-600 focus:ring-slate-500"/>
                                        <label htmlFor="descontable" className="ml-2 block text-sm font-medium text-gray-700">IVA Descontable</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="transitorio" name="iva-type" type="radio" value="transitorio" checked={ivaTypeFilter === 'transitorio'} onChange={(e) => setIvaTypeFilter(e.target.value as any)} className="h-4 w-4 border-gray-300 text-slate-600 focus:ring-slate-500"/>
                                        <label htmlFor="transitorio" className="ml-2 block text-sm font-medium text-gray-700">IVA Transitorio</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="ambos" name="iva-type" type="radio" value="ambos" checked={ivaTypeFilter === 'ambos'} onChange={(e) => setIvaTypeFilter(e.target.value as any)} className="h-4 w-4 border-gray-300 text-slate-600 focus:ring-slate-500"/>
                                        <label htmlFor="ambos" className="ml-2 block text-sm font-medium text-gray-700">Ambos</label>
                                    </div>
                                </fieldset>
                            </div>
                            <IvaDescontableBreakdown 
                                auxiliarData={appState.files.iva_auxiliar}
                                percentages={prorrateoPercentages}
                                selectedIvaAccounts={selectedIvaAccounts}
                                ivaDescontableClassification={appState.ivaDescontableClassification}
                            />
                            <ProrrateoIvaDevolucionesTable
                                auxiliarData={appState.files.iva_auxiliar}
                                percentages={prorrateoPercentages}
                                selectedIvaAccounts={selectedIvaAccounts}
                            />
                        </>
                    ) : (
                        <div className="bg-white p-10 rounded-xl shadow-md text-center">
                            <p className="text-gray-500">Genere la liquidación en la pestaña 'Control' para ver los resultados aquí.</p>
                        </div>
                    )}
                </div>

                <div style={{ display: activeTab === 'liquidacion' ? 'block' : 'none' }}>
                    {liquidationCalculations && appState.files.iva_auxiliar ? (
                        <>
                            <LiquidacionFinal 
                                {...liquidationCalculations} 
                                ivaDescontableFactProrrateado={projectionCalculations.ivaDescontableFactProrrateado}
                                sobrantes={sobrantes}
                                onSobrantesChange={setSobrantes}
                            />
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                                    <div>
                                        <label htmlFor="iva-deseado" className="block text-lg font-semibold text-slate-800 mb-2">IVA DESEADO A PAGAR</label>
                                        <input
                                            id="iva-deseado"
                                            type="text"
                                            value={ivaDeseado === 0 ? '' : ivaDeseado.toLocaleString('es-CO')}
                                            onChange={handleIvaDeseadoChange}
                                            className="mt-1 w-full p-2 border-gray-300 bg-cyan-700 text-white rounded-md shadow-sm text-right font-mono text-xl placeholder-cyan-200"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="pt-4 border-t">
                                        <p className="text-lg font-semibold text-slate-800">AHORRO IVA</p>
                                        <div className="mt-2 w-full p-2 bg-green-100 border border-green-300 text-green-800 rounded-md text-right font-mono text-xl">
                                            {formatCurrency(liquidationCalculations.ivaAPagarReal - projectionCalculations.ivaAPagarProyectado)}
                                        </div>
                                    </div>
                                </div>
                    
                                <div className="bg-slate-50 p-6 rounded-xl shadow-md border">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4">FACTURA PROYECTADA</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="factura-iva-rate" className="font-medium text-gray-700">TARIFA IVA (%):</label>
                                            <input
                                                id="factura-iva-rate"
                                                type="number"
                                                value={facturaIvaRate}
                                                onChange={handleFacturaIvaRateChange}
                                                className="w-24 p-1 border-gray-300 bg-cyan-700 text-white rounded-md shadow-sm text-right font-mono placeholder-cyan-200"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-base pt-2 border-t">
                                            <span className="font-medium text-gray-700">Valor Bruto:</span>
                                            <span className="font-mono text-slate-800">{formatCurrency(projectionCalculations.facturaBruto)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-base">
                                            <span className="font-medium text-gray-700">IVA:</span>
                                            <span className="font-mono text-slate-800">{formatCurrency(projectionCalculations.facturaIva)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-lg font-bold border-t pt-2">
                                            <span className="text-slate-800">Total Fact Neto:</span>
                                            <span className="font-mono text-slate-900">{formatCurrency(projectionCalculations.facturaNeto)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                             {appState.files.iva_auxiliar && (
                                <>
                                    <IvaDescontableBreakdown 
                                        auxiliarData={appState.files.iva_auxiliar}
                                        selectedIvaAccounts={selectedIvaAccounts}
                                        percentages={prorrateoPercentages}
                                        ivaDescontableClassification={appState.ivaDescontableClassification}
                                    />
                                    <ProjectedIncomeStatement 
                                        totalIngNetos={incomeStatementCalculations.totalIngNetos}
                                        costosGastosPeriodo={incomeStatementCalculations.costosGastosPeriodo}
                                        facturaASolicitar={projectionCalculations.facturaBruto}
                                    />
                                </>
                            )}
                        </>
                    ) : (
                         <div className="bg-white p-10 rounded-xl shadow-md text-center">
                            <p className="text-gray-500">Genere la liquidación en la pestaña 'Control' y configure el prorrateo para ver la liquidación final.</p>
                        </div>
                    )}
                </div>
                <div style={{ display: activeTab === 'formulario_300' ? 'block' : 'none' }}>
                    {formulario300Data ? (
                        <Formulario300 data={formulario300Data} />
                    ) : (
                         <div className="bg-white p-10 rounded-xl shadow-md text-center">
                            <p className="text-gray-500">
                                Los datos para el Formulario 300 aparecerán aquí después de generar la liquidación.
                            </p>
                        </div>
                    )}
                </div>
                <div style={{ display: activeTab === 'revision' ? 'block' : 'none' }}>
                    <RevisionIvaStep />
                </div>
                 <div style={{ display: activeTab === 'coherencia' ? 'block' : 'none' }}>
                    <CoherenciaContable />
                </div>
                <div style={{ display: activeTab === 'exploradorDoc' ? 'block' : 'none' }}>
                    <ExploradorDoc />
                </div>
            </div>
        </>
    );
};

export default IvaReview;
