
import { User } from '../../services/firebase';

export interface BackupPayload {
  type: 'ECOFEIRA_BACKUP_INIT';
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  };
  timestamp: string;
  data: {
    favorites: string[];
    shoppingList: any[];
    scannedHistory: string[];
    recentSearches: string[];
  };
}

/**
 * Coleta todos os dados relevantes do usuário e estado local da aplicação
 * para serem enviados ao sistema de backup.
 */
export const getBackupPayload = (user: User): BackupPayload => {
  return {
    type: 'ECOFEIRA_BACKUP_INIT',
    user: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    },
    timestamp: new Date().toISOString(),
    data: {
      favorites: JSON.parse(localStorage.getItem('ecofeira_favorites') || '[]'),
      shoppingList: JSON.parse(localStorage.getItem('ecofeira_shopping_list') || '[]'),
      scannedHistory: JSON.parse(localStorage.getItem('ecofeira_scanned_history') || '[]'),
      recentSearches: JSON.parse(localStorage.getItem('ecofeira_recent_searches') || '[]'),
    }
  };
};

/**
 * Processa dados recebidos do sistema de backup e restaura no localStorage
 * do site pai.
 */
export const restoreAppData = (payload: any) => {
  if (!payload || typeof payload !== 'object') return;

  const { favorites, shoppingList, scannedHistory, recentSearches } = payload;

  if (Array.isArray(favorites)) {
    localStorage.setItem('ecofeira_favorites', JSON.stringify(favorites));
  }
  
  if (Array.isArray(shoppingList)) {
    localStorage.setItem('ecofeira_shopping_list', JSON.stringify(shoppingList));
  }
  
  if (Array.isArray(scannedHistory)) {
    localStorage.setItem('ecofeira_scanned_history', JSON.stringify(scannedHistory));
  }
  
  if (Array.isArray(recentSearches)) {
    localStorage.setItem('ecofeira_recent_searches', JSON.stringify(recentSearches));
  }

  // Notifica o sistema de que os dados foram aplicados com sucesso
  console.log("✅ EcoFeira: Dados restaurados com sucesso do backup.");
  
  // Recarrega a aplicação para que o estado do React seja atualizado com os novos dados do localStorage
  window.location.reload();
};
