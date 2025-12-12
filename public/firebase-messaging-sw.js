// Service Worker pour Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Activer immédiatement le Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(clients.claim());
});

firebase.initializeApp({
  apiKey: "AIzaSyDHnnn0F0XDnv5tRhvGtSTJ_y2_VvaKWY4",
  authDomain: "todogame-notifications.firebaseapp.com",
  projectId: "todogame-notifications",
  storageBucket: "todogame-notifications.firebasestorage.app",
  messagingSenderId: "722749884420",
  appId: "1:722749884420:web:ee330f300583813d0ecd51"
});

const messaging = firebase.messaging();

// Gestion des notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notification reçue:', payload);
  
  const notificationTitle = payload.notification?.title || 'ToDoGame';
  const notificationOptions = {
    body: payload.notification?.body || 'Tu as un rappel !',
    tag: 'todogame-reminder',
    vibrate: [200, 100, 200],
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gestion du clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée');
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
