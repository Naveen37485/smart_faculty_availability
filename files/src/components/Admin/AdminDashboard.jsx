// ============================================================
//  AdminDashboard.jsx — Main admin layout
//  Left: FacultyPanel (fixed)
//  Right: RoomTable (scrollable)
// ============================================================

import React from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Shared/Navbar";
import NotificationListener from "../Shared/Notifications";
import FacultyPanel from "./FacultyPanel";
import RoomTable from "./RoomTable";

export default function AdminDashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="page-wrapper" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* FCM foreground listener */}
      <NotificationListener />

      {/* Top navbar */}
      <Navbar />

      {/* Page content: sidebar + main */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left Panel — Faculty Status ── */}
        <FacultyPanel />

        {/* ── Main Area — Room Table ── */}
        <main
          style={{
            flex:     1,
            overflowY: "auto",
            padding:  "2rem 1.75rem",
            minWidth: 0,
          }}
        >
          {/* Welcome banner */}
          <div
            className="glass-card fade-in"
            style={{
              padding:      "1.25rem 1.75rem",
              marginBottom: "1.75rem",
              background:   "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(99,102,241,0.08))",
              border:       "1px solid rgba(245,158,11,0.2)",
              display:      "flex",
              alignItems:   "center",
              gap:          "1rem",
            }}
          >
            <span style={{ fontSize: "2rem" }}>🛡️</span>
            <div>
              <h1 style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--text-primary)" }}>
                Admin Dashboard
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.15rem" }}>
                Welcome, {userProfile?.name || "Admin"} — manage faculty assignments in real-time.
              </p>
            </div>

            {/* Live badge */}
            <div
              style={{
                marginLeft:   "auto",
                display:      "flex",
                alignItems:   "center",
                gap:          "0.4rem",
                padding:      "0.35rem 0.75rem",
                borderRadius: "99px",
                background:   "rgba(16,185,129,0.1)",
                border:       "1px solid rgba(16,185,129,0.25)",
                fontSize:     "0.75rem",
                color:        "#10b981",
                fontWeight:   600,
                whiteSpace:   "nowrap",
              }}
            >
              <span className="pulse-dot pulse-dot-green" />
              LIVE
            </div>
          </div>

          {/* Room table */}
          <div className="fade-in">
            <RoomTable />
          </div>
        </main>
      </div>
    </div>
  );
}
