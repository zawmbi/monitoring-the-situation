/**
 * LeadershipPanel — Rich intelligence panel displaying world leader profiles,
 * influence rankings, media visibility, and leadership change alerts.
 *
 * Sub-components:
 *   LeaderSkeleton, IdeologyBadge, StyleBadge, InfluenceGauge,
 *   NuclearIndicator, LeaderCard, ChangeAlertCard, PowerRankingTable
 *
 * Data source: leadershipService via useLeadership hook
 */

import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'rankings', label: 'Power Rankings' },
  { id: 'alerts', label: 'Change Alerts' },
  { id: 'leaders', label: 'All Leaders' },
];

const IDEOLOGY_COLORS = {
  'far-left': '#dc2626',
  'left': '#ef4444',
  'center-left': '#f59e0b',
  'center': '#8899aa',
  'center-right': '#3b82f6',
  'right': '#2563eb',
  'far-right': '#1d4ed8',
  'non-partisan': '#6b7280',
};

const IDEOLOGY_LABELS = {
  'far-left': 'Far Left',
  'left': 'Left',
  'center-left': 'Center-Left',
  'center': 'Center',
  'center-right': 'Center-Right',
  'right': 'Right',
  'far-right': 'Far Right',
  'non-partisan': 'Non-Partisan',
};

const STYLE_COLORS = {
  strongman: '#991b1b',
  technocrat: '#1e40af',
  populist: '#d97706',
  diplomat: '#047857',
  reformer: '#7c3aed',
  caretaker: '#6b7280',
};

const STYLE_LABELS = {
  strongman: 'Strongman',
  technocrat: 'Technocrat',
  populist: 'Populist',
  diplomat: 'Diplomat',
  reformer: 'Reformer',
  caretaker: 'Caretaker',
};

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  elevated: '#d97706',
  moderate: '#ca8a04',
  low: '#65a30d',
};

const CHANGE_TYPE_LABELS = {
  'coup': 'Coup Risk',
  'impeachment': 'Impeachment',
  'resignation': 'Resignation',
  'assassination': 'Assassination Risk',
  'election': 'Election',
  'health': 'Health Concern',
  'succession': 'Succession',
  'term-limit': 'Term Limit',
  'political-instability': 'Instability',
};

const REGIONS = [
  'All Regions',
  'North America',
  'Europe',
  'Russia & Central Asia',
  'East Asia',
  'South & Southeast Asia',
  'Middle East',
  'Africa',
  'South America',
  'Oceania',
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function LeaderSkeleton() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px',
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          height: '72px', borderRadius: '8px',
          background: 'linear-gradient(90deg, #1a1f2e 25%, #242938 50%, #1a1f2e 75%)',
          backgroundSize: '200% 100%',
          animation: 'ldship-shimmer 1.5s ease-in-out infinite',
        }} />
      ))}
      <style>{`
        @keyframes ldship-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function IdeologyBadge({ ideology }) {
  const color = IDEOLOGY_COLORS[ideology] || IDEOLOGY_COLORS.center;
  const label = IDEOLOGY_LABELS[ideology] || ideology;

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.3px',
      color: '#fff',
      background: color,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function StyleBadge({ style }) {
  const color = STYLE_COLORS[style] || STYLE_COLORS.caretaker;
  const label = STYLE_LABELS[style] || style;

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.3px',
      color,
      border: `1px solid ${color}`,
      background: 'transparent',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function InfluenceGauge({ score, rank }) {
  const percentage = Math.min(100, Math.max(0, score));
  const gaugeColor = percentage >= 75 ? '#dc2626'
    : percentage >= 50 ? '#d97706'
    : percentage >= 25 ? '#3b82f6'
    : '#6b7280';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
      <div style={{
        position: 'relative', width: '36px', height: '36px',
      }}>
        <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="18" cy="18" r="15.5"
            fill="none" stroke="#2a2f3e" strokeWidth="3"
          />
          <circle
            cx="18" cy="18" r="15.5"
            fill="none" stroke={gaugeColor} strokeWidth="3"
            strokeDasharray={`${percentage * 0.975} 100`}
            strokeLinecap="round"
          />
        </svg>
        <span style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '10px', fontWeight: 700, color: '#e2e8f0',
        }}>
          {score}
        </span>
      </div>
      {rank && (
        <span style={{
          fontSize: '11px', color: '#94a3b8', fontWeight: 500,
        }}>
          #{rank}
        </span>
      )}
    </div>
  );
}

function NuclearIndicator({ hasAccess }) {
  if (!hasAccess) return null;
  return (
    <span title="Nuclear Weapons State" style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 6px', borderRadius: '8px',
      fontSize: '10px', fontWeight: 700,
      color: '#fbbf24', background: 'rgba(251, 191, 36, 0.12)',
      border: '1px solid rgba(251, 191, 36, 0.25)',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: '12px' }}>&#9762;</span> NUCLEAR
    </span>
  );
}

function ToneIndicator({ tone }) {
  const absVal = Math.abs(tone);
  let color = '#94a3b8';
  let label = 'Neutral';

  if (tone > 2) { color = '#22c55e'; label = 'Positive'; }
  else if (tone > 0.5) { color = '#86efac'; label = 'Lean +'; }
  else if (tone < -2) { color = '#ef4444'; label = 'Negative'; }
  else if (tone < -0.5) { color = '#fca5a5'; label = 'Lean -'; }

  return (
    <span style={{
      display: 'inline-block', fontSize: '10px', fontWeight: 500,
      color, whiteSpace: 'nowrap',
    }}>
      {label} ({tone > 0 ? '+' : ''}{tone.toFixed(1)})
    </span>
  );
}

function VisibilityBar({ visibility }) {
  const width = Math.min(100, Math.max(0, visibility));
  const barColor = width >= 70 ? '#dc2626'
    : width >= 40 ? '#d97706'
    : '#3b82f6';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '60px' }}>
      <div style={{
        flex: 1, height: '4px', borderRadius: '2px',
        background: '#1e2433', overflow: 'hidden',
      }}>
        <div style={{
          width: `${width}%`, height: '100%', borderRadius: '2px',
          background: barColor, transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{ fontSize: '10px', color: '#94a3b8', minWidth: '20px', textAlign: 'right' }}>
        {visibility}
      </span>
    </div>
  );
}

function ChangeRiskBadge({ risk }) {
  if (!risk || risk === 'low') return null;

  const color = SEVERITY_COLORS[risk] || SEVERITY_COLORS.moderate;

  return (
    <span style={{
      display: 'inline-block', padding: '2px 6px', borderRadius: '8px',
      fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px',
      color: '#fff', background: color, textTransform: 'uppercase',
    }}>
      {risk} RISK
    </span>
  );
}

function LeaderCard({ leader, onClick }) {
  const currentYear = new Date().getFullYear();
  const yearsInPower = currentYear - (leader.inPowerSince || currentYear);

  return (
    <button
      type="button"
      onClick={() => onClick?.(leader)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        width: '100%', padding: '10px 12px', border: 'none',
        borderRadius: '8px', background: '#111827',
        cursor: 'pointer', textAlign: 'left',
        borderLeft: `3px solid ${IDEOLOGY_COLORS[leader.ideology] || '#6b7280'}`,
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#1a2236'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#111827'; }}
    >
      {/* Left: Influence gauge */}
      <InfluenceGauge score={leader.influence?.score || 0} rank={leader.influence?.rank} />

      {/* Center: Leader info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
          marginBottom: '4px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
            {leader.name}
          </span>
          <NuclearIndicator hasAccess={leader.nuclearAccess} />
          <ChangeRiskBadge risk={leader.changeRisk} />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
          marginBottom: '4px',
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {leader.title} of {leader.country}
          </span>
          <span style={{ fontSize: '10px', color: '#64748b' }}>
            {yearsInPower}y in power
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <IdeologyBadge ideology={leader.ideology} />
          <StyleBadge style={leader.style} />
          <ToneIndicator tone={leader.tone || 0} />
        </div>
      </div>

      {/* Right: Visibility bar */}
      <div style={{ width: '80px' }}>
        <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Visibility
        </div>
        <VisibilityBar visibility={leader.visibility || 0} />
      </div>
    </button>
  );
}

function ChangeAlertCard({ alert }) {
  const typeLabel = CHANGE_TYPE_LABELS[alert.type] || alert.type;
  const severityColor = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.moderate;

  return (
    <div style={{
      padding: '12px', borderRadius: '8px', background: '#111827',
      borderLeft: `3px solid ${severityColor}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '6px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
            {alert.country}
          </span>
          <span style={{
            padding: '2px 6px', borderRadius: '8px', fontSize: '10px',
            fontWeight: 600, color: severityColor,
            border: `1px solid ${severityColor}`,
            textTransform: 'uppercase',
          }}>
            {typeLabel}
          </span>
        </div>
        <span style={{
          padding: '2px 8px', borderRadius: '10px', fontSize: '10px',
          fontWeight: 700, color: '#fff', background: severityColor,
          textTransform: 'uppercase',
        }}>
          {alert.severity}
        </span>
      </div>

      <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', lineHeight: 1.4 }}>
        {alert.description}
      </div>

      {alert.leaderName && (
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
          Leader: {alert.leaderName}
        </div>
      )}

      {alert.sources && alert.sources.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {alert.sources.slice(0, 3).map((src, i) => (
            <a
              key={i}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '10px', color: '#60a5fa', textDecoration: 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {src.title}
            </a>
          ))}
        </div>
      )}

      {alert.detectedAt && (
        <div style={{ fontSize: '10px', color: '#475569', marginTop: '6px' }}>
          Detected {timeAgo(alert.detectedAt)}
        </div>
      )}
    </div>
  );
}

function PowerRankingTable({ rankings, onCountryClick }) {
  if (!rankings || rankings.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
        No ranking data available
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse', fontSize: '12px',
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1e293b' }}>
            {['#', 'Leader', 'Country', 'Title', 'Score', 'Ideology', 'Style', 'Years', ''].map((header, i) => (
              <th key={i} style={{
                padding: '8px 6px', textAlign: 'left', color: '#64748b',
                fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.5px', whiteSpace: 'nowrap',
              }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rankings.map((leader) => (
            <tr
              key={leader.iso2}
              onClick={() => onCountryClick?.(leader)}
              style={{
                borderBottom: '1px solid #0f172a', cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1a2236'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <td style={{ padding: '8px 6px', color: '#94a3b8', fontWeight: 700, width: '32px' }}>
                {leader.rank}
              </td>
              <td style={{ padding: '8px 6px', color: '#e2e8f0', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {leader.name}
                {leader.nuclearAccess && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', color: '#fbbf24' }} title="Nuclear State">
                    &#9762;
                  </span>
                )}
              </td>
              <td style={{ padding: '8px 6px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {leader.country}
              </td>
              <td style={{ padding: '8px 6px', color: '#64748b', whiteSpace: 'nowrap' }}>
                {leader.title}
              </td>
              <td style={{ padding: '8px 6px' }}>
                <span style={{
                  fontWeight: 700, fontSize: '13px',
                  color: leader.score >= 75 ? '#dc2626'
                    : leader.score >= 50 ? '#d97706'
                    : leader.score >= 25 ? '#3b82f6'
                    : '#94a3b8',
                }}>
                  {leader.score}
                </span>
              </td>
              <td style={{ padding: '8px 6px' }}>
                <IdeologyBadge ideology={leader.ideology} />
              </td>
              <td style={{ padding: '8px 6px' }}>
                <StyleBadge style={leader.style} />
              </td>
              <td style={{ padding: '8px 6px', color: '#64748b', textAlign: 'center' }}>
                {leader.yearsInPower}y
              </td>
              <td style={{ padding: '8px 6px' }}>
                {leader.nuclearAccess && <NuclearIndicator hasAccess={true} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryRow({ summary }) {
  const items = [
    { label: 'World Leaders Tracked', value: summary?.total || 0, color: '#e2e8f0' },
    { label: 'Nuclear Powers', value: summary?.nuclearPowers || 0, color: '#fbbf24' },
    { label: 'Avg Tenure', value: `${summary?.avgTenure || 0}y`, color: '#60a5fa' },
    { label: 'Change Alerts', value: summary?.changeAlerts || 0, color: summary?.changeAlerts > 0 ? '#ef4444' : '#22c55e' },
  ];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
      padding: '12px', borderBottom: '1px solid #1e293b',
    }}>
      {items.map((item) => (
        <div key={item.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: item.color }}>
            {item.value}
          </div>
          <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Panel Component
// ─────────────────────────────────────────────────────────────────────────────

export function LeadershipPanel({ data, loading, onRefresh, onCountryClick }) {
  const [activeTab, setActiveTab] = useState('rankings');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIdeology, setFilterIdeology] = useState('all');
  const [filterStyle, setFilterStyle] = useState('all');
  const [filterRegion, setFilterRegion] = useState('All Regions');

  const leaders = data?.leaders || [];
  const changeAlerts = data?.changeAlerts || [];
  const powerRankings = data?.powerRankings || [];
  const summary = data?.summary || {};

  // Filtered leader list for All Leaders tab
  const filteredLeaders = useMemo(() => {
    let result = [...leaders];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.country.toLowerCase().includes(q) ||
          l.iso2.toLowerCase() === q
      );
    }

    if (filterIdeology !== 'all') {
      result = result.filter((l) => l.ideology === filterIdeology);
    }

    if (filterStyle !== 'all') {
      result = result.filter((l) => l.style === filterStyle);
    }

    if (filterRegion !== 'All Regions') {
      result = result.filter((l) => l.region === filterRegion);
    }

    // Sort by influence score descending
    result.sort((a, b) => (b.influence?.score || 0) - (a.influence?.score || 0));

    return result;
  }, [leaders, searchQuery, filterIdeology, filterStyle, filterRegion]);

  const alertCounts = {
    rankings: powerRankings.length,
    alerts: changeAlerts.length,
    leaders: leaders.length,
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0b0f19', color: '#e2e8f0', fontFamily: 'inherit',
      borderRadius: '12px', overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid #1e293b',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Leadership Intelligence
          </span>
          <span style={{
            padding: '2px 8px', borderRadius: '10px',
            fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
            color: '#22c55e', background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            animation: 'ldship-pulse 2s ease-in-out infinite',
          }}>
            LIVE
          </span>
          <style>{`
            @keyframes ldship-pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            border: 'none', background: '#1e293b', color: '#94a3b8',
            borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
            fontSize: '13px', transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#334155'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1e293b'; }}
        >
          {loading ? '...' : '\u21bb'}
        </button>
      </div>

      {/* ── Summary Row ── */}
      <SummaryRow summary={summary} />

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #1e293b',
        padding: '0 16px',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 14px', border: 'none', cursor: 'pointer',
              background: 'transparent', fontSize: '12px', fontWeight: 500,
              color: activeTab === tab.id ? '#e2e8f0' : '#64748b',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              transition: 'color 0.15s, border-color 0.15s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {tab.label}
            {alertCounts[tab.id] > 0 && (
              <span style={{
                padding: '1px 6px', borderRadius: '8px', fontSize: '10px',
                fontWeight: 600, background: '#1e293b', color: '#94a3b8',
              }}>
                {alertCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading && !data && <LeaderSkeleton />}

        {/* ── Power Rankings Tab ── */}
        {activeTab === 'rankings' && (
          <div style={{ padding: '12px 16px' }}>
            <div style={{
              fontSize: '11px', color: '#64748b', marginBottom: '12px', lineHeight: 1.4,
            }}>
              Top 20 most influential world leaders ranked by media visibility,
              power concentration, nuclear access, alliance networks, and global reach.
            </div>
            {powerRankings.length === 0 && !loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                No ranking data available
              </div>
            ) : (
              <PowerRankingTable rankings={powerRankings} onCountryClick={onCountryClick} />
            )}
          </div>
        )}

        {/* ── Change Alerts Tab ── */}
        {activeTab === 'alerts' && (
          <div style={{ padding: '12px 16px' }}>
            <div style={{
              fontSize: '11px', color: '#64748b', marginBottom: '12px', lineHeight: 1.4,
            }}>
              Detected leadership change risks including coups, impeachments, resignations,
              health concerns, term limits, and succession crises.
            </div>
            {changeAlerts.length === 0 && !loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                No active leadership change alerts
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {changeAlerts.map((alert, i) => (
                  <ChangeAlertCard key={alert.id || i} alert={alert} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── All Leaders Tab ── */}
        {activeTab === 'leaders' && (
          <div style={{ padding: '12px 16px' }}>
            {/* Search & Filters */}
            <div style={{
              display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap',
            }}>
              <input
                type="text"
                placeholder="Search leader or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, minWidth: '140px', padding: '6px 10px',
                  borderRadius: '6px', border: '1px solid #1e293b',
                  background: '#111827', color: '#e2e8f0', fontSize: '12px',
                  outline: 'none',
                }}
              />
              <select
                value={filterIdeology}
                onChange={(e) => setFilterIdeology(e.target.value)}
                style={{
                  padding: '6px 8px', borderRadius: '6px',
                  border: '1px solid #1e293b', background: '#111827',
                  color: '#94a3b8', fontSize: '11px', cursor: 'pointer',
                }}
              >
                <option value="all">All Ideologies</option>
                {Object.entries(IDEOLOGY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={filterStyle}
                onChange={(e) => setFilterStyle(e.target.value)}
                style={{
                  padding: '6px 8px', borderRadius: '6px',
                  border: '1px solid #1e293b', background: '#111827',
                  color: '#94a3b8', fontSize: '11px', cursor: 'pointer',
                }}
              >
                <option value="all">All Styles</option>
                {Object.entries(STYLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                style={{
                  padding: '6px 8px', borderRadius: '6px',
                  border: '1px solid #1e293b', background: '#111827',
                  color: '#94a3b8', fontSize: '11px', cursor: 'pointer',
                }}
              >
                {REGIONS.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Results count */}
            <div style={{
              fontSize: '10px', color: '#475569', marginBottom: '8px',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {filteredLeaders.length} leader{filteredLeaders.length !== 1 ? 's' : ''} shown
            </div>

            {/* Leader cards */}
            {filteredLeaders.length === 0 && !loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                No leaders match the current filters
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredLeaders.map((leader) => (
                  <LeaderCard
                    key={leader.iso2}
                    leader={leader}
                    onClick={() => onCountryClick?.(leader)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', borderTop: '1px solid #1e293b',
        fontSize: '10px', color: '#475569',
      }}>
        <span>Sources: Wikidata + GDELT + OSINT</span>
        {data?.updatedAt && (
          <span>Updated {timeAgo(data.updatedAt)}</span>
        )}
      </div>
    </div>
  );
}

export default LeadershipPanel;
