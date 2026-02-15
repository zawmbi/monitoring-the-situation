/**
 * Set user role — callable Cloud Function (admin only)
 *
 * SECURITY: Only admins can change user roles. This is the ONLY
 * path to role changes — Firestore rules deny all direct writes
 * to user documents, preventing privilege escalation.
 *
 * Valid roles: 'user', 'mod', 'admin'
 *
 * Role hierarchy:
 * - admin: Full access (ban, shadowban, set roles, delete any content)
 * - mod: Moderation access (shadowban, review reports, delete flagged content)
 * - user: Standard access (read, write own data, chat)
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireRole } from '../middleware/auth.js';

const db = getFirestore();

// SECURITY: Whitelist of valid roles. Any role not in this list is rejected.
const VALID_ROLES = ['user', 'mod', 'admin'];

/**
 * Handle a setRole callable request.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function handleSetRole(request) {
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

  const { targetUserId, role } = request.data || {};

  if (!targetUserId || typeof targetUserId !== 'string') {
    return { success: false, error: 'Target user ID is required' };
  }

  // SECURITY: Validate role against whitelist to prevent injection
  // of arbitrary role values.
  if (!VALID_ROLES.includes(role)) {
    return { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` };
  }

  // SECURITY: Prevent self-demotion (accidental admin lockout)
  if (targetUserId === callerUid && role !== 'admin') {
    return { success: false, error: 'Cannot demote yourself' };
  }

  // Verify target exists
  const targetDoc = await db.collection('users').doc(targetUserId).get();
  if (!targetDoc.exists) {
    return { success: false, error: 'User not found' };
  }

  await db.collection('users').doc(targetUserId).update({
    role,
    role_updated_by: callerUid,
    role_updated_at: FieldValue.serverTimestamp(),
  });

  console.log(`[Admin] User ${targetUserId} role set to '${role}' by ${callerUid}`);

  return { success: true, message: `Role updated to '${role}'` };
}
