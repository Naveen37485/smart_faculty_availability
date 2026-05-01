// ============================================================
//  Signup.jsx — New user registration with role selection
// ============================================================

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

import { auth, db, getFCMToken } from "../../firebase/firebaseConfig";

const ROLES = ["student", "faculty", "admin"];

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name:     "",
    email:    "",
    password: "",
    role:     "student",
  });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, role } = formData;

    // Basic validation
    if (!name.trim())         return toast.error("Name is required.");
    if (!email.trim())        return toast.error("Email is required.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");

    setLoading(true);
    try {
      // 1. Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;

      // 2. Request FCM token (may be null if denied)
      const fcm_token = (await getFCMToken()) || "";

      // 3. Write user profile to Firestore
      await setDoc(doc(db, "users", uid), {
        uid,
        name:      name.trim(),
        email:     email.toLowerCase().trim(),
        role,
        fcm_token,
        created_at: serverTimestamp(),
      });

      toast.success(`Account created! Welcome, ${name.trim()}.`);

      // 4. Redirect to the correct dashboard
      const roleRoutes = {
        student: "/student/dashboard",
        faculty: "/faculty/dashboard",
        admin:   "/admin/dashboard",
      };
      navigate(roleRoutes[role]);
    } catch (err) {
      console.error("[Signup] Error:", err);
      // Firebase auth error codes → friendly messages
      const messages = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email":        "Please enter a valid email address.",
        "auth/weak-password":        "Password is too weak.",
      };
      toast.error(messages[err.code] || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem" }}>
      <div className="fade-in" style={{ width: "100%", maxWidth: "440px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width:        "56px",
              height:       "56px",
              borderRadius: "16px",
              background:   "linear-gradient(135deg, var(--primary), var(--accent))",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              fontSize:     "1.6rem",
              margin:       "0 auto 1rem",
              boxShadow:    "var(--shadow-glow)",
            }}
          >
            📡
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            Create Account
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Smart Faculty Notification System
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: "2rem" }}>
          <form id="signup-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Name */}
            <div>
              <label htmlFor="signup-name" className="form-label">Full Name</label>
              <input
                id="signup-name"
                type="text"
                name="name"
                className="input-field"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="form-label">Email Address</label>
              <input
                id="signup-email"
                type="email"
                name="email"
                className="input-field"
                placeholder="you@college.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="signup-password"
                  type={showPass ? "text" : "password"}
                  name="password"
                  className="input-field"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
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

            {/* Role */}
            <div>
              <label htmlFor="signup-role" className="form-label">Select Role</label>
              <div style={{ position: "relative" }}>
                <select
                  id="signup-role"
                  name="role"
                  className="select-field"
                  value={formData.role}
                  onChange={handleChange}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
                {/* Custom arrow */}
                <div
                  style={{
                    position:  "absolute",
                    right:     "1rem",
                    top:       "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color:     "var(--text-muted)",
                  }}
                >
                  ▾
                </div>
              </div>
            </div>

            {/* Role preview badge */}
            <div
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "0.5rem",
                padding:      "0.625rem 0.875rem",
                borderRadius: "0.5rem",
                background:   "rgba(99,102,241,0.08)",
                border:       "1px solid rgba(99,102,241,0.15)",
                fontSize:     "0.8rem",
                color:        "var(--text-secondary)",
              }}
            >
              <span>ℹ️</span>
              You are registering as a{" "}
              <strong style={{ color: "var(--primary-light)" }}>
                {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
              </strong>
            </div>

            {/* Submit */}
            <button
              id="signup-submit-btn"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem", marginTop: "0.25rem" }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px" }} />
                  Creating account…
                </>
              ) : (
                "Create Account →"
              )}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p style={{ textAlign: "center", marginTop: "1.25rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Already have an account?{" "}
          <Link to="/login" id="goto-login-link" style={{ color: "var(--primary-light)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
