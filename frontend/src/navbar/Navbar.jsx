import { useState, useRef, useEffect } from 'react';
import { NAV_PAGES } from './navData';
import { useAuth } from '../hooks/useAuth';
import './navbar.css';

const NAV_ITEMS = NAV_PAGES.map(({ id, label }) => ({
  id,
  label,
}));

function Navbar({
  title,
  logoSrc,
  activePage,
  onNavigate,
  theme,
  themes = [],
  onToggleTheme,
  onSetTheme,
  useGlobe,
  onToggleGlobe,
  musicPlaying,
  onToggleMusic,
  musicVolume,
  onVolumeChange,
  collapsed,
  onToggleCollapse,
  onOpenAccount,
}) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const loginMenuRef = useRef(null);

  const currentTheme = themes.find(t => t.id === theme);

  const {
    user,
    profile,
    loading: authLoading,
    isAuthenticated,
    isAnonymous,
    signInWithGoogle,
    signInAsGuest,
    upgradeAccount,
    signOut,
  } = useAuth();

  // Close login menu when clicking outside
  useEffect(() => {
    if (!showLoginMenu) return;
    const handleClickOutside = (e) => {
      if (loginMenuRef.current && !loginMenuRef.current.contains(e.target)) {
        setShowLoginMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLoginMenu]);

  const handleGoogleLogin = async () => {
    setShowLoginMenu(false);
    try {
      await signInWithGoogle();
    } catch { /* AuthContext sets error state */ }
  };

  const handleGuestLogin = async () => {
    setShowLoginMenu(false);
    try {
      await signInAsGuest();
    } catch { /* AuthContext sets error state */ }
  };

  const handleUpgrade = async () => {
    setShowLoginMenu(false);
    try {
      await upgradeAccount();
    } catch { /* AuthContext sets error state */ }
  };

  const handleLogout = async () => {
    setShowLoginMenu(false);
    try {
      await signOut();
    } catch { /* AuthContext sets error state */ }
  };

  // Determine display name for the button label
  const displayName = profile?.display_name
    || (isAnonymous ? `Guest_${user?.uid?.slice(0, 6) || ''}` : null);

  return (
    <div className={`navbar-frame ${collapsed ? 'collapsed' : ''}`}>
      <header className="navbar" aria-label="Primary">
        <div className="navbar-left">
          <button
            type="button"
            className="navbar-logo"
            onClick={() => onNavigate(null)}
            aria-label="Go to live map"
          >
            <span className="navbar-title">{title}</span>
          </button>
        </div>

        <nav className="navbar-links" aria-label="Site">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`navbar-link ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={item.label}
            >
              <span className="navbar-link-label">{item.label}</span>
            </button>
          );
        })}
        </nav>

        <div className="navbar-actions">
          {/* ========================================
              LOGIN / ACCOUNT BUTTON
              ========================================
              - Unauthenticated: Shows "Login" → dropdown with Google / Guest
              - Anonymous:       Shows guest name → dropdown with Upgrade / Logout
              - Authenticated:   Shows display name → dropdown with Logout
              SECURITY: Auth actions are delegated to AuthContext which wraps
              Firebase Auth SDK methods. No tokens are exposed here. */}
          <div className="navbar-login-wrap" ref={loginMenuRef}>
            {authLoading ? (
              <span className="navbar-login navbar-login--loading" aria-busy="true">
                &middot;&middot;&middot;
              </span>
            ) : isAuthenticated ? (
              <button
                type="button"
                className="navbar-login navbar-login--active"
                onClick={() => setShowLoginMenu((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={showLoginMenu}
                title={displayName || 'Account'}
              >
                {displayName || 'Account'}
              </button>
            ) : (
              <button
                type="button"
                className="navbar-login"
                onClick={() => setShowLoginMenu((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={showLoginMenu}
              >
                Login
              </button>
            )}

            {showLoginMenu && (
              <div className="navbar-login-menu" role="menu" aria-label="Account menu">
                {!isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      className="navbar-login-menu-item"
                      role="menuitem"
                      onClick={handleGoogleLogin}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                        <path d="M12 8v8M8 12h8" />
                      </svg>
                      Continue with Google
                    </button>
                    <button
                      type="button"
                      className="navbar-login-menu-item"
                      role="menuitem"
                      onClick={handleGuestLogin}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Continue as Guest
                    </button>
                  </>
                ) : (
                  <>
                    <div className="navbar-login-menu-header">
                      <span className="navbar-login-menu-name">{displayName}</span>
                      {isAnonymous && (
                        <span className="navbar-login-menu-badge">Guest</span>
                      )}
                      {profile?.subscription_status === 'pro' && (
                        <span className="navbar-login-menu-badge navbar-login-menu-badge--pro">Pro</span>
                      )}
                    </div>
                    {isAnonymous && (
                      <button
                        type="button"
                        className="navbar-login-menu-item navbar-login-menu-item--upgrade"
                        role="menuitem"
                        onClick={handleUpgrade}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="17 1 21 5 17 9" />
                          <path d="M3 11V9a4 4 0 014-4h14" />
                          <polyline points="7 23 3 19 7 15" />
                          <path d="M21 13v2a4 4 0 01-4 4H3" />
                        </svg>
                        Upgrade to Google
                      </button>
                    )}
                    <button
                      type="button"
                      className="navbar-login-menu-item"
                      role="menuitem"
                      onClick={() => { setShowLoginMenu(false); onOpenAccount?.(); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Account
                    </button>
                    <button
                      type="button"
                      className="navbar-login-menu-item"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="navbar-music-wrap"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              type="button"
              className="navbar-icon-btn"
              onClick={onToggleMusic}
              aria-label={musicPlaying ? 'Mute music' : 'Play music'}
              title={musicPlaying ? 'Mute music' : 'Play music'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {musicPlaying ? (
                  <>
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" fill="currentColor" />
                    <circle cx="18" cy="16" r="3" fill="currentColor" />
                  </>
                ) : (
                  <>
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                )}
              </svg>
            </button>
            {showVolumeSlider && (
              <div className="navbar-volume-popup">
                <svg className="navbar-volume-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <path d="M15.54 8.46a5 5 0 010 7.07" />
                </svg>
                <input
                  type="range"
                  className="navbar-volume-slider"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume ?? 0.5}
                  onChange={(e) => onVolumeChange?.(Number(e.target.value))}
                  aria-label="Music volume"
                />
                <span className="navbar-volume-label">{Math.round((musicVolume ?? 0.5) * 100)}%</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="navbar-icon-btn"
            onClick={onToggleGlobe}
            aria-label={useGlobe ? 'Switch to 2D map' : 'Switch to 3D globe'}
            title={useGlobe ? 'Switch to 2D' : 'Switch to 3D'}
          >
            <span className="navbar-icon-btn-label">{useGlobe ? '3D' : '2D'}</span>
          </button>

          {/* Theme selector dropdown */}
          <div
            className="theme-selector"
            onMouseEnter={() => setShowThemeMenu(true)}
            onMouseLeave={() => setShowThemeMenu(false)}
          >
            <button
              type="button"
              className="theme-selector-btn"
              onClick={onToggleTheme}
              aria-label="Change theme"
              title={currentTheme ? currentTheme.label : 'Theme'}
            >
              <span
                className="theme-option-swatch"
                style={{ background: currentTheme?.swatch || '#00d4ff' }}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
            {showThemeMenu && themes.length > 0 && (
              <div className="theme-selector-dropdown">
                {themes.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`theme-option ${theme === t.id ? 'active' : ''}`}
                    onClick={() => {
                      onSetTheme(t.id);
                      setShowThemeMenu(false);
                    }}
                  >
                    <span className="theme-option-swatch" style={{ background: t.swatch }} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <button
        type="button"
        className="navbar-handle"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {collapsed ? (
            <polyline points="6 9 12 15 18 9" />
          ) : (
            <polyline points="6 15 12 9 18 15" />
          )}
        </svg>
      </button>
    </div>
  );
}

export function PagePanel({ pageId, onClose }) {
  const page = NAV_PAGES.find((entry) => entry.id === pageId);
  if (!page) return null;

  return (
    <aside className="page-panel" role="dialog" aria-label={page.label}>
      <div className="page-panel-header">
        <div>
          <div className="page-panel-title">{page.label}</div>
          <div className="page-panel-subtitle">{page.summary}</div>
        </div>
        <button type="button" className="page-panel-close" onClick={onClose} aria-label="Close">
          x
        </button>
      </div>
      <div className="page-panel-body">
        {page.sections.map((section) => (
          <div key={section.title} className="page-panel-section">
            <div className="page-panel-section-title">{section.title}</div>
            <ul className="page-panel-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default Navbar;
