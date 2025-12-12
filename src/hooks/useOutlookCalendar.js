import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const OUTLOOK_CLIENT_ID = import.meta.env.VITE_OUTLOOK_CLIENT_ID;
const OUTLOOK_REDIRECT_URI = import.meta.env.VITE_OUTLOOK_REDIRECT_URI || `${window.location.origin}/auth/outlook/callback`;
const OUTLOOK_SCOPES = 'Calendars.Read offline_access';

export const useOutlookCalendar = (userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [outlookEvents, setOutlookEvents] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  // Vérifier si l'utilisateur a déjà connecté Outlook
  const checkConnection = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'outlook')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur vérification connexion Outlook:', error);
      }

      if (data) {
        setIsConnected(true);
        setLastSync(data.last_sync);
        await fetchOutlookEvents(data.access_token, data.refresh_token);
      }
    } catch (err) {
      console.error('Erreur checkConnection Outlook:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Gérer le callback OAuth
  const handleOAuthCallback = useCallback(async (code) => {
    if (!userId || !code) return null;

    try {
      setIsLoading(true);
      setError(null);

      // Échanger le code contre des tokens via Edge Function
      const { data, error } = await supabase.functions.invoke('outlook-calendar-auth', {
        body: { 
          code, 
          redirect_uri: OUTLOOK_REDIRECT_URI,
          user_id: userId 
        }
      });

      if (error) throw error;

      if (data.access_token) {
        await supabase.from('calendar_connections').upsert({
          user_id: userId,
          provider: 'outlook',
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          last_sync: new Date().toISOString(),
        });

        setIsConnected(true);
        await fetchOutlookEvents(data.access_token, data.refresh_token);
        return { success: true };
      }
    } catch (err) {
      console.error('Erreur OAuth callback Outlook:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Générer l'URL d'authentification Microsoft
  const getAuthUrl = useCallback(() => {
    const params = new URLSearchParams({
      client_id: OUTLOOK_CLIENT_ID,
      redirect_uri: OUTLOOK_REDIRECT_URI,
      response_type: 'code',
      scope: OUTLOOK_SCOPES,
      response_mode: 'query',
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }, []);

  // Lancer le flow d'authentification
  const connectOutlook = useCallback(() => {
    const authUrl = getAuthUrl();
    window.location.href = authUrl;
  }, [getAuthUrl]);

  // Déconnecter Outlook
  const disconnectOutlook = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      await supabase
        .from('calendar_connections')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'outlook');

      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'outlook');

      setIsConnected(false);
      setOutlookEvents([]);
      setLastSync(null);
    } catch (err) {
      console.error('Erreur déconnexion Outlook:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Rafraîchir le token
  const refreshAccessToken = useCallback(async (refreshToken) => {
    try {
      const { data, error } = await supabase.functions.invoke('outlook-calendar-refresh', {
        body: { refresh_token: refreshToken, user_id: userId }
      });

      if (error) throw error;

      await supabase.from('calendar_connections').update({
        access_token: data.access_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      }).eq('user_id', userId).eq('provider', 'outlook');

      return data.access_token;
    } catch (err) {
      console.error('Erreur refresh token Outlook:', err);
      throw err;
    }
  }, [userId]);

  // Récupérer les événements depuis Outlook
  const fetchOutlookEvents = useCallback(async (accessToken, refreshToken) => {
    try {
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      let response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendarview?` +
        `startDateTime=${encodeURIComponent(timeMin)}&` +
        `endDateTime=${encodeURIComponent(timeMax)}&` +
        `$orderby=start/dateTime&` +
        `$top=100`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'outlook.timezone="Europe/Paris"',
          },
        }
      );

      if (response.status === 401 && refreshToken) {
        const newToken = await refreshAccessToken(refreshToken);
        response = await fetch(
          `https://graph.microsoft.com/v1.0/me/calendarview?` +
          `startDateTime=${encodeURIComponent(timeMin)}&` +
          `endDateTime=${encodeURIComponent(timeMax)}&` +
          `$orderby=start/dateTime&` +
          `$top=100`,
          {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Prefer': 'outlook.timezone="Europe/Paris"',
            },
          }
        );
      }

      if (!response.ok) {
        throw new Error('Erreur récupération événements Outlook');
      }

      const data = await response.json();
      
      const events = (data.value || []).map(event => ({
        id: `outlook_${event.id}`,
        outlookId: event.id,
        provider: 'outlook',
        title: event.subject || 'Sans titre',
        description: event.bodyPreview || '',
        startDate: event.start?.dateTime,
        endDate: event.end?.dateTime,
        allDay: event.isAllDay || false,
        location: event.location?.displayName || '',
        isCalendarEvent: true,
        completed: false,
        participants: event.attendees?.map(a => a.emailAddress?.address) || [],
      }));

      setOutlookEvents(events);
      setLastSync(new Date().toISOString());

      if (userId && events.length > 0) {
        await supabase
          .from('calendar_events')
          .delete()
          .eq('user_id', userId)
          .eq('provider', 'outlook');

        await supabase.from('calendar_events').insert(
          events.map(e => ({
            id: e.id,
            user_id: userId,
            provider: 'outlook',
            outlook_id: e.outlookId,
            title: e.title,
            description: e.description,
            start_date: e.startDate,
            end_date: e.endDate,
            all_day: e.allDay,
            location: e.location,
            participants: e.participants,
          }))
        );

        await supabase.from('calendar_connections').update({
          last_sync: new Date().toISOString()
        }).eq('user_id', userId).eq('provider', 'outlook');
      }

      return events;
    } catch (err) {
      console.error('Erreur fetchOutlookEvents:', err);
      setError(err.message);
      return [];
    }
  }, [userId, refreshAccessToken]);

  // Synchroniser manuellement
  const syncNow = useCallback(async () => {
    if (!userId || !isConnected) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data } = await supabase
        .from('calendar_connections')
        .select('access_token, refresh_token')
        .eq('user_id', userId)
        .eq('provider', 'outlook')
        .single();

      if (data) {
        await fetchOutlookEvents(data.access_token, data.refresh_token);
      }
    } catch (err) {
      console.error('Erreur sync Outlook:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isConnected, fetchOutlookEvents]);

  return {
    isConnected,
    isLoading,
    outlookEvents,
    lastSync,
    error,
    
    connectOutlook,
    disconnectOutlook,
    handleOAuthCallback,
    syncNow,
    
    getAuthUrl,
  };
};

export default useOutlookCalendar;
