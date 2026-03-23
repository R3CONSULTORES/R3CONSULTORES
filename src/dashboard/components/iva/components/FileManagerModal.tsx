
import React from 'react';
import { WideFileUploadCard } from './WideFileUploadCard';
import { XMarkIcon, BoltIcon } from '../../Icons';
import type { AppState, FileType } from '../../../types';

// Inline SVGs for File Icons to avoid missing images
const FileDocIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const FileMoneyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const FileCartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
);

const FileShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
);

interface FileManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUploadStatus: AppState['fileUploadStatus'];
    handleFileChange: (fileType: FileType, file: File) => void;
    handleGenerate: () => void;
    allBaseFilesLoaded: boolean;
    ivaNeedsRecalculation: boolean;
}

export const FileManagerModal: React.FC<FileManagerModalProps> = ({
    isOpen,
    onClose,
    fileUploadStatus,
    handleFileChange,
    handleGenerate,
    allBaseFilesLoaded,
    ivaNeedsRecalculation
}) => {
    if (!isOpen) return null;

    const onGenerateAndClose = () => {
        handleGenerate();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-[#1e293b]">Gestión de Archivos Fuente</h2>
                        <p className="text-slate-500 text-sm">Cargue los 4 archivos requeridos para iniciar la liquidación.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto bg-slate-50/50 flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <WideFileUploadCard 
                            fileType="iva_auxiliar" 
                            status={fileUploadStatus['iva_auxiliar'].status} 
                            fileName={fileUploadStatus['iva_auxiliar'].name} 
                            onFileChange={handleFileChange} 
                            title="Auxiliar General" 
                            description="Balance de prueba detallado (todas las cuentas)." 
                            icon={<FileDocIcon />} 
                        />
                        <WideFileUploadCard 
                            fileType="iva_ventas" 
                            status={fileUploadStatus['iva_ventas'].status} 
                            fileName={fileUploadStatus['iva_ventas'].name} 
                            onFileChange={handleFileChange} 
                            title="Informe Ventas" 
                            description="Detalle de facturación para cruzar ingresos." 
                            icon={<FileMoneyIcon />} 
                        />
                        <WideFileUploadCard 
                            fileType="iva_compras" 
                            status={fileUploadStatus['iva_compras'].status} 
                            fileName={fileUploadStatus['iva_compras'].name} 
                            onFileChange={handleFileChange} 
                            title="Informe Compras" 
                            description="Clasificación detallada de bienes y servicios." 
                            icon={<FileCartIcon />} 
                        />
                        <WideFileUploadCard 
                            fileType="iva_dian" 
                            status={fileUploadStatus['iva_dian'].status} 
                            fileName={fileUploadStatus['iva_dian'].name} 
                            onFileChange={handleFileChange} 
                            title="Informe DIAN" 
                            description="Reporte de Facturación Electrónica (Recibidos/Emitidos)." 
                            icon={<FileShieldIcon />} 
                        />
                    </div>

                    {!allBaseFilesLoaded && (
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-center justify-center gap-2">
                            <span>⚠️ Faltan archivos por cargar. Asegúrese de completar los 4 campos.</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onGenerateAndClose}
                        disabled={!allBaseFilesLoaded}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] ${
                            allBaseFilesLoaded 
                            ? 'bg-[#1e293b] hover:bg-[#16202d]' 
                            : 'bg-slate-300 cursor-not-allowed'
                        }`}
                    >
                        <BoltIcon className="w-5 h-5 text-[#f6b034]" />
                        {ivaNeedsRecalculation ? 'Recalcular Base de Datos' : 'Generar Base de Datos'}
                    </button>
                </div>
            </div>
        </div>
    );
};
