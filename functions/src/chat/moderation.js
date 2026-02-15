/**
 * Chat moderation — profanity filter and toxicity scoring
 *
 * SECURITY: All messages pass through this filter before being stored.
 * This is a server-side check — the frontend never decides whether a
 * message is acceptable. Messages exceeding the toxicity threshold
 * are silently dropped (shadowban behavior for flagged users) or
 * rejected with an error for normal users.
 *
 * The profanity list is intentionally basic. For production at scale,
 * integrate a dedicated moderation API (e.g., Perspective API, OpenAI
 * Moderation, or AWS Comprehend).
 */

// SECURITY: Profanity patterns are checked server-side only.
// This list is a starting point — extend as needed or integrate
// a third-party moderation API for production use.
const PROFANITY_PATTERNS = [
  /\bf+u+c+k+/i,
  /\bs+h+i+t+/i,
  /\ba+s+s+h+o+l+e+/i,
  /\bb+i+t+c+h+/i,
  /\bd+a+m+n+/i,
  /\bc+u+n+t+/i,
  /\bn+i+g+g+/i,
  /\bf+a+g+/i,
  /\br+e+t+a+r+d+/i,
  /\bk+i+l+l\s+(y+o+u+r+s+e+l+f+|u+r+s+e+l+f+)/i,
  /\bdie\b/i,
  /\bk+y+s+\b/i,
];

// SECURITY: Spam detection patterns — repeated characters, all caps,
// and link flooding are common spam vectors.
const SPAM_PATTERNS = [
  /(.)\1{10,}/, // 10+ repeated characters
  /^[A-Z\s!?]{50,}$/, // 50+ all-caps characters (shouting)
  /(https?:\/\/\S+\s*){4,}/, // 4+ links in one message
];

/**
 * Score a message for toxicity. Returns a score between 0 and 1.
 *
 * SECURITY: This is a heuristic scorer. For production, replace or
 * supplement with an ML-based moderation API. The score is stored
 * alongside the message for audit and retroactive moderation.
 *
 * @param {string} message - The sanitized message text
 * @returns {{ score: number, flags: string[] }}
 */
export function scoreToxicity(message) {
  const flags = [];
  let score = 0;

  // Check profanity patterns
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(message)) {
      flags.push('profanity');
      score += 0.4;
      break; // One match is enough to flag
    }
  }

  // Check spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(message)) {
      flags.push('spam');
      score += 0.3;
      break;
    }
  }

  // Check message density (very short messages sent rapidly are often spam)
  if (message.length < 3) {
    flags.push('low_content');
    score += 0.1;
  }

  // Cap at 1.0
  return { score: Math.min(score, 1.0), flags };
}

/**
 * Determine if a message should be blocked based on its toxicity score.
 *
 * SECURITY: The threshold is set conservatively (0.5) to catch obvious
 * abuse while minimizing false positives. Adjust based on your
 * community's needs and false positive rate.
 *
 * @param {number} score - Toxicity score (0-1)
 * @returns {boolean} True if the message should be blocked
 */
export function shouldBlockMessage(score) {
  return score >= 0.5;
}
