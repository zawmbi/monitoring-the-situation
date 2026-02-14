/**
 * DisasterPanel — Tabbed panel showing:
 *   1. Active natural disaster events (NASA EONET)
 *   2. ReliefWeb humanitarian reports
 *   3. Disaster summary with category breakdown and trends
 */

import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

const SEVERITY_COLORS = {
  critical: '#ff4444',
  high: '#ff8c00',
  moderate: '#ffd700',
  low: '#4ecdc4',
};

const SEVERITY_ORDER = { critical: 0, high: 1, moderate: 2, low: 3 };

const CATEGORY_META = {
  earthquake: { icon: '🔴', label: 'Earthquake' },
  flood: { icon: '🌊', label: 'Flood' },
  wildfire: { icon: '🔥', label: 'Wildfire' },
  volcano: { icon: '🌋', label: 'Volcano' },
  storm: { icon: '🌀', label: 'Storm' },
  drought: { icon: '☀️', label: 'Drought' },
  landslide: { icon: '⛰️', label: 'Landslide' },
  other: { icon: '⚠️', label: 'Other' },
};

const TABS = [
  { id: 'events', label: 'Active Events' },
  { id: 'reliefweb', label: 'ReliefWeb Reports' },
  { id: 'summary', label: 'Summary' },
];

/* ── Sub-components ─────────────────────────────── */

function DisasterSummaryBar({ summary }) {
  const total = summary?.totalActive || 0;
  const bySev = summary?.bySeverity || {};
  const affected = summary?.totalAffected || 0;
  return (
    <div className="dp-summary-bar">
      <div className="dp-stat">
        <span className="dp-stat-value">{total}</span>
        <span className="dp-stat-label">Active</span>
      </div>
      {['critical', 'high', 'moderate', 'low'].map((sev) => (
        <div key={sev} className="dp-stat">
          <span className="dp-stat-value" style={{ color: SEVERITY_COLORS[sev] }}>
            {bySev[sev] || 0}
          </span>
          <span className="dp-stat-label">{sev}</span>
        </div>
      ))}
      {affected > 0 && (
        <div className="dp-stat">
          <span className="dp-stat-value">{affected.toLocaleString()}</span>
          <span className="dp-stat-label">Affected</span>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, onClick }) {
  const cat = CATEGORY_META[event.category] || CATEGORY_META.other;
  return (
    <button
      className="dp-event-card"
      type="button"
      onClick={() => onClick?.(event)}
      style={{ borderLeft: `3px solid ${SEVERITY_COLORS[event.severity] || '#666'}` }}
    >
      <div className="dp-event-card-left">
        <span className="dp-event-icon">{event.icon || cat.icon}</span>
      </div>
      <div className="dp-event-card-body">
        <div className="dp-event-card-header">
          <span className="dp-event-category-chip">{event.categoryLabel || cat.label}</span>
          {event.location && <span className="dp-event-location">📍 {event.location}</span>}
        </div>
        <div className="dp-event-title">{event.title}</div>
        <div className="dp-event-meta">
          {event.date && <span className="dp-event-time">{timeAgo(event.date)}</span>}
          <span className="dp-event-source">{event.source}</span>
        </div>
      </div>
      <span
        className="dp-severity-badge"
        style={{ background: SEVERITY_COLORS[event.severity] || '#666' }}
      >
        {event.severity}
      </span>
    </button>
  );
}

function ReliefWebItem({ item }) {
  return (
    <a
      className="dp-relief-item"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="dp-relief-title">{item.title}</div>
      <div className="dp-relief-meta">
        <span>{item.countries?.join(', ')}</span>
        <span className="dp-relief-type">{item.type?.join(', ')}</span>
        {item.date && <span className="dp-relief-date">{timeAgo(item.date)}</span>}
      </div>
    </a>
  );
}

function LoadingSkeleton() {
  return (
    <div className="dp-skeleton">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="dp-skeleton-card">
          <div className="dp-skeleton-line dp-skeleton-line--wide" />
          <div className="dp-skeleton-line dp-skeleton-line--medium" />
          <div className="dp-skeleton-line dp-skeleton-line--narrow" />
        </div>
      ))}
    </div>
  );
}

/* ── Main Panel ─────────────────────────────────── */

export function DisasterPanel({ data, loading, onRefresh, onEventClick }) {
  const [activeTab, setActiveTab] = useState('events');
  const [sevFilter, setSevFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  const events = data?.activeEvents || [];
  const reliefItems = data?.recentDisasters || [];

  const categories = useMemo(() => {
    const cats = new Set(events.map((e) => e.category).filter(Boolean));
    return ['all', ...Array.from(cats).sort()];
  }, [events]);

  const sortedFiltered = useMemo(() => {
    let result = [...events];
    if (sevFilter !== 'all') result = result.filter((e) => e.severity === sevFilter);
    if (catFilter !== 'all') result = result.filter((e) => e.category === catFilter);
    result.sort((a, b) => {
      const sevDiff = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
    return result;
  }, [events, sevFilter, catFilter]);

  const categoryBreakdown = useMemo(() => {
    const counts = {};
    events.forEach((e) => {
      const cat = e.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, count]) => ({ cat, count, meta: CATEGORY_META[cat] || CATEGORY_META.other }));
  }, [events]);

  const maxCatCount = Math.max(1, ...categoryBreakdown.map((c) => c.count));

  const counts = {
    events: events.length,
    reliefweb: reliefItems.length,
    summary: null,
  };

  if (loading && !data) return <LoadingSkeleton />;
  if (!data) return <div className="dp-empty">No disaster data available</div>;

  return (
    <div className="dp-panel">
      <div className="dp-panel-header">
        <div className="dp-panel-title-row">
          <span className="dp-panel-title">Natural Disaster Monitor</span>
          <span className="dp-live-badge">LIVE</span>
        </div>
        <button className="dp-btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '↻'}
        </button>
      </div>

      <DisasterSummaryBar summary={data.summary} />

      <div className="dp-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`dp-tab${activeTab === tab.id ? ' dp-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {counts[tab.id] != null && counts[tab.id] > 0 && (
              <span className="dp-tab-count">{counts[tab.id]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="dp-panel-content">
        {/* ── Active Events Tab ── */}
        {activeTab === 'events' && (
          <div className="dp-tab-body">
            <div className="dp-section-note">
              Active natural disaster events aggregated from NASA EONET and humanitarian sources. Sorted by severity then recency.
            </div>
            <div className="dp-filters">
              <div className="dp-filter-group">
                <span className="dp-filter-label">Severity:</span>
                {['all', 'critical', 'high', 'moderate', 'low'].map((f) => (
                  <button
                    key={f}
                    className={`dp-filter-btn${sevFilter === f ? ' active' : ''}`}
                    style={sevFilter === f && f !== 'all' ? { borderColor: SEVERITY_COLORS[f], color: SEVERITY_COLORS[f] } : {}}
                    onClick={() => setSevFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="dp-filter-group">
                <span className="dp-filter-label">Category:</span>
                {categories.map((c) => (
                  <button
                    key={c}
                    className={`dp-filter-btn${catFilter === c ? ' active' : ''}`}
                    onClick={() => setCatFilter(c)}
                  >
                    {c === 'all' ? 'all' : (CATEGORY_META[c]?.icon || '') + ' ' + (CATEGORY_META[c]?.label || c)}
                  </button>
                ))}
              </div>
            </div>
            <div className="dp-card-list">
              {sortedFiltered.map((event) => (
                <EventCard key={event.id} event={event} onClick={onEventClick} />
              ))}
            </div>
            {sortedFiltered.length === 0 && !loading && (
              <div className="dp-empty">No events matching current filters</div>
            )}
          </div>
        )}

        {/* ── ReliefWeb Reports Tab ── */}
        {activeTab === 'reliefweb' && (
          <div className="dp-tab-body">
            <div className="dp-section-note">
              Recent disaster and humanitarian reports from ReliefWeb (OCHA). Click any report to read the full update.
            </div>
            {reliefItems.length === 0 && !loading && (
              <div className="dp-empty">No ReliefWeb reports available</div>
            )}
            <div className="dp-relief-list">
              {reliefItems.slice(0, 12).map((item) => (
                <ReliefWebItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* ── Summary Tab ── */}
        {activeTab === 'summary' && (
          <div className="dp-tab-body">
            <div className="dp-section-note">
              Breakdown of active events by category and overall disaster trend analysis.
            </div>
            <div className="dp-summary-section">
              <div className="dp-summary-section-title">Events by Category</div>
              {categoryBreakdown.map(({ cat, count, meta }) => (
                <div key={cat} className="dp-cat-bar-row">
                  <span className="dp-cat-bar-label">{meta.icon} {meta.label}</span>
                  <div className="dp-cat-bar-track">
                    <div
                      className="dp-cat-bar-fill"
                      style={{ width: `${(count / maxCatCount) * 100}%` }}
                    />
                  </div>
                  <span className="dp-cat-bar-count">{count}</span>
                </div>
              ))}
              {categoryBreakdown.length === 0 && (
                <div className="dp-empty">No category data available</div>
              )}
            </div>
            <div className="dp-summary-section">
              <div className="dp-summary-section-title">Recent Trend</div>
              <div className="dp-trend-text">
                {events.length > 0
                  ? `Currently tracking ${events.length} active event${events.length !== 1 ? 's' : ''} across ${categoryBreakdown.length} categor${categoryBreakdown.length !== 1 ? 'ies' : 'y'}. ${(data.summary?.bySeverity?.critical || 0) > 0 ? `${data.summary.bySeverity.critical} critical event${data.summary.bySeverity.critical !== 1 ? 's' : ''} require${data.summary.bySeverity.critical === 1 ? 's' : ''} immediate attention.` : 'No critical-level events at this time.'}`
                  : 'No active events detected. Monitoring continues.'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dp-panel-footer">
        <span className="dp-panel-sources">NASA EONET + ReliefWeb</span>
        {data?.lastUpdated && (
          <span className="dp-panel-updated">Updated {timeAgo(data.lastUpdated)}</span>
        )}
      </div>
    </div>
  );
}
