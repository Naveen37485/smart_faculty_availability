// ============================================================
//  Login.jsx — Common login page with role-based redirect
// ============================================================

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";

import { auth, db } from "../../firebase/firebaseConfig";

export default function Login() {
  const navigate = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error("Please fill in all fields.");

    setLoading(true);
    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const { uid } = userCredential.user;

      // 2. Fetch user profile to determine role
      const userDocSnap = await getDoc(doc(db, "users", uid));
      if (!userDocSnap.exists()) {
        toast.error("User profile not found. Please sign up first.");
        await auth.signOut();
        setLoading(false);
        return;
      }

      const { role, name } = userDocSnap.data();
      toast.success(`Welcome back, ${name}!`);

      // 3. Redirect to role-specific dashboard
      const roleRoutes = {
        student: "/student/dashboard",
        faculty: "/faculty/dashboard",
        admin:   "/admin/dashboard",
      };
      navigate(roleRoutes[role] || "/login");
    } catch (err) {
      console.error("[Login] Error:", err);
      const messages = {
        "auth/user-not-found":      "No account found with this email.",
        "auth/wrong-password":      "Incorrect password.",
        "auth/invalid-email":       "Please enter a valid email.",
        "auth/too-many-requests":   "Too many attempts. Try again later.",
        "auth/invalid-credential":  "Invalid email or password.",
      };
      toast.error(messages[err.code] || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-wrapper"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem" }}
    >
      <div className="fade-in" style={{ width: "100%", maxWidth: "420px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width:          "56px",
              height:         "56px",
              borderRadius:   "16px",
              background:     "linear-gradient(135deg, var(--primary), var(--accent))",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       "1.6rem",
              margin:         "0 auto 1rem",
              boxShadow:      "var(--shadow-glow)",
            }}
          >
            📡
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            Welcome Back
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Smart Faculty Notification System
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: "2rem" }}>
          <form id="login-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  id="toggle-login-password"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position:   "absolute",
                    right:      "0.75rem",
                    top:        "50%",
                    transform:  "translateY(-50%)",
                    background: "none",
                    border:     "none",
                    cursor:     "pointer",
                    color:      "var(--text-muted)",
                    padding:    0,
                    fontSize:   "0.875rem",
                  }}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem", marginTop: "0.25rem" }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px" }} />
                  Signing in…
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>
        </div>

        {/* Signup link */}
        <p style={{ textAlign: "center", marginTop: "1.25rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Don&apos;t have an account?{" "}
          <Link to="/signup" id="goto-signup-link" style={{ color: "var(--primary-light)", fontWeight: 600, textDecoration: "none" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
