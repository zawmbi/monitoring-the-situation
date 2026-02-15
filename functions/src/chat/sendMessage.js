/**
 * Send chat message — callable Cloud Function
 *
 * SECURITY: This is the ONLY path for creating chat messages.
 * Firestore rules deny all direct client writes to messages.
 * Every message goes through:
 * 1. Authentication verification
 * 2. Ban check
 * 3. Rate limiting
 * 4. Input validation and sanitization
 * 5. Toxicity scoring and filtering
 * 6. Shadowban check (shadowbanned users' messages are stored but
 *    only visible to themselves)
 * 7. Auto-mute if spam threshold exceeded
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getVerifiedUser } from '../middleware/auth.js';
import { checkRateLimit, shouldAutoMute } from '../middleware/rateLimit.js';
import { validateMessage } from '../middleware/validate.js';
import { scoreToxicity, shouldBlockMessage } from './moderation.js';

const db = getFirestore();

/**
 * Handle a sendMessage callable request.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export async function handleSendMessage(request) {
  // 1. SECURITY: Verify authentication
  const uid = request.auth?.uid;
  if (!uid) {
    return { success: false, error: 'Authentication required' };
  }

  const { chatId, message } = request.data || {};

  if (!chatId || typeof chatId !== 'string') {
    return { success: false, error: 'Invalid chat ID' };
  }

  // 2. SECURITY: Verify user exists and is not banned
  let user;
  try {
    user = await getVerifiedUser(uid);
  } catch (err) {
    return { success: false, error: err.message };
  }

  // 3. SECURITY: Check rate limit based on user tier
  const tier = user.role === 'admin' || user.role === 'mod' ? user.role : user.subscription_status;
  const rateLimitResult = await checkRateLimit(uid, 'chat_message', tier);

  if (!rateLimitResult.allowed) {
    // SECURITY: Auto-mute if spam threshold exceeded
    if (shouldAutoMute(rateLimitResult.violationCount)) {
      await db.collection('users').doc(uid).update({
        shadowbanned: true,
        shadowban_reason: 'auto_mute_spam',
        shadowban_at: FieldValue.serverTimestamp(),
      });
      console.log(`[Chat] Auto-muted user ${uid} for spam (violations: ${rateLimitResult.violationCount})`);
    }
    return { success: false, error: 'Rate limit exceeded. Please wait.' };
  }

  // 4. SECURITY: Validate and sanitize message content
  const validation = validateMessage(message);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // 5. SECURITY: Score toxicity
  const { score, flags } = scoreToxicity(validation.value);

  if (shouldBlockMessage(score)) {
    console.log(`[Chat] Blocked message from ${uid} (score: ${score}, flags: ${flags.join(',')})`);
    return { success: false, error: 'Message contains inappropriate content' };
  }

  // 6. SECURITY: Check if the chat exists
  const chatDoc = await db.collection('chats').doc(chatId).get();
  if (!chatDoc.exists) {
    return { success: false, error: 'Chat not found' };
  }

  // 7. SECURITY: Shadowban handling — store the message but mark it
  // so it's only returned to the sender. Other users never see it.
  const isShadowbanned = user.shadowbanned === true;

  // 8. Create the message document
  const messageDoc = {
    sender_id: uid,
    sender_display_name: user.display_name,
    message: validation.value,
    created_at: FieldValue.serverTimestamp(),
    toxicity_score: score,
    // SECURITY: Shadowbanned messages are stored but filtered out
    // in read queries for other users. The sender sees their own
    // messages normally, unaware of the shadowban.
    shadowbanned: isShadowbanned,
    // SECURITY: Store subscription status for badge rendering.
    // This is set server-side, not by the client.
    sender_tier: user.subscription_status,
  };

  const msgRef = await db
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .add(messageDoc);

  // Update last_login on the user
  await db.collection('users').doc(uid).update({
    last_login: FieldValue.serverTimestamp(),
  });

  return { success: true, messageId: msgRef.id };
}
