
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { slugify } from '../App';

interface ProductCardProps {
  product: Product;
  onAddToList: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  storeLogo?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToList, onToggleFavorite, isFavorite, storeLogo }) => {
  const navigate = useNavigate();
  const [isAdded, setIsAdded] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const currentPrice = product.isPromo ? product.promoPrice : product.normalPrice;
  const discount = product.isPromo ? Math.round((1 - product.promoPrice / product.normalPrice) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToList(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const baseUrl = window.location.href.split('#')[0].replace(/\/$/, "");
    const storeSlug = slugify(product.supermarket);
    const categorySlug = slugify(product.category);
    const nameSlug = slugify(product.name);
    const shareUrl = `${baseUrl}/#/${storeSlug}/${categorySlug}/${product.id}/${nameSlug}`;
    
    const shareData = {
      title: `EcoFeira - ${product.name}`,
      text: `Confira esta oferta no ${product.supermarket}: ${product.name} por apenas R$ ${currentPrice.toFixed(2).replace('.', ',')}!`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  const handleCardClick = () => {
    const storeSlug = slugify(product.supermarket);
    const categorySlug = slugify(product.category);
    const nameSlug = slugify(product.name);
    navigate(`/${storeSlug}/${categorySlug}/${product.id}/${nameSlug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fallbackImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=300";

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="bg-white dark:bg-[#1e293b] rounded-2xl sm:rounded-[2.5rem] shadow-[0_4px_12px_rgba(0,0,0,0.04)] sm:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col group relative h-full cursor-pointer"
      >
        <div className="relative pt-[85%] bg-[#f4f7f6] dark:bg-[#0f172a]/60 m-1 sm:m-2 rounded-xl sm:rounded-[2rem] overflow-hidden">
          {/* Skeleton Loader */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <img 
            src={imageError ? fallbackImage : product.imageUrl} 
            alt={product.name}
            onLoad={() => setImageLoaded(true)}
            onError={() => { setImageError(true); setImageLoaded(true); }}
            className={`absolute inset-0 w-full h-full object-contain p-4 sm:p-8 transition-all duration-700 group-hover:scale-110 pointer-events-none select-none ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            loading="lazy"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
          
          {product.isPromo && discount > 0 && (
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-500 text-white text-[8px] sm:text-[10px] font-black px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl shadow-lg shadow-red-500/30 z-20">
              <span>{discount}% OFF</span>
            </div>
          )}

          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col space-y-2 z-20">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product.id);
              }}
              className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl shadow-lg transition-all hover:scale-110 active:scale-90 ${isFavorite ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-white/80 dark:bg-gray-800/80 text-gray-400 backdrop-blur-md'}`}
            >
              <svg className={`w-4 h-4 sm:w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            <button 
              onClick={handleShare}
              className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl shadow-lg transition-all hover:scale-110 active:scale-90 backdrop-blur-md relative ${isShared ? 'bg-brand text-white' : 'bg-white/80 dark:bg-gray-800/80 text-gray-400'}`}
            >
              {isShared ? (
                <svg className="w-4 h-4 sm:w-5 h-5 animate-success-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
            </button>
          </div>

          {/* Botão de Reportar posicionado de acordo com o quadrado vermelho da imagem */}
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-20">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsReportModalOpen(true);
              }}
              className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl shadow-lg transition-all hover:scale-110 active:scale-90 bg-white/80 dark:bg-gray-800/80 text-gray-400 backdrop-blur-md border border-gray-100/50 dark:border-gray-700/50"
              title="Reportar item"
            >
              <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </button>
          </div>

          {storeLogo && (
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 flex items-center bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md rounded-lg sm:rounded-2xl p-1 pr-2 sm:p-1.5 sm:pr-4 shadow-lg border border-gray-100 dark:border-gray-700 z-10">
              <div className="w-5 h-5 sm:w-8 h-8 bg-white dark:bg-gray-800 rounded-md sm:rounded-xl p-0.5 sm:p-1 mr-1 sm:mr-2 shadow-sm flex items-center justify-center">
                <img 
                  src={storeLogo} 
                  alt={product.supermarket} 
                  className="w-full h-full object-contain pointer-events-none" 
                />
              </div>
              <span className="text-[7px] sm:text-[10px] font-[1000] text-gray-700 dark:text-gray-100 uppercase tracking-wider truncate max-w-[50px] sm:max-w-[120px]">
                {product.supermarket}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-3 sm:p-7 pt-2 sm:pt-4 flex flex-col flex-grow">
          <div className="flex justify-between items-center mb-1.5 sm:mb-3">
            <span className="text-[7px] sm:text-[9px] font-black text-brand bg-brand/10 dark:bg-brand/20 px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg uppercase tracking-widest border border-brand/5">
              {product.category}
            </span>
          </div>
          
          <h3 className="font-extrabold text-[#111827] dark:text-gray-100 text-[13px] sm:text-[1.05rem] leading-tight mb-2 sm:mb-6 group-hover:text-brand transition-colors h-[2rem] sm:h-[2.6rem] line-clamp-2">
            {product.name}
          </h3>
          
          <div className="mt-auto flex items-end justify-between gap-1">
            <div className="flex flex-col min-0 overflow-hidden">
              {product.isPromo && (
                <span className="text-[9px] sm:text-[12px] text-gray-400 dark:text-gray-500 line-through font-bold mb-0.5 sm:mb-1">
                  R${product.normalPrice.toFixed(2).replace('.', ',')}
                </span>
              )}
              <div className="flex items-baseline">
                <span className={`text-base sm:text-3xl font-[1000] tracking-tighter truncate ${product.isPromo ? 'text-brand' : 'text-gray-900 dark:text-white'}`}>
                  R${currentPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="mt-1 sm:mt-2 flex items-center text-[7px] sm:text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="truncate">Atu: {product.lastUpdate || 'Hoje'}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end flex-shrink-0">
               <button 
                  onClick={handleAdd}
                  className={`${isAdded ? 'bg-brand-dark animate-success-pop scale-105' : 'bg-brand hover:bg-brand-dark'} text-white p-2.5 sm:p-4 rounded-lg sm:rounded-2xl transition-all shadow-xl shadow-brand/20 active:scale-95 group transform relative flex items-center justify-center overflow-hidden`}
                  disabled={isAdded}
                >
                  <div className={`transition-all duration-300 transform ${isAdded ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className={`absolute transition-all duration-300 transform ${isAdded ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Reporte */}
      {isReportModalOpen && (
        <div 
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsReportModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-800">
            <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-[#1e293b]/50 backdrop-blur-xl">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 border border-red-100 dark:border-red-900/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#111827] dark:text-white tracking-tighter">Reportar Item</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Informe problemas com este anúncio</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)} 
                className="p-3 bg-gray-50 dark:bg-[#0f172a] text-gray-400 hover:text-red-500 rounded-2xl transition-all border border-gray-100 dark:border-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
              {/* Previsualização do Item */}
              <div className="bg-[#f8fafc] dark:bg-[#0f172a]/50 rounded-2xl p-4 flex items-center space-x-4 border border-gray-100 dark:border-gray-800">
                <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-xl p-2 border border-gray-100 dark:border-gray-700 flex-shrink-0">
                  <img 
                    src={imageError ? fallbackImage : product.imageUrl} 
                    className="w-full h-full object-contain pointer-events-none" 
                    alt=""
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand uppercase tracking-widest leading-none mb-1">{product.category}</p>
                  <p className="font-extrabold text-gray-900 dark:text-white line-clamp-2 leading-tight">{product.name}</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white mt-1 tracking-tighter">R$ {currentPrice.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
              
              {/* Iframe do Formulário */}
              <div className="relative aspect-[4/5] sm:aspect-[3/4] w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white shadow-inner">
                <iframe 
                  src="https://formsheets.vercel.app/#/form/2" 
                  className="w-full h-full border-none"
                  title="Formulário de Reporte"
                ></iframe>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50/50 dark:bg-[#0f172a]/50 text-center border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Agradecemos sua ajuda para melhorar o EcoFeira</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
