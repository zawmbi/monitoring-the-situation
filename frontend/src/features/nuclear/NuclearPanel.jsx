import React, { useState } from 'react';
import './nuclear.css';

const RISK_COLORS = {
  CRITICAL: '#ff1744',
  HIGH: '#ff5722',
  ELEVATED: '#ff9800',
  GUARDED: '#ffc107',
  LOW: '#4caf50',
};

const SEVERITY_COLORS = {
  critical: '#ff1744',
  high: '#ff5722',
  medium: '#ff9800',
};

const SEVERITY_LABELS = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getRiskBarColor(score) {
  if (score >= 80) return '#ff1744';
  if (score >= 60) return '#ff5722';
  if (score >= 40) return '#ff9800';
  if (score >= 20) return '#ffc107';
  return '#4caf50';
}

export function NuclearPanel({ data, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState('risk');

  if (!data && loading) {
    return (
      <div className="nu-panel">
        <div className="nu-skeleton">
          <div className="nu-skeleton-bar" style={{ width: '80%' }} />
          <div className="nu-skeleton-bar" style={{ width: '60%' }} />
          <div className="nu-skeleton-bar" style={{ width: '70%' }} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="nu-panel">
        <div className="nu-empty">No nuclear data available</div>
      </div>
    );
  }

  const riskColor = RISK_COLORS[data.riskLabel] || '#666';

  return (
    <div className="nu-panel">
      {/* Header */}
      <div className="nu-header">
        <div className="nu-title-row">
          <span className="nu-title">Nuclear Threat Monitor</span>
          <span className="nu-live-badge" style={{
            background: `${riskColor}22`,
            color: riskColor,
            borderColor: `${riskColor}44`,
          }}>
            {data.riskLabel || 'N/A'}
          </span>
        </div>
        <button className="nu-btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '\u21BB'}
        </button>
      </div>

      {/* DEFCON-style risk indicator */}
      <div className="nu-risk-bar-container">
        <div className="nu-risk-bar-label">
          <span>Risk Score</span>
          <span style={{ color: riskColor, fontWeight: 700 }}>{data.riskScore || 0}/100</span>
        </div>
        <div className="nu-risk-bar-track">
          <div
            className="nu-risk-bar-fill"
            style={{
              width: `${Math.min(data.riskScore || 0, 100)}%`,
              background: riskColor,
            }}
          />
        </div>
        <div className="nu-risk-bar-scale">
          <span>LOW</span>
          <span>GUARDED</span>
          <span>ELEVATED</span>
          <span>HIGH</span>
          <span>CRITICAL</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="nu-tabs">
        <button
          className={`nu-tab${activeTab === 'risk' ? ' nu-tab--active' : ''}`}
          onClick={() => setActiveTab('risk')}
        >
          Nuclear States
        </button>
        <button
          className={`nu-tab${activeTab === 'news' ? ' nu-tab--active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          News Feed
        </button>
      </div>

      {/* Content */}
      <div className="nu-content">
        {activeTab === 'risk' && (
          <div className="nu-tab-body">
            {(data.nuclearStates || []).map(state => (
              <div key={state.code} className="nu-state-row">
                <div className="nu-state-name">{state.name}</div>
                <div className="nu-state-info">
                  <span className="nu-state-warheads">
                    {state.estimatedWarheads > 0 ? `~${state.estimatedWarheads.toLocaleString()}` : '--'}
                  </span>
                  <span className="nu-state-status">{state.status}</span>
                  {state.mentionCount > 0 && (
                    <span className="nu-state-mentions">{state.mentionCount} mentions</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="nu-tab-body">
            {(data.news || []).length === 0 ? (
              <div className="nu-empty">No nuclear news available</div>
            ) : (
              data.news.map(article => (
                <a
                  key={article.id}
                  className="nu-card"
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="nu-card-header">
                    <span
                      className="nu-severity-badge"
                      style={{
                        background: `${SEVERITY_COLORS[article.severity] || '#666'}22`,
                        color: SEVERITY_COLORS[article.severity] || '#666',
                        border: `1px solid ${SEVERITY_COLORS[article.severity] || '#666'}44`,
                      }}
                    >
                      {SEVERITY_LABELS[article.severity] || 'INFO'}
                    </span>
                    <span className="nu-card-source">{article.source}</span>
                  </div>
                  <div className="nu-card-title">{article.title}</div>
                  <div className="nu-card-summary">{article.summary}</div>
                  <div className="nu-card-meta">
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
      <div className="nu-footer">
        <span className="nu-footer-sources">Google News RSS</span>
        {data.lastUpdated && (
          <span className="nu-footer-updated">Updated {timeAgo(data.lastUpdated)}</span>
        )}
      </div>
    </div>
  );
}

export default NuclearPanel;
