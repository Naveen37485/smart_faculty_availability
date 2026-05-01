// ============================================================
//  RoomSelection.jsx — Faculty room selection screen
//
//  • Real-time grid of all rooms from Firestore
//  • Green = Free, Red = Occupied
//  • Faculty can click a free room to select it
//  • Can also skip room selection and remain "available"
//  • Receives admin-assigned room notifications
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, onSnapshot, doc, setDoc, updateDoc, query, orderBy,
} from "firebase/firestore";
import toast from "react-hot-toast";

import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Shared/Navbar";
import RoomCard from "../Shared/RoomCard";
import NotificationListener from "../Shared/Notifications";

export default function RoomSelection() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [rooms,        setRooms]        = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentRoom,  setCurrentRoom]  = useState(null); // already assigned
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  // ── Real-time rooms listener ──────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("room_no"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRooms(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Real-time listener on this faculty's status ───────────────
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(doc(db, "faculty_status", currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrentRoom(data.room_assigned || null);
        setSelectedRoom(data.room_assigned || null);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // ── Handle room card click ────────────────────────────────────
  const handleRoomClick = (room) => {
    // Check if room is already occupied by a faculty
    if (room.faculty_assigned && room.room_no !== currentRoom) {
      toast.error("This room already has a faculty assigned! Please select another room.");
      return;
    }
    // Toggle deselect if clicking same room
    setSelectedRoom((prev) => (prev === room.room_no ? null : room.room_no));
  };

  // ── Save room selection ───────────────────────────────────────
  const handleSaveRoom = async () => {
    if (!selectedRoom) {
      toast.error("Please select a room first.");
      return;
    }
    setSaving(true);
    try {
      const roomRef = doc(db, "rooms", selectedRoom);

      // Unassign previous room if different
      if (currentRoom && currentRoom !== selectedRoom) {
        await updateDoc(doc(db, "rooms", currentRoom), { faculty_assigned: null });
      }

      // Assign new room
      await updateDoc(roomRef, {
        faculty_assigned: userProfile?.name || currentUser.uid,
      });

      // Update faculty_status doc
      await setDoc(
        doc(db, "faculty_status", currentUser.uid),
        { room_assigned: selectedRoom },
        { merge: true }
      );

      setCurrentRoom(selectedRoom);
      toast.success(`Room ${selectedRoom} selected successfully!`);
    } catch (err) {
      console.error("[RoomSelection] Save error:", err);
      toast.error("Failed to save room. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Skip — stay available without room ────────────────────────
  const handleSkip = async () => {
    // If already has a room, clear it
    if (currentRoom) {
      setSaving(true);
      try {
        await updateDoc(doc(db, "rooms", currentRoom), { faculty_assigned: null });
        await setDoc(
          doc(db, "faculty_status", currentUser.uid),
          { room_assigned: null },
          { merge: true }
        );
        setCurrentRoom(null);
        setSelectedRoom(null);
        toast.success("Room cleared. You are still marked as Available.");
      } catch (err) {
        toast.error("Failed to clear room.");
      } finally {
        setSaving(false);
      }
    }
    navigate("/faculty/dashboard");
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

  const freeCount     = rooms.filter((r) => r.students_present === false).length;
  const occupiedCount = rooms.length - freeCount;

  return (
    <div className="page-wrapper">
      <NotificationListener />
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Header */}
        <div className="fade-in" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
                🚪 Select Your Room
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Choose a free room or skip to remain available without a room.
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div
                style={{
                  padding:      "0.5rem 1rem",
                  borderRadius: "0.625rem",
                  background:   "rgba(16,185,129,0.1)",
                  border:       "1px solid rgba(16,185,129,0.25)",
                  fontSize:     "0.8rem",
                  color:        "#10b981",
                  fontWeight:   600,
                }}
              >
                🟢 {freeCount} Free
              </div>
              <div
                style={{
                  padding:      "0.5rem 1rem",
                  borderRadius: "0.625rem",
                  background:   "rgba(239,68,68,0.1)",
                  border:       "1px solid rgba(239,68,68,0.25)",
                  fontSize:     "0.8rem",
                  color:        "#ef4444",
                  fontWeight:   600,
                }}
              >
                🔴 {occupiedCount} Occupied
              </div>
            </div>
          </div>

          {/* Currently assigned info */}
          {currentRoom && (
            <div
              style={{
                marginTop:    "1rem",
                padding:      "0.75rem 1rem",
                borderRadius: "0.5rem",
                background:   "rgba(99,102,241,0.1)",
                border:       "1px solid rgba(99,102,241,0.25)",
                fontSize:     "0.85rem",
                color:        "var(--primary-light)",
              }}
            >
              📍 Currently assigned to <strong>Room {currentRoom}</strong>
            </div>
          )}
        </div>

        {/* Room Grid */}
        {rooms.length === 0 ? (
          <div
            className="glass-card"
            style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏫</div>
            <p>No rooms configured yet. Ask admin to add rooms.</p>
          </div>
        ) : (
          <div
            className="fade-in"
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap:                 "1rem",
              marginBottom:        "2rem",
            }}
          >
            {rooms.map((room) => (
              <RoomCard
                key={room.room_no}
                room={room}
                selected={selectedRoom === room.room_no}
                onClick={handleRoomClick}
                clickable={true}
              />
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div
          className="glass-card"
          style={{
            padding:        "1.25rem 1.5rem",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            gap:            "1rem",
            flexWrap:       "wrap",
          }}
        >
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {selectedRoom
              ? `Selected: Room ${selectedRoom}`
              : "No room selected"}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              id="skip-room-btn"
              onClick={handleSkip}
              className="btn-secondary"
              disabled={saving}
            >
              Skip (No Room)
            </button>
            <button
              id="save-room-btn"
              onClick={handleSaveRoom}
              className="btn-primary"
              disabled={saving || !selectedRoom}
            >
              {saving ? "Saving…" : `Confirm Room ${selectedRoom || ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
