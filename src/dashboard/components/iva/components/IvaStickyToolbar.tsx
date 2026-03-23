
import React from 'react';
import { ArrowUpTrayIcon } from '../../Icons';

interface IvaStickyToolbarProps {
    clientName: string;
    nit?: string;
    onOpenFiles: () => void;
    onExportExcel: () => void;
    isReadyToExport: boolean;
}

export const IvaStickyToolbar: React.FC<IvaStickyToolbarProps> = ({
    clientName,
    onOpenFiles,
    onExportExcel,
    isReadyToExport
}) => {
    return (
        <div className="h-full flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-800 truncate max-w-[200px] md:max-w-[400px]" title={clientName}>
                        {clientName}
                    </h2>
                </div>
                
                <div className="h-6 w-px bg-gray-300 hidden md:block"></div>

                <button 
                    onClick={onOpenFiles}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors border border-slate-200"
                >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    <span>Archivos</span>
                </button>
            </div>

            <div className="flex items-center gap-3">
                <button 
                    onClick={onExportExcel}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all
                        ${isReadyToExport 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                    `}
                    title={isReadyToExport ? "Descargar Reporte Excel" : "Genere la liquidación primero"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936-.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 01-.189-.866c0-.298.059-.605.189-.866zm2.023 6.828a.75.75 0 10-1.06-1.06 3.752 3.752 0 01-5.304 0 .75.75 0 00-1.06 1.06 5.25 5.25 0 007.424 0z" clipRule="evenodd" />
                    </svg>
                    <span>Exportar Excel</span>
                </button>
            </div>
        </div>
    );
};
