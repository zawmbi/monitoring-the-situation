/**
 * Save config — callable Cloud Function
 *
 * SECURITY: Enforces tier-based config limits server-side:
 * - Free tier: Maximum 3 saved configs
 * - Pro tier: Unlimited configs
 *
 * Tier is ALWAYS checked against Firestore, never trusted from the
 * frontend. This prevents users from bypassing limits by spoofing
 * their subscription status in client code.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getVerifiedUser } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rateLimit.js';
import { validateConfig } from '../middleware/validate.js';

const db = getFirestore();

// SECURITY: Tier limits are defined here, not in the frontend.
const CONFIG_LIMITS = {
  free: 3,
  pro: Infinity,
};

/**
 * Handle a saveConfig callable request (create or update).
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {Promise<{ success: boolean, configId?: string, error?: string }>}
 */
export async function handleSaveConfig(request) {
  // 1. SECURITY: Verify authentication
  const uid = request.auth?.uid;
  if (!uid) {
    return { success: false, error: 'Authentication required' };
  }

  const { configId, name, configJson, isPublic } = request.data || {};

  // 2. SECURITY: Verify user exists, is not banned
  let user;
  try {
    user = await getVerifiedUser(uid);
  } catch (err) {
    return { success: false, error: err.message };
  }

  // 3. SECURITY: Rate-limit config saves
  const tier = user.subscription_status || 'free';
  const rateLimitResult = await checkRateLimit(uid, 'config_save', tier);
  if (!rateLimitResult.allowed) {
    return { success: false, error: 'Too many saves. Please wait.' };
  }

  // 4. SECURITY: Validate and sanitize config data
  const validation = validateConfig(name, configJson);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // 5. SECURITY: If this is a new config (no configId), check tier limits
  if (!configId) {
    const maxConfigs = CONFIG_LIMITS[tier] || CONFIG_LIMITS.free;
    const existingCount = await db
      .collection('configs')
      .where('user_id', '==', uid)
      .count()
      .get();

    const count = existingCount.data().count;

    if (count >= maxConfigs) {
      return {
        success: false,
        error: `Config limit reached (${maxConfigs} for ${tier} tier). Upgrade to Pro for unlimited configs.`,
      };
    }
  }

  // 6. If updating an existing config, verify ownership
  if (configId) {
    const existingDoc = await db.collection('configs').doc(configId).get();
    if (!existingDoc.exists) {
      return { success: false, error: 'Config not found' };
    }

    // SECURITY: Prevent cross-user config modification.
    // A user can only update their own configs.
    if (existingDoc.data().user_id !== uid) {
      return { success: false, error: 'Access denied' };
    }

    // Update existing config
    await db.collection('configs').doc(configId).update({
      name: validation.name,
      config_json: validation.config,
      is_public: isPublic === true,
      updated_at: FieldValue.serverTimestamp(),
    });

    return { success: true, configId };
  }

  // 7. Create new config
  const newDoc = await db.collection('configs').add({
    user_id: uid,
    name: validation.name,
    config_json: validation.config,
    is_public: isPublic === true,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  return { success: true, configId: newDoc.id };
}
