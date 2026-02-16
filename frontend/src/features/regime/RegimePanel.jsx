/**
 * RegimePanel — Regime Stability & Coup Risk monitoring panel.
 *
 * Displays country regime profiles with dynamic coup risk scores,
 * succession indicators, military role badges, and GDELT/World Bank signals.
 *
 * Accepts { data, loading, onRefresh, onCountryClick } via props (no self-fetching).
 */

import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

/* ── Color constants ── */

const RISK_COLORS = {
  extreme: '#ff0000',
  high: '#ff4444',
  elevated: '#ff8c00',
  moderate: '#ffd700',
  low: '#4ecdc4',
};

const RISK_BG = {
  extreme: 'rgba(255,0,0,0.12)',
  high: 'rgba(255,68,68,0.12)',
  elevated: 'rgba(255,140,0,0.12)',
  moderate: 'rgba(255,215,0,0.12)',
  low: 'rgba(78,205,196,0.12)',
};

const REGIME_TYPE_COLORS = {
  democracy: { color: '#4a9eff', bg: 'rgba(74,158,255,0.12)' },
  hybrid: { color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
  authoritarian: { color: '#ff4444', bg: 'rgba(255,68,68,0.12)' },
  'military-junta': { color: '#8b0000', bg: 'rgba(139,0,0,0.15)' },
  'one-party': { color: '#9b59b6', bg: 'rgba(155,89,182,0.12)' },
  monarchy: { color: '#daa520', bg: 'rgba(218,165,32,0.12)' },
  theocracy: { color: '#ff8c00', bg: 'rgba(255,140,0,0.12)' },
};

const REGIME_TYPE_LABELS = {
  democracy: 'Democracy',
  hybrid: 'Hybrid',
  authoritarian: 'Authoritarian',
  'military-junta': 'Military Junta',
  'one-party': 'One-Party',
  monarchy: 'Monarchy',
  theocracy: 'Theocracy',
};

const SUCCESSION_META = {
  clear: { icon: '\u2714', label: 'Clear', color: '#4ecdc4' },
  unclear: { icon: '?', label: 'Unclear', color: '#ffd700' },
  contested: { icon: '\u26A0', label: 'Contested', color: '#ff4444' },
};

const MILITARY_ROLE_LABELS = {
  'civilian-control': 'Civilian Control',
  'praetorian': 'Praetorian',
  'ruler': 'Military Ruler',
  'moderate-influence': 'Moderate Influence',
};

const RISK_FILTER_OPTIONS = ['all', 'extreme', 'high', 'elevated', 'moderate', 'low'];
const REGIME_FILTER_OPTIONS = ['all', 'democracy', 'hybrid', 'authoritarian', 'military-junta', 'one-party', 'monarchy', 'theocracy'];

/* ── Sub-components ── */

function RegimeSkeleton() {
  return (
    <div className="regime-skeleton" style={{
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          height: 96,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.04)',
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

function RegimeTypeBadge({ type }) {
  const meta = REGIME_TYPE_COLORS[type] || REGIME_TYPE_COLORS.hybrid;
  const label = REGIME_TYPE_LABELS[type] || type;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: meta.color,
      background: meta.bg,
      border: `1px solid ${meta.color}33`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function CoupRiskGauge({ score, level }) {
  const color = RISK_COLORS[level] || RISK_COLORS.low;
  const clampedScore = Math.max(0, Math.min(100, score || 0));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
      <div style={{
        flex: 1,
        height: 8,
        borderRadius: 4,
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${clampedScore}%`,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: 'width 0.6s ease-out',
        }} />
      </div>
      <span style={{
        fontSize: 12,
        fontWeight: 700,
        color,
        minWidth: 28,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {clampedScore}
      </span>
    </div>
  );
}

function SuccessionIndicator({ succession }) {
  const meta = SUCCESSION_META[succession] || SUCCESSION_META.unclear;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 11,
      color: meta.color,
      fontWeight: 500,
    }}>
      <span style={{ fontSize: 13 }}>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

function FactorBreakdown({ factors }) {
  if (!factors || factors.length === 0) return null;
  return (
    <div style={{
      marginTop: 8,
      padding: '6px 0',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      {factors.map((f, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '3px 0',
          fontSize: 11,
          color: 'rgba(255,255,255,0.6)',
        }}>
          <span style={{ flex: 1 }}>
            {f.name}
            {f.detail && (
              <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>
                ({f.detail})
              </span>
            )}
          </span>
          <span style={{
            fontWeight: 600,
            color: f.weight > 15
              ? RISK_COLORS.extreme
              : f.weight > 10
                ? RISK_COLORS.high
                : f.weight > 5
                  ? RISK_COLORS.elevated
                  : 'rgba(255,255,255,0.5)',
            fontVariantNumeric: 'tabular-nums',
            minWidth: 28,
            textAlign: 'right',
          }}>
            +{f.weight}
          </span>
        </div>
      ))}
    </div>
  );
}

function RiskDistribution({ summary }) {
  if (!summary || !summary.total) return null;
  const total = summary.total;
  const segments = [
    { level: 'extreme', count: summary.extreme || 0 },
    { level: 'high', count: summary.high || 0 },
    { level: 'elevated', count: summary.elevated || 0 },
    { level: 'moderate', count: summary.moderate || 0 },
    { level: 'low', count: summary.low || 0 },
  ].filter((s) => s.count > 0);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex',
        height: 14,
        borderRadius: 7,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)',
      }}>
        {segments.map((seg) => (
          <div
            key={seg.level}
            title={`${seg.level}: ${seg.count}`}
            style={{
              width: `${(seg.count / total) * 100}%`,
              background: RISK_COLORS[seg.level],
              transition: 'width 0.4s ease',
              minWidth: seg.count > 0 ? 4 : 0,
            }}
          />
        ))}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        marginTop: 6,
        flexWrap: 'wrap',
      }}>
        {segments.map((seg) => (
          <span key={seg.level} style={{
            fontSize: 10,
            color: RISK_COLORS[seg.level],
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: RISK_COLORS[seg.level],
              display: 'inline-block',
            }} />
            {seg.level} ({seg.count})
          </span>
        ))}
      </div>
    </div>
  );
}

function RegimeCard({ profile, onClick }) {
  const [expanded, setExpanded] = useState(false);
  const risk = profile.coupRisk || {};
  const riskColor = RISK_COLORS[risk.level] || RISK_COLORS.low;
  const signals = profile.stabilitySignals || [];
  const events = profile.recentEvents || [];

  return (
    <button
      type="button"
      onClick={() => onClick?.(profile)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'rgba(255,255,255,0.03)',
        border: 'none',
        borderLeft: `3px solid ${riskColor}`,
        borderRadius: 6,
        padding: '10px 12px',
        cursor: 'pointer',
        color: 'inherit',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
    >
      {/* Top row: country + regime badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>
          {profile.country}
        </span>
        <RegimeTypeBadge type={profile.regimeType} />
      </div>

      {/* Coup risk gauge */}
      <CoupRiskGauge score={risk.score} level={risk.level} />

      {/* Metadata row */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginTop: 6,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          Leader since {profile.leaderSince}
        </span>
        <SuccessionIndicator succession={profile.succession} />
        <span style={{
          fontSize: 11,
          color: profile.militaryRole === 'ruler' || profile.militaryRole === 'praetorian'
            ? '#ff8c00'
            : 'rgba(255,255,255,0.4)',
        }}>
          {MILITARY_ROLE_LABELS[profile.militaryRole] || profile.militaryRole}
        </span>
      </div>

      {/* Signals preview */}
      {signals.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {signals.slice(0, 2).map((sig, i) => (
            <div key={i} style={{
              fontSize: 10,
              color: sig.severity === 'critical'
                ? RISK_COLORS.extreme
                : sig.severity === 'high'
                  ? RISK_COLORS.high
                  : RISK_COLORS.elevated,
              padding: '1px 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {sig.detail}
            </div>
          ))}
        </div>
      )}

      {/* Expand toggle for factors */}
      {risk.factors && risk.factors.length > 0 && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setExpanded(!expanded); } }}
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.35)',
            marginTop: 4,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {expanded ? '\u25BC Hide factors' : '\u25B6 Show factors'}
        </div>
      )}

      {expanded && <FactorBreakdown factors={risk.factors} />}

      {/* Recent events */}
      {expanded && events.length > 0 && (
        <div style={{
          marginTop: 6,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 6,
        }}>
          <div style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.35)',
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            Recent Events
          </div>
          {events.slice(0, 3).map((evt, i) => (
            <div key={i} style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.55)',
              padding: '2px 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {evt.title}
              {evt.source && (
                <span style={{ color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>
                  — {evt.source}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

/* ── Main Panel ── */

export function RegimePanel({ data, loading, onRefresh, onCountryClick }) {
  const [riskFilter, setRiskFilter] = useState('all');
  const [regimeFilter, setRegimeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const profiles = data?.profiles || [];
  const summary = data?.summary || {};

  // Filter and search
  const filteredProfiles = useMemo(() => {
    let result = profiles;

    // Risk level filter
    if (riskFilter !== 'all') {
      result = result.filter((p) => p.coupRisk?.level === riskFilter);
    }

    // Regime type filter
    if (regimeFilter !== 'all') {
      result = result.filter((p) => p.regimeType === regimeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) =>
        p.country.toLowerCase().includes(q) ||
        p.iso2.toLowerCase().includes(q)
      );
    }

    // Sort by coup risk score descending
    return [...result].sort((a, b) => (b.coupRisk?.score || 0) - (a.coupRisk?.score || 0));
  }, [profiles, riskFilter, regimeFilter, searchQuery]);

  if (loading && !data) {
    return (
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            color: '#fff',
            textTransform: 'uppercase',
          }}>
            Regime Stability & Coup Risk
          </span>
        </div>
        <RegimeSkeleton />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            color: '#fff',
            textTransform: 'uppercase',
          }}>
            Regime Stability & Coup Risk
          </span>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#ff0000',
            background: 'rgba(255,0,0,0.15)',
            padding: '2px 6px',
            borderRadius: 3,
            letterSpacing: 0.5,
            animation: 'liveBlink 2s ease-in-out infinite',
          }}>
            LIVE
          </span>
          <style>{`
            @keyframes liveBlink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              color: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
              fontSize: 11,
              padding: '4px 10px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Updating...' : 'Refresh'}
          </button>
        )}
      </div>

      {/* ── Summary row ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <SummaryCell label="Countries" value={summary.total || 0} color="#fff" />
        <SummaryCell label="Extreme" value={summary.extreme || 0} color={RISK_COLORS.extreme} />
        <SummaryCell label="High" value={summary.high || 0} color={RISK_COLORS.high} />
        <SummaryCell label="Avg Score" value={summary.avgScore || 0} color={
          (summary.avgScore || 0) >= 60 ? RISK_COLORS.high
            : (summary.avgScore || 0) >= 40 ? RISK_COLORS.elevated
              : RISK_COLORS.low
        } />
      </div>

      {/* ── Risk distribution bar ── */}
      <div style={{ padding: '10px 16px 0' }}>
        <RiskDistribution summary={summary} />
      </div>

      {/* ── Risk level filter pills ── */}
      <div style={{
        padding: '0 16px 8px',
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
      }}>
        {RISK_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setRiskFilter(opt)}
            style={{
              background: riskFilter === opt
                ? (opt === 'all' ? 'rgba(255,255,255,0.15)' : `${RISK_COLORS[opt]}22`)
                : 'rgba(255,255,255,0.04)',
              border: riskFilter === opt
                ? `1px solid ${opt === 'all' ? 'rgba(255,255,255,0.3)' : RISK_COLORS[opt]}`
                : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              color: riskFilter === opt
                ? (opt === 'all' ? '#fff' : RISK_COLORS[opt])
                : 'rgba(255,255,255,0.5)',
              fontSize: 10,
              fontWeight: 600,
              padding: '3px 10px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.15s',
            }}
          >
            {opt === 'all' ? 'All' : opt}
          </button>
        ))}
      </div>

      {/* ── Regime type filter pills ── */}
      <div style={{
        padding: '0 16px 8px',
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
      }}>
        {REGIME_FILTER_OPTIONS.map((opt) => {
          const meta = REGIME_TYPE_COLORS[opt];
          const isActive = regimeFilter === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setRegimeFilter(opt)}
              style={{
                background: isActive
                  ? (opt === 'all' ? 'rgba(255,255,255,0.15)' : `${meta?.color || '#fff'}22`)
                  : 'rgba(255,255,255,0.04)',
                border: isActive
                  ? `1px solid ${opt === 'all' ? 'rgba(255,255,255,0.3)' : (meta?.color || '#fff')}`
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                color: isActive
                  ? (opt === 'all' ? '#fff' : (meta?.color || '#fff'))
                  : 'rgba(255,255,255,0.5)',
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {opt === 'all' ? 'All Types' : (REGIME_TYPE_LABELS[opt] || opt)}
            </button>
          );
        })}
      </div>

      {/* ── Search input ── */}
      <div style={{ padding: '0 16px 10px' }}>
        <input
          type="text"
          placeholder="Search country..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: '#fff',
            fontSize: 12,
            padding: '6px 10px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── Country cards list ── */}
      <div style={{
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        maxHeight: 480,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {filteredProfiles.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 12,
            padding: 24,
          }}>
            No countries match the current filters.
          </div>
        )}
        {filteredProfiles.map((profile) => (
          <RegimeCard
            key={profile.iso2}
            profile={profile}
            onClick={onCountryClick}
          />
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
      }}>
        <span style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: 0.3,
        }}>
          Sources: GDELT + World Bank + OSINT
        </span>
        {data?.updatedAt && (
          <span style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.25)',
          }}>
            Updated {timeAgo(data.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Helper sub-component ── */

function SummaryCell({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 60 }}>
      <div style={{
        fontSize: 20,
        fontWeight: 700,
        color,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.2,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {label}
      </div>
    </div>
  );
}
