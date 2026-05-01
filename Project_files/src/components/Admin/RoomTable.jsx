// ============================================================
//  RoomTable.jsx — Admin's main room management table
//
//  • Real-time onSnapshot on rooms collection
//  • Red row highlight for rooms with students but no faculty
//  • "Assign Faculty" opens AssignModal
//  • "Library" marks room as assigned to library + notifies students
// ============================================================

import React, { useState, useEffect } from "react";
import {
  collection, onSnapshot, doc, updateDoc, query, orderBy,
  where, getDocs, getDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";

import { db, sendNotification } from "../../firebase/firebaseConfig";
import AssignModal from "./AssignModal";

export default function RoomTable() {
  const [rooms,       setRooms]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeRoom,  setActiveRoom]  = useState(null); // room open in AssignModal
  const [processing,  setProcessing]  = useState(null); // room_no being processed for library

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

  // ── Determine if a row needs alert (red) styling ──────────────
  const isAlertRow = (room) =>
    room.students_present &&
    !room.faculty_assigned &&
    !room.assigned_to_library;

  // ── Handle Library Assignment ─────────────────────────────────
  const handleLibrary = async (room) => {
    setProcessing(room.room_no);
    try {
      // 1. Mark room as library
      await updateDoc(doc(db, "rooms", room.room_no), {
        assigned_to_library: true,
        faculty_assigned:    null,
      });

      // 2. Notify all students in this class/section
      const studentsQuery = query(
        collection(db, "students"),
        where("class",   "==", room.class   || ""),
        where("section", "==", room.section || "")
      );
      const studentSnap = await getDocs(studentsQuery);

      const notifyPromises = studentSnap.docs.map(async (sDoc) => {
        const sData = sDoc.data();
        const userSnap = await getDoc(doc(db, "users", sData.uid));
        if (userSnap.exists()) {
          const { fcm_token } = userSnap.data();
          if (fcm_token) {
            await sendNotification(
              sData.uid,
              fcm_token,
              "Go to Library",
              `Please go to the Library. (${room.class} ${room.section})`
            );
          }
        }
      });
      await Promise.all(notifyPromises);

      toast.success(`Room ${room.room_no} marked as Library. Students notified.`);
    } catch (err) {
      console.error("[RoomTable] Library error:", err);
      toast.error("Failed to mark as Library.");
    } finally {
      setProcessing(null);
    }
  };

  // ── Clear room assignment (remove faculty/library) ────────────
  const handleClearRoom = async (room) => {
    try {
      await updateDoc(doc(db, "rooms", room.room_no), {
        faculty_assigned:    null,
        assigned_to_library: false,
      });
      toast.success(`Room ${room.room_no} cleared.`);
    } catch (err) {
      toast.error("Failed to clear room.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <div className="spinner" />
      </div>
    );
  }

  const alertCount = rooms.filter(isAlertRow).length;

  // ── Calculate Summary Bar Stats ──
  const totalRooms = rooms.length;
  const attendedCount = rooms.filter((r) => r.students_present && r.faculty_assigned).length;
  const libraryCount = rooms.filter((r) => r.assigned_to_library).length;
  const unattendedCount = rooms.filter((r) => r.students_present && !r.faculty_assigned && !r.assigned_to_library).length;

  return (
    <div>
      {/* ── Summary Bar ── */}
      <div style={{
        display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem",
        background: "rgba(15,23,42,0.6)", padding: "1.25rem", borderRadius: "0.75rem",
        border: "1px solid var(--border-color)", justifyContent: "space-between"
      }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Total Rooms</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{totalRooms}</div>
        </div>
        <div style={{ width: "1px", background: "var(--border-color)" }}></div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>✅ Attended</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{attendedCount}</div>
        </div>
        <div style={{ width: "1px", background: "var(--border-color)" }}></div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>🔴 Unattended</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{unattendedCount}</div>
        </div>
        <div style={{ width: "1px", background: "var(--border-color)" }}></div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>📚 Library</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{libraryCount}</div>
        </div>
      </div>

      {/* Table Header Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>
            🏫 Room Overview
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
            {rooms.length} rooms total · {alertCount} need attention
          </p>
        </div>

        {alertCount > 0 && (
          <div
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "0.5rem",
              padding:      "0.5rem 0.875rem",
              borderRadius: "0.5rem",
              background:   "rgba(239,68,68,0.12)",
              border:       "1px solid rgba(239,68,68,0.3)",
              color:        "#ef4444",
              fontSize:     "0.8rem",
              fontWeight:   600,
            }}
          >
            <span className="pulse-dot pulse-dot-red" />
            {alertCount} room{alertCount !== 1 ? "s" : ""} need faculty
          </div>
        )}
      </div>

      {/* Table */}
      {rooms.length === 0 ? (
        <div
          className="glass-card"
          style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🏫</div>
          <p>No rooms configured. Add rooms to the Firestore <code>rooms</code> collection.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              {/* Head */}
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    background:   "rgba(15,23,42,0.4)",
                  }}
                >
                  {["Room No", "Class", "Section", "Students Present", "Faculty Assigned", "Actions"].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding:     "0.875rem 1.25rem",
                        textAlign:   "left",
                        fontSize:    "0.72rem",
                        fontWeight:  700,
                        color:       "var(--text-muted)",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        whiteSpace:  "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rooms.map((room, idx) => {
                  const alert = isAlertRow(room);
                  return (
                    <tr
                      key={room.room_no}
                      id={`room-row-${room.room_no}`}
                      className={alert ? "row-alert" : ""}
                      style={{
                        borderBottom:  "1px solid var(--border-color)",
                        transition:    "background 0.2s",
                        background:    alert
                          ? undefined  // handled by .row-alert CSS
                          : idx % 2 === 0
                          ? "transparent"
                          : "rgba(255,255,255,0.01)",
                      }}
                    >
                      {/* Room No */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <span
                          style={{
                            fontWeight:   700,
                            fontSize:     "0.95rem",
                            color:        alert ? "#ef4444" : "var(--text-primary)",
                          }}
                        >
                          {room.room_no}
                        </span>
                      </td>

                      {/* Class */}
                      <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                        {room.class || "—"}
                      </td>

                      {/* Section */}
                      <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                        {room.section || "—"}
                      </td>

                      {/* Students Present */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        {room.students_present ? (
                          <span className="badge badge-success">✓ Present</span>
                        ) : (
                          <span className="badge" style={{ background: "rgba(100,116,139,0.15)", color: "var(--text-muted)" }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Faculty Assigned */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        {room.assigned_to_library ? (
                          <span className="badge badge-warning">📚 Library</span>
                        ) : room.faculty_assigned ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span className="badge badge-faculty">{room.faculty_assigned}</span>
                            <button
                              onClick={() => handleClearRoom(room)}
                              style={{
                                background: "none",
                                border:     "none",
                                color:      "var(--text-muted)",
                                cursor:     "pointer",
                                fontSize:   "0.75rem",
                                padding:    "0.2rem",
                              }}
                              title="Clear assignment"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Not assigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        {alert && (
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {/* Assign Faculty */}
                            <button
                              id={`assign-faculty-btn-${room.room_no}`}
                              onClick={() => setActiveRoom(room)}
                              className="btn-primary"
                              style={{ padding: "0.4rem 0.875rem", fontSize: "0.78rem" }}
                            >
                              👨‍🏫 Assign Faculty
                            </button>

                            {/* Library */}
                            <button
                              id={`library-btn-${room.room_no}`}
                              onClick={() => handleLibrary(room)}
                              className="btn-secondary"
                              disabled={processing === room.room_no}
                              style={{ padding: "0.4rem 0.875rem", fontSize: "0.78rem" }}
                            >
                              {processing === room.room_no ? "…" : "📚 Library"}
                            </button>
                          </div>
                        )}

                        {/* Clear library assignment if already library */}
                        {room.assigned_to_library && (
                          <button
                            onClick={() => handleClearRoom(room)}
                            className="btn-secondary"
                            style={{ padding: "0.4rem 0.875rem", fontSize: "0.78rem" }}
                          >
                            Clear
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Faculty Modal */}
      {activeRoom && (
        <AssignModal
          room={activeRoom}
          onClose={() => setActiveRoom(null)}
          onAssigned={() => setActiveRoom(null)}
        />
      )}
    </div>
  );
}
