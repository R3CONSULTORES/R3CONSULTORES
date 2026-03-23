
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import type { Client, VatCategory, IvaDescontableCategory } from '@/dashboard/types';

const IVA_DESCONTABLE_CATEGORY_LABELS: Record<IvaDescontableCategory, string> = {
    'no_clasificado_descontable': 'Sin Clasificar',
    'bienes_5': 'Por compras de bienes gravados a la tarifa del 5%',
    'bienes_g': 'Por compras de bienes gravados a la tarifa general',
    'servicios_5': 'Por compras de servicios gravados a la tarifa del 5%',
    'servicios_g': 'Por compras de servicios gravados a la tarifa general',
    'no_tener_en_cuenta': 'No tener en cuenta',
};

interface ConfiguracionProps {
    embedded?: boolean;
    defaultClientName?: string;
}

const Configuracion: React.FC<ConfiguracionProps> = ({ embedded, defaultClientName }) => {
    const context = useContext(AppContext);
    const [selectedClientId, setSelectedClientId] = useState<string>('');

    if (!context) return null;
    const { appState, saveClient } = context;
    const { clients } = appState;

    // Effect to set selected client based on default name from workspace
    useEffect(() => {
        if (defaultClientName && clients.length > 0) {
            const found = clients.find(c => 
                (c.razonSocial === defaultClientName) || (c.nombreCompleto === defaultClientName)
            );
            if (found) {
                setSelectedClientId(found.id);
            }
        }
    }, [defaultClientName, clients]);

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const handleClassificationChange = (accountType: 'income' | 'purchase', fullAccountName: string, category: VatCategory) => {
        if (!selectedClient) return;
        
        const accountCode = fullAccountName.split(' ')[0];

        const updatedConfig = {
            ...selectedClient.configuracionIva,
            income: { ...selectedClient.configuracionIva?.income },
            purchase: { ...selectedClient.configuracionIva?.purchase },
        };
        
        if (accountType === 'income') {
            if (category === 'no_clasificado') {
                delete updatedConfig.income[accountCode];
            } else {
                updatedConfig.income[accountCode] = category;
            }
        } else { // purchase
            if (category === 'no_clasificado') {
                delete updatedConfig.purchase[accountCode];
            } else {
                updatedConfig.purchase[accountCode] = category;
            }
        }

        const clientToSave: Partial<Client> = {
            id: selectedClient.id,
            configuracionIva: updatedConfig
        };

        saveClient(clientToSave);
    };

    const handleIvaDescontableClassificationChange = (fullAccountName: string, category: IvaDescontableCategory) => {
        if (!selectedClient) return;

        const updatedConfig = {
            ...selectedClient.configuracionIva,
            ivaDescontable: { ...selectedClient.configuracionIva?.ivaDescontable },
        };
        
        if (category === 'no_clasificado_descontable') {
            delete updatedConfig.ivaDescontable![fullAccountName];
        } else {
            updatedConfig.ivaDescontable![fullAccountName] = category;
        }

        const clientToSave: Partial<Client> = {
            id: selectedClient.id,
            configuracionIva: updatedConfig
        };

        saveClient(clientToSave);
    };


    const renderAccountList = (title: string, accounts: string[] | undefined, type: 'income' | 'purchase') => {
        if (!accounts || accounts.length === 0) {
            return <p className="text-sm text-slate-500 italic mt-4">No hay cuentas de {title.toLowerCase()} conocidas para este cliente. Suba un archivo 'Auxiliar General (IVA)' en el módulo de IVA para poblarlas.</p>;
        }
        return (
            <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
                <div className="border rounded-lg max-h-96 overflow-y-auto shadow-sm">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                            <tr>
                                <th className="py-2 px-3 text-left font-medium text-slate-600 w-2/3">Cuenta</th>
                                <th className="py-2 px-3 text-left font-medium text-slate-600 w-1/3">Clasificación Predeterminada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {accounts.map(account => {
                                const accountCode = account.split(' ')[0];
                                const currentCategory = (type === 'income' 
                                    ? selectedClient?.configuracionIva?.income?.[accountCode] 
                                    : selectedClient?.configuracionIva?.purchase?.[accountCode]) || 'no_clasificado';
                                
                                return (
                                    <tr key={account} className="hover:bg-slate-50">
                                        <td className="p-2 px-3 text-slate-800">{account}</td>
                                        <td className="p-2 px-3">
                                            <select
                                                value={currentCategory}
                                                onChange={(e) => handleClassificationChange(type, account, e.target.value as VatCategory)}
                                                className="w-full p-1 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
                                            >
                                                <option value="no_clasificado">No Clasificado</option>
                                                <option value="gravado">Gravado</option>
                                                <option value="exento">Exento</option>
                                                <option value="excluido">Excluido</option>
                                                <option value="no_gravado">No Gravado</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderIvaDescontableList = (title: string, accounts: string[] | undefined) => {
         if (!accounts || accounts.length === 0) {
            return <p className="text-sm text-slate-500 italic mt-4">No hay cuentas de {title.toLowerCase()} conocidas para este cliente. Suba un archivo 'Auxiliar General (IVA)' en el módulo de IVA para poblarlas.</p>;
        }
        return (
             <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
                <div className="border rounded-lg max-h-[50vh] overflow-y-auto shadow-sm">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                            <tr>
                                <th className="py-2 px-3 text-left font-medium text-slate-600 w-2/3">Cuenta</th>
                                <th className="py-2 px-3 text-left font-medium text-slate-600 w-1/3">Clasificación para F-300</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {accounts.map(account => {
                                const currentCategory = selectedClient?.configuracionIva?.ivaDescontable?.[account] || 'no_clasificado_descontable';
                                return (
                                    <tr key={account} className="hover:bg-slate-50">
                                        <td className="p-2 px-3 text-slate-800">{account}</td>
                                        <td className="p-2 px-3">
                                             <select
                                                value={currentCategory}
                                                onChange={(e) => handleIvaDescontableClassificationChange(account, e.target.value as IvaDescontableCategory)}
                                                className="w-full p-1 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
                                            >
                                                {Object.entries(IVA_DESCONTABLE_CATEGORY_LABELS).map(([key, label]) => (
                                                    <option key={key} value={key}>{label}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <>
            {!embedded && (
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Configuración de Cuentas</h1>
                    <p className="text-slate-500 mt-1">Define clasificaciones de IVA predeterminadas para las cuentas de tus clientes.</p>
                </header>
            )}

            <div className="bg-white p-6 rounded-xl shadow-lg">
                {!embedded && (
                    <div className="mb-6 max-w-md">
                        <label htmlFor="client-select" className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Cliente</label>
                        <select
                            id="client-select"
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="">-- Seleccione un cliente --</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.razonSocial || client.nombreCompleto}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedClient ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {renderAccountList('Ingresos (Clase 4)', selectedClient.knownAccounts?.income, 'income')}
                            {renderAccountList('Compras y Gastos (Clase 1, 5, 6, 7)', selectedClient.knownAccounts?.purchase, 'purchase')}
                        </div>
                         <div className="mt-8">
                            {renderIvaDescontableList('IVA Descontable y Transitorio (Clase 2408)', selectedClient.knownAccounts?.iva)}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-lg">
                        <p className="text-slate-500">Seleccione un cliente para ver y editar la configuración de sus cuentas.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default Configuracion;
