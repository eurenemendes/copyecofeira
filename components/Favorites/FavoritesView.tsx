
import React from 'react';
import { Product, Supermarket } from '../../types';
import { ProductCard } from '../ProductCard';
import { ClearButton } from '../ui/ClearButton';
import { User } from '../../services/firebase';

interface FavoritesViewProps {
  favorites: string[];
  favoritedProducts: Product[];
  stores: Supermarket[];
  user: User | null;
  onAddToList: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
  onClearClick: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  favoritedProducts,
  stores,
  user,
  onAddToList,
  onToggleFavorite,
  onClearClick,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-6xl font-[900] text-[#111827] dark:text-white tracking-tighter mb-2">
            Favoritos
          </h1>
        </div>
        {favorites.length > 0 && (
          <ClearButton onClick={onClearClick} />
        )}
      </div>

      {favoritedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-12">
          {favoritedProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToList={onAddToList}
              onToggleFavorite={onToggleFavorite}
              isFavorite={true}
              storeLogo={stores.find((s) => s.name === p.supermarket)?.logo}
              user={user}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white dark:bg-[#1e293b] rounded-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-[#0f172a] rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner">
            <svg className="w-10 h-10 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-gray-400 font-[800] text-xl tracking-tight">Sua lista de favoritos está vazia</p>
          <p className="text-gray-400 dark:text-gray-600 font-bold mt-2">Toque no coração nos produtos para salvá-los aqui.</p>
        </div>
      )}
    </div>
  );
};
