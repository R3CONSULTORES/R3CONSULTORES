
import React, { useState, useContext, useMemo, useRef } from 'react';
import { AppContext } from '../contexts/AppContext';
import { SearchIcon, PlusIcon, EditIcon, DeleteIcon, CopyIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon, CheckIcon, ArrowUpTrayIcon } from '../components/Icons';
import AddClientModal from '../components/AddClientModal';
import type { Client, Ciiu } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { ciiuData } from '../data/ciiuData';
import { calcularDV } from '../utils/parsing';


const InfoField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <p className="text-sm font-bold text-slate-800">{label}:</p>
        <div className="text-sm text-slate-600 mt-1">{children}</div>
    </div>
);

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            className="ml-2 p-1 rounded-md hover:bg-slate-200 transition-colors"
            title={`Copiar ${textToCopy}`}
        >
            {copied ? <CheckIcon className="w-4 h-4 text-green-600" /> : <CopyIcon />}
        </button>
    );
};

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (e: React.MouseEvent) => void }> = ({ checked, onChange }) => (
    <button
        onClick={onChange}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-slate-800' : 'bg-gray-300'}`}
    >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

const ClientCard: React.FC<{ client: Client, onEdit: (client: Client) => void, onDelete: (client: Client) => void, onStatusChange: (client: Client, newStatus: Client['status']) => void }> = ({ client, onEdit, onDelete, onStatusChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const handleStatusChange = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = client.status === 'Activo' ? 'Inactivo' : 'Activo';
        onStatusChange(client, newStatus);
    };
    
    const displayName = client.tipoPersona === 'Persona Jurídica' ? client.razonSocial : client.nombreCompleto;
    const displayId = client.tipoPersona === 'Persona Jurídica' ? client.nit : client.cedula;
    const displayIdWithDv = `${displayId}-${client.tipoPersona === 'Persona Jurídica' ? client.nitDv : client.cedulaDv}`;


    return (
        <div className={`bg-white rounded-lg shadow-md border border-slate-200 transition-all duration-300 ${client.status === 'Inactivo' ? 'opacity-60 bg-slate-50' : ''}`}>
            {/* Card Header */}
            <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{displayName}</h2>
                    <p className="text-sm text-slate-500">C.C/NIT: {displayId}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(client); }} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="Editar">
                        <EditIcon />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(client); }} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors" title="Eliminar">
                        <DeleteIcon />
                    </button>
                    <button
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title={isExpanded ? "Contraer" : "Expandir"}
                    >
                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </button>
                </div>
            </div>

            {/* Collapsible Body */}
            {isExpanded && (
                <div className="p-6 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        {/* Column 1 */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-bold text-slate-800">Estado: {client.status}</p>
                                <ToggleSwitch checked={client.status === 'Activo'} onChange={handleStatusChange} />
                            </div>
                            <InfoField label="Nombre/Razón Social">{displayName}</InfoField>
                            <InfoField label="Cédula/NIT">
                                <span className="inline-flex items-center bg-slate-100 px-2 py-0.5 rounded-md">
                                    {displayIdWithDv}
                                    <CopyButton textToCopy={displayId || ''} />
                                </span>
                            </InfoField>
                            <InfoField label="Dirección">{client.direccion}</InfoField>
                            <InfoField label="Ubicación">{`${client.municipio}, ${client.departamento}`}</InfoField>
                            <InfoField label="Tipo Contribuyente">{client.tipoContribuyente}</InfoField>
                            <InfoField label="Clave Portal">
                                <span className="inline-flex items-center bg-slate-100 px-2 py-0.5 rounded-md">
                                    {client.clavePortal}
                                    <CopyButton textToCopy={client.clavePortal} />
                                </span>
                            </InfoField>
                        </div>
                        {/* Column 2 */}
                        <div className="space-y-4">
                            <InfoField label="Emails">
                                <ul className="list-disc list-inside space-y-1">
                                    {client.emails.map(email => <li key={email}>{email}</li>)}
                                </ul>
                            </InfoField>
                            <InfoField label="Celulares">
                                <ul className="list-disc list-inside space-y-1">
                                    {client.celulares.map(phone => <li key={phone}>{phone}</li>)}
                                </ul>
                            </InfoField>
                            <InfoField label="Actividades Económicas (CIIU)">
                                <ul className="space-y-2">
                                    {client.ciiuCodes.map(act => (
                                        <li key={act.code}>
                                            <span className="font-semibold">{act.code}</span> - {act.description}
                                        </li>
                                    ))}
                                </ul>
                            </InfoField>
                        </div>
                        {/* Column 3 */}
                        <div className="space-y-4">
                            <InfoField label="Resp. Nacionales">
                                <ul className="list-disc list-inside space-y-1">
                                    {Object.entries(client.responsabilidadesNacionales).map(([key, value]) => {
                                        if (value) {
                                            const label = key.charAt(0).toUpperCase() + key.slice(1);
                                            const detail = typeof value === 'string' ? ` (${value})` : '';
                                            return <li key={key}>{label}{detail}</li>
                                        }
                                        return null;
                                    })}
                                </ul>
                            </InfoField>
                             <InfoField label="Otras Obligaciones">
                                <ul className="list-disc list-inside space-y-1">
                                   {client.otherObligations.revisionMensual && <li>Revisión Mensual</li>}
                                </ul>
                            </InfoField>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const Clients: React.FC = () => {
    const context = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Partial<Client> | null>(null);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!context) return <div>Cargando...</div>;
    const { appState, saveClient, deleteClient, showLoading, hideLoading, showError } = context;
    const { clients } = appState;

    const handleOpenAddModal = () => {
        setClientToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (client: Client) => {
        setClientToEdit(client);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setClientToEdit(null);
    };
    
    const handleSaveClient = (savedClientData: Partial<Client>) => {
        saveClient(savedClientData);
        handleCloseModal();
    };

    const handleDeleteRequest = (client: Client) => {
        setClientToDelete(client);
    };

    const handleConfirmDelete = () => {
        if (clientToDelete) {
            deleteClient(clientToDelete.id);
            setClientToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setClientToDelete(null);
    };
    
    const handleStatusChange = (clientToUpdate: Client, newStatus: Client['status']) => {
        saveClient({ id: clientToUpdate.id, status: newStatus });
    };

    const handleRutUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Verificación de API Key de forma segura
        const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
        if (!apiKey) {
            showError('La API Key no está configurada. No se puede utilizar la función de análisis de RUT.');
            if (e.target) e.target.value = '';
            return;
        }

        showLoading('Analizando RUT con IA...');
        try {
            const base64Data = await fileToBase64(file);
            const mimeType = file.type;

            const ai = new GoogleGenAI({ apiKey });
            
            const schema = {
                type: Type.OBJECT,
                properties: {
                    nit: { type: Type.STRING, description: "Número de NIT sin DV" },
                    dv: { type: Type.STRING, description: "Dígito de verificación (DV)" },
                    razonSocial: { type: Type.STRING, description: "Razón social EXACTA de la Casilla 35. Dejar vacío si no existe." },
                    nombres: { type: Type.STRING, description: "Concatenación de apellidos y nombres (Casillas 31, 32, 33, 34). Dejar vacío si es Persona Jurídica." },
                    tipoPersona: { type: Type.STRING, description: "Determinar estrictamente: Si Casilla 35 tiene datos -> 'Persona Jurídica'. Si Casillas 31-34 tienen datos -> 'Persona Natural'." },
                    direccion: { type: Type.STRING, description: "Dirección principal completa (Casilla 41)" },
                    departamento: { type: Type.STRING },
                    municipio: { type: Type.STRING },
                    email: { type: Type.STRING, description: "Correo electrónico de la casilla 42" },
                    telefonos: {
                        type: Type.ARRAY,
                        description: "Lista de TODOS los números de teléfono o celular encontrados en el documento (Casillas 44 y 45). No omitir ninguno.",
                        items: { type: Type.STRING }
                    },
                    ciiuCodes: {
                        type: Type.ARRAY,
                        description: "Lista de TODOS los códigos CIIU numéricos de 4 dígitos encontrados en las casillas 46 (Principal), 48 (Secundaria) y 50 (Otras actividades).",
                        items: { type: Type.STRING }
                    },
                    responsabilidades: {
                        type: Type.ARRAY,
                        description: "Lista de TODOS los códigos numéricos encontrados en la Casilla 53 (Responsabilidades). Ej: '05', '07', '13', '14', '42', '48', '52'.",
                        items: { type: Type.STRING }
                    },
                    representanteLegalNombre: { type: Type.STRING, description: "Nombre del Representante Legal. Buscar obligatoriamente en la hoja 2 o sección de 'Representación' (Casilla 98), usualmente código 18." },
                    representanteLegalCedula: { type: Type.STRING, description: "Cédula del Representante Legal. Buscar obligatoriamente en la hoja 2 o sección de 'Representación' (Casilla 100)." }
                }
            };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { text: `
Analiza este RUT colombiano con precisión de auditor:

1. TIPO DE PERSONA (CRÍTICO):
   - SI la Casilla 35 (Razón Social) tiene texto: Es "Persona Jurídica". (Ignora nombres de personas en casillas 31-34 si la 35 está llena).
   - SI las Casillas 31, 32, 33, 34 tienen texto y la 35 está VACÍA: Es "Persona Natural".
   - Verifica también la Casilla 24 (Tipo de Contribuyente) si es visible.

2. REPRESENTANTE LEGAL (OBLIGATORIO PARA PJ):
   - Busca la sección de "Representación" (usualmente página 2, casilla 98 en adelante).
   - Extrae Nombre y Cédula de quien tenga código de representación 18 (Representante Legal Principal) o similar.

3. RESPONSABILIDADES (Casilla 53):
   - Extrae TODOS los códigos numéricos visibles (ej: 05, 07, 09, 13, 14, 42, 48, 52).

4. CONTACTO:
   - Extrae TODOS los teléfonos de las casillas 44 y 45.
                        ` },
                        { inlineData: { mimeType, data: base64Data } }
                    ]
                },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: schema
                }
            });

            const rutData = JSON.parse(response.text);
            const clientData = parseRutDataToClient(rutData);

            setClientToEdit(clientData);
            setIsModalOpen(true);

        } catch (error: any) {
            console.error("Error processing RUT:", error);
            let msg = 'Ocurrió un error inesperado al analizar el RUT.';
            if (error instanceof Error) {
                msg = error.message;
                if (msg.includes('400') || msg.includes('API key')) {
                    msg = 'Error de autenticación con la API de IA. Verifique que la API Key sea válida.';
                }
            }
            showError(msg);
        } finally {
            hideLoading();
            // Reset file input
            if (e.target) e.target.value = '';
        }
    };

    const parseRutDataToClient = (rutData: any): Partial<Client> => {
        const { nit, dv, razonSocial, nombres, tipoPersona, direccion, departamento, municipio, email, telefonos, ciiuCodes, responsabilidades, representanteLegalNombre, representanteLegalCedula } = rutData;

        // Logic to determine name and type based on extracted data priorities
        let finalTipoPersona = tipoPersona;
        let finalRazonSocial = razonSocial;
        let finalNombreCompleto = nombres;

        if (razonSocial && razonSocial.trim().length > 2) {
            finalTipoPersona = 'Persona Jurídica';
            finalNombreCompleto = razonSocial; // Fallback/Consistency
        } else if (nombres && nombres.trim().length > 2) {
            finalTipoPersona = 'Persona Natural';
            finalRazonSocial = ''; // Ensure no Reason Social for Natural
            finalNombreCompleto = nombres;
        }

        const clientData: Partial<Client> = {
            tipoPersona: finalTipoPersona,
            razonSocial: finalRazonSocial || '',
            nombreCompleto: finalNombreCompleto || '',
            nit: nit?.replace(/\D/g, '') || '',
            nitDv: dv || '',
            cedula: nit?.replace(/\D/g, '') || '',
            cedulaDv: dv || '',
            representanteLegal: representanteLegalNombre || '',
            cedulaRepLegal: representanteLegalCedula?.replace(/\D/g, '') || '',
            cedulaRepLegalDv: calcularDV(representanteLegalCedula?.replace(/\D/g, '') || ''),
            direccion: direccion || '',
            departamento: departamento || '',
            municipio: municipio || '',
            emails: email ? [email] : [''],
            celulares: (telefonos && Array.isArray(telefonos) && telefonos.length > 0) ? telefonos : [''],
            status: 'Activo',
            tipoContribuyente: 'Responsable de IVA', // Default fallback
            clavePortal: '',
        };

        const respNacionales = { iva: null as 'bimestral' | 'cuatrimestral' | null, consumo: false, rteFte: false, renta: false, exogenas: false };
        
        if (responsabilidades && Array.isArray(responsabilidades)) {
            const codes = new Set(responsabilidades.map(r => String(r).trim()));
            
            // 05: Imporrenta (Declaración de Renta)
            if (codes.has('05')) respNacionales.renta = true;
            
            // 07, 08, 09: Retenciones
            if (codes.has('07') || codes.has('08') || codes.has('09')) respNacionales.rteFte = true;
            
            // 14: Informante de Exógena
            if (codes.has('14') || codes.has('20')) respNacionales.exogenas = true;
            
            // 33: Impuesto Nacional al Consumo
            if (codes.has('33')) respNacionales.consumo = true;

            // 48: Impuesto sobre las ventas - IVA
            if (codes.has('48')) {
                // Default to Bimestral if confirmed, usually indicates responsibility
                respNacionales.iva = 'bimestral'; 
            }
            
            // 47: Régimen Simple de Tributación
            if (codes.has('47')) {
                clientData.tipoContribuyente = 'Régimen Simple';
            }
             // 13: Gran Contribuyente
            if (codes.has('13')) {
                clientData.tipoContribuyente = 'Gran Contribuyente';
            }
            // 13 + 15 (Autorretenedor) often imply GC Autorretenedor
            if (codes.has('13') && codes.has('15')) {
                clientData.tipoContribuyente = 'Gran Contribuyente autorretenedor';
            }
             // 52: Facturador Electrónico (Informative, implies commercial activity)
        }

        // Force Renta for PJ if not explicitly found (usually obligatory)
        if (clientData.tipoPersona === 'Persona Jurídica') {
            respNacionales.renta = true;
        }

        clientData.responsabilidadesNacionales = respNacionales;

        if (ciiuCodes && Array.isArray(ciiuCodes)) {
            // Filter out duplicates and map to Ciiu objects
            const uniqueCodes = Array.from(new Set(ciiuCodes));
            clientData.ciiuCodes = uniqueCodes
                .map((code: any) => String(code).trim())
                .filter(codeStr => /^\d{4}$/.test(codeStr)) // STRICTLY 4 digits
                .map(codeStr => {
                    const ciiuInfo = ciiuData.find(c => c.code === codeStr);
                    return ciiuInfo ? { code: ciiuInfo.code, description: ciiuInfo.description } : null;
                })
                .filter((item): item is Ciiu => item !== null);
        } else {
            clientData.ciiuCodes = [];
        }

        clientData.responsabilidadesMunicipales = { ica: [] };
        clientData.otherObligations = { revisionMensual: false };

        return clientData;
    };

    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        const lowerTerm = searchTerm.toLowerCase();
        return clients.filter(c => 
            (c.razonSocial && c.razonSocial.toLowerCase().includes(lowerTerm)) ||
            (c.nombreCompleto && c.nombreCompleto.toLowerCase().includes(lowerTerm)) ||
            (c.nit && c.nit.includes(lowerTerm)) ||
            (c.cedula && c.cedula.includes(lowerTerm))
        );
    }, [clients, searchTerm]);

    return (
        <>
            <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800">Gestión de Clientes</h1>
                    <p className="text-slate-500 mt-1">Administre la información tributaria y legal de sus clientes.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <input 
                            type="file" 
                            accept=".pdf,image/*" 
                            onChange={handleRutUpload} 
                            className="hidden" 
                            id="rut-upload"
                            ref={fileInputRef}
                        />
                        <label 
                            htmlFor="rut-upload" 
                            className="bg-white text-slate-700 border border-slate-300 font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-slate-50 transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                        >
                            <ArrowUpTrayIcon className="w-5 h-5 text-slate-500" />
                            Crear desde RUT
                        </label>
                    </div>
                    <button 
                        onClick={handleOpenAddModal}
                        className="bg-slate-900 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-200 flex items-center gap-2"
                    >
                        <PlusIcon />
                        Nuevo Cliente
                    </button>
                </div>
            </header>

            <div className="mb-6 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="text-slate-400" />
                </span>
                <input
                    type="text"
                    placeholder="Buscar por nombre, razón social o NIT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-amber-500 focus:border-amber-500 shadow-sm"
                />
                 {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <XMarkIcon className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                        <ClientCard 
                            key={client.id} 
                            client={client} 
                            onEdit={handleOpenEditModal} 
                            onDelete={handleDeleteRequest}
                            onStatusChange={handleStatusChange}
                        />
                    ))
                ) : (
                    <div className="text-center py-12">
                        <p className="text-slate-500 text-lg">No se encontraron clientes.</p>
                        <p className="text-slate-400 text-sm">Intente una nueva búsqueda o agregue un cliente nuevo.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <AddClientModal 
                    onClose={handleCloseModal} 
                    onSave={handleSaveClient} 
                    clientToEdit={clientToEdit} 
                />
            )}

            {clientToDelete && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm text-center">
                        <h3 className="text-lg font-bold text-slate-800">Confirmar Eliminación</h3>
                        <p className="my-4 text-slate-600">¿Está seguro que desea eliminar al cliente "{clientToDelete.nombreCompleto || clientToDelete.razonSocial}"? Esto eliminará también sus tareas asociadas.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={handleCancelDelete} className="px-6 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300">Cancelar</button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Clients;
