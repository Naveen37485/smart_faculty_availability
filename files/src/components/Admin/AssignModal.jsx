// ============================================================
//  AssignModal.jsx — Modal for Admin to assign faculty to a room
//
//  Props:
//    room         : room object being assigned
//    onClose      : function to close the modal
//    onAssigned   : function called after successful assignment
// ============================================================

import React, { useState, useEffect } from "react";
import {
  collection, onSnapshot, doc, updateDoc, setDoc,
  query, where, getDocs, getDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";

import { db, sendNotification } from "../../firebase/firebaseConfig";

export default function AssignModal({ room, onClose, onAssigned }) {
  const [availableFaculty, setAvailableFaculty] = useState([]);
  const [selectedFaculty,  setSelectedFaculty]  = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [assigning,        setAssigning]        = useState(false);

  // ── Fetch available faculty in real-time ─────────────────────
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "faculty_status"), (snap) => {
      const available = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((f) => f.status === "available");
      setAvailableFaculty(available);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Handle assignment ─────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedFaculty) return toast.error("Please select a faculty member.");
    setAssigning(true);

    try {
      // 1. Update the room doc
      await updateDoc(doc(db, "rooms", room.room_no), {
        faculty_assigned: selectedFaculty.name,
      });

      // 2. Update faculty_status doc with assigned room
      await setDoc(
        doc(db, "faculty_status", selectedFaculty.uid),
        { room_assigned: room.room_no },
        { merge: true }
      );

      // 3. Send notification to faculty
      //    The actual FCM push is handled by a Cloud Function
      //    watching the `notifications` collection.
      if (selectedFaculty.fcm_token) {
        await sendNotification(
          selectedFaculty.uid,
          selectedFaculty.fcm_token,
          "Room Assignment",
          `You have been assigned to Room ${room.room_no} by Admin.`
        );
      }

      // 4. Send notification to all students in this class/section
      const studentsQuery = query(
        collection(db, "students"),
        where("class",   "==", room.class   || ""),
        where("section", "==", room.section || "")
      );
      const studentSnap = await getDocs(studentsQuery);

      // Fetch fcm_token from users collection for each student
      const studentNotifyPromises = studentSnap.docs.map(async (sDoc) => {
        const sData = sDoc.data();
        const userSnap = await getDoc(doc(db, "users", sData.uid));
        if (userSnap.exists()) {
          const { fcm_token } = userSnap.data();
          if (fcm_token) {
            await sendNotification(
              sData.uid,
              fcm_token,
              "Faculty Assigned",
              `Your faculty has been assigned. Please go to Room ${room.room_no}.`
            );
          }
        }
      });
      await Promise.all(studentNotifyPromises);

      toast.success(`${selectedFaculty.name} assigned to Room ${room.room_no}!`);
      onAssigned && onAssigned();
      onClose();
    } catch (err) {
      console.error("[AssignModal] Error:", err);
      toast.error("Assignment failed. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card fade-in"
        style={{ width: "100%", maxWidth: "480px", padding: "2rem", margin: "1rem" }}
        onClick={(e) => e.stopPropagation()} // Prevent close on card click
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>
              Assign Faculty
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
              Room {room.room_no} — {room.class} {room.section}
            </p>
          </div>
          <button
            id="close-assign-modal"
            onClick={onClose}
            style={{
              background: "none",
              border:     "none",
              color:      "var(--text-muted)",
              cursor:     "pointer",
              fontSize:   "1.4rem",
              lineHeight: 1,
              padding:    "0.25rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Faculty List */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <div className="spinner" />
          </div>
        ) : availableFaculty.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>😔</div>
            <p style={{ fontSize: "0.875rem" }}>No available faculty at the moment.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem", maxHeight: "320px", overflowY: "auto" }}>
            <p className="section-title" style={{ marginBottom: "0.5rem" }}>
              Available Faculty ({availableFaculty.length})
            </p>
            {availableFaculty.map((faculty) => (
              <div
                key={faculty.id}
                id={`faculty-option-${faculty.uid}`}
                onClick={() => setSelectedFaculty(faculty)}
                style={{
                  padding:      "0.875rem 1rem",
                  borderRadius: "0.625rem",
                  border:       `2px solid ${selectedFaculty?.uid === faculty.uid ? "var(--primary)" : "var(--border-color)"}`,
                  background:   selectedFaculty?.uid === faculty.uid
                    ? "rgba(99,102,241,0.1)"
                    : "rgba(15,23,42,0.4)",
                  cursor:       "pointer",
                  transition:   "var(--transition)",
                  display:      "flex",
                  alignItems:   "center",
                  gap:          "0.75rem",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width:          "36px",
                    height:         "36px",
                    borderRadius:   "50%",
                    background:     "linear-gradient(135deg, var(--primary-dark), var(--primary))",
                    color:          "#fff",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    fontWeight:     700,
                    fontSize:       "0.9rem",
                    flexShrink:     0,
                  }}
                >
                  {faculty.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {faculty.name}
                  </div>
                  {faculty.room_assigned && (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Currently in Room {faculty.room_assigned}
                    </div>
                  )}
                </div>
                {/* Checkmark for selected */}
                {selectedFaculty?.uid === faculty.uid && (
                  <div style={{ marginLeft: "auto", color: "var(--primary-light)", fontSize: "1.1rem" }}>✓</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Buttons */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            id="cancel-assign-btn"
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1 }}
            disabled={assigning}
          >
            Cancel
          </button>
          <button
            id="confirm-assign-btn"
            onClick={handleAssign}
            className="btn-primary"
            style={{ flex: 1 }}
            disabled={assigning || !selectedFaculty}
          >
            {assigning ? "Assigning…" : "Assign Faculty"}
          </button>
        </div>
      </div>
    </div>
  );
}
