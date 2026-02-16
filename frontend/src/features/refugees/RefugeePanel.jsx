import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

/* ── helpers ── */
function fmtNum(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

const REGION_COLORS = {
  'Sub-Saharan Africa': '#f59e0b',
  'Middle East':        '#ef4444',
  'South Asia':         '#8b5cf6',
  'East Asia':          '#3b82f6',
  'Europe':             '#6366f1',
  'Americas':           '#22c55e',
  'North Africa':       '#f97316',
};

function regionColor(region) {
  if (!region) return '#8899aa';
  for (const [key, color] of Object.entries(REGION_COLORS)) {
    if (region.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#8899aa';
}

/* ── DataSourceBadge ── */
function DataSourceBadge({ source }) {
  const isLive = source === 'UNHCR API' || source === 'api';
  return (
    <span style={{
      fontSize: 8, padding: '1px 5px', borderRadius: 6, fontWeight: 600,
      letterSpacing: 0.4, textTransform: 'uppercase',
      background: isLive ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
      color: isLive ? '#22c55e' : '#8899aa',
      border: `1px solid ${isLive ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
    }}>
      {isLive ? 'UNHCR API' : 'Baseline'}
    </span>
  );
}

/* ── Proportional bar ── */
function ComparisonBar({ value, maxValue, color, label }) {
  const pct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8899aa', marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary, #e0e8f0)' }}>{fmtNum(value)}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

/* ── SituationCard ── */
function SituationCard({ situation, maxRefugees, maxIDPs, onClick }) {
  const s = situation;
  const rColor = regionColor(s.region);
  return (
    <div className="ref-situation" onClick={() => onClick?.(s)} style={{ cursor: 'pointer', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #e0e8f0)' }}>{s.name}</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{
            fontSize: 9, padding: '1px 6px', borderRadius: 8, fontWeight: 600,
            background: `${rColor}18`, color: rColor, letterSpacing: 0.3,
          }}>
            {s.region}
          </span>
          <DataSourceBadge source={s.dataSource} />
        </div>
      </div>
      <ComparisonBar value={s.refugees || 0} maxValue={maxRefugees} color="#3b82f6" label="Refugees" />
      {(s.idps || 0) > 0 && (
        <ComparisonBar value={s.idps} maxValue={maxIDPs} color="#f59e0b" label="IDPs" />
      )}
      <div style={{ fontSize: 10, color: '#556677', marginTop: 4, display: 'flex', gap: 8 }}>
        <span>Since {s.year || '—'}</span>
        <span>{s.status}</span>
      </div>
    </div>
  );
}

/* ── HostCountryCard ── */
function HostCountryCard({ host, maxHosted, onClick }) {
  return (
    <div className="ref-host" onClick={() => onClick?.(host)}
      style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #e0e8f0)' }}>{host.name}</span>
        <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#3b82f6' }}>
          {fmtNum(host.refugees)}
        </span>
      </div>
      <ComparisonBar value={host.refugees || 0} maxValue={maxHosted} color="#6366f1" label="Refugees hosted" />
      {host.perCapita != null && (
        <div style={{ fontSize: 10, color: '#8899aa', marginTop: 2 }}>
          {host.perCapita} per 1 000 inhabitants
        </div>
      )}
    </div>
  );
}

/* ── NewsItem ── */
function NewsItem({ item }) {
  return (
    <a className="ref-news-item" href={item.link} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none' }}>
      <div style={{ fontSize: 12, color: 'var(--text-primary, #e0e8f0)', marginBottom: 2 }}>{item.title}</div>
      <div style={{ fontSize: 10, color: '#8899aa', display: 'flex', gap: 8 }}>
        {item.source && <span>{item.source}</span>}
        {item.date && <span>{timeAgo(item.date)}</span>}
        {item.region && <span style={{ color: regionColor(item.region) }}>{item.region}</span>}
      </div>
    </a>
  );
}

/* ── Loading skeleton ── */
function RefugeeSkeleton() {
  return (
    <div className="refugee-panel" style={{ opacity: 0.5 }}>
      <div className="ref-summary">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="ref-stat">
            <span className="ref-stat-value" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, display: 'inline-block', width: 40, height: 20 }}>&nbsp;</span>
            <span className="ref-stat-label" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 3, display: 'inline-block', width: 52, height: 10, marginTop: 4 }}>&nbsp;</span>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, display: 'flex', gap: 6 }}>
        {['Crises', 'Host Countries', 'News'].map(t => (
          <span key={t} style={{ display: 'inline-block', width: 72, height: 22, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ width: '55%', height: 13, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 8 }} />
          <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 3, marginBottom: 4 }} />
          <div style={{ width: '70%', height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }} />
        </div>
      ))}
    </div>
  );
}

/* ── MAIN PANEL ── */
const TABS = ['Displacement Crises', 'Host Countries', 'Migration News'];

export function RefugeePanel({ data, loading, onRefresh, onSituationClick }) {
  const [tab, setTab] = useState('Displacement Crises');

  const situations = data?.situations || [];
  const hostCountries = data?.hostCountries || [];
  const news = data?.news || [];
  const summary = data?.summary || {};

  const maxRefugees = useMemo(() => Math.max(1, ...situations.map(s => s.refugees || 0)), [situations]);
  const maxIDPs = useMemo(() => Math.max(1, ...situations.map(s => s.idps || 0)), [situations]);
  const maxHosted = useMemo(() => Math.max(1, ...hostCountries.map(h => h.refugees || 0)), [hostCountries]);

  const liveCount = useMemo(() =>
    situations.filter(s => s.dataSource === 'UNHCR API' || s.dataSource === 'api').length,
    [situations]
  );

  const tabCounts = {
    'Displacement Crises': situations.length,
    'Host Countries': hostCountries.length,
    'Migration News': news.length,
  };

  if (loading && !data) return <RefugeeSkeleton />;
  if (!data) return <div className="panel-empty">No refugee data available</div>;

  return (
    <div className="refugee-panel">
      {/* ── Summary bar ── */}
      <div className="ref-summary">
        <div className="ref-stat">
          <span className="ref-stat-value">{fmtNum(summary.totalDisplaced || 0)}</span>
          <span className="ref-stat-label">Total Displaced</span>
        </div>
        <div className="ref-stat">
          <span className="ref-stat-value" style={{ color: '#3b82f6' }}>{fmtNum(summary.totalRefugees || 0)}</span>
          <span className="ref-stat-label">Refugees</span>
        </div>
        <div className="ref-stat">
          <span className="ref-stat-value" style={{ color: '#f59e0b' }}>{fmtNum(summary.totalIDPs || 0)}</span>
          <span className="ref-stat-label">IDPs</span>
        </div>
        <div className="ref-stat">
          <span className="ref-stat-value" style={{ color: '#ef4444' }}>{summary.activeSituations || situations.length}</span>
          <span className="ref-stat-label">Active Crises</span>
        </div>
        <div className="ref-stat">
          <span className="ref-stat-value" style={{ color: '#22c55e' }}>{liveCount}</span>
          <span className="ref-stat-label">Live Data</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="ref-tabs">
        {TABS.map(t => (
          <button key={t} className={`ref-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
            {tabCounts[t] > 0 && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>({tabCounts[t]})</span>}
          </button>
        ))}
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh" style={{ marginLeft: 'auto' }}>↻</button>
      </div>

      {/* ── Displacement Crises tab ── */}
      {tab === 'Displacement Crises' && (
        <div className="ref-list">
          {situations.length === 0 && (
            <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>No displacement crises data available.</div>
          )}
          {situations.map(s => (
            <SituationCard key={s.id || s.name} situation={s}
              maxRefugees={maxRefugees} maxIDPs={maxIDPs} onClick={onSituationClick} />
          ))}
        </div>
      )}

      {/* ── Host Countries tab ── */}
      {tab === 'Host Countries' && (
        <div className="ref-list">
          {hostCountries.length === 0 && (
            <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>No host country data available.</div>
          )}
          {hostCountries.map(h => (
            <HostCountryCard key={h.name} host={h} maxHosted={maxHosted} onClick={onSituationClick} />
          ))}
        </div>
      )}

      {/* ── Migration News tab ── */}
      {tab === 'Migration News' && (
        <div className="ref-list">
          {news.length === 0 && (
            <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>No migration news available.</div>
          )}
          {news.map((item, i) => (
            <NewsItem key={i} item={item} />
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 9, color: '#556677', letterSpacing: 0.3,
      }}>
        <span>Data: UNHCR Population Statistics API</span>
        {data.updatedAt && <span>Updated {timeAgo(data.updatedAt)}</span>}
      </div>
    </div>
  );
}
