
import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../services/firebase';

interface BackupViewProps {
  user: User | null;
}

export const BackupView: React.FC<BackupViewProps> = ({ user }) => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // URL do sistema filho responsável pelo backup (placeholder que será substituído pelo real)
  const BACKUP_SYSTEM_URL = "https://ecofeira-backup.vercel.app";

  useEffect(() => {
    if (!user) {
      navigate('/perfil');
      return;
    }

    const handleIframeLoad = () => {
      if (iframeRef.current && user) {
        const backupData = {
          type: 'ECOFEIRA_BACKUP_INIT',
          user: {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          },
          timestamp: new Date().toISOString(),
          // Aqui poderiam ser enviados também os dados locais do localStorage se necessário
          favorites: JSON.parse(localStorage.getItem('ecofeira_favorites') || '[]'),
          shoppingList: JSON.parse(localStorage.getItem('ecofeira_shopping_list') || '[]')
        };

        console.log("📤 EcoFeira: Enviando contexto de backup para sistema filho...");
        iframeRef.current.contentWindow?.postMessage(backupData, BACKUP_SYSTEM_URL);
      }
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
    }

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
      }
    };
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <button 
        onClick={() => navigate('/perfil')} 
        className="flex items-center space-x-2 text-sm font-black text-gray-400 hover:text-brand transition-colors group"
      >
        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Voltar ao Perfil</span>
      </button>

      <div className="flex flex-col space-y-6">
        <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-8 sm:p-12 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          
          <div className="flex items-center space-x-6 relative z-10">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-900/30 shadow-lg">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" className="opacity-0"/>
                <path d="M7.71,3.5L1.15,15L4.58,21L11.13,9.5L7.71,3.5M9.73,15L6.3,21H19.42L22.85,15H9.73M15,3.5L11.58,9.5L18.13,21L21.56,15L15,3.5Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-[#111827] dark:text-white tracking-tighter">Backup no Drive</h1>
              <p className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Sincronize sua economia na nuvem</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-2xl h-[600px] relative">
          <iframe 
            ref={iframeRef}
            src={BACKUP_SYSTEM_URL}
            className="w-full h-full border-none"
            title="Sincronização Google Drive"
          />
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 text-center">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center">
               <svg className="w-3 h-3 mr-2 text-brand" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.908-3.333 9.277-8 10.364-4.667-1.087-8-5.456-8-10.364 0-.68.057-1.35.166-2.001zM9 11.242V6a1 1 0 112 0v5.242l2.121 2.122a1 1 0 11-1.414 1.414L9 11.242z" clipRule="evenodd" /></svg>
               Conexão Segura EcoFeira & Google Cloud
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
