/**
 * CyberPanel — Tabbed panel showing:
 *   1. Cyber incident feed (attacks + outages)
 *   2. CISA Known Exploited Vulnerabilities
 *   3. Threat summary with severity distribution and sector analysis
 */

import { useState, useMemo } from 'react';
import { timeAgo } from '../../utils/time';

const SEVERITY_COLORS = {
  critical: '#ff4444',
  high: '#ff8c00',
  moderate: '#ffd700',
  low: '#4ecdc4',
};

const TYPE_META = {
  cyberattack: { label: 'CYBER', color: '#ff4444', icon: '🛡️' },
  outage: { label: 'OUTAGE', color: '#ff8c00', icon: '⚡' },
};

const TABS = [
  { id: 'incidents', label: 'Incidents' },
  { id: 'vulns', label: 'CISA Vulnerabilities' },
  { id: 'summary', label: 'Threat Summary' },
];

/* ── Sub-components ─────────────────────────────── */

function ThreatSummaryBar({ summary }) {
  const attacks = summary?.cyberAttacks || 0;
  const outages = summary?.outages || 0;
  const ransomware = summary?.ransomwareRelated || 0;
  const kev = summary?.totalVulnerabilities || 0;
  const total = attacks + outages;
  return (
    <div className="cp-summary-bar">
      <div className="cp-stat">
        <span className="cp-stat-value">{attacks}</span>
        <span className="cp-stat-label">Attacks</span>
      </div>
      <div className="cp-stat">
        <span className="cp-stat-value">{outages}</span>
        <span className="cp-stat-label">Outages</span>
      </div>
      <div className="cp-stat">
        <span className="cp-stat-value" style={{ color: '#ff6b6b' }}>{ransomware}</span>
        <span className="cp-stat-label">Ransomware</span>
      </div>
      <div className="cp-stat">
        <span className="cp-stat-value">{kev}</span>
        <span className="cp-stat-label">CISA KEV</span>
      </div>
      <div className="cp-stat">
        <span className="cp-stat-value" style={{ color: '#b388ff' }}>{total}</span>
        <span className="cp-stat-label">Total Threats</span>
      </div>
    </div>
  );
}

function IncidentCard({ item }) {
  const meta = TYPE_META[item.type] || TYPE_META.cyberattack;
  return (
    <a
      className="cp-incident-card"
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="cp-incident-card-left">
        <span className="cp-incident-icon">{meta.icon}</span>
      </div>
      <div className="cp-incident-card-body">
        <div className="cp-incident-card-header">
          <span
            className="cp-incident-type-badge"
            style={{ background: meta.color }}
          >
            {meta.label}
          </span>
          {item.severity && (
            <span
              className="cp-incident-severity"
              style={{ color: SEVERITY_COLORS[item.severity] || '#999' }}
            >
              ● {item.severity}
            </span>
          )}
        </div>
        <div className="cp-incident-title">{item.title}</div>
        <div className="cp-incident-meta">
          <span className="cp-incident-source">{item.source}</span>
          {item.date && <span className="cp-incident-time">{timeAgo(item.date)}</span>}
          {item.link && <span className="cp-incident-link-icon">↗</span>}
        </div>
      </div>
    </a>
  );
}

function VulnCard({ vuln }) {
  return (
    <div className="cp-vuln-card">
      <div className="cp-vuln-card-header">
        <span className="cp-vuln-cve-badge">{vuln.cve}</span>
        {vuln.knownRansomware && (
          <span className="cp-vuln-ransomware-flag">⚠ RANSOMWARE</span>
        )}
      </div>
      <div className="cp-vuln-name">{vuln.name}</div>
      <div className="cp-vuln-vendor-row">
        <span className="cp-vuln-vendor">{vuln.vendor}</span>
        {vuln.product && <span className="cp-vuln-product">— {vuln.product}</span>}
      </div>
      {vuln.description && (
        <div className="cp-vuln-desc">{vuln.description}</div>
      )}
      <div className="cp-vuln-footer">
        {vuln.dateAdded && <span className="cp-vuln-date">Added: {vuln.dateAdded}</span>}
        {vuln.dueDate && <span className="cp-vuln-due">Due: {vuln.dueDate}</span>}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="cp-skeleton">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="cp-skeleton-card">
          <div className="cp-skeleton-line cp-skeleton-line--wide" />
          <div className="cp-skeleton-line cp-skeleton-line--medium" />
          <div className="cp-skeleton-line cp-skeleton-line--narrow" />
        </div>
      ))}
    </div>
  );
}

/* ── Main Panel ─────────────────────────────────── */

export function CyberPanel({ data, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState('incidents');
  const [typeFilter, setTypeFilter] = useState('all');

  const incidents = data?.incidents || [];
  const vulns = data?.vulnerabilities || [];

  const filteredIncidents = useMemo(() => {
    if (typeFilter === 'all') return incidents;
    return incidents.filter((item) => item.type === typeFilter);
  }, [incidents, typeFilter]);

  const sevDistribution = useMemo(() => {
    const dist = { critical: 0, high: 0, moderate: 0, low: 0 };
    incidents.forEach((item) => {
      const sev = item.severity || 'moderate';
      if (dist[sev] !== undefined) dist[sev] += 1;
    });
    return dist;
  }, [incidents]);

  const maxSevCount = Math.max(1, ...Object.values(sevDistribution));

  const sectorBreakdown = useMemo(() => {
    const sectors = {};
    incidents.forEach((item) => {
      const sector = item.sector || 'Unknown';
      sectors[sector] = (sectors[sector] || 0) + 1;
    });
    return Object.entries(sectors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [incidents]);

  const maxSectorCount = Math.max(1, ...sectorBreakdown.map(([, c]) => c));

  const ransomwareVulns = vulns.filter((v) => v.knownRansomware);

  const counts = {
    incidents: incidents.length,
    vulns: vulns.length,
    summary: null,
  };

  if (loading && !data) return <LoadingSkeleton />;
  if (!data) return <div className="cp-empty">No cyber data available</div>;

  return (
    <div className="cp-panel">
      <div className="cp-panel-header">
        <div className="cp-panel-title-row">
          <span className="cp-panel-title">Cyber Threat Monitor</span>
          <span className="cp-live-badge">INTEL</span>
        </div>
        <button className="cp-btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '↻'}
        </button>
      </div>

      <ThreatSummaryBar summary={data.summary} />

      <div className="cp-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`cp-tab${activeTab === tab.id ? ' cp-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {counts[tab.id] != null && counts[tab.id] > 0 && (
              <span className="cp-tab-count">{counts[tab.id]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="cp-panel-content">
        {/* ── Incidents Tab ── */}
        {activeTab === 'incidents' && (
          <div className="cp-tab-body">
            <div className="cp-section-note">
              Cyber incidents detected from GDELT and BleepingComputer feeds. Includes attacks, outages, and breaches.
            </div>
            <div className="cp-type-toggle">
              <span className="cp-filter-label">Type:</span>
              {['all', 'cyberattack', 'outage'].map((t) => (
                <button
                  key={t}
                  className={`cp-filter-btn${typeFilter === t ? ' active' : ''}`}
                  style={typeFilter === t && t !== 'all' ? { borderColor: TYPE_META[t]?.color, color: TYPE_META[t]?.color } : {}}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === 'all' ? 'All' : TYPE_META[t]?.label || t}
                </button>
              ))}
            </div>
            <div className="cp-card-list">
              {filteredIncidents.map((item) => (
                <IncidentCard key={item.id} item={item} />
              ))}
            </div>
            {filteredIncidents.length === 0 && !loading && (
              <div className="cp-empty">No incidents matching filter</div>
            )}
          </div>
        )}

        {/* ── CISA Vulnerabilities Tab ── */}
        {activeTab === 'vulns' && (
          <div className="cp-tab-body">
            <div className="cp-section-note">
              CISA Known Exploited Vulnerabilities (KEV) catalog. These CVEs are actively exploited in the wild and require priority remediation.
            </div>
            {ransomwareVulns.length > 0 && (
              <div className="cp-ransomware-banner">
                ⚠ {ransomwareVulns.length} vulnerabilit{ransomwareVulns.length !== 1 ? 'ies' : 'y'} linked to known ransomware campaigns
              </div>
            )}
            <div className="cp-card-list">
              {vulns.map((vuln) => (
                <VulnCard key={vuln.id} vuln={vuln} />
              ))}
            </div>
            {vulns.length === 0 && !loading && (
              <div className="cp-empty">No CISA KEV entries available</div>
            )}
          </div>
        )}

        {/* ── Threat Summary Tab ── */}
        {activeTab === 'summary' && (
          <div className="cp-tab-body">
            <div className="cp-section-note">
              Aggregated threat landscape overview with severity distribution and affected sector analysis.
            </div>
            <div className="cp-summary-section">
              <div className="cp-summary-section-title">Severity Distribution</div>
              {['critical', 'high', 'moderate', 'low'].map((sev) => (
                <div key={sev} className="cp-sev-bar-row">
                  <span className="cp-sev-bar-label" style={{ color: SEVERITY_COLORS[sev] }}>
                    {sev}
                  </span>
                  <div className="cp-sev-bar-track">
                    <div
                      className="cp-sev-bar-fill"
                      style={{
                        width: `${(sevDistribution[sev] / maxSevCount) * 100}%`,
                        background: SEVERITY_COLORS[sev],
                      }}
                    />
                  </div>
                  <span className="cp-sev-bar-count">{sevDistribution[sev]}</span>
                </div>
              ))}
            </div>
            {sectorBreakdown.length > 0 && (
              <div className="cp-summary-section">
                <div className="cp-summary-section-title">Top Affected Sectors</div>
                {sectorBreakdown.map(([sector, count]) => (
                  <div key={sector} className="cp-sector-bar-row">
                    <span className="cp-sector-bar-label">{sector}</span>
                    <div className="cp-sector-bar-track">
                      <div
                        className="cp-sector-bar-fill"
                        style={{ width: `${(count / maxSectorCount) * 100}%` }}
                      />
                    </div>
                    <span className="cp-sector-bar-count">{count}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="cp-summary-section">
              <div className="cp-summary-section-title">Threat Landscape</div>
              <div className="cp-trend-text">
                {incidents.length > 0
                  ? `Tracking ${incidents.length} active incident${incidents.length !== 1 ? 's' : ''}: ${data.summary?.cyberAttacks || 0} attack${(data.summary?.cyberAttacks || 0) !== 1 ? 's' : ''} and ${data.summary?.outages || 0} outage${(data.summary?.outages || 0) !== 1 ? 's' : ''}. ${(data.summary?.ransomwareRelated || 0) > 0 ? `${data.summary.ransomwareRelated} incident${data.summary.ransomwareRelated !== 1 ? 's' : ''} linked to ransomware activity.` : 'No ransomware-related incidents detected.'}`
                  : 'No active cyber incidents detected. Monitoring continues.'}
                {vulns.length > 0 && ` CISA KEV catalog contains ${vulns.length} tracked vulnerabilit${vulns.length !== 1 ? 'ies' : 'y'}.`}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="cp-panel-footer">
        <span className="cp-panel-sources">GDELT + BleepingComputer + CISA KEV</span>
        {data?.lastUpdated && (
          <span className="cp-panel-updated">Updated {timeAgo(data.lastUpdated)}</span>
        )}
      </div>
    </div>
  );
}
