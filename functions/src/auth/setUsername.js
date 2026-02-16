/**
 * Set username — callable Cloud Function
 *
 * SECURITY: Creates or updates the user's display name in Firestore.
 * Validates the username for length, allowed characters, uniqueness,
 * and checks against a blocked-word list to prevent vulgar, racist,
 * or abusive usernames.
 *
 * Only works once — after display_name_set is true, users cannot change
 * their display name through this function.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { containsBadWord } from './blockedWords.js';

const db = getFirestore();

// Username rules
const MIN_LENGTH = 4;
const MAX_LENGTH = 20;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

/**
 * Handle a setUsername callable request.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function handleSetUsername(request) {
  const uid = request.auth?.uid;
  if (!uid) {
    return { success: false, error: 'Authentication required' };
  }

  const { username } = request.data || {};

  if (!username || typeof username !== 'string') {
    return { success: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  // Validate length
  if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
    return { success: false, error: `Username must be ${MIN_LENGTH}-${MAX_LENGTH} characters` };
  }

  // Validate characters
  if (!USERNAME_REGEX.test(trimmed)) {
    return { success: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  // SECURITY: Check against blocked words list
  if (containsBadWord(trimmed)) {
    return { success: false, error: 'That username is not allowed' };
  }

  // Check if user doc already exists with display_name_set = true
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (userDoc.exists && userDoc.data().display_name_set === true) {
    return { success: false, error: 'Username already set' };
  }

  // Check uniqueness (case-insensitive)
  const existing = await db
    .collection('users')
    .where('display_name_lower', '==', trimmed.toLowerCase())
    .limit(1)
    .get();

  if (!existing.empty) {
    return { success: false, error: 'Username is already taken' };
  }

  // If the user doc doesn't exist (authOnCreate wasn't deployed when they
  // signed up), create it from scratch. Otherwise just update the name fields.
  const isAnonymous = request.auth?.token?.firebase?.sign_in_provider === 'anonymous';

  if (!userDoc.exists) {
    await userRef.set({
      display_name: trimmed,
      display_name_lower: trimmed.toLowerCase(),
      display_name_set: true,
      email: request.auth?.token?.email || null,
      created_at: FieldValue.serverTimestamp(),
      last_login: FieldValue.serverTimestamp(),
      subscription_status: 'free',
      role: 'user',
      banned_flag: false,
      is_anonymous: isAnonymous,
      theme_preference: 'dark',
      dashboard_layout_settings: {},
      desktop_preferences: {},
    });
  } else {
    await userRef.update({
      display_name: trimmed,
      display_name_lower: trimmed.toLowerCase(),
      display_name_set: true,
    });
  }

  console.log(`[Auth] Username set for ${uid}: ${trimmed}`);
  return { success: true };
}
