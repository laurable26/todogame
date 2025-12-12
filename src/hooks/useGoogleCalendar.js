import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

export const useGoogleCalendar = (userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  // Vérifier si l'utilisateur a déjà connecté Google Calendar
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
        .eq('provider', 'google')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur vérification connexion Google:', error);
      }

      if (data) {
        setIsConnected(true);
        setLastSync(data.last_sync);
        // Charger les événements sauvegardés
        await loadSavedEvents();
        // Puis synchroniser avec Google
        await fetchGoogleEvents(data.access_token, data.refresh_token);
      }
    } catch (err) {
      console.error('Erreur checkConnection:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Charger les événements depuis Supabase
  const loadSavedEvents = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'google');

      if (error) throw error;

      if (data) {
        const events = data.map(e => ({
          id: e.id,
          googleId: e.google_id,
          provider: 'google',
          title: e.title,
          description: e.description,
          startDate: e.start_date,
          endDate: e.end_date,
          allDay: e.all_day,
          location: e.location,
          isCalendarEvent: true,
          completed: false,
          participants: e.participants || [],
        }));
        setGoogleEvents(events);
      }
    } catch (err) {
      console.error('Erreur chargement événements:', err);
    }
  }, [userId]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Échanger le code contre des tokens (côté client)
  const exchangeCodeForTokens = async (code) => {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return data;
  };

  // Gérer le callback OAuth
  const handleOAuthCallback = useCallback(async (code) => {
    if (!userId || !code) return null;

    try {
      setIsLoading(true);
      setError(null);

      // Échanger le code contre des tokens
      const tokenData = await exchangeCodeForTokens(code);

      if (tokenData.access_token) {
        // Sauvegarder les tokens dans Supabase
        const { error: upsertError } = await supabase.from('calendar_connections').upsert({
          user_id: userId,
          provider: 'google',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          last_sync: new Date().toISOString(),
        }, { onConflict: 'user_id,provider' });

        if (upsertError) throw upsertError;

        setIsConnected(true);
        await fetchGoogleEvents(tokenData.access_token, tokenData.refresh_token);
        return { success: true };
      }
    } catch (err) {
      console.error('Erreur OAuth callback:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Générer l'URL d'authentification Google
  const getAuthUrl = useCallback(() => {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: GOOGLE_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }, []);

  // Lancer le flow d'authentification
  const connectGoogle = useCallback(() => {
    const authUrl = getAuthUrl();
    window.location.href = authUrl;
  }, [getAuthUrl]);

  // Déconnecter Google Calendar
  const disconnectGoogle = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      await supabase
        .from('calendar_connections')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'google');

      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'google');

      setIsConnected(false);
      setGoogleEvents([]);
      setLastSync(null);
    } catch (err) {
      console.error('Erreur déconnexion Google:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Rafraîchir le token si expiré
  const refreshAccessToken = useCallback(async (refreshToken) => {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      // Mettre à jour le token dans Supabase
      await supabase.from('calendar_connections').update({
        access_token: data.access_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      }).eq('user_id', userId).eq('provider', 'google');

      return data.access_token;
    } catch (err) {
      console.error('Erreur refresh token:', err);
      throw err;
    }
  }, [userId]);

  // Récupérer les événements depuis Google Calendar
  const fetchGoogleEvents = useCallback(async (accessToken, refreshToken) => {
    try {
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      let response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `singleEvents=true&` +
        `orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      // Si le token est expiré, le rafraîchir
      if (response.status === 401 && refreshToken) {
        const newToken = await refreshAccessToken(refreshToken);
        response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `timeMin=${encodeURIComponent(timeMin)}&` +
          `timeMax=${encodeURIComponent(timeMax)}&` +
          `singleEvents=true&` +
          `orderBy=startTime`,
          {
            headers: {
              'Authorization': `Bearer ${newToken}`,
            },
          }
        );
      }

      if (!response.ok) {
        throw new Error('Erreur récupération événements Google');
      }

      const data = await response.json();
      
      // Transformer les événements Google en format ToDoGame
      const events = (data.items || []).map(event => ({
        id: `google_${event.id}`,
        googleId: event.id,
        provider: 'google',
        title: event.summary || 'Sans titre',
        description: event.description || '',
        startDate: event.start?.dateTime || event.start?.date,
        endDate: event.end?.dateTime || event.end?.date,
        allDay: !event.start?.dateTime,
        location: event.location || '',
        isCalendarEvent: true,
        completed: false,
        participants: event.attendees?.map(a => ({ pseudo: a.email, avatar: '👤' })) || [],
      }));

      setGoogleEvents(events);
      setLastSync(new Date().toISOString());

      // Sauvegarder dans Supabase pour persistance
      if (userId && events.length > 0) {
        // D'abord supprimer les anciens événements Google
        await supabase
          .from('calendar_events')
          .delete()
          .eq('user_id', userId)
          .eq('provider', 'google');

        // Puis insérer les nouveaux
        await supabase.from('calendar_events').insert(
          events.map(e => ({
            id: e.id,
            user_id: userId,
            provider: 'google',
            google_id: e.googleId,
            title: e.title,
            description: e.description,
            start_date: e.startDate,
            end_date: e.endDate,
            all_day: e.allDay,
            location: e.location,
            participants: e.participants,
          }))
        );

        // Mettre à jour last_sync
        await supabase.from('calendar_connections').update({
          last_sync: new Date().toISOString()
        }).eq('user_id', userId).eq('provider', 'google');
      }

      return events;
    } catch (err) {
      console.error('Erreur fetchGoogleEvents:', err);
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
        .eq('provider', 'google')
        .single();

      if (data) {
        await fetchGoogleEvents(data.access_token, data.refresh_token);
      }
    } catch (err) {
      console.error('Erreur sync:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isConnected, fetchGoogleEvents]);

  return {
    isConnected,
    isLoading,
    googleEvents,
    lastSync,
    error,
    
    connectGoogle,
    disconnectGoogle,
    handleOAuthCallback,
    syncNow,
    
    getAuthUrl,
  };
};

export default useGoogleCalendar;
