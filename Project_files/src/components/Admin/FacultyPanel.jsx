// ============================================================
//  FacultyPanel.jsx — Left sidebar showing present/absent faculty
//  Uses real-time onSnapshot listener on faculty_status collection
// ============================================================

import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

export default function FacultyPanel() {
  const [facultyList, setFacultyList] = useState([]);
  const [loading,     setLoading]     = useState(true);

  // ── Real-time listener on faculty_status ────────────────────
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "faculty_status"), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFacultyList(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const presentFaculty = facultyList.filter((f) => f.status === "available");
  const absentFaculty  = facultyList.filter((f) => f.status === "absent");

  return (
    <aside
      style={{
        width:       "280px",
        minWidth:    "260px",
        background:  "var(--glass-bg)",
        borderRight: "1px solid var(--glass-border)",
        height:      "calc(100vh - 64px)",
        overflowY:   "auto",
        position:    "sticky",
        top:         "64px",
        flexShrink:  0,
        padding:     "1.5rem 1.25rem",
        display:     "flex",
        flexDirection: "column",
        gap:         "1.5rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.1rem" }}>👥</span>
        <h2 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
          Faculty Status
        </h2>
        {/* Live indicator */}
        <span className="pulse-dot pulse-dot-green" style={{ marginLeft: "auto" }} title="Live" />
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "2rem" }}>
          <div className="spinner" style={{ width: "1.5rem", height: "1.5rem" }} />
        </div>
      ) : (
        <>
          {/* ── Present Faculty ── */}
          <div>
            <div className="section-title" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span className="pulse-dot pulse-dot-green" />
              Present ({presentFaculty.length})
            </div>

            {presentFaculty.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "1rem 0" }}>
                No faculty present
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {presentFaculty.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding:      "0.625rem 0.75rem",
                      borderRadius: "0.5rem",
                      background:   "rgba(16,185,129,0.08)",
                      border:       "1px solid rgba(16,185,129,0.2)",
                      display:      "flex",
                      alignItems:   "center",
                      gap:          "0.5rem",
                    }}
                  >
                    {/* Avatar initial */}
                    <div
                      style={{
                        width:          "28px",
                        height:         "28px",
                        borderRadius:   "50%",
                        background:     "rgba(16,185,129,0.25)",
                        color:          "#10b981",
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        fontWeight:     700,
                        fontSize:       "0.75rem",
                        flexShrink:     0,
                      }}
                    >
                      {f.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize:     "0.825rem",
                          fontWeight:   600,
                          color:        "var(--text-primary)",
                          whiteSpace:   "nowrap",
                          overflow:     "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {f.name || "—"}
                      </div>
                      {f.room_assigned && (
                        <div style={{ fontSize: "0.7rem", color: "#10b981", marginTop: "1px" }}>
                          Room {f.room_assigned}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Absent Faculty ── */}
          <div>
            <div className="section-title" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span className="pulse-dot pulse-dot-red" />
              Absent ({absentFaculty.length})
            </div>

            {absentFaculty.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "1rem 0" }}>
                No absent faculty
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {absentFaculty.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding:      "0.625rem 0.75rem",
                      borderRadius: "0.5rem",
                      background:   "rgba(239,68,68,0.06)",
                      border:       "1px solid rgba(239,68,68,0.15)",
                      display:      "flex",
                      alignItems:   "center",
                      gap:          "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width:          "28px",
                        height:         "28px",
                        borderRadius:   "50%",
                        background:     "rgba(239,68,68,0.15)",
                        color:          "#ef4444",
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        fontWeight:     700,
                        fontSize:       "0.75rem",
                        flexShrink:     0,
                      }}
                    >
                      {f.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div
                      style={{
                        fontSize:     "0.825rem",
                        fontWeight:   500,
                        color:        "var(--text-secondary)",
                        whiteSpace:   "nowrap",
                        overflow:     "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {f.name || "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary count */}
          <div
            style={{
              marginTop:    "auto",
              padding:      "0.75rem",
              borderRadius: "0.5rem",
              background:   "rgba(15,23,42,0.5)",
              border:       "1px solid var(--border-color)",
              fontSize:     "0.75rem",
              color:        "var(--text-muted)",
              textAlign:    "center",
            }}
          >
            Total: {facultyList.length} faculty
          </div>
        </>
      )}
    </aside>
  );
}
