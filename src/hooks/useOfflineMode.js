import { useState, useEffect, useCallback } from 'react';

const OFFLINE_STORAGE_KEY = 'todogame_offline_data';
const OFFLINE_QUEUE_KEY = 'todogame_offline_queue';

export const useOfflineMode = (isEnabled, supabaseUser) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Détecter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Quand on revient en ligne, synchroniser la queue
      syncOfflineQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Charger la queue hors ligne au démarrage
  useEffect(() => {
    const savedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue));
    }
  }, []);

  // Sauvegarder les données localement pour le mode hors ligne
  const saveOfflineData = useCallback((key, data) => {
    if (!isEnabled) return;
    
    try {
      const offlineData = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '{}');
      offlineData[key] = {
        data,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Erreur sauvegarde offline:', error);
    }
  }, [isEnabled]);

  // Récupérer les données hors ligne
  const getOfflineData = useCallback((key) => {
    if (!isEnabled) return null;
    
    try {
      const offlineData = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '{}');
      return offlineData[key]?.data || null;
    } catch (error) {
      console.error('Erreur lecture offline:', error);
      return null;
    }
  }, [isEnabled]);

  // Ajouter une action à la queue hors ligne
  const queueOfflineAction = useCallback((action) => {
    if (!isEnabled) return;
    
    const newQueue = [...offlineQueue, {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }];
    
    setOfflineQueue(newQueue);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
  }, [isEnabled, offlineQueue]);

  // Synchroniser la queue hors ligne avec le serveur
  const syncOfflineQueue = useCallback(async () => {
    if (!isEnabled || !isOnline || !supabaseUser || offlineQueue.length === 0) return;
    
    console.log('Synchronisation de', offlineQueue.length, 'actions hors ligne...');
    
    const failedActions = [];
    
    for (const action of offlineQueue) {
      try {
        // Exécuter l'action selon son type
        switch (action.type) {
          case 'CREATE_TASK':
            // L'action sera traitée par le composant parent
            break;
          case 'UPDATE_TASK':
            break;
          case 'COMPLETE_TASK':
            break;
          case 'DELETE_TASK':
            break;
          default:
            console.warn('Action inconnue:', action.type);
        }
      } catch (error) {
        console.error('Erreur sync action:', action, error);
        failedActions.push(action);
      }
    }
    
    // Garder uniquement les actions échouées
    setOfflineQueue(failedActions);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedActions));
    setLastSyncTime(new Date().toISOString());
  }, [isEnabled, isOnline, supabaseUser, offlineQueue]);

  // Vider toutes les données hors ligne
  const clearOfflineData = useCallback(() => {
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    setOfflineQueue([]);
  }, []);

  return {
    isOnline,
    isOfflineModeEnabled: isEnabled,
    offlineQueueLength: offlineQueue.length,
    lastSyncTime,
    saveOfflineData,
    getOfflineData,
    queueOfflineAction,
    syncOfflineQueue,
    clearOfflineData,
  };
};
