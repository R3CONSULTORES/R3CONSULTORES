
import React from 'react';
import type { AppState, FileType, DianDocumentDetail, VatCategory } from '../../../types';
import { LiquidationSection } from '../components/LiquidationSection';
import { ProrrateoSummary } from '../components/ProrrateoSummary';
import { ArrowUpTrayIcon } from '../../Icons'; // Ensure this icon exists or use generic

interface ControlViewProps {
    files: AppState['files'];
    fileUploadStatus: AppState['fileUploadStatus'];
    handleFileChange: (fileType: FileType, file: File) => void;
    isPanelExpanded: boolean;
    setIsPanelExpanded: (expanded: boolean) => void;
    allBaseFilesLoaded: boolean;
    handleGenerate: () => void;
    ivaNeedsRecalculation: boolean;
    onOpenClasificacionModal: () => void;
    ivaLiquidationResult: AppState['ivaLiquidationResult'];
    ivaIncomeComments: Map<string, string>;
    handleCommentChange: (cuenta: string, comment: string) => void;
    handleShowDianDetails: (title: string, documents: DianDocumentDetail[]) => void;
    ivaTransactionVatOverrides: Map<string, VatCategory>;
    handleTransactionOverride: (txKey: string, category: VatCategory) => void;
    ventaActivosFijos: number;
    setVentaActivosFijos: (value: number) => void;
    prorrateoPercentages: { gravado: number; otros: number };
    onExportExcel: () => void;
    onOpenFiles?: () => void; // New Prop for Fallback
}

export const ControlView: React.FC<ControlViewProps> = ({
    files,
    ivaLiquidationResult,
    ivaIncomeComments,
    handleCommentChange,
    handleShowDianDetails,
    ivaTransactionVatOverrides,
    handleTransactionOverride,
    ventaActivosFijos,
    setVentaActivosFijos,
    prorrateoPercentages,
    onOpenClasificacionModal,
    onOpenFiles, // Destructure new prop
}) => {
    
    return (
        <div>
             {/* ACTIONS ROW - Visible when data is present to quick access classification */}
             {ivaLiquidationResult && (
                <div className="flex justify-end mb-4">
                    <button 
                        onClick={onOpenClasificacionModal} 
                        disabled={!files.iva_auxiliar} 
                        className="bg-white text-slate-800 border border-slate-300 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm"
                    >
                        Clasificar Cuentas de Ingresos
                    </button>
                </div>
            )}

            {ivaLiquidationResult ? (
                <div className="space-y-8 animate-fadeIn">
                    <LiquidationSection 
                        title="INGRESOS" 
                        data={ivaLiquidationResult.ingresos} 
                        comments={ivaIncomeComments}
                        onCommentChange={handleCommentChange}
                        onShowDianDetails={handleShowDianDetails}
                        ivaTransactionVatOverrides={ivaTransactionVatOverrides}
                        onTransactionOverride={handleTransactionOverride}
                    />
                    <ProrrateoSummary 
                        ingresosData={ivaLiquidationResult.ingresos} 
                        ventaActivosFijos={ventaActivosFijos}
                        onVentaActivosFijosChange={setVentaActivosFijos}
                        percentages={prorrateoPercentages}
                    />
                </div>
            ) : (
                <div className="bg-white p-16 rounded-xl shadow-md text-center border-2 border-dashed border-gray-200">
                    <p className="text-xl text-gray-400 font-bold mb-4">Esperando datos...</p>
                    <p className="text-gray-500 mb-6">Cargue los archivos y genere la base de datos para comenzar.</p>
                    
                    {/* Fallback Button for File Upload */}
                    {onOpenFiles && (
                        <button 
                            onClick={onOpenFiles}
                            className="bg-[#000040] text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-slate-800 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                        >
                            <ArrowUpTrayIcon className="w-5 h-5 text-[#f6b034]" />
                            📂 Abrir Panel de Carga
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
