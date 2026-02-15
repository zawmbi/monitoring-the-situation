/**
 * Theme configuration layer
 *
 * Defines theme tokens for the app. Each theme overrides CSS custom
 * properties via `data-theme` on <html>. The CSS in index.css already
 * supports :root (dark) and [data-theme="light"] — this module
 * provides the metadata and future-proofs custom/per-user themes.
 *
 * To add a theme:
 * 1. Add an entry to THEMES below
 * 2. Add a matching [data-theme="<id>"] block in index.css
 *
 * SECURITY: Theme IDs are validated before applying to prevent
 * injection into the dataset attribute.
 */

const THEMES = {
  dark: {
    id: 'dark',
    label: 'Dark',
    // CSS variables are defined in index.css :root (dark is default)
  },
  light: {
    id: 'light',
    label: 'Light',
    // CSS variables are defined in index.css [data-theme="light"]
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    // Placeholder for future per-user custom themes.
    // Custom themes will be stored in the user's Firestore document
    // and applied at runtime via CSS variable overrides.
  },
};

/** All valid theme IDs */
export const THEME_IDS = Object.keys(THEMES);

/**
 * Validate and return a safe theme ID.
 * Falls back to 'dark' if the given ID is not recognized.
 *
 * SECURITY: Prevents arbitrary strings from being set as data-theme.
 *
 * @param {string} id - Theme ID to validate
 * @returns {string} Validated theme ID
 */
export function validateThemeId(id) {
  return THEME_IDS.includes(id) ? id : 'dark';
}

/**
 * Apply a theme to the document.
 * Sets `data-theme` and `color-scheme` on the root element.
 *
 * @param {string} themeId - Theme ID to apply
 */
export function applyTheme(themeId) {
  const safeId = validateThemeId(themeId);
  document.documentElement.dataset.theme = safeId;
  document.documentElement.style.colorScheme = safeId === 'light' ? 'light' : 'dark';
}

/**
 * Read the initial theme from localStorage or system preference.
 * Used during app initialization before auth state resolves,
 * so the user sees the correct theme immediately (no flicker).
 *
 * @returns {string} Theme ID
 */
export function getStoredTheme() {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem('theme');
  if (stored && THEME_IDS.includes(stored)) return stored;
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export default THEMES;
