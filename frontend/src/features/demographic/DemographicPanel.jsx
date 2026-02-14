/**
 * DemographicPanel — Demographic Risk Analysis panel showing country-level
 * population structure, age distribution, urbanization, migration, and
 * computed demographic risk scores sourced from World Bank indicators.
 */

import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmtPop = (n) => {
  if (n == null) return '--';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return String(n);
};

const fmtPct = (n) => (n != null ? n.toFixed(1) + '%' : '--');
const fmtNum = (n, d = 1) => (n != null ? n.toFixed(d) : '--');

const RISK_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  elevated: '#f59e0b',
  moderate: '#3b82f6',
  low:      '#22c55e',
};

const RISK_BG = {
  critical: 'rgba(239,68,68,0.12)',
  high:     'rgba(249,115,22,0.12)',
  elevated: 'rgba(245,158,11,0.12)',
  moderate: 'rgba(59,130,246,0.10)',
  low:      'rgba(34,197,94,0.10)',
};

const SORT_OPTIONS = [
  { key: 'risk',       label: 'Risk Score' },
  { key: 'population', label: 'Population' },
  { key: 'growth',     label: 'Growth Rate' },
];

const FILTER_LEVELS = ['all', 'critical', 'high', 'elevated', 'moderate', 'low'];

// ─── Sub-components ────────────────────────────────────────────────────────────

function DemoSkeleton() {
  const rows = Array.from({ length: 6 });
  return (
    <div style={{ padding: 16 }}>
      <div style={{ height: 20, width: 220, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: 56, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
      {rows.map((_, i) => (
        <div key={i} style={{
          height: 88, borderRadius: 8, marginBottom: 8,
          background: 'rgba(255,255,255,0.03)',
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 120}ms`,
        }} />
      ))}
    </div>
  );
}

function RiskLevelBadge({ level }) {
  const color = RISK_COLORS[level] || '#8899aa';
  const bg = RISK_BG[level] || 'rgba(255,255,255,0.06)';
  return (
    <span style={{
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      padding: '2px 7px',
      borderRadius: 4,
      color,
      background: bg,
      border: `1px solid ${color}33`,
      whiteSpace: 'nowrap',
    }}>
      {level}
    </span>
  );
}

function DataSourceBadge({ source }) {
  const isLive = source === 'api';
  return (
    <span style={{
      fontSize: 8,
      padding: '1px 5px',
      borderRadius: 6,
      fontWeight: 600,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      background: isLive ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
      color: isLive ? '#22c55e' : '#8899aa',
      border: `1px solid ${isLive ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
    }}>
      {isLive ? 'WORLD BANK API' : 'BASELINE'}
    </span>
  );
}

function PopulationBar({ value, max, label, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8899aa', marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary, #e0e8f0)' }}>{fmtPct(value)}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 3,
          background: color || '#3b82f6',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

function AgeDistributionBar({ youthPct, elderlyPct }) {
  const workingPct = youthPct != null && elderlyPct != null
    ? Math.max(0, 100 - youthPct - elderlyPct)
    : null;

  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 3 }}>Age Distribution</div>
      <div style={{
        display: 'flex',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)',
      }}>
        {youthPct != null && (
          <div
            title={`0-14: ${youthPct.toFixed(1)}%`}
            style={{ width: `${youthPct}%`, background: '#f59e0b', transition: 'width 0.4s ease' }}
          />
        )}
        {workingPct != null && (
          <div
            title={`15-64: ${workingPct.toFixed(1)}%`}
            style={{ width: `${workingPct}%`, background: '#3b82f6', transition: 'width 0.4s ease' }}
          />
        )}
        {elderlyPct != null && (
          <div
            title={`65+: ${elderlyPct.toFixed(1)}%`}
            style={{ width: `${elderlyPct}%`, background: '#8b5cf6', transition: 'width 0.4s ease' }}
          />
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: 9, color: '#8899aa' }}>
        <span><span style={{ color: '#f59e0b' }}>&#9679;</span> 0-14: {fmtPct(youthPct)}</span>
        <span><span style={{ color: '#3b82f6' }}>&#9679;</span> 15-64: {workingPct != null ? fmtPct(workingPct) : '--'}</span>
        <span><span style={{ color: '#8b5cf6' }}>&#9679;</span> 65+: {fmtPct(elderlyPct)}</span>
      </div>
    </div>
  );
}

function IndicatorRow({ label, value, unit, benchmark, warning }) {
  const isWarning = warning && value != null && benchmark != null && (
    warning === 'above' ? value > benchmark : value < benchmark
  );

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '3px 0',
      fontSize: 11,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ color: '#8899aa' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontWeight: 600,
          fontFamily: 'monospace',
          color: isWarning ? '#f59e0b' : 'var(--text-primary, #e0e8f0)',
        }}>
          {value != null ? `${fmtNum(value)}${unit || ''}` : '--'}
        </span>
        {benchmark != null && (
          <span style={{ fontSize: 9, color: '#667788' }}>
            (avg {fmtNum(benchmark)}{unit || ''})
          </span>
        )}
        {isWarning && (
          <span style={{ fontSize: 10, color: '#f59e0b' }} title="Outside normal range">&#9888;</span>
        )}
      </div>
    </div>
  );
}

function RiskFactorList({ factors }) {
  if (!factors || factors.length === 0) {
    return (
      <div style={{ fontSize: 10, color: '#667788', fontStyle: 'italic', padding: '4px 0' }}>
        No significant risk factors identified
      </div>
    );
  }

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 4, fontWeight: 600 }}>Risk Factors</div>
      {factors.map((f, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '3px 0',
          fontSize: 10,
          borderBottom: i < factors.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
        }}>
          <div style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            background: f.contribution >= 10 ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.12)',
            color: f.contribution >= 10 ? '#ef4444' : '#f97316',
            flexShrink: 0,
          }}>
            +{f.contribution}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--text-primary, #e0e8f0)', fontWeight: 600 }}>{f.name}</div>
            <div style={{ color: '#667788', fontSize: 9 }}>{f.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RiskGauge({ score, size = 44 }) {
  const color = score >= 75 ? '#ef4444' : score >= 55 ? '#f97316' : score >= 35 ? '#f59e0b' : score >= 20 ? '#3b82f6' : '#22c55e';
  const circumference = Math.PI * (size - 6);
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={(size - 6) / 2}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3}
        />
        <circle
          cx={size / 2} cy={size / 2} r={(size - 6) / 2}
          fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color, fontFamily: 'monospace',
      }}>
        {score}
      </div>
    </div>
  );
}

function DemographicCard({ profile, onClick }) {
  const [expanded, setExpanded] = useState(false);

  const riskColor = RISK_COLORS[profile.risk?.level] || '#8899aa';

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${riskColor}`,
        borderRadius: 8,
        marginBottom: 6,
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => { setExpanded(!expanded); onClick?.(profile); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '10px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          textAlign: 'left',
        }}
      >
        {/* Risk gauge */}
        <RiskGauge score={profile.risk?.score ?? 0} />

        {/* Country info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary, #e0e8f0)' }}>
              {profile.country}
            </span>
            <span style={{ fontSize: 10, color: '#667788' }}>{profile.iso2}</span>
            <RiskLevelBadge level={profile.risk?.level || 'low'} />
          </div>

          {/* Quick stats row */}
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#8899aa', flexWrap: 'wrap' }}>
            <span>Pop: <b style={{ color: 'var(--text-primary, #e0e8f0)' }}>{fmtPop(profile.population)}</b></span>
            <span>Growth: <b style={{ color: profile.popGrowth > 2.5 ? '#f59e0b' : 'var(--text-primary, #e0e8f0)' }}>{fmtPct(profile.popGrowth)}</b></span>
            <span>Fertility: <b style={{ color: 'var(--text-primary, #e0e8f0)' }}>{fmtNum(profile.fertilityRate)}</b></span>
            <span>Life exp: <b style={{ color: 'var(--text-primary, #e0e8f0)' }}>{fmtNum(profile.lifeExpectancy, 0)}y</b></span>
            {profile.youthUnemployment != null && (
              <span>Youth unemp: <b style={{ color: profile.youthUnemployment > 25 ? '#ef4444' : 'var(--text-primary, #e0e8f0)' }}>
                {fmtPct(profile.youthUnemployment)}
              </b></span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <span style={{
          fontSize: 14,
          color: '#667788',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          flexShrink: 0,
        }}>
          &#9660;
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          padding: '0 12px 12px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          {/* Age distribution */}
          <div style={{ marginTop: 8 }}>
            <AgeDistributionBar youthPct={profile.youthPct} elderlyPct={profile.elderlyPct} />
          </div>

          {/* Key indicators */}
          <div style={{ marginTop: 6 }}>
            <IndicatorRow label="Fertility Rate" value={profile.fertilityRate} unit=" births/woman" benchmark={2.1} warning="above" />
            <IndicatorRow label="Life Expectancy" value={profile.lifeExpectancy} unit=" yrs" benchmark={72} warning="below" />
            <IndicatorRow label="Youth Unemployment" value={profile.youthUnemployment} unit="%" benchmark={15} warning="above" />
            <IndicatorRow label="Urban Population" value={profile.urbanPct} unit="%" benchmark={56} />
            <IndicatorRow label="Population Density" value={profile.density} unit="/km²" benchmark={150} warning="above" />
            <IndicatorRow label="Net Migration" value={profile.netMigration != null ? profile.netMigration / 1000 : null} unit="K" />
          </div>

          {/* Population bars */}
          <div style={{ marginTop: 8 }}>
            <PopulationBar value={profile.youthPct} max={50} label="Youth (0-14)" color="#f59e0b" />
            <PopulationBar value={profile.elderlyPct} max={35} label="Elderly (65+)" color="#8b5cf6" />
            <PopulationBar value={profile.urbanPct} max={100} label="Urban" color="#3b82f6" />
          </div>

          {/* Risk factors */}
          <RiskFactorList factors={profile.risk?.factors} />

          {/* Data source */}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <DataSourceBadge source={profile.dataSource} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Summary stat box ──────────────────────────────────────────────────────────

function SummaryBox({ label, value, sub, color }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 80,
      padding: '8px 10px',
      borderRadius: 8,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || 'var(--text-primary, #e0e8f0)', fontFamily: 'monospace' }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: '#8899aa', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: '#667788', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────────────

export function DemographicPanel({ data, loading, onRefresh, onCountryClick }) {
  const [sortBy, setSortBy] = useState('risk');
  const [filterLevel, setFilterLevel] = useState('all');
  const [search, setSearch] = useState('');

  // Sort and filter profiles
  const filteredProfiles = useMemo(() => {
    if (!data?.profiles) return [];

    let list = [...data.profiles];

    // Filter by risk level
    if (filterLevel !== 'all') {
      list = list.filter((p) => p.risk?.level === filterLevel);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) =>
        p.country.toLowerCase().includes(q) ||
        p.iso2.toLowerCase().includes(q) ||
        (p.region && p.region.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'risk') {
      list.sort((a, b) => (b.risk?.score ?? 0) - (a.risk?.score ?? 0));
    } else if (sortBy === 'population') {
      list.sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
    } else if (sortBy === 'growth') {
      list.sort((a, b) => (b.popGrowth ?? 0) - (a.popGrowth ?? 0));
    }

    return list;
  }, [data, sortBy, filterLevel, search]);

  // Loading state
  if (loading && !data) {
    return <DemoSkeleton />;
  }

  if (!data) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#667788' }}>
        <div style={{ fontSize: 14, marginBottom: 8 }}>No demographic data available</div>
        <button
          type="button"
          onClick={onRefresh}
          style={{
            padding: '6px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)', color: '#8899aa', cursor: 'pointer', fontSize: 12,
          }}
        >
          Load Data
        </button>
      </div>
    );
  }

  const { summary, updatedAt } = data;

  return (
    <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: 'var(--text-primary, #e0e8f0)',
          }}>
            DEMOGRAPHIC RISK ANALYSIS
          </span>
          <DataSourceBadge source="api" />
          {loading && (
            <span style={{ fontSize: 9, color: '#667788', fontStyle: 'italic' }}>updating...</span>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh demographic data"
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
            padding: '3px 8px',
            color: '#8899aa',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          &#8635; Refresh
        </button>
      </div>

      {/* ── Summary row ── */}
      {summary && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <SummaryBox label="Countries Monitored" value={summary.total} />
          <SummaryBox label="Critical Risk" value={summary.critical} color="#ef4444" />
          <SummaryBox label="High Risk" value={summary.high} color="#f97316" />
          <SummaryBox
            label="Avg Risk Score"
            value={summary.avgRisk}
            color={summary.avgRisk >= 50 ? '#f59e0b' : '#3b82f6'}
          />
        </div>
      )}

      {/* ── Youngest / Oldest callout ── */}
      {summary && (summary.youngestPopulation || summary.oldestPopulation) && (
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 12,
          fontSize: 10,
          color: '#8899aa',
        }}>
          {summary.youngestPopulation && (
            <div style={{
              flex: 1, padding: '6px 10px', borderRadius: 6,
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.12)',
            }}>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>Youngest:</span>{' '}
              {summary.youngestPopulation.country} ({fmtPct(summary.youngestPopulation.youthPct)} under 14)
            </div>
          )}
          {summary.oldestPopulation && (
            <div style={{
              flex: 1, padding: '6px 10px', borderRadius: 6,
              background: 'rgba(139,92,246,0.06)',
              border: '1px solid rgba(139,92,246,0.12)',
            }}>
              <span style={{ color: '#8b5cf6', fontWeight: 700 }}>Oldest:</span>{' '}
              {summary.oldestPopulation.country} ({fmtPct(summary.oldestPopulation.elderlyPct)} over 65)
            </div>
          )}
        </div>
      )}

      {/* ── Controls row ── */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search countries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 140,
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text-primary, #e0e8f0)',
            fontSize: 11,
            outline: 'none',
          }}
        />

        {/* Sort */}
        <div style={{ display: 'flex', gap: 4 }}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSortBy(opt.key)}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: sortBy === opt.key ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                background: sortBy === opt.key ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                color: sortBy === opt.key ? '#60a5fa' : '#8899aa',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: sortBy === opt.key ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filter by risk level */}
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          style={{
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text-primary, #e0e8f0)',
            fontSize: 10,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {FILTER_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl === 'all' ? 'All Levels' : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Results count ── */}
      <div style={{ fontSize: 10, color: '#667788', marginBottom: 6 }}>
        Showing {filteredProfiles.length} of {data.profiles?.length || 0} countries
        {filterLevel !== 'all' && (
          <span> &middot; filtered by <b style={{ color: RISK_COLORS[filterLevel] }}>{filterLevel}</b></span>
        )}
      </div>

      {/* ── Country list ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        {filteredProfiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#667788', fontSize: 12 }}>
            No countries match the current filters
          </div>
        ) : (
          filteredProfiles.map((profile) => (
            <DemographicCard
              key={profile.iso2}
              profile={profile}
              onClick={onCountryClick}
            />
          ))
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 9,
        color: '#667788',
      }}>
        <span>Sources: World Bank Development Indicators</span>
        {updatedAt && <span>Updated {timeAgo(updatedAt)}</span>}
      </div>
    </div>
  );
}
