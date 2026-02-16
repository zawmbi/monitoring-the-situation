/**
 * InfrastructurePanel -- Comprehensive panel for monitoring critical global
 * infrastructure vulnerabilities. Displays infrastructure assets grouped by
 * category, active threats sorted by severity, and submarine cable status.
 *
 * Sub-components:
 *   InfraSkeleton, CategoryBadge, ThreatLevelIndicator, ImportanceMeter,
 *   InfraCard, ThreatCard, CategorySummary
 */

import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

/* ── Constants ──────────────────────────────────────────────────────────── */

const CATEGORY_COLORS = {
  energy: '#f59e0b',
  digital: '#3b82f6',
  transport: '#06b6d4',
  financial: '#22c55e',
  food_water: '#8b5cf6',
};

const CATEGORY_LABELS = {
  energy: 'Energy',
  digital: 'Digital',
  transport: 'Transport',
  financial: 'Financial',
  food_water: 'Food & Water',
};

const THREAT_LEVELS = {
  critical: { color: '#ef4444', label: 'CRITICAL' },
  high: { color: '#f97316', label: 'HIGH' },
  moderate: { color: '#eab308', label: 'MODERATE' },
  low: { color: '#22c55e', label: 'LOW' },
};

const TABS = [
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'threats', label: 'Active Threats' },
  { id: 'cables', label: 'Cable Monitor' },
];

/* ── Sub-components ─────────────────────────────────────────────────────── */

function InfraSkeleton() {
  return (
    <div className="ip-skeleton">
      <div className="ip-skeleton-header">
        <div className="ip-skeleton-line ip-skeleton-line--title" />
        <div className="ip-skeleton-line ip-skeleton-line--badge" />
      </div>
      <div className="ip-skeleton-summary">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="ip-skeleton-stat">
            <div className="ip-skeleton-line ip-skeleton-line--value" />
            <div className="ip-skeleton-line ip-skeleton-line--label" />
          </div>
        ))}
      </div>
      <div className="ip-skeleton-tabs">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="ip-skeleton-tab" />
        ))}
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="ip-skeleton-card">
          <div className="ip-skeleton-line ip-skeleton-line--wide" />
          <div className="ip-skeleton-line ip-skeleton-line--medium" />
          <div className="ip-skeleton-line ip-skeleton-line--narrow" />
        </div>
      ))}
    </div>
  );
}

function CategoryBadge({ category }) {
  const color = CATEGORY_COLORS[category] || '#6b7280';
  const label = CATEGORY_LABELS[category] || category;

  return (
    <span
      className="ip-category-badge"
      style={{
        background: `${color}22`,
        color: color,
        border: `1px solid ${color}44`,
      }}
    >
      {label}
    </span>
  );
}

function ThreatLevelIndicator({ level }) {
  const config = THREAT_LEVELS[level] || THREAT_LEVELS.low;

  return (
    <span className="ip-threat-indicator">
      <span
        className="ip-threat-dot"
        style={{ background: config.color }}
      />
      <span
        className="ip-threat-label"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
    </span>
  );
}

function ImportanceMeter({ score }) {
  const max = 10;
  const pct = Math.min(100, (score / max) * 100);
  let barColor;
  if (score >= 9) barColor = '#ef4444';
  else if (score >= 7) barColor = '#f97316';
  else if (score >= 5) barColor = '#eab308';
  else barColor = '#22c55e';

  return (
    <div className="ip-importance-meter">
      <div className="ip-importance-track">
        <div
          className="ip-importance-fill"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className="ip-importance-value">{score}/{max}</span>
    </div>
  );
}

function InfraCard({ item }) {
  const scoreColor =
    item.vulnerabilityScore >= 75 ? '#ef4444' :
    item.vulnerabilityScore >= 55 ? '#f97316' :
    item.vulnerabilityScore >= 35 ? '#eab308' :
    '#22c55e';

  return (
    <div className="ip-infra-card">
      <div className="ip-infra-card-header">
        <div className="ip-infra-card-title-row">
          <span className="ip-infra-card-name">{item.name}</span>
          <CategoryBadge category={item.category} />
        </div>
        <div className="ip-infra-card-score" style={{ color: scoreColor }}>
          {item.vulnerabilityScore}
        </div>
      </div>

      <div className="ip-infra-card-body">
        <div className="ip-infra-card-description">{item.description}</div>

        <div className="ip-infra-card-meta">
          <div className="ip-infra-card-meta-item">
            <span className="ip-meta-label">Location</span>
            <span className="ip-meta-value">
              {item.location.lat.toFixed(2)}, {item.location.lon.toFixed(2)}
            </span>
          </div>
          <div className="ip-infra-card-meta-item">
            <span className="ip-meta-label">Importance</span>
            <ImportanceMeter score={item.importance} />
          </div>
          <div className="ip-infra-card-meta-item">
            <span className="ip-meta-label">Risk Level</span>
            <ThreatLevelIndicator level={item.riskLevel} />
          </div>
        </div>

        {item.activeAlerts > 0 && (
          <div className="ip-infra-card-alerts">
            <span className="ip-alert-count">{item.activeAlerts}</span>
            <span className="ip-alert-text">
              active alert{item.activeAlerts !== 1 ? 's' : ''} detected
            </span>
          </div>
        )}

        <div className="ip-infra-card-countries">
          <span className="ip-meta-label">Affected:</span>
          {item.countries.map((code) => (
            <span key={code} className="ip-country-tag">{code}</span>
          ))}
        </div>
      </div>

      {item.scoreBreakdown && (
        <div className="ip-infra-card-breakdown">
          <span className="ip-breakdown-item" title="Base importance score">
            Base: {item.scoreBreakdown.base}
          </span>
          <span className="ip-breakdown-item" title="Threat volume signal">
            Vol: {item.scoreBreakdown.volume}
          </span>
          <span className="ip-breakdown-item" title="Tone severity signal">
            Tone: {item.scoreBreakdown.tone}
          </span>
          <span className="ip-breakdown-item" title="Geographic instability modifier">
            Geo: {item.scoreBreakdown.geographic}
          </span>
        </div>
      )}
    </div>
  );
}

function ThreatCard({ threat }) {
  const levelConfig = THREAT_LEVELS[threat.severityLabel] || THREAT_LEVELS.moderate;

  return (
    <a
      className="ip-threat-card"
      href={threat.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="ip-threat-card-header">
        <ThreatLevelIndicator level={threat.severityLabel} />
        <span className="ip-threat-card-severity-score">
          {threat.severity}/10
        </span>
      </div>

      <div className="ip-threat-card-title">{threat.title}</div>

      <div className="ip-threat-card-meta">
        <span className="ip-threat-card-source">{threat.source}</span>
        {threat.region && (
          <span className="ip-threat-card-region">{threat.region}</span>
        )}
        {threat.date && (
          <span className="ip-threat-card-time">{timeAgo(threat.date)}</span>
        )}
        <span className="ip-threat-card-link-icon">&#8599;</span>
      </div>

      {threat.matchedInfrastructure && threat.matchedInfrastructure.length > 0 && (
        <div className="ip-threat-card-matched">
          <span className="ip-matched-label">Linked infrastructure:</span>
          {threat.matchedInfrastructure.map((id) => (
            <span key={id} className="ip-matched-id">{id.replace('infra-', '')}</span>
          ))}
        </div>
      )}
    </a>
  );
}

function CableAlertCard({ alert }) {
  return (
    <a
      className="ip-cable-card"
      href={alert.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="ip-cable-card-header">
        <span
          className="ip-cable-severity-badge"
          style={{
            background: alert.severity >= 7 ? '#ef4444' : alert.severity >= 5 ? '#f97316' : '#eab308',
          }}
        >
          SEV {alert.severity}
        </span>
        {alert.region && (
          <span className="ip-cable-card-region">{alert.region}</span>
        )}
      </div>

      <div className="ip-cable-card-title">{alert.title}</div>

      <div className="ip-cable-card-meta">
        <span className="ip-cable-card-source">{alert.source}</span>
        {alert.date && (
          <span className="ip-cable-card-time">{timeAgo(alert.date)}</span>
        )}
        <span className="ip-cable-card-link-icon">&#8599;</span>
      </div>

      {alert.affectedCables && alert.affectedCables.length > 0 && (
        <div className="ip-cable-card-affected">
          <span className="ip-cable-affected-label">Affected cables:</span>
          {alert.affectedCables.map((id) => (
            <span key={id} className="ip-cable-affected-name">
              {id.replace('infra-digital-', '').toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

function CategorySummary({ summary }) {
  if (!summary || !summary.categories) return null;

  const categoryEntries = Object.entries(summary.categories);
  if (categoryEntries.length === 0) return null;

  return (
    <div className="ip-category-summary">
      <div className="ip-category-summary-title">Threat Distribution by Category</div>
      <div className="ip-category-summary-grid">
        {categoryEntries.map(([cat, stats]) => {
          const color = CATEGORY_COLORS[cat] || '#6b7280';
          const label = CATEGORY_LABELS[cat] || cat;
          return (
            <div key={cat} className="ip-category-summary-item">
              <div className="ip-category-summary-header">
                <span className="ip-category-summary-name" style={{ color }}>{label}</span>
                <span className="ip-category-summary-count">{stats.total} assets</span>
              </div>
              <div className="ip-category-summary-stats">
                <span className="ip-category-stat">
                  <span className="ip-category-stat-value" style={{ color: stats.threatened > 0 ? '#f97316' : '#6b7280' }}>
                    {stats.threatened}
                  </span>
                  <span className="ip-category-stat-label">threatened</span>
                </span>
                <span className="ip-category-stat">
                  <span className="ip-category-stat-value" style={{ color: stats.critical > 0 ? '#ef4444' : '#6b7280' }}>
                    {stats.critical}
                  </span>
                  <span className="ip-category-stat-label">critical</span>
                </span>
                <span className="ip-category-stat">
                  <span className="ip-category-stat-value">{stats.avgScore}</span>
                  <span className="ip-category-stat-label">avg score</span>
                </span>
              </div>
              <div className="ip-category-summary-bar-track">
                <div
                  className="ip-category-summary-bar-fill"
                  style={{
                    width: `${stats.avgScore}%`,
                    background: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Panel ─────────────────────────────────────────────────────────── */

export function InfrastructurePanel({ data, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState('infrastructure');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const infrastructure = data?.infrastructure || [];
  const threats = data?.threats || [];
  const cableAlerts = data?.cableAlerts || [];
  const summary = data?.summary || {};

  // Group infrastructure by category
  const groupedInfra = useMemo(() => {
    const groups = {};
    const items = categoryFilter === 'all'
      ? infrastructure
      : infrastructure.filter((i) => i.category === categoryFilter);

    for (const item of items) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }

    // Sort categories by highest vulnerability score in each group
    const sortedEntries = Object.entries(groups).sort(([, a], [, b]) => {
      const maxA = Math.max(...a.map((i) => i.vulnerabilityScore));
      const maxB = Math.max(...b.map((i) => i.vulnerabilityScore));
      return maxB - maxA;
    });

    return sortedEntries;
  }, [infrastructure, categoryFilter]);

  // Sort threats by severity
  const sortedThreats = useMemo(() => {
    return [...threats].sort((a, b) => b.severity - a.severity);
  }, [threats]);

  // Count tabs
  const tabCounts = {
    infrastructure: infrastructure.length,
    threats: threats.length,
    cables: cableAlerts.length,
  };

  // Available categories for filter
  const availableCategories = useMemo(() => {
    const cats = new Set(infrastructure.map((i) => i.category));
    return ['all', ...Array.from(cats).sort()];
  }, [infrastructure]);

  if (loading && !data) return <InfraSkeleton />;
  if (!data) return <div className="ip-empty">No infrastructure data available</div>;

  return (
    <div className="ip-panel">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="ip-panel-header">
        <div className="ip-panel-title-row">
          <span className="ip-panel-title">INFRASTRUCTURE VULNERABILITY</span>
          <span className="ip-live-badge">LIVE</span>
        </div>
        <button className="ip-btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '\u21BB'}
        </button>
      </div>

      {/* ── Summary Row ─────────────────────────────────────── */}
      <div className="ip-summary-bar">
        <div className="ip-stat">
          <span className="ip-stat-value">{summary.total || 0}</span>
          <span className="ip-stat-label">Total Monitored</span>
        </div>
        <div className="ip-stat">
          <span className="ip-stat-value" style={{ color: '#f97316' }}>
            {summary.threatened || 0}
          </span>
          <span className="ip-stat-label">Active Threats</span>
        </div>
        <div className="ip-stat">
          <span className="ip-stat-value" style={{ color: '#ef4444' }}>
            {summary.critical || 0}
          </span>
          <span className="ip-stat-label">Critical Alerts</span>
        </div>
        <div className="ip-stat">
          <span className="ip-stat-value" style={{ color: '#8b5cf6' }}>
            {summary.categories ? Object.keys(summary.categories).length : 0}
          </span>
          <span className="ip-stat-label">Categories</span>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="ip-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`ip-tab${activeTab === tab.id ? ' ip-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tabCounts[tab.id] > 0 && (
              <span className="ip-tab-count">{tabCounts[tab.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Panel Content ───────────────────────────────────── */}
      <div className="ip-panel-content">

        {/* ── Infrastructure Tab ──────────────────────────────── */}
        {activeTab === 'infrastructure' && (
          <div className="ip-tab-body">
            <div className="ip-section-note">
              Critical global infrastructure assets ranked by composite vulnerability score.
              Scores combine base importance, threat volume, tone analysis, and geographic instability.
            </div>

            {/* Category filter */}
            <div className="ip-category-filter">
              <span className="ip-filter-label">Category:</span>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  className={`ip-filter-btn${categoryFilter === cat ? ' active' : ''}`}
                  style={
                    categoryFilter === cat && cat !== 'all'
                      ? { borderColor: CATEGORY_COLORS[cat], color: CATEGORY_COLORS[cat] }
                      : {}
                  }
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>

            <CategorySummary summary={summary} />

            {/* Infrastructure cards grouped by category */}
            {groupedInfra.map(([category, items]) => (
              <div key={category} className="ip-infra-group">
                <div className="ip-infra-group-header">
                  <CategoryBadge category={category} />
                  <span className="ip-infra-group-count">
                    {items.length} asset{items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="ip-infra-group-cards">
                  {items.map((item) => (
                    <InfraCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}

            {groupedInfra.length === 0 && !loading && (
              <div className="ip-empty">No infrastructure items match the selected filter</div>
            )}
          </div>
        )}

        {/* ── Active Threats Tab ──────────────────────────────── */}
        {activeTab === 'threats' && (
          <div className="ip-tab-body">
            <div className="ip-section-note">
              Active threat signals detected via GDELT analysis. Threats are ranked by
              severity score derived from article tone and volume. Direct matches to
              known infrastructure assets are highlighted.
            </div>

            <div className="ip-threats-list">
              {sortedThreats.map((threat) => (
                <ThreatCard key={threat.id} threat={threat} />
              ))}
            </div>

            {sortedThreats.length === 0 && !loading && (
              <div className="ip-empty">No active threats detected</div>
            )}
          </div>
        )}

        {/* ── Cable Monitor Tab ──────────────────────────────── */}
        {activeTab === 'cables' && (
          <div className="ip-tab-body">
            <div className="ip-section-note">
              Submarine cable incident monitoring. Tracks reports of cable cuts, damage,
              and disruption events affecting global internet and communications infrastructure.
            </div>

            <div className="ip-cables-overview">
              <div className="ip-cables-stat">
                <span className="ip-cables-stat-value">{cableAlerts.length}</span>
                <span className="ip-cables-stat-label">Recent Incidents</span>
              </div>
              <div className="ip-cables-stat">
                <span className="ip-cables-stat-value" style={{ color: '#ef4444' }}>
                  {cableAlerts.filter((a) => a.severity >= 7).length}
                </span>
                <span className="ip-cables-stat-label">High Severity</span>
              </div>
              <div className="ip-cables-stat">
                <span className="ip-cables-stat-value" style={{ color: '#3b82f6' }}>
                  {new Set(cableAlerts.flatMap((a) => a.affectedCables || [])).size}
                </span>
                <span className="ip-cables-stat-label">Cables Affected</span>
              </div>
            </div>

            <div className="ip-cables-list">
              {cableAlerts.map((alert) => (
                <CableAlertCard key={alert.id} alert={alert} />
              ))}
            </div>

            {cableAlerts.length === 0 && !loading && (
              <div className="ip-empty">No submarine cable incidents detected</div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="ip-panel-footer">
        <span className="ip-panel-sources">Sources: GDELT + OSINT + Industry Reports</span>
        {data?.updatedAt && (
          <span className="ip-panel-updated">Updated {timeAgo(data.updatedAt)}</span>
        )}
      </div>
    </div>
  );
}
