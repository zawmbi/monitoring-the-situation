import React, { useState, useEffect } from 'react';

export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setOnline(true); setDismissed(false); };
    const handleOffline = () => { setOnline(false); setDismissed(false); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online || dismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100001,
      background: 'rgba(244,67,54,0.95)',
      color: '#fff',
      padding: '6px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: '11px',
      fontWeight: 600,
      backdropFilter: 'blur(4px)',
    }}>
      <span style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: '#fff', animation: 'pulse-live 1.5s infinite',
      }} />
      <span>Network offline — showing cached data. Some panels may be stale.</span>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: '#fff',
          padding: '2px 8px',
          borderRadius: '3px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '10px',
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
