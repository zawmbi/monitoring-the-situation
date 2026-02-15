/**
 * Save user settings — callable Cloud Function
 *
 * SECURITY: This function is the ONLY path for updating user preferences.
 * It validates which fields can be modified and rejects any attempt to
 * change restricted fields (role, subscription_status, banned_flag, email,
 * is_anonymous, created_at). This prevents privilege escalation and
 * tier spoofing from the frontend.
 *
 * Allowed fields:
 * - theme_preference (string, validated against known theme IDs)
 * - dashboard_layout_settings (object, size-limited)
 * - desktop_preferences (object, size-limited)
 * - display_name (string, sanitized)
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getVerifiedUser } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rateLimit.js';
import { sanitizeString } from '../middleware/validate.js';

const db = getFirestore();

// SECURITY: Only these fields can be modified by the user.
// Any other field in the request payload is silently ignored.
const ALLOWED_FIELDS = new Set([
  'theme_preference',
  'dashboard_layout_settings',
  'desktop_preferences',
  'display_name',
]);

// SECURITY: Valid theme IDs — prevents injection into data-theme attribute
const VALID_THEMES = new Set(['dark', 'light', 'custom']);

// SECURITY: Maximum size for settings JSON objects
const MAX_SETTINGS_JSON_SIZE = 20000; // 20KB

/**
 * Handle a saveSettings callable request.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function handleSaveSettings(request) {
  // 1. SECURITY: Verify authentication
  const uid = request.auth?.uid;
  if (!uid) {
    return { success: false, error: 'Authentication required' };
  }

  const data = request.data || {};

  // 2. SECURITY: Verify user exists and is not banned
  let user;
  try {
    user = await getVerifiedUser(uid);
  } catch (err) {
    return { success: false, error: err.message };
  }

  // 3. SECURITY: Rate-limit settings saves
  const tier = user.subscription_status || 'free';
  const rateLimitResult = await checkRateLimit(uid, 'settings_save', tier);
  if (!rateLimitResult.allowed) {
    return { success: false, error: 'Too many saves. Please wait.' };
  }

  // 4. Build the update payload with only allowed fields
  const update = {};

  if (data.theme_preference !== undefined) {
    // SECURITY: Validate theme ID against whitelist
    if (!VALID_THEMES.has(data.theme_preference)) {
      return { success: false, error: 'Invalid theme_preference' };
    }
    update.theme_preference = data.theme_preference;
  }

  if (data.display_name !== undefined) {
    const sanitized = sanitizeString(data.display_name, 50);
    if (!sanitized || sanitized.length < 1) {
      return { success: false, error: 'Display name is required' };
    }
    update.display_name = sanitized;
  }

  if (data.dashboard_layout_settings !== undefined) {
    // SECURITY: Must be a plain object and within size limits
    if (typeof data.dashboard_layout_settings !== 'object'
        || data.dashboard_layout_settings === null
        || Array.isArray(data.dashboard_layout_settings)) {
      return { success: false, error: 'dashboard_layout_settings must be an object' };
    }
    const serialized = JSON.stringify(data.dashboard_layout_settings);
    if (serialized.length > MAX_SETTINGS_JSON_SIZE) {
      return { success: false, error: 'dashboard_layout_settings exceeds size limit' };
    }
    // SECURITY: Re-parse to strip non-JSON-safe values
    update.dashboard_layout_settings = JSON.parse(serialized);
  }

  if (data.desktop_preferences !== undefined) {
    if (typeof data.desktop_preferences !== 'object'
        || data.desktop_preferences === null
        || Array.isArray(data.desktop_preferences)) {
      return { success: false, error: 'desktop_preferences must be an object' };
    }
    const serialized = JSON.stringify(data.desktop_preferences);
    if (serialized.length > MAX_SETTINGS_JSON_SIZE) {
      return { success: false, error: 'desktop_preferences exceeds size limit' };
    }
    update.desktop_preferences = JSON.parse(serialized);
  }

  // Nothing to update
  if (Object.keys(update).length === 0) {
    return { success: true };
  }

  // 5. SECURITY: Double-check that no restricted fields leaked through
  for (const key of Object.keys(update)) {
    if (!ALLOWED_FIELDS.has(key)) {
      delete update[key];
    }
  }

  update.updated_at = FieldValue.serverTimestamp();

  // 6. Write to Firestore
  await db.collection('users').doc(uid).update(update);

  return { success: true };
}
