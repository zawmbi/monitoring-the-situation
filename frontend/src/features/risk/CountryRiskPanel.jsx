import { useState } from 'react';

const RISK_COLORS = {
  critical: '#ff4444',
  high: '#ff8c00',
  elevated: '#ffd700',
  moderate: '#4ecdc4',
  low: '#4a9eff',
};

export function CountryRiskPanel({ data, loading, onRefresh, onCountryClick }) {
  const [filter, setFilter] = useState('all');

  if (loading && !data) return <div className="panel-loading">Loading risk scores...</div>;
  if (!data) return <div className="panel-empty">No risk data available</div>;

  const scores = data.scores || [];
  const filtered = filter === 'all' ? scores : scores.filter(s => s.level === filter);

  return (
    <div className="risk-panel">
      <div className="rk-summary">
        <div className="rk-stat"><span className="rk-stat-value">{data.summary?.total || 0}</span><span className="rk-stat-label">Countries</span></div>
        <div className="rk-stat"><span className="rk-stat-value" style={{ color: '#ff4444' }}>{data.summary?.critical || 0}</span><span className="rk-stat-label">Critical</span></div>
        <div className="rk-stat"><span className="rk-stat-value" style={{ color: '#ff8c00' }}>{data.summary?.high || 0}</span><span className="rk-stat-label">High</span></div>
        <div className="rk-stat"><span className="rk-stat-value">{data.summary?.avgScore || 0}</span><span className="rk-stat-label">Avg Score</span></div>
      </div>

      <div className="rk-filters">
        {['all', 'critical', 'high', 'elevated', 'moderate', 'low'].map(f => (
          <button key={f} className={`rk-filter${filter === f ? ' active' : ''}`}
            style={filter === f && f !== 'all' ? { borderColor: RISK_COLORS[f], color: RISK_COLORS[f] } : {}}
            onClick={() => setFilter(f)}>{f}</button>
        ))}
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh" style={{ marginLeft: 'auto' }}>↻</button>
      </div>

      <div className="rk-list">
        {filtered.map((s, i) => (
          <div key={s.country} className="rk-country" onClick={() => onCountryClick?.(s)}>
            <div className="rk-country-rank">#{i + 1}</div>
            <div className="rk-country-info">
              <span className="rk-country-name">{s.country}</span>
              <div className="rk-country-bar">
                <div className="rk-country-bar-fill" style={{ width: `${s.score}%`, background: RISK_COLORS[s.level] }} />
              </div>
            </div>
            <div className="rk-country-score" style={{ color: RISK_COLORS[s.level] }}>{s.score}</div>
            {s.sanctioned && <span className="rk-sanctioned">SANCTIONED</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
