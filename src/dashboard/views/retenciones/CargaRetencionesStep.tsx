


import React, { useContext } from 'react';
import FileUploadCard from '@/dashboard/components/FileUploadCard';
import type { AppState, FileType, AuxiliarData, Client } from '@/dashboard/types';
import { AppContext } from '@/dashboard/contexts/AppContext';
import { processAuxiliar, processVentas, processCompras, processRetencionBase, parseExcelFile } from '@/dashboard/utils/parsing';

const CargaRetencionesStep: React.FC = () => {
    const context = useContext(AppContext);
    
    if (!context) {
        return <div>Loading context...</div>
    }
    const { showLoading, hideLoading, showError, updateAppState, appState, saveClient, showNotification } = context;
    const fileStates = appState.fileUploadStatus;

    const handleFileChange = async (fileType: FileType, file: File) => {
        updateAppState({
            fileUploadStatus: {
                ...appState.fileUploadStatus,
                [fileType]: { status: 'loading', name: file.name }
            }
        });
        showLoading(`Procesando ${file.name}...`);
        
        try {
            const rawData = await parseExcelFile(file);
            const updatePayload: Partial<AppState> = {};
            let processedData: any;

            switch (fileType) {
                case 'retencion_auxiliar': {
                    const { data, nits } = processAuxiliar(rawData, appState.allNits);
                    processedData = data;
                    updatePayload.allNits = nits;

                    const clientName = appState.razonSocial;
                    const client = appState.clients.find(c => (c.razonSocial || c.nombreCompleto) === clientName);

                    if (client && saveClient && showNotification) {
                        const allAccountNames = new Set<string>();
                        (processedData as AuxiliarData[]).forEach(row => {
                            if (row.Cuenta) allAccountNames.add(row.Cuenta);
                        });

                        const currentAccounts = {
                            income: Array.from(allAccountNames).filter(acc => acc.startsWith('4')).sort(),
                            purchase: Array.from(allAccountNames).filter(acc => ['1435', '5', '6', '7'].some(p => acc.startsWith(p))).sort(),
                            iva: Array.from(allAccountNames).filter(acc => acc.startsWith('240802') || acc.startsWith('240803')).sort()
                        };

                        // Compare against previously known accounts to detect truly new ones
                        const prevIncome = new Set(client.knownAccounts?.income || []);
                        const prevPurchase = new Set(client.knownAccounts?.purchase || []);
                        const prevIva = new Set(client.knownAccounts?.iva || []);

                        const hasNewIncome = currentAccounts.income.some(acc => !prevIncome.has(acc));
                        const hasNewPurchase = currentAccounts.purchase.some(acc => !prevPurchase.has(acc));
                        const hasNewIva = currentAccounts.iva.some(acc => !prevIva.has(acc));
                        
                        if (hasNewIncome || hasNewPurchase || hasNewIva) {
                            showNotification('Se detectaron cuentas nuevas. Por favor, clasifíquelas en la pestaña de Configuración para asegurar la precisión.');
                        }
                        
                        const clientToUpdate: Partial<Client> = { id: client.id, knownAccounts: currentAccounts };
                        await saveClient(clientToUpdate);
                    }
                    break;
                }
                case 'retencion_compras': {
                    const { data, nits } = processCompras(rawData, appState.allNits);
                    processedData = data;
                    updatePayload.allNits = nits;
                    break;
                }
                case 'retencion_ventas': {
                    const { data, nits } = processVentas(rawData, appState.allNits);
                    processedData = data;
                    updatePayload.allNits = nits;
                    break;
                }
                case 'retencion_base':
                    processedData = processRetencionBase(rawData).data;
                    break;
                default:
                    throw new Error("Tipo de archivo no soportado en este módulo.");
            }

            updatePayload.files = {
                ...appState.files,
                [fileType]: processedData
            };
            updatePayload.fileUploadStatus = {
                ...appState.fileUploadStatus,
                [fileType]: { status: 'success', name: file.name }
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

    const retencionFileTypes: FileType[] = ['retencion_auxiliar', 'retencion_compras', 'retencion_base', 'retencion_ventas'];

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Panel de Carga para Retenciones</h2>
            <p className="text-sm text-slate-600 mb-6 border-b border-slate-200 pb-4">Cargue los archivos necesarios para la auditoría y liquidación de retenciones.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {retencionFileTypes.map(type => (
                    <FileUploadCard
                        key={type}
                        fileType={type}
                        status={fileStates[type].status}
                        fileName={fileStates[type].name}
                        onFileChange={handleFileChange}
                    />
                ))}
            </div>
        </div>
    );
};

export default CargaRetencionesStep;
