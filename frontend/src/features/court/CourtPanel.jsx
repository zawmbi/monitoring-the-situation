/**
 * CourtPanel — Tabbed panel showing:
 *   1. Major court cases (ICJ, ICC, SCOTUS, ECHR, etc.)
 *   2. Legal news headlines
 *
 * Accepts { data, loading, onRefresh } via props (no self-fetching).
 */

import { useState } from 'react';
import { timeAgo } from '../../utils/time';

/* ── Constants ── */

const IMPACT_COLORS = {
  critical: '#ff4444',
  high: '#ff8c00',
  moderate: '#ffd700',
  low: '#8bc34a',
};

const IMPACT_ORDER = { critical: 0, high: 1, moderate: 2, low: 3 };

const STATUS_META = {
  active:   { label: 'Active',   color: '#5ee0ef' },
  pending:  { label: 'Pending',  color: '#ffd700' },
  decided:  { label: 'Decided',  color: '#8bc34a' },
  appealed: { label: 'Appealed', color: '#ff8c00' },
  closed:   { label: 'Closed',   color: '#999' },
};

const COURT_BADGES = {
  ICJ:    { short: 'ICJ',    bg: 'rgba(94,224,239,0.12)',  color: '#5ee0ef' },
  ICC:    { short: 'ICC',    bg: 'rgba(255,140,0,0.12)',   color: '#ff8c00' },
  SCOTUS: { short: 'SCOTUS', bg: 'rgba(100,149,237,0.12)', color: '#6495ed' },
  ECHR:   { short: 'ECHR',   bg: 'rgba(139,195,74,0.12)',  color: '#8bc34a' },
  WTO:    { short: 'WTO',    bg: 'rgba(255,215,0,0.12)',   color: '#ffd700' },
  ITLOS:  { short: 'ITLOS',  bg: 'rgba(0,191,255,0.12)',   color: '#00bfff' },
};

const TABS = [
  { id: 'cases', label: 'Major Cases' },
  { id: 'news',  label: 'Legal News' },
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

function ImpactBadge({ impact }) {
  return (
    <span
      className="ct-impact-badge"
      style={{ background: IMPACT_COLORS[impact] || IMPACT_COLORS.moderate }}
    >
      {impact}
    </span>
  );
}

function CourtBadge({ court }) {
  const meta = COURT_BADGES[court] || { short: court, bg: 'rgba(255,255,255,0.08)', color: '#aaa' };
  return (
    <span className="ct-court-badge" style={{ background: meta.bg, color: meta.color, borderColor: meta.color }}>
      {meta.short}
    </span>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.active;
  return (
    <span className="ct-status-badge" style={{ color: meta.color, borderColor: meta.color }}>
      {meta.label}
    </span>
  );
}

function CaseCard({ caseItem, onClick }) {
  const borderColor = IMPACT_COLORS[caseItem.impact] || '#666';
  return (
    <button
      className="ct-case-card"
      type="button"
      onClick={() => onClick?.(caseItem)}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="ct-case-card-top">
        <CourtBadge court={caseItem.court} />
        <StatusBadge status={caseItem.status} />
        <ImpactBadge impact={caseItem.impact} />
      </div>
      <div className="ct-case-title">{caseItem.title}</div>
      {caseItem.description && (
        <div className="ct-case-desc">{caseItem.description}</div>
      )}
      <div className="ct-case-meta">
        {caseItem.category && <span className="ct-case-category">{caseItem.category}</span>}
        {caseItem.date && <span className="ct-case-date">{timeAgoShort(caseItem.date)}</span>}
      </div>
    </button>
  );
}

function NewsSection({ headlines }) {
  if (!headlines || headlines.length === 0) return null;
  return (
    <div className="ct-news-section">
      <div className="ct-news-section-title">Recent Legal Headlines</div>
      {headlines.slice(0, 10).map((item, i) => (
        <a
          key={item.id || i}
          className="ct-news-item"
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="ct-news-headline">{item.title}</span>
          <span className="ct-news-meta">
            {item.source && <span className="ct-news-source">{item.source}</span>}
            {item.date && <span className="ct-news-time">{timeAgoShort(item.date)}</span>}
          </span>
        </a>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="ct-loading">
      <div className="ct-loading-shimmer" />
      <div className="ct-loading-shimmer ct-loading-short" />
      <div className="ct-loading-shimmer" />
      <div className="ct-loading-shimmer ct-loading-short" />
      <div className="ct-loading-shimmer" />
      <span className="ct-loading-label">Loading court data...</span>
    </div>
  );
}

/* ── Main Panel ── */

export function CourtPanel({ data, loading, onRefresh, onCaseClick }) {
  const [activeTab, setActiveTab] = useState('cases');

  const trackedCases = data?.trackedCases || [];
  const recentNews = data?.recentNews || [];
  const summary = data?.summary || {};

  /* Sort cases by impact severity */
  const sortedCases = [...trackedCases].sort(
    (a, b) => (IMPACT_ORDER[a.impact] ?? 9) - (IMPACT_ORDER[b.impact] ?? 9)
  );

  const counts = {
    cases: trackedCases.length,
    news: recentNews.length,
  };

  const tracked  = summary.totalTracked  || trackedCases.length;
  const active   = summary.active        || trackedCases.filter(c => c.status === 'active').length;
  const pending  = summary.pending       || trackedCases.filter(c => c.status === 'pending').length;
  const critical = summary.criticalImpact || trackedCases.filter(c => c.impact === 'critical').length;

  return (
    <div className="ct-panel">
      {/* ── Header ── */}
      <div className="ct-panel-header">
        <div className="ct-panel-title-row">
          <span className="ct-panel-title">Court Rulings & Legal Monitor</span>
          <span className="ct-live-badge">LEGAL</span>
        </div>
        <button className="ct-btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '↻'}
        </button>
      </div>

      {/* ── Summary stats ── */}
      <div className="ct-summary-row">
        <div className="ct-stat">
          <span className="ct-stat-value">{tracked}</span>
          <span className="ct-stat-label">Tracked</span>
        </div>
        <div className="ct-stat">
          <span className="ct-stat-value" style={{ color: '#5ee0ef' }}>{active}</span>
          <span className="ct-stat-label">Active</span>
        </div>
        <div className="ct-stat">
          <span className="ct-stat-value" style={{ color: '#ffd700' }}>{pending}</span>
          <span className="ct-stat-label">Pending</span>
        </div>
        <div className="ct-stat">
          <span className="ct-stat-value" style={{ color: '#ff4444' }}>{critical}</span>
          <span className="ct-stat-label">Critical</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="ct-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`ct-tab${activeTab === tab.id ? ' ct-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {counts[tab.id] > 0 && <span className="ct-tab-count">{counts[tab.id]}</span>}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="ct-panel-content">
        {loading && !data && <LoadingSkeleton />}

        {/* ── Major Cases Tab ── */}
        {activeTab === 'cases' && (
          <div className="ct-tab-body">
            <div className="ct-section-note">
              Significant court proceedings from ICJ, ICC, SCOTUS, ECHR, WTO, and ITLOS.
              Cases sorted by geopolitical impact level. Sources include court dockets
              and legal news feeds.
            </div>
            {sortedCases.length === 0 && !loading && (
              <div className="ct-empty">No tracked court cases</div>
            )}
            <div className="ct-card-list">
              {sortedCases.map((c) => (
                <CaseCard key={c.id} caseItem={c} onClick={onCaseClick} />
              ))}
            </div>
          </div>
        )}

        {/* ── Legal News Tab ── */}
        {activeTab === 'news' && (
          <div className="ct-tab-body">
            <div className="ct-section-note">
              Latest legal and judicial news from international courts, government
              legal proceedings, and major case developments worldwide.
            </div>
            {recentNews.length === 0 && !loading && (
              <div className="ct-empty">No recent legal news</div>
            )}
            <NewsSection headlines={recentNews} />
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="ct-panel-footer">
        <span className="ct-panel-sources">ICJ · ICC · SCOTUS · ECHR · Google News</span>
        {data?.lastUpdated && (
          <span className="ct-panel-updated">Updated {timeAgoShort(data.lastUpdated)}</span>
        )}
      </div>
    </div>
  );
}

export default CourtPanel;
