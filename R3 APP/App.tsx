
import React, { useState, useCallback, useEffect } from 'react';
import type { Module, AppState, LoadingState, AppContextType, Client, Task, VatCategory, CompraVatCategory, IvaDescontableCategory, RevisionHistoryItem, SavedProyeccion } from './types';
import { AppContext } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import RevisionWorkspace from './views/RevisionWorkspace'; 
import Clients from './views/Clients';
import Tasks from './views/Tasks';
import Calendar from './views/Calendar';
import HistorialReview from './views/HistorialReview';
import LoadingModal from './components/LoadingModal';
import ErrorToast from './components/ErrorToast';
import { generateTaxTasksForClient } from './utils/taskGenerator';
import Configuracion from './views/Configuracion';
import { InfoIcon, EyeIcon, EyeSlashIcon } from './components/Icons';
import IvaReview from './views/IvaReview';
import Login from './views/Login';
import ProyeccionesPortfolio from './views/ProyeccionesPortfolio';

// --- Notification Toast Component ---
interface NotificationToastProps {
    message: string;
    onClose: () => void;
}
const NotificationToast: React.FC<NotificationToastProps> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 8000); // Auto-close after 8 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div 
            className="fixed bottom-5 right-5 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-2xl max-w-md z-50 transform transition-all duration-300 ease-out flex items-start space-x-4"
            role="alert"
            style={{ animation: 'toast-in 0.5s ease-out forwards' }}
        >
             <InfoIcon className="h-6 w-6 flex-shrink-0 text-amber-300" />
            <div>
                <strong className="font-bold">Notificación</strong>
                <span className="block text-sm">{message}</span>
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-white absolute top-1 right-1 p-1 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};


import { supabase } from '../src/lib/supabase';

const auth = supabase.auth;
const db = supabase;

// --- SPLASH SCREEN COMPONENT ---
const SplashScreen = () => (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center z-50 fixed inset-0">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-[#f6b034] rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500 font-medium animate-pulse">Cargando entorno...</p>
    </div>
);


const getInitialState = (): AppState => {
    return {
        razonSocial: '',
        periodo: 'Enero',
        tipoPeriodo: 'mensual',
        files: {
            auxiliar: null,
            compras: null,
            ventas: null,
            dian: null,
            validacion: null,
            retencion_base: null,
            iva_auxiliar: null,
            iva_dian: null,
            iva_ventas: null,
            iva_compras: null,
            retencion_auxiliar: null,
            retencion_compras: null,
            retencion_ventas: null,
        },
        fileUploadStatus: {
            auxiliar: { status: 'pending', name: '' },
            compras: { status: 'pending', name: '' },
            ventas: { status: 'pending', name: '' },
            dian: { status: 'pending', name: '' },
            validacion: { status: 'pending', name: '' },
            retencion_base: { status: 'pending', name: '' },
            iva_auxiliar: { status: 'pending', name: '' },
            iva_dian: { status: 'pending', name: '' },
            iva_ventas: { status: 'pending', name: '' },
            iva_compras: { status: 'pending', name: '' },
            retencion_auxiliar: { status: 'pending', name: '' },
            retencion_compras: { status: 'pending', name: '' },
            retencion_ventas: { status: 'pending', name: '' },
        },
        allNits: new Map<string, string>(),
        conciliacionResultados: null,
        analisisCuentas: null,
        resumenDiferencias: null,
        validationResult: null,
        retencionesResult: null,
        liquidacionSummary: null,
        liquidacionTarifaIng: 3.5,
        liquidacionAutorretencionSource: 'contable',
        conceptOverrides: new Map<string, string>(),
        transactionConceptOverrides: new Map<string, string>(),
        needsRegeneration: false,
        incomeAccountVatClassification: new Map<string, VatCategory>(),
        purchaseAccountVatClassification: new Map<string, VatCategory>(),
        ivaTransactionVatOverrides: new Map<string, VatCategory>(),
        ivaNeedsRecalculation: false,
        retencionesNeedsRecalculation: false,
        ivaLiquidationResult: null,
        comprasAccountVatClassification: new Map<string, CompraVatCategory>(),
        ivaIncomeComments: new Map<string, string>(),
        ivaDescontableClassification: new Map<string, IvaDescontableCategory>(),
        ivaPeriodo: 'Enero',
        ivaTipoPeriodo: 'mensual',
        ivaRevisionResult: null,
        coherenciaContableResult: null,
        clients: [],
        tasks: [],
        revisionHistory: [],
        savedProjections: [],
    };
};

const mapsAreEqual = (map1: Map<any, any>, map2: Map<any, any>): boolean => {
    if (map1.size !== map2.size) return false;
    for (const [key, val] of map1) {
        if (!map2.has(key) || map2.get(key) !== val) return false;
    }
    return true;
};

const App: React.FC = () => {
    const [activeModule, setActiveModule] = useState<Module>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [appState, setAppState] = useState<AppState>(getInitialState);
    const [loading, setLoading] = useState<LoadingState>({ isActive: false, message: '' });
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const { data: { subscription } } = auth.onAuthStateChanged((event, session) => {
            const user = session?.user || null;

            setUser(user);
            setAuthLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);

    const updateAppState = useCallback((newState: Partial<AppState>) => {
        setAppState(prev => ({ ...prev, ...newState }));
    }, []);

    // Effect to automatically load client configuration when razonSocial changes
    useEffect(() => {
        const { razonSocial, clients, incomeAccountVatClassification, purchaseAccountVatClassification, ivaDescontableClassification } = appState;

        if (razonSocial) {
            const client = clients.find(c => 
                (c.razonSocial || c.nombreCompleto) === razonSocial
            );

            if (client && client.configuracionIva) {
                // Client with config found, load it
                const incomeMap = new Map(Object.entries(client.configuracionIva.income || {}));
                const purchaseMap = new Map(Object.entries(client.configuracionIva.purchase || {}));
                const ivaDescontableMap = new Map(Object.entries(client.configuracionIva.ivaDescontable || {}));

                // Only update if there's a change to prevent re-renders
                if (
                    !mapsAreEqual(incomeAccountVatClassification, incomeMap) ||
                    !mapsAreEqual(purchaseAccountVatClassification, purchaseMap) ||
                    !mapsAreEqual(ivaDescontableClassification, ivaDescontableMap)
                ) {
                    updateAppState({
                        incomeAccountVatClassification: incomeMap,
                        purchaseAccountVatClassification: purchaseMap,
                        ivaDescontableClassification: ivaDescontableMap,
                    });
                }
            } else {
                // Client not found or has no config, reset classifications if they are not already empty
                if (
                    incomeAccountVatClassification.size > 0 ||
                    purchaseAccountVatClassification.size > 0 ||
                    ivaDescontableClassification.size > 0
                ) {
                    updateAppState({
                        incomeAccountVatClassification: new Map(),
                        purchaseAccountVatClassification: new Map(),
                        ivaDescontableClassification: new Map(),
                        // Also clear session-only classifications
                        comprasAccountVatClassification: new Map(),
                    });
                }
            }
        }
    }, [appState.razonSocial, appState.clients, updateAppState, appState.incomeAccountVatClassification, appState.purchaseAccountVatClassification, appState.ivaDescontableClassification]);


    const showError = useCallback((message: string) => {
        console.error(message);
        setError(message);
    }, []);

    const showNotification = useCallback((message: string) => {
        setNotification(message);
    }, []);

    const hideNotification = useCallback(() => {
        setNotification(null);
    }, []);

    const showLoading = useCallback((message: string) => {
        setLoading({ isActive: true, message });
    }, []);

    const hideLoading = useCallback(() => {
        setLoading({ isActive: false, message: '' });
    }, []);

    const syncTasksForClient = useCallback(async (client: Client) => {
        if (!client || !client.id) return;
        showLoading('Sincronizando vencimientos...');
        try {
            const requiredTasks = [
                ...generateTaxTasksForClient(client, 2024),
                ...generateTaxTasksForClient(client, 2025)
            ];

            const { data: existingDocs } = await db.from('app_tasks')
                .select('*')
                .eq('client_id', client.id)
                .eq('is_auto_generated', true);
            
            const existingTasks = new Map<string, Task>();
            if (existingDocs) {
                existingDocs.forEach((doc: any) => {
                    existingTasks.set(doc.id, { id: doc.id, ...doc } as Task);
                });
            }

            const requiredTaskIds = new Set(requiredTasks.map(t => t.deadlineId));

            // Upsert required tasks
            for (const task of requiredTasks) {
                if (task.deadlineId) {
                    await db.from('app_tasks').upsert({ id: task.deadlineId, ...task, client_id: client.id, is_auto_generated: true, user_id: user.id });
                }
            }

            // Delete obsolete tasks
            for (const existingId of existingTasks.keys()) {
                if (!requiredTaskIds.has(existingId)) {
                    await db.from('app_tasks').delete().eq('id', existingId);
                }
            }
        } catch (e: any) {
            showError("Error al sincronizar vencimientos: " + e.message);
        } finally {
            hideLoading();
        }
    }, [showError, showLoading, hideLoading]);

    useEffect(() => {
        if (!user) {
            updateAppState({ clients: [], tasks: [], revisionHistory: [], savedProjections: [] });
            return;
        }

        
        const fetchClients = async () => {
            const { data, error } = await db.from('app_clients').select('*');
            if (error) {
                showError("Error al cargar clients: " + error.message);
                return;
            }
            // Adapt data
            const adaptedData = data.map(doc => ({ ...doc, id: doc.id }));
            updateAppState({ clients: adaptedData });
        };

        fetchClients();

        const channelClients = db.channel('public:app_clients')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'app_clients' }, payload => {
                fetchClients(); // simple refetch on any change
            })
            .subscribe();


        
        const fetchTasks = async () => {
            const { data, error } = await db.from('app_tasks').select('*');
            if (error) {
                showError("Error al cargar tasks: " + error.message);
                return;
            }
            // Adapt data
            const adaptedData = data.map(doc => ({ ...doc, id: doc.id }));
            updateAppState({ tasks: adaptedData });
        };

        fetchTasks();

        const channelTasks = db.channel('public:app_tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'app_tasks' }, payload => {
                fetchTasks(); // simple refetch on any change
            })
            .subscribe();

        
        const historyUnsubscribe = db.collection('revisionHistory')
            .where('userId', '==', user.id)
            .orderBy('createdAt', 'desc')
            .orderBy("id", 'desc')
            .onSnapshot((snapshot: any) => {
                const historyData = snapshot.docs.map((doc: any) => {
                    const data = doc.data();
                    return {
                        ...data,
                        id: doc.id,
                        createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
                    };
                });
                updateAppState({ revisionHistory: historyData });
            }, (err: any) => showError("Error al cargar historial: " + err.message));

        const projectionsUnsubscribe = db.collection('projections')
            .where('userId', '==', user.id)
            .orderBy('createdAt', 'desc')
            .orderBy("id", 'desc')
            .onSnapshot((snapshot: any) => {
                const projectionsData = snapshot.docs.map((doc: any) => {
                    const data = doc.data();
                    return {
                        ...data,
                        id: doc.id,
                        createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
                    };
                });
                updateAppState({ savedProjections: projectionsData });
            }, (err: any) => showError("Error al cargar proyecciones: " + err.message));


        return () => {
            db.removeChannel(channelClients);
            db.removeChannel(channelTasks);
            db.removeChannel(channelRevisionHistory);
            db.removeChannel(channelProjections);
        };
    }, [user, updateAppState, showError]);

    const hideError = useCallback(() => {
        setError(null);
    }, []);

    const saveClient = useCallback(async (clientData: Partial<Client>) => {
        if (!user) return;
        const clientId = clientData.id;

        try {
            showLoading('Guardando cliente...');
            let savedClient: Client;

            // Adapt to camel case in standard TS object, but save to snake as needed or just save.
            // But wait, the table uses snake_case and UUIDs.
            let savedClient: any;
            if (clientId) {
                const { id, userId, ...dataToUpdate } = clientData;
                const { data, error } = await db.from('app_clients').update(dataToUpdate).eq('id', clientId).select().single();
                if (error) throw error;
                savedClient = data;
            } else {
                const { id, ...dataToCreate } = clientData;
                const { data, error } = await db.from('app_clients').insert({ ...dataToCreate, user_id: user.id }).select().single();
                if (error) throw error;
                savedClient = data;
            }
            
            await syncTasksForClient(savedClient);

        } catch (e: any) {
            showError("Error al guardar cliente: " + e.message);
        } finally {
            hideLoading();
        }
    }, [user, appState.clients, showError, showLoading, hideLoading, syncTasksForClient]);
    
    const deleteClient = useCallback(async (clientId: string) => {
        if (!user) return;
        try {
            showLoading('Eliminando cliente y tareas asociadas...');
            await db.from('app_clients').delete().eq('id', clientId);
            await db.from('app_tasks').delete().eq('client_id', clientId);
        } catch (e: any) {
            showError("Error al eliminar cliente: " + e.message);
        } finally {
            hideLoading();
        }
    }, [user, showError, showLoading, hideLoading]);

    const saveTask = useCallback(async (taskToSave: Task) => {
        if (!user) return;
        const taskId = taskToSave.id;
        const isNew = !taskId || taskId.startsWith('new_');

        try {
            showLoading('Guardando tarea...');
            if (isNew) {
                const { id, userId, ...dataToCreate } = taskToSave;
                await db.collection('tasks').add({ ...dataToCreate, userId: user.id, isAutoGenerated: false });
            } else {
                const { id, userId, ...dataToUpdate } = taskToSave;
                await db.collection('tasks').doc(taskId).update(dataToUpdate);
            }
        } catch(e: any) {
            showError("Error al guardar tarea: " + e.message);
        } finally {
            hideLoading();
        }
    }, [user, showError, showLoading, hideLoading]);

    const deleteTask = useCallback(async (taskId: string) => {
        if (!user) return;
        try {
            showLoading('Eliminando tarea...');
            await db.from('app_tasks').delete().eq('id', taskId);
        } catch (e: any) {
            showError("Error al eliminar tarea: " + e.message);
        } finally {
            hideLoading();
        }
    }, [user, showError, showLoading, hideLoading]);

    const saveRevision = useCallback(async () => {
        if (!user) return;
        showLoading('Guardando cierre de revisión...');
        try {
            const { 
                razonSocial, periodo, conciliacionResultados, resumenDiferencias, analisisCuentas, 
                validationResult, retencionesResult, ivaRevisionResult, coherenciaContableResult, 
                revisionHistory,
                ivaLiquidationResult, // New: capture liquidation data
                incomeAccountVatClassification, purchaseAccountVatClassification, 
                ivaTransactionVatOverrides, comprasAccountVatClassification, 
                ivaDescontableClassification, ivaIncomeComments
            } = appState;
            
            const basePeriodo = periodo;
            const existingRevisionsForPeriod = revisionHistory.filter(
                r => r.clientName === razonSocial && r.periodo === basePeriodo
            );
            
            const versionCount = existingRevisionsForPeriod.length;
            const revisionName = versionCount > 0 ? `${basePeriodo} - v${versionCount + 1}` : basePeriodo;

            // Helper to convert Map to Object for storage
            const mapToObj = (map: Map<any, any>) => Object.fromEntries(map);

            const revision: Omit<RevisionHistoryItem, 'id'> = {
                userId: user.id,
                revisionName: revisionName,
                clientName: razonSocial,
                periodo: basePeriodo,
                createdAt: new Date().toISOString(),
                results: {
                    conciliacionResultados,
                    resumenDiferencias,
                    analisisCuentas,
                    validationResult,
                    retencionesResult,
                    ivaRevisionResult,
                    coherenciaContableResult,
                    ivaLiquidationResult, // Save the calculated liquidation result
                    ivaState: {
                        // Save configuration and state maps as objects
                        incomeAccountVatClassification: mapToObj(incomeAccountVatClassification),
                        purchaseAccountVatClassification: mapToObj(purchaseAccountVatClassification),
                        ivaTransactionVatOverrides: mapToObj(ivaTransactionVatOverrides),
                        comprasAccountVatClassification: mapToObj(comprasAccountVatClassification),
                        ivaDescontableClassification: mapToObj(ivaDescontableClassification),
                        ivaIncomeComments: mapToObj(ivaIncomeComments)
                    }
                }
            };
            const { error } = await db.from('app_revisions').insert({ ...revision, user_id: user.id }); if (error) throw error;

        } catch (e: any) {
            showError("Error al guardar la revisión: " + e.message);
        } finally {
            hideLoading();
        }
    }, [user, appState, showError, showLoading, hideLoading]);
    
    const deleteRevision = useCallback(async (revisionId: string) => {
        if (!user) return;
        showLoading('Eliminando revisión...');
        try {
            await db.from('app_revisions').delete().eq('id', revisionId);
        } catch (e: any) {
            showError("Error al eliminar la revisión: " + e.message);
        } finally {
            hideLoading();
        }
    }, [user, showError, showLoading, hideLoading]);

    const saveProyeccion = useCallback(async (proyeccionData: Omit<SavedProyeccion, 'id'|'userId'|'createdAt'>) => {
        if (!user) return;
        showLoading('Guardando proyección...');
        try {
            const projectionToSave = {
                ...proyeccionData,
                userId: user.id,
                createdAt: new Date().toISOString(),
            };
            const { error } = await db.from('app_projections').insert({ ...projectionToSave, user_id: user.id }); if (error) throw error;
        } catch (e: any) {
            showError("Error al guardar la proyección: " + e.message);
        } finally {
            hideLoading();
        }
    }, [user, showError, showLoading, hideLoading]);
    
    const updateProyeccion = useCallback(async (id: string, data: Partial<SavedProyeccion>) => {
        if (!user) return;
        showLoading('Actualizando proyección...');
        try {
            // Remove undefined fields before update to avoid Firestore errors
             const cleanData = JSON.parse(JSON.stringify(data));
             const { error } = await db.from('app_projections').update(cleanData).eq('id', id); if (error) throw error;
        } catch (e: any) {
             showError("Error al actualizar la proyección: " + e.message);
        } finally {
            hideLoading();
        }
    }, [user, showError, showLoading, hideLoading]);

    const deleteProyeccion = useCallback(async (proyeccionId: string) => {
        if (!user) return;
        showLoading('Eliminando proyección...');
        try {
            await db.from('app_projections').delete().eq('id', proyeccionId);
        } catch (e: any) {
            showError("Error al eliminar la proyección: " + e.message);
        } finally {
            hideLoading();
        }
    }, [user, showError, showLoading, hideLoading]);

    const startRevisionFromTask = useCallback((task: Task) => {
        const client = appState.clients.find(c => c.id === task.clientId);
        if (!client) {
            showError("No se pudo encontrar el cliente para esta tarea.");
            return;
        }

        const match = task.title.match(/\(([^)]+)\)/);
        if (!match) {
            showError("El título de la tarea no tiene un formato de período válido (Ej: 'Revisión (Ene 2024)').");
            return;
        }
        
        const [shortMonth, year] = match[1].split(' ');
        
        const shortMonthToLong: Record<string, string> = {
            'Ene': 'Enero', 'Feb': 'Febrero', 'Mar': 'Marzo', 'Abr': 'Abril', 'May': 'Mayo', 'Jun': 'Junio',
            'Jul': 'Julio', 'Ago': 'Agosto', 'Sep': 'Septiembre', 'Oct': 'Octubre', 'Nov': 'Noviembre', 'Dic': 'Diciembre'
        };
        const longMonth = shortMonthToLong[shortMonth];

        if (!longMonth) {
            showError(`Mes '${shortMonth}' no reconocido en el título de la tarea.`);
            return;
        }

        const clientName = client.tipoPersona === 'Persona Jurídica' ? client.razonSocial : client.nombreCompleto;
        
        // Reset the state for the reconciliation tool but keep user/clients/tasks
        const initialState = getInitialState();
        const newState: Partial<AppState> = {
            ...initialState,
            razonSocial: clientName || '',
            periodo: longMonth,
            // Keep existing clients and tasks
            clients: appState.clients,
            tasks: appState.tasks,
            revisionHistory: appState.revisionHistory,
        };

        updateAppState(newState);
        setActiveModule('contable');
    }, [appState.clients, updateAppState, showError]);

    const startRetencionesFromTask = useCallback((task: Task) => {
        const client = appState.clients.find(c => c.id === task.clientId);
        if (!client) {
            showError("No se pudo encontrar el cliente para esta tarea.");
            return;
        }

        const match = task.title.match(/\(([^)]+)\)/);
        if (!match) {
            showError("El título de la tarea no tiene un formato de período válido (Ej: 'ReteFuente (Ene 2024)').");
            return;
        }
        
        const [shortMonth, year] = match[1].split(' ');
        
        const shortMonthToLong: Record<string, string> = {
            'Ene': 'Enero', 'Feb': 'Febrero', 'Mar': 'Marzo', 'Abr': 'Abril', 'May': 'Mayo', 'Jun': 'Junio',
            'Jul': 'Julio', 'Ago': 'Agosto', 'Sep': 'Septiembre', 'Oct': 'Octubre', 'Nov': 'Noviembre', 'Dic': 'Diciembre'
        };
        const longMonth = shortMonthToLong[shortMonth];
        
        if (!longMonth) {
            showError(`Mes '${shortMonth}' no reconocido en el título de la tarea.`);
            return;
        }

        const clientName = client.tipoPersona === 'Persona Jurídica' ? client.razonSocial : client.nombreCompleto;
        
        const initialState = getInitialState();
        const newState: Partial<AppState> = {
            ...initialState,
            razonSocial: clientName || '',
            periodo: longMonth,
            clients: appState.clients,
            tasks: appState.tasks,
            revisionHistory: appState.revisionHistory,
        };

        updateAppState(newState);
        setActiveModule('contable'); // Redirects to Revision Workspace which is now 'contable' key but renders workspace

    }, [appState.clients, updateAppState, showError]);

    const handleLogout = () => {
        auth.signOut();
        // Reset full app state
        setAppState(getInitialState());
    };

    if (authLoading) {
        return <SplashScreen />;
    }

    if (!user) {
        return <Login />;
    }

    return (
        <AppContext.Provider value={{
            appState,
            updateAppState,
            setActiveModule,
            startRevisionFromTask,
            startRetencionesFromTask,
            saveClient,
            deleteClient,
            saveTask,
            deleteTask,
            saveRevision,
            deleteRevision,
            saveProyeccion,
            updateProyeccion,
            deleteProyeccion,
            showLoading,
            hideLoading,
            showError,
            hideError,
            showNotification,
            hideNotification,
        }}>
            <div className="flex bg-slate-50 min-h-screen font-sans text-gray-900 animate-enter">
                <Sidebar
                    activeModule={activeModule}
                    setActiveModule={setActiveModule}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onLogout={handleLogout}
                />

                <main className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden w-full h-screen">
                    {/* Hamburger menu for mobile */}
                    <header className="lg:hidden flex items-center justify-between mb-6">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md bg-white shadow-sm border border-gray-200 text-gray-700">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <img 
                            src="https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/logo%20sin%20fondo%20a%20color%20(1).png?alt=media&token=8fa1dd4f-f59e-4b21-acfe-dbb78a9ca452" 
                            alt="Logo" 
                            className="h-8 w-auto object-contain" 
                        />
                        <div className="w-8"></div> {/* Spacer for centering */}
                    </header>
                    
                    {activeModule === 'dashboard' && <Dashboard />}
                    {activeModule === 'contable' && <RevisionWorkspace />}
                    {/* Redirect legacy keys to workspace if needed */}
                    {activeModule === 'iva' && <RevisionWorkspace />} 
                    {activeModule === 'retenciones' && <RevisionWorkspace />}
                    {activeModule === 'informe' && <RevisionWorkspace />} 
                    
                    {activeModule === 'clients' && <Clients />}
                    {activeModule === 'tasks' && <Tasks />}
                    {activeModule === 'calendar' && <Calendar />}
                    {activeModule === 'historial' && <HistorialReview />}
                    {activeModule === 'proyecciones-iva' && <IvaReview initialTab="proyecciones" />}
                    {activeModule === 'proyecciones-portfolio' && <ProyeccionesPortfolio />}
                    {activeModule === 'configuracion' && <Configuracion />}
                </main>

                {loading.isActive && <LoadingModal message={loading.message} />}
                {error && <ErrorToast message={error} onClose={hideError} />}
                {notification && <NotificationToast message={notification} onClose={hideNotification} />}
            </div>
        </AppContext.Provider>
    );
};

export default App;
