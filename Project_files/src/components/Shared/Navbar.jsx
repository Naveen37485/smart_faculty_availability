// ============================================================
//  Navbar — Shared top navigation bar for all dashboards
// ============================================================

import React from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// Role-specific color theming
const ROLE_CONFIG = {
  student: { label: "Student",  badgeClass: "badge-student",  icon: "🎓" },
  faculty: { label: "Faculty",  badgeClass: "badge-faculty",  icon: "👨‍🏫" },
  admin:   { label: "Admin",    badgeClass: "badge-admin",    icon: "🛡️" },
};

export default function Navbar() {
  const { currentUser, userProfile, userRole, logout } = useAuth();
  const roleConfig = ROLE_CONFIG[userRole] || {};

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Logout failed. Try again.");
    }
  };

  return (
    <nav
      style={{
        background:   "var(--glass-bg)",
        borderBottom: "1px solid var(--glass-border)",
        backdropFilter: "blur(12px)",
        position:     "sticky",
        top:          0,
        zIndex:       100,
      }}
    >
      <div
        style={{
          maxWidth:  "1400px",
          margin:    "0 auto",
          padding:   "0 1.5rem",
          height:    "64px",
          display:   "flex",
          alignItems:    "center",
          justifyContent: "space-between",
        }}
      >
        {/* ── Brand ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width:      "36px",
              height:     "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              display:    "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize:   "1.1rem",
            }}
          >
            📡
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.1 }}>
              Smart Faculty
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              NOTIFICATION SYSTEM
            </div>
          </div>
        </div>

        {/* ── User Info + Logout ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {userProfile && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* Avatar */}
              <div
                style={{
                  width:      "36px",
                  height:     "36px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
                  display:    "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize:   "0.9rem",
                  fontWeight: 700,
                  color:      "#fff",
                  flexShrink: 0,
                }}
              >
                {userProfile.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              {/* Name + badge */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {userProfile.name}
                </span>
                <span className={`badge ${roleConfig.badgeClass}`} style={{ marginTop: "2px" }}>
                  {roleConfig.icon} {roleConfig.label}
                </span>
              </div>
            </div>
          )}

          {/* Logout button */}
          <button
            id="navbar-logout-btn"
            onClick={handleLogout}
            className="btn-secondary"
            style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
