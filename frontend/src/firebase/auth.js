/**
 * Firebase Authentication helpers
 *
 * SECURITY: Wraps Firebase Auth SDK methods with error handling.
 * Only stores the Firebase UID — never raw OAuth tokens.
 * Supports:
 * - Google OAuth sign-in
 * - Anonymous sign-in
 * - Account upgrade (anonymous → Google) via credential linking
 * - Sign out
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  linkWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './config.js';

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google OAuth.
 * SECURITY: Uses popup flow. The OAuth token is handled internally
 * by Firebase — we never access or store it.
 *
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

/**
 * Sign in anonymously.
 * SECURITY: Creates a temporary account with limited capabilities.
 * Anonymous users cannot subscribe (no email for billing).
 * Auto-expired after 30 minutes by the expireGuests Cloud Function.
 *
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signInAsGuest() {
  return signInAnonymously(auth);
}

/**
 * Upgrade an anonymous account to a Google account.
 * SECURITY: Links the anonymous UID with Google credentials so the
 * user keeps their data (configs, chat history) while gaining a
 * permanent account. The original UID is preserved.
 *
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function upgradeAnonymousToGoogle() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No user signed in');
  }
  if (!currentUser.isAnonymous) {
    throw new Error('User is not anonymous');
  }
  return linkWithPopup(currentUser, googleProvider);
}

/**
 * Sign out the current user.
 *
 * @returns {Promise<void>}
 */
export async function signOut() {
  return firebaseSignOut(auth);
}

/**
 * Get the current user's ID token for API calls.
 * SECURITY: Forces a refresh to ensure the token is not expired.
 * This token is sent to Cloud Functions for authentication.
 *
 * @returns {Promise<string|null>}
 */
export async function getIdToken() {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return currentUser.getIdToken(/* forceRefresh */ true);
}
