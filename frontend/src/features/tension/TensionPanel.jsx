import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

/* ── colour maps ── */
const TENSION_COLORS = {
  Critical: '#ff4444',
  High:     '#ff8c00',
  Elevated: '#ffd700',
  Guarded:  '#4ecdc4',
  Low:      '#4a9eff',
};

const ESCALATION_COLORS = {
  critical: '#ff4444',
  high:     '#ff8c00',
  elevated: '#ffd700',
  moderate: '#4ecdc4',
  low:      '#4a9eff',
};

function escalationColor(e) {
  return ESCALATION_COLORS[e] || '#8899aa';
}

/* ── TensionGauge: large SVG arc meter ── */
function TensionGauge({ index, label }) {
  const value = Math.max(0, Math.min(100, index || 0));
  const color = value >= 80 ? '#ff4444' : value >= 60 ? '#ff8c00' : value >= 40 ? '#ffd700' : value >= 20 ? '#4ecdc4' : '#4a9eff';

  /* SVG arc geometry */
  const cx = 100, cy = 90, r = 70;
  const startAngle = Math.PI;       // 180 degrees
  const endAngle   = 0;             // 0 degrees
  const sweepAngle = startAngle - (startAngle - endAngle) * (value / 100);
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy - r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(sweepAngle);
  const y2 = cy - r * Math.sin(sweepAngle);
  const largeArc = value > 50 ? 1 : 0;

  /* gradient stops for track */
  const gradientId = 'tensionGrad';

  return (
    <div style={{ textAlign: 'center', padding: '12px 12px 4px' }}>
      <div style={{ fontSize: 9, letterSpacing: 1, color: '#8899aa', textTransform: 'uppercase', marginBottom: 4 }}>
        Global Tension Index
      </div>
      <svg viewBox="0 0 200 110" style={{ width: 200, height: 110, display: 'block', margin: '0 auto' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#4a9eff" />
            <stop offset="25%"  stopColor="#4ecdc4" />
            <stop offset="50%"  stopColor="#ffd700" />
            <stop offset="75%"  stopColor="#ff8c00" />
            <stop offset="100%" stopColor="#ff4444" />
          </linearGradient>
        </defs>
        {/* track background */}
        <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
        {/* filled arc */}
        {value > 0 && (
          <path d={`M ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2}`}
            fill="none" stroke={`url(#${gradientId})`} strokeWidth="10" strokeLinecap="round" />
        )}
        {/* value text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="28" fontWeight="700" fill={color}>
          {value}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="10" fill="#8899aa">/100</text>
        {/* low/high labels */}
        <text x={cx - r - 4} y={cy + 14} textAnchor="middle" fontSize="7" fill="#4a9eff">LOW</text>
        <text x={cx + r + 4} y={cy + 14} textAnchor="middle" fontSize="7" fill="#ff4444">HIGH</text>
      </svg>
      <div style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: 0.5, marginTop: 2 }}>
        {label || '—'}
      </div>
    </div>
  );
}

/* ── Live signal indicators ── */
function LiveSignals({ conflict }) {
  const signals = [];
  if (conflict.ucdpEvents != null) {
    signals.push({ label: 'UCDP', value: conflict.ucdpEvents, color: '#ef4444' });
  }
  if (conflict.gdeltArticles != null) {
    signals.push({ label: 'GDELT', value: conflict.gdeltArticles, color: '#3b82f6' });
  }
  if (conflict.stabilityScore != null) {
    signals.push({ label: 'Stability', value: conflict.stabilityScore, color: '#f59e0b' });
  }
  if (signals.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
      {signals.map(s => (
        <span key={s.label} style={{ fontSize: 9, color: s.color, display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
          {s.label}: {s.value}
        </span>
      ))}
    </div>
  );
}

/* ── ConflictCard ── */
function ConflictCard({ conflict }) {
  const c = conflict;
  const intColor = c.intensity >= 80 ? '#ff4444' : c.intensity >= 60 ? '#ff8c00' : c.intensity >= 40 ? '#ffd700' : '#4ecdc4';

  return (
    <div className="tp-conflict"
      style={{
        padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)',
        borderLeft: `3px solid ${intColor}`,
      }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #e0e8f0)' }}>{c.name}</span>
        <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: intColor }}>
          {c.intensity}
        </span>
      </div>

      {/* meta row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#8899aa' }}>{c.type}</span>
        <span style={{ fontSize: 10, color: '#667788' }}>{c.region}</span>
        {/* escalation badge */}
        <span style={{
          fontSize: 9, padding: '1px 6px', borderRadius: 8, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.4,
          background: `${escalationColor(c.escalationRisk)}18`,
          color: escalationColor(c.escalationRisk),
          border: `1px solid ${escalationColor(c.escalationRisk)}33`,
        }}>
          {c.escalationRisk || 'unknown'} escalation
        </span>
        {/* nuclear badge */}
        {c.nuclearRisk && c.nuclearRisk !== 'none' && (
          <span style={{
            fontSize: 9, padding: '1px 6px', borderRadius: 8, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 0.4,
            background: 'rgba(255,136,0,0.15)', color: '#ff8c00',
            border: '1px solid rgba(255,136,0,0.3)',
          }}>
            NUCLEAR: {c.nuclearRisk}
          </span>
        )}
      </div>

      {/* parties */}
      {c.parties && c.parties.length > 0 && (
        <div style={{ fontSize: 11, color: '#8899aa', marginBottom: 4 }}>
          {c.parties.join(' vs ')}
        </div>
      )}

      {/* intensity bar */}
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 2 }}>
        <div style={{
          height: '100%', width: `${c.intensity}%`, borderRadius: 2,
          background: `linear-gradient(90deg, ${intColor}88, ${intColor})`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* live signals */}
      <LiveSignals conflict={c} />
    </div>
  );
}

/* ── FlashpointCard ── */
function FlashpointCard({ flashpoint }) {
  const f = flashpoint;
  const eColor = escalationColor(f.escalationRisk);

  return (
    <div className="tp-flashpoint"
      style={{
        padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)',
        borderLeft: `3px solid ${eColor}`,
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #e0e8f0)' }}>{f.name}</span>
        <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: eColor }}>{f.tension}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#8899aa' }}>{f.category}</span>
        <span style={{
          fontSize: 9, padding: '1px 6px', borderRadius: 8, fontWeight: 600,
          textTransform: 'uppercase', background: `${eColor}18`, color: eColor,
          border: `1px solid ${eColor}33`,
        }}>
          {f.escalationRisk}
        </span>
        {f.nuclear && (
          <span style={{
            fontSize: 9, padding: '1px 6px', borderRadius: 8, fontWeight: 700,
            textTransform: 'uppercase', background: 'rgba(255,68,68,0.15)',
            color: '#ff4444', border: '1px solid rgba(255,68,68,0.3)',
          }}>
            NUCLEAR
          </span>
        )}
      </div>
      {f.parties && f.parties.length > 0 && (
        <div style={{ fontSize: 11, color: '#8899aa' }}>{f.parties.join(', ')}</div>
      )}
    </div>
  );
}

/* ── Timeline entry ── */
function TimelineEntry({ entry }) {
  return (
    <div style={{
      padding: '8px 12px 8px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
      borderLeft: '2px solid rgba(255,255,255,0.08)', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: -5, top: 12, width: 8, height: 8,
        borderRadius: '50%', background: escalationColor(entry.escalation || 'moderate'),
      }} />
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #e0e8f0)', marginBottom: 2 }}>
        {entry.title || entry.name}
      </div>
      <div style={{ fontSize: 10, color: '#8899aa', display: 'flex', gap: 8 }}>
        {entry.date && <span>{timeAgo(entry.date)}</span>}
        {entry.change && (
          <span style={{ color: entry.change === 'escalated' ? '#ff4444' : entry.change === 'de-escalated' ? '#4ecdc4' : '#ffd700' }}>
            {entry.change}
          </span>
        )}
        {entry.region && <span>{entry.region}</span>}
      </div>
      {entry.description && (
        <div style={{ fontSize: 11, color: '#667788', marginTop: 2, lineHeight: 1.4 }}>{entry.description}</div>
      )}
    </div>
  );
}

/* ── Loading skeleton ── */
function TensionSkeleton() {
  return (
    <div className="tension-panel" style={{ opacity: 0.5 }}>
      <div style={{ textAlign: 'center', padding: 16 }}>
        <div style={{ width: 160, height: 90, margin: '0 auto', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
      </div>
      <div className="tp-stats">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="tp-stat">
            <span className="tp-stat-value" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, display: 'inline-block', width: 28, height: 20 }}>&nbsp;</span>
            <span className="tp-stat-label" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 3, display: 'inline-block', width: 52, height: 10, marginTop: 4 }}>&nbsp;</span>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, display: 'flex', gap: 6 }}>
        {['Overview', 'Conflicts', 'Flashpoints', 'Timeline'].map(t => (
          <span key={t} style={{ display: 'inline-block', width: 64, height: 22, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: '3px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: '55%', height: 13, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 8 }} />
          <div style={{ width: '80%', height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 3, marginBottom: 4 }} />
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }} />
        </div>
      ))}
    </div>
  );
}

/* ── MAIN PANEL ── */
const TABS = ['Overview', 'Active Conflicts', 'Flashpoints', 'Timeline'];

export function TensionPanel({ data, loading, onRefresh }) {
  const [tab, setTab] = useState('Overview');

  const conflicts = data?.activeConflicts || [];
  const flashpoints = data?.flashpoints || [];
  const timeline = data?.timeline || [];
  const summary = data?.summary || {};

  const highEscalation = useMemo(() =>
    conflicts.filter(c => c.escalationRisk === 'critical' || c.escalationRisk === 'high').length,
    [conflicts]
  );

  const tabCounts = {
    'Active Conflicts': conflicts.length,
    Flashpoints: flashpoints.length,
    Timeline: timeline.length,
  };

  if (loading && !data) return <TensionSkeleton />;
  if (!data) return <div className="panel-empty">No tension data available</div>;

  return (
    <div className="tension-panel">
      {/* ── Gauge (always visible) ── */}
      <TensionGauge index={data.index} label={data.label} />

      {/* ── Summary stats ── */}
      <div className="tp-stats">
        <div className="tp-stat">
          <span className="tp-stat-value">{summary.totalConflicts || conflicts.length}</span>
          <span className="tp-stat-label">Active Conflicts</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat-value">{summary.totalFlashpoints || flashpoints.length}</span>
          <span className="tp-stat-label">Flashpoints</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat-value" style={{ color: '#ff4444' }}>{summary.criticalConflicts || 0}</span>
          <span className="tp-stat-label">Critical</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat-value" style={{ color: '#ff8c00' }}>{summary.nuclearFlashpoints || 0}</span>
          <span className="tp-stat-label">Nuclear Risk</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat-value" style={{ color: '#ffd700' }}>{highEscalation}</span>
          <span className="tp-stat-label">High Escalation</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tp-tabs">
        {TABS.map(t => (
          <button key={t} className={`tp-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
            {tabCounts[t] > 0 && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>({tabCounts[t]})</span>}
          </button>
        ))}
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh" style={{ marginLeft: 'auto' }}>↻</button>
      </div>

      {/* ── Overview tab ── */}
      {tab === 'Overview' && (
        <div style={{ padding: '8px 0' }}>
          {/* top conflicts preview */}
          <div style={{ padding: '4px 12px 6px', fontSize: 10, color: '#8899aa', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Highest Intensity Conflicts
          </div>
          {conflicts.slice(0, 3).map(c => <ConflictCard key={c.id || c.name} conflict={c} />)}
          {flashpoints.length > 0 && (
            <>
              <div style={{ padding: '10px 12px 6px', fontSize: 10, color: '#8899aa', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Key Flashpoints
              </div>
              {flashpoints.slice(0, 3).map(f => <FlashpointCard key={f.id || f.name} flashpoint={f} />)}
            </>
          )}
        </div>
      )}

      {/* ── Active Conflicts tab ── */}
      {tab === 'Active Conflicts' && (
        <div className="tp-list">
          {conflicts.length === 0 && (
            <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>No active conflicts data.</div>
          )}
          {conflicts.map(c => <ConflictCard key={c.id || c.name} conflict={c} />)}
        </div>
      )}

      {/* ── Flashpoints tab ── */}
      {tab === 'Flashpoints' && (
        <div className="tp-list">
          {flashpoints.length === 0 && (
            <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>No flashpoint data.</div>
          )}
          {flashpoints.map(f => <FlashpointCard key={f.id || f.name} flashpoint={f} />)}
        </div>
      )}

      {/* ── Timeline tab ── */}
      {tab === 'Timeline' && (
        <div style={{ padding: '4px 0' }}>
          {timeline.length === 0 && (
            <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>No recent escalation changes recorded.</div>
          )}
          {timeline.map((entry, i) => <TimelineEntry key={i} entry={entry} />)}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 9, color: '#556677', letterSpacing: 0.3,
      }}>
        <span>Sources: UCDP + GDELT + Stability OSINT</span>
        {data.updatedAt && <span>Updated {timeAgo(data.updatedAt)}</span>}
      </div>
    </div>
  );
}
