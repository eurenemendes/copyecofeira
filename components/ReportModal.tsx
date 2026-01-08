
import React, { useRef } from 'react';
import { Product } from '../types';
import { User } from '../services/firebase';
import { slugify } from '../App';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  user: User | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, product, user }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!isOpen) return null;

  const currentPrice = product.isPromo ? product.promoPrice : product.normalPrice;

  const getItemUrl = () => {
    const baseUrl = window.location.href.split('#')[0].replace(/\/$/, "");
    const storeSlug = slugify(product.supermarket);
    const categorySlug = slugify(product.category);
    const nameSlug = slugify(product.name);
    return `${baseUrl}/#/${storeSlug}/${categorySlug}/${product.id}/${nameSlug}`;
  };

  const handleIframeLoad = () => {
    if (iframeRef.current) {
      const itemUrl = getItemUrl();
      const reportData = {
        userName: user?.displayName || 'Anônimo (Não logado)',
        userId: user?.uid || 'N/A',
        itemId: product.id,
        itemUrl: itemUrl,
        timestamp: new Date().toISOString(),
        productName: product.name,
        supermarket: product.supermarket
      };

      console.group("🚀 EcoFeira - Sistema de Reporte Componentizado");
      console.log("%c[Status] Enviando dados via postMessage", "color: #10b981; font-weight: bold;");
      console.table(reportData);
      console.groupEnd();

      // Enviando para o iframe
      iframeRef.current.contentWindow?.postMessage({
        type: 'ECOFEIRA_REPORT_DATA',
        ...reportData
      }, '*');
    }
  };

  const fallbackImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=300";

  return (
    <div 
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-800">
        
        {/* Header do Modal */}
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-[#1e293b]/50 backdrop-blur-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 border border-red-100 dark:border-red-900/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-[#111827] dark:text-white tracking-tighter">Reportar Item</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Informe erros de preço ou imagem</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-gray-50 dark:bg-[#0f172a] text-gray-400 hover:text-red-500 rounded-2xl transition-all border border-gray-100 dark:border-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Corpo do Modal */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
          {/* Previsualização rápida do produto */}
          <div className="bg-[#f8fafc] dark:bg-[#0f172a]/50 rounded-2xl p-4 flex items-center space-x-4 border border-gray-100 dark:border-gray-800">
            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-xl p-2 border border-gray-100 dark:border-gray-700 flex-shrink-0">
              <img 
                src={product.imageUrl || fallbackImage} 
                className="w-full h-full object-contain pointer-events-none" 
                alt={product.name}
              />
            </div>
            <div>
              <p className="text-[10px] font-black text-brand uppercase tracking-widest leading-none mb-1">{product.category}</p>
              <p className="font-extrabold text-gray-900 dark:text-white line-clamp-1 leading-tight">{product.name}</p>
              <p className="text-xl font-black text-gray-900 dark:text-white mt-1 tracking-tighter">R$ {currentPrice.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
          
          {/* Iframe do Formulário */}
          <div className="relative aspect-[4/5] sm:aspect-[3/4] w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white shadow-inner">
            <iframe 
              ref={iframeRef}
              onLoad={handleIframeLoad}
              src="https://formsheets.vercel.app" 
              className="w-full h-full border-none"
              title="Formulário de Reporte"
            ></iframe>
          </div>
        </div>
        
        {/* Footer do Modal */}
        <div className="p-4 bg-gray-50/50 dark:bg-[#0f172a]/50 text-center border-t border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Agradecemos sua ajuda para melhorar o EcoFeira</p>
        </div>
      </div>
    </div>
  );
};
