/**
 * Authentication middleware for Cloud Functions
 *
 * SECURITY: Verifies Firebase ID tokens on every callable/HTTP request.
 * Checks banned status to block banned users at the gate.
 * Never trusts frontend claims — always re-derives roles from Firestore.
 */

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Verify a Firebase ID token and return the decoded claims.
 * SECURITY: Rejects expired, revoked, or malformed tokens.
 *
 * @param {string} idToken - The raw Firebase ID token from the client
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>}
 */
export async function verifyToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing or invalid auth token');
  }
  // checkRevoked=true ensures we catch tokens that have been revoked
  // (e.g., after password change or admin revocation)
  return getAuth().verifyIdToken(idToken, /* checkRevoked */ true);
}

/**
 * Load a user document from Firestore and verify they are not banned.
 * SECURITY: Always read fresh from Firestore — never cache user state
 * in function memory because bans must take effect immediately.
 *
 * @param {string} uid - Firebase UID
 * @returns {Promise<FirebaseFirestore.DocumentData>}
 */
export async function getVerifiedUser(uid) {
  const userDoc = await db.collection('users').doc(uid).get();

  if (!userDoc.exists) {
    throw new Error('User record not found');
  }

  const userData = userDoc.data();

  // SECURITY: Block banned users from all write operations.
  // This is checked on every request, not just at login.
  if (userData.banned_flag === true) {
    throw new Error('Account suspended');
  }

  return { id: userDoc.id, ...userData };
}

/**
 * Verify the caller has admin or mod role.
 * SECURITY: Role is always read from Firestore, never from the JWT
 * custom claims alone, to prevent stale role elevation.
 *
 * @param {string} uid - Firebase UID
 * @param {string[]} allowedRoles - Array of roles that are permitted
 * @returns {Promise<FirebaseFirestore.DocumentData>}
 */
export async function requireRole(uid, allowedRoles = ['admin']) {
  const user = await getVerifiedUser(uid);

  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }

  return user;
}
