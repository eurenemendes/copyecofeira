
import React from 'react';
import { Supermarket } from '../types';

interface StoreMarqueeProps {
  stores: Supermarket[];
}

export const StoreMarquee: React.FC<StoreMarqueeProps> = ({ stores }) => {
  if (!stores || stores.length === 0) return null;

  // Triplicamos a lista para garantir que o efeito de loop infinito (marquee) seja fluido
  const displayStores = [...stores, ...stores, ...stores];

  return (
    <div className="relative w-screen left-1/2 -translate-x-1/2 marquee-mask overflow-hidden py-6 select-none">
      <div className="flex animate-marquee whitespace-nowrap gap-10 sm:gap-24 w-max items-center">
        {displayStores.map((store, idx) => (
          <div 
            key={`${store.id}-${idx}`} 
            className="flex flex-col items-center space-y-4 pointer-events-none"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-[1.5rem] bg-white dark:bg-[#1e293b] flex items-center justify-center p-3.5 shadow-2xl border border-gray-100/50 dark:border-gray-800/50">
              <img 
                src={store.logo} 
                alt={store.name} 
                className="w-full h-full object-contain" 
                loading="lazy"
              />
            </div>
            <span className="text-[10px] sm:text-base font-black text-gray-800 dark:text-white tracking-tight text-center uppercase">
              {store.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
