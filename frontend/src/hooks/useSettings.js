/**
 * useSettings hook — User settings persistence
 *
 * Lazy-loads user settings from the Firestore profile after login.
 * Provides save functions that write through Cloud Functions.
 * Falls back to localStorage for unauthenticated/anonymous users.
 *
 * Settings restored on login:
 * - theme_preference
 * - dashboard_layout_settings
 * - desktop_preferences
 *
 * SECURITY: All writes go through Cloud Functions (settingsSave).
 * The frontend cannot modify restricted fields (role, subscription_status).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth.js';
import { saveSettings as saveSettingsCallable } from '../firebase/firestore.js';
import { validateThemeId } from '../themes/index.js';

// Debounce interval for saves (ms) — prevents spamming Cloud Functions
const SAVE_DEBOUNCE_MS = 1500;

/**
 * @param {object} options
 * @param {Function} options.onThemeRestored - Called when theme is restored from profile
 * @returns {object} Settings state and save functions
 */
export function useSettings({ onThemeRestored } = {}) {
  const { user, profile, isAuthenticated, isAnonymous } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const saveTimerRef = useRef(null);
  const onThemeRestoredRef = useRef(onThemeRestored);
  onThemeRestoredRef.current = onThemeRestored;

  // Restore settings from profile when it arrives after login
  useEffect(() => {
    if (!profile) {
      setSettingsLoaded(false);
      return;
    }

    // Restore theme from user profile (overrides localStorage)
    if (profile.theme_preference) {
      const safeTheme = validateThemeId(profile.theme_preference);
      window.localStorage.setItem('theme', safeTheme);
      onThemeRestoredRef.current?.(safeTheme);
    }

    // Restore dashboard layout settings
    if (profile.dashboard_layout_settings) {
      try {
        window.localStorage.setItem(
          'dashboardLayout',
          JSON.stringify(profile.dashboard_layout_settings),
        );
      } catch { /* ignore quota errors */ }
    }

    // Restore desktop preferences (visual layers, sidebar state, etc.)
    if (profile.desktop_preferences) {
      try {
        const prefs = profile.desktop_preferences;
        if (prefs.visualLayers) {
          window.localStorage.setItem('visualLayers', JSON.stringify(prefs.visualLayers));
        }
        if (typeof prefs.navCollapsed === 'boolean') {
          window.localStorage.setItem('navCollapsed', String(prefs.navCollapsed));
        }
      } catch { /* ignore quota errors */ }
    }

    setSettingsLoaded(true);
  }, [profile]);

  /**
   * Save a setting via Cloud Function (debounced).
   * Falls back to localStorage-only for anonymous users.
   *
   * SECURITY: The Cloud Function validates the caller and prevents
   * modification of restricted fields (role, subscription_status, banned_flag).
   */
  const save = useCallback(
    async (settings) => {
      // Always persist to localStorage immediately for responsiveness
      if (settings.theme_preference) {
        window.localStorage.setItem('theme', settings.theme_preference);
      }
      if (settings.dashboard_layout_settings) {
        try {
          window.localStorage.setItem(
            'dashboardLayout',
            JSON.stringify(settings.dashboard_layout_settings),
          );
        } catch { /* ignore */ }
      }
      if (settings.desktop_preferences) {
        try {
          const prefs = settings.desktop_preferences;
          if (prefs.visualLayers) {
            window.localStorage.setItem('visualLayers', JSON.stringify(prefs.visualLayers));
          }
          if (typeof prefs.navCollapsed === 'boolean') {
            window.localStorage.setItem('navCollapsed', String(prefs.navCollapsed));
          }
        } catch { /* ignore */ }
      }

      // Skip Cloud Function save for anonymous users — their settings
      // only persist in localStorage until guest session expires.
      if (!isAuthenticated || isAnonymous) return;

      // Debounce: clear any pending save and schedule a new one
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(async () => {
        setSaving(true);
        setError(null);
        try {
          const result = await saveSettingsCallable(settings);
          if (!result.data.success) {
            setError(result.data.error);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setSaving(false);
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [isAuthenticated, isAnonymous],
  );

  /** Save theme preference */
  const saveTheme = useCallback(
    (themeId) => {
      const safeId = validateThemeId(themeId);
      save({ theme_preference: safeId });
    },
    [save],
  );

  /** Save dashboard layout */
  const saveDashboardLayout = useCallback(
    (layout) => {
      save({ dashboard_layout_settings: layout });
    },
    [save],
  );

  /** Save desktop preferences (visual layers, nav collapsed, etc.) */
  const saveDesktopPreferences = useCallback(
    (prefs) => {
      save({ desktop_preferences: prefs });
    },
    [save],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return {
    saving,
    error,
    settingsLoaded,
    saveTheme,
    saveDashboardLayout,
    saveDesktopPreferences,
    save,
    displayName: profile?.display_name || (user?.isAnonymous ? `Guest_${user.uid.slice(0, 6)}` : user?.displayName || null),
  };
}
