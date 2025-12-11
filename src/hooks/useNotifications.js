import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { requestNotificationPermission, onMessageListener } from '../firebase';

export const useNotifications = (userId) => {
  const [notificationStatus, setNotificationStatus] = useState('default'); // default, granted, denied
  const [fcmToken, setFcmToken] = useState(null);

  // Vérifier le statut actuel des notifications
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  // Écouter les messages en premier plan
  useEffect(() => {
    const setupListener = async () => {
      try {
        const payload = await onMessageListener();
        if (payload) {
          // Afficher une notification même en premier plan
          if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || 'ToDoGame', {
              body: payload.notification?.body,
              icon: '/icon-192.png'
            });
          }
        }
      } catch (error) {
        console.error('Erreur listener:', error);
      }
    };
    
    if (notificationStatus === 'granted') {
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
      const token = await requestNotificationPermission();
      
      if (token) {
        setFcmToken(token);
        setNotificationStatus('granted');
        
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

        console.log('Notifications activées et token sauvegardé');
        return true;
      } else {
        setNotificationStatus(Notification.permission);
        return false;
      }
    } catch (error) {
      console.error('Erreur activation notifications:', error);
      return false;
    }
  };

  // Désactiver les notifications (supprimer le token de la DB)
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
      console.log('Notifications désactivées');
      return true;
    } catch (error) {
      console.error('Erreur:', error);
      return false;
    }
  };

  // Vérifier si l'utilisateur a un token enregistré
  const checkExistingSubscription = async () => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('fcm_token')
        .eq('user_id', userId)
        .single();

      if (data?.fcm_token) {
        setFcmToken(data.fcm_token);
        return data.fcm_token;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  return {
    notificationStatus,
    fcmToken,
    enableNotifications,
    disableNotifications,
    checkExistingSubscription,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
};
