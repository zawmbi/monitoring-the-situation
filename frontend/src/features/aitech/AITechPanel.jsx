import React, { useState, useMemo } from 'react';
import './aitech.css';

const TABS = [
  { id: 'regulation', label: 'AI Regulation' },
  { id: 'disinformation', label: 'Disinformation' },
  { id: 'crypto', label: 'Crypto/CBDC' },
  { id: 'breakthrough', label: 'Breakthroughs' },
];

const CATEGORY_COLORS = {
  regulation: '#2196f3',
  disinformation: '#ff1744',
  crypto: '#ff9800',
  breakthrough: '#4caf50',
};

const CATEGORY_LABELS = {
  regulation: 'REGULATION',
  disinformation: 'DISINFO',
  crypto: 'CRYPTO',
  breakthrough: 'BREAKTHROUGH',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AITechPanel({ data, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState('regulation');

  const filteredNews = useMemo(() => {
    if (!data?.news) return [];
    return data.news.filter(n => n.category === activeTab);
  }, [data?.news, activeTab]);

  if (!data && loading) {
    return (
      <div className="at-panel">
        <div className="at-skeleton">
          <div className="at-skeleton-bar" style={{ width: '80%' }} />
          <div className="at-skeleton-bar" style={{ width: '60%' }} />
          <div className="at-skeleton-bar" style={{ width: '70%' }} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="at-panel">
        <div className="at-empty">No AI/Tech data available</div>
      </div>
    );
  }

  return (
    <div className="at-panel">
      {/* Header */}
      <div className="at-header">
        <div className="at-title-row">
          <span className="at-title">AI & Technology Monitor</span>
          <span className="at-live-badge">LIVE</span>
        </div>
        <button className="at-btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '\u21BB'}
        </button>
      </div>

      {/* Summary bar */}
      <div className="at-summary-bar">
        <div className="at-stat">
          <span className="at-stat-value" style={{ color: CATEGORY_COLORS.regulation }}>
            {data.summary?.regulationArticles || 0}
          </span>
          <span className="at-stat-label">Regulation</span>
        </div>
        <div className="at-stat">
          <span className="at-stat-value" style={{ color: CATEGORY_COLORS.disinformation }}>
            {data.summary?.disinformationArticles || 0}
          </span>
          <span className="at-stat-label">Disinfo</span>
        </div>
        <div className="at-stat">
          <span className="at-stat-value" style={{ color: CATEGORY_COLORS.crypto }}>
            {data.summary?.cryptoArticles || 0}
          </span>
          <span className="at-stat-label">Crypto</span>
        </div>
        <div className="at-stat">
          <span className="at-stat-value" style={{ color: CATEGORY_COLORS.breakthrough }}>
            {data.summary?.breakthroughArticles || 0}
          </span>
          <span className="at-stat-label">Breakthroughs</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="at-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`at-tab${activeTab === tab.id ? ' at-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="at-content">
        <div className="at-tab-body">
          {filteredNews.length === 0 ? (
            <div className="at-empty">No articles in this category</div>
          ) : (
            filteredNews.map(article => (
              <a
                key={article.id}
                className="at-card"
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="at-card-header">
                  <span
                    className="at-category-badge"
                    style={{
                      background: `${CATEGORY_COLORS[article.category] || '#666'}22`,
                      color: CATEGORY_COLORS[article.category] || '#666',
                      border: `1px solid ${CATEGORY_COLORS[article.category] || '#666'}44`,
                    }}
                  >
                    {CATEGORY_LABELS[article.category] || 'NEWS'}
                  </span>
                  <span className="at-card-source">{article.source}</span>
                </div>
                <div className="at-card-title">{article.title}</div>
                <div className="at-card-summary">{article.summary}</div>
                <div className="at-card-meta">
                  <span>{article.source}</span>
                  <span>{timeAgo(article.publishedAt)}</span>
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="at-footer">
        <span className="at-footer-sources">Google News RSS</span>
        {data.lastUpdated && (
          <span className="at-footer-updated">Updated {timeAgo(data.lastUpdated)}</span>
        )}
      </div>
    </div>
  );
}

export default AITechPanel;
