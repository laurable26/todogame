import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGoogleCalendar } from './useGoogleCalendar';
import { useOutlookCalendar } from './useOutlookCalendar';

export const useCalendarSync = (userId) => {
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Hooks pour chaque provider
  const google = useGoogleCalendar(userId);
  const outlook = useOutlookCalendar(userId);

  // Vérifier s'il y a un code OAuth en attente (depuis le callback)
  useEffect(() => {
    const checkPendingOAuth = async () => {
      // Google
      const googleCode = sessionStorage.getItem('oauth_google_code');
      if (googleCode && userId) {
        sessionStorage.removeItem('oauth_google_code');
        await google.handleOAuthCallback(googleCode);
      }

      // Outlook
      const outlookCode = sessionStorage.getItem('oauth_outlook_code');
      if (outlookCode && userId) {
        sessionStorage.removeItem('oauth_outlook_code');
        await outlook.handleOAuthCallback(outlookCode);
      }
    };

    if (userId) {
      checkPendingOAuth();
    }
  }, [userId, google.handleOAuthCallback, outlook.handleOAuthCallback]);

  // Combiner tous les événements calendrier
  const calendarEvents = useMemo(() => {
    const allEvents = [...google.googleEvents, ...outlook.outlookEvents];
    
    // Trier par date de début
    return allEvents.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateA - dateB;
    });
  }, [google.googleEvents, outlook.outlookEvents]);

  // Événements d'aujourd'hui
  const todayEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return calendarEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate >= today && eventDate < tomorrow;
    });
  }, [calendarEvents]);

  // Événements à venir (prochains 7 jours)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return calendarEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate >= today && eventDate < nextWeek;
    });
  }, [calendarEvents]);

  // Synchroniser tous les calendriers
  const syncAll = useCallback(async () => {
    setIsSyncing(true);
    try {
      await Promise.all([
        google.isConnected ? google.syncNow() : Promise.resolve(),
        outlook.isConnected ? outlook.syncNow() : Promise.resolve(),
      ]);
    } finally {
      setIsSyncing(false);
    }
  }, [google, outlook]);

  // Vérifier si au moins un calendrier est connecté
  const hasAnyConnection = google.isConnected || outlook.isConnected;

  // Sync automatique toutes les 5 minutes si connecté
  useEffect(() => {
    if (!hasAnyConnection) return;

    const interval = setInterval(() => {
      syncAll();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [hasAnyConnection, syncAll]);

  return {
    // État global
    isSyncing,
    hasAnyConnection,
    calendarEvents,
    todayEvents,
    upcomingEvents,
    
    // Google
    google: {
      isConnected: google.isConnected,
      isLoading: google.isLoading,
      events: google.googleEvents,
      lastSync: google.lastSync,
      error: google.error,
      connect: google.connectGoogle,
      disconnect: google.disconnectGoogle,
      sync: google.syncNow,
      handleCallback: google.handleOAuthCallback,
    },
    
    // Outlook
    outlook: {
      isConnected: outlook.isConnected,
      isLoading: outlook.isLoading,
      events: outlook.outlookEvents,
      lastSync: outlook.lastSync,
      error: outlook.error,
      connect: outlook.connectOutlook,
      disconnect: outlook.disconnectOutlook,
      sync: outlook.syncNow,
      handleCallback: outlook.handleOAuthCallback,
    },
    
    // Actions globales
    syncAll,
  };
};

export default useCalendarSync;
