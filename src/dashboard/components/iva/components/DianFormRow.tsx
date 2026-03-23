
import React, { useState, useEffect } from 'react';

interface DianFormRowProps {
    description: string;
    code: number;
    value: number;
    isTotal?: boolean;
    indentLevel?: number;
    editable?: boolean;
    onEdit?: (value: number) => void;
}

const formatDianCurrency = (value: number | undefined): string => {
    if (typeof value !== 'number' || isNaN(value)) {
        return '0';
    }
    const roundedValue = Math.round(value);
    return new Intl.NumberFormat('es-CO', {
        style: 'decimal',
        maximumFractionDigits: 0,
    }).format(roundedValue);
};

export const DianFormRow: React.FC<DianFormRowProps> = ({ 
    description, 
    code, 
    value, 
    isTotal = false, 
    indentLevel = 0,
    editable = false,
    onEdit
}) => {
    const [inputValue, setInputValue] = useState(formatDianCurrency(value));

    useEffect(() => {
        setInputValue(formatDianCurrency(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        // Remove non-numeric characters for input processing
        const numericPart = rawValue.replace(/[^\d-]/g, ""); 
        
        // Format for display while typing
        const formatted = numericPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        setInputValue(formatted);
    };

    const handleBlur = () => {
        if (onEdit) {
            const numericValue = parseInt(inputValue.replace(/\./g, ''), 10) || 0;
            onEdit(numericValue);
        }
    };

    // DIAN Green Color for borders
    const borderColor = "border-[#006847]"; 

    return (
        <div className={`flex w-full text-xs border-b ${borderColor} ${isTotal ? 'bg-gray-200 font-bold' : 'bg-white'}`}>
            {/* Description Column */}
            <div className={`flex-grow p-1 flex items-center border-r ${borderColor} ${indentLevel > 0 ? 'pl-4' : ''}`}>
                <span className="text-[#1e293b] leading-tight text-[11px]">{description}</span>
            </div>

            {/* Code Column */}
            <div className={`w-10 flex-shrink-0 flex items-center justify-center font-bold text-[#006847] bg-white border-r ${borderColor}`}>
                {code}
            </div>

            {/* Value Column */}
            <div className="w-36 flex-shrink-0 flex items-center justify-end px-1 bg-white relative">
                {editable ? (
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full text-right font-mono text-sm outline-none bg-yellow-50 focus:bg-yellow-100 px-1 h-full absolute inset-0"
                    />
                ) : (
                    <span className={`font-mono text-sm truncate ${value < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                        {formatDianCurrency(value)}
                    </span>
                )}
            </div>
        </div>
    );
};
