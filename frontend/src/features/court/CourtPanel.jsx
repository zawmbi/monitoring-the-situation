import { useState, useEffect } from 'react';
import { timeAgo } from '../../utils/time';

const IMPACT_COLORS = { critical: '#ff4444', high: '#ff8c00', moderate: '#ffd700' };
const STATUS_LABELS = { active: 'Active', pending: 'Pending', decided: 'Decided' };

export function CourtPanel({ onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('cases');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/court');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) { console.error('[CourtPanel]', err); }
    finally { setLoading(false); }
  }

  if (loading && !data) return <div className="panel-loading">Loading court data...</div>;
  if (!data) return <div className="panel-empty">No court data available</div>;

  return (
    <div className="court-panel">
      <div className="ct-summary">
        <div className="ct-stat"><span className="ct-stat-value">{data.summary?.totalTracked || 0}</span><span className="ct-stat-label">Tracked</span></div>
        <div className="ct-stat"><span className="ct-stat-value">{data.summary?.active || 0}</span><span className="ct-stat-label">Active</span></div>
        <div className="ct-stat"><span className="ct-stat-value">{data.summary?.pending || 0}</span><span className="ct-stat-label">Pending</span></div>
        <div className="ct-stat"><span className="ct-stat-value" style={{ color: '#ff4444' }}>{data.summary?.criticalImpact || 0}</span><span className="ct-stat-label">Critical</span></div>
      </div>

      <div className="ct-tabs">
        <button className={`ct-tab${tab === 'cases' ? ' active' : ''}`} onClick={() => setTab('cases')}>Major Cases</button>
        <button className={`ct-tab${tab === 'news' ? ' active' : ''}`} onClick={() => setTab('news')}>Legal News</button>
        <button className="dp-refresh-btn" onClick={() => { fetchData(); onRefresh?.(); }} title="Refresh" style={{ marginLeft: 'auto' }}>↻</button>
      </div>

      {tab === 'cases' && (
        <div className="ct-cases">
          {(data.trackedCases || []).map(c => (
            <div key={c.id} className="ct-case" style={{ borderLeft: `3px solid ${IMPACT_COLORS[c.impact] || '#666'}` }}>
              <div className="ct-case-header">
                <span className="ct-case-court">{c.court}</span>
                <span className={`ct-case-status ct-status-${c.status}`}>{STATUS_LABELS[c.status]}</span>
              </div>
              <div className="ct-case-title">{c.title}</div>
              <div className="ct-case-meta">
                <span>{c.category}</span>
                <span>Impact: <span style={{ color: IMPACT_COLORS[c.impact] }}>{c.impact}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'news' && (
        <div className="ct-news">
          {(data.recentNews || []).map(item => (
            <a key={item.id} className="ct-news-item" href={item.link} target="_blank" rel="noopener noreferrer">
              <div className="ct-news-title">{item.title}</div>
              <div className="ct-news-meta">{item.source} · {timeAgo(item.date)}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
