
import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import { AppContextType, Task } from '@/dashboard/types';
import { 
    ExclamationCircleIcon, 
    DocumentSearchIcon, 
    ClientsIcon, 
    CheckBadgeIcon, 
    ClockIcon, 
    BoltIcon, 
    PlusIcon, 
    ArrowRightIcon, 
    BriefcaseIcon 
} from '@/dashboard/components/Icons';

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

            {/* 2. KPI Section (Premium Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                    title="Clientes Activos" 
                    value={clientSummary.active} 
                    icon={<ClientsIcon className="w-6 h-6 text-[#f6b034]" />}
                    bgColor="bg-[#1e293b]/5"
                    subtext={`De un total de ${clientSummary.total} registrados`}
                />
                <KpiCard 
                    title="Atención Requerida" 
                    value={taskMetrics.attentionRequired} 
                    icon={<ExclamationCircleIcon className="w-6 h-6 text-red-500" />}
                    bgColor="bg-red-50/50"
                    subtext="Tareas vencidas o por presentar"
                />
                <KpiCard 
                    title="Cumplimiento" 
                    value={`${taskMetrics.complianceRate}%`} 
                    icon={<CheckBadgeIcon className="w-6 h-6 text-emerald-600" />}
                    bgColor="bg-emerald-50/50"
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
                                        <li key={task.id} className="p-4 hover:bg-[#1e293b]/[0.02] transition-colors group cursor-default">
                                            <div className="flex items-center gap-4">
                                                {/* Icono Premium */}
                                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#f6b034] shadow-sm border border-slate-100 group-hover:border-[#f6b034]/20 transition-all">
                                                    <BriefcaseIcon className="w-5 h-5" />
                                                </div>
                                                
                                                {/* Info Principal */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate">
                                                        {task.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#f6b034]/40"></span>
                                                        {task.clientName || 'General'}
                                                    </p>
                                                </div>

                                                {/* Fecha y Estado */}
                                                <div className="flex flex-col items-end gap-1">
                                                    <StatusBadge status={task.status} />
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
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
