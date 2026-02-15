/**
 * Monitored — Cloud Functions Entry Point
 *
 * Exports all Cloud Functions for Firebase deployment.
 * Functions are organized by domain:
 * - Auth triggers (user creation/deletion)
 * - Chat (send message, report)
 * - Configs (CRUD with tier enforcement)
 * - Stripe (checkout, portal, webhook)
 * - Admin (ban, shadowban, roles)
 *
 * SECURITY: Firebase Admin SDK is initialized once here.
 * All functions share the same admin instance.
 */

import { initializeApp } from 'firebase-admin/app';
import { onCall, onRequest } from 'firebase-functions/v2/https';
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { onDocumentDeleted } from 'firebase-functions/v2/firestore';

// Initialize Firebase Admin (uses default credentials in Cloud Functions)
initializeApp();

// ===========================================
// AUTH TRIGGERS
// ===========================================

import { handleUserCreate } from './auth/onCreate.js';
import { deleteAccount as handleDeleteAccount } from './auth/onDelete.js';
import { handleUserDelete } from './auth/onDelete.js';

/**
 * SECURITY: Fires before a new user is created in Firebase Auth.
 * Creates the corresponding Firestore user document with safe defaults.
 */
export const authOnCreate = beforeUserCreated((event) => {
  return handleUserCreate(event.data);
});

/**
 * Callable: User-initiated account deletion.
 * SECURITY: Users can only delete their own account.
 */
export const accountDelete = onCall(
  { enforceAppCheck: false },
  handleDeleteAccount,
);

// ===========================================
// CHAT FUNCTIONS
// ===========================================

import { handleSendMessage } from './chat/sendMessage.js';
import { handleReportMessage } from './chat/reportMessage.js';

/**
 * Callable: Send a chat message.
 * SECURITY: Goes through auth, rate limit, validation, and toxicity checks.
 */
export const chatSendMessage = onCall(
  { enforceAppCheck: false },
  handleSendMessage,
);

/**
 * Callable: Report an abusive message.
 * SECURITY: Rate-limited to prevent report flooding.
 */
export const chatReportMessage = onCall(
  { enforceAppCheck: false },
  handleReportMessage,
);

// ===========================================
// CONFIG FUNCTIONS
// ===========================================

import { handleSaveConfig } from './configs/saveConfig.js';
import { handleDeleteConfig } from './configs/deleteConfig.js';
import { handleListConfigs } from './configs/listConfigs.js';

/**
 * Callable: Save (create/update) a config.
 * SECURITY: Enforces tier-based config limits (free: 3, pro: unlimited).
 */
export const configSave = onCall(
  { enforceAppCheck: false },
  handleSaveConfig,
);

/**
 * Callable: Delete a config.
 * SECURITY: Verifies ownership before deletion.
 */
export const configDelete = onCall(
  { enforceAppCheck: false },
  handleDeleteConfig,
);

/**
 * Callable: List configs with pagination.
 * SECURITY: Returns only owned configs or public configs.
 */
export const configList = onCall(
  { enforceAppCheck: false },
  handleListConfigs,
);

// ===========================================
// SETTINGS FUNCTIONS
// ===========================================

import { handleSaveSettings } from './settings/saveSettings.js';

/**
 * Callable: Save user settings (theme, layout, preferences).
 * SECURITY: Only allowed fields can be modified. Restricted fields
 * (role, subscription_status, banned_flag) are rejected.
 */
export const settingsSave = onCall(
  { enforceAppCheck: false },
  handleSaveSettings,
);

// ===========================================
// STRIPE FUNCTIONS
// ===========================================

import { handleStripeWebhook, secrets as webhookSecrets } from './stripe/webhook.js';
import { handleCreateCheckout, secrets as checkoutSecrets } from './stripe/createCheckout.js';
import { handleCustomerPortal, secrets as portalSecrets } from './stripe/customerPortal.js';

/**
 * HTTP: Stripe webhook endpoint.
 * SECURITY: Validates Stripe-Signature header before processing.
 * Must be an HTTP function (not callable) for Stripe compatibility.
 */
export const stripeWebhook = onRequest(
  {
    secrets: webhookSecrets,
    // SECURITY: Stripe sends raw body for signature verification.
    // Do not parse the body as JSON.
    invoker: 'public',
  },
  handleStripeWebhook,
);

/**
 * Callable: Create a Stripe Checkout session.
 * SECURITY: Only authenticated, non-anonymous users can subscribe.
 */
export const stripeCreateCheckout = onCall(
  { secrets: checkoutSecrets },
  handleCreateCheckout,
);

/**
 * Callable: Create a Stripe Customer Portal session.
 * SECURITY: Only users with an active subscription can access.
 */
export const stripeCustomerPortal = onCall(
  { secrets: portalSecrets },
  handleCustomerPortal,
);

// ===========================================
// ADMIN FUNCTIONS
// ===========================================

import { handleBanUser } from './admin/banUser.js';
import { handleShadowban } from './admin/shadowban.js';
import { handleSetRole } from './admin/setRole.js';

/**
 * Callable: Ban or unban a user.
 * SECURITY: Admin-only. Cannot ban other admins.
 */
export const adminBanUser = onCall(
  { enforceAppCheck: false },
  handleBanUser,
);

/**
 * Callable: Shadowban or un-shadowban a user.
 * SECURITY: Admin/mod only. Cannot shadowban admins.
 */
export const adminShadowban = onCall(
  { enforceAppCheck: false },
  handleShadowban,
);

/**
 * Callable: Set a user's role.
 * SECURITY: Admin-only. Cannot demote yourself.
 */
export const adminSetRole = onCall(
  { enforceAppCheck: false },
  handleSetRole,
);

// ===========================================
// SCHEDULED: GUEST EXPIRATION
// ===========================================

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Scheduled: Expire anonymous guest accounts after 30 minutes.
 * SECURITY: Prevents accumulation of abandoned anonymous accounts
 * and reduces attack surface from throwaway accounts.
 * Runs every 10 minutes.
 */
export const expireGuests = onSchedule('every 10 minutes', async (_event) => {
  const db = getFirestore();
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const expiredGuests = await db
    .collection('users')
    .where('is_anonymous', '==', true)
    .where('created_at', '<', thirtyMinutesAgo)
    .limit(100) // Process in batches to avoid timeout
    .get();

  if (expiredGuests.empty) {
    console.log('[Scheduler] No expired guests found');
    return;
  }

  const auth = getAuth();

  for (const doc of expiredGuests.docs) {
    try {
      // Delete the Firebase Auth account (triggers cleanup via onDelete)
      await auth.deleteUser(doc.id);
      // Also delete the Firestore doc directly since the auth trigger
      // may not fire for admin-initiated deletions
      await doc.ref.delete();
      console.log(`[Scheduler] Expired guest ${doc.id}`);
    } catch (err) {
      // User may already be deleted — skip silently
      if (err.code !== 'auth/user-not-found') {
        console.error(`[Scheduler] Failed to expire guest ${doc.id}:`, err);
      }
    }
  }

  console.log(`[Scheduler] Expired ${expiredGuests.size} guest accounts`);
});
