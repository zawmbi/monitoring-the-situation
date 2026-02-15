/**
 * Authentication context provider
 *
 * SECURITY: Provides auth state to the entire app without prop drilling.
 * Listens to Firebase Auth state changes and syncs with the Firestore
 * user profile for role/subscription info.
 *
 * Usage: Wrap <App /> with <AuthProvider> in main.jsx, then use
 * the useAuth() hook in any component that needs auth state.
 *
 * NOTE: This is infrastructure only — no UI changes. The existing
 * components remain untouched.
 */

import { createContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config.js';
import {
  signInWithGoogle,
  signInAsGuest,
  upgradeAnonymousToGoogle,
  signOut,
} from '../firebase/auth.js';
import { subscribeToUserProfile } from '../firebase/firestore.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase Auth user
  const [profile, setProfile] = useState(null); // Firestore user profile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  // Subscribe to Firestore user profile when auth state changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    // SECURITY: Real-time listener ensures we always have the latest
    // role, subscription_status, and banned_flag. If an admin bans
    // a user, the profile update propagates immediately.
    const unsubProfile = subscribeToUserProfile(user.uid, (profileData) => {
      setProfile(profileData);
    });

    return () => unsubProfile();
  }, [user]);

  const handleSignInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const handleSignInAsGuest = useCallback(async () => {
    try {
      setError(null);
      await signInAsGuest();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const handleUpgradeAccount = useCallback(async () => {
    try {
      setError(null);
      await upgradeAnonymousToGoogle();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      setError(null);
      await signOut();
      setProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    // Auth state
    user,
    profile,
    loading,
    error,

    // Derived state
    isAuthenticated: !!user,
    isAnonymous: user?.isAnonymous || false,
    isPro: profile?.subscription_status === 'pro',
    isAdmin: profile?.role === 'admin',
    isMod: profile?.role === 'mod' || profile?.role === 'admin',
    isBanned: profile?.banned_flag === true,

    // Actions
    signInWithGoogle: handleSignInWithGoogle,
    signInAsGuest: handleSignInAsGuest,
    upgradeAccount: handleUpgradeAccount,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
