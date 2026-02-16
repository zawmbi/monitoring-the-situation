/**
 * Ban/unban user — callable Cloud Function (admin only)
 *
 * SECURITY: Only admins can ban users. Banning sets the banned_flag
 * to true, which is checked on every authenticated request via
 * getVerifiedUser(). Banned users are immediately locked out of
 * all write operations.
 *
 * Privilege escalation prevention: The role check reads directly
 * from Firestore on every call — there is no way to cache or
 * spoof admin status.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireRole } from '../middleware/auth.js';

const db = getFirestore();

/**
 * Handle a banUser callable request.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function handleBanUser(request) {
  // 1. SECURITY: Verify the caller is an admin
  const callerUid = request.auth?.uid;
  if (!callerUid) {
    return { success: false, error: 'Authentication required' };
  }

  try {
    await requireRole(callerUid, ['admin']);
  } catch (err) {
    return { success: false, error: 'Admin access required' };
  }

  const { targetUserId, banned, reason } = request.data || {};

  if (!targetUserId || typeof targetUserId !== 'string') {
    return { success: false, error: 'Target user ID is required' };
  }

  if (typeof banned !== 'boolean') {
    return { success: false, error: 'Banned flag must be a boolean' };
  }

  // SECURITY: Prevent admins from banning themselves (accidental lockout)
  if (targetUserId === callerUid) {
    return { success: false, error: 'Cannot ban yourself' };
  }

  // SECURITY: Prevent banning other admins (protection against rogue admin)
  const targetDoc = await db.collection('users').doc(targetUserId).get();
  if (!targetDoc.exists) {
    return { success: false, error: 'User not found' };
  }

  if (targetDoc.data().role === 'admin') {
    return { success: false, error: 'Cannot ban another admin' };
  }

  // Apply the ban
  await db.collection('users').doc(targetUserId).update({
    banned_flag: banned,
    ban_reason: banned ? (reason || 'Violation of terms') : null,
    banned_by: banned ? callerUid : null,
    banned_at: banned ? FieldValue.serverTimestamp() : null,
  });

  console.log(`[Admin] User ${targetUserId} ${banned ? 'banned' : 'unbanned'} by ${callerUid}`);

  return { success: true, message: `User ${banned ? 'banned' : 'unbanned'}` };
}
