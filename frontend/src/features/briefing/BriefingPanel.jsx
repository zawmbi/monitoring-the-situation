import { timeAgo } from '../../utils/time';

const CATEGORY_ICONS = {
  conflict: '⚔️',
  politics: '🏛️',
  economy: '📈',
  disaster: '🌊',
  technology: '💻',
  other: '📰',
};

export function BriefingPanel({ data, loading, onRefresh }) {
  if (loading && !data) {
    return <div className="panel-loading">Generating intelligence briefing...</div>;
  }
  if (!data) return <div className="panel-empty">No briefing available</div>;

  return (
    <div className="briefing-panel">
      <div className="bp-header">
        <div className="bp-title">GLOBAL INTELLIGENCE BRIEFING</div>
        <div className="bp-timestamp">
          Generated: {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : '—'}
        </div>
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh">↻</button>
      </div>

      {/* Overview Stats */}
      <div className="bp-overview">
        {data.globalTension && (
          <div className="bp-ov-item">
            <span className="bp-ov-label">Tension Index</span>
            <span className="bp-ov-value" style={{ color: data.globalTension.index >= 65 ? '#ff6b6b' : '#ffd700' }}>
              {data.globalTension.index}/100 ({data.globalTension.label})
            </span>
          </div>
        )}
        <div className="bp-ov-item">
          <span className="bp-ov-label">Active Disasters</span>
          <span className="bp-ov-value">{data.activeDisasters}</span>
        </div>
        <div className="bp-ov-item">
          <span className="bp-ov-label">Cyber Incidents</span>
          <span className="bp-ov-value">{data.cyberThreats}</span>
        </div>
      </div>

      {/* Top Risks */}
      {data.topRisks?.length > 0 && (
        <div className="bp-section">
          <div className="bp-section-title">Highest Risk Countries</div>
          <div className="bp-risk-list">
            {data.topRisks.map((r, i) => (
              <div key={i} className="bp-risk-item">
                <span className="bp-risk-rank">#{i + 1}</span>
                <span className="bp-risk-country">{r.country}</span>
                <span className={`bp-risk-score bp-risk-${r.level}`}>{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorized Headlines */}
      {data.headlines && Object.entries(data.headlines).map(([category, items]) => {
        if (!items || items.length === 0) return null;
        return (
          <div key={category} className="bp-section">
            <div className="bp-section-title">
              {CATEGORY_ICONS[category] || '📰'} {category.charAt(0).toUpperCase() + category.slice(1)}
            </div>
            {items.map((item, i) => (
              <a key={i} className="bp-headline" href={item.url} target="_blank" rel="noopener noreferrer">
                <span className="bp-headline-text">{item.title}</span>
                <span className="bp-headline-meta">{item.source} · {timeAgo(item.date)}</span>
              </a>
            ))}
          </div>
        );
      })}
    </div>
  );
}
