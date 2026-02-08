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
  onToggleTheme,
  useGlobe,
  onToggleGlobe,
  collapsed,
  onToggleCollapse,
}) {
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

          <button
            type="button"
            className="navbar-icon-btn"
            onClick={onToggleGlobe}
            aria-label={useGlobe ? 'Switch to 2D map' : 'Switch to 3D globe'}
            title={useGlobe ? 'Switch to 2D' : 'Switch to 3D'}
          >
            <span className="navbar-icon-btn-label">{useGlobe ? '3D' : '2D'}</span>
          </button>

          <button
            type="button"
            className="navbar-icon-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {theme === 'light' ? (
                <>
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </>
              ) : (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              )}
            </svg>
          </button>
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
