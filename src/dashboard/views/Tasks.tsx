import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import type { Task, TaskStatus } from '@/dashboard/types';
import { PlusIcon, EditIcon, DeleteIcon, XMarkIcon, SearchIcon, DriveIcon, BoltIcon } from '@/dashboard/components/Icons';
import TaskModal from '@/dashboard/components/TaskModal';

type FilterType = 'kanban' | 'upcoming' | TaskStatus;

const statusColors: Record<TaskStatus, { bg: string, text: string, border: string }> = {
    'vencida': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
    'por-presentar': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-500' },
    'borrador': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
    'presentado': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
};

const TaskCard: React.FC<{ task: Task, onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void, onEdit: (task: Task) => void, onDelete: (task: Task) => void }> = ({ task, onDragStart, onEdit, onDelete }) => {
    const { dueDate, title, clientName, status } = task;
    const context = useContext(AppContext);

    const colors = statusColors[status];
    const formattedDate = new Date(dueDate + 'T00:00:00').toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
    
    const showStartReviewButton = task.title.includes('Revisión Mensual') || task.title.includes('ReteFuente');
    const handleStartReviewClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (task.title.includes('Revisión Mensual')) {
            context?.startRevisionFromTask(task);
        } else if (task.title.includes('ReteFuente')) {
            context?.startRetencionesFromTask(task);
        }
    };

    return (
        <div 
            draggable 
            onDragStart={(e) => onDragStart(e, task.id)}
            className={`bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-100 ${colors.border} p-4 cursor-grab transition-transform hover:-translate-y-0.5 group w-full text-left mx-auto max-w-[95%]`}
        >
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-800 flex-1 pr-2 leading-tight">{title}</h4>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    {showStartReviewButton && (
                        <button onClick={handleStartReviewClick} className="p-1 rounded-full text-slate-500 hover:bg-slate-200" title="Iniciar Revisión">
                            <BoltIcon className="w-4 h-4 text-amber-600" />
                        </button>
                    )}
                    <button onClick={() => onEdit(task)} className="p-1 rounded-full text-slate-500 hover:bg-slate-200" title="Editar"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(task)} className="p-1 rounded-full text-slate-500 hover:bg-slate-200" title="Eliminar"><DeleteIcon className="w-4 h-4" /></button>
                </div>
            </div>
            <p className="text-sm text-slate-500 mt-2 font-medium">{clientName || 'General'}</p>
             <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                <p className={`text-xs font-bold ${colors.text} bg-slate-50 px-2 py-1 rounded-md`}>Vence: {formattedDate}</p>
                {task.driveLink && (
                    <a 
                        href={task.driveLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                        title="Abrir en Google Drive"
                    >
                        <DriveIcon className="w-4 h-4" />
                    </a>
                )}
            </div>
        </div>
    );
};

const TaskColumn: React.FC<{ title: string; tasks: Task[]; status: TaskStatus; onDrop: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void; onEdit: (task: Task) => void; onDelete: (task: Task) => void; onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void; }> = ({ title, tasks, status, onDrop, onEdit, onDelete, onDragStart }) => {
    
     const columnColors: Record<TaskStatus, { bg: string, text: string, decoration: string }> = {
        'vencida': { bg: 'bg-slate-50', text: 'text-slate-800', decoration: 'border-t-[3px] border-t-red-500' },
        'por-presentar': { bg: 'bg-slate-50', text: 'text-slate-800', decoration: 'border-t-[3px] border-t-amber-500' },
        'borrador': { bg: 'bg-slate-50', text: 'text-slate-800', decoration: 'border-t-[3px] border-t-orange-500' },
        'presentado': { bg: 'bg-slate-50', text: 'text-slate-800', decoration: 'border-t-[3px] border-t-green-500' },
    };

    const colors = columnColors[status];

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    return (
        <div 
            onDrop={(e) => onDrop(e, status)}
            onDragOver={handleDragOver}
            className={`${colors.bg} rounded-xl p-3 flex-shrink-0 w-80 shadow-sm border border-slate-100 ${colors.decoration} flex flex-col items-center`}
        >
            <div className="flex items-center justify-between mb-4 px-2 pt-1 w-full">
                <h3 className={`font-bold text-lg ${colors.text}`}>{title}</h3>
                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{tasks.length}</span>
            </div>
            <div className="w-full space-y-3 min-h-[60vh] pb-2 flex flex-col items-center">
                {tasks.map(task => (
                    <TaskCard key={task.id} task={task} onDragStart={onDragStart} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
        </div>
    );
};

const Tasks: React.FC = () => {
    const context = useContext(AppContext);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('kanban');

    if (!context) {
        return <div>Cargando...</div>;
    }

    const { appState, saveTask, deleteTask, startRevisionFromTask, startRetencionesFromTask } = context;
    const { tasks } = appState;

    const filteredTasks = useMemo(() => {
        const baseTasks = [...tasks];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let filtered: Task[];

        if (activeFilter === 'kanban') {
            const twentyDaysAgo = new Date(now);
            twentyDaysAgo.setDate(now.getDate() - 20);
            const twentyDaysFromNow = new Date(now);
            twentyDaysFromNow.setDate(now.getDate() + 20);

            filtered = baseTasks.filter(task => {
                const dueDate = new Date(task.dueDate + 'T00:00:00');
                const isVencida = task.status === 'vencida';
                const isInRange = dueDate >= twentyDaysAgo && dueDate <= twentyDaysFromNow;
                return isVencida || isInRange;
            });

        } else if (activeFilter === 'upcoming') {
            const oneWeekFromNow = new Date(now);
            oneWeekFromNow.setDate(now.getDate() + 7);

            filtered = baseTasks.filter(task => {
                const dueDate = new Date(task.dueDate + 'T00:00:00');
                return task.status === 'por-presentar' && dueDate >= now && dueDate <= oneWeekFromNow;
            });
        } else { // 'vencida', 'por-presentar', 'borrador', 'presentado'
            filtered = baseTasks.filter(task => task.status === activeFilter);
        }
        
        if (searchTerm) {
            const lowercasedSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(lowercasedSearch) ||
                (task.clientName && task.clientName.toLowerCase().includes(lowercasedSearch))
            );
        }

        if (activeFilter !== 'kanban') {
            if (activeFilter === 'presentado') {
                 filtered.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
            } else {
                filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            }
        }
        
        return filtered;
    }, [tasks, activeFilter, searchTerm]);

    const kanbanTasks = useMemo(() => {
        if (activeFilter !== 'kanban') return { vencida: [], 'por-presentar': [], borrador: [], presentado: [] };
        
        return {
            vencida: filteredTasks.filter(t => t.status === 'vencida').sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
            'por-presentar': filteredTasks.filter(t => t.status === 'por-presentar').sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
            borrador: filteredTasks.filter(t => t.status === 'borrador').sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
            presentado: filteredTasks.filter(t => t.status === 'presentado').sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()),
        };
    }, [filteredTasks, activeFilter]);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
        const taskId = e.dataTransfer.getData("taskId");
        const taskToUpdate = tasks.find(task => task.id === taskId);
        if (taskToUpdate && taskToUpdate.status !== newStatus) {
            saveTask({ ...taskToUpdate, status: newStatus });
        }
    };

    const handleOpenAddModal = () => {
        setTaskToEdit(null);
        setIsTaskModalOpen(true);
    };

    const handleOpenEditModal = (task: Task) => {
        setTaskToEdit(task);
        setIsTaskModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsTaskModalOpen(false);
        setTaskToEdit(null);
    };
    
    const handleSaveTask = (taskToSave: Task) => {
        saveTask(taskToSave);
        handleCloseModal();
    };
    
    const handleDeleteRequest = (task: Task) => {
        setTaskToDelete(task);
    };

    const handleConfirmDelete = () => {
        if (taskToDelete) {
            deleteTask(taskToDelete.id);
            setTaskToDelete(null);
        }
    };
    
    const handleStartReviewClick = (task: Task) => {
        if (task.title.includes('Revisión Mensual')) {
            startRevisionFromTask(task);
        } else if (task.title.includes('ReteFuente')) {
            startRetencionesFromTask(task);
        }
    };

    const filters: { id: FilterType; label: string }[] = [
        { id: 'kanban', label: 'Kanban' },
        { id: 'upcoming', label: 'Próximas' },
        { id: 'vencida', label: 'Vencidas' },
        { id: 'por-presentar', label: 'Por Presentar' },
        { id: 'borrador', label: 'Borrador' },
        { id: 'presentado', label: 'Presentado' },
    ];

    return (
        <>
            <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800">Gestión de Tareas</h1>
                    <p className="text-slate-500 mt-1">Organice y filtre sus obligaciones fiscales y contables.</p>
                </div>
                 <button
                    onClick={handleOpenAddModal}
                    className="bg-slate-900 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-200 flex items-center gap-2">
                    <PlusIcon />
                    Nueva Tarea
                </button>
            </header>
            
            <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="relative w-full md:w-auto md:flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="text-slate-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por título o cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                    />
                </div>

                <div className="flex-shrink-0 flex flex-wrap gap-2 justify-center">
                    {filters.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                                activeFilter === filter.id
                                    ? 'bg-slate-800 text-white shadow'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeFilter === 'kanban' ? (
                <div className="flex gap-6 overflow-x-auto pb-4">
                    <TaskColumn title="Vencida" tasks={kanbanTasks.vencida} status="vencida" onDrop={handleDrop} onEdit={handleOpenEditModal} onDelete={handleDeleteRequest} onDragStart={handleDragStart} />
                    <TaskColumn title="Por Presentar" tasks={kanbanTasks['por-presentar']} status="por-presentar" onDrop={handleDrop} onEdit={handleOpenEditModal} onDelete={handleDeleteRequest} onDragStart={handleDragStart} />
                    <TaskColumn title="Borrador" tasks={kanbanTasks.borrador} status="borrador" onDrop={handleDrop} onEdit={handleOpenEditModal} onDelete={handleDeleteRequest} onDragStart={handleDragStart} />
                    <TaskColumn title="Presentado" tasks={kanbanTasks.presentado} status="presentado" onDrop={handleDrop} onEdit={handleOpenEditModal} onDelete={handleDeleteRequest} onDragStart={handleDragStart} />
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Título
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Vencimiento
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredTasks.length > 0 ? filteredTasks.map(task => {
                                    const colors = statusColors[task.status];
                                    const showStartReviewButton = task.title.includes('Revisión Mensual') || task.title.includes('ReteFuente');
                                    return (
                                        <tr key={task.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{task.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{task.clientName || 'General'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors.bg} ${colors.text}`}>
                                                    {task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {showStartReviewButton && (
                                                    <button onClick={() => handleStartReviewClick(task)} className="p-2 inline-block rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="Iniciar Revisión">
                                                        <BoltIcon className="w-5 h-5 text-amber-600"/>
                                                    </button>
                                                )}
                                                {task.driveLink && (
                                                    <a href={task.driveLink} target="_blank" rel="noopener noreferrer" className="p-2 inline-block rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="Abrir en Google Drive">
                                                        <DriveIcon className="w-5 h-5" />
                                                    </a>
                                                )}
                                                <button onClick={() => handleOpenEditModal(task)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="Editar"><EditIcon /></button>
                                                <button onClick={() => handleDeleteRequest(task)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors" title="Eliminar"><DeleteIcon /></button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-slate-500">
                                            No se encontraron tareas para este filtro.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isTaskModalOpen && <TaskModal onClose={handleCloseModal} onSave={handleSaveTask} taskToEdit={taskToEdit} />}
            
            {taskToDelete && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm text-center">
                        <h3 className="text-lg font-bold text-slate-800">Confirmar Eliminación</h3>
                        <p className="my-4 text-slate-600">¿Está seguro que desea eliminar la tarea "{taskToDelete.title}"? Esta acción no se puede deshacer.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setTaskToDelete(null)} className="px-6 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300">Cancelar</button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Tasks;