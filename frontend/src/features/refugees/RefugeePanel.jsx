import { useState } from 'react';

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

export function RefugeePanel({ data, loading, onRefresh, onSituationClick }) {
  const [tab, setTab] = useState('situations');

  if (loading && !data) {
    return <div className="panel-loading">Loading refugee data...</div>;
  }
  if (!data) return <div className="panel-empty">No refugee data available</div>;

  return (
    <div className="refugee-panel">
      <div className="ref-summary">
        <div className="ref-stat">
          <span className="ref-stat-value">{formatNumber(data.summary?.totalDisplaced || 0)}</span>
          <span className="ref-stat-label">Total Displaced</span>
        </div>
        <div className="ref-stat">
          <span className="ref-stat-value">{formatNumber(data.summary?.totalRefugees || 0)}</span>
          <span className="ref-stat-label">Refugees</span>
        </div>
        <div className="ref-stat">
          <span className="ref-stat-value">{formatNumber(data.summary?.totalIDPs || 0)}</span>
          <span className="ref-stat-label">IDPs</span>
        </div>
        <div className="ref-stat">
          <span className="ref-stat-value">{data.summary?.activeSituations || 0}</span>
          <span className="ref-stat-label">Crises</span>
        </div>
      </div>

      <div className="ref-tabs">
        <button className={`ref-tab${tab === 'situations' ? ' active' : ''}`} onClick={() => setTab('situations')}>Crises</button>
        <button className={`ref-tab${tab === 'hosts' ? ' active' : ''}`} onClick={() => setTab('hosts')}>Host Countries</button>
        <button className={`ref-tab${tab === 'news' ? ' active' : ''}`} onClick={() => setTab('news')}>News</button>
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh" style={{ marginLeft: 'auto' }}>↻</button>
      </div>

      {tab === 'situations' && (
        <div className="ref-list">
          {(data.situations || []).map(s => (
            <div key={s.id} className="ref-situation" onClick={() => onSituationClick?.(s)}>
              <div className="ref-sit-header">
                <span className="ref-sit-name">{s.name}</span>
                <span className="ref-sit-region">{s.region}</span>
              </div>
              <div className="ref-sit-stats">
                <span>Refugees: <strong>{formatNumber(s.refugees)}</strong></span>
                {s.idps > 0 && <span>IDPs: <strong>{formatNumber(s.idps)}</strong></span>}
              </div>
              <div className="ref-sit-bar">
                <div className="ref-sit-bar-fill" style={{ width: `${Math.min(100, (s.refugees / 8000000) * 100)}%` }} />
              </div>
              <div className="ref-sit-meta">Since {s.year} · {s.status}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'hosts' && (
        <div className="ref-list">
          {(data.hostCountries || []).map(h => (
            <div key={h.name} className="ref-host" onClick={() => onSituationClick?.(h)}>
              <div className="ref-host-name">{h.name}</div>
              <div className="ref-host-count">{formatNumber(h.refugees)} refugees hosted</div>
              <div className="ref-sit-bar">
                <div className="ref-sit-bar-fill ref-host-bar" style={{ width: `${Math.min(100, (h.refugees / 4000000) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'news' && (
        <div className="ref-list">
          {(data.news || []).map((item, i) => (
            <a key={i} className="ref-news-item" href={item.link} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
