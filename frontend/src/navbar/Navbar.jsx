import { useState } from 'react';
import { NAV_PAGES } from './navData';
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
}) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const currentTheme = themes.find(t => t.id === theme);

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
          <button type="button" className="navbar-login" aria-disabled="true">
            Login
          </button>

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
