

import React from 'react';

interface PlaceholderModuleProps {
    title: string;
}

const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({ title }) => {
    return (
        <div className="bg-white p-10 rounded-xl shadow-md mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">Módulo: {title}</h2>
            <p className="text-gray-500 text-center p-16">Este módulo está en construcción.</p>
        </div>
    );
};

export default PlaceholderModule;