
import React from 'react';

interface DianFormSectionProps {
    title: string;
    children: React.ReactNode;
}

export const DianFormSection: React.FC<DianFormSectionProps> = ({ title, children }) => {
    return (
        <div className="w-full border-x border-[#006847]">
            <div className="bg-[#006847] text-white font-bold text-center text-xs py-1 uppercase tracking-wider border-b border-[#006847]">
                {title}
            </div>
            <div>
                {children}
            </div>
        </div>
    );
};
