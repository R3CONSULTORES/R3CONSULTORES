
import React, { useRef } from 'react';
import type { FileType } from '../../../types';
import { CheckIcon } from '../../Icons';

interface CompactFileChipProps {
    fileType: FileType;
    label: string;
    onFileChange: (fileType: FileType, file: File) => void;
}

export const CompactFileChip: React.FC<CompactFileChipProps> = ({ fileType, label, onFileChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <>
            <button
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 border border-green-200 pl-1.5 pr-3 py-1 rounded-full transition-colors group flex-shrink-0"
                title={`Cambiar archivo ${label}`}
            >
                <div className="bg-green-500 text-white rounded-full p-0.5">
                   <CheckIcon className="w-3 h-3" />
                </div>
                <span className="text-xs font-bold text-green-800 group-hover:text-green-900">{label}</span>
            </button>
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={(e) => e.target.files?.[0] && onFileChange(fileType, e.target.files[0])}
                onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
            />
        </>
    );
};
