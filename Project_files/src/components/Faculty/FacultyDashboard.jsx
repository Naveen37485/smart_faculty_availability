// ============================================================
//  FacultyDashboard.jsx — Faculty main view
//
//  Two big action buttons: AVAILABLE / ABSENT
//  • ABSENT  → saves status, signs out immediately
//  • AVAILABLE → saves status, navigates to RoomSelection
//  • If already available, shows current status + change options
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import toast from "react-hot-toast";

import { auth, db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Shared/Navbar";
import NotificationListener from "../Shared/Notifications";

export default function FacultyDashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStatus, setCurrentStatus] = useState(null); // "available" | "absent" | null
  const [roomAssigned,  setRoomAssigned]  = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [acting,        setActing]        = useState(false);

  // ── Real-time listener on this faculty's status doc ──────────
  useEffect(() => {
    if (!currentUser) return;

    const docRef = doc(db, "faculty_status", currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrentStatus(data.status);
        setRoomAssigned(data.room_assigned || null);
      } else {
        setCurrentStatus(null);
        setRoomAssigned(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ── Handle AVAILABLE ─────────────────────────────────────────
  const handleAvailable = async () => {
    setActing(true);
    try {
      await setDoc(
        doc(db, "faculty_status", currentUser.uid),
        {
          uid:           currentUser.uid,
          name:          userProfile?.name || "",
          status:        "available",
          room_assigned: null,
        },
        { merge: true }
      );
      toast.success("Status set to Available!");
      navigate("/faculty/room-selection");
    } catch (err) {
      console.error("[Faculty] Available error:", err);
      toast.error("Failed to update status.");
    } finally {
      setActing(false);
    }
  };

  // ── Handle ABSENT ────────────────────────────────────────────
  const handleAbsent = async () => {
    setActing(true);
    try {
      await setDoc(
        doc(db, "faculty_status", currentUser.uid),
        {
          uid:           currentUser.uid,
          name:          userProfile?.name || "",
          status:        "absent",
          room_assigned: null,
        },
        { merge: true }
      );
      toast.success("Marked as Absent. Logging out…");
      // Short delay so toast is visible before logout
      setTimeout(async () => {
        await signOut(auth);
      }, 1500);
    } catch (err) {
      console.error("[Faculty] Absent error:", err);
      toast.error("Failed to update status.");
      setActing(false);
    }
  };

  // ── Go to room selection (already available) ─────────────────
  const handleGoToRoomSelection = () => {
    navigate("/faculty/room-selection");
  };

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh" }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <NotificationListener />
      <Navbar />

      <div
        style={{
          maxWidth:       "700px",
          margin:         "0 auto",
          padding:        "2.5rem 1.5rem",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          gap:            "2rem",
        }}
      >
        {/* Welcome */}
        <div className="fade-in" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👨‍🏫</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>
            Hello, {userProfile?.name || "Faculty"}!
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.4rem", fontSize: "0.9rem" }}>
            Mark your availability for today.
          </p>
        </div>

        {/* Current Status Banner */}
        {currentStatus && (
          <div
            className="glass-card fade-in"
            style={{
              width:      "100%",
              padding:    "1rem 1.5rem",
              display:    "flex",
              alignItems: "center",
              gap:        "0.75rem",
              borderColor: currentStatus === "available" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)",
              background:  currentStatus === "available"
                ? "rgba(16,185,129,0.08)"
                : "rgba(239,68,68,0.08)",
            }}
          >
            <span
              className="pulse-dot"
              style={{
                background: currentStatus === "available" ? "#10b981" : "#ef4444",
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                Current Status:{" "}
                <span style={{ color: currentStatus === "available" ? "#10b981" : "#ef4444" }}>
                  {currentStatus === "available" ? "Available ✓" : "Absent"}
                </span>
              </div>
              {roomAssigned && (
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                  Assigned Room: <strong style={{ color: "var(--primary-light)" }}>Room {roomAssigned}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          className="fade-in"
          style={{
            display:  "grid",
            gridTemplateColumns: "1fr 1fr",
            gap:      "1.5rem",
            width:    "100%",
          }}
        >
          {/* AVAILABLE */}
          <button
            id="btn-available"
            onClick={handleAvailable}
            disabled={acting}
            style={{
              padding:      "2.5rem 1rem",
              borderRadius: "1.25rem",
              border:       "2px solid rgba(16,185,129,0.4)",
              background:   "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.08))",
              color:        "#10b981",
              cursor:       acting ? "not-allowed" : "pointer",
              display:      "flex",
              flexDirection:"column",
              alignItems:   "center",
              gap:          "0.75rem",
              transition:   "var(--transition)",
              opacity:      acting ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!acting) {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(16,185,129,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <span style={{ fontSize: "3.5rem" }}>✅</span>
            <span style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "0.05em" }}>AVAILABLE</span>
            <span style={{ fontSize: "0.75rem", opacity: 0.8, color: "var(--text-secondary)" }}>
              I am present today
            </span>
          </button>

          {/* ABSENT */}
          <button
            id="btn-absent"
            onClick={handleAbsent}
            disabled={acting}
            style={{
              padding:      "2.5rem 1rem",
              borderRadius: "1.25rem",
              border:       "2px solid rgba(239,68,68,0.4)",
              background:   "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(220,38,38,0.08))",
              color:        "#ef4444",
              cursor:       acting ? "not-allowed" : "pointer",
              display:      "flex",
              flexDirection:"column",
              alignItems:   "center",
              gap:          "0.75rem",
              transition:   "var(--transition)",
              opacity:      acting ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!acting) {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(239,68,68,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <span style={{ fontSize: "3.5rem" }}>❌</span>
            <span style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "0.05em" }}>ABSENT</span>
            <span style={{ fontSize: "0.75rem", opacity: 0.8, color: "var(--text-secondary)" }}>
              I am not available
            </span>
          </button>
        </div>

        {/* If already available — quick link to change room */}
        {currentStatus === "available" && (
          <button
            id="btn-change-room"
            onClick={handleGoToRoomSelection}
            className="btn-secondary"
            style={{ width: "100%" }}
          >
            🚪 Change Room Selection
          </button>
        )}

        {/* Info note */}
        <div
          style={{
            width:        "100%",
            padding:      "0.875rem 1rem",
            borderRadius: "0.75rem",
            background:   "rgba(99,102,241,0.07)",
            border:       "1px solid rgba(99,102,241,0.15)",
            fontSize:     "0.8rem",
            color:        "var(--text-secondary)",
            textAlign:    "center",
          }}
        >
          ⚠️ Selecting <strong style={{ color: "#ef4444" }}>ABSENT</strong> will automatically log you out.
        </div>
      </div>
    </div>
  );
}
