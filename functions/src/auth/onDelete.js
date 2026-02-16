/**
 * Auth onDelete trigger + account deletion endpoint
 *
 * SECURITY: When a user deletes their account, we must clean up:
 * 1. User document in Firestore
 * 2. All configs owned by the user
 * 3. Subscription record
 * 4. Rate limit records
 *
 * Messages are NOT deleted — they are anonymized (sender_id set to
 * '[deleted]') to preserve chat history integrity while removing PII.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const db = getFirestore();

/**
 * Handle user deletion trigger (fires on Firebase Auth user delete).
 *
 * @param {import('firebase-functions/v2/identity').AuthBlockingEvent} user
 */
export async function handleUserDelete(user) {
  const { uid } = user;
  await cleanupUserData(uid);
}

/**
 * Callable function for user-initiated account deletion.
 * SECURITY: Users can only delete their own account.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
export async function deleteAccount(request) {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new Error('Authentication required');
  }

  // Clean up Firestore data first
  await cleanupUserData(uid);

  // SECURITY: Delete the Firebase Auth account last so the cleanup
  // functions can still verify ownership during deletion.
  await getAuth().deleteUser(uid);

  return { success: true, message: 'Account deleted' };
}

/**
 * Remove all user data from Firestore.
 * Uses batched writes for atomicity and to stay within Firestore limits.
 *
 * @param {string} uid - Firebase UID of the user to clean up
 */
async function cleanupUserData(uid) {
  const batch = db.batch();

  // 1. Delete user document
  batch.delete(db.collection('users').doc(uid));

  // 2. Delete subscription record
  batch.delete(db.collection('subscriptions').doc(uid));

  // 3. Delete all configs owned by this user
  const configsSnap = await db
    .collection('configs')
    .where('user_id', '==', uid)
    .get();

  configsSnap.docs.forEach((doc) => batch.delete(doc.ref));

  // 4. Delete rate limit records
  const rateLimitsSnap = await db
    .collection('rate_limits')
    .where('__name__', '>=', `${uid}_`)
    .where('__name__', '<', `${uid}_\uf8ff`)
    .get();

  rateLimitsSnap.docs.forEach((doc) => batch.delete(doc.ref));

  await batch.commit();

  // 5. Anonymize messages (separate operation since messages are in subcollections)
  // SECURITY: We anonymize rather than delete to preserve chat context.
  // This removes PII while keeping the conversation readable.
  await anonymizeUserMessages(uid);

  console.log(`[Auth] Cleaned up data for deleted user ${uid}`);
}

/**
 * Replace sender info in all messages from this user with '[deleted]'.
 * Runs across all chat subcollections.
 *
 * @param {string} uid - Firebase UID
 */
async function anonymizeUserMessages(uid) {
  const chatsSnap = await db.collection('chats').get();

  for (const chatDoc of chatsSnap.docs) {
    const messagesSnap = await chatDoc.ref
      .collection('messages')
      .where('sender_id', '==', uid)
      .get();

    if (messagesSnap.empty) continue;

    const batch = db.batch();
    messagesSnap.docs.forEach((msgDoc) => {
      batch.update(msgDoc.ref, {
        sender_id: '[deleted]',
        sender_display_name: '[deleted]',
      });
    });
    await batch.commit();
  }
}
