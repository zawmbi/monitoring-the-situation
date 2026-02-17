import React, { useEffect } from 'react';

const SHORTCUTS = [
  { keys: 'Ctrl+K', action: 'Open global search' },
  { keys: 'Escape', action: 'Close topmost panel' },
  { keys: 'Space', action: 'Toggle globe auto-rotation' },
  { keys: '[ / ]', action: 'Cycle sidebar tabs' },
  { keys: '?', action: 'Toggle this overlay' },
];

export function ShortcutsOverlay({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(15,15,30,0.98)', border: '1px solid rgba(100,181,246,0.3)',
          borderRadius: '8px', padding: '20px 24px', minWidth: '300px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#64b5f6', marginBottom: '16px' }}>
          Keyboard Shortcuts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SHORTCUTS.map(s => (
            <div key={s.keys} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
              <kbd style={{
                padding: '2px 8px', borderRadius: '3px',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontFamily: 'inherit',
                minWidth: '60px', textAlign: 'center',
              }}>
                {s.keys}
              </kbd>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                {s.action}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', padding: '4px 16px', borderRadius: '3px',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '10px',
            }}
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
