// ============================================================
//  AuthContext — Global Authentication State Provider
//  Wraps the entire app and exposes:
//    - currentUser  : Firebase Auth user object
//    - userProfile  : Firestore users/{uid} document data
//    - userRole     : "student" | "faculty" | "admin" | null
//    - loading      : true while auth state is being resolved
// ============================================================

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, getFCMToken } from "../firebase/firebaseConfig";

// ── Create the context ───────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider Component ───────────────────────────────────────────
export function AuthProvider({ children }) {
  const [currentUser,  setCurrentUser]  = useState(null);
  const [userProfile,  setUserProfile]  = useState(null);
  const [userRole,     setUserRole]     = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in — fetch their Firestore profile
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const profileData = userDocSnap.data();
            setCurrentUser(firebaseUser);
            setUserProfile(profileData);
            setUserRole(profileData.role);

            // Refresh FCM token and persist it to Firestore
            const fcmToken = await getFCMToken();
            if (fcmToken && fcmToken !== profileData.fcm_token) {
              await updateDoc(userDocRef, { fcm_token: fcmToken });
            }
          } else {
            // Profile doc missing — clear state
            console.warn("[Auth] User doc not found in Firestore.");
            setCurrentUser(firebaseUser);
            setUserProfile(null);
            setUserRole(null);
          }
        } catch (error) {
          console.error("[Auth] Error fetching user profile:", error);
          setCurrentUser(firebaseUser);
          setUserProfile(null);
          setUserRole(null);
        }
      } else {
        // User is signed out — reset all state
        setCurrentUser(null);
        setUserProfile(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // ── Logout helper ────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
  };

  // ── Context value ────────────────────────────────────────────
  const value = {
    currentUser,
    userProfile,
    userRole,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Custom hook for easy consumption ────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
