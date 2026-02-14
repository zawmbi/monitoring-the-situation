import { useState } from 'react';

const TENSION_COLORS = {
  Critical: '#ff4444',
  High: '#ff8c00',
  Elevated: '#ffd700',
  Guarded: '#4ecdc4',
  Low: '#4a9eff',
};

const ESCALATION_COLORS = {
  critical: '#ff4444',
  high: '#ff8c00',
  elevated: '#ffd700',
  moderate: '#4ecdc4',
  low: '#4a9eff',
};

export function TensionPanel({ data, loading, onRefresh }) {
  const [tab, setTab] = useState('conflicts');

  if (loading && !data) {
    return <div className="panel-loading">Loading tension data...</div>;
  }
  if (!data) return <div className="panel-empty">No tension data available</div>;

  const tensionColor = TENSION_COLORS[data.label] || '#ffd700';

  return (
    <div className="tension-panel">
      {/* Global Tension Meter */}
      <div className="tp-meter">
        <div className="tp-meter-label">GLOBAL TENSION INDEX</div>
        <div className="tp-meter-gauge">
          <div className="tp-meter-track">
            <div className="tp-meter-fill" style={{ width: `${data.index}%`, background: tensionColor }} />
          </div>
          <div className="tp-meter-value" style={{ color: tensionColor }}>
            {data.index}<span className="tp-meter-max">/100</span>
          </div>
        </div>
        <div className="tp-meter-status" style={{ color: tensionColor }}>{data.label}</div>
      </div>

      <div className="tp-stats">
        <div className="tp-stat">
          <span className="tp-stat-value">{data.summary?.totalConflicts || 0}</span>
          <span className="tp-stat-label">Active Conflicts</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat-value">{data.summary?.totalFlashpoints || 0}</span>
          <span className="tp-stat-label">Flashpoints</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat-value" style={{ color: '#ff4444' }}>{data.summary?.criticalConflicts || 0}</span>
          <span className="tp-stat-label">Critical</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat-value" style={{ color: '#ff8c00' }}>{data.summary?.nuclearFlashpoints || 0}</span>
          <span className="tp-stat-label">Nuclear Risk</span>
        </div>
      </div>

      <div className="tp-tabs">
        <button className={`tp-tab${tab === 'conflicts' ? ' active' : ''}`} onClick={() => setTab('conflicts')}>Conflicts</button>
        <button className={`tp-tab${tab === 'flashpoints' ? ' active' : ''}`} onClick={() => setTab('flashpoints')}>Flashpoints</button>
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh" style={{ marginLeft: 'auto' }}>↻</button>
      </div>

      {tab === 'conflicts' && (
        <div className="tp-list">
          {(data.activeConflicts || []).map(c => (
            <div key={c.id} className="tp-conflict"
              style={{ borderLeft: `3px solid ${c.intensity >= 80 ? '#ff4444' : c.intensity >= 60 ? '#ff8c00' : '#ffd700'}` }}>
              <div className="tp-conflict-header">
                <span className="tp-conflict-name">{c.name}</span>
                <span className="tp-conflict-intensity">{c.intensity}</span>
              </div>
              <div className="tp-conflict-meta">
                <span className="tp-conflict-type">{c.type}</span>
                <span>{c.region}</span>
              </div>
              <div className="tp-conflict-parties">{c.parties?.join(' vs ')}</div>
              <div className="tp-conflict-risk">
                Escalation: <span style={{ color: ESCALATION_COLORS[c.escalationRisk] }}>{c.escalationRisk}</span>
                {c.nuclearRisk !== 'none' && (
                  <span className="tp-nuclear-badge" style={{ color: '#ff8c00' }}> Nuclear: {c.nuclearRisk}</span>
                )}
              </div>
              <div className="tp-conflict-bar">
                <div className="tp-conflict-bar-fill"
                  style={{ width: `${c.intensity}%`, background: c.intensity >= 80 ? '#ff4444' : c.intensity >= 60 ? '#ff8c00' : '#ffd700' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'flashpoints' && (
        <div className="tp-list">
          {(data.flashpoints || []).map(f => (
            <div key={f.id} className="tp-flashpoint"
              style={{ borderLeft: `3px solid ${ESCALATION_COLORS[f.escalationRisk] || '#666'}` }}>
              <div className="tp-fp-header">
                <span className="tp-fp-name">{f.name}</span>
                <span className="tp-fp-tension">{f.tension}</span>
              </div>
              <div className="tp-fp-parties">{f.parties?.join(', ')}</div>
              <div className="tp-fp-meta">
                <span>{f.category}</span>
                <span>Escalation: <span style={{ color: ESCALATION_COLORS[f.escalationRisk] }}>{f.escalationRisk}</span></span>
                {f.nuclear && <span className="tp-nuclear-badge">NUCLEAR</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
