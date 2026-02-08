/**
 * SevereWeatherPanel — displays active severe weather / disaster events.
 * Tabbed UI: All | Earthquakes | Storms | Wildfires | Other
 */

import { useState, useRef, useEffect } from 'react';
import './severeWeather.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'earthquake', label: 'Earthquakes' },
  { id: 'storm', label: 'Storms' },
  { id: 'wildfire', label: 'Wildfires' },
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

function timeAgoShort(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function SevereWeatherPanel({
  visible,
  events,
  loading,
  onClose,
  onRefresh,
  onEventClick,
  selectedEventId,
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [pos, setPos] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
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
    // If the selected event isn't visible in the current tab, switch to 'all'
    const inCurrentTab = activeTab === 'all' ||
      (activeTab === 'other' && !['earthquake', 'storm', 'wildfire', 'volcano'].includes(ev.type)) ||
      ev.type === activeTab;
    if (!inCurrentTab) setActiveTab('all');
  }, [selectedEventId, events]);

  const onMouseDown = (e) => {
    if (e.target.closest('button, a, .severe-event-list')) return;
    setIsDragging(true);
    const currentX = pos.x != null ? pos.x : e.currentTarget.getBoundingClientRect().left;
    const currentY = pos.y != null ? pos.y : e.currentTarget.getBoundingClientRect().top;
    if (pos.x == null) setPos({ x: currentX, y: currentY });
    dragOffset.current = { x: e.clientX - currentX, y: e.clientY - currentY };
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      setPos({
        x: Math.max(0, e.clientX - dragOffset.current.x),
        y: Math.max(0, e.clientY - dragOffset.current.y),
      });
    };
    const onUp = () => setIsDragging(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  if (!visible) return null;

  const filtered = activeTab === 'all'
    ? events
    : activeTab === 'other'
      ? events.filter((e) => !['earthquake', 'storm', 'wildfire', 'volcano'].includes(e.type))
      : events.filter((e) => e.type === activeTab);

  const counts = {
    all: events.length,
    earthquake: events.filter((e) => e.type === 'earthquake').length,
    storm: events.filter((e) => e.type === 'storm').length,
    wildfire: events.filter((e) => e.type === 'wildfire').length,
    volcano: events.filter((e) => e.type === 'volcano').length,
    other: events.filter((e) => !['earthquake', 'storm', 'wildfire', 'volcano'].includes(e.type)).length,
  };

  const panelStyle = pos.x != null ? { left: pos.x, top: pos.y, right: 'auto' } : {};

  return (
    <div
      className={`severe-panel${isDragging ? ' severe-panel--dragging' : ''}`}
      style={panelStyle}
      onMouseDown={onMouseDown}
    >
      <div className="severe-panel-header">
        <div className="severe-panel-title-row">
          <span className="severe-panel-title">Severe Events</span>
          <span className="severe-panel-count">{events.length} active</span>
        </div>
        <div className="severe-panel-actions">
          <button className="severe-btn-refresh" onClick={onRefresh} disabled={loading}>
            {loading ? '...' : '↻'}
          </button>
          <button className="severe-btn-close" onClick={onClose} aria-label="Close">x</button>
        </div>
      </div>

      <div className="severe-tabs">
        {TABS.map((tab) => (
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
        <span className="severe-panel-drag-hint">Drag to move</span>
        <span className="severe-panel-sources">USGS + NASA EONET</span>
      </div>
    </div>
  );
}

export default SevereWeatherPanel;
