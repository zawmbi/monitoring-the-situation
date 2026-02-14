import { useState } from 'react';
import { timeAgo } from '../../utils/time';

const SEVERITY_COLORS = {
  critical: '#ff4444',
  high: '#ff8c00',
  moderate: '#ffd700',
  low: '#4ecdc4',
};

export function DisasterPanel({ data, loading, onRefresh, onEventClick }) {
  const [filter, setFilter] = useState('all');

  if (loading && !data) {
    return <div className="panel-loading">Loading disaster data...</div>;
  }
  if (!data) return <div className="panel-empty">No disaster data available</div>;

  const events = data.activeEvents || [];
  const filtered = filter === 'all' ? events : events.filter(e => e.severity === filter);

  return (
    <div className="disaster-panel">
      <div className="dp-summary">
        <div className="dp-stat">
          <span className="dp-stat-value">{data.summary?.totalActive || 0}</span>
          <span className="dp-stat-label">Active Events</span>
        </div>
        {Object.entries(data.summary?.bySeverity || {}).map(([sev, count]) => (
          <div key={sev} className="dp-stat">
            <span className="dp-stat-value" style={{ color: SEVERITY_COLORS[sev] }}>{count}</span>
            <span className="dp-stat-label">{sev}</span>
          </div>
        ))}
      </div>

      <div className="dp-filters">
        {['all', 'critical', 'high', 'moderate', 'low'].map(f => (
          <button key={f} className={`dp-filter-btn${filter === f ? ' active' : ''}`}
            style={filter === f && f !== 'all' ? { borderColor: SEVERITY_COLORS[f] } : {}}
            onClick={() => setFilter(f)}>{f}</button>
        ))}
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh">↻</button>
      </div>

      <div className="dp-events">
        {filtered.map(event => (
          <div key={event.id} className="dp-event"
            onClick={() => onEventClick?.(event)}
            style={{ borderLeft: `3px solid ${SEVERITY_COLORS[event.severity] || '#666'}` }}>
            <div className="dp-event-header">
              <span className="dp-event-icon">{event.icon}</span>
              <span className="dp-event-category">{event.categoryLabel}</span>
              <span className="dp-event-severity" style={{ color: SEVERITY_COLORS[event.severity] }}>
                {event.severity}
              </span>
            </div>
            <div className="dp-event-title">{event.title}</div>
            <div className="dp-event-meta">
              {event.date && <span>{timeAgo(event.date)}</span>}
              <span className="dp-event-source">{event.source}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="dp-empty">No events matching filter</div>
        )}
      </div>

      {data.recentDisasters?.length > 0 && (
        <div className="dp-section">
          <div className="dp-section-title">Recent Major Disasters (ReliefWeb)</div>
          {data.recentDisasters.slice(0, 8).map(d => (
            <a key={d.id} className="dp-relief-item" href={d.url} target="_blank" rel="noopener noreferrer">
              <div className="dp-relief-title">{d.title}</div>
              <div className="dp-relief-meta">
                {d.countries?.join(', ')} · {d.type?.join(', ')}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
