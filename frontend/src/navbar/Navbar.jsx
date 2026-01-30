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
            <span className="navbar-logo-icon" aria-hidden="true">
              <img src={logoSrc} alt="" className="navbar-logo-image" />
            </span>
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
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-pressed={theme === 'light'}
          >
          <span className="theme-toggle-icon" aria-hidden="true">
            <img
              src={theme === 'light' ? '/attachments/sun_icon.svg' : '/attachments/moon.svg'}
              alt=""
              className="theme-toggle-image"
            />
          </span>
            <span className="theme-toggle-text">
              {theme === 'light' ? 'Light' : 'Dark'}
            </span>
          </button>

          <button type="button" className="navbar-login" aria-disabled="true">
            Login
          </button>
        </div>
      </header>

      <button
        type="button"
        className="navbar-handle"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        {collapsed ? 'v' : '^'}
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
