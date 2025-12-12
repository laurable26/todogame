import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { requestNotificationPermission, setupMessageListener } from '../firebase';

export const useNotifications = (userId) => {
  const [notificationStatus, setNotificationStatus] = useState('loading'); // loading, enabled, disabled, denied
  const [fcmToken, setFcmToken] = useState(null);
  const [inAppNotification, setInAppNotification] = useState(null); // Pour afficher dans l'app

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

  // Jouer un son de notification
  const playNotificationSound = useCallback(() => {
    try {
      // Créer un son avec l'API Web Audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Créer deux bips courts et agréables
      const playBeep = (startTime, frequency) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.15);
      };
      
      const now = audioContext.currentTime;
      playBeep(now, 880);        // La (A5)
      playBeep(now + 0.18, 1108); // Do# (C#6)
      
    } catch (error) {
      console.log('Impossible de jouer le son:', error);
    }
  }, []);

  // Écouter les messages en premier plan
  useEffect(() => {
    if (notificationStatus !== 'enabled') {
      return;
    }
    
    console.log('Configuration du listener de messages...');
    
    const unsubscribe = setupMessageListener((payload) => {
      console.log('Notification reçue dans l\'app:', payload);
      
      // Jouer le son
      playNotificationSound();
      
      setInAppNotification({
        title: payload.notification?.title || 'ToDoGame',
        body: payload.notification?.body || '',
        timestamp: Date.now()
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [notificationStatus, playNotificationSound]);

  // Fermer la notification in-app
  const dismissInAppNotification = useCallback(() => {
    setInAppNotification(null);
  }, []);

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
    inAppNotification,
    dismissInAppNotification,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
};
