import { useState, useEffect } from 'react';
import { timeAgo } from '../../utils/time';

export function SanctionsPanel({ onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('regimes');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/sanctions');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) { console.error('[SanctionsPanel]', err); }
    finally { setLoading(false); }
  }

  if (loading && !data) return <div className="panel-loading">Loading sanctions data...</div>;
  if (!data) return <div className="panel-empty">No sanctions data available</div>;

  return (
    <div className="sanctions-panel">
      <div className="sn-summary">
        <div className="sn-stat"><span className="sn-stat-value">{data.summary?.totalRegimes || 0}</span><span className="sn-stat-label">Regimes</span></div>
        <div className="sn-stat"><span className="sn-stat-value" style={{ color: '#ff4444' }}>{data.summary?.comprehensive || 0}</span><span className="sn-stat-label">Comprehensive</span></div>
        <div className="sn-stat"><span className="sn-stat-value" style={{ color: '#ff8c00' }}>{data.summary?.targeted || 0}</span><span className="sn-stat-label">Targeted</span></div>
      </div>

      <div className="sn-tabs">
        <button className={`sn-tab${tab === 'regimes' ? ' active' : ''}`} onClick={() => setTab('regimes')}>Regimes</button>
        <button className={`sn-tab${tab === 'news' ? ' active' : ''}`} onClick={() => setTab('news')}>News</button>
        <button className="dp-refresh-btn" onClick={() => { fetchData(); onRefresh?.(); }} title="Refresh" style={{ marginLeft: 'auto' }}>↻</button>
      </div>

      {tab === 'regimes' && (
        <div className="sn-regimes">
          {(data.regimes || []).map(r => (
            <div key={r.code} className="sn-regime" style={{ borderLeft: `3px solid ${r.level === 'comprehensive' ? '#ff4444' : '#ff8c00'}` }}>
              <div className="sn-regime-header">
                <span className="sn-regime-name">{r.country}</span>
                <span className={`sn-regime-level sn-level-${r.level}`}>{r.level}</span>
              </div>
              <div className="sn-regime-sectors">
                {r.sectors.map(s => <span key={s} className="sn-sector-tag">{s}</span>)}
              </div>
              <div className="sn-regime-programs">{r.programs.join(', ')}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'news' && (
        <div className="sn-news">
          {(data.recentNews || []).map((item, i) => (
            <a key={i} className="sn-news-item" href={item.link} target="_blank" rel="noopener noreferrer">
              <div className="sn-news-title">{item.title}</div>
              <div className="sn-news-meta">{item.source} · {timeAgo(item.date)}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
