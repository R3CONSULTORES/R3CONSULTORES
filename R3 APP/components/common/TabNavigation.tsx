
import React from 'react';

export interface TabItem {
  id: string;
  label: string;
}

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  tabs: TabItem[];
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="w-full">
      {/* 
        Contenedor Flex con scroll horizontal. 
        Se oculta la barra de desplazamiento visualmente pero se mantiene la funcionalidad.
        Agregamos pb-2 para evitar que la sombra inferior se corte.
      */}
      <nav 
        className="flex items-center gap-2 overflow-x-auto pb-2 px-1 scroll-smooth" 
        aria-label="Tabs"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Firefox & IE/Edge
      >
        {/* Estilo local para ocultar scrollbar en Webkit (Chrome/Safari) */}
        <style>{`
          nav::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 select-none
                ${isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation;
