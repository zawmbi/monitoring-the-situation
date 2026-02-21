/**
 * Theme configuration layer
 *
 * Defines theme tokens for the app. Each theme overrides CSS custom
 * properties via `data-theme` on <html>. The CSS in index.css supports
 * :root (cyber-control-room default), [data-theme="dark-minimal"],
 * [data-theme="light-analytic"], and [data-theme="dune"].
 *
 * To add a theme:
 * 1. Add an entry to THEMES below
 * 2. Add a matching [data-theme="<id>"] block in index.css
 *
 * SECURITY: Theme IDs are validated before applying to prevent
 * injection into the dataset attribute.
 */

const THEMES = {
  'cyber-control-room': {
    id: 'cyber-control-room',
    label: 'Cyber Control Room',
    // CSS variables are defined in index.css :root (default theme)
  },
  'dark-minimal': {
    id: 'dark-minimal',
    label: 'Dark Minimal',
    // CSS variables are defined in index.css [data-theme="dark-minimal"]
  },
  'light-analytic': {
    id: 'light-analytic',
    label: 'Light Analytic',
    // CSS variables are defined in index.css [data-theme="light-analytic"]
  },
  'dune': {
    id: 'dune',
    label: 'Dune',
    // CSS variables are defined in index.css [data-theme="dune"]
  },
};

/** All valid theme IDs */
export const THEME_IDS = Object.keys(THEMES);

// Legacy theme ID mapping for migration from old 'dark'/'light' values
const LEGACY_MAP = {
  dark: 'cyber-control-room',
  light: 'light-analytic',
};

/**
 * Validate and return a safe theme ID.
 * Falls back to 'cyber-control-room' if the given ID is not recognized.
 * Supports legacy 'dark'/'light' IDs via migration.
 *
 * SECURITY: Prevents arbitrary strings from being set as data-theme.
 *
 * @param {string} id - Theme ID to validate
 * @returns {string} Validated theme ID
 */
export function validateThemeId(id) {
  if (THEME_IDS.includes(id)) return id;
  if (LEGACY_MAP[id]) return LEGACY_MAP[id];
  return 'cyber-control-room';
}

/**
 * Apply a theme to the document.
 * Sets `data-theme` and `color-scheme` on the root element.
 * cyber-control-room uses :root defaults (no data-theme needed).
 *
 * @param {string} themeId - Theme ID to apply
 */
export function applyTheme(themeId) {
  const safeId = validateThemeId(themeId);
  if (safeId === 'cyber-control-room') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = safeId;
  }
  document.documentElement.style.colorScheme = safeId === 'light-analytic' ? 'light' : 'dark';
}

/**
 * Read the initial theme from localStorage or system preference.
 * Used during app initialization before auth state resolves,
 * so the user sees the correct theme immediately (no flicker).
 *
 * @returns {string} Theme ID
 */
export function getStoredTheme() {
  if (typeof window === 'undefined') return 'cyber-control-room';
  const stored = window.localStorage.getItem('theme');
  if (stored) {
    const validated = validateThemeId(stored);
    if (validated) return validated;
  }
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light-analytic';
  return 'cyber-control-room';
}

export default THEMES;
