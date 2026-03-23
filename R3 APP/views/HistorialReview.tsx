
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import type { RevisionHistoryItem, ComparisonResult } from '../types';
import { DeleteIcon, ChevronDownIcon } from '../components/Icons';
import { compareRevisions } from '../utils/comparisonUtils';
import ComparisonModal from '../components/ComparisonModal';

const HistorialReview: React.FC = () => {
    const context = useContext(AppContext);
    const [expandedClient, setExpandedClient] = useState<string | null>(null);
    const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [revisionToDelete, setRevisionToDelete] = useState<RevisionHistoryItem | null>(null);


    if (!context) return <div>Cargando...</div>;
    const { appState, deleteRevision, updateAppState, showNotification, setActiveModule } = context;
    const { revisionHistory } = appState;
    
    const handleToggleExpandClient = (clientName: string) => {
        setExpandedClient(prev => (prev === clientName ? null : clientName));
    };

    const handleToggleExpandPeriod = (periodKey: string) => {
        setExpandedPeriod(prev => (prev === periodKey ? null : periodKey));
    };

    const handleDeleteRequest = (e: React.MouseEvent, revision: RevisionHistoryItem) => {
        e.stopPropagation();
        setRevisionToDelete(revision);
    };

    const handleConfirmDelete = () => {
        if (revisionToDelete) {
            deleteRevision(revisionToDelete.id);
            setRevisionToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setRevisionToDelete(null);
    };
    
    const handleLoadRevision = (revision: RevisionHistoryItem) => {
        const { clientName, periodo, results } = revision;
        
        // Helper to safely convert Object to Map for restoration
        const objToMap = (obj: any) => new Map(Object.entries(obj || {}));

        updateAppState({
            razonSocial: clientName,
            periodo,
            conciliacionResultados: results.conciliacionResultados || null,
            resumenDiferencias: results.resumenDiferencias || null,
            analisisCuentas: results.analisisCuentas || null,
            validationResult: results.validationResult || null,
            retencionesResult: results.retencionesResult || null,
            ivaRevisionResult: results.ivaRevisionResult || null,
            coherenciaContableResult: results.coherenciaContableResult || null,

            // Restore IVA Data
            ivaLiquidationResult: results.ivaLiquidationResult || null,
            // Cast types explicitly if needed or rely on loose typing of `any` in helper
            incomeAccountVatClassification: objToMap(results.ivaState?.incomeAccountVatClassification) as any,
            purchaseAccountVatClassification: objToMap(results.ivaState?.purchaseAccountVatClassification) as any,
            ivaTransactionVatOverrides: objToMap(results.ivaState?.ivaTransactionVatOverrides) as any,
            comprasAccountVatClassification: objToMap(results.ivaState?.comprasAccountVatClassification) as any,
            ivaDescontableClassification: objToMap(results.ivaState?.ivaDescontableClassification) as any,
            ivaIncomeComments: objToMap(results.ivaState?.ivaIncomeComments) as any,
        });
        
        showNotification(`Revisión "${revision.revisionName}" cargada correctamente. Redirigiendo a la mesa de trabajo...`);
        setActiveModule('contable');
    };

    const handleSelectionChange = (id: string) => {
        setSelectedIds(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(id)) {
                newSelection.delete(id);
            } else {
                if (newSelection.size < 2) {
                    newSelection.add(id);
                }
            }
            return Array.from(newSelection);
        });
    };

    const handleCompare = () => {
        const selectedRevisions = revisionHistory.filter(r => selectedIds.includes(r.id));
        if (selectedRevisions.length !== 2) return;

        const [rev1, rev2] = selectedRevisions.sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        if (rev1.results && rev2.results) {
            const result = compareRevisions(rev1.results, rev2.results);
            setComparisonResult(result);
            setIsModalOpen(true);
        } else {
            alert("Una o ambas revisiones no tienen datos para comparar.");
        }
    };

    const groupedByClientAndPeriod = useMemo(() => {
        const map = new Map<string, Map<string, RevisionHistoryItem[]>>();
        revisionHistory.forEach(rev => {
            if (!map.has(rev.clientName)) {
                map.set(rev.clientName, new Map());
            }
            const clientMap = map.get(rev.clientName)!;
            if (!clientMap.has(rev.periodo)) {
                clientMap.set(rev.periodo, []);
            }
            clientMap.get(rev.periodo)!.push(rev);
        });
        
        // Sort versions within each period
        map.forEach(clientMap => {
            clientMap.forEach(versions => {
                versions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            });
        });

        return map;
    }, [revisionHistory]);
    
    const canCompare = useMemo(() => {
        if (selectedIds.length !== 2) return false;
        const selected = revisionHistory.filter(r => selectedIds.includes(r.id));
        return selected[0].clientName === selected[1].clientName && selected[0].periodo === selected[1].periodo;
    }, [selectedIds, revisionHistory]);

    return (
        <>
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Historial de Revisiones</h1>
                <p className="text-slate-500 mt-1">Consulte, cargue, elimine o compare las revisiones guardadas anteriormente.</p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-end mb-4">
                    <button onClick={handleCompare} disabled={!canCompare} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
                        Comparar Revisiones ({selectedIds.length}/2)
                    </button>
                </div>

                {groupedByClientAndPeriod.size === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-lg">
                        <p className="text-slate-500">No hay revisiones guardadas.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Array.from(groupedByClientAndPeriod.entries()).map(([clientName, periods]) => (
                            <div key={clientName} className="border border-slate-200 rounded-lg shadow-sm">
                                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50" onClick={() => handleToggleExpandClient(clientName)}>
                                    <p className="font-bold text-slate-800 text-xl">{clientName}</p>
                                    <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform ${expandedClient === clientName ? 'rotate-180' : ''}`} />
                                </div>
                                {expandedClient === clientName && (
                                    <div className="border-t border-slate-200 bg-slate-50 p-3 space-y-2">
                                        {Array.from(periods.entries()).map(([periodo, versions]) => {
                                            const periodKey = `${clientName}-${periodo}`;
                                            return (
                                                <div key={periodKey} className="border border-slate-300 rounded bg-white">
                                                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleToggleExpandPeriod(periodKey)}>
                                                        <p className="font-semibold text-slate-700">{periodo}</p>
                                                         <div className="flex items-center gap-4">
                                                            <span className="text-sm font-semibold bg-slate-200 text-slate-700 px-3 py-1 rounded-full">{versions.length} {versions.length === 1 ? 'versión' : 'versiones'}</span>
                                                            <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${expandedPeriod === periodKey ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </div>
                                                     {expandedPeriod === periodKey && (
                                                        <ul className="divide-y divide-slate-200 border-t p-2">
                                                            {versions.map(revision => (
                                                                <li key={revision.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                                                                    <div className="flex items-center gap-3">
                                                                         <input 
                                                                            type="checkbox" 
                                                                            checked={selectedIds.includes(revision.id)} 
                                                                            onChange={() => handleSelectionChange(revision.id)}
                                                                            className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
                                                                        />
                                                                        <div>
                                                                            <p className="font-medium text-slate-700">{revision.revisionName}</p>
                                                                            <p className="text-xs text-slate-500">Guardado: {revision.createdAt?.toLocaleString('es-CO') || 'Fecha desconocida'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button onClick={() => handleLoadRevision(revision)} className="px-3 py-1 text-sm font-semibold bg-slate-800 text-white rounded-md hover:bg-slate-700">Cargar</button>
                                                                        <button onClick={(e) => handleDeleteRequest(e, revision)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-50"><DeleteIcon className="w-5 h-5"/></button>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {isModalOpen && comparisonResult && (
                <ComparisonModal result={comparisonResult} onClose={() => setIsModalOpen(false)} />
            )}

            {revisionToDelete && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm text-center">
                        <h3 className="text-lg font-bold text-slate-800">Confirmar Eliminación</h3>
                        <p className="my-4 text-slate-600">¿Está seguro que desea eliminar la revisión "{revisionToDelete.revisionName}"? Esta acción no se puede deshacer.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={handleCancelDelete} className="px-6 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300">Cancelar</button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HistorialReview;
