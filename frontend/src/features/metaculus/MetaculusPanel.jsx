/**
 * MetaculusPanel Component
 * Rich panel displaying Metaculus crowd forecasting data.
 * Accepts data via props (NOT self-fetching).
 */

import { useState, useMemo } from 'react';

/* ── Probability color utility ── */
function probColor(p) {
  if (p === null || p === undefined) return '#888';
  if (p >= 0.8) return '#ff4444';
  if (p >= 0.7) return '#ff6b35';
  if (p >= 0.6) return '#ff8c00';
  if (p >= 0.4) return '#ffd700';
  if (p >= 0.3) return '#a8d948';
  if (p >= 0.2) return '#4ecdc4';
  return '#4a9eff';
}

/* ── Format forecaster count ── */
function fmtForecasters(n) {
  if (!n && n !== 0) return '--';
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ── Loading skeleton ── */
function McSkeleton() {
  return (
    <div className="mc-skeleton">
      <div className="mc-summary">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="mc-stat">
            <span className="mc-stat-value mc-skel-block mc-skel-num">&nbsp;</span>
            <span className="mc-stat-label mc-skel-block mc-skel-label">&nbsp;</span>
          </div>
        ))}
      </div>
      <div className="mc-tabs">
        {[0, 1, 2, 3].map(i => (
          <span key={i} className="mc-tab mc-skel-block mc-skel-tab">&nbsp;</span>
        ))}
      </div>
      <div className="mc-list">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="mc-question mc-skel-card">
            <div className="mc-q-header">
              <span className="mc-skel-block mc-skel-prob">&nbsp;</span>
              <span className="mc-skel-block mc-skel-fc">&nbsp;</span>
            </div>
            <div className="mc-q-title mc-skel-block mc-skel-title">&nbsp;</div>
            <div className="mc-q-bar mc-skel-block mc-skel-bar">&nbsp;</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Category badge ── */
function CategoryBadge({ category }) {
  if (!category) return null;
  const colorMap = {
    'geopolitics': '#ff6b6b',
    'science': '#4ecdc4',
    'technology': '#a78bfa',
    'economics': '#fbbf24',
    'health': '#34d399',
    'politics': '#f472b6',
    'environment': '#6ee7b7',
    'ai': '#818cf8',
    'conflict': '#fb7185',
    'society': '#c084fc',
  };
  const lower = (category || '').toLowerCase();
  const color = Object.entries(colorMap).find(([k]) => lower.includes(k))?.[1] || '#8899aa';
  return (
    <span className="mc-category-badge" style={{ borderColor: color, color }}>
      {category}
    </span>
  );
}

/* ── Individual question card ── */
function QuestionCard({ question }) {
  const prob = question.communityPrediction;
  const pctText = prob !== null && prob !== undefined
    ? `${Math.round(prob * 100)}%`
    : '--';
  const pctWidth = prob !== null && prob !== undefined
    ? Math.max(prob * 100, 1)
    : 0;

  return (
    <a
      className="mc-question"
      href={question.url}
      target="_blank"
      rel="noopener noreferrer"
      title={question.title}
    >
      <div className="mc-q-header">
        <span className="mc-q-prob" style={{ color: probColor(prob) }}>
          {pctText}
        </span>
        <div className="mc-q-meta">
          <CategoryBadge category={question.category} />
          <span className="mc-q-forecasters">
            {fmtForecasters(question.numForecasters)} forecasters
          </span>
        </div>
      </div>

      <div className="mc-q-title">{question.title}</div>

      {prob !== null && prob !== undefined && (
        <div className="mc-q-bar">
          <div
            className="mc-q-bar-fill"
            style={{
              width: `${pctWidth}%`,
              background: `linear-gradient(90deg, ${probColor(prob)}cc, ${probColor(prob)})`,
            }}
          />
          <div className="mc-q-bar-labels">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      <div className="mc-q-footer">
        <span className="mc-q-link-hint">View on Metaculus ↗</span>
        {question.closeTime && (
          <span className="mc-q-closes">
            Closes {new Date(question.closeTime).toLocaleDateString()}
          </span>
        )}
      </div>
    </a>
  );
}

/* ── Category section grouping ── */
function CategorySection({ category, questions }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mc-cat-section">
      <button
        type="button"
        className="mc-cat-header"
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="mc-cat-name">{category}</span>
        <span className="mc-cat-count">{questions.length}</span>
        <span className={`mc-cat-chevron ${collapsed ? 'collapsed' : ''}`}>▾</span>
      </button>
      {!collapsed && (
        <div className="mc-cat-list">
          {questions.map(q => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tab definitions ── */
const TABS = [
  { key: 'all', label: 'All Forecasts' },
  { key: 'high', label: 'High Risk (>70%)' },
  { key: 'uncertain', label: 'Uncertain (30-70%)' },
  { key: 'low', label: 'Low Risk (<30%)' },
];

/* ── Main panel ── */
export function MetaculusPanel({ data, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState('all');

  /* Compute summary stats */
  const summary = useMemo(() => {
    if (!data?.questions?.length) {
      return { total: 0, avgForecasters: 0, highProb: 0, lowProb: 0 };
    }
    const qs = data.questions;
    const total = qs.length;
    const forecasterSum = qs.reduce((s, q) => s + (q.numForecasters || 0), 0);
    const avgForecasters = total ? Math.round(forecasterSum / total) : 0;
    const highProb = qs.filter(q => q.communityPrediction !== null && q.communityPrediction > 0.7).length;
    const lowProb = qs.filter(q => q.communityPrediction !== null && q.communityPrediction < 0.3).length;
    return { total, avgForecasters, highProb, lowProb };
  }, [data]);

  /* Sorted + filtered questions */
  const filteredQuestions = useMemo(() => {
    if (!data?.questions) return [];
    let qs = [...data.questions];

    /* Sort by community prediction descending */
    qs.sort((a, b) => {
      const ap = a.communityPrediction ?? -1;
      const bp = b.communityPrediction ?? -1;
      return bp - ap;
    });

    /* Filter by tab */
    switch (activeTab) {
      case 'high':
        return qs.filter(q => q.communityPrediction !== null && q.communityPrediction > 0.7);
      case 'uncertain':
        return qs.filter(q =>
          q.communityPrediction !== null &&
          q.communityPrediction >= 0.3 &&
          q.communityPrediction <= 0.7
        );
      case 'low':
        return qs.filter(q => q.communityPrediction !== null && q.communityPrediction < 0.3);
      default:
        return qs;
    }
  }, [data, activeTab]);

  /* Show skeleton while loading with no data */
  if (loading && !data) return <McSkeleton />;

  /* Empty state */
  if (!data || !data.questions || data.questions.length === 0) {
    return (
      <div className="mc-empty-state">
        <div className="mc-empty-icon">📊</div>
        <div className="mc-empty-text">No forecast data available</div>
        {onRefresh && (
          <button className="dp-refresh-btn" onClick={onRefresh}>Retry</button>
        )}
      </div>
    );
  }

  return (
    <div className="metaculus-panel">
      {/* Info note about crowd forecasting */}
      <div className="mc-info-note">
        Metaculus uses calibrated crowd forecasting — aggregating thousands of
        individual predictions — rather than market-based mechanisms. Community
        predictions often outperform individual experts on binary and continuous
        questions.
      </div>

      {/* Summary stats row */}
      <div className="mc-summary">
        <div className="mc-stat">
          <span className="mc-stat-value">{summary.total}</span>
          <span className="mc-stat-label">Questions</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value">{fmtForecasters(summary.avgForecasters)}</span>
          <span className="mc-stat-label">Avg Forecasters</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value" style={{ color: '#ff6b6b' }}>
            {summary.highProb}
          </span>
          <span className="mc-stat-label">&gt;70% Likely</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-value" style={{ color: '#4ecdc4' }}>
            {summary.lowProb}
          </span>
          <span className="mc-stat-label">&lt;30% Likely</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mc-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`mc-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="mc-tab-count">
                {tab.key === 'high' ? summary.highProb
                  : tab.key === 'low' ? summary.lowProb
                  : summary.total - summary.highProb - summary.lowProb}
              </span>
            )}
          </button>
        ))}
        <div className="mc-tabs-spacer" />
        {onRefresh && (
          <button
            className="dp-refresh-btn"
            onClick={onRefresh}
            title="Refresh forecasts"
            disabled={loading}
          >
            {loading ? '⟳' : '↻'}
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="mc-results-bar">
        <span className="mc-results-count">
          {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
        </span>
        <span className="mc-results-sort">Sorted by probability ↓</span>
      </div>

      {/* Questions list */}
      <div className="mc-list">
        {filteredQuestions.length === 0 ? (
          <div className="mc-no-results">
            No questions match this filter.
          </div>
        ) : (
          filteredQuestions.map(q => (
            <QuestionCard key={q.id} question={q} />
          ))
        )}
      </div>

      {/* Footer attribution */}
      <div className="mc-footer">
        <div className="mc-footer-attr">
          Metaculus Community Forecasts
        </div>
        <div className="mc-footer-note">
          Predictions reflect the aggregated wisdom of calibrated forecasters on
          the Metaculus platform. Probabilities are community medians, not
          market prices. Data refreshes periodically.
        </div>
      </div>
    </div>
  );
}
