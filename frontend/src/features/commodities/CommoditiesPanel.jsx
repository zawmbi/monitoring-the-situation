import { useState } from 'react';

export function CommoditiesPanel({ data, loading, onRefresh }) {
  const [filter, setFilter] = useState('all');

  if (loading && !data) {
    return <div className="panel-loading">Loading commodity prices...</div>;
  }
  if (!data) return <div className="panel-empty">No commodity data available</div>;

  const commodities = data.commodities || [];
  const filtered = filter === 'all' ? commodities : commodities.filter(c => c.category === filter);
  const categories = [...new Set(commodities.map(c => c.category))];

  return (
    <div className="commodities-panel">
      <div className="cmd-summary">
        <div className="cmd-stat">
          <span className="cmd-stat-value">{data.summary?.totalTracked || 0}</span>
          <span className="cmd-stat-label">Tracked</span>
        </div>
        <div className="cmd-stat">
          <span className="cmd-stat-value" style={{ color: '#4ecdc4' }}>{data.summary?.gainers || 0}</span>
          <span className="cmd-stat-label">Gainers</span>
        </div>
        <div className="cmd-stat">
          <span className="cmd-stat-value" style={{ color: '#ff6b6b' }}>{data.summary?.losers || 0}</span>
          <span className="cmd-stat-label">Losers</span>
        </div>
        <div className="cmd-stat">
          <span className="cmd-stat-value" style={{ color: '#ffd700' }}>{data.summary?.bigMovers || 0}</span>
          <span className="cmd-stat-label">Big Movers</span>
        </div>
      </div>

      <div className="cmd-filters">
        <button className={`cmd-filter${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All</button>
        {categories.map(cat => (
          <button key={cat} className={`cmd-filter${filter === cat ? ' active' : ''}`} onClick={() => setFilter(cat)}>{cat}</button>
        ))}
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh" style={{ marginLeft: 'auto' }}>↻</button>
      </div>

      <div className="cmd-grid">
        {filtered.map(c => (
          <div key={c.symbol} className="cmd-card">
            <div className="cmd-card-header">
              <span className="cmd-card-name">{c.name}</span>
              <span className="cmd-card-cat">{c.category}</span>
            </div>
            <div className="cmd-card-price">
              <span className="cmd-card-value">${c.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="cmd-card-unit">{c.unit}</span>
            </div>
            <div className={`cmd-card-change ${c.change > 0 ? 'positive' : c.change < 0 ? 'negative' : ''}`}>
              {c.change > 0 ? '+' : ''}{c.change}%
            </div>
            {c.trend && c.trend.length > 1 && (
              <div className="cmd-card-sparkline">
                <svg viewBox={`0 0 ${c.trend.length - 1} 20`} preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke={c.change >= 0 ? '#4ecdc4' : '#ff6b6b'}
                    strokeWidth="1.5"
                    points={c.trend.map((v, i) => {
                      const min = Math.min(...c.trend);
                      const max = Math.max(...c.trend);
                      const range = max - min || 1;
                      return `${i},${20 - ((v - min) / range) * 18}`;
                    }).join(' ')}
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {data.supplyNews?.length > 0 && (
        <div className="cmd-news">
          <div className="cmd-news-title">Supply Chain News</div>
          {data.supplyNews.slice(0, 5).map((item, i) => (
            <a key={i} className="cmd-news-item" href={item.link} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
