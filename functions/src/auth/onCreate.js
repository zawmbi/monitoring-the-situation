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
 * Handle new user creation.
 *
 * @param {import('firebase-functions/v2/identity').AuthBlockingEvent} user
 */
export async function handleUserCreate(user) {
  const { uid, displayName, email, providerData } = user;

  // Determine the auth provider for the display name fallback
  const isAnonymous = !providerData || providerData.length === 0;
  const safeName = displayName || (isAnonymous ? `Guest_${uid.slice(0, 6)}` : 'User');

  const userDoc = {
    // SECURITY: Only store the Firebase UID as the doc ID.
    // Never persist raw OAuth access/refresh tokens.
    display_name: safeName,
    email: email || null,
    created_at: FieldValue.serverTimestamp(),
    last_login: FieldValue.serverTimestamp(),

    // SECURITY: Default to 'free' tier — Stripe webhook is the only
    // path to 'pro'. Frontend cannot set this.
    subscription_status: 'free',

    // SECURITY: Default role is 'user'. Only admin Cloud Functions
    // can promote to 'mod' or 'admin', preventing privilege escalation.
    role: 'user',

    // SECURITY: Not banned by default. Only admin functions set this.
    banned_flag: false,

    // Track auth provider type for account upgrade flow
    is_anonymous: isAnonymous,
  };

  await db.collection('users').doc(uid).set(userDoc);

  console.log(`[Auth] Created user document for ${uid} (anonymous: ${isAnonymous})`);
}
