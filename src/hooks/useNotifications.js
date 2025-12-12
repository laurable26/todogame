import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { requestNotificationPermission, onMessageListener } from '../firebase';

export const useNotifications = (userId) => {
  const [notificationStatus, setNotificationStatus] = useState('loading'); // loading, enabled, disabled, denied
  const [fcmToken, setFcmToken] = useState(null);

  // Vérifier le statut au chargement
  useEffect(() => {
    const checkStatus = async () => {
      // Vérifier la permission du navigateur
      if (!('Notification' in window)) {
        setNotificationStatus('disabled');
        return;
      }

      if (Notification.permission === 'denied') {
        setNotificationStatus('denied');
        return;
      }

      // Vérifier si on a un token en base
      if (userId) {
        try {
          const { data } = await supabase
            .from('push_subscriptions')
            .select('fcm_token')
            .eq('user_id', userId)
            .single();

          if (data?.fcm_token) {
            setFcmToken(data.fcm_token);
            setNotificationStatus('enabled');
          } else {
            setNotificationStatus('disabled');
          }
        } catch (error) {
          setNotificationStatus('disabled');
        }
      } else {
        setNotificationStatus('disabled');
      }
    };

    checkStatus();
  }, [userId]);

  // Écouter les messages en premier plan
  useEffect(() => {
    const setupListener = async () => {
      try {
        const payload = await onMessageListener();
        if (payload) {
          if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || 'ToDoGame', {
              body: payload.notification?.body
            });
          }
        }
      } catch (error) {
        console.error('Erreur listener:', error);
      }
    };
    
    if (notificationStatus === 'enabled') {
      setupListener();
    }
  }, [notificationStatus]);

  // Activer les notifications
  const enableNotifications = async () => {
    if (!userId) {
      console.log('Utilisateur non connecté');
      return false;
    }

    try {
      console.log('Demande de permission...');
      const token = await requestNotificationPermission();
      
      if (token) {
        console.log('Token obtenu:', token);
        
        // Sauvegarder le token dans Supabase
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: userId,
            fcm_token: token,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Erreur sauvegarde token:', error);
          return false;
        }

        setFcmToken(token);
        setNotificationStatus('enabled');
        console.log('Notifications activées et token sauvegardé');
        return true;
      } else {
        console.log('Pas de token obtenu');
        if (Notification.permission === 'denied') {
          setNotificationStatus('denied');
        }
        return false;
      }
    } catch (error) {
      console.error('Erreur activation notifications:', error);
      return false;
    }
  };

  // Désactiver les notifications
  const disableNotifications = async () => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Erreur désactivation:', error);
        return false;
      }

      setFcmToken(null);
      setNotificationStatus('disabled');
      console.log('Notifications désactivées');
      return true;
    } catch (error) {
      console.error('Erreur:', error);
      return false;
    }
  };

  return {
    notificationStatus, // 'loading', 'enabled', 'disabled', 'denied'
    fcmToken,
    enableNotifications,
    disableNotifications,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
};
