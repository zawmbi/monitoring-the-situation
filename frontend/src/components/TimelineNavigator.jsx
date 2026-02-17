import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

const CATEGORY_COLORS = {
  conflict: '#ef4444',
  politics: '#8b5cf6',
  economy: '#22c55e',
  disaster: '#f59e0b',
  cyber: '#06b6d4',
};

const CATEGORY_LABELS = {
  conflict: 'Conflict',
  politics: 'Politics',
  economy: 'Economy',
  disaster: 'Disaster',
  cyber: 'Cyber',
};

const ZOOM_LEVELS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
];

const DAY_MS = 86400000;

function formatShortDate(date) {
  const d = new Date(date);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function formatFullDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatDateTime(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── EventDot ─────────────────────────────────────────────────────────────────
function EventDot({ event, x, onEventClick, containerHeight }) {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[event.category] || '#888';
  const sev = event.severity || 1;
  const size = sev >= 3 ? 14 : sev >= 2 ? 10 : 7;
  const hasGlow = sev >= 3;

  const dotStyle = {
    position: 'absolute',
    left: x - size / 2,
    top: containerHeight / 2 - size / 2,
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    boxShadow: hovered
      ? `0 0 10px ${color}, 0 0 20px ${color}`
      : hasGlow
        ? `0 0 8px ${color}aa, 0 0 16px ${color}44`
        : `0 0 4px ${color}80`,
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.15s',
    transform: hovered ? 'scale(1.5)' : 'scale(1)',
    zIndex: hovered ? 20 : sev + 1,
    border: hasGlow ? `1.5px solid ${color}cc` : 'none',
  };

  const tooltipStyle = {
    position: 'absolute',
    bottom: containerHeight / 2 + size / 2 + 10,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(8,10,16,0.97)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '6px',
    padding: '7px 10px',
    whiteSpace: 'nowrap',
    fontSize: '10px',
    color: 'rgba(255,255,255,0.9)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    pointerEvents: 'none',
    zIndex: 100,
    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
    letterSpacing: '0.2px',
    maxWidth: '260px',
  };

  return (
    <div
      style={dotStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
    >
      {hovered && (
        <div style={tooltipStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span style={{
              display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
              background: color, flexShrink: 0,
            }} />
            <span style={{ color, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.title}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px' }}>
            <span style={{
              background: `${color}22`, color, border: `1px solid ${color}44`,
              borderRadius: '3px', padding: '1px 5px', fontSize: '8px', textTransform: 'uppercase',
              letterSpacing: '0.5px', fontWeight: 600,
            }}>
              {CATEGORY_LABELS[event.category] || event.category}
            </span>
            {sev >= 2 && (
              <span style={{ color: sev >= 3 ? '#ef4444' : '#f59e0b', fontSize: '8px', fontWeight: 700 }}>
                SEV {sev}
              </span>
            )}
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>
              {formatDateTime(event.date)}
            </span>
            {event.country && (
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>{event.country}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Category Filter Pills ────────────────────────────────────────────────────
function CategoryFilters({ activeCategories, onToggle, eventCounts }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '4px 12px', flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
        const active = activeCategories.has(cat);
        const count = eventCounts[cat] || 0;
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: active ? `${color}20` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? `${color}55` : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '10px',
              padding: '2px 8px 2px 6px',
              fontSize: '9px',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              color: active ? color : 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              letterSpacing: '0.3px',
              opacity: active ? 1 : 0.7,
            }}
          >
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: active ? color : 'rgba(255,255,255,0.2)',
              transition: 'background 0.15s',
            }} />
            {CATEGORY_LABELS[cat]}
            {count > 0 && (
              <span style={{
                background: active ? `${color}30` : 'rgba(255,255,255,0.06)',
                borderRadius: '3px', padding: '0 3px',
                fontSize: '8px', fontWeight: 600,
                marginLeft: '1px',
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Recent Events List (expanded view) ───────────────────────────────────────
function RecentEventsList({ events, onEventClick }) {
  if (!events || events.length === 0) {
    return (
      <div style={{
        padding: '12px', textAlign: 'center',
        color: 'rgba(255,255,255,0.3)', fontSize: '10px',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}>
        No events in this time range
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
  const display = sorted.slice(0, 15);

  return (
    <div style={{
      overflowY: 'auto', flex: 1, padding: '2px 0',
      scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent',
    }}>
      {display.map((ev) => {
        const color = CATEGORY_COLORS[ev.category] || '#888';
        const sev = ev.severity || 1;
        return (
          <div
            key={ev.id}
            onClick={() => onEventClick(ev)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '4px 12px', cursor: 'pointer',
              transition: 'background 0.1s',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
              background: color, boxShadow: sev >= 3 ? `0 0 6px ${color}88` : 'none',
            }} />
            <span style={{
              color: 'rgba(255,255,255,0.85)', fontSize: '10px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>
              {ev.title}
            </span>
            {ev.country && (
              <span style={{
                color: 'rgba(255,255,255,0.4)', fontSize: '9px', flexShrink: 0,
              }}>
                {ev.country}
              </span>
            )}
            <span style={{
              color: 'rgba(255,255,255,0.3)', fontSize: '9px', flexShrink: 0,
              minWidth: '48px', textAlign: 'right',
            }}>
              {formatShortDate(ev.date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── MiniEventList ────────────────────────────────────────────────────────────
function MiniEventList({ events, visible, onEventClick, positionX }) {
  if (!visible || !events || events.length === 0) return null;

  const displayEvents = events.slice(0, 5);
  const overflow = events.length - 5;

  const panelStyle = {
    position: 'absolute',
    bottom: '100%',
    left: Math.max(10, Math.min(positionX - 120, window.innerWidth - 260)),
    marginBottom: '6px',
    width: '260px',
    background: 'rgba(8,10,16,0.97)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '6px 0',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '10px',
    boxShadow: '0 6px 30px rgba(0,0,0,0.6)',
    zIndex: 200,
    backdropFilter: 'blur(16px)',
    animation: 'timeline-popup-in 0.15s ease-out',
  };

  return (
    <div style={panelStyle}>
      <div style={{
        padding: '2px 10px 4px', color: 'rgba(255,255,255,0.4)',
        fontSize: '9px', letterSpacing: '0.8px', textTransform: 'uppercase',
        borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '2px',
      }}>
        Events ({events.length})
      </div>
      {displayEvents.map((ev) => {
        const color = CATEGORY_COLORS[ev.category] || '#888';
        return (
          <div
            key={ev.id}
            style={{
              padding: '4px 10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'background 0.1s',
            }}
            onClick={() => onEventClick(ev)}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
              background: color,
            }} />
            <span style={{ color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {ev.title}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', flexShrink: 0 }}>
              {formatShortDate(ev.date)}
            </span>
          </div>
        );
      })}
      {overflow > 0 && (
        <div style={{ padding: '3px 10px', color: 'rgba(255,255,255,0.35)', fontSize: '9px', textAlign: 'center' }}>
          +{overflow} more
        </div>
      )}
    </div>
  );
}

// ── TimelineControls ─────────────────────────────────────────────────────────
function TimelineControls({ zoomLevel, onZoomChange, isPlaying, onPlayToggle, isLive, onLiveToggle, selectedDate }) {
  const btnBase = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '4px',
    color: 'rgba(255,255,255,0.55)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '9px',
    padding: '2px 7px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'all 0.15s',
  };

  const activeBtnStyle = {
    ...btnBase,
    background: 'rgba(59,130,246,0.2)',
    borderColor: 'rgba(59,130,246,0.45)',
    color: '#93bbfc',
  };

  const playBtnStyle = {
    ...btnBase,
    width: '24px',
    height: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontSize: '11px',
    ...(isPlaying ? { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' } : {}),
  };

  const liveBtnStyle = {
    ...btnBase,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    ...(isLive ? { background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.35)', color: '#86efac' } : {}),
  };

  const sep = { width: '1px', height: '14px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '0 12px', height: '28px',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: '10px', color: 'rgba(255,255,255,0.6)', flexShrink: 0,
    }}>
      {ZOOM_LEVELS.map((z) => (
        <button
          key={z.label}
          style={zoomLevel === z.days ? activeBtnStyle : btnBase}
          onClick={() => onZoomChange(z.days)}
        >
          {z.label}
        </button>
      ))}

      <div style={sep} />

      <button style={playBtnStyle} onClick={onPlayToggle} title={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? '\u275A\u275A' : '\u25B6'}
      </button>

      <div style={sep} />

      <button style={liveBtnStyle} onClick={onLiveToggle} title="Snap to live">
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: isLive ? '#22c55e' : 'rgba(255,255,255,0.3)',
          boxShadow: isLive ? '0 0 6px #22c55e' : 'none',
        }} />
        LIVE
      </button>

      <div style={sep} />

      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.3px' }}>
        {selectedDate ? formatFullDate(selectedDate) : formatFullDate(new Date())}
      </span>
    </div>
  );
}

// ── TimelineBar ──────────────────────────────────────────────────────────────
function TimelineBar({
  events, rangeStart, rangeEnd, onTimeSelect, onEventClick,
  eventsByDay, onDayHover, hoveredDay, activeCategories,
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const barHeight = 68;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dateToX = useCallback((date) => {
    const ts = new Date(date).getTime();
    const start = new Date(rangeStart).getTime();
    const end = new Date(rangeEnd).getTime();
    if (end === start) return 0;
    return ((ts - start) / (end - start)) * containerWidth;
  }, [rangeStart, rangeEnd, containerWidth]);

  // Generate time markers
  const timeMarkers = useMemo(() => {
    const markers = [];
    const start = new Date(rangeStart).getTime();
    const end = new Date(rangeEnd).getTime();
    const rangeDays = (end - start) / DAY_MS;
    let stepDays = 1;
    if (rangeDays > 200) stepDays = 30;
    else if (rangeDays > 60) stepDays = 14;
    else if (rangeDays > 20) stepDays = 7;
    else if (rangeDays > 7) stepDays = 2;

    const d = new Date(rangeStart);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);

    while (d.getTime() <= end) {
      markers.push({ date: new Date(d), x: dateToX(d) });
      d.setDate(d.getDate() + stepDays);
    }
    return markers;
  }, [rangeStart, rangeEnd, dateToX]);

  // Stacked category bars per day
  const categoryBars = useMemo(() => {
    const allCats = Object.keys(CATEGORY_COLORS);
    const maxCount = Math.max(1, ...Object.values(eventsByDay).map((arr) =>
      arr.filter(e => activeCategories.has(e.category)).length
    ));
    const bars = [];
    for (const [dayKey, dayEvents] of Object.entries(eventsByDay)) {
      const dayDate = new Date(dayKey);
      const x = dateToX(dayDate);
      const catCounts = {};
      for (const ev of dayEvents) {
        if (activeCategories.has(ev.category)) {
          catCounts[ev.category] = (catCounts[ev.category] || 0) + 1;
        }
      }
      const total = Object.values(catCounts).reduce((a, b) => a + b, 0);
      if (total === 0) continue;
      const heightPct = total / maxCount;
      const segments = [];
      let offset = 0;
      for (const cat of allCats) {
        if (catCounts[cat]) {
          segments.push({ category: cat, count: catCounts[cat], offset, fraction: catCounts[cat] / total });
          offset += catCounts[cat] / total;
        }
      }
      bars.push({ x, heightPct, segments, dayKey, total });
    }
    return bars;
  }, [eventsByDay, dateToX, activeCategories]);

  // Current time position
  const nowX = dateToX(new Date());

  const handleBarClick = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / containerWidth;
    const start = new Date(rangeStart).getTime();
    const end = new Date(rangeEnd).getTime();
    const clickDate = new Date(start + ratio * (end - start));
    onTimeSelect(clickDate);
  };

  const handleBarMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const ratio = hoverX / containerWidth;
    const start = new Date(rangeStart).getTime();
    const end = new Date(rangeEnd).getTime();
    const hoverDate = new Date(start + ratio * (end - start));
    const dayKey = hoverDate.toISOString().slice(0, 10);
    onDayHover(dayKey, e.clientX);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative', width: '100%', height: barHeight,
        overflow: 'hidden', cursor: 'crosshair',
      }}
      onClick={handleBarClick}
      onMouseMove={handleBarMouseMove}
      onMouseLeave={() => onDayHover(null, 0)}
    >
      {/* Subtle horizontal grid lines */}
      {[0.25, 0.5, 0.75].map((pct) => (
        <div key={pct} style={{
          position: 'absolute', left: 0, right: 0,
          top: `${(1 - pct) * 100}%`, height: '1px',
          background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
        }} />
      ))}

      {/* Vertical grid lines + time labels */}
      {timeMarkers.map((m, i) => (
        <div key={i}>
          <div style={{
            position: 'absolute', left: m.x, top: 0, width: '1px', height: '100%',
            background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', left: m.x + 3, bottom: 2,
            fontSize: '8px', color: 'rgba(255,255,255,0.25)',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            whiteSpace: 'nowrap', letterSpacing: '0.3px',
            pointerEvents: 'none', userSelect: 'none',
          }}>
            {formatShortDate(m.date)}
          </div>
        </div>
      ))}

      {/* Stacked category density bars */}
      {categoryBars.map((bar, i) => {
        const maxBarH = barHeight * 0.65;
        const totalH = Math.max(3, bar.heightPct * maxBarH);
        const isHovered = bar.dayKey === hoveredDay;
        return (
          <div key={`bar-${i}`} style={{
            position: 'absolute', left: bar.x - 2.5, bottom: 14,
            width: 5, height: totalH, pointerEvents: 'none',
            borderRadius: '1.5px 1.5px 0 0', overflow: 'hidden',
            opacity: isHovered ? 1 : 0.85,
            transition: 'opacity 0.1s',
          }}>
            {bar.segments.map((seg, j) => (
              <div key={j} style={{
                position: 'absolute',
                bottom: `${seg.offset * 100}%`,
                left: 0, right: 0,
                height: `${seg.fraction * 100}%`,
                background: CATEGORY_COLORS[seg.category],
                opacity: isHovered ? 0.8 : 0.5,
                transition: 'opacity 0.1s',
              }} />
            ))}
          </div>
        );
      })}

      {/* Event dots */}
      {events.map((ev) => {
        const x = dateToX(ev.date);
        if (x < -10 || x > containerWidth + 10) return null;
        return (
          <EventDot
            key={ev.id}
            event={ev}
            x={x}
            containerHeight={barHeight}
            onEventClick={onEventClick}
          />
        );
      })}

      {/* Current time indicator */}
      {nowX >= 0 && nowX <= containerWidth && (
        <>
          <div style={{
            position: 'absolute', left: nowX, top: 0,
            width: '1px', height: '100%',
            background: 'rgba(59,130,246,0.4)',
            pointerEvents: 'none', zIndex: 14,
          }} />
          <div style={{
            position: 'absolute',
            left: nowX - 5, top: barHeight / 2 - 5,
            width: 10, height: 10,
            borderRadius: '50%', background: '#3b82f6',
            boxShadow: '0 0 8px #3b82f6, 0 0 16px rgba(59,130,246,0.4)',
            animation: 'timeline-pulse 2s ease-in-out infinite',
            zIndex: 15, pointerEvents: 'none',
          }} />
        </>
      )}
    </div>
  );
}

// ── TimelineNavigator (main export) ──────────────────────────────────────────
export function TimelineNavigator({ events, onTimeSelect, onEventClick }) {
  const [zoomLevel, setZoomLevel] = useState(30);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredDayX, setHoveredDayX] = useState(0);
  const [activeCategories, setActiveCategories] = useState(
    () => new Set(Object.keys(CATEGORY_COLORS))
  );
  const playIntervalRef = useRef(null);

  // Toggle a category filter
  const handleCategoryToggle = useCallback((cat) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  // Compute time range based on zoom level
  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - zoomLevel);
    return { rangeStart: start, rangeEnd: end };
  }, [zoomLevel]);

  // Filter events to those within the visible range AND active categories
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    const start = rangeStart.getTime();
    const end = rangeEnd.getTime();
    return events.filter((ev) => {
      const t = new Date(ev.date).getTime();
      return t >= start && t <= end && activeCategories.has(ev.category);
    });
  }, [events, rangeStart, rangeEnd, activeCategories]);

  // All events in range (before category filter) for counts
  const allEventsInRange = useMemo(() => {
    if (!events || events.length === 0) return [];
    const start = rangeStart.getTime();
    const end = rangeEnd.getTime();
    return events.filter((ev) => {
      const t = new Date(ev.date).getTime();
      return t >= start && t <= end;
    });
  }, [events, rangeStart, rangeEnd]);

  // Category event counts
  const eventCounts = useMemo(() => {
    const counts = {};
    for (const ev of allEventsInRange) {
      counts[ev.category] = (counts[ev.category] || 0) + 1;
    }
    return counts;
  }, [allEventsInRange]);

  // Group events by day (all in range for stacked bars)
  const eventsByDay = useMemo(() => {
    const groups = {};
    for (const ev of allEventsInRange) {
      const dayKey = new Date(ev.date).toISOString().slice(0, 10);
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(ev);
    }
    return groups;
  }, [allEventsInRange]);

  // Events for the hovered day
  const hoveredDayEvents = useMemo(() => {
    if (!hoveredDay || !eventsByDay[hoveredDay]) return [];
    return eventsByDay[hoveredDay].filter(e => activeCategories.has(e.category));
  }, [hoveredDay, eventsByDay, activeCategories]);

  // Handlers
  const handleTimeSelect = useCallback((date) => {
    setSelectedDate(date);
    setIsLive(false);
    if (onTimeSelect) onTimeSelect(date);
  }, [onTimeSelect]);

  const handleEventClick = useCallback((event) => {
    if (onEventClick) onEventClick(event);
  }, [onEventClick]);

  const handleZoomChange = useCallback((days) => {
    setZoomLevel(days);
  }, []);

  const handlePlayToggle = useCallback(() => {
    setIsPlaying((prev) => !prev);
    setIsLive(false);
  }, []);

  const handleLiveToggle = useCallback(() => {
    setIsLive((prev) => {
      if (!prev) {
        setIsPlaying(false);
        setSelectedDate(null);
      }
      return !prev;
    });
  }, []);

  const handleDayHover = useCallback((dayKey, clientX) => {
    setHoveredDay(dayKey);
    setHoveredDayX(clientX);
  }, []);

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      const startDate = selectedDate ? new Date(selectedDate) : new Date(rangeStart);
      let current = startDate.getTime();
      const endTs = rangeEnd.getTime();
      const step = (endTs - new Date(rangeStart).getTime()) / 200;

      playIntervalRef.current = setInterval(() => {
        current += step;
        if (current >= endTs) {
          setIsPlaying(false);
          clearInterval(playIntervalRef.current);
          return;
        }
        const newDate = new Date(current);
        setSelectedDate(newDate);
        if (onTimeSelect) onTimeSelect(newDate);
      }, 80);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, rangeStart, rangeEnd, selectedDate, onTimeSelect]);

  // Live mode
  useEffect(() => {
    if (!isLive) return;
    setSelectedDate(null);
    const id = setInterval(() => {
      setSelectedDate(null);
    }, 30000);
    return () => clearInterval(id);
  }, [isLive]);

  const collapsedH = 100;
  const expandedH = 220;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        left: 'var(--sidebar-width, 400px)',
        right: 0,
        zIndex: 9998,
        height: expanded ? `${expandedH}px` : `${collapsedH}px`,
        background: 'linear-gradient(180deg, rgba(12,14,22,0.98) 0%, rgba(8,10,16,0.99) 100%)',
        borderTop: '1px solid rgba(59,130,246,0.3)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        backdropFilter: 'blur(20px)',
        transition: 'height 0.25s ease, left 0.3s ease',
        userSelect: 'none',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
      }}
      className="timeline-navigator"
    >
      {/* Top row: label + controls + expand toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', height: '28px',
        flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          padding: '0 12px', fontSize: '10px', letterSpacing: '1.2px',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          TIMELINE
          <span style={{
            background: 'rgba(59,130,246,0.15)', color: '#93bbfc',
            borderRadius: '4px', padding: '0 5px', fontSize: '9px', fontWeight: 600,
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
            {filteredEvents.length}
          </span>
        </div>

        <TimelineControls
          zoomLevel={zoomLevel}
          onZoomChange={handleZoomChange}
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
          isLive={isLive}
          onLiveToggle={handleLiveToggle}
          selectedDate={selectedDate}
        />

        <div style={{ flex: 1 }} />

        {/* Expand/collapse toggle */}
        <div
          style={{
            padding: '0 12px', cursor: 'pointer', fontSize: '9px',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            userSelect: 'none', transition: 'color 0.15s',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
          onClick={() => setExpanded((prev) => !prev)}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
        >
          {expanded ? '\u25BC' : '\u25B2'}
          {expanded ? 'collapse' : 'expand'}
        </div>
      </div>

      {/* Category filter pills */}
      <CategoryFilters
        activeCategories={activeCategories}
        onToggle={handleCategoryToggle}
        eventCounts={eventCounts}
      />

      {/* Timeline bar area (always visible) */}
      <div style={{ flex: expanded ? 'none' : 1, position: 'relative', overflow: 'hidden', minHeight: expanded ? '68px' : undefined }}>
        <TimelineBar
          events={filteredEvents}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onTimeSelect={handleTimeSelect}
          onEventClick={handleEventClick}
          eventsByDay={eventsByDay}
          onDayHover={handleDayHover}
          hoveredDay={hoveredDay}
          activeCategories={activeCategories}
        />

        {/* Mini event list popup on hover */}
        <MiniEventList
          events={hoveredDayEvents}
          visible={hoveredDay !== null && hoveredDayEvents.length > 0}
          onEventClick={handleEventClick}
          positionX={hoveredDayX}
        />
      </div>

      {/* Expanded view: recent events list */}
      {expanded && (
        <div style={{
          flex: 1, borderTop: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '4px 12px', fontSize: '9px', letterSpacing: '0.8px',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
            fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            Recent Events
          </div>
          <RecentEventsList events={filteredEvents} onEventClick={handleEventClick} />
        </div>
      )}

      {/* Selected date indicator line */}
      {selectedDate && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%)',
          opacity: 0.5, pointerEvents: 'none',
        }} />
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes timeline-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes timeline-popup-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
