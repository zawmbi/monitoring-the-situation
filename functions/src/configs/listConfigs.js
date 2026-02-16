/**
 * List configs — callable Cloud Function
 *
 * SECURITY: Returns only configs owned by the authenticated user,
 * plus public configs from other users. Supports cursor-based
 * pagination to prevent loading excessive data.
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getVerifiedUser } from '../middleware/auth.js';

const db = getFirestore();

const PAGE_SIZE = 20;

/**
 * Handle a listConfigs callable request.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {Promise<{ success: boolean, data?: object[], cursor?: string, error?: string }>}
 */
export async function handleListConfigs(request) {
  // 1. SECURITY: Verify authentication
  const uid = request.auth?.uid;
  if (!uid) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. SECURITY: Verify user exists and is not banned
  try {
    await getVerifiedUser(uid);
  } catch (err) {
    return { success: false, error: err.message };
  }

  const { filter, cursor, limit } = request.data || {};
  const pageSize = Math.min(parseInt(limit, 10) || PAGE_SIZE, 50);

  let query;

  if (filter === 'public') {
    // SECURITY: Public configs are readable by all authenticated users
    query = db
      .collection('configs')
      .where('is_public', '==', true)
      .orderBy('created_at', 'desc')
      .limit(pageSize);
  } else {
    // SECURITY: Only return configs belonging to the requesting user.
    // Cross-user config access is denied.
    query = db
      .collection('configs')
      .where('user_id', '==', uid)
      .orderBy('created_at', 'desc')
      .limit(pageSize);
  }

  // Cursor-based pagination
  if (cursor) {
    const cursorDoc = await db.collection('configs').doc(cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.get();
  const configs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    // SECURITY: Convert Firestore timestamps to ISO strings
    // to avoid exposing internal Firestore types.
    created_at: doc.data().created_at?.toDate?.()?.toISOString() || null,
    updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || null,
  }));

  const lastDoc = snapshot.docs[snapshot.docs.length - 1];

  return {
    success: true,
    data: configs,
    cursor: lastDoc ? lastDoc.id : null,
    hasMore: snapshot.docs.length === pageSize,
  };
}
