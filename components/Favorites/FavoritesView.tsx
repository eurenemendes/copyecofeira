
import React, { useState, useEffect } from 'react';
import { Product, Supermarket } from '../../types';
import { ProductCard } from '../ProductCard';
import { ClearButton } from '../ui/ClearButton';
import { User } from '../../services/firebase';

interface FavoritesViewProps {
  favorites: string[];
  favoritedProducts: Product[];
  favoriteStores: string[];
  stores: Supermarket[];
  user: User | null;
  onAddToList: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
  onToggleFavoriteStore: (id: string) => void;
  onClearClick: (type: 'products' | 'stores', ids: string[] | null) => void;
  onStoreClick: (store: Supermarket) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  favoritedProducts,
  favoriteStores,
  stores,
  user,
  onAddToList,
  onToggleFavorite,
  onToggleFavoriteStore,
  onClearClick,
  onStoreClick
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'stores'>('products');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Limpa seleção ao trocar de aba
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  const favoritedStoresData = stores.filter(s => favoriteStores.includes(s.id));

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClear = () => {
    const idsToClear = selectedIds.size > 0 ? Array.from(selectedIds) : null;
    onClearClick(activeTab, idsToClear);
  };

  const hasItems = activeTab === 'products' ? favoritedProducts.length > 0 : favoritedStoresData.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-6xl font-[900] text-[#111827] dark:text-white tracking-tighter mb-2">
            Favoritos
          </h1>
          {selectedIds.size > 0 && (
            <p className="text-brand font-black text-sm uppercase tracking-widest animate-in slide-in-from-left-2">
              {selectedIds.size} {selectedIds.size === 1 ? 'item selecionado' : 'itens selecionados'}
            </p>
          )}
        </div>
        {hasItems && (
          <ClearButton 
            onClick={handleClear} 
            label={selectedIds.size > 0 ? `Remover Selecionados (${selectedIds.size})` : (activeTab === 'products' ? "Limpar Produtos" : "Limpar Lojas")}
          />
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex p-1 bg-gray-100 dark:bg-[#1e293b] rounded-2xl w-full sm:w-fit overflow-hidden border border-gray-100 dark:border-gray-800">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'products' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800'}`}
        >
          Produtos ({favoritedProducts.length})
        </button>
        <button 
          onClick={() => setActiveTab('stores')}
          className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'stores' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800'}`}
        >
          Lojas ({favoritedStoresData.length})
        </button>
      </div>

      {activeTab === 'products' ? (
        <>
          {favoritedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {favoritedProducts.map((p) => (
                <div key={p.id} className="relative">
                  <div 
                    onClick={() => toggleSelection(p.id)}
                    className={`absolute top-4 left-4 z-[40] w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all cursor-pointer shadow-lg ${selectedIds.has(p.id) ? 'bg-brand border-white text-white scale-110' : 'bg-white/80 border-gray-200 text-transparent hover:border-brand/50'}`}
                  >
                    {selectedIds.has(p.id) && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <ProductCard
                    product={p}
                    onAddToList={onAddToList}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={true}
                    storeLogo={stores.find((s) => s.name === p.supermarket)?.logo}
                    user={user}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white dark:bg-[#1e293b] rounded-[2.5rem] flex flex-col items-center border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-gray-50 dark:bg-[#0f172a] rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-10 h-10 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-400 dark:text-gray-500 font-[800] text-xl tracking-tight">Sem produtos salvos</p>
              <p className="text-gray-400 dark:text-gray-600 font-bold mt-2">Toque no coração nos produtos para encontrá-los aqui.</p>
            </div>
          )}
        </>
      ) : (
        <>
          {favoritedStoresData.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {favoritedStoresData.map(store => (
                <div key={store.id} className="relative">
                  <div 
                    onClick={() => toggleSelection(store.id)}
                    className={`absolute top-6 left-6 z-[40] w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all cursor-pointer shadow-lg ${selectedIds.has(store.id) ? 'bg-brand border-white text-white scale-110' : 'bg-white/80 border-gray-200 text-transparent hover:border-brand/50'}`}
                  >
                    {selectedIds.has(store.id) && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className={`bg-white dark:bg-[#1e293b] border rounded-2xl sm:rounded-[3rem] p-4 sm:p-10 shadow-sm hover:shadow-xl transition-all duration-700 flex flex-col items-center text-center space-y-4 sm:space-y-6 group relative ${selectedIds.has(store.id) ? 'border-brand ring-2 ring-brand/20' : 'border-gray-100 dark:border-gray-800'}`}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavoriteStore(store.id);
                      }}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 transition-all hover:scale-110 active:scale-95 z-10"
                    >
                      <svg className="w-4 h-4 fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>

                    <div className="w-16 h-16 sm:w-28 sm:h-28 bg-[#f8fafc] dark:bg-[#0f172a] rounded-xl sm:rounded-[2rem] flex items-center justify-center p-3 sm:p-6 border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-all">
                      <img src={store.logo} alt={store.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <h3 className="text-base sm:text-2xl font-[900] text-[#111827] dark:text-white tracking-tighter leading-tight line-clamp-1">{store.name}</h3>
                      <p className="text-[10px] sm:text-sm text-gray-400 font-bold">{store.neighborhood}</p>
                    </div>
                    <button 
                      onClick={() => onStoreClick(store)} 
                      className="w-full py-3 sm:py-4 border-2 border-gray-100 dark:border-gray-800 text-[#111827] dark:text-white font-[900] rounded-xl sm:rounded-[1.5rem] hover:border-brand hover:text-brand transition-all flex items-center justify-center space-x-2 text-xs sm:text-base"
                    >
                      <span>Ver Ofertas</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white dark:bg-[#1e293b] rounded-[2.5rem] flex flex-col items-center border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-gray-50 dark:bg-[#0f172a] rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-10 h-10 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-400 dark:text-gray-500 font-[800] text-xl tracking-tight">Sem lojas salvas</p>
              <p className="text-gray-400 dark:text-gray-600 font-bold mt-2">Você pode favoritar lojas para visualizá-las aqui rapidamente.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
