/**
 * Delete config — callable Cloud Function
 *
 * SECURITY: Verifies ownership before deletion.
 * Users can only delete their own configs.
 * Admins/mods can delete any config (for moderation).
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getVerifiedUser } from '../middleware/auth.js';

const db = getFirestore();

/**
 * Handle a deleteConfig callable request.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function handleDeleteConfig(request) {
  // 1. SECURITY: Verify authentication
  const uid = request.auth?.uid;
  if (!uid) {
    return { success: false, error: 'Authentication required' };
  }

  const { configId } = request.data || {};
  if (!configId || typeof configId !== 'string') {
    return { success: false, error: 'Config ID is required' };
  }

  // 2. SECURITY: Verify user exists and is not banned
  let user;
  try {
    user = await getVerifiedUser(uid);
  } catch (err) {
    return { success: false, error: err.message };
  }

  // 3. Fetch the config
  const configDoc = await db.collection('configs').doc(configId).get();
  if (!configDoc.exists) {
    return { success: false, error: 'Config not found' };
  }

  // 4. SECURITY: Verify ownership or admin/mod role.
  // Normal users can only delete their own configs.
  const isOwner = configDoc.data().user_id === uid;
  const isMod = user.role === 'admin' || user.role === 'mod';

  if (!isOwner && !isMod) {
    return { success: false, error: 'Access denied' };
  }

  // 5. Delete the config
  await db.collection('configs').doc(configId).delete();

  return { success: true };
}
