/**
 * Report message endpoint — callable Cloud Function
 *
 * SECURITY: Users can report abusive messages. Reports are stored
 * in a separate collection that only moderators can read.
 * Rate-limited to prevent report flooding.
 * Reporter identity is stored for accountability but never exposed
 * to the reported user.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getVerifiedUser } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rateLimit.js';
import { validateReportReason } from '../middleware/validate.js';

const db = getFirestore();

/**
 * Handle a reportMessage callable request.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function handleReportMessage(request) {
  // 1. SECURITY: Verify authentication
  const uid = request.auth?.uid;
  if (!uid) {
    return { success: false, error: 'Authentication required' };
  }

  const { chatId, messageId, reason } = request.data || {};

  if (!chatId || !messageId) {
    return { success: false, error: 'Chat ID and message ID are required' };
  }

  // 2. SECURITY: Verify user is not banned
  try {
    await getVerifiedUser(uid);
  } catch (err) {
    return { success: false, error: err.message };
  }

  // 3. SECURITY: Rate-limit reports to prevent flooding
  const rateLimitResult = await checkRateLimit(uid, 'report', 'free');
  if (!rateLimitResult.allowed) {
    return { success: false, error: 'Too many reports. Please wait.' };
  }

  // 4. Validate the reason
  const validation = validateReportReason(reason);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // 5. Verify the message exists
  const messageDoc = await db
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .doc(messageId)
    .get();

  if (!messageDoc.exists) {
    return { success: false, error: 'Message not found' };
  }

  // SECURITY: Prevent self-reporting (can be used to game the system)
  if (messageDoc.data().sender_id === uid) {
    return { success: false, error: 'Cannot report your own message' };
  }

  // 6. Create report document
  // SECURITY: Reporter identity is stored for accountability and
  // to detect false-report abuse, but is never exposed to the
  // reported user or in any client-readable collection.
  await db.collection('reports').add({
    reporter_id: uid,
    reported_user_id: messageDoc.data().sender_id,
    chat_id: chatId,
    message_id: messageId,
    message_content: messageDoc.data().message,
    reason: validation.value,
    status: 'pending', // pending | reviewed | dismissed | actioned
    created_at: FieldValue.serverTimestamp(),
  });

  return { success: true, message: 'Report submitted' };
}
