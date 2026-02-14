import { useState, useEffect } from 'react';

export default function GlobalStatusBar({ tensionData, disasterData, cyberData, commoditiesData }) {
  const [utcTime, setUtcTime] = useState(new Date().toISOString().slice(11, 19));

  useEffect(() => {
    const id = setInterval(() => setUtcTime(new Date().toISOString().slice(11, 19)), 1000);
    return () => clearInterval(id);
  }, []);

  const tensionIndex = tensionData?.index ?? '--';
  const tensionLabel = tensionData?.label ?? 'N/A';
  const tensionColor = tensionIndex >= 75 ? '#ff4444' : tensionIndex >= 50 ? '#ffa726' : tensionIndex >= 25 ? '#ffd700' : '#66bb6a';

  const activeConflicts = tensionData?.summary?.totalConflicts ?? '--';
  const activeDisasters = disasterData?.summary?.totalActive ?? '--';
  const cyberThreats = cyberData?.summary?.totalActive ?? cyberData?.threats?.length ?? '--';

  const gainers = commoditiesData?.summary?.gainers ?? '--';
  const losers = commoditiesData?.summary?.losers ?? '--';

  const bar = {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
    height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px',
    background: 'linear-gradient(180deg, rgba(18,18,30,0.96) 0%, rgba(10,10,20,0.98) 100%)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '11px',
    color: 'rgba(255,255,255,0.7)', padding: '0 16px', userSelect: 'none',
    backdropFilter: 'blur(12px)', letterSpacing: '0.3px',
  };

  const sep = { width: '1px', height: '14px', background: 'rgba(255,255,255,0.12)', flexShrink: 0 };
  const label = { color: 'rgba(255,255,255,0.4)', marginRight: '4px', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.8px' };
  const val = { fontWeight: 600 };

  return (
    <div style={bar} className="global-status-bar">
      {/* Live indicator */}
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%', background: '#44ff44',
          boxShadow: '0 0 6px #44ff44', animation: 'pulse-live 2s ease-in-out infinite',
        }} />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', letterSpacing: '1px' }}>LIVE</span>
      </span>

      <div style={sep} />

      <span><span style={label}>Tension</span><span style={{ ...val, color: tensionColor }}>{tensionIndex}/100</span> <span style={{ color: tensionColor, fontSize: '9px' }}>({tensionLabel})</span></span>

      <div style={sep} />

      <span><span style={label}>Conflicts</span><span style={{ ...val, color: '#ff6b6b' }}>{activeConflicts}</span></span>

      <div style={sep} />

      <span><span style={label}>Disasters</span><span style={{ ...val, color: '#ffa726' }}>{activeDisasters}</span></span>

      <div style={sep} />

      <span><span style={label}>Cyber</span><span style={{ ...val, color: '#ce93d8' }}>{cyberThreats}</span></span>

      <div style={sep} />

      <span>
        <span style={label}>Markets</span>
        <span style={{ ...val, color: '#66bb6a' }}>{gainers}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 2px' }}>/</span>
        <span style={{ ...val, color: '#ef5350' }}>{losers}</span>
      </span>

      <div style={sep} />

      <span><span style={label}>UTC</span><span style={val}>{utcTime}</span></span>

      <style>{`@keyframes pulse-live { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}
