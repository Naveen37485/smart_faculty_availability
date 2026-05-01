// ============================================================
//  App.jsx — Root Router with Role-Based Route Guards
// ============================================================

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./context/AuthContext";

// Auth Pages
import Login  from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";

// Role Dashboards
import StudentDashboard from "./components/Student/StudentDashboard";
import FacultyDashboard from "./components/Faculty/FacultyDashboard";
import RoomSelection    from "./components/Faculty/RoomSelection";
import AdminDashboard   from "./components/Admin/AdminDashboard";

// ── Loading Screen ───────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: "var(--bg-dark)" }}>
      <div className="spinner mb-4"></div>
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading...</p>
    </div>
  );
}

// ── ProtectedRoute: redirects unauthenticated users to /login ────
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

// ── RoleRoute: ensures user can only access their own dashboard ──
// If the user is authenticated but tries to access the wrong role's
// dashboard, they are redirected to their correct one.
function RoleRoute({ allowedRole, children }) {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;

  if (userRole && userRole !== allowedRole) {
    // Redirect to the user's correct dashboard
    const roleRoutes = {
      student: "/student/dashboard",
      faculty: "/faculty/dashboard",
      admin:   "/admin/dashboard",
    };
    return <Navigate to={roleRoutes[userRole] || "/login"} replace />;
  }

  return children;
}

// ── Root redirect: logged-in users go to their dashboard ─────────
function RootRedirect() {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  if (currentUser && userRole) {
    const roleRoutes = {
      student: "/student/dashboard",
      faculty: "/faculty/dashboard",
      admin:   "/admin/dashboard",
    };
    return <Navigate to={roleRoutes[userRole] || "/login"} replace />;
  }

  return <Navigate to="/login" replace />;
}

// ── Inner App (needs AuthContext) ────────────────────────────────
function AppRoutes() {
  return (
    <>
      {/* Toast notifications — global */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--bg-card)",
            color:      "var(--text-primary)",
            border:     "1px solid var(--border-color)",
            borderRadius: "0.75rem",
            fontSize:   "0.875rem",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          duration: 4000,
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login"  element={<Login />}  />
        <Route path="/signup" element={<Signup />} />

        {/* Student routes */}
        <Route
          path="/student/dashboard"
          element={
            <RoleRoute allowedRole="student">
              <StudentDashboard />
            </RoleRoute>
          }
        />

        {/* Faculty routes */}
        <Route
          path="/faculty/dashboard"
          element={
            <RoleRoute allowedRole="faculty">
              <FacultyDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/faculty/room-selection"
          element={
            <RoleRoute allowedRole="faculty">
              <RoomSelection />
            </RoleRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute allowedRole="admin">
              <AdminDashboard />
            </RoleRoute>
          }
        />

        {/* Catch-all: redirect to appropriate dashboard or login */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </>
  );
}

// ── Main App Export ───────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
