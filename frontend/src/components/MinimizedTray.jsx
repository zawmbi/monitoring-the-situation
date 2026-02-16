import { useWindowManager } from '../hooks/useWindowManager.jsx';

/**
 * MinimizedTray — renders a bottom bar with chips for each minimized window.
 * Click a chip to restore that window.
 */
export default function MinimizedTray() {
  const wm = useWindowManager();
  const { minimizedWindows } = wm;

  if (minimizedWindows.length === 0) return null;

  return (
    <div className="pw-minimized-tray">
      {minimizedWindows.map((win) => (
        <button
          key={win.id}
          className="pw-tray-chip"
          onClick={() => wm.restore(win.id)}
          title={`Restore ${win.title}`}
        >
          <span className="pw-tray-restore">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="6" width="14" height="14" rx="1" />
              <path d="M6 10h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
            </svg>
          </span>
          {win.title}
        </button>
      ))}
    </div>
  );
}
