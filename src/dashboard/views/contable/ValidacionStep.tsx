import React, { useState, useContext, useRef } from 'react';
import type { FileStatus, FileType, ValidationData, ValidationResult, AppState } from '@/dashboard/types';
import { AppContext } from '@/dashboard/contexts/AppContext';
import { parseExcelFile, processValidation } from '@/dashboard/utils/parsing';
import { ArrowUpTrayIcon, CheckIcon } from '@/dashboard/components/Icons';


// Declare XLSX to be available from script tag
import * as XLSX from 'xlsx';

const ResultsCard: React.FC<{ title: string, count: number, color: 'green' | 'red' | 'yellow' | 'blue' }> = ({ title, count, color }) => {
    const colors = {
        green: 'bg-green-100 text-green-800 border-green-200',
        red: 'bg-red-100 text-red-800 border-red-200',
        yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        blue: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return (
        <div className={`p-3 rounded-lg text-center border ${colors[color]}`}>
            <span className="text-sm font-medium">{title}</span>
            <p className="text-2xl font-bold">{count}</p>
        </div>
    );
};

const DetailTable: React.FC<{ title: string, data: any[], columns: { header: string, key: string, render?: (item: any) => string }[] }> = ({ title, data, columns }) => {
    if (data.length === 0) return null;

    return (
        <div className="mt-4">
            <h5 className="text-md font-semibold text-gray-700 mb-2">{title} ({data.length})</h5>
            <div className="max-h-60 overflow-y-auto border rounded-lg shadow-sm bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            {columns.map(col => <th key={col.key} className="py-2 px-3 text-left font-medium text-gray-600">{col.header}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                {columns.map(col => (
                                    <td key={col.key} className="py-1 px-3 text-gray-800 truncate" title={col.render ? col.render(item) : item[col.key]}>
                                        {(col.render ? col.render(item) : String(item[col.key])).substring(0, 50)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ValidationUploadArea: React.FC<{
    status: FileStatus;
    fileName: string;
    onFileChange: (fileType: FileType, file: File) => void;
    fileType: FileType;
}> = ({ status, fileName, onFileChange, fileType }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileChange(fileType, e.target.files[0]);
        }
    };
    
    const handleClick = () => {
        inputRef.current?.click();
    };

    if (status === 'success') {
        return (
            <div className="border bg-green-50 border-green-300 rounded-lg p-3 text-center flex flex-col items-center justify-center h-full min-h-[160px]">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <CheckIcon className="w-6 h-6 text-white" />
                </div>
                <p className="text-base font-semibold text-green-800">Cargado</p>
                <div className="w-full mt-4">
                    <button onClick={handleClick} className="w-full border border-gray-300 bg-white rounded-lg py-2 px-4 text-center hover:bg-gray-50 transition-colors flex items-center justify-center">
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2 text-gray-600"/>
                        <span className="text-sm font-semibold text-gray-700">Cambiar archivo</span>
                    </button>
                    <p className="text-xs text-gray-500 mt-2 truncate h-4" title={fileName}>{fileName}</p>
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleLocalFileChange}
                        onClick={(event) => { (event.target as HTMLInputElement).value = '' }}
                    />
                </div>
            </div>
        );
    }
    
    if (status === 'loading') {
        return (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 text-center flex flex-col items-center justify-center h-full min-h-[160px]">
                 <div className="animate-spin w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500"></div>
                 <p className="text-base font-semibold text-blue-800 mt-3">Cargando...</p>
            </div>
        );
    }

    const isError = status === 'error';
    return (
        <div 
            onClick={handleClick} 
            className={`border rounded-lg p-3 text-center cursor-pointer transition-colors flex flex-col items-center justify-center h-full min-h-[160px] ${isError ? 'border-red-300 bg-red-50 hover:border-red-400' : 'border-gray-200 bg-green-50/20 hover:border-blue-400 hover:bg-gray-50'}`}
        >
            <ArrowUpTrayIcon className={`h-10 w-10 mx-auto ${isError ? 'text-red-400' : 'text-gray-400'}`}/>
            <p className={`mt-2 font-semibold ${isError ? 'text-red-700' : 'text-gray-600'}`}>
                {isError ? 'Error al Cargar' : 'Archivo Validación'}
            </p>
            <p className={`text-xs ${isError ? 'text-red-500' : 'text-gray-500'} mt-1`}>
                {isError ? 'Intente de nuevo.' : 'Haga clic para seleccionar archivo'}
            </p>
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleLocalFileChange}
                onClick={(event) => { (event.target as HTMLInputElement).value = '' }}
            />
        </div>
    );
};


const ValidacionStep: React.FC = () => {
    const context = useContext(AppContext);
    
    if (!context) return <div>Loading context...</div>;
    const { appState, showLoading, hideLoading, showError, updateAppState } = context;
    const { validationResult } = appState;

    const allBaseFilesLoaded = !!(appState.files.auxiliar && appState.files.compras && appState.files.ventas && appState.files.dian);
    const validationFileLoaded = !!appState.files.validacion;

    const handleFileChange = async (fileType: FileType, file: File) => {
        if (fileType !== 'validacion') return;

        updateAppState({
            fileUploadStatus: {
                ...appState.fileUploadStatus,
                [fileType]: { status: 'loading', name: file.name }
            }
        });
        showLoading(`Procesando ${file.name}...`);
        
        try {
            const rawData = await parseExcelFile(file);
            const processedData = processValidation(rawData);

            const updatePayload: Partial<AppState> = {
                files: {
                    ...appState.files,
                    [fileType]: processedData
                },
                fileUploadStatus: {
                    ...appState.fileUploadStatus,
                    [fileType]: { status: 'success', name: file.name }
                }
            };
            
            updateAppState(updatePayload);

        } catch (error) {
            const errorMessage = error instanceof Error ? `Error al procesar: ${error.message}` : String(error);
            showError(`Error en ${file.name}: ${errorMessage}`);
            updateAppState({
                fileUploadStatus: {
                    ...appState.fileUploadStatus,
                    [fileType]: { status: 'error', name: file.name }
                }
            });
        } finally {
            hideLoading();
        }
    };

    const handleExportNits = () => {
        showLoading("Exportando NITs...");
        try {
            const nitSet = new Set<string>();
            appState.allNits.forEach((_, nit) => {
                if (nit) nitSet.add(nit);
            });
            const dataToExport = [["NIT"], ...Array.from(nitSet).map(nit => [nit])];
            const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "NITs_Para_Validar");
            XLSX.writeFile(workbook, "NITs_Para_Validar.xlsx");
        } catch (error) {
            showError(error instanceof Error ? error.message : "Error al exportar NITs");
        } finally {
            hideLoading();
        }
    };

    const handleGenerateReport = () => {
        showLoading("Generando reporte de validación...");
        try {
            if (!appState.allNits || !appState.files.validacion) {
                throw new Error("Faltan datos de NITs o archivo de validación.");
            }
            const validationData = appState.files.validacion;
            const result: ValidationResult = {
                inactivos: [],
                noEncontrados: [],
                conErrorNombre: [],
                activos: 0,
            };
            const normalizeText = (t:string) => t.toLowerCase().replace(/\s+/g, ' ').trim();

            appState.allNits.forEach((nombreWO, nit) => {
                const cleanNit = nit.replace(/\D/g, '');
                if (validationData.has(cleanNit)) {
                    const data = validationData.get(cleanNit)!;
                    if (normalizeText(data.estado) !== 'registrado en la dian' && normalizeText(data.estado) !== 'activo') {
                        result.inactivos.push({ nit, nombreWO, data });
                    } else {
                        result.activos++;
                        if (normalizeText(nombreWO) !== normalizeText(data.nombreValidado)) {
                            result.conErrorNombre.push({ nit, nombreWO, data });
                        }
                    }
                } else {
                    result.noEncontrados.push({ nit, nombreWO });
                }
            });
            updateAppState({ validationResult: result });
        } catch (error) {
            showError(error instanceof Error ? error.message : "Error al generar reporte");
        } finally {
            hideLoading();
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-6 border-b pb-3">Validación de Terceros</h2>
            <div className="flex flex-col gap-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Pasos de Validación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        <div className="flex flex-col justify-between">
                            <p className="font-medium text-gray-700">1. Exportar NITs Únicos</p>
                            <p className="text-sm text-gray-600 mt-1">Reúna todos los NITs de los 4 archivos en un solo Excel.</p>
                            <button onClick={handleExportNits} disabled={!allBaseFilesLoaded} className="mt-2 bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md text-sm hover:bg-slate-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                Exportar NITs (.xlsx)
                            </button>
                        </div>
                        <div>
                            <p className="font-medium text-gray-700">2. Importar Archivo Validado</p>
                            <p className="text-sm text-gray-600 mt-1">Cargue el archivo de Excel con el estado de los NITs.</p>
                             <div className="mt-2 h-full">
                                <ValidationUploadArea
                                    fileType="validacion"
                                    status={appState.fileUploadStatus.validacion.status}
                                    fileName={appState.fileUploadStatus.validacion.name}
                                    onFileChange={handleFileChange}
                                />
                             </div>
                        </div>
                        <div className="flex flex-col justify-between">
                            <p className="font-medium text-gray-700">3. Generar Reporte</p>
                            <p className="text-sm text-gray-600 mt-1">Compare los NITs para encontrar discrepancias.</p>
                            <button onClick={handleGenerateReport} disabled={!allBaseFilesLoaded || !validationFileLoaded} className="mt-2 bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md text-sm hover:bg-slate-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                Generar Reporte
                            </button>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Resultados de la Validación</h3>
                    <div className="border rounded-lg p-4 bg-gray-50 min-h-[450px] flex flex-col">
                        {validationResult ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <ResultsCard title="Registrados" count={validationResult.activos} color="green" />
                                    <ResultsCard title="No Registrados" count={validationResult.inactivos.length} color="red" />
                                    <ResultsCard title="No Encontrados" count={validationResult.noEncontrados.length} color="yellow" />
                                    <ResultsCard title="Diferencia Nombre" count={validationResult.conErrorNombre.length} color="blue" />
                                </div>
                                <DetailTable 
                                    title="Terceros No Registrados en DIAN"
                                    data={validationResult.inactivos}
                                    columns={[
                                        { header: 'NIT', key: 'nit' },
                                        { header: 'Nombre (WO)', key: 'nombreWO' },
                                        { header: 'Estado (DIAN)', key: 'estado', render: (item) => item.data.estado },
                                    ]}
                                />
                                <DetailTable 
                                    title="Terceros con Diferencia de Nombre"
                                    data={validationResult.conErrorNombre}
                                    columns={[
                                        { header: 'NIT', key: 'nit' },
                                        { header: 'Nombre (WO)', key: 'nombreWO' },
                                        { header: 'Nombre (DIAN)', key: 'nombreValidado', render: (item) => item.data.nombreValidado },
                                    ]}
                                />
                                <DetailTable 
                                    title="Terceros No Encontrados en Archivo DIAN"
                                    data={validationResult.noEncontrados}
                                    columns={[
                                        { header: 'NIT', key: 'nit' },
                                        { header: 'Nombre (WO)', key: 'nombreWO' },
                                    ]}
                                />
                            </div>
                        ) : (
                            <div className="flex-grow flex items-center justify-center">
                                <p className="text-gray-500 text-center italic">Los resultados de la validación aparecerán aquí después de generar el reporte.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ValidacionStep;