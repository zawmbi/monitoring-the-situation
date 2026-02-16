/**
 * CredibilityPanel -- Source Credibility & Truth Engine
 * Tabbed panel showing:
 *   1. Trending claims with multi-source verification
 *   2. Narrative manipulation alerts
 *   3. Source analysis with tier/bias/geography distribution
 *
 * Props: { data, loading, onRefresh } -- no self-fetching.
 */

import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

/* ── Constants ─────────────────────────────────────────────────────────── */

const TIER_COLORS = {
  1: '#22c55e',
  2: '#3b82f6',
  3: '#f59e0b',
  4: '#ef4444',
  5: '#dc2626',
};

const TIER_LABELS = {
  1: 'Tier 1 - Highest Credibility',
  2: 'Tier 2 - High Credibility',
  3: 'Tier 3 - Mixed Credibility',
  4: 'Tier 4 - Low Credibility',
  5: 'Tier 5 - Unreliable',
};

const VERIFICATION_META = {
  verified:         { label: 'Verified',         color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  'likely-reliable': { label: 'Likely Reliable', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  unverified:       { label: 'Unverified',       color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
  questionable:     { label: 'Questionable',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  unreliable:       { label: 'Unreliable',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const SEVERITY_META = {
  high:   { label: 'HIGH',   color: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
  medium: { label: 'MEDIUM', color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
  low:    { label: 'LOW',    color: '#9ca3af', bg: 'rgba(156,163,175,0.14)' },
};

const BIAS_COLORS = {
  left:           '#3b82f6',
  'center-left':  '#60a5fa',
  center:         '#9ca3af',
  'center-right': '#fb923c',
  right:          '#ef4444',
  unknown:        '#4b5563',
};

const BIAS_LABELS = {
  left:           'Left',
  'center-left':  'Center-Left',
  center:         'Center',
  'center-right': 'Center-Right',
  right:          'Right',
  unknown:        'Unknown',
};

const TABS = [
  { id: 'claims',  label: 'Trending Claims' },
  { id: 'alerts',  label: 'Manipulation Alerts' },
  { id: 'sources', label: 'Source Analysis' },
];

/* ── Sub-components ────────────────────────────────────────────────────── */

function CredSkeleton() {
  return (
    <div className="cr-skeleton">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="cr-skeleton-card">
          <div className="cr-skeleton-line cr-skeleton-line--wide" />
          <div className="cr-skeleton-line cr-skeleton-line--medium" />
          <div className="cr-skeleton-line cr-skeleton-line--narrow" />
        </div>
      ))}
      <span className="cr-skeleton-label">Analyzing source credibility...</span>
    </div>
  );
}

function TierBadge({ tier, score }) {
  const color = TIER_COLORS[tier] || '#9ca3af';
  return (
    <span
      className="cr-tier-badge"
      style={{
        background: `${color}18`,
        color,
        borderColor: color,
      }}
    >
      T{tier}
      {score != null && <span className="cr-tier-score">{score}</span>}
    </span>
  );
}

function CredibilityMeter({ score }) {
  const pct = Math.max(0, Math.min(100, score || 0));
  let color;
  if (pct >= 80) color = '#22c55e';
  else if (pct >= 65) color = '#3b82f6';
  else if (pct >= 50) color = '#f59e0b';
  else if (pct >= 30) color = '#ef4444';
  else color = '#dc2626';

  return (
    <div className="cr-meter">
      <div className="cr-meter-track">
        <div
          className="cr-meter-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="cr-meter-value" style={{ color }}>{pct}</span>
    </div>
  );
}

function VerificationBadge({ level }) {
  const meta = VERIFICATION_META[level] || VERIFICATION_META.unverified;
  return (
    <span
      className="cr-verification-badge"
      style={{ background: meta.bg, color: meta.color, borderColor: meta.color }}
    >
      {meta.label}
    </span>
  );
}

function ClaimCard({ claim }) {
  return (
    <div className="cr-claim-card">
      <div className="cr-claim-card-header">
        <VerificationBadge level={claim.verificationStatus} />
        <CredibilityMeter score={claim.credibilityScore} />
      </div>

      <div className="cr-claim-title">{claim.title}</div>

      <div className="cr-claim-stats">
        <span className="cr-claim-stat">
          <span className="cr-claim-stat-value">{claim.sourceCount}</span>
          <span className="cr-claim-stat-label">sources</span>
        </span>
        <span className="cr-claim-stat">
          <span className="cr-claim-stat-value">{claim.articleCount}</span>
          <span className="cr-claim-stat-label">articles</span>
        </span>
        {claim.tier1Sources > 0 && (
          <span className="cr-claim-stat">
            <span className="cr-claim-stat-value" style={{ color: TIER_COLORS[1] }}>
              {claim.tier1Sources}
            </span>
            <span className="cr-claim-stat-label">T1</span>
          </span>
        )}
        {claim.tier2Sources > 0 && (
          <span className="cr-claim-stat">
            <span className="cr-claim-stat-value" style={{ color: TIER_COLORS[2] }}>
              {claim.tier2Sources}
            </span>
            <span className="cr-claim-stat-label">T2</span>
          </span>
        )}
      </div>

      {claim.sources && claim.sources.length > 0 && (
        <div className="cr-claim-sources">
          <span className="cr-claim-sources-label">Cross-refs:</span>
          {claim.sources.slice(0, 5).map((src, i) => (
            <span key={i} className="cr-claim-source-chip">{src}</span>
          ))}
          {claim.sources.length > 5 && (
            <span className="cr-claim-source-more">+{claim.sources.length - 5}</span>
          )}
        </div>
      )}

      {claim.countries && claim.countries.length > 0 && (
        <div className="cr-claim-geo">
          <span className="cr-claim-geo-label">Origin:</span>
          {claim.countries.map((c, i) => (
            <span key={i} className="cr-claim-country-chip">{c}</span>
          ))}
        </div>
      )}

      {claim.avgTone != null && (
        <div className="cr-claim-tone">
          Tone: {claim.avgTone > 0 ? '+' : ''}{claim.avgTone}
          <span
            className="cr-claim-tone-indicator"
            style={{
              color: Math.abs(claim.avgTone) > 5 ? '#ef4444' : '#9ca3af',
            }}
          >
            {Math.abs(claim.avgTone) > 5 ? ' (extreme)' : ' (neutral)'}
          </span>
        </div>
      )}
    </div>
  );
}

function ManipulationAlert({ alert }) {
  const meta = SEVERITY_META[alert.severity] || SEVERITY_META.low;
  return (
    <div
      className="cr-alert-card"
      style={{ borderLeftColor: meta.color }}
    >
      <div className="cr-alert-header">
        <span
          className="cr-alert-severity"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.label}
        </span>
        <span className="cr-alert-counts">
          {alert.articleCount} articles / {alert.sourceCount} sources
        </span>
      </div>

      <div className="cr-alert-title">{alert.title}</div>

      <div className="cr-alert-flags">
        {alert.flags.map((flag, i) => (
          <div key={i} className="cr-alert-flag">
            <span className="cr-alert-flag-icon" style={{ color: meta.color }}>!</span>
            <span className="cr-alert-flag-text">{flag}</span>
          </div>
        ))}
      </div>

      <div className="cr-alert-source-dist">
        <span className="cr-alert-source-dist-label">Source quality:</span>
        {alert.highCredSources > 0 && (
          <span className="cr-alert-src-badge" style={{ color: '#22c55e' }}>
            {alert.highCredSources} high-cred
          </span>
        )}
        {alert.lowCredSources > 0 && (
          <span className="cr-alert-src-badge" style={{ color: '#ef4444' }}>
            {alert.lowCredSources} low-cred
          </span>
        )}
        {alert.unknownSources > 0 && (
          <span className="cr-alert-src-badge" style={{ color: '#9ca3af' }}>
            {alert.unknownSources} unknown
          </span>
        )}
      </div>

      {alert.countries && alert.countries.length > 0 && (
        <div className="cr-alert-countries">
          Origin: {alert.countries.join(', ')}
        </div>
      )}
    </div>
  );
}

function SourceDistributionChart({ distribution }) {
  const tiers = distribution?.tiers || {};
  const total = Object.entries(tiers)
    .filter(([k]) => k !== 'unknown')
    .reduce((sum, [, v]) => sum + v, 0) || 1;

  return (
    <div className="cr-dist-chart">
      <div className="cr-dist-title">Source Tier Distribution</div>
      <div className="cr-dist-bar-stack">
        {[1, 2, 3, 4, 5].map((tier) => {
          const count = tiers[tier] || 0;
          const pct = Math.round((count / total) * 100);
          if (pct === 0) return null;
          return (
            <div
              key={tier}
              className="cr-dist-bar-segment"
              style={{
                width: `${pct}%`,
                background: TIER_COLORS[tier],
              }}
              title={`${TIER_LABELS[tier]}: ${count} (${pct}%)`}
            >
              {pct >= 8 && <span className="cr-dist-bar-label">T{tier}</span>}
            </div>
          );
        })}
      </div>
      <div className="cr-dist-legend">
        {[1, 2, 3, 4, 5].map((tier) => {
          const count = tiers[tier] || 0;
          return (
            <div key={tier} className="cr-dist-legend-item">
              <span
                className="cr-dist-legend-swatch"
                style={{ background: TIER_COLORS[tier] }}
              />
              <span className="cr-dist-legend-text">
                Tier {tier}: {count}
              </span>
            </div>
          );
        })}
        {tiers.unknown > 0 && (
          <div className="cr-dist-legend-item">
            <span
              className="cr-dist-legend-swatch"
              style={{ background: '#4b5563' }}
            />
            <span className="cr-dist-legend-text">
              Unknown: {tiers.unknown}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function BiasSpectrum({ biasData }) {
  const data = biasData || {};
  const total = Object.values(data).reduce((sum, v) => sum + v, 0) || 1;
  const order = ['left', 'center-left', 'center', 'center-right', 'right'];

  return (
    <div className="cr-bias-spectrum">
      <div className="cr-bias-title">Political Bias Spectrum</div>
      <div className="cr-bias-bar">
        {order.map((key) => {
          const count = data[key] || 0;
          const pct = Math.round((count / total) * 100);
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className="cr-bias-segment"
              style={{
                width: `${pct}%`,
                background: BIAS_COLORS[key],
              }}
              title={`${BIAS_LABELS[key]}: ${count} (${pct}%)`}
            >
              {pct >= 10 && (
                <span className="cr-bias-label">{BIAS_LABELS[key]}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="cr-bias-legend">
        {order.map((key) => {
          const count = data[key] || 0;
          if (count === 0) return null;
          return (
            <div key={key} className="cr-bias-legend-item">
              <span
                className="cr-bias-legend-swatch"
                style={{ background: BIAS_COLORS[key] }}
              />
              <span className="cr-bias-legend-text">
                {BIAS_LABELS[key]}: {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Panel ────────────────────────────────────────────────────────── */

export function CredibilityPanel({ data, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState('claims');

  const claims = data?.claims || [];
  const alerts = data?.manipulationAlerts || [];
  const distribution = data?.distribution || {};
  const sourceStats = data?.sourceStats || {};
  const summary = data?.summary || {};

  const sortedClaims = useMemo(() => {
    return [...claims].sort((a, b) => b.sourceCount - a.sourceCount);
  }, [claims]);

  const highSeverityAlerts = useMemo(() => {
    return alerts.filter(a => a.severity === 'high' || a.severity === 'medium');
  }, [alerts]);

  const counts = {
    claims: claims.length,
    alerts: alerts.length,
    sources: null,
  };

  /* ── Source breakdown table data ── */
  const typeBreakdown = useMemo(() => {
    const types = distribution?.types || {};
    return Object.entries(types)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);
  }, [distribution]);

  const countryBreakdown = useMemo(() => {
    return (distribution?.countries || []).slice(0, 10);
  }, [distribution]);

  if (loading && !data) return <CredSkeleton />;
  if (!data) return <div className="cr-empty">No credibility data available</div>;

  return (
    <div className="cr-panel">
      {/* ── Header ── */}
      <div className="cr-panel-header">
        <div className="cr-panel-title-row">
          <span className="cr-panel-title">SOURCE CREDIBILITY & TRUTH ENGINE</span>
          <span className="cr-live-badge">LIVE</span>
        </div>
        <button className="cr-btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '\u21BB'}
        </button>
      </div>

      {/* ── Summary Row ── */}
      <div className="cr-summary-row">
        <div className="cr-stat">
          <span className="cr-stat-value">{summary.totalSources || 0}</span>
          <span className="cr-stat-label">Total Sources</span>
        </div>
        <div className="cr-stat">
          <span className="cr-stat-value" style={{ color: '#3b82f6' }}>
            {summary.avgCredibility || 0}
          </span>
          <span className="cr-stat-label">Avg Credibility</span>
        </div>
        <div className="cr-stat">
          <span className="cr-stat-value" style={{ color: '#ef4444' }}>
            {summary.flaggedNarratives || 0}
          </span>
          <span className="cr-stat-label">Flagged Narratives</span>
        </div>
        <div className="cr-stat">
          <span className="cr-stat-value" style={{ color: '#22c55e' }}>
            {summary.verifiedClaims || 0}
          </span>
          <span className="cr-stat-label">Verified Claims</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="cr-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`cr-tab${activeTab === tab.id ? ' cr-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {counts[tab.id] != null && counts[tab.id] > 0 && (
              <span className="cr-tab-count">{counts[tab.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="cr-panel-content">
        {/* ── Trending Claims Tab ── */}
        {activeTab === 'claims' && (
          <div className="cr-tab-body">
            <div className="cr-section-note">
              Multi-source verification of trending claims. Stories are cross-referenced
              across {sourceStats.totalInDatabase || 80}+ tracked sources and scored for
              credibility based on source reputation, coverage breadth, tone neutrality,
              and headline quality.
            </div>
            {sortedClaims.length === 0 && !loading && (
              <div className="cr-empty">No trending claims detected</div>
            )}
            <div className="cr-card-list">
              {sortedClaims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} />
              ))}
            </div>
          </div>
        )}

        {/* ── Manipulation Alerts Tab ── */}
        {activeTab === 'alerts' && (
          <div className="cr-tab-body">
            <div className="cr-section-note">
              Narratives flagged for potential manipulation patterns including coordinated
              low-credibility source amplification, geographic origin clustering, sudden
              volume spikes, and extreme sentiment alignment.
            </div>
            {highSeverityAlerts.length > 0 && (
              <div className="cr-alerts-banner" style={{ color: '#ef4444' }}>
                {highSeverityAlerts.length} high/medium severity alert{highSeverityAlerts.length !== 1 ? 's' : ''} detected
              </div>
            )}
            {alerts.length === 0 && !loading && (
              <div className="cr-empty">No manipulation alerts at this time</div>
            )}
            <div className="cr-card-list">
              {alerts.map((alert) => (
                <ManipulationAlert key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        )}

        {/* ── Source Analysis Tab ── */}
        {activeTab === 'sources' && (
          <div className="cr-tab-body">
            <div className="cr-section-note">
              Analysis of source quality across current news coverage. Breakdown by
              credibility tier, political bias spectrum, source type, and geographic origin.
            </div>

            <SourceDistributionChart distribution={distribution} />
            <BiasSpectrum biasData={distribution?.bias} />

            {/* ── Source Type Breakdown ── */}
            {typeBreakdown.length > 0 && (
              <div className="cr-source-section">
                <div className="cr-source-section-title">Source Types</div>
                <div className="cr-source-table">
                  {typeBreakdown.map(([type, count]) => {
                    const maxCount = typeBreakdown[0]?.[1] || 1;
                    return (
                      <div key={type} className="cr-source-row">
                        <span className="cr-source-row-label">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                        <div className="cr-source-row-bar-track">
                          <div
                            className="cr-source-row-bar-fill"
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="cr-source-row-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Geographic Origin Breakdown ── */}
            {countryBreakdown.length > 0 && (
              <div className="cr-source-section">
                <div className="cr-source-section-title">Geographic Origin</div>
                <div className="cr-source-table">
                  {countryBreakdown.map(({ country, count }) => {
                    const maxCount = countryBreakdown[0]?.count || 1;
                    return (
                      <div key={country} className="cr-source-row">
                        <span className="cr-source-row-label">{country}</span>
                        <div className="cr-source-row-bar-track">
                          <div
                            className="cr-source-row-bar-fill"
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="cr-source-row-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Database Stats ── */}
            <div className="cr-source-section">
              <div className="cr-source-section-title">Credibility Database</div>
              <div className="cr-db-stats">
                <div className="cr-db-stat">
                  <span className="cr-db-stat-value">{sourceStats.totalInDatabase || 0}</span>
                  <span className="cr-db-stat-label">Sources Tracked</span>
                </div>
                <div className="cr-db-stat">
                  <span className="cr-db-stat-value">{sourceStats.avgScore || 0}</span>
                  <span className="cr-db-stat-label">Avg DB Score</span>
                </div>
                {sourceStats.byTier && (
                  <>
                    <div className="cr-db-stat">
                      <span className="cr-db-stat-value" style={{ color: TIER_COLORS[1] }}>
                        {sourceStats.byTier.tier1 || 0}
                      </span>
                      <span className="cr-db-stat-label">Tier 1</span>
                    </div>
                    <div className="cr-db-stat">
                      <span className="cr-db-stat-value" style={{ color: TIER_COLORS[2] }}>
                        {sourceStats.byTier.tier2 || 0}
                      </span>
                      <span className="cr-db-stat-label">Tier 2</span>
                    </div>
                    <div className="cr-db-stat">
                      <span className="cr-db-stat-value" style={{ color: TIER_COLORS[3] }}>
                        {sourceStats.byTier.tier3 || 0}
                      </span>
                      <span className="cr-db-stat-label">Tier 3</span>
                    </div>
                    <div className="cr-db-stat">
                      <span className="cr-db-stat-value" style={{ color: TIER_COLORS[4] }}>
                        {sourceStats.byTier.tier4 || 0}
                      </span>
                      <span className="cr-db-stat-label">Tier 4</span>
                    </div>
                    <div className="cr-db-stat">
                      <span className="cr-db-stat-value" style={{ color: TIER_COLORS[5] }}>
                        {sourceStats.byTier.tier5 || 0}
                      </span>
                      <span className="cr-db-stat-label">Tier 5</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="cr-panel-footer">
        <span className="cr-panel-sources">Multi-source verification engine</span>
        {data?.updatedAt && (
          <span className="cr-panel-updated">Updated {timeAgo(data.updatedAt)}</span>
        )}
      </div>
    </div>
  );
}
