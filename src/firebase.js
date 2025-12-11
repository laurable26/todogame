import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDHnnn0F0XDnv5tRhvGtSTJ_y2_VvaKWY4",
  authDomain: "todogame-notifications.firebaseapp.com",
  projectId: "todogame-notifications",
  storageBucket: "todogame-notifications.firebasestorage.app",
  messagingSenderId: "722749884420",
  appId: "1:722749884420:web:ee330f300583813d0ecd51"
};

const VAPID_KEY = 'BJdoml-1fyeoANeT62SqDZrTzpvdr-J_dPu5wo25EkfTZvB8fIwz3oq36sXPWF9prE0PQ-vhHw_bSqvF8V-boCU';

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Obtenir l'instance de messaging (uniquement côté client)
let messaging = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  messaging = getMessaging(app);
}

// Demander la permission et obtenir le token
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      console.log('Messaging non disponible');
      return null;
    }

    // Vérifier si les notifications sont supportées
    if (!('Notification' in window)) {
      console.log('Notifications non supportées');
      return null;
    }

    // Demander la permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permission refusée');
      return null;
    }

    // Enregistrer le Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker enregistré:', registration);

    // Obtenir le token FCM
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    console.log('Token FCM obtenu:', token);
    return token;
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error);
    return null;
  }
};

// Écouter les messages en premier plan
export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }
    
    onMessage(messaging, (payload) => {
      console.log('Message reçu en premier plan:', payload);
      resolve(payload);
    });
  });
};

export { messaging };
