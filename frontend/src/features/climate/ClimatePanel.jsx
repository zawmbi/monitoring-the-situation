import React, { useState, useMemo } from 'react';
import './climate.css';

const TABS = [
  { id: 'extreme-weather', label: 'Extreme Weather' },
  { id: 'policy', label: 'Policy' },
  { id: 'news', label: 'News' },
];

const TYPE_COLORS = {
  'extreme-weather': '#ff5722',
  policy: '#2196f3',
  emissions: '#ff9800',
  ecosystem: '#4caf50',
};

const TYPE_LABELS = {
  'extreme-weather': 'WEATHER',
  policy: 'POLICY',
  emissions: 'EMISSIONS',
  ecosystem: 'ECOSYSTEM',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ClimatePanel({ data, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState('extreme-weather');

  const filteredNews = useMemo(() => {
    if (!data?.news) return [];
    if (activeTab === 'news') return data.news;
    return data.news.filter(n => n.eventType === activeTab);
  }, [data?.news, activeTab]);

  if (!data && loading) {
    return (
      <div className="cl-panel">
        <div className="cl-skeleton">
          <div className="cl-skeleton-bar" style={{ width: '80%' }} />
          <div className="cl-skeleton-bar" style={{ width: '60%' }} />
          <div className="cl-skeleton-bar" style={{ width: '70%' }} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="cl-panel">
        <div className="cl-empty">No climate data available</div>
      </div>
    );
  }

  return (
    <div className="cl-panel">
      {/* Header */}
      <div className="cl-header">
        <div className="cl-title-row">
          <span className="cl-title">Climate & Environment Monitor</span>
          <span className="cl-live-badge">LIVE</span>
        </div>
        <button className="cl-btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '\u21BB'}
        </button>
      </div>

      {/* Summary bar */}
      <div className="cl-summary-bar">
        <div className="cl-stat">
          <span className="cl-stat-value" style={{ color: TYPE_COLORS['extreme-weather'] }}>
            {data.summary?.extremeWeatherEvents || 0}
          </span>
          <span className="cl-stat-label">Weather</span>
        </div>
        <div className="cl-stat">
          <span className="cl-stat-value" style={{ color: TYPE_COLORS.policy }}>
            {data.summary?.policyUpdates || 0}
          </span>
          <span className="cl-stat-label">Policy</span>
        </div>
        <div className="cl-stat">
          <span className="cl-stat-value" style={{ color: TYPE_COLORS.emissions }}>
            {data.summary?.emissionsArticles || 0}
          </span>
          <span className="cl-stat-label">Emissions</span>
        </div>
        <div className="cl-stat">
          <span className="cl-stat-value">{data.summary?.totalArticles || 0}</span>
          <span className="cl-stat-label">Total</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="cl-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`cl-tab${activeTab === tab.id ? ' cl-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="cl-content">
        <div className="cl-tab-body">
          {filteredNews.length === 0 ? (
            <div className="cl-empty">No articles match this filter</div>
          ) : (
            filteredNews.map(article => (
              <a
                key={article.id}
                className="cl-card"
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="cl-card-header">
                  <span
                    className="cl-type-badge"
                    style={{
                      background: `${TYPE_COLORS[article.eventType] || '#666'}22`,
                      color: TYPE_COLORS[article.eventType] || '#666',
                      border: `1px solid ${TYPE_COLORS[article.eventType] || '#666'}44`,
                    }}
                  >
                    {TYPE_LABELS[article.eventType] || 'NEWS'}
                  </span>
                  <span className="cl-card-source">{article.source}</span>
                </div>
                <div className="cl-card-title">{article.title}</div>
                <div className="cl-card-summary">{article.summary}</div>
                <div className="cl-card-meta">
                  <span>{article.source}</span>
                  <span>{timeAgo(article.publishedAt)}</span>
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="cl-footer">
        <span className="cl-footer-sources">Google News RSS</span>
        {data.lastUpdated && (
          <span className="cl-footer-updated">Updated {timeAgo(data.lastUpdated)}</span>
        )}
      </div>
    </div>
  );
}

export default ClimatePanel;
