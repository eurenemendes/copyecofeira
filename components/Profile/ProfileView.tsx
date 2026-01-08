
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../services/firebase';

interface ProfileViewProps {
  user: User | null;
  favoritesCount: number;
  shoppingListCount: number;
  onLogout: () => void;
  onLogin: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  favoritesCount, 
  shoppingListCount, 
  onLogout, 
  onLogin 
}) => {
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    await onLogin();
    setIsLoggingIn(false);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 sm:py-24 px-4 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] p-10 sm:p-20 border border-gray-100 dark:border-gray-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand via-brand-dark to-brand"></div>
          <div className="w-24 h-24 bg-brand/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
            <svg className="w-12 h-12 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-6xl font-[1000] text-[#111827] dark:text-white tracking-tighter leading-none mb-6">Acesse seu Perfil</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mb-12 max-w-md mx-auto">Salve seus produtos favoritos, gerencie sua lista de compras e economize de forma inteligente em qualquer dispositivo.</p>
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-brand dark:hover:border-brand text-gray-700 dark:text-gray-200 font-black py-6 rounded-3xl shadow-lg transition-all flex items-center justify-center space-x-4 group active:scale-95 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <div className="w-6 h-6 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span className="text-xl">Entrar com Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] p-8 sm:p-16 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden text-center sm:text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 relative z-10">
          <div className="w-32 h-32 sm:w-44 sm:h-44 bg-brand/10 rounded-[3rem] flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden">
             <img 
               src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
               alt="Avatar" 
               className="w-full h-full object-cover"
             />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-6xl font-[1000] text-[#111827] dark:text-white tracking-tighter leading-none">{user.displayName || 'Usuário'}</h1>
              <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">{user.email}</p>
              <div className="flex items-center space-x-2 pt-1">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UID:</span>
                 <code className="text-[10px] font-bold text-brand bg-brand/5 px-2 py-0.5 rounded-md">{user.uid}</code>
              </div>
            </div>
            <div className="inline-flex items-center px-4 py-2 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <span>Membro Ativo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:scale-105 transition-transform">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Favoritos</p>
          <p className="text-3xl font-[1000] text-gray-900 dark:text-white tracking-tighter">{favoritesCount}</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:scale-105 transition-transform">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Na Lista</p>
          <p className="text-3xl font-[1000] text-gray-900 dark:text-white tracking-tighter">{shoppingListCount}</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:scale-105 transition-transform">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Conta</p>
          <p className="text-xl font-[1000] text-brand tracking-tighter">Verificada</p>
        </div>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl sm:text-3xl font-black text-[#111827] dark:text-white tracking-tighter px-4">Minha Conta</h2>
        <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800 overflow-hidden shadow-sm">
          <button onClick={() => navigate('/favoritos')} className="w-full p-8 flex items-center justify-between hover:bg-brand/5 transition-colors group">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg></div>
              <span className="text-xl font-[800] text-gray-700 dark:text-gray-200 group-hover:text-brand transition-colors">Meus Itens Favoritos</span>
            </div>
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
          <button onClick={() => navigate('/lista')} className="w-full p-8 flex items-center justify-between hover:bg-brand/5 transition-colors group">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-brand/10 text-brand rounded-2xl"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>
              <span className="text-xl font-[800] text-gray-700 dark:text-gray-200 group-hover:text-brand transition-colors">Lista de Compras Ativa</span>
            </div>
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full bg-red-50 dark:bg-red-500/10 text-red-500 font-black py-8 rounded-[2.5rem] hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-900/30 flex items-center justify-center space-x-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span>Sair da Conta</span>
        </button>
      </div>
    </div>
  );
};
