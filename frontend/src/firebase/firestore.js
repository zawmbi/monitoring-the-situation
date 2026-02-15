/**
 * Firestore helpers for client-side data access
 *
 * SECURITY: All read operations go through Firestore security rules.
 * All write operations go through Cloud Functions (callable).
 * This module only provides read helpers and Cloud Function wrappers.
 *
 * Never write to Firestore directly from the client — the security
 * rules deny all direct writes as a defense-in-depth measure.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './config.js';

// ===========================================
// CLOUD FUNCTION CALLABLES
// ===========================================
// SECURITY: All mutations go through these callable wrappers.
// The Cloud Functions handle auth, rate limiting, validation,
// and tier enforcement before any data is written.

export const saveSettings = httpsCallable(functions, 'settingsSave');
export const sendMessage = httpsCallable(functions, 'chatSendMessage');
export const reportMessage = httpsCallable(functions, 'chatReportMessage');
export const saveConfig = httpsCallable(functions, 'configSave');
export const deleteConfig = httpsCallable(functions, 'configDelete');
export const listConfigs = httpsCallable(functions, 'configList');
export const createCheckout = httpsCallable(functions, 'stripeCreateCheckout');
export const createPortalSession = httpsCallable(functions, 'stripeCustomerPortal');
export const deleteAccount = httpsCallable(functions, 'accountDelete');
export const banUser = httpsCallable(functions, 'adminBanUser');
export const shadowbanUser = httpsCallable(functions, 'adminShadowban');
export const setUserRole = httpsCallable(functions, 'adminSetRole');

// ===========================================
// FIRESTORE READS
// ===========================================

/**
 * Get the current user's profile from Firestore.
 *
 * @param {string} uid - Firebase UID
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(uid) {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Get the current user's subscription status.
 *
 * @param {string} uid - Firebase UID
 * @returns {Promise<object|null>}
 */
export async function getSubscription(uid) {
  const docRef = doc(db, 'subscriptions', uid);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Subscribe to real-time chat messages with pagination.
 * SECURITY: Uses Firestore security rules for access control.
 * Shadowbanned messages are filtered server-side by the security rules.
 *
 * @param {string} chatId - Chat document ID
 * @param {Function} callback - Called with array of messages on each update
 * @param {number} pageSize - Number of messages per page
 * @param {*} lastDoc - Last document for cursor-based pagination
 * @returns {Function} Unsubscribe function
 */
export function subscribeToChatMessages(chatId, callback, pageSize = 50, lastDoc = null) {
  const messagesRef = collection(db, 'chats', chatId, 'messages');

  let q = query(
    messagesRef,
    orderBy('created_at', 'asc'),
    limit(pageSize),
  );

  if (lastDoc) {
    q = query(
      messagesRef,
      orderBy('created_at', 'asc'),
      startAfter(lastDoc),
      limit(pageSize),
    );
  }

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((msgDoc) => ({
      id: msgDoc.id,
      ...msgDoc.data(),
      created_at: msgDoc.data().created_at?.toDate?.()?.toISOString() || null,
    }));
    callback(messages, snapshot);
  });
}

/**
 * Subscribe to real-time user profile updates.
 *
 * @param {string} uid - Firebase UID
 * @param {Function} callback - Called with user data on each update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUserProfile(uid, callback) {
  const docRef = doc(db, 'users', uid);
  return onSnapshot(docRef, (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}
