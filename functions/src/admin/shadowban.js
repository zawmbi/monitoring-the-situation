/**
 * Shadowban user — callable Cloud Function (admin/mod only)
 *
 * SECURITY: Shadowbanning is distinct from a full ban:
 * - Banned users: Cannot use the app at all (blocked at auth layer)
 * - Shadowbanned users: Can still use the app, but their chat messages
 *   are only visible to themselves. They are unaware of the shadowban.
 *
 * This is effective against persistent trolls who would create new
 * accounts if they knew they were banned. They continue posting
 * but nobody sees their messages.
 *
 * Shadowban is also triggered automatically when a user exceeds
 * the spam threshold (see rateLimit.js).
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireRole } from '../middleware/auth.js';

const db = getFirestore();

/**
 * Handle a shadowbanUser callable request.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function handleShadowban(request) {
  // 1. SECURITY: Verify the caller is an admin or mod
  const callerUid = request.auth?.uid;
  if (!callerUid) {
    return { success: false, error: 'Authentication required' };
  }

  try {
    await requireRole(callerUid, ['admin', 'mod']);
  } catch (err) {
    return { success: false, error: 'Moderator access required' };
  }

  const { targetUserId, shadowbanned, reason } = request.data || {};

  if (!targetUserId || typeof targetUserId !== 'string') {
    return { success: false, error: 'Target user ID is required' };
  }

  if (typeof shadowbanned !== 'boolean') {
    return { success: false, error: 'Shadowbanned flag must be a boolean' };
  }

  // Verify target exists
  const targetDoc = await db.collection('users').doc(targetUserId).get();
  if (!targetDoc.exists) {
    return { success: false, error: 'User not found' };
  }

  // SECURITY: Prevent shadowbanning admins
  if (targetDoc.data().role === 'admin') {
    return { success: false, error: 'Cannot shadowban an admin' };
  }

  await db.collection('users').doc(targetUserId).update({
    shadowbanned,
    shadowban_reason: shadowbanned ? (reason || 'manual_mod_action') : null,
    shadowban_by: shadowbanned ? callerUid : null,
    shadowban_at: shadowbanned ? FieldValue.serverTimestamp() : null,
  });

  console.log(
    `[Admin] User ${targetUserId} ${shadowbanned ? 'shadowbanned' : 'un-shadowbanned'} by ${callerUid}`,
  );

  return { success: true, message: `User ${shadowbanned ? 'shadowbanned' : 'un-shadowbanned'}` };
}
