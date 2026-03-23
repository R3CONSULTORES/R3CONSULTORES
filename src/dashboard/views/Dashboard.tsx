
import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import { AppContextType, Task } from '@/dashboard/types';

// --- TAREA 1: Definición de Iconos SVG (Inline) ---
// Estos iconos reemplazan a las imágenes externas para asegurar carga inmediata y cero errores 404.

const ExclamationCircleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
);

const DocumentSearchIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
    </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
);

const CheckBadgeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm4.45 6.45a.75.75 0 10-1.1 1.1l1.69 1.69a.75.75 0 001.1 0l4.25-4.25a.75.75 0 00-1.1-1.1L14.134 11.41l-1.082-1.16z" clipRule="evenodd" />
    </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
    </svg>
);

const BoltIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
    </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
);

const BriefcaseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h1.125v1.5a.75.75 0 001.5 0v-1.5h3.75v1.5a.75.75 0 001.5 0v-1.5h1.125a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H7.5zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v.75H6v-.75zm0 2.25h12v9a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75v-9z" clipRule="evenodd" />
    </svg>
);

// --- Helpers ---

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
};

const formatDate = () => {
    return new Date().toLocaleDateString('es-CO', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

const StatusBadge: React.FC<{ status: Task['status'] }> = ({ status }) => {
    const config = {
        'vencida': { color: 'bg-red-50 text-red-700 border-red-100', label: 'Vencida' },
        'por-presentar': { color: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Por Presentar' },
        'borrador': { color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Borrador' },
        'presentado': { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Presentado' },
    };
    
    const style = config[status] || config['borrador'];

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${style.color} whitespace-nowrap`}>
            {style.label}
        </span>
    );
};

// Componente Tarjeta KPI
const KpiCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    subtext?: string;
    bgColor?: string;
}> = ({ title, value, icon, subtext, bgColor = 'bg-slate-50' }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between transition-all hover:shadow-md h-full">
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
            {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${bgColor}`}>
            {icon}
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const context = useContext(AppContext);

    if (!context) {
        return <div className="flex h-screen items-center justify-center text-slate-400">Cargando entorno...</div>;
    }

    const { appState, setActiveModule } = context as AppContextType;
    const { clients, tasks } = appState;

    // --- Cálculos de Negocio ---

    const clientSummary = useMemo(() => {
        const active = clients.filter(c => c.status === 'Activo').length;
        const total = clients.length;
        const inactive = total - active;
        const activePercentage = total > 0 ? (active / total) * 100 : 0;
        return { total, active, inactive, activePercentage };
    }, [clients]);

    const taskMetrics = useMemo(() => {
        const total = tasks.length;
        const attentionRequired = tasks.filter(t => t.status === 'vencida' || t.status === 'por-presentar').length;
        const completed = tasks.filter(t => t.status === 'presentado').length;
        const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { total, attentionRequired, complianceRate };
    }, [tasks]);

    const sortedTasks = useMemo(() => {
        return [...tasks]
            .filter(t => t.status !== 'presentado') // Enfocarse en lo pendiente
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 7); // Mostrar solo las 7 más urgentes
    }, [tasks]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 p-6 md:p-8 animate-enter">
            
            {/* 1. Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                        {getGreeting()}, Contador 👋
                    </h1>
                    <p className="text-slate-500 mt-1 first-letter:capitalize font-medium">
                        {formatDate()}
                    </p>
                </div>
            </header>

            {/* 2. KPI Section (TAREA 2: Ajuste de Layout y Espaciado) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                    title="Clientes Activos" 
                    value={clientSummary.active} 
                    icon={<UsersIcon className="w-6 h-6 text-[#f6b034]" />}
                    bgColor="bg-[#f6b034]/10"
                    subtext={`De un total de ${clientSummary.total} registrados`}
                />
                <KpiCard 
                    title="Atención Requerida" 
                    value={taskMetrics.attentionRequired} 
                    icon={<ExclamationCircleIcon className="w-6 h-6 text-[#1e293b]" />}
                    bgColor="bg-[#1e293b]/10"
                    subtext="Tareas vencidas o por presentar"
                />
                <KpiCard 
                    title="Tasa de Cumplimiento" 
                    value={`${taskMetrics.complianceRate}%`} 
                    icon={<CheckBadgeIcon className="w-6 h-6 text-emerald-600" />}
                    bgColor="bg-emerald-50"
                    subtext="Basado en tareas presentadas"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 3. Task List (Left Column - 66%) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-slate-400" />
                                Próximas Tareas
                            </h2>
                            <button 
                                onClick={() => setActiveModule('tasks')}
                                className="text-sm font-medium text-[#f6b034] hover:text-[#e0a02f] flex items-center gap-1 transition-colors"
                            >
                                Ver todas <ArrowRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="divide-y divide-slate-50">
                            {sortedTasks.length > 0 ? (
                                <ul>
                                    {sortedTasks.map(task => (
                                        <li key={task.id} className="p-4 hover:bg-slate-50 transition-colors group cursor-default">
                                            <div className="flex items-center gap-4">
                                                {/* Icono / Avatar */}
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100">
                                                    <BriefcaseIcon className="w-5 h-5" />
                                                </div>
                                                
                                                {/* Info Principal */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate">
                                                        {task.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                        {task.clientName || 'General'}
                                                    </p>
                                                </div>

                                                {/* Fecha y Estado */}
                                                <div className="flex flex-col items-end gap-1">
                                                    <StatusBadge status={task.status} />
                                                    <span className="text-xs text-slate-400 font-medium font-mono">
                                                        {task.dueDate}
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                                    <CheckBadgeIcon className="w-12 h-12 text-slate-200 mb-2" />
                                    <p>¡Todo al día! No tienes tareas pendientes próximas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Sidebar (Right Column - 33%) */}
                <div className="space-y-6">
                    
                    {/* Quick Actions (TAREA 3: Corrección Botón Iniciar Revisión) */}
                    <div className="space-y-4">
                        <button 
                            onClick={() => setActiveModule('contable')}
                            className="w-full bg-[#1e293b] hover:bg-[#1e293b]/90 text-white p-4 rounded-xl shadow-md transition-all transform active:scale-[0.98] flex items-center gap-4 group"
                        >
                            <div className="p-2 bg-[#f6b034]/20 rounded-lg group-hover:bg-[#f6b034]/30 transition-colors">
                                <DocumentSearchIcon className="w-6 h-6 text-[#f6b034]" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold">Iniciar Revisión</span>
                                <span className="text-xs text-slate-300">Auditoría Contable & Fiscal</span>
                            </div>
                        </button>

                        <button 
                            onClick={() => setActiveModule('clients')}
                            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 p-4 rounded-xl shadow-sm transition-all transform active:scale-[0.98] flex items-center gap-4 group"
                        >
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                                <PlusIcon className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold">Nuevo Cliente</span>
                                <span className="text-xs text-slate-400">Registrar y configurar</span>
                            </div>
                        </button>
                    </div>

                    {/* Portfolio Health */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BoltIcon className="w-5 h-5 text-slate-400" />
                            Estado de Cartera
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1.5">
                                    <span className="text-slate-600">Activos</span>
                                    <span className="text-emerald-600">{clientSummary.active}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                                        style={{ width: `${clientSummary.activePercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1.5">
                                    <span className="text-slate-600">Inactivos</span>
                                    <span className="text-slate-400">{clientSummary.inactive}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-slate-400 h-2 rounded-full transition-all duration-1000" 
                                        style={{ width: `${100 - clientSummary.activePercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-50 text-center">
                            <button 
                                onClick={() => setActiveModule('clients')}
                                className="text-xs font-bold text-[#f6b034] hover:text-[#e0a02f] hover:underline transition-colors"
                            >
                                Administrar Clientes
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
