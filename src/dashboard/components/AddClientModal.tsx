
import React, { useState, useMemo, useRef, useEffect, useContext } from 'react';
import { XMarkIcon, PlusIcon } from './Icons';
import { ciiuData } from '@/dashboard/data/ciiuData';
import { colombiaData } from '@/dashboard/data/colombiaData';
import type { Client, Ciiu } from '@/dashboard/types';
import { calcularDV } from '@/dashboard/utils/parsing';
import { AppContext } from '@/dashboard/contexts/AppContext';

interface AddClientModalProps {
    onClose: () => void;
    onSave: (client: Partial<Client>) => void;
    clientToEdit?: Partial<Client> | null;
}

const inputBaseClasses = "w-full px-3 py-2 border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm bg-white text-slate-900 placeholder-slate-400";

const toTitleCase = (str: string): string => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const CheckboxField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (isChecked: boolean) => void }) => (
    <div className="flex items-center">
        <input 
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500" />
        <label className="ml-2 text-sm text-slate-700">{label}</label>
    </div>
);


const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSave, clientToEdit }) => {
    const context = useContext(AppContext);
    const isEditing = !!clientToEdit?.id;
    
    const [formData, setFormData] = useState({
        tipoPersona: clientToEdit?.tipoPersona || 'Persona Jurídica',
        
        razonSocial: clientToEdit?.razonSocial || '',
        nit: clientToEdit?.nit || '',
        nitDv: clientToEdit?.nitDv || '',
        
        nombreCompleto: clientToEdit?.nombreCompleto || '',
        cedula: clientToEdit?.cedula || '',
        cedulaDv: clientToEdit?.cedulaDv || '',

        representanteLegal: clientToEdit?.representanteLegal || '',
        cedulaRepLegal: clientToEdit?.cedulaRepLegal || '',
        cedulaRepLegalDv: clientToEdit?.cedulaRepLegalDv || '',
        
        direccion: clientToEdit?.direccion || '',
        departamento: clientToEdit?.departamento || '',
        municipio: clientToEdit?.municipio || '',
        tipoContribuyente: clientToEdit?.tipoContribuyente || 'Responsable de IVA',
        clavePortal: clientToEdit?.clavePortal || '',
    });
    const [emails, setEmails] = useState(clientToEdit?.emails?.length ? clientToEdit.emails : ['']);
    const [celulares, setCelulares] = useState(clientToEdit?.celulares?.length ? clientToEdit.celulares : ['']);
    const [selectedCiius, setSelectedCiius] = useState<Ciiu[]>(clientToEdit?.ciiuCodes || []);
    const [ciiuSearch, setCiiuSearch] = useState('');
    const [ciiuResults, setCiiuResults] = useState<Ciiu[]>([]);
    const [isCiiuListOpen, setIsCiiuListOpen] = useState(false);
    const ciiuInputRef = useRef<HTMLDivElement>(null);
    
    const [responsabilidadesNacionales, setResponsabilidadesNacionales] = useState(
        clientToEdit?.responsabilidadesNacionales || { 
            iva: null, consumo: false, rteFte: false, renta: false, exogenas: false,
            gmf: false, impuestoPatrimonio: false, preciosTransferencia: false, gasolina: false, carbono: false, plasticos: false, bebidasUltraprocesadas: false,
            cuotasRenta: { cuota1: true, cuota2: true, cuota3: true }
        }
    );
     const [otherObligations, setOtherObligations] = useState(
        clientToEdit?.otherObligations || { revisionMensual: false }
    );
    const [responsabilidadesMunicipales, setResponsabilidadesMunicipales] = useState(
        clientToEdit?.responsabilidadesMunicipales || { ica: [] }
    );


    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            nitDv: calcularDV(prev.nit),
            cedulaDv: calcularDV(prev.cedula),
            cedulaRepLegalDv: calcularDV(prev.cedulaRepLegal)
        }));
    }, [clientToEdit]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ciiuInputRef.current && !ciiuInputRef.current.contains(event.target as Node)) {
                setIsCiiuListOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRazonSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const finalValue = name === 'razonSocial' ? value.toUpperCase() : toTitleCase(value);
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };
    
    const handleRepLegalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, representanteLegal: toTitleCase(e.target.value) }));
    };

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const cleanedValue = value.replace(/\D/g, '');
        const dv = calcularDV(cleanedValue);

        if (name === 'nit') {
            setFormData(prev => ({ ...prev, nit: cleanedValue, nitDv: dv }));
        } else if (name === 'cedula') {
             setFormData(prev => ({ ...prev, cedula: cleanedValue, cedulaDv: dv }));
        } else if (name === 'cedulaRepLegal') {
            setFormData(prev => ({ ...prev, cedulaRepLegal: cleanedValue, cedulaRepLegalDv: dv }));
        }
    };

    const handleDepartamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDepartamento = e.target.value;
        setFormData(prev => ({
            ...prev,
            departamento: newDepartamento,
            municipio: '' 
        }));
    };

    const municipios = useMemo(() => {
        return (formData.departamento && colombiaData[formData.departamento]) ? colombiaData[formData.departamento] : [];
    }, [formData.departamento]);
    
    const tipoContribuyenteOptions = ['Responsable de IVA', 'No responsable de IVA', 'Régimen Simple', 'Gran Contribuyente', 'Gran Contribuyente autorretenedor'];
    
    const handleDynamicListChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
        setter(prev => prev.map((item, i) => i === index ? value : item));
    };

    const addDynamicListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => [...prev, '']);
    };

    const removeDynamicListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
        setter(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : ['']);
    };

    const handleCiiuSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setCiiuSearch(query);
        if (query.length > 1) {
            const lowerQuery = query.toLowerCase();
            const results = ciiuData.filter(
                item => item.code.startsWith(lowerQuery) || item.description.toLowerCase().includes(lowerQuery)
            );
            setCiiuResults(results.slice(0, 7));
            setIsCiiuListOpen(true);
        } else {
            setCiiuResults([]);
            setIsCiiuListOpen(false);
        }
    };

    const handleSelectCiiu = (ciiu: Ciiu) => {
        if (!selectedCiius.some(c => c.code === ciiu.code)) {
            setSelectedCiius(prev => [...prev, ciiu]);
        }
        setCiiuSearch('');
        setCiiuResults([]);
        setIsCiiuListOpen(false);
    };

    const handleRemoveCiiu = (code: string) => {
        setSelectedCiius(prev => prev.filter(c => c.code !== code));
    };

    const handleResponsibilityChange = <K extends keyof typeof responsabilidadesNacionales>(key: K, value: typeof responsabilidadesNacionales[K]) => {
        setResponsabilidadesNacionales(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = () => {
        if (!formData.clavePortal || formData.clavePortal.trim() === '') {
            if (context?.showError) {
                context.showError("El campo 'Clave Portal' es obligatorio. Por favor, ingrese un valor.");
            } else {
                alert("El campo 'Clave Portal' es obligatorio. Por favor, ingrese un valor.");
            }
            return;
        }

        const clientData: Partial<Client> = {
            id: clientToEdit?.id,
            ...formData,
            emails: emails.filter(e => e.trim() !== ''),
            celulares: celulares.filter(c => c.trim() !== ''),
            ciiuCodes: selectedCiius,
            responsabilidadesNacionales,
            responsabilidadesMunicipales,
            otherObligations,
        };
        if (!isEditing) {
            clientData.status = 'Activo';
        }
        onSave(clientData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-4xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-5 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800">{isEditing ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Persona</label>
                            <select name="tipoPersona" value={formData.tipoPersona} onChange={handleInputChange} className={`${inputBaseClasses} border-slate-300`}>
                                <option>Persona Jurídica</option>
                                <option>Persona Natural</option>
                            </select>
                        </div>
                        <div></div> {/* Spacer */}
                        
                        {formData.tipoPersona === 'Persona Jurídica' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Razón Social</label>
                                    <input type="text" name="razonSocial" placeholder="Ej: MI EMPRESA S.A.S" value={formData.razonSocial} onChange={handleRazonSocialChange} className={`${inputBaseClasses} border-slate-300`} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">NIT</label>
                                    <div className="flex">
                                        <input type="text" name="nit" placeholder="900123456" value={formData.nit} onChange={handleIdChange} className={`${inputBaseClasses} rounded-r-none border-r-0 border-slate-300`} />
                                        <span className="inline-flex items-center px-3 border border-slate-300 bg-slate-50 text-slate-500 text-sm rounded-r-md">{formData.nitDv || 'DV'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Representante Legal</label>
                                    <input type="text" name="representanteLegal" placeholder="Ej: Juan Camilo Retamozo Pertuz" value={formData.representanteLegal} onChange={handleRepLegalChange} className={`${inputBaseClasses} border-slate-300`} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Cédula del Rep. Legal</label>
                                    <div className="flex">
                                        <input type="text" name="cedulaRepLegal" placeholder="1082123456" value={formData.cedulaRepLegal} onChange={handleIdChange} className={`${inputBaseClasses} rounded-r-none border-r-0 border-slate-300`} />
                                        <span className="inline-flex items-center px-3 border border-slate-300 bg-slate-50 text-slate-500 text-sm rounded-r-md">{formData.cedulaRepLegalDv || 'DV'}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                             <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Nombre Completo</label>
                                    <input type="text" name="nombreCompleto" placeholder="Ej: Juan Camilo Retamozo Pertuz" value={formData.nombreCompleto} onChange={handleRazonSocialChange} className={`${inputBaseClasses} border-slate-300`} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Cédula</label>
                                    <div className="flex">
                                        <input type="text" name="cedula" placeholder="1082123456" value={formData.cedula} onChange={handleIdChange} className={`${inputBaseClasses} rounded-r-none border-r-0 border-slate-300`} />
                                        <span className="inline-flex items-center px-3 border border-slate-300 bg-slate-50 text-slate-500 text-sm rounded-r-md">{formData.cedulaDv || 'DV'}</span>
                                    </div>
                                </div>
                            </>
                        )}


                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Dirección</label>
                             <input type="text" name="direccion" placeholder="Ej: Calle 100 # 20-30" value={formData.direccion} onChange={handleInputChange} className={`${inputBaseClasses} border-slate-300`} />
                        </div>
                       
                        <div>
                             <label className="block text-sm font-medium text-slate-600 mb-1">Departamento</label>
                             <input list="departamentos-list" name="departamento" placeholder="Escriba para buscar..." value={formData.departamento} onChange={handleDepartamentoChange} className={`${inputBaseClasses} border-slate-300`} />
                             <datalist id="departamentos-list">
                                {Object.keys(colombiaData).map(dep => <option key={dep} value={dep} />)}
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Municipio</label>
                            <input list="municipios-list" name="municipio" placeholder="Seleccione un departamento primero" value={formData.municipio} onChange={handleInputChange} disabled={municipios.length === 0} className={`${inputBaseClasses} disabled:bg-slate-100 disabled:cursor-not-allowed border-slate-300`} />
                            <datalist id="municipios-list">
                                {municipios.map(mun => <option key={mun} value={mun} />)}
                            </datalist>
                        </div>
                        
                        <div>
                           <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Contribuyente</label>
                           <select name="tipoContribuyente" value={formData.tipoContribuyente} onChange={handleInputChange} className={`${inputBaseClasses} border-slate-300`}>
                               {tipoContribuyenteOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                           </select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-600">E-mail(s)</label>
                            {emails.map((email, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => handleDynamicListChange(setEmails, index, e.target.value)} className={`${inputBaseClasses} border-slate-300`} />
                                    {emails.length > 1 && <button type="button" onClick={() => removeDynamicListItem(setEmails, index)} className="p-1 text-red-500 hover:text-red-700"><XMarkIcon /></button>}
                                </div>
                            ))}
                            <button type="button" onClick={() => addDynamicListItem(setEmails)} className="text-sm text-slate-800 font-semibold hover:text-amber-600 flex items-center gap-1"><PlusIcon className="w-4 h-4" />Agregar nuevo</button>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-600">Celular(es)</label>
                            {celulares.map((celular, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input type="tel" placeholder="3001234567" value={celular} onChange={(e) => handleDynamicListChange(setCelulares, index, e.target.value)} className={`${inputBaseClasses} border-slate-300`} />
                                    {celulares.length > 1 && <button type="button" onClick={() => removeDynamicListItem(setCelulares, index)} className="p-1 text-red-500 hover:text-red-700"><XMarkIcon /></button>}
                                </div>
                            ))}
                            <button type="button" onClick={() => addDynamicListItem(setCelulares)} className="text-sm text-slate-800 font-semibold hover:text-amber-600 flex items-center gap-1"><PlusIcon className="w-4 h-4" />Agregar nuevo</button>
                        </div>

                         <div ref={ciiuInputRef}>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Código(s) CIIU</label>
                            <div className="relative">
                                <input type="text" placeholder="Buscar por código o descripción..." value={ciiuSearch} onChange={handleCiiuSearchChange} onFocus={() => ciiuResults.length > 0 && setIsCiiuListOpen(true)} className={`${inputBaseClasses} border-slate-300`} />
                                {isCiiuListOpen && ciiuResults.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                                        {ciiuResults.map(ciiu => (
                                            <li key={ciiu.code} onClick={() => handleSelectCiiu(ciiu)} className="p-2 text-sm hover:bg-slate-100 cursor-pointer">
                                                <strong className="text-slate-800">{ciiu.code}</strong> - <span className="text-slate-600">{ciiu.description}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                             <div className="mt-2 flex flex-wrap gap-2">
                                {selectedCiius.map(ciiu => (
                                    <span key={ciiu.code} className="bg-slate-200 text-slate-800 text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-2 max-w-full" title={ciiu.description}>
                                        <span className="truncate">{ciiu.code} - {ciiu.description}</span>
                                        <button type="button" onClick={() => handleRemoveCiiu(ciiu.code)} className="text-slate-500 hover:text-slate-800 flex-shrink-0">
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                             <label className="block text-sm font-medium text-slate-600 mb-1">Clave Portal <span className="text-red-500">*</span></label>
                             <input type="text" name="clavePortal" placeholder="Clave alfanumérica" value={formData.clavePortal} onChange={handleInputChange} className={`${inputBaseClasses} border-slate-300`} />
                        </div>
                    </div>

                    <hr className="my-8" />

                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Responsabilidades Tributarias</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-medium text-slate-700 mb-3">Nacionales</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                                    <div className="flex items-center gap-4 col-span-1 sm:col-span-2">
                                        <CheckboxField 
                                            label="IVA" 
                                            checked={responsabilidadesNacionales.iva !== null} 
                                            onChange={(c) => handleResponsibilityChange('iva', c ? 'bimestral' : null)} 
                                        />
                                        {responsabilidadesNacionales.iva !== null && (
                                            <select 
                                                value={responsabilidadesNacionales.iva} 
                                                onChange={e => handleResponsibilityChange('iva', e.target.value as 'bimestral' | 'cuatrimestral')}
                                                className="text-sm p-1 border rounded-md"
                                            >
                                                <option value="bimestral">Bimestral</option>
                                                <option value="cuatrimestral">Cuatrimestral</option>
                                            </select>
                                        )}
                                    </div>
                                    <CheckboxField label="Impuesto al Consumo" checked={responsabilidadesNacionales.consumo} onChange={(c) => handleResponsibilityChange('consumo', c)} />
                                    <CheckboxField label="Retención en la Fuente" checked={responsabilidadesNacionales.rteFte} onChange={(c) => handleResponsibilityChange('rteFte', c)} />
                                    <div className="col-span-1 sm:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <CheckboxField label="Declaración de Renta" checked={responsabilidadesNacionales.renta} onChange={(c) => handleResponsibilityChange('renta', c)} />
                                        {responsabilidadesNacionales.renta && formData.tipoContribuyente !== 'Régimen Simple' && (
                                            <div className="ml-6 mt-2 space-y-2 border-l-2 pl-3 border-amber-200">
                                                <p className="text-xs text-slate-500 mb-1">Seleccione los plazos a generar:</p>
                                                {(formData.tipoContribuyente === 'Gran Contribuyente' || formData.tipoContribuyente === 'Gran Contribuyente autorretenedor') ? (
                                                    <>
                                                        <CheckboxField label="Cuota 1" checked={responsabilidadesNacionales.cuotasRenta?.cuota1 || false} onChange={(c) => handleResponsibilityChange('cuotasRenta', { ...responsabilidadesNacionales.cuotasRenta, cuota1: c } as any)} />
                                                        <CheckboxField label="Cuota 2" checked={responsabilidadesNacionales.cuotasRenta?.cuota2 || false} onChange={(c) => handleResponsibilityChange('cuotasRenta', { ...responsabilidadesNacionales.cuotasRenta, cuota2: c } as any)} />
                                                        <CheckboxField label="Cuota 3" checked={responsabilidadesNacionales.cuotasRenta?.cuota3 || false} onChange={(c) => handleResponsibilityChange('cuotasRenta', { ...responsabilidadesNacionales.cuotasRenta, cuota3: c } as any)} />
                                                    </>
                                                ) : formData.tipoPersona === 'Persona Jurídica' ? (
                                                    <>
                                                        <CheckboxField label="Cuota 1" checked={responsabilidadesNacionales.cuotasRenta?.cuota1 || false} onChange={(c) => handleResponsibilityChange('cuotasRenta', { ...responsabilidadesNacionales.cuotasRenta, cuota1: c } as any)} />
                                                        <CheckboxField label="Cuota 2" checked={responsabilidadesNacionales.cuotasRenta?.cuota2 || false} onChange={(c) => handleResponsibilityChange('cuotasRenta', { ...responsabilidadesNacionales.cuotasRenta, cuota2: c } as any)} />
                                                    </>
                                                ) : (
                                                    <CheckboxField label="Vencimiento Único" checked={responsabilidadesNacionales.cuotasRenta?.cuota1 || false} onChange={(c) => handleResponsibilityChange('cuotasRenta', { ...responsabilidadesNacionales.cuotasRenta, cuota1: c } as any)} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <CheckboxField label="Información Exógena" checked={responsabilidadesNacionales.exogenas} onChange={(c) => handleResponsibilityChange('exogenas', c)} />
                                    <CheckboxField label="GMF" checked={responsabilidadesNacionales.gmf || false} onChange={(c) => handleResponsibilityChange('gmf', c)} />
                                    <CheckboxField label="Impuesto al Patrimonio" checked={responsabilidadesNacionales.impuestoPatrimonio || false} onChange={(c) => handleResponsibilityChange('impuestoPatrimonio', c)} />
                                    <CheckboxField label="Precios de Transferencia" checked={responsabilidadesNacionales.preciosTransferencia || false} onChange={(c) => handleResponsibilityChange('preciosTransferencia', c)} />
                                    <CheckboxField label="Gasolina y ACPM" checked={responsabilidadesNacionales.gasolina || false} onChange={(c) => handleResponsibilityChange('gasolina', c)} />
                                    <CheckboxField label="Carbono" checked={responsabilidadesNacionales.carbono || false} onChange={(c) => handleResponsibilityChange('carbono', c)} />
                                    <CheckboxField label="Plásticos" checked={responsabilidadesNacionales.plasticos || false} onChange={(c) => handleResponsibilityChange('plasticos', c)} />
                                    <CheckboxField label="Bebidas Ultraprocesadas" checked={responsabilidadesNacionales.bebidasUltraprocesadas || false} onChange={(c) => handleResponsibilityChange('bebidasUltraprocesadas', c)} />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-700 mb-3">Municipales</h4>
                                <p className="text-sm text-slate-500"> (Próximamente)</p>
                            </div>
                        </div>
                    </div>
                    
                    <hr className="my-8" />

                    <div>
                         <h3 className="text-lg font-semibold text-slate-800 mb-4">Otras Obligaciones</h3>
                         <div className="space-y-2">
                            <CheckboxField label="Revisión Mensual" checked={otherObligations.revisionMensual} onChange={(c) => setOtherObligations(p => ({...p, revisionMensual: c}))} />
                         </div>
                    </div>
                </main>

                <footer className="p-5 bg-slate-50 border-t border-slate-200 text-right">
                    <button onClick={handleSubmit} className="w-full md:w-auto bg-slate-900 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-200">
                        {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AddClientModal;
