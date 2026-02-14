import { useState } from 'react';
import { timeAgo } from '../../utils/time';

const RISK_COLORS = {
  critical: '#ff4444',
  high: '#ff8c00',
  elevated: '#ffd700',
  moderate: '#4ecdc4',
  low: '#4a9eff',
};

const RISK_LABELS = {
  critical: 'Critical',
  high: 'High',
  elevated: 'Elevated',
  moderate: 'Moderate',
  low: 'Low',
};

const TABS = [
  { id: 'rankings', label: 'Risk Rankings' },
  { id: 'overview', label: 'Overview' },
];

function RiskBadge({ level }) {
  return (
    <span className="rk-badge" style={{
      background: `${RISK_COLORS[level]}20`,
      color: RISK_COLORS[level],
      border: `1px solid ${RISK_COLORS[level]}40`,
      padding: '1px 6px',
      borderRadius: '3px',
      fontSize: '10px',
      fontWeight: 600,
      textTransform: 'uppercase',
    }}>
      {RISK_LABELS[level] || level}
    </span>
  );
}

function CountryCard({ country, rank, onClick }) {
  const breakdown = country.breakdown;
  return (
    <button className="rk-country" type="button" onClick={() => onClick?.(country)} style={{
      display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
      padding: '8px 10px', background: 'transparent', border: 'none',
      borderLeft: `3px solid ${RISK_COLORS[country.level] || '#666'}`,
      cursor: 'pointer', textAlign: 'left', color: 'inherit',
    }}>
      <div className="rk-country-rank" style={{
        fontSize: '11px', color: 'rgba(255,255,255,0.4)', minWidth: '24px', textAlign: 'center',
      }}>#{rank}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span className="rk-country-name" style={{ fontWeight: 600, fontSize: '13px' }}>{country.country}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {country.sanctioned && (
              <span style={{
                fontSize: '9px', padding: '1px 4px', background: 'rgba(255,68,68,0.15)',
                color: '#ff6b6b', borderRadius: '2px', fontWeight: 700,
              }}>SANCTIONED</span>
            )}
            <RiskBadge level={country.level} />
          </div>
        </div>
        <div className="rk-country-bar" style={{
          height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '3px',
        }}>
          <div style={{
            height: '100%', width: `${country.score}%`, borderRadius: '3px',
            background: `linear-gradient(90deg, ${RISK_COLORS[country.level]}80, ${RISK_COLORS[country.level]})`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        {breakdown && (
          <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
            {breakdown.ucdpConflict > 0 && <span>UCDP +{breakdown.ucdpConflict}</span>}
            {breakdown.stability > 0 && <span>Stability +{breakdown.stability}</span>}
            {breakdown.sanctions > 0 && <span>Sanctions +{breakdown.sanctions}</span>}
            {breakdown.economic > 0 && <span>Economic +{breakdown.economic}</span>}
          </div>
        )}
      </div>
      <div className="rk-country-score" style={{
        fontSize: '18px', fontWeight: 700, color: RISK_COLORS[country.level],
        minWidth: '32px', textAlign: 'right',
      }}>{country.score}</div>
    </button>
  );
}

function RiskDistribution({ summary }) {
  if (!summary) return null;
  const levels = ['critical', 'high', 'elevated', 'moderate', 'low'];
  const total = summary.total || 1;
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
        Risk Distribution
      </div>
      <div style={{ display: 'flex', height: '20px', borderRadius: '4px', overflow: 'hidden', gap: '1px' }}>
        {levels.map(level => {
          const count = summary[level] || 0;
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          return (
            <div key={level} style={{
              width: `${pct}%`, background: RISK_COLORS[level], minWidth: count > 0 ? '8px' : 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 700, color: level === 'low' || level === 'moderate' ? '#000' : '#fff',
            }}>
              {count}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        {levels.map(level => (
          <div key={level} style={{ fontSize: '9px', color: RISK_COLORS[level], textAlign: 'center' }}>
            {RISK_LABELS[level]}: {summary[level] || 0}
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: '12px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="skeleton-card" style={{ height: '60px', marginBottom: '8px', borderRadius: '6px' }} />
      ))}
    </div>
  );
}

export function CountryRiskPanel({ data, loading, onRefresh, onCountryClick }) {
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('rankings');
  const [search, setSearch] = useState('');

  if (loading && !data) return <LoadingSkeleton />;
  if (!data) return <div className="panel-empty">No risk data available</div>;

  const scores = data.scores || [];
  let filtered = filter === 'all' ? scores : scores.filter(s => s.level === filter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(s => s.country.toLowerCase().includes(q));
  }

  return (
    <div className="risk-panel">
      {/* Header */}
      <div style={{ padding: '10px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.5px' }}>
            COMPOSITE RISK SCORING
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
            UCDP + Stability + Sanctions + Economic indicators
          </div>
        </div>
        <span style={{
          fontSize: '9px', padding: '2px 6px', background: 'rgba(78,205,196,0.15)',
          color: '#4ecdc4', borderRadius: '3px', fontWeight: 600,
        }}>LIVE</span>
      </div>

      {/* Summary Stats */}
      <div className="rk-summary" style={{
        display: 'flex', gap: '8px', padding: '10px 12px', flexWrap: 'wrap',
      }}>
        <div className="rk-stat" style={{ flex: 1, minWidth: '60px', textAlign: 'center' }}>
          <span className="rk-stat-value" style={{ fontSize: '18px', fontWeight: 700, display: 'block' }}>{data.summary?.total || 0}</span>
          <span className="rk-stat-label" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>Countries</span>
        </div>
        <div className="rk-stat" style={{ flex: 1, minWidth: '60px', textAlign: 'center' }}>
          <span className="rk-stat-value" style={{ fontSize: '18px', fontWeight: 700, color: '#ff4444', display: 'block' }}>{data.summary?.critical || 0}</span>
          <span className="rk-stat-label" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>Critical</span>
        </div>
        <div className="rk-stat" style={{ flex: 1, minWidth: '60px', textAlign: 'center' }}>
          <span className="rk-stat-value" style={{ fontSize: '18px', fontWeight: 700, color: '#ff8c00', display: 'block' }}>{data.summary?.high || 0}</span>
          <span className="rk-stat-label" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>High</span>
        </div>
        <div className="rk-stat" style={{ flex: 1, minWidth: '60px', textAlign: 'center' }}>
          <span className="rk-stat-value" style={{ fontSize: '18px', fontWeight: 700, display: 'block' }}>{data.summary?.avgScore || 0}</span>
          <span className="rk-stat-label" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>Avg Score</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 12px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.5)',
            borderBottom: tab === t.id ? '2px solid #4a9eff' : '2px solid transparent',
            fontSize: '12px', fontWeight: tab === t.id ? 600 : 400,
          }}>{t.label}</button>
        ))}
        <button className="dp-refresh-btn" onClick={onRefresh} title="Refresh" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          {loading ? '...' : '↻'}
        </button>
      </div>

      {tab === 'overview' && (
        <div style={{ padding: '12px' }}>
          <RiskDistribution summary={data.summary} />
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
            Risk scores are computed dynamically from UCDP conflict events, political stability indicators
            (protests, military activity, instability alerts), sanctions status, and economic indicators
            (inflation, GDP growth, unemployment). Scores range from 0 (lowest risk) to 100 (highest risk).
          </div>
          {data.updatedAt && (
            <div style={{ marginTop: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
              Last computed: {timeAgo(data.updatedAt)}
            </div>
          )}
        </div>
      )}

      {tab === 'rankings' && (
        <>
          {/* Search + Filters */}
          <div style={{ padding: '8px 12px' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search countries..."
              style={{
                width: '100%', padding: '5px 8px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px',
                color: '#fff', fontSize: '12px', outline: 'none', marginBottom: '6px',
              }}
            />
            <div className="rk-filters" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['all', 'critical', 'high', 'elevated', 'moderate', 'low'].map(f => (
                <button key={f} className={`rk-filter${filter === f ? ' active' : ''}`}
                  style={{
                    padding: '2px 8px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer',
                    background: filter === f ? `${RISK_COLORS[f] || 'rgba(255,255,255,0.15)'}20` : 'transparent',
                    border: `1px solid ${filter === f ? (RISK_COLORS[f] || 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.1)'}`,
                    color: filter === f ? (RISK_COLORS[f] || '#fff') : 'rgba(255,255,255,0.5)',
                  }}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : RISK_LABELS[f]}
                  {f !== 'all' && ` (${data.summary?.[f] || 0})`}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div style={{ padding: '0 12px 4px', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
            Showing {filtered.length} of {scores.length} countries
          </div>

          {/* Country List */}
          <div className="rk-list" style={{ overflowY: 'auto', maxHeight: '400px', padding: '0 4px' }}>
            {filtered.map((s, i) => (
              <CountryCard key={s.country} country={s} rank={i + 1} onClick={onCountryClick} />
            ))}
            {filtered.length === 0 && (
              <div className="panel-empty" style={{ padding: '20px', textAlign: 'center' }}>
                No countries match the current filter
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
          Sources: UCDP + GDELT + World Bank + OFAC
        </span>
        {data.updatedAt && (
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
            Updated {timeAgo(data.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
