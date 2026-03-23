
import React from 'react';

interface Option {
    value: string;
    label: string;
}

interface SegmentedControlProps {
    options: Option[];
    value: string;
    onChange: (value: any) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange }) => {
    return (
        <div className="flex flex-col bg-slate-100 p-1.5 rounded-xl gap-1">
            {options.map((option) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`
                            relative flex items-center justify-center py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200
                            ${isActive 
                                ? 'bg-white text-[#1e293b] shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/5 z-10' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }
                        `}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
