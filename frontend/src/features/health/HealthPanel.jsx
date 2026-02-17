import React, { useState, useMemo } from 'react';
import './health.css';

const TABS = [
  { id: 'outbreaks', label: 'Outbreaks' },
  { id: 'news', label: 'Health News' },
];

const THREAT_COLORS = {
  critical: '#ff4444',
  elevated: '#ff9800',
  monitoring: '#4caf50',
};

const THREAT_LABELS = {
  critical: 'CRITICAL',
  elevated: 'ELEVATED',
  monitoring: 'MONITORING',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function HealthPanel({ data, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState('outbreaks');
  const [diseaseFilter, setDiseaseFilter] = useState('all');

  const diseases = useMemo(() => {
    if (!data?.outbreaks) return [];
    const set = new Set(data.outbreaks.map(o => o.disease));
    return ['all', ...Array.from(set).sort()];
  }, [data?.outbreaks]);

  const filteredOutbreaks = useMemo(() => {
    if (!data?.outbreaks) return [];
    if (diseaseFilter === 'all') return data.outbreaks;
    return data.outbreaks.filter(o => o.disease === diseaseFilter);
  }, [data?.outbreaks, diseaseFilter]);

  if (!data && loading) {
    return (
      <div className="hp-panel">
        <div className="hp-skeleton">
          <div className="hp-skeleton-bar" style={{ width: '80%' }} />
          <div className="hp-skeleton-bar" style={{ width: '60%' }} />
          <div className="hp-skeleton-bar" style={{ width: '70%' }} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="hp-panel">
        <div className="hp-empty">No health data available</div>
      </div>
    );
  }

  return (
    <div className="hp-panel">
      {/* Header */}
      <div className="hp-header">
        <div className="hp-title-row">
          <span className="hp-title">Health & Pandemic Monitor</span>
          <span className="hp-live-badge">WHO</span>
        </div>
        <button className="hp-btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '↻'}
        </button>
      </div>

      {/* Summary bar */}
      <div className="hp-summary-bar">
        <div className="hp-stat">
          <span className="hp-stat-value" style={{ color: THREAT_COLORS.critical }}>
            {data.summary?.criticalThreats || 0}
          </span>
          <span className="hp-stat-label">Critical</span>
        </div>
        <div className="hp-stat">
          <span className="hp-stat-value" style={{ color: THREAT_COLORS.elevated }}>
            {data.summary?.elevatedThreats || 0}
          </span>
          <span className="hp-stat-label">Elevated</span>
        </div>
        <div className="hp-stat">
          <span className="hp-stat-value" style={{ color: THREAT_COLORS.monitoring }}>
            {data.summary?.monitoringThreats || 0}
          </span>
          <span className="hp-stat-label">Monitoring</span>
        </div>
        <div className="hp-stat">
          <span className="hp-stat-value">{data.summary?.totalOutbreaks || 0}</span>
          <span className="hp-stat-label">Total</span>
        </div>
      </div>

      {/* Top threats callout */}
      {data.summary?.topThreats?.length > 0 && (
        <div className="hp-top-threats">
          <span className="hp-top-threats-label">Top Threats:</span>
          {data.summary.topThreats.map((t, i) => (
            <span key={i} className="hp-threat-chip">{t}</span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="hp-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`hp-tab${activeTab === tab.id ? ' hp-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="hp-content">
        {activeTab === 'outbreaks' && (
          <div className="hp-tab-body">
            {/* Disease filter */}
            <div className="hp-filter-row">
              <select
                className="hp-filter-select"
                value={diseaseFilter}
                onChange={e => setDiseaseFilter(e.target.value)}
              >
                {diseases.map(d => (
                  <option key={d} value={d}>{d === 'all' ? 'All diseases' : d}</option>
                ))}
              </select>
            </div>

            {filteredOutbreaks.length === 0 ? (
              <div className="hp-empty">No outbreaks match filter</div>
            ) : (
              filteredOutbreaks.map(outbreak => (
                <a
                  key={outbreak.id}
                  className="hp-card"
                  href={outbreak.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="hp-card-header">
                    <span
                      className="hp-threat-badge"
                      style={{
                        background: `${THREAT_COLORS[outbreak.threatLevel]}22`,
                        color: THREAT_COLORS[outbreak.threatLevel],
                        border: `1px solid ${THREAT_COLORS[outbreak.threatLevel]}44`,
                      }}
                    >
                      {THREAT_LABELS[outbreak.threatLevel]}
                    </span>
                    <span className="hp-card-disease">{outbreak.disease}</span>
                    <span className="hp-card-region">{outbreak.region}</span>
                  </div>
                  <div className="hp-card-title">{outbreak.title}</div>
                  <div className="hp-card-summary">{outbreak.summary}</div>
                  <div className="hp-card-meta">
                    <span>{outbreak.source}</span>
                    <span>{timeAgo(outbreak.publishedAt)}</span>
                  </div>
                </a>
              ))
            )}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="hp-tab-body">
            {(data.news || []).length === 0 ? (
              <div className="hp-empty">No health news available</div>
            ) : (
              data.news.map(article => (
                <a
                  key={article.id}
                  className="hp-card"
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="hp-card-title">{article.title}</div>
                  <div className="hp-card-summary">{article.summary}</div>
                  <div className="hp-card-meta">
                    <span>{article.source}</span>
                    <span>{timeAgo(article.publishedAt)}</span>
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="hp-footer">
        <span className="hp-footer-sources">WHO DON + Google News</span>
        {data.lastUpdated && (
          <span className="hp-footer-updated">Updated {timeAgo(data.lastUpdated)}</span>
        )}
      </div>
    </div>
  );
}

export default HealthPanel;
