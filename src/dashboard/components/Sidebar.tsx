
import React, { useState, useEffect } from 'react';
import type { Module } from '@/dashboard/types';
import { HomeIcon, RevisionesIcon, ClientsIcon, TasksIcon, CalendarIcon, HistoryIcon, TrendingUpIcon, LogoutIcon } from './Icons';

interface SidebarProps {
    activeModule: Module;
    setActiveModule: (module: Module) => void;
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

// URLs de logos estáticos locales
const logoIconUrl = '/assets/icono-amarillo.png';  // Ícono cuadrado colapsado (amarillo)
const logoFullUrl = '/assets/logo-amarillo.png';   // Logo expandido (amarillo — visible sobre fondo oscuro)

// --- CSS FILTERS FOR <img> ICONS ONLY ---
// These only work correctly on <img> elements (raster/external PNGs), NOT on inline SVGs.
// SVGs use `currentColor` and get their color from the parent's text-* class.

// White (inactive): turns black source image to white
const IMG_FILTER_WHITE = 'brightness-0 invert';
// Amber #f6b034 (active): turns black source image to amber
const IMG_FILTER_AMBER = '[filter:invert(81%)_sepia(37%)_saturate(988%)_hue-rotate(323deg)_brightness(102%)_contrast(93%)]';
// Red (logout): turns black source image to red
const IMG_FILTER_RED = '[filter:brightness(0)_saturate(100%)_invert(32%)_sepia(93%)_saturate(1762%)_hue-rotate(334deg)_brightness(94%)_contrast(96%)]';


const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule, isOpen, onClose, onLogout }) => {
    const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const isExpanded = isOpen || isDesktopExpanded;

    const handleSetModule = (module: Module) => {
        setActiveModule(module);
        if (isMobile) {
            onClose();
        }
    };

    // isImgIcon: true when the icon is an <img> tag (needs CSS filter), false for inline SVG (uses currentColor)
    const NavButton: React.FC<{ module: Module, title: string, isImgIcon?: boolean, children: React.ReactElement }> = ({ module, title, isImgIcon = false, children }) => {
        const isActive = activeModule === module;
        
        // For <img> icons: apply CSS filter to transform the black source image
        // For SVG icons: the text color on the button already sets currentColor correctly
        const imgFilter = isImgIcon ? (isActive ? IMG_FILTER_AMBER : IMG_FILTER_WHITE) : '';

        return (
             <button
                onClick={() => handleSetModule(module)}
                className={`
                    flex items-center w-full p-3 mb-1 text-left transition-all duration-300 ease-out
                    group relative overflow-hidden rounded-xl mx-auto
                    ${isActive
                        ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/5'
                        : 'text-[#e5e9ea] hover:bg-white/5'}
                     ${!isExpanded && !isMobile ? 'justify-center w-12 px-0' : 'w-[90%] pl-4'}
                `}
                title={title}
            >
                <span className={`
                    flex-shrink-0 w-6 h-6 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                    text-[#f6b034]
                    ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                    ${isImgIcon ? IMG_FILTER_AMBER : ''}
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

            {/* SIDEBAR CONTAINER */}
            <aside
                onMouseEnter={() => setIsDesktopExpanded(true)}
                onMouseLeave={() => setIsDesktopExpanded(false)}
                className={`
                    fixed lg:sticky top-0 left-0 z-40
                    h-[calc(100vh-2rem)] m-4 
                    bg-[#0f172a] 
                    rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
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
                     {/* SVG icon — uses currentColor, no filter needed */}
                     <NavButton module="dashboard" title="Inicio"><HomeIcon /></NavButton>
                     
                     <div className="my-4 px-6">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        {(isExpanded || isMobile) && <span className="text-[10px] font-extrabold text-[#f6b034] uppercase tracking-widest mt-3 block pl-1">Operativo</span>}
                     </div>
                     
                     {/* <img> icon — needs CSS filter */}
                     <NavButton module="contable" title="Mesa de Trabajo" isImgIcon={true}><RevisionesIcon /></NavButton>
                     
                     <div className="my-4 px-6">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        {(isExpanded || isMobile) && <span className="text-[10px] font-extrabold text-[#f6b034] uppercase tracking-widest mt-3 block pl-1">Gestión</span>}
                     </div>

                     {/* <img> icon */}
                     <NavButton module="clients" title="Clientes" isImgIcon={true}><ClientsIcon /></NavButton>
                     {/* SVG icon */}
                     <NavButton module="tasks" title="Tareas"><TasksIcon /></NavButton>
                     {/* SVG icon */}
                     <NavButton module="calendar" title="Calendario"><CalendarIcon /></NavButton>
                     {/* SVG icon */}
                     <NavButton module="historial" title="Historial"><HistoryIcon /></NavButton>
                     {/* SVG icon */}
                     <NavButton module="proyecciones-portfolio" title="Proyecciones"><TrendingUpIcon /></NavButton>
                </nav>

                {/* FOOTER / LOGOUT */}
                <div className="p-4 mx-2 mb-2 border-t border-white/5">
                    <button
                        onClick={onLogout}
                        className={`
                            flex items-center w-full p-3 rounded-2xl transition-all duration-200
                            text-red-400 hover:bg-white/10 hover:text-red-300 font-medium group
                            ${(!isExpanded && !isMobile) && 'justify-center'}
                        `}
                        title="Cerrar Sesión"
                    >
                        {/* <img> icon — needs filter */}
                        <span className={`flex-shrink-0 w-6 h-6 transition-transform group-hover:scale-110 ${IMG_FILTER_RED}`}>
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
