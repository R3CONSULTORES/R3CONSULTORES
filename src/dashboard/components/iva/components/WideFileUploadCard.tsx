
import React, { useRef } from 'react';
import type { FileType, FileStatus } from '../../../types';

// Native SVG Icons for internal states
const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface WideFileUploadCardProps {
    fileType: FileType;
    status: FileStatus;
    fileName: string;
    onFileChange: (fileType: FileType, file: File) => void;
    title: string;
    description?: string;
    icon?: React.ReactNode; 
}

export const WideFileUploadCard: React.FC<WideFileUploadCardProps> = ({ fileType, status, fileName, onFileChange, title, description, icon }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileChange(fileType, e.target.files[0]);
        }
    };

    const isSuccess = status === 'success';
    const isLoading = status === 'loading';
    const isError = status === 'error';

    return (
        <div 
            onClick={!isLoading ? handleClick : undefined}
            title={description || title}
            className={`
                relative h-40 w-full rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center p-4 text-center overflow-hidden
                ${isSuccess 
                    ? 'border-green-400 bg-green-50/30' 
                    : isError
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 bg-white hover:border-[#f6b034] hover:bg-[#1e293b]/5'
                }
            `}
        >
            {/* Background Icon Decoration */}
            {icon && (
                <div className={`absolute -right-4 -bottom-4 opacity-[0.07] transform rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6 ${isSuccess ? 'text-green-600' : 'text-[#1e293b]'}`}>
                    {React.cloneElement(icon as React.ReactElement<any>, { className: "w-24 h-24" })}
                </div>
            )}

            <div className="relative z-10 flex flex-col items-center gap-2 w-full">
                {isLoading ? (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e293b] mb-2"></div>
                        <span className="text-xs text-[#1e293b] font-semibold animate-pulse">Procesando...</span>
                    </div>
                ) : isSuccess ? (
                    <div className="flex flex-col items-center animate-enter">
                        <div className="rounded-full bg-green-100 p-2 text-green-600 shadow-sm mb-1">
                            <CheckIcon className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-sm text-green-800">{title}</h4>
                        <div className="mt-1 px-2 py-0.5 bg-white/80 rounded-full border border-green-200 shadow-sm max-w-[160px]">
                            <p className="text-[10px] text-green-700 font-medium truncate" title={fileName}>
                                {fileName}
                            </p>
                        </div>
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center animate-enter">
                        <div className="rounded-full bg-red-100 p-2 text-red-600 shadow-sm mb-1">
                            <XMarkIcon className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-sm text-red-800">Error</h4>
                        <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wide">Intentar de nuevo</p>
                    </div>
                ) : (
                    // Default State
                    <div className="flex flex-col items-center group-hover:-translate-y-1 transition-transform duration-300">
                        {icon ? (
                            <div className="rounded-xl p-3 bg-slate-50 text-[#1e293b] mb-2 group-hover:bg-[#f6b034]/10 group-hover:text-[#f6b034] transition-colors duration-300">
                                {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
                            </div>
                        ) : null}

                        <h4 className="font-bold text-sm text-slate-700 group-hover:text-[#1e293b] transition-colors">{title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Arrastra o clic para cargar</p>
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFile}
                onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                disabled={isLoading}
            />
        </div>
    );
};
