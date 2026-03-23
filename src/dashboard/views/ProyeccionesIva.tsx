import React, { useContext } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import { TrendingUpIcon, ArrowRightIcon } from '@/dashboard/components/Icons';

const ProyeccionesIva: React.FC = () => {
    const context = useContext(AppContext);
    
    if (!context) return null;
    const { setActiveModule } = context;

    return (
        <>
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Proyecciones de IVA</h1>
                <p className="text-slate-500 mt-1">Herramienta para proyectar el IVA a pagar y optimizar la carga fiscal.</p>
            </header>
            <div className="bg-white p-10 rounded-xl shadow-lg text-center border-2 border-dashed border-slate-300">
                <div className="mx-auto h-12 w-12 text-slate-400">
                    <TrendingUpIcon />
                </div>
                <h3 className="mt-2 text-lg font-medium text-slate-800">Funcionalidad Integrada</h3>
                <p className="mt-1 text-sm text-slate-500 mb-6">
                    La herramienta de proyecciones se encuentra disponible como una pestaña dentro del módulo de <span className="font-semibold">Revisiones de IVA</span>.
                    <br />
                    Para utilizarla, por favor genere primero la base de datos en dicho módulo.
                </p>
                <button 
                    onClick={() => setActiveModule('iva')}
                    className="bg-slate-800 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
                >
                    Ir a Revisiones de IVA
                    <ArrowRightIcon />
                </button>
            </div>
        </>
    );
};

export default ProyeccionesIva;
