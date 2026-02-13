/**
 * InlineMarkets Component
 * Embeddable prediction markets widget for any panel section
 * Fetches from both Polymarket and Kalshi based on topic keywords
 */

import { useState } from 'react';
import { useMarketsByTopic } from '../hooks/useMarketsByTopic';
import './InlineMarkets.css';

function formatVolume(value) {
  if (value === null || value === undefined) return '--';
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
  return `$${num.toFixed(0)}`;
}

function SourceBadge({ source }) {
  const label = source === 'kalshi' ? 'Kalshi' : 'Polymarket';
  const className = source === 'kalshi' ? 'im-source im-source-kalshi' : 'im-source im-source-polymarket';
  return <span className={className}>{label}</span>;
}

function OutcomeBar({ outcomes }) {
  if (!outcomes || outcomes.length === 0) return null;

  const hasNumeric = outcomes.some(o => typeof o === 'object' && o.price != null);

  if (hasNumeric) {
    return (
      <div className="im-outcomes">
        {outcomes.slice(0, 3).map((outcome, idx) => {
          const pct = Math.round((outcome.price || 0) * 100);
          return (
            <div key={idx} className="im-outcome-row">
              <span className="im-outcome-label">{outcome.name || outcome}</span>
              <div className="im-outcome-track">
                <div className="im-outcome-fill" style={{ width: `${Math.max(pct, 2)}%` }} />
              </div>
              <span className="im-outcome-pct">{pct}%</span>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

function MarketCard({ market, isExpanded, onToggle }) {
  return (
    <button
      type="button"
      className={`im-card ${isExpanded ? 'im-card-expanded' : ''}`}
      onClick={onToggle}
    >
      <div className="im-card-header">
        <SourceBadge source={market.source} />
        <span className="im-volume">{formatVolume(market.volume)} vol</span>
      </div>
      <div className="im-question">{market.question || 'Untitled Market'}</div>
      <OutcomeBar outcomes={market.outcomes} />
      {isExpanded && (
        <div className="im-card-detail">
          {market.description && (
            <p className="im-description">{market.description}</p>
          )}
          {market.url && (
            <a
              href={market.url}
              target="_blank"
              rel="noopener noreferrer"
              className="im-link"
              onClick={(e) => e.stopPropagation()}
            >
              View on {market.source === 'kalshi' ? 'Kalshi' : 'Polymarket'}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>
      )}
    </button>
  );
}

export default function InlineMarkets({ require: requiredKeywords, boost: boostKeywords = [], title, enabled = true, maxItems = 6 }) {
  const { markets, loading, error, lastUpdated, refresh } = useMarketsByTopic(requiredKeywords, boostKeywords, enabled);
  const [expandedId, setExpandedId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  if (!enabled) return null;

  const displayMarkets = markets.slice(0, maxItems);
  const count = displayMarkets.length;

  return (
    <div className="im-container">
      <button
        type="button"
        className="im-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="im-header-left">
          <svg className="im-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="im-title">{title || 'Prediction Markets'}</span>
          {count > 0 && <span className="im-count">{count}</span>}
          <span className="im-live-dot" title="Live updating" />
        </div>
        <div className="im-header-right">
          <button
            className="im-refresh-btn"
            onClick={(e) => { e.stopPropagation(); refresh(); }}
            disabled={loading}
            title="Refresh markets"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'im-spin' : ''}>
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          <svg
            className={`im-chevron ${collapsed ? '' : 'im-chevron-open'}`}
            width="12" height="12"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="im-body">
          {loading && count === 0 && (
            <div className="im-empty">
              <div className="im-spinner" />
              Loading markets...
            </div>
          )}

          {error && !loading && count === 0 && (
            <div className="im-empty im-error">Failed to load markets</div>
          )}

          {!loading && !error && count === 0 && (
            <div className="im-empty">No prediction markets found</div>
          )}

          {count > 0 && (
            <div className="im-list">
              {displayMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  isExpanded={expandedId === market.id}
                  onToggle={() => setExpandedId(expandedId === market.id ? null : market.id)}
                />
              ))}
            </div>
          )}

          {lastUpdated && (
            <div className="im-footer">
              <span className="im-sources">Polymarket + Kalshi</span>
              <span className="im-updated">
                Updated {Math.round((Date.now() - lastUpdated.getTime()) / 60000)}m ago
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
