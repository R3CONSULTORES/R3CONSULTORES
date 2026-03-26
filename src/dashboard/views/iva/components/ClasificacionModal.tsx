import React from 'react';
import { XMarkIcon } from '@/dashboard/components/Icons';
import type { VatCategory } from '@/dashboard/types';

interface AccountInfo {
    cuenta: string;
    nombre: string;
}

interface ClasificacionModalProps {
    title: string;
    description: string;
    accounts: AccountInfo[];
    classifications: Map<string, VatCategory>;
    onClassificationChange: (cuenta: string, category: VatCategory) => void;
    onClose: () => void;
}

const ClasificacionModal: React.FC<ClasificacionModalProps> = ({ 
    title, 
    description, 
    accounts, 
    classifications, 
    onClassificationChange, 
    onClose 
}) => {
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

export default ClasificacionModal;
