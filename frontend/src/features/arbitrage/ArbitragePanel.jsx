/**
 * ArbitragePanel Component
 * Rich panel displaying cross-platform prediction market divergences.
 * Compares Polymarket vs Kalshi probabilities.
 * Accepts data via props (NOT self-fetching).
 */

import { useState, useMemo } from 'react';

/* ── Divergence color coding ── */
function spreadColor(pct) {
  if (pct === null || pct === undefined) return '#888';
  if (pct >= 10) return '#ff4444';
  if (pct >= 5) return '#ff8c00';
  if (pct >= 3) return '#ffd700';
  return '#4ecdc4';
}

/* ── Spread severity label ── */
function spreadSeverity(pct) {
  if (pct >= 10) return 'Large';
  if (pct >= 5) return 'Notable';
  if (pct >= 3) return 'Moderate';
  return 'Minor';
}

/* ── Direction arrow ── */
function directionArrow(direction) {
  if (!direction) return '⇄';
  const d = direction.toLowerCase();
  if (d.includes('poly') && d.includes('high')) return '▲ Poly';
  if (d.includes('kalshi') && d.includes('high')) return '▲ Kalshi';
  if (d.includes('poly')) return '↑ Poly';
  if (d.includes('kalshi')) return '↑ Kalshi';
  return '⇄';
}

/* ── Format probability percentage ── */
function fmtPct(p) {
  if (p === null || p === undefined) return '--';
  return `${Math.round(p * 100)}%`;
}

/* ── Loading skeleton ── */
function ArbSkeleton() {
  return (
    <div className="arb-skeleton">
      <div className="arb-summary">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="arb-stat">
            <span className="arb-stat-value arb-skel-block arb-skel-num">&nbsp;</span>
            <span className="arb-stat-label arb-skel-block arb-skel-label">&nbsp;</span>
          </div>
        ))}
      </div>
      <div className="arb-tabs">
        {[0, 1, 2].map(i => (
          <span key={i} className="arb-tab arb-skel-block arb-skel-tab">&nbsp;</span>
        ))}
      </div>
      <div className="arb-list">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="arb-opp arb-skel-card">
            <div className="arb-skel-block arb-skel-title">&nbsp;</div>
            <div className="arb-opp-comparison">
              <div className="arb-skel-block arb-skel-bar-wide">&nbsp;</div>
            </div>
            <div className="arb-opp-bars">
              <div className="arb-skel-block arb-skel-bar-row">&nbsp;</div>
              <div className="arb-skel-block arb-skel-bar-row">&nbsp;</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Individual divergence card ── */
function DivergenceCard({ opportunity }) {
  const opp = opportunity;
  const polyProb = opp.polymarket?.probability;
  const kalshiProb = opp.kalshi?.probability;
  const divergence = opp.divergencePct ?? 0;
  const color = spreadColor(divergence);
  const severity = spreadSeverity(divergence);

  const polyPct = polyProb !== null && polyProb !== undefined
    ? Math.round(polyProb * 100) : null;
  const kalshiPct = kalshiProb !== null && kalshiProb !== undefined
    ? Math.round(kalshiProb * 100) : null;

  return (
    <div className="arb-opp" style={{ borderLeftColor: color }}>
      {/* Title & severity */}
      <div className="arb-opp-top">
        <span className="arb-opp-title">
          {opp.polymarket?.title || opp.kalshi?.title || 'Unknown Market'}
        </span>
        <span className="arb-opp-severity" style={{ color, borderColor: color }}>
          {severity}
        </span>
      </div>

      {/* Category if available */}
      {opp.category && (
        <span className="arb-opp-category">{opp.category}</span>
      )}

      {/* Platform comparison row */}
      <div className="arb-opp-comparison">
        <div className="arb-opp-source arb-opp-poly">
          <span className="arb-opp-platform">
            <span className="arb-platform-dot" style={{ background: '#5b5bf7' }} />
            Polymarket
          </span>
          <span className="arb-opp-prob" style={{ color: '#5b5bf7' }}>
            {fmtPct(polyProb)}
          </span>
        </div>

        <div className="arb-opp-vs">
          <span
            className="arb-opp-spread"
            style={{ color, background: `${color}18` }}
          >
            {divergence.toFixed(1)}%
          </span>
          <span className="arb-opp-direction">
            {directionArrow(opp.direction)}
          </span>
        </div>

        <div className="arb-opp-source arb-opp-kalshi">
          <span className="arb-opp-platform">
            <span className="arb-platform-dot" style={{ background: '#ff8c00' }} />
            Kalshi
          </span>
          <span className="arb-opp-prob" style={{ color: '#ff8c00' }}>
            {fmtPct(kalshiProb)}
          </span>
        </div>
      </div>

      {/* Visual comparison bars */}
      <div className="arb-opp-bars">
        <div className="arb-bar-row">
          <span className="arb-bar-label">PM</span>
          <div className="arb-bar-track">
            <div
              className="arb-bar-fill arb-bar-pm"
              style={{
                width: polyPct !== null ? `${Math.max(polyPct, 1)}%` : '0%',
                background: 'linear-gradient(90deg, #5b5bf7aa, #5b5bf7)',
              }}
            />
          </div>
          <span className="arb-bar-pct">{polyPct !== null ? `${polyPct}%` : '--'}</span>
        </div>
        <div className="arb-bar-row">
          <span className="arb-bar-label">KS</span>
          <div className="arb-bar-track">
            <div
              className="arb-bar-fill arb-bar-km"
              style={{
                width: kalshiPct !== null ? `${Math.max(kalshiPct, 1)}%` : '0%',
                background: 'linear-gradient(90deg, #ff8c00aa, #ff8c00)',
              }}
            />
          </div>
          <span className="arb-bar-pct">{kalshiPct !== null ? `${kalshiPct}%` : '--'}</span>
        </div>
        {/* Divergence indicator overlay line */}
        <div className="arb-spread-indicator">
          <div
            className="arb-spread-line"
            style={{
              left: polyPct !== null ? `${Math.min(polyPct, kalshiPct ?? polyPct) + 28}px` : '0',
              width: `${Math.abs((polyPct ?? 0) - (kalshiPct ?? 0))}%`,
              background: `${color}44`,
            }}
          />
        </div>
      </div>

      {/* Timestamp */}
      {opp.detectedAt && (
        <div className="arb-opp-time">
          Detected {new Date(opp.detectedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

/* ── Tab definitions ── */
const TABS = [
  { key: 'all', label: 'All Divergences' },
  { key: 'big', label: 'Big Spreads (>10%)' },
  { key: 'recent', label: 'Recent' },
];

/* ── Main panel ── */
export function ArbitragePanel({ data, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState('all');

  /* Compute summary stats */
  const summary = useMemo(() => {
    if (!data?.opportunities?.length) {
      return {
        divergences: 0,
        avgSpread: 0,
        maxSpread: 0,
        categories: 0,
      };
    }
    const opps = data.opportunities;
    const divergences = opps.length;
    const spreadSum = opps.reduce((s, o) => s + (o.divergencePct || 0), 0);
    const avgSpread = divergences ? parseFloat((spreadSum / divergences).toFixed(1)) : 0;
    const maxSpread = opps.reduce((m, o) => Math.max(m, o.divergencePct || 0), 0);
    const categorySet = new Set(opps.map(o => o.category).filter(Boolean));
    const categories = data.summary?.categoriesScanned || categorySet.size || 0;
    return { divergences, avgSpread, maxSpread, categories };
  }, [data]);

  /* Sorted + filtered opportunities */
  const filteredOpps = useMemo(() => {
    if (!data?.opportunities) return [];
    let opps = [...data.opportunities];

    /* Sort by divergence descending */
    opps.sort((a, b) => (b.divergencePct || 0) - (a.divergencePct || 0));

    switch (activeTab) {
      case 'big':
        return opps.filter(o => (o.divergencePct || 0) >= 10);
      case 'recent': {
        /* Show most recent first, based on detectedAt if available */
        const sorted = [...opps].sort((a, b) => {
          const ta = a.detectedAt ? new Date(a.detectedAt).getTime() : 0;
          const tb = b.detectedAt ? new Date(b.detectedAt).getTime() : 0;
          return tb - ta;
        });
        return sorted;
      }
      default:
        return opps;
    }
  }, [data, activeTab]);

  /* Count for big spreads tab badge */
  const bigCount = useMemo(() => {
    if (!data?.opportunities) return 0;
    return data.opportunities.filter(o => (o.divergencePct || 0) >= 10).length;
  }, [data]);

  /* Show skeleton while loading with no data */
  if (loading && !data) return <ArbSkeleton />;

  /* Empty state */
  if (!data || !data.opportunities || data.opportunities.length === 0) {
    return (
      <div className="arb-empty-state">
        <div className="arb-empty-icon">⚖️</div>
        <div className="arb-empty-text">No arbitrage divergences found</div>
        <div className="arb-empty-sub">
          Markets are currently in close agreement across platforms.
        </div>
        {onRefresh && (
          <button className="dp-refresh-btn" onClick={onRefresh}>Scan Again</button>
        )}
      </div>
    );
  }

  return (
    <div className="arbitrage-panel">
      {/* Summary stats row */}
      <div className="arb-summary">
        <div className="arb-stat">
          <span className="arb-stat-value">{summary.divergences}</span>
          <span className="arb-stat-label">Divergences</span>
        </div>
        <div className="arb-stat">
          <span className="arb-stat-value">{summary.avgSpread}%</span>
          <span className="arb-stat-label">Avg Spread</span>
        </div>
        <div className="arb-stat">
          <span className="arb-stat-value" style={{ color: spreadColor(summary.maxSpread) }}>
            {summary.maxSpread.toFixed(1)}%
          </span>
          <span className="arb-stat-label">Max Spread</span>
        </div>
        <div className="arb-stat">
          <span className="arb-stat-value">{summary.categories}</span>
          <span className="arb-stat-label">Categories</span>
        </div>
      </div>

      {/* Header row */}
      <div className="arb-header-row">
        <span className="arb-header-title">Polymarket vs Kalshi Odds Divergence</span>
        <div className="arb-header-legend">
          <span className="arb-legend-item">
            <span className="arb-legend-dot" style={{ background: '#ff4444' }} />
            &gt;10%
          </span>
          <span className="arb-legend-item">
            <span className="arb-legend-dot" style={{ background: '#ff8c00' }} />
            &gt;5%
          </span>
          <span className="arb-legend-item">
            <span className="arb-legend-dot" style={{ background: '#ffd700' }} />
            &gt;3%
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="arb-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`arb-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === 'big' && bigCount > 0 && (
              <span className="arb-tab-count">{bigCount}</span>
            )}
          </button>
        ))}
        <div className="arb-tabs-spacer" />
        {onRefresh && (
          <button
            className="dp-refresh-btn"
            onClick={onRefresh}
            title="Scan for divergences"
            disabled={loading}
          >
            {loading ? '⟳' : '↻'}
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="arb-results-bar">
        <span className="arb-results-count">
          {filteredOpps.length} divergence{filteredOpps.length !== 1 ? 's' : ''}
        </span>
        <span className="arb-results-sort">
          {activeTab === 'recent' ? 'Most recent first' : 'Sorted by spread ↓'}
        </span>
      </div>

      {/* Opportunities list */}
      <div className="arb-list">
        {filteredOpps.length === 0 ? (
          <div className="arb-no-results">
            No divergences match this filter.
          </div>
        ) : (
          filteredOpps.map((opp, idx) => (
            <DivergenceCard key={opp.id || idx} opportunity={opp} />
          ))
        )}
      </div>

      {/* Footer attribution */}
      <div className="arb-footer">
        <div className="arb-footer-attr">
          Polymarket Gamma API + Kalshi API
        </div>
        <div className="arb-footer-note">
          Divergences represent pricing differences between prediction market
          platforms on equivalent or similar questions. Spreads may reflect
          liquidity differences, timing, or genuine disagreement. Not financial
          advice.
        </div>
      </div>
    </div>
  );
}
