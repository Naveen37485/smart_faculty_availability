// ============================================================
//  firebase-messaging-sw.js — Firebase Cloud Messaging Service Worker
//
//  This file MUST be placed in the /public directory so it is
//  served from the root of your domain (e.g., /firebase-messaging-sw.js)
//
//  It handles FCM push notifications when the browser tab is
//  in the background or closed.
//
//  INSTRUCTIONS:
//  Replace YOUR_* values below with your actual Firebase config values.
//  These must match what you put in src/firebase/firebaseConfig.js
// ============================================================

// Import Firebase scripts for the service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ── Firebase Config (must match firebaseConfig.js) ───────────────
firebase.initializeApp({
  apiKey: "AIzaSyCR8MuQ5Air9veexYH05gGwo5giaijVTlQ",
  authDomain: "smart-faculty-system.firebaseapp.com",
  projectId: "smart-faculty-system",
  storageBucket: "smart-faculty-system.firebasestorage.app",
  messagingSenderId: "867084201074",
  appId: "1:867084201074:web:74ac8e151199343a7ca6eb",
});

const messaging = firebase.messaging();

// ── Background Message Handler ────────────────────────────────────
// This fires when the app is in the background or tab is closed.
// FCM will auto-display the notification using the `notification` payload.
// You can customize the display here.
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationOptions = {
    body:  payload.notification?.body || payload.data?.message || '',
    icon:  '/favicon.ico',
    badge: '/favicon.ico',
    data:  payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
