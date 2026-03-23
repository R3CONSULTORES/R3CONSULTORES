
import React, { useRef } from 'react';
import type { FileType, FileStatus } from '@/dashboard/types';
import { DocumentIcon, ShoppingCartIcon, BanknotesIcon, ShieldCheckIcon, UserGroupIcon, ArrowUpTrayIcon, XMarkIcon, CheckIcon, ScaleIcon, CalculatorIcon } from './Icons';

interface FileUploadCardProps {
    fileType: FileType;
    status: FileStatus;
    fileName: string;
    onFileChange: (fileType: FileType, file: File) => void;
}

const ICONS: Record<FileType, React.ReactNode> = {
    auxiliar: <DocumentIcon />,
    compras: <ShoppingCartIcon />,
    ventas: <BanknotesIcon />,
    dian: <ShieldCheckIcon />,
    validacion: <UserGroupIcon />,
    retencion_base: <ScaleIcon />,
    iva_auxiliar: <DocumentIcon />,
    iva_dian: <ShieldCheckIcon />,
    retencion_auxiliar: <DocumentIcon />,
    retencion_compras: <ShoppingCartIcon />,
    retencion_ventas: <BanknotesIcon />,
};

const TITLES: Record<FileType, string> = {
    auxiliar: 'Auxiliar General',
    compras: 'Informe Compras',
    ventas: 'Informe Ventas',
    dian: 'Informe DIAN',
    validacion: 'Archivo Validación',
    retencion_base: 'Auxiliar con Bases (Retenciones)',
    iva_auxiliar: 'Auxiliar General (IVA)',
    iva_dian: 'Informe DIAN (IVA)',
    retencion_auxiliar: 'Auxiliar General (Retenciones)',
    retencion_compras: 'Informe Compras (Retenciones)',
    retencion_ventas: 'Informe Ventas (Retenciones)',
};

const FileUploadCard: React.FC<FileUploadCardProps> = ({ fileType, status, fileName, onFileChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileChange(fileType, e.target.files[0]);
        }
    };

    const getStatusInfo = () => {
        switch (status) {
            case 'pending':
                return {
                    text: 'Pendiente',
                    textColor: 'text-slate-500',
                    borderColor: 'border-slate-300',
                    bgColor: 'bg-white',
                    iconBgColor: 'bg-slate-100',
                    iconColor: 'text-slate-400',
                    actionLabel: 'Seleccionar archivo',
                };
            case 'loading':
                return {
                    text: 'Cargando...',
                    textColor: 'text-blue-600',
                    borderColor: 'border-blue-300',
                    bgColor: 'bg-blue-50',
                    iconBgColor: 'bg-blue-100',
                    iconColor: 'text-blue-500',
                    actionLabel: 'Cargando...',
                };
            case 'success':
                return {
                    text: 'Cargado',
                    textColor: 'text-green-700',
                    borderColor: 'border-green-400',
                    bgColor: 'bg-green-50',
                    iconBgColor: 'bg-green-100',
                    iconColor: 'text-green-600',
                    actionLabel: 'Cambiar archivo',
                };
            case 'error':
                 return {
                    text: 'Error',
                    textColor: 'text-red-700',
                    borderColor: 'border-red-400',
                    bgColor: 'bg-red-50',
                    iconBgColor: 'bg-red-100',
                    iconColor: 'text-red-600',
                    actionLabel: 'Intentar de nuevo',
                };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className={`border rounded-xl p-3 text-center transition-all duration-300 flex flex-col justify-between h-full shadow-sm hover:shadow-md ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
            <div className="flex items-center justify-center">
                <h3 className="text-base font-semibold text-slate-800 text-center">{TITLES[fileType]}</h3>
            </div>

            <div className="my-2 flex-grow flex flex-col items-center justify-center">
                 <div className={`flex items-center justify-center space-x-2 font-semibold ${statusInfo.textColor}`}>
                    {status === 'success' && <CheckIcon className="w-5 h-5" />}
                    {status === 'error' && <XMarkIcon className="w-5 h-5" />}
                    {status === 'loading' && <div className="animate-spin w-5 h-5 rounded-full border-2 border-current border-t-transparent"></div>}
                    <span className="text-sm">{statusInfo.text}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 truncate w-full h-4" title={fileName}>{fileName}</p>
            </div>

            <div className="relative mt-2">
                <label
                    htmlFor={`uploader-${fileType}`}
                    className={`cursor-pointer block border border-slate-300 bg-white rounded-lg p-2 text-center transition-colors ${status !== 'loading' ? 'hover:bg-slate-50' : 'opacity-50 cursor-not-allowed'}`}
                >
                    <div className="flex items-center justify-center">
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-700">{statusInfo.actionLabel}</span>
                    </div>
                </label>
                <input
                    ref={inputRef}
                    type="file"
                    id={`uploader-${fileType}`}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    onClick={(event) => { (event.target as HTMLInputElement).value = '' }}
                    disabled={status === 'loading'}
                />
            </div>
        </div>
    );
};

export default FileUploadCard;
