
import React, { useState, useEffect } from 'react';
import type { Module } from '../types';
import { HomeIcon, RevisionesIcon, ClientsIcon, TasksIcon, CalendarIcon, HistoryIcon, TrendingUpIcon, LogoutIcon } from './Icons';

interface SidebarProps {
    activeModule: Module;
    setActiveModule: (module: Module) => void;
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

// URLs de logos
const logoIconUrl = 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/icono%20sin%20fondo%20en%20amarillo.png?alt=media&token=e11d5ce5-0832-4272-828f-2ba6d3623c4f';
const logoFullUrl = 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/logo%20sin%20fondo%20a%20color%20amarillo.png?alt=media&token=1b6f8d8d-4a2a-4f0a-9bff-882866521db8';

// --- FILTROS CSS DEFINITIVOS ---
// Estos filtros manipulan los píxeles de la imagen <img> o SVG negro original.

// 1. Blanco Puro (Inactivo): Convierte negro a blanco.
const FILTER_WHITE = 'brightness-0 invert'; 

// 2. Ámbar Marca #f6b034 (Activo): Cálculo exacto de matriz de color para transformar negro a ámbar.
const FILTER_AMBER = '[filter:invert(81%)_sepia(37%)_saturate(988%)_hue-rotate(323deg)_brightness(102%)_contrast(93%)]';

// 3. Rojo Alerta (Cerrar Sesión): Filtro específico para rojo #ef4444.
const FILTER_RED = '[filter:brightness(0)_saturate(100%)_invert(32%)_sepia(93%)_saturate(1762%)_hue-rotate(334deg)_brightness(94%)_contrast(96%)]';


const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule, isOpen, onClose, onLogout }) => {
    const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detectar si es móvil para comportamiento de cierre
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // En Desktop es expandido por hover o si está forzado
    const isExpanded = isOpen || isDesktopExpanded;

    const handleSetModule = (module: Module) => {
        setActiveModule(module);
        if (isMobile) {
            onClose();
        }
    };

    const NavButton: React.FC<{ module: Module, title: string, children: React.ReactElement }> = ({ module, title, children }) => {
        const isActive = activeModule === module;
        
        // Seleccionamos el filtro basado en el estado
        const currentFilter = isActive ? FILTER_AMBER : FILTER_WHITE;

        return (
             <button
                onClick={() => handleSetModule(module)}
                className={`
                    flex items-center w-full p-3 mb-1 text-left transition-all duration-300 ease-out
                    group relative overflow-hidden rounded-xl mx-auto
                    ${isActive
                        ? 'bg-[#f6b034]/10 text-[#f6b034] shadow-[inset_4px_0_0_0_#f6b034]' // Fondo y texto ámbar
                        : 'text-white hover:bg-white/5'} // Texto blanco base
                     ${!isExpanded && !isMobile ? 'justify-center w-12 px-0' : 'w-[90%] pl-4'}
                `}
                title={title}
            >
                {/* 
                    Wrapper del Icono:
                    Aplicamos la clase del filtro aquí. Clonamos el elemento hijo para asegurarnos 
                    de que la clase se inyecte directamente en el componente del icono si soporta className,
                    o aplicamos el filtro al span contenedor que afecta a la imagen interna.
                */}
                <span className={`
                    flex-shrink-0 w-6 h-6 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                    ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                    ${currentFilter} 
                `}>
                    {children}
                </span>
                
                <span className={`
                    ml-3 text-sm tracking-wide font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] whitespace-nowrap
                    ${(isExpanded || isMobile) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 hidden lg:block'}
                `}>
                    {title}
                </span>
            </button>
        );
    };

    return (
        <>
            {/* OVERLAY MÓVIL */}
            <div 
                className={`
                    fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ease-linear
                    ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                `}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* SIDEBAR CONTAINER - DISEÑO TARJETA FLOTANTE */}
            <aside
                onMouseEnter={() => setIsDesktopExpanded(true)}
                onMouseLeave={() => setIsDesktopExpanded(false)}
                className={`
                    fixed lg:sticky top-0 left-0 z-40
                    h-[calc(100vh-2rem)] m-4 
                    bg-[#000040] 
                    rounded-3xl shadow-2xl shadow-gray-900/20
                    flex flex-col flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                    ${isOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}
                    ${isDesktopExpanded ? 'lg:w-72' : 'lg:w-24'}
                    w-72 border border-white/5
                `}
            >
                {/* LOGO AREA */}
                <div className="relative flex items-center justify-center h-28 mb-2 border-b border-white/10 mx-6">
                    <img
                        src={logoFullUrl}
                        alt="R3 Consultores Logo"
                        className={`absolute h-14 object-contain transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] drop-shadow-md
                            ${(isExpanded || isMobile) ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
                    />
                    <img
                        src={logoIconUrl}
                        alt="R3 Consultores Icon"
                        className={`absolute w-10 h-auto object-contain transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] drop-shadow-md
                            ${(isExpanded || isMobile) ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
                    />
                </div>

                {/* NAVIGATION */}
                <nav className="flex-grow py-4 space-y-1 overflow-y-auto custom-scrollbar-dark px-2">
                     <NavButton module="dashboard" title="Inicio"><HomeIcon /></NavButton>
                     
                     <div className="my-4 px-6">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        {(isExpanded || isMobile) && <span className="text-[10px] font-extrabold text-[#f6b034] uppercase tracking-widest mt-3 block pl-1">Operativo</span>}
                     </div>
                     
                     <NavButton module="contable" title="Mesa de Trabajo"><RevisionesIcon /></NavButton>
                     
                     <div className="my-4 px-6">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        {(isExpanded || isMobile) && <span className="text-[10px] font-extrabold text-[#f6b034] uppercase tracking-widest mt-3 block pl-1">Gestión</span>}
                     </div>

                     <NavButton module="clients" title="Clientes"><ClientsIcon /></NavButton>
                     <NavButton module="tasks" title="Tareas"><TasksIcon /></NavButton>
                     <NavButton module="calendar" title="Calendario"><CalendarIcon /></NavButton>
                     <NavButton module="historial" title="Historial"><HistoryIcon /></NavButton>
                     <NavButton module="proyecciones-portfolio" title="Proyecciones"><TrendingUpIcon /></NavButton>
                </nav>

                {/* FOOTER / LOGOUT */}
                <div className="p-4 mx-2 mb-2 border-t border-white/5">
                    <button
                        onClick={onLogout}
                        className={`
                            flex items-center w-full p-3 rounded-2xl transition-all duration-200
                            text-slate-300 hover:bg-white/10 hover:text-white font-medium group
                            ${(!isExpanded && !isMobile) && 'justify-center'}
                        `}
                        title="Cerrar Sesión"
                    >
                        {/* Aplicamos el filtro rojo específicamente aquí */}
                        <span className={`flex-shrink-0 w-6 h-6 transition-transform group-hover:scale-110 ${FILTER_RED}`}>
                            <LogoutIcon className="w-full h-full" />
                        </span>
                        
                        <span className={`
                            ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                            ${(isExpanded || isMobile) ? 'w-auto opacity-100' : 'w-0 opacity-0'}
                        `}>
                            Cerrar Sesión
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
