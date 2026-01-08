
import React from 'react';
import { ShoppingListItem, Product, Supermarket } from '../../types';
import { ClearButton } from '../ui/ClearButton';
import { CartOptimizer } from '../CartOptimizer';

interface ShoppingListViewProps {
  shoppingList: ShoppingListItem[];
  products: Product[];
  stores: Supermarket[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveFromList: (id: string) => void;
  onClearClick: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  shoppingList,
  products,
  stores,
  onUpdateQuantity,
  onRemoveFromList,
  onClearClick
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 xl:col-span-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-[900] text-[#111827] dark:text-white tracking-tighter">
              Minha Lista
            </h1>
          </div>
          {shoppingList.length > 0 && (
            <ClearButton onClick={onClearClick} />
          )}
        </div>

        {shoppingList.length > 0 ? (
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {shoppingList.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800 last:border-none hover:bg-brand/5 transition-all"
              >
                <div className="flex flex-col">
                  <p className="text-lg font-[900] text-gray-900 dark:text-gray-100">
                    {item.productName}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                    {item.originalStore}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center bg-gray-50 dark:bg-[#0f172a] rounded-lg p-1">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, -1)} 
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-black dark:text-white">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, 1)} 
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => onRemoveFromList(item.id)} 
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-[#1e293b] rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-[#0f172a] rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner text-gray-300">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
               </svg>
            </div>
            <p className="text-gray-400 font-bold text-xl">Sua lista está vazia</p>
            <p className="text-gray-400 dark:text-gray-600 font-medium mt-2">Comece a adicionar produtos para ver a mágica da economia!</p>
          </div>
        )}
      </div>
      <div className="lg:col-span-5 xl:col-span-4">
        <CartOptimizer items={shoppingList} allProducts={products} stores={stores} />
      </div>
    </div>
  );
};
