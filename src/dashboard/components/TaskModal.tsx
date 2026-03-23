import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import type { Task, TaskStatus, Client } from '@/dashboard/types';
import { XMarkIcon, PlusIcon } from './Icons';

interface TaskModalProps {
    onClose: () => void;
    onSave: (task: Task) => void;
    taskToEdit: Task | null;
}

const inputBaseClasses = "w-full px-3 py-2 border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm bg-white text-slate-900 placeholder-slate-400 border-slate-300";

const TaskModal: React.FC<TaskModalProps> = ({ onClose, onSave, taskToEdit }) => {
    const context = useContext(AppContext);
    
    const [taskData, setTaskData] = useState<Partial<Task>>({
        id: taskToEdit?.id || undefined,
        title: taskToEdit?.title || '',
        clientId: taskToEdit?.clientId || null,
        dueDate: taskToEdit?.dueDate || '',
        status: taskToEdit?.status || 'borrador',
        comments: taskToEdit?.comments || [''],
        driveLink: taskToEdit?.driveLink || '',
    });

    if (!context) return null;
    const { clients } = context.appState;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTaskData(prev => ({ ...prev, [name]: value }));
    };

    const handleCommentChange = (index: number, value: string) => {
        const newComments = [...(taskData.comments || [])];
        newComments[index] = value;
        setTaskData(prev => ({ ...prev, comments: newComments }));
    };
    
    const addCommentField = () => {
        setTaskData(prev => ({ ...prev, comments: [...(prev.comments || []), ''] }));
    };

    const removeCommentField = (index: number) => {
        if (taskData.comments && taskData.comments.length > 1) {
            setTaskData(prev => ({ ...prev, comments: prev.comments?.filter((_, i) => i !== index) }));
        } else {
             setTaskData(prev => ({ ...prev, comments: [''] }));
        }
    };
    
    const handleSave = () => {
        if (!taskData.title || !taskData.dueDate) {
            // Basic validation
            alert("El título y la fecha de vencimiento son obligatorios.");
            return;
        }

        const client = clients.find(c => c.id === taskData.clientId);
        const clientName = client ? (client.tipoPersona === 'Persona Jurídica' ? client.razonSocial : client.nombreCompleto) : (taskData.clientId ? 'Cliente no encontrado' : 'General');

        const finalTask: Task = {
            id: taskData.id || `new_${Date.now()}`, // temp id for new tasks
            title: taskData.title,
            clientId: taskData.clientId || null,
            clientName: clientName || null,
            dueDate: taskData.dueDate,
            status: taskData.status as TaskStatus,
            comments: (taskData.comments || []).filter(c => c.trim() !== ''),
            driveLink: taskData.driveLink,
        };
        onSave(finalTask);
    };

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-5 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800">{taskToEdit ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="p-6 overflow-y-auto space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Título de la Tarea</label>
                        <input type="text" name="title" value={taskData.title} onChange={handleChange} className={inputBaseClasses} placeholder="Ej: Declaración de Renta" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Cliente</label>
                            <select name="clientId" value={taskData.clientId || ''} onChange={handleChange} className={inputBaseClasses}>
                                <option value="">General (Sin cliente)</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.tipoPersona === 'Persona Jurídica' ? client.razonSocial : client.nombreCompleto}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Fecha de Vencimiento</label>
                            <input type="date" name="dueDate" value={taskData.dueDate} onChange={handleChange} className={inputBaseClasses} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Estado</label>
                        <select name="status" value={taskData.status} onChange={handleChange} className={inputBaseClasses}>
                            <option value="borrador">Borrador</option>
                            <option value="por-presentar">Por Presentar</option>
                            <option value="vencida">Vencida</option>
                            <option value="presentado">Presentado</option>
                        </select>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Comentarios</label>
                        <div className="space-y-2">
                            {(taskData.comments || []).map((comment, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={comment} 
                                        onChange={(e) => handleCommentChange(index, e.target.value)} 
                                        className={inputBaseClasses}
                                        placeholder={`Comentario ${index + 1}`}
                                     />
                                    <button type="button" onClick={() => removeCommentField(index)} className="p-1 text-red-500 hover:text-red-700" title="Eliminar comentario">
                                        <XMarkIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addCommentField} className="mt-2 text-sm text-slate-800 font-semibold hover:text-amber-600 flex items-center gap-1">
                            <PlusIcon className="w-4 h-4" />Agregar comentario
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Enlace a Drive</label>
                        <input type="url" name="driveLink" value={taskData.driveLink} onChange={handleChange} className={inputBaseClasses} placeholder="https://docs.google.com/..." />
                    </div>

                </main>
                
                 <footer className="p-5 bg-slate-50 border-t border-slate-200 text-right">
                    <button onClick={handleSave} className="w-full md:w-auto bg-slate-900 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-200">
                        Guardar Tarea
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TaskModal;