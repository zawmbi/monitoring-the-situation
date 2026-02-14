/**
 * SanctionsPanel — Tabbed panel showing:
 *   1. Sanctioned regimes with level, sectors, and programs
 *   2. Sanctions-related news
 *   3. Active sanctions programs overview
 *
 * Accepts { data, loading, onRefresh, onRegimeClick } via props (no self-fetching).
 */

import { useState } from 'react';
import { timeAgo } from '../../utils/time';

/* ── Constants ── */

const LEVEL_META = {
  comprehensive: { label: 'Comprehensive', color: '#ff4444', bg: 'rgba(255,68,68,0.12)' },
  targeted:      { label: 'Targeted',      color: '#ff8c00', bg: 'rgba(255,140,0,0.12)' },
  sectoral:      { label: 'Sectoral',      color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
  limited:       { label: 'Limited',       color: '#8bc34a', bg: 'rgba(139,195,74,0.12)' },
};

const LEVEL_ORDER = { comprehensive: 0, targeted: 1, sectoral: 2, limited: 3 };

const SECTOR_COLORS = {
  energy:    { bg: 'rgba(255,140,0,0.15)',  color: '#ff8c00' },
  finance:   { bg: 'rgba(100,149,237,0.15)', color: '#6495ed' },
  defense:   { bg: 'rgba(255,68,68,0.15)',  color: '#ff4444' },
  trade:     { bg: 'rgba(255,215,0,0.15)',  color: '#ffd700' },
  technology:{ bg: 'rgba(0,191,255,0.15)',  color: '#00bfff' },
  mining:    { bg: 'rgba(205,133,63,0.15)', color: '#cd853f' },
  shipping:  { bg: 'rgba(94,224,239,0.15)', color: '#5ee0ef' },
  aviation:  { bg: 'rgba(186,85,211,0.15)', color: '#ba55d3' },
  telecom:   { bg: 'rgba(50,205,50,0.15)',  color: '#32cd32' },
  metals:    { bg: 'rgba(192,192,192,0.15)', color: '#c0c0c0' },
};

const TABS = [
  { id: 'regimes',  label: 'Regimes' },
  { id: 'news',     label: 'Sanctions News' },
  { id: 'programs', label: 'Programs' },
];

/* ── Utility ── */

function timeAgoShort(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── Sub-components ── */

function LevelBadge({ level }) {
  const meta = LEVEL_META[level] || LEVEL_META.limited;
  return (
    <span
      className="sn-level-badge"
      style={{ background: meta.bg, color: meta.color, borderColor: meta.color }}
    >
      {meta.label}
    </span>
  );
}

function SectorTag({ sector }) {
  const style = SECTOR_COLORS[sector] || { bg: 'rgba(255,255,255,0.08)', color: '#aaa' };
  return (
    <span className="sn-sector-chip" style={{ background: style.bg, color: style.color }}>
      {sector}
    </span>
  );
}

function RegimeCard({ regime, onClick }) {
  const borderColor = (LEVEL_META[regime.level] || LEVEL_META.limited).color;
  const sectors = regime.sectors || [];
  const programs = regime.programs || [];

  return (
    <button
      className="sn-regime-card"
      type="button"
      onClick={() => onClick?.(regime)}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="sn-regime-card-top">
        <span className="sn-regime-country">{regime.country}</span>
        <LevelBadge level={regime.level} />
      </div>
      {sectors.length > 0 && (
        <div className="sn-regime-sectors">
          {sectors.map((s) => <SectorTag key={s} sector={s} />)}
        </div>
      )}
      {programs.length > 0 && (
        <div className="sn-regime-programs">
          {programs.join(' · ')}
        </div>
      )}
      {regime.lastUpdated && (
        <div className="sn-regime-date">{timeAgoShort(regime.lastUpdated)}</div>
      )}
    </button>
  );
}

function NewsItem({ item }) {
  return (
    <a
      className="sn-news-item"
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="sn-news-headline">{item.title}</span>
      <span className="sn-news-meta">
        {item.source && <span className="sn-news-source">{item.source}</span>}
        {item.date && <span className="sn-news-time">{timeAgoShort(item.date)}</span>}
      </span>
    </a>
  );
}

function ProgramRow({ program }) {
  return (
    <div className="sn-program-row">
      <span className="sn-program-name">{program.name}</span>
      <span className="sn-program-authority">{program.authority || 'OFAC'}</span>
      <span className="sn-program-count">{program.designations ?? '—'} designations</span>
    </div>
  );
}

function SanctionsOverview({ regimes }) {
  const total = regimes.length;
  const pinLabel = total === 1 ? '1 regime' : `${total} regimes`;
  return (
    <div className="sn-overview">
      <span className="sn-overview-icon">🌐</span>
      <span className="sn-overview-text">{pinLabel} on the map</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="sn-loading">
      <div className="sn-loading-shimmer" />
      <div className="sn-loading-shimmer sn-loading-short" />
      <div className="sn-loading-shimmer" />
      <div className="sn-loading-shimmer sn-loading-short" />
      <div className="sn-loading-shimmer" />
      <span className="sn-loading-label">Loading sanctions data...</span>
    </div>
  );
}

/* ── Main Panel ── */

export function SanctionsPanel({ data, loading, onRefresh, onRegimeClick }) {
  const [activeTab, setActiveTab] = useState('regimes');

  const regimes = data?.regimes || [];
  const recentNews = data?.recentNews || [];
  const programs = data?.programs || [];
  const summary = data?.summary || {};

  /* Sort regimes: comprehensive first, then targeted, etc. */
  const sortedRegimes = [...regimes].sort(
    (a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9)
  );

  /* Collect all unique sectors across regimes */
  const allSectors = [...new Set(regimes.flatMap((r) => r.sectors || []))];

  const counts = {
    regimes:  regimes.length,
    news:     recentNews.length,
    programs: programs.length,
  };

  const totalRegimes   = summary.totalRegimes   || regimes.length;
  const comprehensive  = summary.comprehensive  || regimes.filter(r => r.level === 'comprehensive').length;
  const targeted       = summary.targeted       || regimes.filter(r => r.level === 'targeted').length;
  const sectorCount    = summary.sectors         || allSectors.length;

  return (
    <div className="sn-panel">
      {/* ── Header ── */}
      <div className="sn-panel-header">
        <div className="sn-panel-title-row">
          <span className="sn-panel-title">Sanctions Monitor</span>
          <span className="sn-live-badge">OFAC</span>
        </div>
        <button className="sn-btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '↻'}
        </button>
      </div>

      {/* ── Overview ── */}
      <SanctionsOverview regimes={regimes} />

      {/* ── Summary stats ── */}
      <div className="sn-summary-row">
        <div className="sn-stat">
          <span className="sn-stat-value">{totalRegimes}</span>
          <span className="sn-stat-label">Regimes</span>
        </div>
        <div className="sn-stat">
          <span className="sn-stat-value" style={{ color: '#ff4444' }}>{comprehensive}</span>
          <span className="sn-stat-label">Comprehensive</span>
        </div>
        <div className="sn-stat">
          <span className="sn-stat-value" style={{ color: '#ff8c00' }}>{targeted}</span>
          <span className="sn-stat-label">Targeted</span>
        </div>
        <div className="sn-stat">
          <span className="sn-stat-value" style={{ color: '#5ee0ef' }}>{sectorCount}</span>
          <span className="sn-stat-label">Sectors</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sn-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`sn-tab${activeTab === tab.id ? ' sn-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {counts[tab.id] > 0 && <span className="sn-tab-count">{counts[tab.id]}</span>}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="sn-panel-content">
        {loading && !data && <LoadingSkeleton />}

        {/* ── Regimes Tab ── */}
        {activeTab === 'regimes' && (
          <div className="sn-tab-body">
            <div className="sn-section-note">
              Active sanctions regimes tracked from OFAC, EU sanctions lists, and UN
              Security Council resolutions. Regimes sorted by sanctions level
              (comprehensive first).
            </div>
            {sortedRegimes.length === 0 && !loading && (
              <div className="sn-empty">No sanctioned regimes tracked</div>
            )}
            <div className="sn-card-list">
              {sortedRegimes.map((r) => (
                <RegimeCard key={r.code || r.id} regime={r} onClick={onRegimeClick} />
              ))}
            </div>
          </div>
        )}

        {/* ── Sanctions News Tab ── */}
        {activeTab === 'news' && (
          <div className="sn-tab-body">
            <div className="sn-section-note">
              Latest sanctions-related news including new designations, enforcement
              actions, sanctions evasion, and policy changes from OFAC, EU, and UN sources.
            </div>
            {recentNews.length === 0 && !loading && (
              <div className="sn-empty">No recent sanctions news</div>
            )}
            <div className="sn-news-list">
              {recentNews.slice(0, 12).map((item, i) => (
                <NewsItem key={item.id || i} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* ── Programs Tab ── */}
        {activeTab === 'programs' && (
          <div className="sn-tab-body">
            <div className="sn-section-note">
              Active sanctions programs administered by OFAC, EU External Action
              Service, and other international bodies. Includes designation counts
              and authorizing frameworks.
            </div>
            {programs.length === 0 && !loading && (
              <div className="sn-empty">No program data available</div>
            )}
            <div className="sn-program-list">
              {programs.map((p, i) => (
                <ProgramRow key={p.id || i} program={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="sn-panel-footer">
        <span className="sn-panel-sources">OFAC · EU Sanctions · UN SC Resolutions · Google News</span>
        {data?.lastUpdated && (
          <span className="sn-panel-updated">Updated {timeAgoShort(data.lastUpdated)}</span>
        )}
      </div>
    </div>
  );
}

export default SanctionsPanel;
