import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

/* ── colour maps ── */
const STATUS_COLORS = {
  disrupted:   '#ff4444',
  restricted:  '#ff8c00',
  operational: '#4ecdc4',
  unknown:     '#8899aa',
};

const RISK_COLORS = {
  critical: '#ff4444',
  high:     '#ff8c00',
  elevated: '#ffd700',
  moderate: '#4ecdc4',
  low:      '#4a9eff',
};

function statusLabel(s) {
  return (s || 'unknown').charAt(0).toUpperCase() + (s || 'unknown').slice(1);
}

/* ── StatusIndicator dot ── */
function StatusDot({ status }) {
  const color = STATUS_COLORS[status] || '#8899aa';
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: color, boxShadow: `0 0 4px ${color}66`, marginRight: 4, flexShrink: 0,
    }} />
  );
}

/* ── RiskBadge ── */
function RiskBadge({ risk }) {
  const color = RISK_COLORS[risk] || '#8899aa';
  return (
    <span style={{
      fontSize: 9, padding: '1px 6px', borderRadius: 8, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: 0.5,
      background: `${color}18`, color, border: `1px solid ${color}33`,
    }}>
      {risk || 'unknown'}
    </span>
  );
}

/* ── ChokepointCard ── */
function ChokepointCard({ chokepoint, onClick }) {
  const cp = chokepoint;
  const borderColor = RISK_COLORS[cp.risk] || '#666';

  return (
    <div className="sp-cp"
      onClick={() => onClick?.(cp)}
      style={{
        padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)',
        borderLeft: `3px solid ${borderColor}`, cursor: 'pointer',
        transition: 'background 0.15s',
      }}>
      {/* header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <StatusDot status={cp.status} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #e0e8f0)' }}>{cp.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLORS[cp.status] }}>
            {statusLabel(cp.status)}
          </span>
          <RiskBadge risk={cp.risk} />
        </div>
      </div>

      {/* traffic info */}
      {cp.traffic && (
        <div style={{ fontSize: 11, color: '#8899aa', marginBottom: 3, display: 'flex', gap: 10 }}>
          <span>Traffic: {cp.traffic}</span>
          {cp.dailyTransits != null && <span>{cp.dailyTransits} transits/day</span>}
          {cp.percentGlobal != null && <span>{cp.percentGlobal}% global trade</span>}
        </div>
      )}

      {/* affected commodities */}
      {cp.affectedCommodities && cp.affectedCommodities.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 3 }}>
          {cp.affectedCommodities.map(c => (
            <span key={c} style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 6,
              background: 'rgba(255,255,255,0.06)', color: '#8899aa',
            }}>
              {c}
            </span>
          ))}
        </div>
      )}

      {/* notes */}
      {cp.notes && (
        <div style={{ fontSize: 11, color: '#667788', fontStyle: 'italic', lineHeight: 1.4, marginTop: 2 }}>
          {cp.notes}
        </div>
      )}

      {/* last update */}
      {cp.updatedAt && (
        <div style={{ fontSize: 9, color: '#556677', marginTop: 4 }}>
          Updated {timeAgo(cp.updatedAt)}
        </div>
      )}
    </div>
  );
}

/* ── TradeNewsItem ── */
function TradeNewsItem({ item }) {
  return (
    <a className="sp-news-item" href={item.link} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none' }}>
      <div style={{ fontSize: 12, color: 'var(--text-primary, #e0e8f0)', marginBottom: 2 }}>{item.title}</div>
      <div style={{ fontSize: 10, color: '#8899aa', display: 'flex', gap: 8 }}>
        {item.source && <span>{item.source}</span>}
        {item.date && <span>{timeAgo(item.date)}</span>}
        {item.region && <span>{item.region}</span>}
      </div>
    </a>
  );
}

/* ── Loading skeleton ── */
function ShippingSkeleton() {
  return (
    <div className="shipping-panel" style={{ opacity: 0.5 }}>
      <div className="sp-summary">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="sp-stat">
            <span className="sp-stat-value" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, display: 'inline-block', width: 28, height: 20 }}>&nbsp;</span>
            <span className="sp-stat-label" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 3, display: 'inline-block', width: 50, height: 10, marginTop: 4 }}>&nbsp;</span>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, display: 'flex', gap: 6 }}>
        {['Chokepoints', 'Trade News'].map(t => (
          <span key={t} style={{ display: 'inline-block', width: 70, height: 22, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: '3px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: '50%', height: 13, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 8 }} />
          <div style={{ width: '80%', height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 3, marginBottom: 4 }} />
          <div style={{ width: '60%', height: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 3 }} />
        </div>
      ))}
    </div>
  );
}

/* ── MAIN PANEL ── */
const TABS = ['Chokepoints', 'Trade News'];

export function ShippingPanel({ data, loading, onRefresh, onChokepointClick }) {
  const [tab, setTab] = useState('Chokepoints');

  const chokepoints = data?.chokepoints || [];
  const tradeNews = data?.tradeNews || [];
  const summary = data?.summary || {};

  const highRiskCount = useMemo(() =>
    chokepoints.filter(cp => cp.risk === 'critical' || cp.risk === 'high').length,
    [chokepoints]
  );

  const tabCounts = {
    Chokepoints: chokepoints.length,
    'Trade News': tradeNews.length,
  };

  if (loading && !data) return <ShippingSkeleton />;
  if (!data) return <div className="panel-empty">No shipping data available</div>;

  return (
    <div className="shipping-panel">
      {/* ── Summary bar ── */}
      <div className="sp-summary">
        <div className="sp-stat">
          <span className="sp-stat-value">{summary.totalChokepoints || chokepoints.length}</span>
          <span className="sp-stat-label">Chokepoints</span>
        </div>
        <div className="sp-stat">
          <span className="sp-stat-value" style={{ color: '#ff4444' }}>
            {summary.disrupted || chokepoints.filter(c => c.status === 'disrupted').length}
          </span>
          <span className="sp-stat-label">Disrupted</span>
        </div>
        <div className="sp-stat">
          <span className="sp-stat-value" style={{ color: '#ff8c00' }}>
            {summary.restricted || chokepoints.filter(c => c.status === 'restricted').length}
          </span>
          <span className="sp-stat-label">Restricted</span>
        </div>
        <div className="sp-stat">
          <span className="sp-stat-value" style={{ color: '#ff4444' }}>
            {(summary.criticalRisk || 0) + (summary.highRisk || 0) || highRiskCount}
          </span>
          <span className="sp-stat-label">High Risk</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sp-tabs">
        {TABS.map(t => (
          <button key={t} className={`sp-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
            {tabCounts[t] > 0 && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>({tabCounts[t]})</span>}
          </button>
        ))}
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh" style={{ marginLeft: 'auto' }}>↻</button>
      </div>

      {/* ── Chokepoints tab ── */}
      {tab === 'Chokepoints' && (
        <div className="sp-chokepoints">
          {chokepoints.length === 0 && (
            <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>No chokepoint data available.</div>
          )}
          {chokepoints.map(cp => (
            <ChokepointCard key={cp.id || cp.name} chokepoint={cp} onClick={onChokepointClick} />
          ))}
        </div>
      )}

      {/* ── Trade News tab ── */}
      {tab === 'Trade News' && (
        <div className="sp-news">
          {tradeNews.length === 0 && (
            <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>No trade news available.</div>
          )}
          {tradeNews.map((item, i) => (
            <TradeNewsItem key={i} item={item} />
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 9, color: '#556677', letterSpacing: 0.3,
      }}>
        <span>Sources: MarineTraffic, OSINT aggregation</span>
        {data.updatedAt && <span>Updated {timeAgo(data.updatedAt)}</span>}
      </div>
    </div>
  );
}
