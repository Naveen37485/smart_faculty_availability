// ============================================================
//  Notifications.jsx — FCM Foreground Message Handler
//  Listens for foreground FCM messages and shows them as toasts.
//  Mount this once inside any logged-in dashboard.
// ============================================================

import { useEffect } from "react";
import toast from "react-hot-toast";
import { onForegroundMessage } from "../../firebase/firebaseConfig";

export default function NotificationListener() {
  useEffect(() => {
    // Subscribe to foreground FCM messages
    const unsubscribe = onForegroundMessage((payload) => {
      const title = payload?.notification?.title || payload?.data?.title || "Notification";
      const body  = payload?.notification?.body  || payload?.data?.message || "";

      // Show toast with notification content
      toast(
        (t) => (
          <div>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>{title}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{body}</div>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                marginTop: "8px",
                fontSize:  "0.75rem",
                color:     "var(--primary-light)",
                background: "none",
                border:    "none",
                cursor:    "pointer",
                padding:   0,
              }}
            >
              Dismiss
            </button>
          </div>
        ),
        {
          duration: 8000,
          icon:     "🔔",
        }
      );
    });

    // Cleanup when component unmounts
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // This component renders nothing — it's purely a listener
  return null;
}
