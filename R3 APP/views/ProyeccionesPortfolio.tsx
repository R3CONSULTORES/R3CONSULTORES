
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { formatCurrency } from '../utils/formatters';
import { TrendingUpIcon, BoltIcon, CheckCircleIcon, SearchIcon, XMarkIcon } from '../components/Icons';
import type { SavedProyeccion } from '../types';

interface ClientPortfolioCardProps {
    clientName: string;
    nit?: string;
    projections: SavedProyeccion[];
    onManage: () => void;
}

const ClientPortfolioCard: React.FC<ClientPortfolioCardProps> = ({ clientName, nit, projections, onManage }) => {
    // Determine the active or most relevant projection
    const activeProjection = projections.length > 0 ? projections[0] : null;

    if (!activeProjection) return null;

    // Calculate totals from history
    const closedMonths = activeProjection.history?.filter(h => !h.isProjected) || [];
    const totalAccumulated = closedMonths.reduce((sum, m) => sum + ((m.ivaGenerado || 0) - (m.ivaDescontable || 0) - (m.reteIva || 0)), 0);
    const meta = activeProjection.metaDefinida || 0;
    
    // Safety check for division by zero
    const progress = meta > 0 ? Math.min(100, (totalAccumulated / meta) * 100) : 0;
    const isOverLimit = totalAccumulated > meta;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div className="flex-1 pr-2">
                    {/* Updated: Allow text wrapping and remove truncate */}
                    <h3 className="font-bold text-slate-800 text-lg leading-snug break-words" title={clientName}>
                        {clientName}
                    </h3>
                    {nit && <p className="text-xs text-slate-500 font-mono mt-1">{nit}</p>}
                </div>
                <div className={`flex-shrink-0 p-2 rounded-full ${isOverLimit ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <TrendingUpIcon className="w-5 h-5" />
                </div>
            </div>

            <div className="p-5 flex-grow">
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Consumo de Meta</span>
                        <span className={`text-sm font-mono font-bold ${isOverLimit ? 'text-red-600' : 'text-slate-700'}`}>
                            {formatCurrency(totalAccumulated)} <span className="text-slate-400 font-normal">/ {formatCurrency(meta)}</span>
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${isOverLimit ? 'bg-red-500' : 'bg-[#000040]'}`} 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-1">Detalle Periodos Cerrados</p>
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar-light">
                        {closedMonths.length > 0 ? (
                            closedMonths.map((m, i) => {
                                const monthlyBalance = (m.ivaGenerado || 0) - (m.ivaDescontable || 0) - (m.reteIva || 0);
                                return (
                                    <div key={i} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded border border-slate-100">
                                        <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                                            <CheckCircleIcon className="w-3.5 h-3.5"/> 
                                            {m.periodLabel}
                                        </span>
                                        <span className="font-mono text-slate-700 font-medium">
                                            {formatCurrency(monthlyBalance)}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <span className="text-xs text-slate-400 italic py-2">No hay meses cerrados aún.</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto">
                <button 
                    onClick={onManage}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all text-sm shadow-sm group"
                >
                    <BoltIcon className="w-4 h-4 text-[#f6b034]" />
                    Gestionar / Nuevo Mes
                </button>
            </div>
        </div>
    );
};

const ProyeccionesPortfolio: React.FC = () => {
    const context = useContext(AppContext);
    
    // Local state for search
    const [searchTerm, setSearchTerm] = useState('');

    if (!context) return <div>Cargando...</div>;
    const { appState, updateAppState, setActiveModule } = context;
    const { savedProjections, clients } = appState;

    // Group projections by Client Name
    const groupedData = useMemo(() => {
        const groups = new Map<string, SavedProyeccion[]>();
        
        savedProjections.forEach(proj => {
            // Filter out empty or invalid entries if any
            if (!proj.clientName) return;
            
            if (!groups.has(proj.clientName)) {
                groups.set(proj.clientName, []);
            }
            groups.get(proj.clientName)!.push(proj);
        });

        // Sort groups alphabetically
        return new Map([...groups.entries()].sort());
    }, [savedProjections]);

    // Filter Logic
    const filteredClients = useMemo(() => {
        const allClients = Array.from(groupedData.entries());
        
        if (!searchTerm) return allClients;
        
        const lowerTerm = searchTerm.toLowerCase();

        return allClients.filter(([clientName]) => {
            // Find NIT for search
            const clientObj = clients.find(c => (c.razonSocial === clientName || c.nombreCompleto === clientName));
            const nit = clientObj?.nit || clientObj?.cedula || '';
            
            return clientName.toLowerCase().includes(lowerTerm) || nit.includes(lowerTerm);
        });

    }, [groupedData, searchTerm, clients]);


    const handleManageClient = (clientName: string) => {
        // Find full client data to ensure context is set correctly
        const client = clients.find(c => 
            (c.tipoPersona === 'Persona Jurídica' ? c.razonSocial : c.nombreCompleto) === clientName
        );

        // Update Global State
        updateAppState({ 
            razonSocial: clientName,
            // If we have a projection, maybe set the period from the last one? 
            // For now, let the user pick in the workspace or default logic handles it.
        });

        // Navigate to the Calculation Tool (Directly to Proyecciones Tab logic via IvaReview)
        setActiveModule('proyecciones-iva');
    };

    return (
        <div className="animate-fadeIn p-4 md:p-8">
            <header className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[#000040]">Portafolio de Proyecciones</h1>
                        <p className="text-slate-500 mt-1">Monitoreo centralizado del cumplimiento de metas de IVA por cliente.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                            <span className="block text-xs text-slate-400 font-bold uppercase">Total Clientes</span>
                            <span className="text-xl font-bold text-slate-800">{groupedData.size}</span>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:ring-2 focus:ring-[#f6b034] focus:border-[#f6b034] sm:text-sm shadow-sm transition-shadow"
                        placeholder="Buscar cliente por nombre o NIT..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </header>

            {groupedData.size === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
                    <div className="p-4 bg-slate-50 rounded-full mb-4">
                        <TrendingUpIcon className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600">No hay proyecciones activas</h3>
                    <p className="text-slate-400 max-w-md mt-2">
                        Inicie una nueva revisión de IVA y guarde un escenario para verlo reflejado aquí.
                    </p>
                    <button 
                        onClick={() => setActiveModule('contable')}
                        className="mt-6 bg-[#000040] text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
                    >
                        Iniciar Nueva Revisión
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredClients.map(([clientName, projections]) => {
                        // Attempt to find NIT from client list for display
                        const clientObj = clients.find(c => (c.razonSocial === clientName || c.nombreCompleto === clientName));
                        const nit = clientObj?.nit || clientObj?.cedula;

                        return (
                            <ClientPortfolioCard 
                                key={clientName}
                                clientName={clientName}
                                nit={nit}
                                projections={projections}
                                onManage={() => handleManageClient(clientName)}
                            />
                        );
                    })}
                </div>
            )}
            
            {groupedData.size > 0 && filteredClients.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-500 italic">No se encontraron clientes que coincidan con "{searchTerm}".</p>
                </div>
            )}
        </div>
    );
};

export default ProyeccionesPortfolio;
