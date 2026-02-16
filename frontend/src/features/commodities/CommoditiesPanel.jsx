import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

/* ── helpers ── */
function fmt(n, decimals = 2) {
  if (n == null) return '—';
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const CATEGORY_COLORS = {
  energy:      '#f59e0b',
  metals:      '#94a3b8',
  agriculture: '#22c55e',
  softs:       '#a78bfa',
};

/* ── Sparkline with min/max annotations ── */
function Sparkline({ trend, change }) {
  if (!trend || trend.length < 2) return null;
  const len = trend.length;
  const min = Math.min(...trend);
  const max = Math.max(...trend);
  const range = max - min || 1;
  const color = change >= 0 ? '#4ecdc4' : '#ff6b6b';
  const pts = trend.map((v, i) => {
    const x = (i / (len - 1)) * 100;
    const y = 28 - ((v - min) / range) * 24;
    return `${x},${y}`;
  });
  const minIdx = trend.indexOf(min);
  const maxIdx = trend.indexOf(max);
  const minX = (minIdx / (len - 1)) * 100;
  const minY = 28 - ((min - min) / range) * 24;
  const maxX = (maxIdx / (len - 1)) * 100;
  const maxY = 28 - ((max - min) / range) * 24;

  return (
    <svg viewBox="0 0 100 36" preserveAspectRatio="none"
      style={{ width: '100%', height: 36, display: 'block' }}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts.join(' ')} />
      {/* min dot + label */}
      <circle cx={minX} cy={minY} r="2" fill="#ff6b6b" />
      <text x={minX} y={minY + 6} fontSize="5" fill="#ff6b6b" textAnchor="middle">
        {fmt(min, 1)}
      </text>
      {/* max dot + label */}
      <circle cx={maxX} cy={maxY} r="2" fill="#4ecdc4" />
      <text x={maxX} y={maxY - 2} fontSize="5" fill="#4ecdc4" textAnchor="middle">
        {fmt(max, 1)}
      </text>
    </svg>
  );
}

/* ── CommodityCard ── */
function CommodityCard({ commodity }) {
  const { name, symbol, price, unit, change, category, trend } = commodity;
  const catColor = CATEGORY_COLORS[category] || '#888';
  const changeColor = change > 0 ? '#4ecdc4' : change < 0 ? '#ff6b6b' : '#8899aa';

  return (
    <div className="cmd-card" style={{ borderTop: `2px solid ${catColor}` }}>
      <div className="cmd-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="cmd-card-name" title={symbol}>{name}</span>
        <span style={{
          fontSize: 9, padding: '1px 6px', borderRadius: 8,
          background: `${catColor}22`, color: catColor, textTransform: 'uppercase',
          letterSpacing: 0.5, fontWeight: 600,
        }}>
          {category}
        </span>
      </div>
      <div className="cmd-card-price" style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '6px 0 2px' }}>
        <span className="cmd-card-value" style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          ${fmt(price)}
        </span>
        <span className="cmd-card-unit" style={{ fontSize: 10, color: '#8899aa' }}>{unit}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: changeColor, marginBottom: 4 }}>
        {change > 0 ? '+' : ''}{fmt(change, 2)}%
      </div>
      <Sparkline trend={trend} change={change} />
    </div>
  );
}

/* ── CommodityNewsItem ── */
function CommodityNewsItem({ item }) {
  return (
    <a className="cmd-news-item" href={item.link} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none' }}>
      <div style={{ fontSize: 12, color: 'var(--text-primary, #e0e8f0)', marginBottom: 2 }}>{item.title}</div>
      <div style={{ fontSize: 10, color: '#8899aa', display: 'flex', gap: 8 }}>
        {item.source && <span>{item.source}</span>}
        {item.date && <span>{timeAgo(item.date)}</span>}
        {item.commodity && (
          <span style={{ color: CATEGORY_COLORS[item.category] || '#a78bfa' }}>{item.commodity}</span>
        )}
      </div>
    </a>
  );
}

/* ── Loading skeleton ── */
function CommoditiesSkeleton() {
  const rows = Array.from({ length: 6 });
  return (
    <div className="commodities-panel" style={{ opacity: 0.5 }}>
      <div className="cmd-summary">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="cmd-stat">
            <span className="cmd-stat-value" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, display: 'inline-block', width: 32, height: 20 }}>&nbsp;</span>
            <span className="cmd-stat-label" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 3, display: 'inline-block', width: 48, height: 10, marginTop: 4 }}>&nbsp;</span>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, display: 'flex', gap: 6 }}>
        {['Prices', 'Big Movers', 'News'].map(t => (
          <span key={t} style={{ display: 'inline-block', width: 60, height: 22, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
      <div className="cmd-grid">
        {rows.map((_, i) => (
          <div key={i} className="cmd-card" style={{ minHeight: 80 }}>
            <div style={{ width: '60%', height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 8 }} />
            <div style={{ width: '40%', height: 18, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 6 }} />
            <div style={{ width: '30%', height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MAIN PANEL ── */
const CATEGORIES = ['all', 'energy', 'metals', 'agriculture', 'softs'];
const TABS = ['Prices', 'Big Movers', 'Supply Chain News'];

export function CommoditiesPanel({ data, loading, onRefresh }) {
  const [tab, setTab] = useState('Prices');
  const [categoryFilter, setCategoryFilter] = useState('all');

  /* derived data */
  const commodities = data?.commodities || [];
  const supplyNews = data?.supplyNews || [];
  const summary = data?.summary || {};

  const filtered = useMemo(() => {
    let list = commodities;
    if (categoryFilter !== 'all') {
      list = list.filter(c => c.category === categoryFilter);
    }
    return list;
  }, [commodities, categoryFilter]);

  const bigMovers = useMemo(() => {
    return commodities
      .filter(c => Math.abs(c.change) > 3)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [commodities]);

  /* loading skeleton */
  if (loading && !data) return <CommoditiesSkeleton />;
  if (!data) return <div className="panel-empty">No commodity data available</div>;

  return (
    <div className="commodities-panel">
      {/* ── Summary bar ── */}
      <div className="cmd-summary">
        <div className="cmd-stat">
          <span className="cmd-stat-value">{summary.totalTracked || commodities.length}</span>
          <span className="cmd-stat-label">Tracked</span>
        </div>
        <div className="cmd-stat">
          <span className="cmd-stat-value" style={{ color: '#4ecdc4' }}>{summary.gainers || 0}</span>
          <span className="cmd-stat-label">Gainers</span>
        </div>
        <div className="cmd-stat">
          <span className="cmd-stat-value" style={{ color: '#ff6b6b' }}>{summary.losers || 0}</span>
          <span className="cmd-stat-label">Losers</span>
        </div>
        <div className="cmd-stat">
          <span className="cmd-stat-value" style={{ color: '#ffd700' }}>{summary.bigMovers || bigMovers.length}</span>
          <span className="cmd-stat-label">Big Movers</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="cmd-filters">
        {TABS.map(t => (
          <button key={t} className={`cmd-filter${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}>
            {t}
            {t === 'Big Movers' && bigMovers.length > 0 && (
              <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>({bigMovers.length})</span>
            )}
            {t === 'Supply Chain News' && supplyNews.length > 0 && (
              <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>({supplyNews.length})</span>
            )}
          </button>
        ))}
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh" style={{ marginLeft: 'auto' }}>
          ↻
        </button>
      </div>

      {/* ── Category filter (Prices tab only) ── */}
      {tab === 'Prices' && (
        <div style={{ display: 'flex', gap: 4, padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '2px 8px', borderRadius: 10, fontSize: 10, cursor: 'pointer',
                border: `1px solid ${categoryFilter === cat ? (CATEGORY_COLORS[cat] || 'rgba(255,255,255,0.25)') : 'rgba(255,255,255,0.08)'}`,
                background: categoryFilter === cat ? `${CATEGORY_COLORS[cat] || 'rgba(255,255,255,0.15)'}22` : 'transparent',
                color: categoryFilter === cat ? (CATEGORY_COLORS[cat] || '#e0e8f0') : '#8899aa',
                textTransform: 'capitalize', transition: 'all 0.15s',
              }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Prices tab ── */}
      {tab === 'Prices' && (
        <div className="cmd-grid">
          {filtered.length === 0 && (
            <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>No commodities match this filter.</div>
          )}
          {filtered.map(c => <CommodityCard key={c.symbol || c.name} commodity={c} />)}
        </div>
      )}

      {/* ── Big Movers tab ── */}
      {tab === 'Big Movers' && (
        <div className="cmd-grid">
          {bigMovers.length === 0 && (
            <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>No commodities moved more than 3 % today.</div>
          )}
          {bigMovers.map(c => (
            <CommodityCard key={c.symbol || c.name} commodity={c} />
          ))}
        </div>
      )}

      {/* ── Supply Chain News tab ── */}
      {tab === 'Supply Chain News' && (
        <div>
          {supplyNews.length === 0 && (
            <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>No supply chain news available.</div>
          )}
          {supplyNews.map((item, i) => (
            <CommodityNewsItem key={i} item={item} />
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 9, color: '#556677', letterSpacing: 0.3,
      }}>
        <span>Data: Yahoo Finance</span>
        {data.updatedAt && <span>Updated {timeAgo(data.updatedAt)}</span>}
      </div>
    </div>
  );
}
