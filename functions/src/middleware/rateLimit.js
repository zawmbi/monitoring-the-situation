/**
 * Rate limiting via Firestore
 *
 * SECURITY: Prevents message flooding, API abuse, and spam.
 * Uses a sliding window counter stored in Firestore.
 * Rate limits are enforced per-user, never per-IP (privacy).
 *
 * Free tier:  10 messages per 60 seconds
 * Pro tier:   30 messages per 60 seconds
 * Admin/mod:  60 messages per 60 seconds
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

// SECURITY: Rate limits are defined server-side only.
// Frontend never controls these values.
const RATE_LIMITS = {
  free: { maxRequests: 10, windowSeconds: 60 },
  pro: { maxRequests: 30, windowSeconds: 60 },
  admin: { maxRequests: 60, windowSeconds: 60 },
  mod: { maxRequests: 60, windowSeconds: 60 },
};

// SECURITY: Spam threshold — if a user exceeds this many blocked
// requests in a rolling window, they are auto-muted.
const SPAM_AUTO_MUTE_THRESHOLD = 5;

/**
 * Check if a user has exceeded their rate limit for a given action.
 *
 * SECURITY: Uses Firestore transactions for atomicity — prevents
 * race conditions where concurrent requests bypass the limit.
 *
 * @param {string} uid - Firebase UID
 * @param {string} action - Action key (e.g., 'chat_message', 'config_save')
 * @param {string} tier - User tier ('free', 'pro', 'admin', 'mod')
 * @returns {Promise<{ allowed: boolean, remaining: number }>}
 */
export async function checkRateLimit(uid, action, tier = 'free') {
  const limits = RATE_LIMITS[tier] || RATE_LIMITS.free;
  const docRef = db.collection('rate_limits').doc(`${uid}_${action}`);
  const now = Date.now();
  const windowStart = now - limits.windowSeconds * 1000;

  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    const data = doc.exists ? doc.data() : { timestamps: [], violation_count: 0 };

    // Remove timestamps outside the current window
    const recentTimestamps = (data.timestamps || []).filter((ts) => ts > windowStart);

    if (recentTimestamps.length >= limits.maxRequests) {
      // SECURITY: Track violation count for auto-mute detection
      const newViolationCount = (data.violation_count || 0) + 1;
      transaction.set(docRef, {
        timestamps: recentTimestamps,
        violation_count: newViolationCount,
        last_violation: now,
        updated_at: FieldValue.serverTimestamp(),
      });

      return {
        allowed: false,
        remaining: 0,
        violationCount: newViolationCount,
      };
    }

    // Allow the request and record the timestamp
    recentTimestamps.push(now);
    transaction.set(docRef, {
      timestamps: recentTimestamps,
      violation_count: data.violation_count || 0,
      updated_at: FieldValue.serverTimestamp(),
    });

    return {
      allowed: true,
      remaining: limits.maxRequests - recentTimestamps.length,
      violationCount: data.violation_count || 0,
    };
  });
}

/**
 * Check if a user should be auto-muted due to excessive spam.
 *
 * SECURITY: This is a secondary defense layer — even if rate limiting
 * blocks individual messages, repeated violations trigger a temporary
 * mute to reduce load from bad actors.
 *
 * @param {number} violationCount - Number of rate limit violations
 * @returns {boolean}
 */
export function shouldAutoMute(violationCount) {
  return violationCount >= SPAM_AUTO_MUTE_THRESHOLD;
}
