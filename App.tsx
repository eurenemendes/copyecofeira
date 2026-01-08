
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate, Link } from 'react-router-dom';
import { Product, Supermarket, MainBanner, GridBanner, ShoppingListItem } from './types.ts';
import { getProducts, getSupermarkets, getMainBanners, getGridBanners, getPopularSuggestions } from './services/googleSheetsService.ts';
import { Layout } from './components/Layout.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { BannerCarousel } from './components/BannerCarousel.tsx';
import { CartOptimizer } from './components/CartOptimizer.tsx';
import { Pagination } from './components/Pagination.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { Lojas } from './components/Lojas.tsx';
import { ScannerModal } from './components/ScannerModal.tsx';
import { ClearButton } from './components/ui/ClearButton.tsx';
import { FavoritesView } from './components/Favorites/FavoritesView.tsx';
import { ConfirmModal } from './components/ui/ConfirmModal.tsx';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from './services/firebase.ts';

const ITEMS_PER_PAGE = 30;

const normalizeString = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const setupDragScroll = (ref: React.RefObject<HTMLDivElement | null>) => {
  const el = ref.current;
  if (!el) return;

  let isDown = false;
  let startX: number;
  let scrollLeft: number;

  const onMouseDown = (e: MouseEvent) => {
    isDown = true;
    el.classList.add('cursor-grabbing');
    el.classList.remove('cursor-grab');
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
  };

  const onMouseLeave = () => {
    isDown = false;
    el.classList.remove('cursor-grabbing');
    el.classList.add('cursor-grab');
  };

  const onMouseUp = () => {
    isDown = false;
    el.classList.remove('cursor-grabbing');
    el.classList.add('cursor-grab');
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 2;
    el.scrollLeft = scrollLeft - walk;
  };

  el.addEventListener('mousedown', onMouseDown);
  el.addEventListener('mouseleave', onMouseLeave);
  el.addEventListener('mouseup', onMouseUp);
  el.addEventListener('mousemove', onMouseMove);

  return () => {
    el.removeEventListener('mousedown', onMouseDown);
    el.removeEventListener('mouseleave', onMouseLeave);
    el.removeEventListener('mouseup', onMouseUp);
    el.removeEventListener('mousemove', onMouseMove);
  };
};

const NotFoundState = ({ title, message, buttonText, onAction }: { title: string, message: string, buttonText: string, onAction: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 sm:py-32 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 dark:bg-[#1e293b] rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner">
      <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h2 className="text-3xl sm:text-5xl font-[1000] text-[#111827] dark:text-white tracking-tighter mb-4">{title}</h2>
    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg max-w-md mb-10">{message}</p>
    <button 
      onClick={onAction}
      className="bg-brand hover:bg-brand-dark text-white font-black py-5 px-12 rounded-2xl shadow-xl shadow-brand/20 transition-all hover:scale-105 active:scale-95 text-lg"
    >
      {buttonText}
    </button>
  </div>
);

const ProductDetailView = ({ products, stores, favorites, toggleFavorite, addToList }: { 
  products: Product[], 
  stores: Supermarket[], 
  favorites: string[], 
  toggleFavorite: (id: string) => void,
  addToList: (p: Product) => void
}) => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const product = products.find(p => p.id === productId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  const allImages = useMemo(() => {
    if (!product) return [];
    return [product.imageUrl, ...(product.additionalImages || [])].filter(Boolean);
  }, [product]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };
  
  const comparisons = useMemo(() => {
    if (!product) return [];
    const baseName = normalizeString(product.name);
    return products
      .filter(p => normalizeString(p.name) === baseName && p.id !== product.id)
      .sort((a, b) => (a.isPromo ? a.promoPrice : a.normalPrice) - (b.isPromo ? b.promoPrice : b.normalPrice))
      .slice(0, 4); 
  }, [product, products]);

  if (!product) {
    return (
      <NotFoundState 
        title="Produto não encontrado"
        message="Ops! Esta oferta pode ter expirado ou o produto foi removido da nossa base de dados."
        buttonText="Explorar outras ofertas"
        onAction={() => navigate('/produtos')}
      />
    );
  }

  const currentPrice = product.isPromo ? product.promoPrice : product.normalPrice;
  const store = stores.find(s => s.name === product.supermarket);

  return (
    <div className="space-y-12 sm:space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-sm font-black text-gray-400 hover:text-brand transition-colors group">
        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
        <span>Voltar</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-20">
        <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] p-6 sm:p-10 flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm relative group overflow-hidden h-[400px] sm:h-[600px]">
          <div className="absolute inset-0 bg-brand/5 scale-0 group-hover:scale-100 transition-transform duration-1000 rounded-full blur-3xl"></div>
          <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
             {allImages.map((img, idx) => (
                <img 
                  key={idx}
                  src={img} 
                  alt={`${product.name} - ${idx + 1}`} 
                  className={`absolute inset-0 w-full h-full object-contain p-4 sm:p-10 transition-all duration-700 ease-in-out pointer-events-none select-none ${idx === activeImageIndex ? 'opacity-100 translate-x-0 scale-100' : idx < activeImageIndex ? 'opacity-0 -translate-x-full scale-90' : 'opacity-0 translate-x-full scale-90'}`}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
             ))}
          </div>
          {allImages.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:scale-110 active:scale-90 transition-all text-gray-400 hover:text-brand"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:scale-110 active:scale-90 transition-all text-gray-400 hover:text-brand"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg></button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                {allImages.map((_, i) => <button key={i} onClick={() => setActiveImageIndex(i)} className={`h-2 rounded-full transition-all duration-300 ${i === activeImageIndex ? 'bg-brand w-8' : 'bg-gray-200 dark:bg-gray-700 w-2'}`} />)}
              </div>
            </>
          )}
          {product.isPromo && <div className="absolute top-8 left-8 bg-red-500 text-white text-xs font-black px-6 py-2 rounded-2xl shadow-xl shadow-red-500/20 animate-pulse z-20">OFERTA IMPERDÍVEL</div>}
        </div>
        <div className="flex flex-col justify-center space-y-6 sm:space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
               <span className="text-[10px] font-black text-brand bg-brand/10 px-3 py-1.5 rounded-lg uppercase tracking-widest">{product.category}</span>
               {product.brand && <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg uppercase tracking-widest">Marca: {product.brand}</span>}
            </div>
            <h1 className="text-4xl sm:text-6xl font-[1000] text-[#111827] dark:text-white tracking-tighter leading-none">{product.name}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden"><img src={store?.logo} className="w-full h-full object-contain" /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Vendido por</p>
              <Link to={`/supermercado/${store?.id}`} className="text-xl font-black text-gray-800 dark:text-gray-200 hover:text-brand transition-colors">{product.supermarket}</Link>
            </div>
          </div>
          <div className="bg-[#f8fafc] dark:bg-[#0f172a] p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-baseline space-x-2">
              <p className="text-5xl sm:text-7xl font-[1000] text-brand tracking-tighter">R$ {currentPrice.toFixed(2).replace('.', ',')}</p>
              {product.isPromo && <span className="text-xl text-gray-400 line-through font-bold">R$ {product.normalPrice.toFixed(2).replace('.', ',')}</span>}
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Preço atualizado em {product.lastUpdate || 'Hoje'}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => addToList(product)} className="flex-grow bg-brand text-white font-black py-6 rounded-3xl shadow-2xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-3"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg><span>Adicionar à Lista</span></button>
            <button onClick={() => toggleFavorite(product.id)} className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${favorites.includes(product.id) ? 'bg-red-500 border-red-600 text-white shadow-2xl shadow-red-500/30' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-red-200'}`}><svg className={`w-6 h-6 ${favorites.includes(product.id) ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></button>
          </div>
        </div>
      </div>
      {product.description && (
        <div className="space-y-6">
          <button onClick={() => setIsDescriptionOpen(!isDescriptionOpen)} className="w-full bg-white dark:bg-[#1e293b] p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:border-brand transition-all">
            <h2 className="text-2xl sm:text-3xl font-black text-[#111827] dark:text-white tracking-tighter">ver descrição</h2>
            <div className={`transition-transform duration-300 ${isDescriptionOpen ? 'rotate-180' : ''}`}><svg className="w-8 h-8 text-gray-400 group-hover:text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" /></svg></div>
          </button>
          <div className={`grid transition-all duration-500 ease-in-out ${isDescriptionOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
            <div className="overflow-hidden bg-white dark:bg-[#1e293b] p-8 sm:p-16 rounded-[3rem] border border-gray-100 dark:border-gray-800">
               <h2 className="text-2xl sm:text-3xl font-black text-[#111827] dark:text-white tracking-tighter mb-6">Descrição do Produto</h2>
               <p className="text-gray-500 dark:text-gray-400 text-base sm:text-xl font-medium leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-10 pt-10">
        <div className="flex items-center justify-between px-4 sm:px-0">
          <h2 className="text-3xl font-black text-[#111827] dark:text-white tracking-tighter">Compare Preços</h2>
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{comparisons.length} opções exibidas</span>
        </div>
        {comparisons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {comparisons.map((comp, idx) => {
              const compStore = stores.find(s => s.name === comp.supermarket);
              const compPrice = comp.isPromo ? comp.promoPrice : comp.normalPrice;
              const isOverallCheapest = compPrice <= currentPrice && idx === 0;
              return (
                <div key={comp.id} className={`relative bg-white dark:bg-[#1e293b]/60 p-6 sm:p-8 rounded-[2rem] border transition-all group overflow-visible flex items-center justify-between hover:shadow-2xl ${isOverallCheapest ? 'border-brand/40 shadow-xl shadow-brand/10 dark:border-brand/30 ring-1 ring-brand/10' : 'border-gray-100 dark:border-gray-800/60'}`}>
                  {isOverallCheapest && <div className="absolute -top-3 left-6 z-20"><span className="bg-brand text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-brand/30 uppercase tracking-widest border border-white/20 animate-in zoom-in duration-500">Menor Preço</span></div>}
                  <div className="flex items-center space-x-6">
                    <div className="w-14 h-14 bg-white dark:bg-[#0f172a] rounded-2xl flex-shrink-0 flex items-center justify-center p-2.5 shadow-sm border border-gray-100 dark:border-gray-800"><img src={compStore?.logo} className="w-full h-full object-contain" /></div>
                    <div>
                      <p className="font-black text-lg sm:text-xl text-gray-800 dark:text-gray-100 leading-tight">{comp.supermarket}</p>
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{compStore?.neighborhood}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-black tracking-tighter ${isOverallCheapest ? 'text-brand' : 'text-gray-900 dark:text-white'}`}>R$ {compPrice.toFixed(2).replace('.', ',')}</p>
                    <button onClick={() => { navigate(`/${slugify(comp.supermarket)}/${slugify(comp.category)}/${comp.id}/${slugify(comp.name)}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[11px] font-black text-brand uppercase tracking-widest hover:underline mt-1 transition-all">VER DETALHES</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center bg-gray-50/50 dark:bg-[#1e293b]/50 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800"><p className="text-xl font-bold text-gray-400">Não encontramos este item em outras lojas no momento.</p></div>
        )}
      </div>
    </div>
  );
};

const StoreDetailView = ({ products, stores, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, sortBy, setSortBy, favorites, toggleFavorite, addToList, showSearchSuggestions, setShowSearchSuggestions, searchSuggestionRef, storeCategoriesRef, categories, currentPage, setCurrentPage, onOpenScanner, user }: { products: Product[], stores: Supermarket[], searchQuery: string, setSearchQuery: (q: string) => void, selectedCategory: string, setSelectedCategory: (c: string) => void, sortBy: 'none' | 'price-asc' | 'price-desc', setSortBy: (s: 'none' | 'price-asc' | 'price-desc') => void, favorites: string[], toggleFavorite: (id: string) => void, addToList: (p: Product) => void, showSearchSuggestions: boolean, setShowSearchSuggestions: (b: boolean) => void, searchSuggestionRef: React.RefObject<HTMLDivElement | null>, storeCategoriesRef: React.RefObject<HTMLDivElement | null>, categories: string[], currentPage: number, setCurrentPage: (n: number) => void, onOpenScanner: () => void, user: User | null }) => {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const currentStore = stores.find(s => s.id === storeId);
  const [isShared, setIsShared] = useState(false);
  
  const storeDetailProducts = useMemo(() => {
    if (!currentStore) return [];
    let result = products.filter(p => p.supermarket === currentStore.name);
    if (searchQuery) {
      const q = normalizeString(searchQuery);
      result = result.filter(p => normalizeString(p.name).includes(q));
    }
    if (selectedCategory !== 'Todas') result = result.filter(p => p.category === selectedCategory);
    if (sortBy === 'price-asc') result.sort((a, b) => (a.isPromo ? a.promoPrice : a.normalPrice) - (b.isPromo ? b.promoPrice : b.normalPrice));
    else if (sortBy === 'price-desc') {
      result.sort((a, b) => {
        const discA = a.isPromo ? (a.normalPrice - a.promoPrice) / a.normalPrice : 0;
        const discB = b.isPromo ? (b.normalPrice - b.promoPrice) / b.normalPrice : 0;
        return discB - discA;
      });
    }
    return result;
  }, [products, currentStore, searchQuery, selectedCategory, sortBy]);

  const paginatedStoreProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return storeDetailProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [storeDetailProducts, currentPage]);

  const totalStorePages = Math.ceil(storeDetailProducts.length / ITEMS_PER_PAGE);

  const handleShareStore = async () => {
    const shareUrl = `${window.location.href.split('#')[0].replace(/\/$/, "")}/#/supermercado/${currentStore?.id}`;
    try {
      if (navigator.share) await navigator.share({ title: `EcoFeira - ${currentStore?.name}`, text: `Ofertas do ${currentStore?.name} no EcoFeira!`, url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); setIsShared(true); setTimeout(() => setIsShared(false), 2000); }
    } catch (err) {}
  };

  const storeSearchSuggestions = useMemo(() => {
    if (!currentStore || !searchQuery || searchQuery.length < 2) return [];
    const q = normalizeString(searchQuery);
    return products.filter(p => p.supermarket === currentStore.name && normalizeString(p.name).includes(q)).map(p => ({ label: p.name, type: 'produto' })).slice(0, 8);
  }, [products, searchQuery, currentStore]);

  if (!currentStore) return <NotFoundState title="Supermercado não encontrado" message="Não conseguimos localizar este parceiro." buttonText="Ver todos os parceiros" onAction={() => navigate('/supermercados')} />;

  return (
    <div className="space-y-12 sm:space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 sm:gap-12 bg-white dark:bg-[#1e293b] rounded-2xl sm:rounded-[3.5rem] p-6 sm:p-16 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <button onClick={() => navigate('/supermercados')} className="absolute top-6 left-6 flex items-center space-x-2 text-xs sm:text-sm font-[900] text-gray-400 hover:text-brand transition-colors group"><svg className="w-4 h-4 sm:w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg><span>Voltar aos Parceiros</span></button>
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mt-8 lg:mt-0 w-full lg:w-auto">
            <div className="w-24 h-24 sm:w-44 sm:h-44 bg-[#f8fafc] dark:bg-[#0f172a] rounded-xl sm:rounded-[2.8rem] flex items-center justify-center p-4 sm:p-10 border border-gray-100 dark:border-gray-800 shadow-inner"><img src={currentStore.logo} alt={currentStore.name} className="w-full h-full object-contain" /></div>
            <div className="text-center sm:text-left space-y-4">
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-3xl sm:text-6xl font-[1000] text-[#111827] dark:text-white tracking-tighter leading-none">{currentStore.name}</h1>
                <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-widest space-x-2 ${currentStore.status?.toLowerCase() === 'aberto' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}><span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${currentStore.status?.toLowerCase() === 'aberto' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-red-500'}`}></span><span>{currentStore.status || 'Fechado'}</span></div>
              </div>
              <div className="flex flex-col items-center sm:items-start space-y-1">
                <p className="text-gray-500 dark:text-gray-400 font-bold text-xs sm:text-lg flex items-center"><svg className="w-4 h-4 sm:w-5 h-5 mr-2 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{currentStore.street}, N°{currentStore.number}</p>
                <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] sm:text-sm pl-0 sm:pl-7">Bairro: {currentStore.neighborhood}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full lg:w-auto">
            {currentStore.flyerUrl && <a href={currentStore.flyerUrl} target="_blank" rel="noopener noreferrer" className="w-full lg:w-auto flex items-center justify-center space-x-3 bg-brand text-white font-[900] py-4 sm:py-6 px-10 rounded-xl sm:rounded-[2rem] shadow-xl shadow-brand/30 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-wider"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span>Ver Encarte Digital</span></a>}
            <button onClick={handleShareStore} className={`w-full lg:w-auto flex items-center justify-center space-x-3 font-[900] py-4 sm:py-6 px-10 rounded-xl sm:rounded-[2rem] transition-all text-sm uppercase tracking-wider border-2 relative overflow-hidden ${isShared ? 'bg-brand border-brand text-white' : 'bg-transparent border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-brand hover:text-brand'}`}>{isShared ? <><svg className="w-5 h-5 sm:w-6 sm:h-6 animate-success-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg><span>Copiado!</span></> : <><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg><span>Compartilhar Loja</span></>}</button>
          </div>
        </div>
        <div className="space-y-8 sm:space-y-12">
          <div className="flex flex-col space-y-8">
            <div className="flex flex-row items-stretch gap-2 sm:gap-8">
              <div className="relative flex-grow" ref={searchSuggestionRef}>
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/40 rounded-xl sm:rounded-[2.5rem] -m-1"></div>
                <div className="relative h-full flex items-center bg-white dark:bg-[#1e293b] rounded-xl sm:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm transition-all focus-within:ring-4 focus-within:ring-brand/10"><div className="pl-4 sm:pl-8 pr-2 sm:pr-4 text-gray-400"><svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div><input type="text" placeholder={`Buscar ofertas...`} value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setShowSearchSuggestions(true);}} onFocus={() => setShowSearchSuggestions(true)} className="w-full bg-transparent border-none focus:ring-0 py-4 sm:py-6 text-sm sm:text-xl font-bold dark:text-white outline-none" /><div className="flex items-center space-x-1 sm:space-x-2 pr-2 sm:pr-4"><button onClick={onOpenScanner} className="p-3 bg-gray-50 dark:bg-[#0f172a] text-brand rounded-xl sm:rounded-2xl transition-all hover:scale-105 active:scale-95 border border-gray-100 dark:border-gray-800"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>{searchQuery && <button onClick={() => {setSearchQuery(''); setShowSearchSuggestions(false);}} className="bg-red-500 text-white p-2 rounded-lg sm:rounded-xl shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all"><svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg></button>}</div></div>
                {showSearchSuggestions && storeSearchSuggestions.length > 0 && <div className="absolute top-full left-0 right-0 mt-4 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[200]"><div className="p-3 sm:p-5 bg-gray-50/50 dark:bg-[#0f172a]/30 border-b border-gray-100 dark:border-gray-800"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ofertas no {currentStore.name}</span></div>{storeSearchSuggestions.map((s, idx) => <button key={idx} onClick={() => {setSearchQuery(s.label); setShowSearchSuggestions(false);}} className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-brand/5 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-none group text-left"><div className="flex items-center space-x-3 sm:space-x-4"><div className={`p-2 rounded-lg sm:p-2.5 sm:rounded-xl bg-brand/10 text-brand`}><svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div><span className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200 group-hover:text-brand">{s.label}</span></div><span className="text-[10px] font-black text-gray-400 uppercase">{s.type}</span></button>)}</div>}
              </div>
              <div className="flex-shrink-0 flex items-center bg-white dark:bg-[#1e293b] p-2 rounded-xl sm:rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm"><div className="flex items-center px-2 sm:px-6 space-x-2 sm:space-x-3 text-gray-400"><svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg><select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent border-none focus:ring-0 text-[11px] sm:text-sm font-[900] text-[#111827] dark:text-white cursor-pointer py-2 px-0"><option value="none">Relevantes</option><option value="price-asc">Menor Preço</option><option value="price-desc">Desconto %</option></select></div></div>
            </div>
            <div className="overflow-hidden"><span className="text-[10px] font-[900] text-gray-400 dark:text-gray-500 uppercase tracking-[1px] mb-4 block">CATEGORIAS DISPONÍVEIS:</span><div ref={storeCategoriesRef} className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-2 cursor-grab select-none active:cursor-grabbing">{categories.map(cat => (cat === 'Todas' || products.some(p => p.supermarket === currentStore.name && p.category === cat)) ? <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-shrink-0 px-8 sm:px-12 py-3 sm:py-5 rounded-xl sm:rounded-[1.8rem] text-xs sm:text-[15px] font-[800] transition-all shadow-sm ${selectedCategory === cat ? 'bg-brand text-white shadow-xl shadow-brand/30 scale-105' : 'bg-white dark:bg-[#1e293b] text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800 hover:border-brand'}`}>{cat}</button> : null)}</div></div>
          </div>
          {paginatedStoreProducts.length > 0 ? <><div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-12">{paginatedStoreProducts.map((p) => <ProductCard key={p.id} product={p} onAddToList={addToList} onToggleFavorite={toggleFavorite} isFavorite={favorites.includes(p.id)} storeLogo={currentStore.logo} user={user} />)}</div><Pagination currentPage={currentPage} totalPages={totalStorePages} onPageChange={setCurrentPage} /></> : <div className="text-center py-24 sm:py-40 bg-white dark:bg-[#1e293b] rounded-2xl sm:rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center px-4"><div className="w-20 h-20 sm:w-32 sm:h-32 bg-gray-50 dark:bg-[#0f172a] rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center mb-6 sm:mb-10 shadow-inner"><svg className="w-10 h-10 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div><p className="text-gray-400 dark:text-gray-500 font-[800] text-xl sm:text-3xl tracking-tight mb-4">Nenhuma oferta encontrada</p><p className="text-gray-400 dark:text-gray-600 font-bold max-w-md mx-auto">Tente ajustar seus filtros.</p></div>}
        </div>
      </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Supermarket[]>([]);
  const [mainBanners, setMainBanners] = useState<MainBanner[]>([]);
  const [gridBanners, setGridBanners] = useState<GridBanner[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [popularSuggestions, setPopularSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanErrorMessage, setScanErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [scannedHistory, setScannedHistory] = useState<string[]>(() => JSON.parse(localStorage.getItem('ecofeira_scanned_history') || '[]'));
  const [recentSearches, setRecentSearches] = useState<string[]>(() => JSON.parse(localStorage.getItem('ecofeira_recent_searches') || '[]'));
  const categoriesRef = useRef<HTMLDivElement>(null);
  const storesRef = useRef<HTMLDivElement>(null);
  const storeCategoriesRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchSuggestionRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'none' | 'price-asc' | 'price-desc'>('none');
  const [onlyPromos, setOnlyPromos] = useState(false);
  const [isClearFavoritesModalOpen, setIsClearFavoritesModalOpen] = useState(false);
  const [isClearListModalOpen, setIsClearListModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setAuthLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [p, s, mb, gb, suggs] = await Promise.all([getProducts(), getSupermarkets(), getMainBanners(), getGridBanners(), getPopularSuggestions()]);
        setProducts(p || []); setStores(s || []); setMainBanners(mb || []); setGridBanners(gb || []); setPopularSuggestions(suggs || []);
        setFavorites(JSON.parse(localStorage.getItem('ecofeira_favorites') || '[]'));
        setShoppingList(JSON.parse(localStorage.getItem('ecofeira_shopping_list') || '[]'));
      } catch (e) {}
      setLoading(false);
    };
    loadData();
  }, []);

  const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (error) {} };
  const handleLogout = async () => { try { await signOut(auth); navigate('/'); } catch (error) {} };
  useEffect(() => { if (!loading) localStorage.setItem('ecofeira_favorites', JSON.stringify(favorites)); }, [favorites, loading]);
  useEffect(() => { if (!loading) localStorage.setItem('ecofeira_shopping_list', JSON.stringify(shoppingList)); }, [shoppingList, loading]);
  useEffect(() => localStorage.setItem('ecofeira_recent_searches', JSON.stringify(recentSearches)), [recentSearches]);
  useEffect(() => localStorage.setItem('ecofeira_scanned_history', JSON.stringify(scannedHistory)), [scannedHistory]);

  useEffect(() => {
    if (!loading && (location.pathname === '/produtos' || location.pathname.startsWith('/supermercado/'))) {
      const cleanCats = setupDragScroll(categoriesRef); const cleanStores = setupDragScroll(storesRef); const cleanStoreCats = setupDragScroll(storeCategoriesRef);
      return () => { cleanCats?.(); cleanStores?.(); cleanStoreCats?.(); };
    }
  }, [loading, location.pathname]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory, selectedSupermarket, sortBy, onlyPromos, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchSuggestionRef.current && !searchSuggestionRef.current.contains(event.target as Node)) setShowSearchSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    setRecentSearches(prev => [term, ...prev.filter(s => s.toLowerCase() !== term.toLowerCase())].slice(0, 8));
  };
  const handleSearchSubmit = (term: string) => { setSearchQuery(term); setShowSearchSuggestions(false); saveSearch(term); navigate('/produtos'); };
  const handleScanSuccess = (code: string) => {
    const normalizedCode = normalizeString(code);
    if (products.some(p => p.id === code || normalizeString(p.name).includes(normalizedCode) || normalizeString(p.category).includes(normalizedCode))) {
      setScannedHistory(prev => [code, ...prev.filter(c => c !== code)].slice(0, 10)); handleSearchSubmit(code);
    } else { setScanErrorMessage("Código não identificado."); setTimeout(() => setScanErrorMessage(null), 4000); }
  };

  const addToList = (product: Product) => {
    setShoppingList(prev => {
      const existing = prev.find(item => item.productName === product.name);
      if (existing) return prev.map(item => item.productName === product.name ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { id: Date.now().toString(), productName: product.name, quantity: 1, checked: false, originalPrice: product.isPromo ? product.promoPrice : product.normalPrice, originalStore: product.supermarket }];
    });
  };
  const removeFromList = (id: string) => setShoppingList(prev => prev.filter(item => item.id !== id));
  const updateQuantity = (id: string, delta: number) => setShoppingList(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  const toggleFavorite = (productId: string) => setFavorites(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  const clearAllFavorites = () => { setFavorites([]); setIsClearFavoritesModalOpen(false); };
  const clearShoppingList = () => { setShoppingList([]); setIsClearListModalOpen(false); };

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => !searchQuery || normalizeString(p.name).includes(normalizeString(searchQuery)) || normalizeString(p.category).includes(normalizeString(searchQuery)) || p.id === searchQuery);
    if (selectedCategory !== 'Todas') result = result.filter(p => p.category === selectedCategory);
    if (selectedSupermarket !== 'Todos') result = result.filter(p => p.supermarket === selectedSupermarket);
    if (onlyPromos) result = result.filter(p => p.isPromo);
    if (sortBy === 'price-asc') result.sort((a, b) => (a.isPromo ? a.promoPrice : a.normalPrice) - (b.isPromo ? b.promoPrice : b.normalPrice));
    else if (sortBy === 'price-desc') result.sort((a, b) => (b.isPromo ? (b.normalPrice - b.promoPrice)/b.normalPrice : 0) - (a.isPromo ? (a.normalPrice - a.promoPrice)/a.normalPrice : 0));
    return result;
  }, [products, searchQuery, selectedCategory, selectedSupermarket, sortBy, onlyPromos]);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = normalizeString(searchQuery);
    const names = products.filter(p => normalizeString(p.name).includes(q)).map(p => ({ label: p.name, type: 'produto' }));
    const cats = Array.from(new Set(products.map(p => p.category))).filter(c => normalizeString(c).includes(q)).map(c => ({ label: c, type: 'categoria' }));
    return [...cats, ...names].slice(0, 8);
  }, [products, searchQuery]);

  const favoritedProducts = useMemo(() => products.filter(p => favorites.includes(p.id)), [products, favorites]);
  const categories = useMemo(() => ['Todas', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const supermarketNames = useMemo(() => ['Todos', ...Array.from(new Set(products.map(p => p.supermarket)))], [products]);
  const openStoreDetail = (store: Supermarket) => { setSelectedCategory('Todas'); setSearchQuery(''); setSortBy('none'); setCurrentPage(1); navigate(`/supermercado/${store.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (loading || authLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0f172a]"><div className="w-16 h-16 border-[6px] border-brand/10 border-t-brand rounded-full animate-spin mb-8"></div><p className="text-gray-500 dark:text-gray-400 font-[800] text-xl animate-pulse">EcoFeira...</p></div>;

  return (
    <Layout cartCount={shoppingList.length} favoritesCount={favorites.length} user={user}>
      <ScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
      <ConfirmModal 
        isOpen={isClearFavoritesModalOpen} 
        onClose={() => setIsClearFavoritesModalOpen(false)} 
        onConfirm={clearAllFavorites}
        title="Limpar Favoritos?"
        message="Isso removerá todos os itens que você salvou. Esta ação não pode ser desfeita."
      />
      <ConfirmModal 
        isOpen={isClearListModalOpen} 
        onClose={() => setIsClearListModalOpen(false)} 
        onConfirm={clearShoppingList}
        title="Limpar Lista de Compras?"
        message="Tem certeza que deseja remover todos os itens da sua lista atual?"
      />
      
      {scanErrorMessage && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[500] bg-red-500 text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-sm uppercase tracking-widest animate-in slide-in-from-top-4 duration-300"><div className="flex items-center space-x-3"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><span>{scanErrorMessage}</span></div></div>}
      <Routes>
        <Route path="/" element={<div className="space-y-12 sm:space-y-24"><div className="text-center max-w-4xl mx-auto space-y-6 sm:space-y-8 pt-4 relative overflow-hidden"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[18vw] sm:text-[12vw] font-[900] text-brand/10 dark:text-brand/5 pointer-events-none select-none tracking-tighter leading-none z-0">economize</div><div className="relative z-10 px-4"><h1 className="text-4xl sm:text-8xl font-[900] text-[#111827] dark:text-white tracking-tighter leading-none animate-in fade-in slide-in-from-top-4 duration-700">Compare e <span className="text-brand">economize</span></h1><p className="text-gray-500 dark:text-gray-400 text-base sm:text-xl font-medium max-w-3xl mx-auto leading-relaxed mt-4 sm:mt-8">Os melhores preços de <span className="text-gray-900 dark:text-white font-black">{products.length} produtos</span> locais.</p></div></div><div className="relative w-screen left-1/2 -translate-x-1/2 marquee-mask overflow-hidden py-6 select-none"><div className="flex animate-marquee whitespace-nowrap gap-10 sm:gap-24 w-max items-center">{[...stores, ...stores, ...stores].map((store, idx) => <div key={`${store.id}-${idx}`} className="flex flex-col items-center space-y-4 pointer-events-none"><div className="w-16 h-16 sm:w-24 sm:h-24 rounded-[1.5rem] bg-white dark:bg-[#1e293b] flex items-center justify-center p-3.5 shadow-2xl border border-gray-100/50 dark:border-gray-800/50"><img src={store.logo} alt={store.name} className="w-full h-full object-contain" /></div><span className="text-[10px] sm:text-base font-black text-gray-800 dark:text-white tracking-tight text-center uppercase">{store.name}</span></div>)}</div></div><div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 px-4 mb-8 sm:mb-16"><div className="relative group" ref={searchSuggestionRef}><div className="absolute inset-0 bg-brand/10 blur-3xl rounded-full scale-90 group-focus-within:scale-100 transition-transform duration-700"></div><div className="relative flex flex-col sm:flex-row bg-white dark:bg-[#1e293b] rounded-3xl sm:rounded-[2.5rem] p-3 shadow-2xl border border-gray-100 dark:border-gray-800 transition-all focus-within:ring-2 focus-within:ring-brand/20"><div className="flex items-center justify-center sm:justify-start flex-grow px-3 sm:px-8 border-2 border-brand/40 sm:border-none rounded-2xl mb-2 sm:mb-0"><svg className="hidden sm:block w-5 h-5 sm:w-7 sm:h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg><input type="text" placeholder="O que você procura?" value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setShowSearchSuggestions(true);}} onFocus={() => setShowSearchSuggestions(true)} onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchQuery)} className="w-full bg-transparent border-none focus:ring-0 py-3 sm:py-6 text-base sm:text-xl font-bold dark:text-white placeholder-gray-400 text-center sm:text-left" /></div><div className="flex items-center justify-center sm:justify-end space-x-2 sm:space-x-4 px-2 pr-4"><button onClick={() => setIsScannerOpen(true)} className="bg-[#0f172a] hover:bg-brand/20 text-brand p-3 sm:p-6 rounded-full transition-all border border-gray-800 shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center aspect-square"><svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>{searchQuery ? <button onClick={() => {setSearchQuery(''); setShowSearchSuggestions(false);}} className="bg-red-500 hover:bg-red-600 text-white p-3 sm:p-6 rounded-xl transition-all shadow-xl shadow-red-500/30 hover:scale-105 active:scale-95"><svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button> : <button onClick={() => handleSearchSubmit(searchQuery)} className="bg-brand hover:bg-brand-dark text-white font-[900] py-3 sm:py-6 px-10 sm:px-16 rounded-xl sm:rounded-[2rem] transition-all shadow-xl shadow-brand/30 hover:scale-105 active:scale-95 text-sm sm:text-base">Buscar</button>}</div></div>{showSearchSuggestions && <div className="absolute top-full left-0 right-0 mt-4 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[200]">{searchQuery.length === 0 && (recentSearches.length > 0 || scannedHistory.length > 0) && <div className="animate-in fade-in duration-300">{scannedHistory.length > 0 && <><div className="p-3 sm:p-5 bg-gray-50/50 dark:bg-[#0f172a]/30 border-b border-gray-100 flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Códigos Escaneados</span><button onClick={() => setScannedHistory([])} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600">Limpar</button></div>{scannedHistory.map((code, idx) => <button key={idx} onClick={() => handleSearchSubmit(code)} className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-brand/5 border-b border-gray-50 dark:border-gray-800/50 group text-left"><div className="flex items-center space-x-3 sm:space-x-4"><div className="p-2 sm:p-2.5 rounded-lg bg-orange-50 text-orange-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v1l-3 3h6l-3-3V4zM4 10h16v10H4V10z" /></svg></div><span className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200 group-hover:text-brand">{code}</span></div><span className="text-[10px] font-black text-gray-400 uppercase">Código</span></button>)}</>}{recentSearches.length > 0 && <><div className="p-3 sm:p-5 bg-gray-50/50 dark:bg-[#0f172a]/30 border-b border-gray-100"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pesquisas Recentes</span></div>{recentSearches.map((s, idx) => <div key={idx} className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-brand/5 border-b border-gray-50 last:border-none group"><button onClick={() => handleSearchSubmit(s)} className="flex items-center space-x-3 sm:space-x-4 flex-grow text-left"><div className="p-2 sm:p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-brand group-hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><span className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200 group-hover:text-brand">{s}</span></button></div>)}</>}</div>}{searchSuggestions.length > 0 && <div className="animate-in fade-in duration-300"><div className="p-3 sm:p-5 bg-gray-50/50 dark:bg-[#0f172a]/30 border-b border-gray-100"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sugestões EcoFeira</span></div>{searchSuggestions.map((s, idx) => <button key={idx} onClick={() => handleSearchSubmit(s.label)} className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-brand/5 border-b border-gray-50 last:border-none group text-left"><div className="flex items-center space-x-3 sm:space-x-4"><div className={`p-2 rounded-lg ${s.type === 'categoria' ? 'bg-orange-50 text-orange-500' : 'bg-brand/10 text-brand'}`}>{s.type === 'categoria' ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}</div><span className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200 group-hover:text-brand">{s.label}</span></div><span className="text-[10px] font-black text-gray-400 uppercase">{s.type}</span></button>)}</div>}</div>}</div><div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4"><span className="text-[10px] font-[900] text-gray-400 uppercase tracking-widest block w-full text-center sm:w-auto sm:mr-4">Sugestões Populares</span>{popularSuggestions.map(tag => <button key={tag} onClick={() => {setSearchQuery(tag); setOnlyPromos(false); handleSearchSubmit(tag);}} className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 px-4 py-2 rounded-lg text-xs sm:text-[15px] font-[800] text-gray-700 dark:text-gray-300 hover:border-brand hover:text-brand transition-all">{tag}</button>)}</div></div>{mainBanners.length > 0 && <BannerCarousel banners={mainBanners} />}</div>} />
        <Route path="/produtos" element={<div className="space-y-8 sm:space-y-16"><div className="flex flex-col space-y-6 sm:space-y-10"><div className="flex flex-row items-center gap-3 sm:gap-6"><div className="relative flex-grow group" ref={searchSuggestionRef}><div className="absolute inset-0 bg-brand/10 blur-3xl rounded-full scale-90 group-focus-within:scale-100 transition-transform duration-700"></div><div className="relative flex items-center bg-white dark:bg-[#1e293b] rounded-xl sm:rounded-[2.5rem] p-1.5 shadow-2xl border border-gray-100 dark:border-gray-800 transition-all focus-within:ring-2 focus-within:ring-brand/20"><div className="pl-4 sm:pl-8 pr-2 sm:pr-4"><svg className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400 group-focus-within:text-brand transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div><input type="text" placeholder="Pesquisar itens..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setShowSearchSuggestions(true);}} onFocus={() => setShowSearchSuggestions(true)} onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchQuery)} className="w-full bg-transparent border-none focus:ring-0 py-4 sm:py-6 text-base sm:text-xl font-[800] dark:text-white outline-none" /><div className="flex items-center space-x-2 pr-2 sm:pr-4"><button onClick={() => setIsScannerOpen(true)} className="bg-[#0f172a] hover:bg-brand/20 text-brand rounded-full transition-all border border-gray-100 dark:border-gray-800 flex items-center justify-center aspect-square p-3 sm:p-5"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>{searchQuery && <button onClick={() => {setSearchQuery(''); setShowSearchSuggestions(false);}} className="bg-red-500 text-white p-2.5 sm:p-4 rounded-lg shadow-red-500/20 hover:scale-105 transition-all"><svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>}</div></div>{showSearchSuggestions && <div className="absolute top-full left-0 right-0 mt-4 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[200]">{searchSuggestions.length > 0 && <div className="animate-in fade-in duration-300">{searchSuggestions.map((s, idx) => <button key={idx} onClick={() => handleSearchSubmit(s.label)} className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-brand/5 border-b border-gray-50 dark:border-gray-800/50 last:border-none group text-left text-gray-700 dark:text-gray-200"><div className="flex items-center space-x-3 sm:space-x-4"><div className={`p-2 rounded-lg ${s.type === 'categoria' ? 'bg-orange-50 text-orange-500' : 'bg-brand/10 text-brand'}`}>{s.type === 'categoria' ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}</div><span className="text-base sm:text-lg font-bold group-hover:text-brand">{s.label}</span></div><span className="text-[10px] font-black uppercase">{s.type}</span></button>)}</div>}</div>}</div><div className="flex-shrink-0 flex items-center bg-white dark:bg-[#1e293b] p-1.5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:scale-102"><div className="flex items-center px-2 sm:px-6 space-x-2 text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg><select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent border-none focus:ring-0 text-[10px] sm:text-sm font-[900] text-[#111827] dark:text-white cursor-pointer"><option value="none">Relevantes</option><option value="price-asc">Menor Preço</option><option value="price-desc">Desconto %</option></select></div></div></div><div className="space-y-6 sm:space-y-10"><div className="overflow-hidden"><span className="text-[10px] font-[900] text-gray-400 uppercase tracking-[1px] mb-3 block">CATEGORIAS:</span><div ref={categoriesRef} className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-2 cursor-grab select-none active:cursor-grabbing">{categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-shrink-0 px-6 py-3 rounded-xl sm:rounded-[1.5rem] text-xs sm:text-[15px] font-[800] transition-all shadow-sm ${selectedCategory === cat ? 'bg-brand text-white shadow-xl shadow-brand/30 scale-105' : 'bg-white dark:bg-[#1e293b] text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800 hover:border-brand'}`}>{cat}</button>)}</div></div><div className="overflow-hidden"><span className="text-[10px] font-[900] text-gray-400 uppercase tracking-[1px] mb-3 block">LOJAS:</span><div ref={storesRef} className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-2 cursor-grab select-none active:cursor-grabbing">{supermarketNames.map(store => <button key={store} onClick={() => setSelectedSupermarket(store)} className={`flex-shrink-0 px-6 py-3 rounded-xl sm:rounded-[1.5rem] text-xs sm:text-[15px] font-[800] transition-all shadow-sm flex items-center space-x-2 ${selectedSupermarket === store ? 'bg-brand text-white shadow-xl shadow-brand/30 scale-105' : 'bg-white dark:bg-[#1e293b] text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800 hover:border-brand'}`}>{store}</button>)}</div></div></div></div><div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-12">{filteredProducts.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE).map((p, idx) => <ProductCard key={p.id} product={p} onAddToList={addToList} onToggleFavorite={toggleFavorite} isFavorite={favorites.includes(p.id)} storeLogo={stores.find(s => s.name === p.supermarket)?.logo} user={user} />)}</div><Pagination currentPage={currentPage} totalPages={Math.ceil(filteredProducts.length/ITEMS_PER_PAGE)} onPageChange={setCurrentPage} /></div>} />
        <Route path="/supermercados" element={<Lojas stores={stores} onStoreClick={openStoreDetail} />} />
        <Route path="/perfil" element={<ProfileView user={user} favoritesCount={favorites.length} shoppingListCount={shoppingList.length} onLogout={handleLogout} onLogin={handleLogin} />} />
        <Route path="/supermercado/:storeId" element={<StoreDetailView products={products} stores={stores} searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} sortBy={sortBy} setSortBy={setSortBy} favorites={favorites} toggleFavorite={toggleFavorite} addToList={addToList} showSearchSuggestions={showSearchSuggestions} setShowSearchSuggestions={setShowSearchSuggestions} searchSuggestionRef={searchSuggestionRef} storeCategoriesRef={storeCategoriesRef} categories={categories} currentPage={currentPage} setCurrentPage={setCurrentPage} onOpenScanner={() => setIsScannerOpen(true)} user={user} />} />
        <Route path="/:storeName/:categoryName/:productId/:productName" element={<ProductDetailView products={products} stores={stores} favorites={favorites} toggleFavorite={toggleFavorite} addToList={addToList} />} />
        <Route path="/favoritos" element={<FavoritesView favorites={favorites} favoritedProducts={favoritedProducts} stores={stores} user={user} onAddToList={addToList} onToggleFavorite={toggleFavorite} onClearClick={() => setIsClearFavoritesModalOpen(true)} />} />
        <Route path="/lista" element={<div className="grid grid-cols-1 lg:grid-cols-12 gap-8"><div className="lg:col-span-7 xl:col-span-8 space-y-8"><div className="flex items-center justify-between"><div><h1 className="text-4xl font-[900] text-[#111827] dark:text-white tracking-tighter">Minha Lista</h1></div>{shoppingList.length > 0 && <ClearButton onClick={() => setIsClearListModalOpen(true)} />}</div>{shoppingList.length > 0 ? <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">{shoppingList.map((item, idx) => <div key={item.id} className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800 last:border-none hover:bg-brand/5 transition-all"><div className="flex flex-col"><p className="text-lg font-[900] text-gray-900 dark:text-gray-100">{item.productName}</p><p className="text-[10px] text-gray-400 uppercase tracking-widest">{item.originalStore}</p></div><div className="flex items-center space-x-3"><div className="flex items-center bg-gray-50 dark:bg-[#0f172a] rounded-lg p-1"><button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-400">-</button><span className="w-8 text-center font-black dark:text-white">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-gray-400">+</button></div><button onClick={() => removeFromList(item.id)} className="p-2 text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div></div>)}</div> : <div className="text-center py-24 bg-white dark:bg-[#1e293b] rounded-2xl"><p className="text-gray-400 font-bold">Lista vazia</p></div>}</div><div className="lg:col-span-5 xl:col-span-4"><CartOptimizer items={shoppingList} allProducts={products} stores={stores} /></div></div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
