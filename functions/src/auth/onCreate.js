/**
 * Auth onCreate trigger
 *
 * SECURITY: Fires when a new user signs up (Google or Anonymous).
 * Creates a Firestore user document with safe defaults.
 * - Role defaults to 'user' (never admin)
 * - subscription_status defaults to 'free'
 * - banned_flag defaults to false
 * Only stores Firebase UID — never raw OAuth tokens.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Ensure a Firestore user profile exists for the authenticated user.
 * Called from the frontend after sign-in. Skips if the doc already exists
 * so it's safe to call on every auth state change.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
export async function handleEnsureProfile(request) {
  const { uid, token } = request.auth || {};
  if (!uid) {
    throw new Error('Not authenticated');
  }

  const docRef = db.collection('users').doc(uid);
  const existing = await docRef.get();

  if (existing.exists) {
    // Update last_login and return — doc already created
    await docRef.update({ last_login: FieldValue.serverTimestamp() });
    return { created: false };
  }

  const displayName = token?.name || null;
  const email = token?.email || null;
  const isAnonymous = token?.firebase?.sign_in_provider === 'anonymous';
  const safeName = displayName || (isAnonymous ? `Guest_${uid.slice(0, 6)}` : 'User');

  const userDoc = {
    display_name: safeName,
    display_name_lower: safeName.toLowerCase(),
    email: email || null,
    created_at: FieldValue.serverTimestamp(),
    last_login: FieldValue.serverTimestamp(),
    subscription_status: 'free',
    role: 'user',
    banned_flag: false,
    is_anonymous: isAnonymous,
    display_name_set: false,
    theme_preference: 'dark',
    dashboard_layout_settings: {},
    desktop_preferences: {},
  };

  await docRef.set(userDoc);
  console.log(`[Auth] Created user document for ${uid} (anonymous: ${isAnonymous})`);
  return { created: true };
}
