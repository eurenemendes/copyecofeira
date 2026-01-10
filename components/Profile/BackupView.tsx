
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../services/firebase';
import { getBackupPayload, restoreAppData } from './BackupDataManager';

interface BackupViewProps {
  user: User | null;
}

declare global {
  interface Window {
    google: any;
  }
}

export const BackupView: React.FC<BackupViewProps> = ({ user }) => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const tokenClientRef = useRef<any>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);

  // URL do sistema filho responsável pelo backup (DriverVault)
  const BACKUP_SYSTEM_URL = "https://drivervault.vercel.app/";
  
  // Client ID do Google Cloud (Configurado para o projeto EcoFeira)
  // Nota: Este ID deve estar com o domínio atual autorizado no Console do Google
  const GOOGLE_CLIENT_ID = '349676062186-v8q6o4v7v7v7v7v7v7v7v7v7v7v7v7v7.apps.googleusercontent.com'; // Placeholder baseado no SenderID ou ID real do projeto

  // Função para enviar resposta do token de volta para o iframe filho
  const sendTokenToChild = useCallback((token: string | null, error?: string) => {
    if (iframeRef.current?.contentWindow) {
      if (token) {
        console.log("📤 EcoFeira: Enviando token de acesso para o DriverVault.");
        iframeRef.current.contentWindow.postMessage({
          type: 'DRIVE_TOKEN_RESPONSE',
          token: token
        }, BACKUP_SYSTEM_URL);
      } else {
        console.error("❌ EcoFeira: Erro na autenticação ou token vazio.");
        iframeRef.current.contentWindow.postMessage({
          type: 'DRIVE_TOKEN_ERROR',
          error: error || 'Falha na autenticação do Google Drive.'
        }, BACKUP_SYSTEM_URL);
      }
    }
  }, [BACKUP_SYSTEM_URL]);

  // Callback executado quando o Google retorna o token
  const handleTokenResponse = useCallback((response: any) => {
    if (response && response.access_token) {
      sendTokenToChild(response.access_token);
    } else {
      sendTokenToChild(null, "Não foi possível obter o token de acesso.");
    }
  }, [sendTokenToChild]);

  // Carrega a biblioteca Google Identity Services (GSI)
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: handleTokenResponse,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      // Remove o script ao desmontar se necessário, embora scripts GSI costumem ficar globais
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) document.body.removeChild(existingScript);
    };
  }, [handleTokenResponse]);

  useEffect(() => {
    if (!user) {
      navigate('/perfil');
      return;
    }

    // Handler para mensagens vindas do iframe
    const handleMessage = (event: MessageEvent) => {
      try {
        const originUrl = new URL(BACKUP_SYSTEM_URL).origin;
        if (event.origin !== originUrl) return;
      } catch (e) {
        return;
      }

      const { type, payload } = event.data;

      // O sistema filho informa que carregou e está pronto
      if (type === 'ECOFEIRA_BACKUP_READY') {
        console.log("✅ EcoFeira: DriverVault pronto para operação.");
        setIsIframeReady(true);
      }
      
      // O sistema filho solicita que o pai inicie a autenticação do Google
      if (type === 'DRIVE_CONNECT_REQUEST') {
        console.log("🔑 EcoFeira: Solicitação de autenticação recebida do DriverVault.");
        if (tokenClientRef.current) {
          tokenClientRef.current.requestAccessToken();
        } else {
          console.error("❌ EcoFeira: Token Client do Google não inicializado.");
          sendTokenToChild(null, "Serviço de autenticação indisponível no momento.");
        }
      }
      
      // O sistema filho envia comando de restauração
      if (type === 'ECOFEIRA_RESTORE_DATA') {
        console.log("📥 EcoFeira: Restaurando dados recebidos do DriverVault.");
        restoreAppData(payload);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [user, navigate, sendTokenToChild]);

  // Envia dados de inicialização (contexto do usuário)
  useEffect(() => {
    if (isIframeReady && iframeRef.current?.contentWindow && user) {
      const backupData = getBackupPayload(user);
      iframeRef.current.contentWindow.postMessage(backupData, BACKUP_SYSTEM_URL);
    }
  }, [isIframeReady, user]);

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
                <path d="M7.71,3.5L1.15,15L4.58,21L11.13,9.5L7.71,3.5M9.73,15L6.3,21H19.42L22.85,15H9.73M15,3.5L11.58,9.5L18.13,21L21.56,15L15,3.5Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-[#111827] dark:text-white tracking-tighter">Gerenciamento de Backup</h1>
              <p className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                Autenticação segura via Google Drive API
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-2xl h-[700px] relative">
          <iframe 
            ref={iframeRef}
            src={BACKUP_SYSTEM_URL}
            className="w-full h-full border-none"
            title="DriveVault - Gerenciador de Backup do EcoFeira"
            allow="identity-credentials-get; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
          />
          
          {!isIframeReady && (
            <div className="absolute inset-0 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Iniciando DriverVault...</p>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 text-center">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center">
               <svg className="w-3 h-3 mr-2 text-brand" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.908-3.333 9.277-8 10.364-4.667-1.087-8-5.456-8-10.364 0-.68.057-1.35.166-2.001zM9 11.242V6a1 1 0 112 0v5.242l2.121 2.122a1 1 0 11-1.414 1.414L9 11.242z" clipRule="evenodd" /></svg>
               Segurança EcoFeira: Autenticação delegada ativa
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
