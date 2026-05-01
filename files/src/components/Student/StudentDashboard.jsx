// ============================================================
//  StudentDashboard.jsx — Student's Room Selection View
//
//  • Real-time grid of all rooms from Firestore
//  • Green = Free (no students), Red = Occupied (students present)
//  • Student clicks a free room to select it
//  • Modal pops up to select Class and Section
//  • Saves data to Firestore rooms/{room} and students/{uid}
// ============================================================

import React, { useState, useEffect } from "react";
import {
  collection, onSnapshot, doc, setDoc, updateDoc, query, orderBy, getDoc, where
} from "firebase/firestore";
import toast from "react-hot-toast";

import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Shared/Navbar";
import RoomCard from "../Shared/RoomCard";
import NotificationListener from "../Shared/Notifications";

const DEPARTMENTS = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Other"];
const CLASSES  = ["FY", "SY", "TY", "Final Year"];
const SECTIONS = ["A", "B", "C", "D"];

export default function StudentDashboard() {
  const { currentUser, userProfile } = useAuth();

  const [rooms,        setRooms]        = useState([]);
  const [currentRoom,  setCurrentRoom]  = useState(null); // the room student is currently in
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  // Modal State
  const [modalOpen,    setModalOpen]    = useState(false);
  const [targetRoom,   setTargetRoom]   = useState(null);
  const [formData,     setFormData]     = useState({ class: "", section: "" });

  // Notifications history for this student
  const [notifications, setNotifications] = useState([]);

  // ── Fetch Student's Current Room ─────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const fetchRecord = async () => {
      const snap = await getDoc(doc(db, "students", currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setCurrentRoom(data.room_no || null);
        setFormData({
          department: data.department || "",
          class: data.class || "",
          section: data.section || ""
        });
      }
    };
    fetchRecord();
  }, [currentUser]);

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

  // ── Real-time listener: notifications for this student ─────────
  useEffect(() => {
    if (!currentUser) return;
    // ... we still show notifications for the student, but in a side panel or just foreground
    // Since we are changing to a grid, let's keep the listener to show toast alerts.
    const q = query(
      collection(db, "notifications"),
      where("sent_to", "==", currentUser.uid),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(docs);
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const n = change.doc.data();
          const isRecent = n.timestamp && Date.now() - n.timestamp.toMillis() < 5000;
          if (isRecent) toast(n.message, { icon: "🔔", duration: 8000 });
        }
      });
    });
    return () => unsubscribe();
  }, [currentUser]);

  // ── Handle room card click ────────────────────────────────────
  const handleRoomClick = (room) => {
    // Cannot click an occupied room unless it's their own current room
    if (room.students_present && room.room_no !== currentRoom) {
      toast.error(`Room ${room.room_no} is already occupied by students.`);
      return;
    }
    setTargetRoom(room.room_no);
    setModalOpen(true);
  };

  // ── Save Class/Section for Room ───────────────────────────────
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!formData.department) return toast.error("Please select a Department.");
    if (!formData.class) return toast.error("Please select a Class.");
    if (!formData.section) return toast.error("Please select a Section.");

    setSaving(true);
    try {
      // 1. Update old room if switching
      if (currentRoom && currentRoom !== targetRoom) {
        await updateDoc(doc(db, "rooms", currentRoom), {
          students_present: false,
          department: null,
          class: null,
          section: null,
          faculty_assigned: null,
          assigned_to_library: false
        });
      }

      // 2. Update new room
      await updateDoc(doc(db, "rooms", targetRoom), {
        students_present: true,
        department: formData.department,
        class: formData.class,
        section: formData.section
      });

      // 3. Update students collection
      await setDoc(doc(db, "students", currentUser.uid), {
        uid: currentUser.uid,
        name: userProfile?.name || "",
        room_no: targetRoom,
        department: formData.department,
        class: formData.class,
        section: formData.section
      }, { merge: true });

      setCurrentRoom(targetRoom);
      setModalOpen(false);
      toast.success(`You are now seated in Room ${targetRoom}!`);
    } catch (err) {
      console.error("[StudentDashboard] Save error:", err);
      toast.error("Failed to assign room. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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

  const freeCount = rooms.filter((r) => !r.students_present).length;
  const occupiedCount = rooms.length - freeCount;

  // ── Determine Student Room Status ──
  const studentRoomData = rooms.find((r) => r.room_no === currentRoom);
  let statusMessage = null;
  let statusColor = "var(--text-secondary)";

  if (studentRoomData) {
    if (studentRoomData.assigned_to_library) {
      statusMessage = "📚 Please go to the Library";
      statusColor = "var(--warning)";
    } else if (studentRoomData.faculty_assigned) {
      statusMessage = `✅ Faculty assigned - Please go to Room ${currentRoom}`;
      statusColor = "var(--success)";
    } else if (studentRoomData.students_present) {
      statusMessage = "⏳ Waiting for faculty assignment";
      statusColor = "var(--warning)";
    }
  }

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
                👋 Welcome, {userProfile?.name || "Student"}!
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Select the room you are currently sitting in.
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div
                style={{
                  padding: "0.5rem 1rem", borderRadius: "0.625rem",
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                  fontSize: "0.8rem", color: "#10b981", fontWeight: 600,
                }}
              >
                🟢 {freeCount} Free
              </div>
              <div
                style={{
                  padding: "0.5rem 1rem", borderRadius: "0.625rem",
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                  fontSize: "0.8rem", color: "#ef4444", fontWeight: 600,
                }}
              >
                🔴 {occupiedCount} Occupied
              </div>
            </div>
          </div>

          {/* Currently assigned info & Status Message */}
          {currentRoom && (
            <div
              style={{
                marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "0.5rem",
                background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                fontSize: "0.85rem", color: "var(--primary-light)",
              }}
            >
              <div style={{ marginBottom: statusMessage ? "0.4rem" : "0" }}>
                📍 You are currently seated in <strong>Room {currentRoom}</strong>
              </div>
              {statusMessage && (
                <div style={{ color: statusColor, fontWeight: 600, fontSize: "0.9rem" }}>
                  {statusMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Room Grid */}
        {rooms.length === 0 ? (
          <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏫</div>
            <p>No rooms configured yet.</p>
          </div>
        ) : (
          <div
            className="fade-in"
            style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "1rem", marginBottom: "2rem",
            }}
          >
            {rooms.map((room) => (
              <RoomCard
                key={room.room_no}
                room={room}
                selected={currentRoom === room.room_no}
                onClick={handleRoomClick}
                clickable={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Class/Section Modal */}
      {modalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999
        }}>
          <div className="glass-card fade-in" style={{ width: "100%", maxWidth: "400px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>
              Select Room {targetRoom}
            </h2>
            <form onSubmit={handleSaveRoom} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="form-label" htmlFor="select-department">Department</label>
                <div style={{ position: "relative" }}>
                  <select
                    id="select-department"
                    className="select-field"
                    value={formData.department}
                    onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
                  >
                    <option value="">Choose department…</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>▾</div>
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="select-class">Class / Year</label>
                <div style={{ position: "relative" }}>
                  <select
                    id="select-class"
                    className="select-field"
                    value={formData.class}
                    onChange={(e) => setFormData((p) => ({ ...p, class: e.target.value }))}
                  >
                    <option value="">Choose class…</option>
                    {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>▾</div>
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="select-section">Section</label>
                <div style={{ position: "relative" }}>
                  <select
                    id="select-section"
                    className="select-field"
                    value={formData.section}
                    onChange={(e) => setFormData((p) => ({ ...p, section: e.target.value }))}
                  >
                    <option value="">Choose section…</option>
                    {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>▾</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? "Saving…" : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
