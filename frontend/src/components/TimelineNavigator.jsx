import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

const CATEGORY_COLORS = {
  conflict: '#ef4444',
  politics: '#8b5cf6',
  economy: '#22c55e',
  disaster: '#f59e0b',
  cyber: '#06b6d4',
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
  const size = sev >= 3 ? 10 : sev >= 2 ? 7 : 5;

  const dotStyle = {
    position: 'absolute',
    left: x - size / 2,
    top: containerHeight / 2 - size / 2,
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    boxShadow: hovered ? `0 0 8px ${color}, 0 0 16px ${color}` : `0 0 4px ${color}80`,
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.15s',
    transform: hovered ? 'scale(1.6)' : 'scale(1)',
    zIndex: hovered ? 20 : sev + 1,
  };

  const tooltipStyle = {
    position: 'absolute',
    bottom: containerHeight / 2 + size / 2 + 8,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(10,12,18,0.96)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '4px',
    padding: '5px 8px',
    whiteSpace: 'nowrap',
    fontSize: '10px',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    pointerEvents: 'none',
    zIndex: 100,
    boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
    letterSpacing: '0.2px',
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
          <div style={{ color, fontWeight: 600, marginBottom: '2px' }}>{event.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>
            {formatDateTime(event.date)}
            {event.country ? ` \u2022 ${event.country}` : ''}
          </div>
        </div>
      )}
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
    width: '240px',
    background: 'rgba(10,12,18,0.96)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px',
    padding: '6px 0',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '10px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    zIndex: 200,
    backdropFilter: 'blur(12px)',
    animation: 'timeline-popup-in 0.15s ease-out',
  };

  const itemStyle = {
    padding: '4px 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background 0.1s',
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
      {displayEvents.map((ev) => (
        <div
          key={ev.id}
          style={itemStyle}
          onClick={() => onEventClick(ev)}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
            background: CATEGORY_COLORS[ev.category] || '#888',
          }} />
          <span style={{ color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {ev.title}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', flexShrink: 0 }}>
            {formatShortDate(ev.date)}
          </span>
        </div>
      ))}
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
  const controlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 12px',
    height: '24px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '10px',
    color: 'rgba(255,255,255,0.6)',
    flexShrink: 0,
  };

  const btnBase = {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '3px',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '9px',
    padding: '2px 6px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'all 0.15s',
  };

  const activeBtnStyle = {
    ...btnBase,
    background: 'rgba(59,130,246,0.25)',
    borderColor: 'rgba(59,130,246,0.5)',
    color: '#93bbfc',
  };

  const playBtnStyle = {
    ...btnBase,
    width: '22px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontSize: '11px',
    ...(isPlaying ? { background: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' } : {}),
  };

  const liveBtnStyle = {
    ...btnBase,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    ...(isLive ? { background: 'rgba(34,197,94,0.2)', borderColor: 'rgba(34,197,94,0.4)', color: '#86efac' } : {}),
  };

  const sep = { width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 };

  return (
    <div style={controlsStyle}>
      {ZOOM_LEVELS.map((z) => (
        <button
          key={z.label}
          style={zoomLevel === z.days ? activeBtnStyle : btnBase}
          onClick={() => onZoomChange(z.days)}
          onMouseEnter={(e) => { if (zoomLevel !== z.days) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
          onMouseLeave={(e) => { if (zoomLevel !== z.days) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
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

      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', letterSpacing: '0.3px' }}>
        {selectedDate ? formatFullDate(selectedDate) : formatFullDate(new Date())}
      </span>
    </div>
  );
}

// ── TimelineBar ──────────────────────────────────────────────────────────────
function TimelineBar({
  events, rangeStart, rangeEnd, onTimeSelect, onEventClick,
  eventsByDay, expanded, onToggleExpand, onDayHover, hoveredDay,
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const barHeight = expanded ? 120 : 56;

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

  // Density bars (event count per day)
  const densityBars = useMemo(() => {
    const bars = [];
    const maxCount = Math.max(1, ...Object.values(eventsByDay).map((arr) => arr.length));
    for (const [dayKey, dayEvents] of Object.entries(eventsByDay)) {
      const dayDate = new Date(dayKey);
      const x = dateToX(dayDate);
      const heightPct = dayEvents.length / maxCount;
      bars.push({ x, height: heightPct, count: dayEvents.length, dayKey });
    }
    return bars;
  }, [eventsByDay, dateToX]);

  // Current time position
  const nowX = dateToX(new Date());

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: barHeight,
    overflow: 'hidden',
    cursor: 'crosshair',
  };

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
      style={containerStyle}
      onClick={handleBarClick}
      onMouseMove={handleBarMouseMove}
      onMouseLeave={() => onDayHover(null, 0)}
    >
      {/* Background grid lines */}
      {timeMarkers.map((m, i) => (
        <div key={i} style={{
          position: 'absolute', left: m.x, top: 0, width: '1px', height: '100%',
          background: 'rgba(255,255,255,0.06)',
        }} />
      ))}

      {/* Time labels */}
      {timeMarkers.map((m, i) => (
        <div key={`label-${i}`} style={{
          position: 'absolute', left: m.x + 3, bottom: 2,
          fontSize: '8px', color: 'rgba(255,255,255,0.3)',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          whiteSpace: 'nowrap', letterSpacing: '0.3px',
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {formatShortDate(m.date)}
        </div>
      ))}

      {/* Density bars */}
      {densityBars.map((bar, i) => {
        const maxBarH = barHeight * 0.6;
        const h = Math.max(2, bar.height * maxBarH);
        const isHovered = bar.dayKey === hoveredDay;
        return (
          <div key={`density-${i}`} style={{
            position: 'absolute',
            left: bar.x - 2,
            bottom: 14,
            width: 4,
            height: h,
            background: isHovered
              ? 'rgba(59,130,246,0.6)'
              : 'rgba(59,130,246,0.25)',
            borderRadius: '1px 1px 0 0',
            transition: 'background 0.1s, height 0.2s',
            pointerEvents: 'none',
          }} />
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

      {/* Current time indicator (pulsing dot) */}
      {nowX >= 0 && nowX <= containerWidth && (
        <div style={{
          position: 'absolute',
          left: nowX - 5,
          top: barHeight / 2 - 5,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#3b82f6',
          boxShadow: '0 0 8px #3b82f6, 0 0 16px rgba(59,130,246,0.4)',
          animation: 'timeline-pulse 2s ease-in-out infinite',
          zIndex: 15,
          pointerEvents: 'none',
        }} />
      )}

      {/* Current time vertical line */}
      {nowX >= 0 && nowX <= containerWidth && (
        <div style={{
          position: 'absolute',
          left: nowX,
          top: 0,
          width: '1px',
          height: '100%',
          background: 'rgba(59,130,246,0.5)',
          pointerEvents: 'none',
          zIndex: 14,
        }} />
      )}

      {/* Expand/collapse toggle */}
      <div
        style={{
          position: 'absolute', right: 6, top: 4,
          cursor: 'pointer', fontSize: '9px',
          color: 'rgba(255,255,255,0.3)',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          userSelect: 'none', zIndex: 30,
          transition: 'color 0.15s',
        }}
        onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
      >
        {expanded ? '\u25BC collapse' : '\u25B2 expand'}
      </div>
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
  const playIntervalRef = useRef(null);

  // Compute time range based on zoom level
  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - zoomLevel);
    return { rangeStart: start, rangeEnd: end };
  }, [zoomLevel]);

  // Filter events to those within the visible range
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    const start = rangeStart.getTime();
    const end = rangeEnd.getTime();
    return events.filter((ev) => {
      const t = new Date(ev.date).getTime();
      return t >= start && t <= end;
    });
  }, [events, rangeStart, rangeEnd]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const groups = {};
    for (const ev of filteredEvents) {
      const dayKey = new Date(ev.date).toISOString().slice(0, 10);
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(ev);
    }
    return groups;
  }, [filteredEvents]);

  // Events for the hovered day (for MiniEventList)
  const hoveredDayEvents = useMemo(() => {
    if (!hoveredDay || !eventsByDay[hoveredDay]) return [];
    return eventsByDay[hoveredDay];
  }, [hoveredDay, eventsByDay]);

  // Handle time selection
  const handleTimeSelect = useCallback((date) => {
    setSelectedDate(date);
    setIsLive(false);
    if (onTimeSelect) onTimeSelect(date);
  }, [onTimeSelect]);

  // Handle event click
  const handleEventClick = useCallback((event) => {
    if (onEventClick) onEventClick(event);
  }, [onEventClick]);

  // Handle zoom change
  const handleZoomChange = useCallback((days) => {
    setZoomLevel(days);
  }, []);

  // Handle play/pause
  const handlePlayToggle = useCallback(() => {
    setIsPlaying((prev) => !prev);
    setIsLive(false);
  }, []);

  // Handle live toggle
  const handleLiveToggle = useCallback(() => {
    setIsLive((prev) => {
      if (!prev) {
        setIsPlaying(false);
        setSelectedDate(null);
      }
      return !prev;
    });
  }, []);

  // Handle day hover
  const handleDayHover = useCallback((dayKey, clientX) => {
    setHoveredDay(dayKey);
    setHoveredDayX(clientX);
  }, []);

  // Auto-play: scroll through time by advancing selectedDate
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

  // Live mode: snap to current time every 30s
  useEffect(() => {
    if (!isLive) return;
    setSelectedDate(null);
    const id = setInterval(() => {
      setSelectedDate(null);
    }, 30000);
    return () => clearInterval(id);
  }, [isLive]);

  // ── Styles ──
  const wrapperStyle = {
    position: 'fixed',
    bottom: '28px', // above GlobalStatusBar
    left: 'var(--sidebar-width, 400px)',
    right: 0,
    zIndex: 9998,
    height: expanded ? '160px' : '90px',
    background: 'rgba(10,12,18,0.97)',
    borderTop: '1px solid rgba(59,130,246,0.25)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    backdropFilter: 'blur(16px)',
    transition: 'height 0.25s ease, left 0.3s ease',
    userSelect: 'none',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
  };

  const topRowStyle = {
    display: 'flex',
    alignItems: 'center',
    height: '28px',
    flexShrink: 0,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  };

  const titleStyle = {
    padding: '0 12px',
    fontSize: '10px',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 600,
  };

  const countBadgeStyle = {
    background: 'rgba(59,130,246,0.2)',
    color: '#93bbfc',
    borderRadius: '3px',
    padding: '0 4px',
    fontSize: '9px',
    fontWeight: 600,
  };

  const barContainerStyle = {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <div style={wrapperStyle} className="timeline-navigator">
      {/* Top row: label + controls */}
      <div style={topRowStyle}>
        <div style={titleStyle}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          TIMELINE
          <span style={countBadgeStyle}>{filteredEvents.length}</span>
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
      </div>

      {/* Timeline bar area */}
      <div style={barContainerStyle}>
        <TimelineBar
          events={filteredEvents}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onTimeSelect={handleTimeSelect}
          onEventClick={handleEventClick}
          eventsByDay={eventsByDay}
          expanded={expanded}
          onToggleExpand={() => setExpanded((prev) => !prev)}
          onDayHover={handleDayHover}
          hoveredDay={hoveredDay}
        />

        {/* Mini event list popup on hover */}
        <MiniEventList
          events={hoveredDayEvents}
          visible={hoveredDay !== null && hoveredDayEvents.length > 0}
          onEventClick={handleEventClick}
          positionX={hoveredDayX}
        />
      </div>

      {/* Selected date indicator line */}
      {selectedDate && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%)',
          opacity: 0.6,
          pointerEvents: 'none',
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
