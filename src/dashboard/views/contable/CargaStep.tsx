


import React, { useContext } from 'react';
import FileUploadCard from '@/dashboard/components/FileUploadCard';
import type { AppState, FileType, AuxiliarData, Client } from '@/dashboard/types';
import { AppContext } from '@/dashboard/contexts/AppContext';
import { processAuxiliar, processVentas, processCompras, processDian, parseExcelFile } from '@/dashboard/utils/parsing';


const CargaStep: React.FC = () => {
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
                case 'auxiliar': {
                    const auxResult = processAuxiliar(rawData, appState.allNits);
                    processedData = auxResult.data;
                    updatePayload.allNits = auxResult.nits;

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
                case 'ventas': {
                    const ventasResult = processVentas(rawData, appState.allNits);
                    processedData = ventasResult.data;
                    updatePayload.allNits = ventasResult.nits;
                    break;
                }
                case 'compras': {
                    const comprasResult = processCompras(rawData, appState.allNits);
                    processedData = comprasResult.data;
                    updatePayload.allNits = comprasResult.nits;
                    break;
                }
                case 'dian': {
                    const dianResult = processDian(rawData, appState.allNits);
                    processedData = dianResult.data;
                    updatePayload.allNits = dianResult.nits;
                    break;
                }
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


    const baseFileTypes: FileType[] = ['auxiliar', 'compras', 'ventas', 'dian'];

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Paso 1: Panel de Carga de Archivos</h2>
            <p className="text-sm text-slate-600 mb-6 border-b border-slate-200 pb-4">Cargue los 4 archivos principales para comenzar el análisis.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {baseFileTypes.map(type => (
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

export default CargaStep;
