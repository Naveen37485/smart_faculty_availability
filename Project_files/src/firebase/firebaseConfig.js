// ============================================================
//  Firebase Configuration — Smart Faculty Notification System
// ============================================================
//
//  INSTRUCTIONS:
//  1. Go to https://console.firebase.google.com
//  2. Create (or open) your Firebase project
//  3. Add a Web App to the project
//  4. Copy your config values and replace the YOUR_* placeholders below
//  5. Enable Email/Password authentication in Firebase Console
//  6. Create a Firestore database in Firebase Console
//  7. Enable Cloud Messaging in Firebase Console and get your VAPID key
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// ── Replace these values with your Firebase project credentials ──
const firebaseConfig = {
  apiKey: "AIzaSyCR8MuQ5Air9veexYH05gGwo5giaijVTlQ",
  authDomain: "smart-faculty-system.firebaseapp.com",
  projectId: "smart-faculty-system",
  storageBucket: "smart-faculty-system.firebasestorage.app",
  messagingSenderId: "867084201074",
  appId: "1:867084201074:web:74ac8e151199343a7ca6eb",
  measurementId: "G-QSWH4HBP5B"
};

// ── Initialize Firebase Services ────────────────────────────────
export const app       = initializeApp(firebaseConfig);
export const auth      = getAuth(app);
export const db        = getFirestore(app);
export const messaging = getMessaging(app);

// ── FCM VAPID Public Key ─────────────────────────────────────────
const VAPID_KEY = "BM2FVgQ6cuUAQaVscSb9VI3G_V0WHRqAfBO8m7lecbfC9IVPpKw2Wg5l8wBrqnLFICwmhHb8oLubFFV_IrzglrU";

// ── Request Notification Permission & Get FCM Token ─────────────
export async function getFCMToken() {
  try {
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (currentToken) {
      console.log("[FCM] Token retrieved:", currentToken);
      return currentToken;
    } else {
      console.warn("[FCM] No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (err) {
    console.error("[FCM] Error retrieving token:", err);
    return null;
  }
}

// ── Foreground FCM Message Listener ─────────────────────────────
export function onForegroundMessage(onReceive) {
  return onMessage(messaging, (payload) => {
    console.log("[FCM] Foreground message received:", payload);
    onReceive(payload);
  });
}

// ── Send Notification (Firestore-based) ──────────────────────────
/**
 * Writes a notification document to Firestore.
 * A Firebase Cloud Function should listen to this collection
 * and send the actual FCM push via the FCM HTTP v1 API.
 *
 * This keeps the FCM server key safe (never exposed in client code).
 *
 * @param {string} toUid       - UID of the recipient user
 * @param {string} fcmToken    - FCM registration token of the recipient
 * @param {string} title       - Notification title
 * @param {string} message     - Notification body
 */
export async function sendNotification(toUid, fcmToken, title, message) {
  try {
    await addDoc(collection(db, "notifications"), {
      sent_to:   toUid,
      fcm_token: fcmToken,
      title,
      message,
      read:      false,
      timestamp: serverTimestamp(),
    });
    console.log(`[Notification] Queued for ${toUid}: ${message}`);
  } catch (error) {
    console.error("[Notification] Failed to queue:", error);
  }
}

export default app;
