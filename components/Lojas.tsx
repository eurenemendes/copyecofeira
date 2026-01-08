import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Supermarket } from '../types';
import { InputClearButton } from './ui/InputClearButton.tsx';
import { SearchInput } from './ui/SearchInput.tsx';

interface LojasProps {
  stores: Supermarket[];
  onStoreClick: (store: Supermarket) => void;
}

const normalizeString = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const Lojas: React.FC<LojasProps> = ({ stores, onStoreClick }) => {
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [showStoreSuggestions, setShowStoreSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowStoreSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStores = useMemo(() => {
    if (!storeSearchQuery) return stores;
    const q = normalizeString(storeSearchQuery);
    return stores.filter(s => 
      normalizeString(s.name).includes(q) || 
      normalizeString(s.neighborhood).includes(q) || 
      normalizeString(s.street).includes(q)
    );
  }, [stores, storeSearchQuery]);

  const storeSuggestions = useMemo(() => {
    if (storeSearchQuery.length < 1) return [];
    const q = normalizeString(storeSearchQuery);
    return stores.filter(s => 
      normalizeString(s.name).includes(q) || 
      normalizeString(s.neighborhood).includes(q)
    ).slice(0, 5);
  }, [stores, storeSearchQuery]);

  return (
    <div className="space-y-12 sm:space-y-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 sm:gap-12">
        <div>
          <h1 className="text-4xl sm:text-6xl font-[900] text-[#111827] dark:text-white tracking-tighter mb-4">Parceiros</h1>
          <p className="text-gray-500 dark:text-gray-400 font-[800] text-base sm:text-xl">Encontre as melhores ofertas próximas de você</p>
        </div>
        
        <div className="relative w-full lg:w-[450px] group" ref={suggestionRef}>
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/40 rounded-xl sm:rounded-[2.5rem] -m-1"></div>
          <div className="relative flex items-center bg-white dark:bg-[#1e293b] rounded-xl sm:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm transition-all focus-within:ring-4 focus-within:ring-brand/10">
            <SearchInput 
              value={storeSearchQuery}
              onChange={(val) => {setStoreSearchQuery(val); setShowStoreSuggestions(true);}}
              onFocus={() => setShowStoreSuggestions(true)}
              placeholder="Nome ou Bairro..."
              iconClassName="text-gray-400"
              hideIconOnMobile={false}
              inputClassName="py-4 sm:py-6"
            />
            <div className="p-2 pr-3 sm:pr-4">
              {storeSearchQuery && (
                <InputClearButton onClick={() => {setStoreSearchQuery(''); setShowStoreSuggestions(false);}} size="md" />
              )}
            </div>
          </div>
          
          {showStoreSuggestions && storeSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-[#1e293b] rounded-xl sm:rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[200]">
              <div className="p-3 bg-gray-50 dark:bg-[#0f172a] border-b border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sugestões EcoFeira</span>
              </div>
              {storeSuggestions.map((s) => (
                <button 
                  key={s.id} 
                  onClick={() => {setStoreSearchQuery(s.name); setShowStoreSuggestions(false); onStoreClick(s);}} 
                  className="w-full flex items-center space-x-4 p-4 hover:bg-brand/5 border-b border-gray-50 dark:border-gray-800 last:border-none group text-left transition-colors"
                >
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center p-1.5 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-105 transition-transform">
                    <img src={s.logo} alt={s.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900 dark:text-white leading-none">{s.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1">{s.neighborhood}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-16">
        <div className="bg-[#1e293b] relative rounded-2xl sm:rounded-[3.5rem] overflow-hidden flex flex-col justify-center items-center text-center p-6 sm:p-16 group shadow-2xl min-h-[300px] sm:min-h-[520px] col-span-2 lg:col-span-1">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80" className="w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-[4000ms]" />
          </div>
          <div className="relative z-10 space-y-4 sm:space-y-12">
            <div className="w-12 h-12 sm:w-24 sm:h-24 bg-brand/20 backdrop-blur-md rounded-xl sm:rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl">
              <svg className="w-6 h-6 sm:w-12 sm:h-12 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.167a2.407 2.407 0 00-2.454-1.554H2.03a1.76 1.76 0 01-1.76-1.76V8.291c0-.972.788-1.76 1.76-1.76h.542a2.407 2.407 0 002.454-1.554l2.147-6.167A1.76 1.76 0 0111 5.882z" />
              </svg>
            </div>
            <div className="space-y-2 sm:space-y-6">
              <span className="bg-brand text-white text-[8px] sm:text-[12px] font-[900] px-3 sm:px-7 py-1.5 sm:py-2.5 rounded-lg uppercase tracking-widest">ECOFEIRA PROMO</span>
              <h4 className="text-xl sm:text-5xl font-[900] text-white leading-tight tracking-tight">Sua Marca em Destaque</h4>
            </div>
            <button className="bg-white text-[#111827] font-[900] py-3 sm:py-6 px-6 sm:px-16 rounded-xl sm:rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all text-[10px] sm:text-base uppercase tracking-wider">Saber Mais</button>
          </div>
        </div>

        {filteredStores.map(store => (
          <div key={store.id} className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 rounded-2xl sm:rounded-[3.5rem] p-4 sm:p-16 shadow-sm hover:shadow-2xl transition-all duration-700 flex flex-col items-center text-center space-y-4 sm:space-y-10 group">
            <div className="w-16 h-16 sm:w-40 sm:h-40 bg-[#f8fafc] dark:bg-[#0f172a] rounded-xl sm:rounded-[2.8rem] flex items-center justify-center p-3 sm:p-10 border border-gray-100 dark:border-gray-800 group-hover:scale-110 transition-all duration-700">
              <img src={store.logo} alt={store.name} className="w-full h-full object-contain" />
            </div>
            <div className="space-y-1 sm:space-y-4">
              <h3 className="text-base sm:text-4xl font-[900] text-[#111827] dark:text-white tracking-tighter leading-tight line-clamp-1">{store.name}</h3>
              <p className="text-[8px] sm:text-base text-gray-400 font-bold max-w-[200px] sm:max-w-none">{store.street}, {store.number} - {store.neighborhood}</p>
              <div className="flex justify-center mt-2">
                <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-widest space-x-2 ${store.status?.toLowerCase() === 'aberto' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${store.status?.toLowerCase() === 'aberto' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`}></span>
                  <span>{store.status || 'Fechado'}</span>
                </div>
              </div>
            </div>
            <div className="pt-2 sm:pt-8 w-full">
              <button 
                onClick={() => onStoreClick(store)} 
                className="w-full py-3 sm:py-6 border-2 border-gray-100 dark:border-gray-800 text-[#111827] dark:text-white font-[900] rounded-xl sm:rounded-[2rem] hover:border-brand hover:text-brand dark:hover:bg-brand dark:hover:text-white transition-all flex items-center justify-center space-x-2 sm:space-x-4 text-xs sm:text-xl"
              >
                <span>Ver Ofertas</span>
                <svg className="w-3 h-3 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};