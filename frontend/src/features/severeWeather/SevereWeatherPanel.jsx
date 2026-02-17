/**
 * SevereWeatherPanel — displays active severe weather and natural disaster events.
 * Two top-level modes: Weather (USGS/NWS) and Disasters (NASA EONET / ReliefWeb)
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { timeAgoShort, timeAgo } from '../../utils/time';
import './severeWeather.css';

/* ─── Weather sub-tab config ─── */
const WEATHER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'earthquake', label: 'Earthquakes' },
  { id: 'storm', label: 'Storms' },
  { id: 'volcano', label: 'Volcanoes' },
  { id: 'other', label: 'Other' },
];

const SEVERITY_COLORS = {
  extreme: '#ff4444',
  severe: '#ff8c00',
  major: '#e6a020',
  moderate: '#f5c542',
  minor: '#88cc88',
};

const TYPE_ICONS = {
  earthquake: '🌍',
  storm: '🌀',
  wildfire: '🔥',
  volcano: '🌋',
  flood: '🌊',
  ice: '❄️',
  dust: '💨',
  landslide: '⛰️',
  drought: '☀️',
  other: '⚠️',
};

/* ─── Disaster constants ─── */
const DISASTER_SEV_COLORS = {
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

/* ─── Disaster sub-components ─── */

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
          <span className="dp-stat-value" style={{ color: DISASTER_SEV_COLORS[sev] }}>
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
      style={{ borderLeft: `3px solid ${DISASTER_SEV_COLORS[event.severity] || '#666'}` }}
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
        style={{ background: DISASTER_SEV_COLORS[event.severity] || '#666' }}
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

/* ─── Disaster Tab Content ─── */

function DisasterContent({ disasterData, disasterLoading, onRefreshDisasters, onEventClick }) {
  const [disasterTab, setDisasterTab] = useState('events');
  const [sevFilter, setSevFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  const events = disasterData?.activeEvents || [];
  const reliefItems = disasterData?.recentDisasters || [];

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

  const DISASTER_TABS = [
    { id: 'events', label: 'Active Events', count: events.length },
    { id: 'reliefweb', label: 'ReliefWeb', count: reliefItems.length },
    { id: 'summary', label: 'Summary', count: null },
  ];

  if (disasterLoading && !disasterData) {
    return (
      <div className="severe-loading">
        <span className="severe-loading-dot" />
        Loading disaster data...
      </div>
    );
  }

  if (!disasterData) {
    return <div className="severe-empty">No disaster data available</div>;
  }

  return (
    <div className="dp-panel">
      <div className="dp-panel-header">
        <div className="dp-panel-title-row">
          <span className="dp-panel-title">Natural Disaster Monitor</span>
          <span className="dp-live-badge">LIVE</span>
        </div>
        <button className="dp-btn-refresh" onClick={onRefreshDisasters} disabled={disasterLoading}>
          {disasterLoading ? '...' : '↻'}
        </button>
      </div>

      <DisasterSummaryBar summary={disasterData.summary} />

      <div className="dp-tabs">
        {DISASTER_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`dp-tab${disasterTab === tab.id ? ' dp-tab--active' : ''}`}
            onClick={() => setDisasterTab(tab.id)}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="dp-tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="dp-panel-content">
        {disasterTab === 'events' && (
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
                    style={sevFilter === f && f !== 'all' ? { borderColor: DISASTER_SEV_COLORS[f], color: DISASTER_SEV_COLORS[f] } : {}}
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
            {sortedFiltered.length === 0 && !disasterLoading && (
              <div className="dp-empty">No events matching current filters</div>
            )}
          </div>
        )}

        {disasterTab === 'reliefweb' && (
          <div className="dp-tab-body">
            <div className="dp-section-note">
              Recent disaster and humanitarian reports from ReliefWeb (OCHA). Click any report to read the full update.
            </div>
            {reliefItems.length === 0 && !disasterLoading && (
              <div className="dp-empty">No ReliefWeb reports available</div>
            )}
            <div className="dp-relief-list">
              {reliefItems.slice(0, 12).map((item) => (
                <ReliefWebItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {disasterTab === 'summary' && (
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
                  ? `Currently tracking ${events.length} active event${events.length !== 1 ? 's' : ''} across ${categoryBreakdown.length} categor${categoryBreakdown.length !== 1 ? 'ies' : 'y'}. ${(disasterData.summary?.bySeverity?.critical || 0) > 0 ? `${disasterData.summary.bySeverity.critical} critical event${disasterData.summary.bySeverity.critical !== 1 ? 's' : ''} require${disasterData.summary.bySeverity.critical === 1 ? 's' : ''} immediate attention.` : 'No critical-level events at this time.'}`
                  : 'No active events detected. Monitoring continues.'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dp-panel-footer">
        <span className="dp-panel-sources">NASA EONET + ReliefWeb</span>
        {disasterData?.lastUpdated && (
          <span className="dp-panel-updated">Updated {timeAgo(disasterData.lastUpdated)}</span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main Panel — top-level mode toggle: Weather vs Disasters
   ═══════════════════════════════════════════════════════════════════ */

export function SevereWeatherPanel({
  visible,
  events,
  loading,
  onClose,
  onRefresh,
  onEventClick,
  selectedEventId,
  disasterData,
  disasterLoading,
  onRefreshDisasters,
  onDisasterEventClick,
}) {
  const [mode, setMode] = useState('weather'); // 'weather' | 'disasters'
  const [activeTab, setActiveTab] = useState('all');
  const listRef = useRef(null);
  const selectedRef = useRef(null);

  // Auto-scroll to selected event when it changes
  useEffect(() => {
    if (selectedEventId && selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedEventId]);

  // Switch to the correct tab when an event is selected from the map
  useEffect(() => {
    if (!selectedEventId) return;
    const ev = events.find((e) => e.id === selectedEventId);
    if (!ev) return;
    const inCurrentTab = activeTab === 'all' ||
      (activeTab === 'other' && !['earthquake', 'storm', 'volcano'].includes(ev.type)) ||
      ev.type === activeTab;
    if (!inCurrentTab) setActiveTab('all');
    if (mode !== 'weather') setMode('weather');
  }, [selectedEventId, events]);

  if (!visible) return null;

  const filtered = activeTab === 'all'
    ? events
    : activeTab === 'other'
      ? events.filter((e) => !['earthquake', 'storm', 'volcano'].includes(e.type))
      : events.filter((e) => e.type === activeTab);

  const counts = {
    all: events.length,
    earthquake: events.filter((e) => e.type === 'earthquake').length,
    storm: events.filter((e) => e.type === 'storm').length,
    volcano: events.filter((e) => e.type === 'volcano').length,
    other: events.filter((e) => !['earthquake', 'storm', 'volcano'].includes(e.type)).length,
  };

  const disasterCount = disasterData?.activeEvents?.length || 0;

  return (
    <div className="severe-weather-integrated">
      {/* Top-level mode toggle */}
      <div className="severe-mode-toggle">
        <button
          className={`severe-mode-btn${mode === 'weather' ? ' severe-mode-btn--active' : ''}`}
          onClick={() => setMode('weather')}
        >
          Severe Weather
          {events.length > 0 && <span className="severe-mode-count">{events.length}</span>}
        </button>
        <button
          className={`severe-mode-btn${mode === 'disasters' ? ' severe-mode-btn--active' : ''}`}
          onClick={() => setMode('disasters')}
        >
          Disasters
          {disasterCount > 0 && <span className="severe-mode-count">{disasterCount}</span>}
        </button>
      </div>

      {/* ── Weather mode ── */}
      {mode === 'weather' && (
        <>
          <div className="severe-panel-header">
            <div className="severe-panel-title-row">
              <span className="severe-panel-title">Severe Events</span>
              <span className="severe-panel-count">{events.length} active</span>
            </div>
            <div className="severe-panel-actions">
              <button className="severe-btn-refresh" onClick={onRefresh} disabled={loading}>
                {loading ? '...' : '↻'}
              </button>
            </div>
          </div>

          <div className="severe-tabs">
            {WEATHER_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`severe-tab${activeTab === tab.id ? ' severe-tab--active' : ''}${counts[tab.id] === 0 ? ' severe-tab--empty' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {counts[tab.id] > 0 && <span className="severe-tab-count">{counts[tab.id]}</span>}
              </button>
            ))}
          </div>

          <div className="severe-event-list" ref={listRef}>
            {loading && events.length === 0 && (
              <div className="severe-loading">
                <span className="severe-loading-dot" />
                Loading severe events...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="severe-empty">No active events in this category</div>
            )}
            {filtered.map((event) => (
              <button
                key={event.id}
                ref={event.id === selectedEventId ? selectedRef : undefined}
                className={`severe-event-item${event.id === selectedEventId ? ' severe-event-item--selected' : ''}`}
                onClick={() => onEventClick?.(event)}
                type="button"
              >
                <span className="severe-event-icon">{TYPE_ICONS[event.type] || '⚠️'}</span>
                <div className="severe-event-info">
                  <div className="severe-event-title">{event.title}</div>
                  <div className="severe-event-meta">
                    {event.place && <span>{event.place}</span>}
                    {event.magnitude && <span>M{event.magnitude.toFixed(1)}</span>}
                    {event.category && event.type !== 'earthquake' && <span>{event.category}</span>}
                    {event.time && <span>{timeAgoShort(event.time)}</span>}
                  </div>
                </div>
                <span
                  className="severe-event-severity"
                  style={{ background: SEVERITY_COLORS[event.severity] || SEVERITY_COLORS.moderate }}
                >
                  {event.severity}
                </span>
              </button>
            ))}
          </div>

          <div className="severe-panel-footer">
            <span className="severe-panel-sources">USGS + NASA EONET</span>
          </div>
        </>
      )}

      {/* ── Disasters mode ── */}
      {mode === 'disasters' && (
        <DisasterContent
          disasterData={disasterData}
          disasterLoading={disasterLoading}
          onRefreshDisasters={onRefreshDisasters}
          onEventClick={onDisasterEventClick}
        />
      )}
    </div>
  );
}

export default SevereWeatherPanel;
