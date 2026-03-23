
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import { formatCurrency } from '@/dashboard/utils/formatters';
import type { AuxiliarData } from '@/dashboard/types';

// --- ICONS ---
const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const FunnelIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.819V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
    </svg>
);

const DocumentTextIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const CheckBadgeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm4.45 6.45a.75.75 0 1 0-1.1 1.1l1.69 1.69a.75.75 0 0 0 1.1 0l4.25-4.25a.75.75 0 1 0-1.1-1.1L14.134 11.41l-1.082-1.16Z" clipRule="evenodd" />
    </svg>
);

const ExclamationCircleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
);

// --- UTILS ---
const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

const getDocTypeColor = (cuenta: string) => {
    if (cuenta.startsWith('4')) return 'bg-green-100 text-green-700 border-green-200'; // Ingreso
    if (['5', '6', '7'].some(p => cuenta.startsWith(p))) return 'bg-orange-100 text-orange-700 border-orange-200'; // Gasto
    if (cuenta.startsWith('2408')) return 'bg-blue-100 text-blue-700 border-blue-200'; // IVA
    return 'bg-gray-100 text-gray-600 border-gray-200';
};

const ITEMS_PER_PAGE = 50;

const ExploradorDoc: React.FC = () => {
    const context = useContext(AppContext);
    
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense' | 'vat'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

    if (!context) return <div>Cargando...</div>;
    const { appState } = context;
    const { iva_auxiliar, iva_dian } = appState.files;

    // --- FILTER LOGIC ---
    const filteredRows = useMemo(() => {
        if (!iva_auxiliar) return [];
        
        let data = iva_auxiliar;
        const term = normalize(searchTerm);

        // 1. Text Search
        if (term) {
            data = data.filter(row => 
                normalize(row.DocNum).includes(term) ||
                normalize(row.Tercero).includes(term) ||
                normalize(row.NIT).includes(term) ||
                normalize(row.Cuenta).includes(term) ||
                (row.Debitos + row.Creditos).toString().includes(term)
            );
        }

        // 2. Category Filter
        if (activeFilter === 'income') data = data.filter(r => r.Cuenta.startsWith('4'));
        else if (activeFilter === 'expense') data = data.filter(r => ['5', '6', '7'].some(p => r.Cuenta.startsWith(p)));
        else if (activeFilter === 'vat') data = data.filter(r => r.Cuenta.startsWith('2408'));

        return data;
    }, [iva_auxiliar, searchTerm, activeFilter]);

    // --- PAGINATION ---
    const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
    const paginatedRows = filteredRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // --- DETAIL MODAL LOGIC ---
    const docDetails = useMemo(() => {
        if (!selectedDoc || !iva_auxiliar) return null;
        
        // Accounting Context
        const accountingLines = iva_auxiliar.filter(r => r.DocNum === selectedDoc);
        const totalDebitos = accountingLines.reduce((sum, line) => sum + line.Debitos, 0);
        const totalCreditos = accountingLines.reduce((sum, line) => sum + line.Creditos, 0);
        const isBalanced = Math.abs(totalDebitos - totalCreditos) < 0.01;
        
        // DIAN Context
        let dianMatch = null;
        if (iva_dian) {
            const normSelected = normalize(selectedDoc);
            dianMatch = iva_dian.find(d => {
                const normDian = normalize(d.DocumentoDIAN);
                // Simple inclusion check as DIAN docs often have prefixes like SETT, FE, etc.
                return normDian.includes(normSelected) || normSelected.includes(normDian);
            });
        }

        return { accountingLines, dianMatch, totalDebitos, totalCreditos, isBalanced };
    }, [selectedDoc, iva_auxiliar, iva_dian]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset page on search
    };

    const handleFilterChange = (filter: typeof activeFilter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6">
            {/* HERO SEARCH SECTION */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center gap-6 animate-fadeIn">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Explorador de Documentos</h2>
                    <p className="text-slate-500 text-sm mt-1">Busque cualquier transacción en su contabilidad y cruce con DIAN.</p>
                </div>

                <div className="relative w-full max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-6 w-6 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-lg placeholder-slate-400 focus:outline-none focus:border-[#f6b034] focus:ring-4 focus:ring-[#f6b034]/10 transition-all shadow-sm"
                        placeholder="Buscar por número de factura, NIT, nombre o valor..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'income', label: 'Solo Ingresos (4)' },
                        { id: 'expense', label: 'Solo Gastos (5/6/7)' },
                        { id: 'vat', label: 'Mov. IVA (2408)' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => handleFilterChange(f.id as any)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform active:scale-95 ${
                                activeFilter === f.id
                                    ? 'bg-slate-800 text-white shadow-md ring-2 ring-offset-2 ring-slate-800'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* RESULTS LIST */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-slate-400" />
                        Resultados de Búsqueda
                    </h3>
                    <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-1 rounded-md">
                        {filteredRows.length} registros
                    </span>
                </div>

                {paginatedRows.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {/* Header Row */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <div className="col-span-2">Documento</div>
                            <div className="col-span-4">Tercero / Detalle</div>
                            <div className="col-span-2">Cuenta</div>
                            <div className="col-span-2 text-right">Débito</div>
                            <div className="col-span-2 text-right">Crédito</div>
                        </div>

                        {/* Data Rows */}
                        {paginatedRows.map((row, idx) => (
                            <div 
                                key={`${row.id}-${idx}`}
                                onClick={() => setSelectedDoc(row.DocNum)}
                                className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-amber-50 cursor-pointer transition-colors group items-center"
                            >
                                <div className="col-span-2 font-bold text-slate-700 font-mono text-sm group-hover:text-[#1e293b] truncate">
                                    {row.DocNum}
                                </div>
                                <div className="col-span-4">
                                    <div className="text-sm font-semibold text-slate-800 truncate" title={row.Tercero}>{row.Tercero}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{row.NIT} • {row.Fecha}</div>
                                </div>
                                <div className="col-span-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDocTypeColor(row.Cuenta)}`}>
                                        {row.Cuenta}
                                    </span>
                                </div>
                                <div className="col-span-2 text-right font-mono text-sm text-slate-600">
                                    {row.Debitos > 0 ? formatCurrency(row.Debitos) : '-'}
                                </div>
                                <div className="col-span-2 text-right font-mono text-sm text-slate-600">
                                    {row.Creditos > 0 ? formatCurrency(row.Creditos) : '-'}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <FunnelIcon className="w-12 h-12 mb-3 opacity-20" />
                        <p>No se encontraron documentos con los filtros actuales.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex justify-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span className="px-3 py-1 text-sm text-slate-500">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* DOCUMENT LIFECYCLE MODAL */}
            {selectedDoc && docDetails && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedDoc(null)}>
                    <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-[#1e293b] p-6 flex justify-between items-start">
                            <div>
                                <h3 className="text-white text-xl font-bold flex items-center gap-3">
                                    <DocumentTextIcon className="w-6 h-6 text-[#f6b034]" />
                                    Hoja de Vida del Documento
                                </h3>
                                <p className="text-slate-300 text-sm mt-1 font-mono">{selectedDoc}</p>
                            </div>
                            <button onClick={() => setSelectedDoc(null)} className="text-white/60 hover:text-white transition-colors">
                                <XMarkIcon className="w-8 h-8" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* LEFT: ACCOUNTING CONTEXT */}
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 border-b pb-2">
                                        Movimientos Contables (Auxiliar)
                                    </h4>
                                    
                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                                                <tr>
                                                    <th className="p-3 text-left w-1/2">Cuenta / Detalle</th>
                                                    <th className="p-3 text-right w-1/4 border-l border-slate-100 text-slate-400">Débito</th>
                                                    <th className="p-3 text-right w-1/4 border-l border-slate-100 text-slate-400">Crédito</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {docDetails.accountingLines.map((line, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="p-3 align-top">
                                                            <div className="font-bold text-slate-700 font-mono text-xs">{line.Cuenta}</div>
                                                            <div className="text-xs text-slate-500 truncate max-w-[200px]" title={line.Nota}>{line.Nota}</div>
                                                        </td>
                                                        <td className="p-3 text-right font-mono text-slate-700 border-l border-slate-100 align-top">
                                                            {line.Debitos > 0 ? formatCurrency(line.Debitos) : <span className="text-slate-300">-</span>}
                                                        </td>
                                                        <td className="p-3 text-right font-mono text-slate-700 border-l border-slate-100 align-top">
                                                            {line.Creditos > 0 ? formatCurrency(line.Creditos) : <span className="text-slate-300">-</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200">
                                                <tr>
                                                    <td className="p-3 text-right text-xs uppercase flex items-center justify-end gap-2 h-full">
                                                        <span>Sumas Iguales</span>
                                                        {docDetails.isBalanced ? 
                                                            <CheckBadgeIcon className="w-4 h-4 text-green-500" /> : 
                                                            <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                                                        }
                                                    </td>
                                                    <td className="p-3 text-right font-mono border-l border-slate-200">{formatCurrency(docDetails.totalDebitos)}</td>
                                                    <td className="p-3 text-right font-mono border-l border-slate-200">{formatCurrency(docDetails.totalCreditos)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* RIGHT: DIAN CONTEXT */}
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 border-b pb-2">
                                        Reporte DIAN (Facturación Electrónica)
                                    </h4>

                                    {docDetails.dianMatch ? (
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg border border-green-100">
                                                <CheckBadgeIcon className="w-5 h-5" />
                                                <span className="font-bold text-sm">Documento Cruzado Exitosamente</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-slate-400 text-xs uppercase">Fecha Emisión</p>
                                                    <p className="font-semibold text-slate-800">{docDetails.dianMatch.Fecha}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-xs uppercase">Tipo Documento</p>
                                                    <p className="font-semibold text-slate-800 truncate" title={docDetails.dianMatch.TipoDeDocumento}>
                                                        {docDetails.dianMatch.TipoDeDocumento}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-xs uppercase">Emisor</p>
                                                    <p className="font-semibold text-slate-800 truncate" title={docDetails.dianMatch.NombreEmisor}>
                                                        {docDetails.dianMatch.NombreEmisor}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-xs uppercase">Receptor</p>
                                                    <p className="font-semibold text-slate-800 truncate" title={docDetails.dianMatch.NombreReceptor}>
                                                        {docDetails.dianMatch.NombreReceptor}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Base Imponible</span>
                                                    <span className="font-mono text-slate-700">{formatCurrency(docDetails.dianMatch.Base)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">IVA Reportado</span>
                                                    <span className="font-mono text-slate-700">{formatCurrency(docDetails.dianMatch.IVA)}</span>
                                                </div>
                                                <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
                                                    <span className="text-slate-800">Total Factura</span>
                                                    <span className="font-mono text-slate-900">{formatCurrency(docDetails.dianMatch.Total)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-48 text-center opacity-60">
                                            <div className="bg-slate-100 p-4 rounded-full mb-3">
                                                <XMarkIcon className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 font-medium">Este documento no se encuentra en el reporte de la DIAN.</p>
                                            <p className="text-xs text-slate-400 mt-1">Puede ser un documento interno (Nota Contable) o no electrónico.</p>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                        
                        <div className="bg-slate-100 p-4 border-t border-slate-200 text-right">
                            <button 
                                onClick={() => setSelectedDoc(null)}
                                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2 px-6 rounded-lg transition-colors"
                            >
                                Cerrar Detalle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExploradorDoc;
