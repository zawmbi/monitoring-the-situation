import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useWindowManager } from '../hooks/useWindowManager.jsx';
import './panelWindow.css';

/**
 * PanelWindow — universal wrapper that gives any panel drag / minimize /
 * maximize / undock / dock controls.
 *
 * Props:
 *   id           – unique window key (e.g. "country", "stocks")
 *   title        – display name for the title bar
 *   onClose      – called when user clicks ✕
 *   defaultWidth – CSS width when floating (default 400)
 *   defaultHeight– CSS height when floating (default 500)
 *   defaultMode  – initial mode: 'docked' | 'floating' (default 'docked')
 *   defaultPosition – { x, y } for initial floating position
 *   children     – the panel content
 */
export default function PanelWindow({
  id,
  title,
  onClose,
  defaultWidth = 400,
  defaultHeight = 500,
  defaultMode = 'docked',
  defaultPosition,
  children,
}) {
  const wm = useWindowManager();
  const win = wm.windows[id];
  const dragState = useRef(null);
  const containerRef = useRef(null);

  // Register on mount
  useEffect(() => {
    wm.register(id, {
      title,
      defaultMode,
      defaultPosition,
      defaultSize: { width: defaultWidth, height: defaultHeight },
    });
    return () => wm.unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keep title in sync
  useEffect(() => {
    if (win) wm.updateTitle(id, title);
  }, [id, title, win, wm]);

  // ── Drag handling ──
  // Use refs so event handlers always see latest values
  const wmRef = useRef(wm);
  wmRef.current = wm;
  const idRef = useRef(id);
  idRef.current = id;
  const handlersRef = useRef(null);

  if (!handlersRef.current) {
    const handleMove = (e) => {
      const ds = dragState.current;
      if (!ds) return;
      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;
      wmRef.current.updatePosition(idRef.current, {
        x: Math.max(0, ds.origX + dx),
        y: Math.max(0, ds.origY + dy),
      });
    };
    const handleUp = () => {
      dragState.current = null;
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
    handlersRef.current = { handleMove, handleUp };
  }

  // Cleanup on unmount
  useEffect(() => {
    const { handleMove, handleUp } = handlersRef.current;
    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
  }, []);

  const onPointerDown = (e) => {
    if (!win || win.mode !== 'floating') return;
    e.preventDefault();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: win.position.x,
      origY: win.position.y,
    };
    const { handleMove, handleUp } = handlersRef.current;
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  };

  if (!win) return null;
  if (win.mode === 'minimized') return null;

  const mode = win.mode;

  // ── Styles per mode ──
  const style = { zIndex: win.zIndex };

  if (mode === 'floating') {
    style.left = win.position.x;
    style.top = win.position.y;
    style.width = win.size?.width || defaultWidth;
    style.height = win.size?.height || defaultHeight;
  }
  if (mode === 'docked') {
    style.width = defaultWidth;
  }

  const className = [
    'pw',
    `pw--${mode}`,
  ].join(' ');

  const panel = (
    <div
      className={className}
      style={style}
      ref={containerRef}
      onMouseDown={() => wm.bringToFront(id)}
    >
      {/* ── Title bar ── */}
      <div
        className="pw-titlebar"
        onPointerDown={mode === 'floating' ? onPointerDown : undefined}
      >
        <span className="pw-title">{title}</span>
        <div className="pw-controls">
          {/* Undock / Dock */}
          {mode === 'docked' && (
            <button
              className="pw-btn"
              title="Undock (float)"
              onClick={() => wm.setMode(id, 'floating')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" /><line x1="21" y1="3" x2="14" y2="10" />
                <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
            </button>
          )}
          {mode === 'floating' && (
            <button
              className="pw-btn"
              title="Dock to side"
              onClick={() => wm.setMode(id, 'docked')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </button>
          )}
          {mode === 'maximized' && (
            <button
              className="pw-btn"
              title="Dock to side"
              onClick={() => wm.setMode(id, 'docked')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </button>
          )}

          {/* Minimize */}
          <button
            className="pw-btn"
            title="Minimize"
            onClick={() => wm.setMode(id, 'minimized')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Maximize / Restore */}
          {mode !== 'maximized' ? (
            <button
              className="pw-btn"
              title="Maximize"
              onClick={() => wm.setMode(id, 'maximized')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              className="pw-btn"
              title="Restore"
              onClick={() => wm.setMode(id, 'floating')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="6" width="14" height="14" rx="1" />
                <path d="M6 10h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}

          {/* Close */}
          <button
            className="pw-btn pw-btn--close"
            title="Close"
            onClick={onClose}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="pw-content">
        {children}
      </div>
    </div>
  );

  // Portal maximized and floating windows to document.body so they escape
  // the map-container's stacking context (isolation: isolate) and render
  // above the sidebar and everything else.
  if (mode === 'maximized' || mode === 'floating') {
    return createPortal(panel, document.body);
  }

  return panel;
}
