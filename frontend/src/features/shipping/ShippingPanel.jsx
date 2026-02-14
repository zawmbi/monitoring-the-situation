import { useState } from 'react';

const RISK_COLORS = {
  critical: '#ff4444',
  high: '#ff8c00',
  elevated: '#ffd700',
  moderate: '#4ecdc4',
  low: '#4a9eff',
};

const STATUS_COLORS = {
  disrupted: '#ff4444',
  restricted: '#ff8c00',
  operational: '#4ecdc4',
};

export function ShippingPanel({ data, loading, onRefresh, onChokepointClick }) {
  const [tab, setTab] = useState('chokepoints');

  if (loading && !data) {
    return <div className="panel-loading">Loading shipping data...</div>;
  }
  if (!data) return <div className="panel-empty">No shipping data available</div>;

  return (
    <div className="shipping-panel">
      <div className="sp-summary">
        <div className="sp-stat">
          <span className="sp-stat-value">{data.summary?.totalChokepoints || 0}</span>
          <span className="sp-stat-label">Chokepoints</span>
        </div>
        <div className="sp-stat">
          <span className="sp-stat-value" style={{ color: '#ff4444' }}>{data.summary?.disrupted || 0}</span>
          <span className="sp-stat-label">Disrupted</span>
        </div>
        <div className="sp-stat">
          <span className="sp-stat-value" style={{ color: '#ff8c00' }}>{data.summary?.restricted || 0}</span>
          <span className="sp-stat-label">Restricted</span>
        </div>
        <div className="sp-stat">
          <span className="sp-stat-value" style={{ color: '#ff4444' }}>{(data.summary?.criticalRisk || 0) + (data.summary?.highRisk || 0)}</span>
          <span className="sp-stat-label">High Risk</span>
        </div>
      </div>

      <div className="sp-tabs">
        <button className={`sp-tab${tab === 'chokepoints' ? ' active' : ''}`} onClick={() => setTab('chokepoints')}>Chokepoints</button>
        <button className={`sp-tab${tab === 'news' ? ' active' : ''}`} onClick={() => setTab('news')}>Trade News</button>
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh" style={{ marginLeft: 'auto' }}>↻</button>
      </div>

      {tab === 'chokepoints' && (
        <div className="sp-chokepoints">
          {(data.chokepoints || []).map(cp => (
            <div key={cp.id} className="sp-cp"
              onClick={() => onChokepointClick?.(cp)}
              style={{ borderLeft: `3px solid ${RISK_COLORS[cp.risk] || '#666'}` }}>
              <div className="sp-cp-header">
                <span className="sp-cp-name">{cp.name}</span>
                <span className="sp-cp-status" style={{ color: STATUS_COLORS[cp.status] }}>{cp.status}</span>
              </div>
              <div className="sp-cp-traffic">{cp.traffic}</div>
              <div className="sp-cp-risk">
                Risk: <span style={{ color: RISK_COLORS[cp.risk] }}>{cp.risk}</span>
              </div>
              <div className="sp-cp-notes">{cp.notes}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'news' && (
        <div className="sp-news">
          {(data.tradeNews || []).map((item, i) => (
            <a key={i} className="sp-news-item" href={item.link} target="_blank" rel="noopener noreferrer">
              <div className="sp-news-title">{item.title}</div>
              <div className="sp-news-source">{item.source}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
