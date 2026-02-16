import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

/* ── colour constants ── */
const TYPE_COLORS = {
  military: '#ef4444',
  economic: '#22c55e',
  political: '#8b5cf6',
  intelligence: '#06b6d4',
};

const SEVERITY_COLORS = {
  critical: '#ff4444',
  high: '#ff8c00',
  elevated: '#ffd700',
  moderate: '#4ecdc4',
  low: '#4a9eff',
};

const TREND_ARROWS = {
  strengthening: { symbol: '\u2191', color: '#22c55e' },
  weakening: { symbol: '\u2193', color: '#ef4444' },
  stable: { symbol: '\u2194', color: '#8899aa' },
  escalating: { symbol: '\u2191', color: '#ef4444' },
  'de-escalating': { symbol: '\u2193', color: '#22c55e' },
};

/* ── AllianceSkeleton: loading placeholder ── */
function AllianceSkeleton() {
  return (
    <div className="alliance-panel" style={{ opacity: 0.5 }}>
      {/* header skeleton */}
      <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 200, height: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
        <div style={{ width: 40, height: 18, background: 'rgba(255,255,255,0.06)', borderRadius: 10 }} />
      </div>
      {/* summary row skeleton */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 14px', justifyContent: 'space-around' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ width: 36, height: 22, background: 'rgba(255,255,255,0.06)', borderRadius: 4, margin: '0 auto 4px' }} />
            <div style={{ width: 60, height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 3, margin: '0 auto' }} />
          </div>
        ))}
      </div>
      {/* tabs skeleton */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 14px' }}>
        {['Alliances', 'Bilateral Tensions'].map(t => (
          <div key={t} style={{ width: 100, height: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12 }} />
        ))}
      </div>
      {/* cards skeleton */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
          borderLeft: '3px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ width: '50%', height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 8 }} />
          <div style={{ width: '70%', height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 3, marginBottom: 6 }} />
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 3 }} />
        </div>
      ))}
    </div>
  );
}

/* ── AllianceTypeBadge ── */
function AllianceTypeBadge({ type }) {
  const color = TYPE_COLORS[type] || '#8899aa';
  return (
    <span style={{
      fontSize: 9,
      padding: '2px 7px',
      borderRadius: 8,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      background: `${color}18`,
      color,
      border: `1px solid ${color}33`,
    }}>
      {type}
    </span>
  );
}

/* ── StrengthGauge: horizontal bar gauge with trend indicator ── */
function StrengthGauge({ score, trend }) {
  const trendData = TREND_ARROWS[trend] || TREND_ARROWS.stable;
  const gaugeColor =
    score >= 80 ? '#22c55e' :
    score >= 60 ? '#4ecdc4' :
    score >= 40 ? '#ffd700' :
    score >= 20 ? '#ff8c00' :
    '#ef4444';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${score}%`, borderRadius: 3,
          background: `linear-gradient(90deg, ${gaugeColor}88, ${gaugeColor})`,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{
        fontSize: 13, fontWeight: 700, color: gaugeColor,
        fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right',
      }}>
        {score}
      </span>
      <span style={{ fontSize: 14, color: trendData.color, lineHeight: 1 }} title={trend}>
        {trendData.symbol}
      </span>
    </div>
  );
}

/* ── MemberList: compact member country display ── */
function MemberList({ members }) {
  const [expanded, setExpanded] = useState(false);
  const visibleMembers = expanded ? members : members.slice(0, 8);
  const remaining = members.length - 8;

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {visibleMembers.map(m => (
          <span key={m.iso2} style={{
            fontSize: 9,
            padding: '1px 5px',
            borderRadius: 4,
            background: m.role === 'leader' || m.role === 'core' || m.role === 'founding'
              ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            color: m.role === 'leader' || m.role === 'core' || m.role === 'founding'
              ? '#c0cad8' : '#8899aa',
            border: '1px solid rgba(255,255,255,0.06)',
            fontWeight: m.role === 'leader' ? 700 : 400,
          }}
          title={`${m.country} (${m.role})`}>
            {m.iso2}
          </span>
        ))}
        {!expanded && remaining > 0 && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 4,
              background: 'rgba(74,158,255,0.1)', color: '#4a9eff',
              border: '1px solid rgba(74,158,255,0.2)', cursor: 'pointer',
            }}
          >
            +{remaining} more
          </button>
        )}
        {expanded && remaining > 0 && (
          <button
            onClick={() => setExpanded(false)}
            style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 4,
              background: 'rgba(255,255,255,0.04)', color: '#8899aa',
              border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
            }}
          >
            show less
          </button>
        )}
      </div>
    </div>
  );
}

/* ── AllianceCard ── */
function AllianceCard({ alliance }) {
  const a = alliance;
  const strength = a.strength || {};
  const signals = strength.signals || [];

  return (
    <div style={{
      padding: '10px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      borderLeft: `3px solid ${a.color || '#8899aa'}`,
    }}>
      {/* header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #e0e8f0)' }}>
              {a.name}
            </span>
            <AllianceTypeBadge type={a.type} />
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#8899aa' }}>
            <span>Founded {a.founded}</span>
            <span>{a.memberCount} members</span>
            {a.hq && <span>{a.hq}</span>}
          </div>
        </div>
      </div>

      {/* strength gauge */}
      <div style={{ margin: '8px 0 6px' }}>
        <div style={{ fontSize: 9, color: '#667788', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
          Cohesion Strength
        </div>
        <StrengthGauge score={strength.score || 0} trend={strength.trend || 'stable'} />
      </div>

      {/* signals */}
      {signals.length > 0 && (
        <div style={{ marginTop: 4 }}>
          {signals.slice(0, 3).map((signal, idx) => (
            <div key={idx} style={{
              fontSize: 10, color: '#8899aa', paddingLeft: 8,
              borderLeft: '2px solid rgba(255,255,255,0.06)', marginBottom: 2, lineHeight: 1.4,
            }}>
              {signal}
            </div>
          ))}
        </div>
      )}

      {/* member list */}
      <MemberList members={a.members || []} />
    </div>
  );
}

/* ── TensionCard ── */
function TensionCard({ tension }) {
  const t = tension;
  const severityColor = SEVERITY_COLORS[t.severity] || '#8899aa';
  const trendData = TREND_ARROWS[t.trend] || TREND_ARROWS.stable;

  return (
    <div style={{
      padding: '10px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      borderLeft: `3px solid ${severityColor}`,
    }}>
      {/* country pair header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 6px',
            background: 'rgba(255,255,255,0.06)', borderRadius: 4,
            color: 'var(--text-primary, #e0e8f0)',
          }}>
            {t.pair[0]}
          </span>
          <span style={{ fontSize: 10, color: '#556677' }}>vs</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 6px',
            background: 'rgba(255,255,255,0.06)', borderRadius: 4,
            color: 'var(--text-primary, #e0e8f0)',
          }}>
            {t.pair[1]}
          </span>
          <span style={{ fontSize: 11, color: '#8899aa' }}>
            {t.names[0]} - {t.names[1]}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: severityColor,
          }}>
            {t.currentTension}
          </span>
          <span style={{ fontSize: 14, color: trendData.color }} title={t.trend}>
            {trendData.symbol}
          </span>
        </div>
      </div>

      {/* tension bar */}
      <div style={{
        height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden', marginBottom: 6,
      }}>
        <div style={{
          height: '100%', width: `${t.currentTension}%`, borderRadius: 3,
          background: `linear-gradient(90deg, ${severityColor}66, ${severityColor})`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* severity badge and trend */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
        <span style={{
          fontSize: 9, padding: '1px 6px', borderRadius: 8, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.4,
          background: `${severityColor}18`, color: severityColor,
          border: `1px solid ${severityColor}33`,
        }}>
          {t.severity}
        </span>
        <span style={{
          fontSize: 9, padding: '1px 6px', borderRadius: 8, fontWeight: 600,
          color: trendData.color,
          background: `${trendData.color}18`,
          border: `1px solid ${trendData.color}33`,
        }}>
          {t.trend}
        </span>
        {t.gdelt && t.gdelt.articleCount > 0 && (
          <span style={{ fontSize: 9, color: '#667788' }}>
            {t.gdelt.articleCount} articles | tone: {t.gdelt.avgTone > 0 ? '+' : ''}{t.gdelt.avgTone}
          </span>
        )}
      </div>

      {/* issues list */}
      {t.issues && t.issues.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {t.issues.map((issue, idx) => (
            <span key={idx} style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 4,
              background: 'rgba(255,255,255,0.04)', color: '#8899aa',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {issue}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── TensionMatrix: compact visual grid of bilateral tensions ── */
function TensionMatrix({ tensions }) {
  if (!tensions || tensions.length === 0) return null;

  const sorted = [...tensions].sort((a, b) => b.currentTension - a.currentTension);
  const top = sorted.slice(0, 8);

  return (
    <div style={{ padding: '8px 14px' }}>
      <div style={{
        fontSize: 9, color: '#8899aa', textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: 6,
      }}>
        Tension Heatmap (Top 8)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {top.map(t => {
          const color = SEVERITY_COLORS[t.severity] || '#8899aa';
          const opacity = Math.max(0.2, t.currentTension / 100);
          return (
            <div key={t.id} style={{
              padding: '6px 4px', borderRadius: 4, textAlign: 'center',
              background: `${color}${Math.round(opacity * 40).toString(16).padStart(2, '0')}`,
              border: `1px solid ${color}33`,
            }}>
              <div style={{ fontSize: 9, fontWeight: 600, color, lineHeight: 1.2 }}>
                {t.pair[0]}-{t.pair[1]}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color, marginTop: 2 }}>
                {t.currentTension}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── MAIN PANEL ── */
const TABS = ['Alliances', 'Bilateral Tensions'];
const TYPE_FILTERS = ['all', 'military', 'economic', 'political', 'intelligence'];

export function AlliancePanel({ data, loading, onRefresh }) {
  const [tab, setTab] = useState('Alliances');
  const [typeFilter, setTypeFilter] = useState('all');

  const alliances = data?.alliances || [];
  const bilateralTensions = data?.bilateralTensions || [];
  const summary = data?.summary || {};

  const filteredAlliances = useMemo(() => {
    if (typeFilter === 'all') return alliances;
    return alliances.filter(a => a.type === typeFilter);
  }, [alliances, typeFilter]);

  const sortedTensions = useMemo(() =>
    [...bilateralTensions].sort((a, b) => b.currentTension - a.currentTension),
    [bilateralTensions]
  );

  if (loading && !data) return <AllianceSkeleton />;
  if (!data) return <div className="panel-empty">No alliance data available</div>;

  return (
    <div className="alliance-panel">
      {/* ── Header ── */}
      <div style={{
        padding: '10px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
            textTransform: 'uppercase', color: 'var(--text-primary, #e0e8f0)',
          }}>
            Alliance Network Analysis
          </span>
          <span style={{
            fontSize: 8, padding: '2px 6px', borderRadius: 8,
            background: 'rgba(239,68,68,0.15)', color: '#ef4444',
            fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
            animation: 'pulse 2s infinite',
          }}>
            LIVE
          </span>
        </div>
        <button
          className="dp-refresh-btn"
          onClick={onRefresh}
          title="Refresh"
          style={{
            background: 'none', border: 'none', color: '#8899aa',
            cursor: 'pointer', fontSize: 14, padding: '2px 6px',
          }}
        >
          \u21BB
        </button>
      </div>

      {/* ── Summary stats row ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-around', padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#4a9eff', fontVariantNumeric: 'tabular-nums' }}>
            {summary.totalAlliances || 0}
          </div>
          <div style={{ fontSize: 9, color: '#8899aa', textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Alliances
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            color: (summary.avgStrength || 0) >= 60 ? '#22c55e' : (summary.avgStrength || 0) >= 40 ? '#ffd700' : '#ef4444',
          }}>
            {summary.avgStrength || 0}
          </div>
          <div style={{ fontSize: 9, color: '#8899aa', textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Avg Strength
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#ff4444', fontVariantNumeric: 'tabular-nums' }}>
            {summary.criticalTensions || 0}
          </div>
          <div style={{ fontSize: 9, color: '#8899aa', textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Critical Tensions
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#ff8c00', fontVariantNumeric: 'tabular-nums' }}>
            {summary.activeDisputes || 0}
          </div>
          <div style={{ fontSize: 9, color: '#8899aa', textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Active Disputes
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 4, padding: '8px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        alignItems: 'center',
      }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontSize: 10, padding: '4px 12px', borderRadius: 12,
              border: '1px solid',
              borderColor: tab === t ? 'rgba(74,158,255,0.3)' : 'rgba(255,255,255,0.08)',
              background: tab === t ? 'rgba(74,158,255,0.12)' : 'transparent',
              color: tab === t ? '#4a9eff' : '#8899aa',
              cursor: 'pointer', fontWeight: tab === t ? 600 : 400,
              transition: 'all 0.2s ease',
            }}
          >
            {t}
            {t === 'Alliances' && (
              <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>({alliances.length})</span>
            )}
            {t === 'Bilateral Tensions' && (
              <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>({bilateralTensions.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Alliances tab ── */}
      {tab === 'Alliances' && (
        <div>
          {/* type filter */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 14px', flexWrap: 'wrap' }}>
            {TYPE_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                style={{
                  fontSize: 9, padding: '2px 8px', borderRadius: 8,
                  border: '1px solid',
                  borderColor: typeFilter === f
                    ? `${TYPE_COLORS[f] || '#4a9eff'}44`
                    : 'rgba(255,255,255,0.06)',
                  background: typeFilter === f
                    ? `${TYPE_COLORS[f] || '#4a9eff'}18`
                    : 'transparent',
                  color: typeFilter === f
                    ? (TYPE_COLORS[f] || '#4a9eff')
                    : '#667788',
                  cursor: 'pointer', textTransform: 'capitalize',
                  fontWeight: typeFilter === f ? 600 : 400,
                  transition: 'all 0.2s ease',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* alliance cards list */}
          <div className="ap-list">
            {filteredAlliances.length === 0 && (
              <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>
                No alliances match the selected filter.
              </div>
            )}
            {filteredAlliances.map(a => (
              <AllianceCard key={a.id} alliance={a} />
            ))}
          </div>
        </div>
      )}

      {/* ── Bilateral Tensions tab ── */}
      {tab === 'Bilateral Tensions' && (
        <div>
          {/* tension matrix heatmap */}
          <TensionMatrix tensions={bilateralTensions} />

          {/* tension cards */}
          <div className="ap-list">
            {sortedTensions.length === 0 && (
              <div style={{ padding: 16, color: '#8899aa', fontSize: 12 }}>
                No bilateral tension data available.
              </div>
            )}
            {sortedTensions.map(t => (
              <TensionCard key={t.id} tension={t} />
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 9, color: '#556677', letterSpacing: 0.3,
      }}>
        <span>Sources: GDELT + OSINT Analysis</span>
        {data.updatedAt && <span>Updated {timeAgo(data.updatedAt)}</span>}
      </div>
    </div>
  );
}
