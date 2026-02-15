/**
 * Input validation and sanitization
 *
 * SECURITY: All user input is validated and sanitized server-side
 * before being written to Firestore. This prevents:
 * - XSS via stored content
 * - JSON injection via config payloads
 * - Oversized payloads causing cost/performance issues
 * - Script injection in display names and messages
 */

// SECURITY: Maximum allowed lengths to prevent abuse and
// excessive Firestore document sizes.
const LIMITS = {
  displayName: 50,
  message: 2000,
  configName: 100,
  configJson: 50000, // 50KB max for config JSON
  reportReason: 500,
};

/**
 * Sanitize a string by stripping HTML tags, trimming whitespace,
 * and enforcing a maximum length.
 *
 * SECURITY: Prevents XSS by removing all HTML. Uses a simple regex
 * rather than a full parser because we want to strip everything —
 * there is no legitimate use case for HTML in these fields.
 *
 * @param {string} str - Raw input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeString(str, maxLength) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[^\S\n]+/g, ' ') // Collapse whitespace (preserve newlines)
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate and sanitize a display name.
 *
 * @param {string} name - Raw display name
 * @returns {{ valid: boolean, value: string, error?: string }}
 */
export function validateDisplayName(name) {
  const sanitized = sanitizeString(name, LIMITS.displayName);
  if (!sanitized || sanitized.length < 1) {
    return { valid: false, value: '', error: 'Display name is required' };
  }
  return { valid: true, value: sanitized };
}

/**
 * Validate and sanitize a chat message.
 *
 * @param {string} message - Raw message text
 * @returns {{ valid: boolean, value: string, error?: string }}
 */
export function validateMessage(message) {
  const sanitized = sanitizeString(message, LIMITS.message);
  if (!sanitized || sanitized.length < 1) {
    return { valid: false, value: '', error: 'Message cannot be empty' };
  }
  return { valid: true, value: sanitized };
}

/**
 * Validate and sanitize a config object.
 *
 * SECURITY: Config JSON is validated for:
 * 1. Valid JSON structure
 * 2. Size limits to prevent cost abuse
 * 3. No executable content (functions, __proto__ pollution)
 *
 * @param {string} name - Config name
 * @param {*} configJson - Config payload (should be a plain object)
 * @returns {{ valid: boolean, name: string, config: object, error?: string }}
 */
export function validateConfig(name, configJson) {
  const sanitizedName = sanitizeString(name, LIMITS.configName);
  if (!sanitizedName) {
    return { valid: false, name: '', config: null, error: 'Config name is required' };
  }

  // SECURITY: Ensure config is a plain object, not a string that could
  // contain executable code or a prototype pollution vector.
  if (typeof configJson !== 'object' || configJson === null || Array.isArray(configJson)) {
    return { valid: false, name: sanitizedName, config: null, error: 'Config must be a JSON object' };
  }

  // SECURITY: Check serialized size to prevent oversized documents
  const serialized = JSON.stringify(configJson);
  if (serialized.length > LIMITS.configJson) {
    return {
      valid: false,
      name: sanitizedName,
      config: null,
      error: `Config exceeds maximum size of ${LIMITS.configJson} bytes`,
    };
  }

  // SECURITY: Re-parse to strip any non-JSON-safe values (functions,
  // undefined, symbols) and prevent __proto__ pollution.
  const cleanConfig = JSON.parse(serialized);
  delete cleanConfig.__proto__;
  delete cleanConfig.constructor;

  return { valid: true, name: sanitizedName, config: cleanConfig };
}

/**
 * Validate a report reason.
 *
 * @param {string} reason - Raw reason text
 * @returns {{ valid: boolean, value: string, error?: string }}
 */
export function validateReportReason(reason) {
  const sanitized = sanitizeString(reason, LIMITS.reportReason);
  if (!sanitized || sanitized.length < 5) {
    return { valid: false, value: '', error: 'Please provide a reason (min 5 characters)' };
  }
  return { valid: true, value: sanitized };
}
