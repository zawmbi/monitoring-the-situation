/**
 * PolymarketPanel Component
 * Sleek sidebar panel for Polymarket prediction markets
 */

import { useState, useRef, useEffect } from 'react';
import { timeAgo } from '../../utils/time';
import './polymarket.css';

function formatVolume(value) {
  if (value === null || value === undefined) return '--';
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';

  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}k`;
  }
  return `$${num.toFixed(0)}`;
}

function OutcomeBar({ outcomes }) {
  if (!outcomes || outcomes.length === 0) return null;

  // If outcomes are just strings like ["Yes", "No"], show them as tags
  // If they have prices/percentages, show probability bars
  const hasNumeric = outcomes.some(o => typeof o === 'object' && o.price != null);

  if (hasNumeric) {
    return (
      <div className="pm-outcomes-bar">
        {outcomes.slice(0, 4).map((outcome, idx) => {
          const pct = Math.round((outcome.price || 0) * 100);
          return (
            <div key={idx} className="pm-outcome-row">
              <span className="pm-outcome-label">{outcome.name || outcome}</span>
              <div className="pm-outcome-track">
                <div
                  className="pm-outcome-fill"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className="pm-outcome-pct">{pct}%</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="pm-outcomes-tags">
      {outcomes.slice(0, 4).map((outcome, idx) => (
        <span key={idx} className="pm-outcome-tag">
          {typeof outcome === 'string' ? outcome : outcome.name || outcome}
        </span>
      ))}
      {outcomes.length > 4 && (
        <span className="pm-outcome-tag pm-more">+{outcomes.length - 4}</span>
      )}
    </div>
  );
}

function MarketCard({ market, isExpanded, onToggle }) {
  return (
    <button
      type="button"
      className={`pm-card ${isExpanded ? 'expanded' : ''}`}
      onClick={onToggle}
    >
      <div className="pm-card-top">
        {market.category && (
          <span className="pm-category">{market.category}</span>
        )}
        <span className="pm-volume">{formatVolume(market.volume)} vol</span>
      </div>
      <div className="pm-question">{market.question || 'Untitled Market'}</div>
      <OutcomeBar outcomes={market.outcomes} />
      {isExpanded && (
        <div className="pm-card-detail">
          {market.description && (
            <p className="pm-description">{market.description}</p>
          )}
          <div className="pm-detail-row">
            <div className="pm-detail-stat">
              <span className="pm-detail-label">Liquidity</span>
              <span className="pm-detail-value">{formatVolume(market.liquidity)}</span>
            </div>
            {market.endDate && (
              <div className="pm-detail-stat">
                <span className="pm-detail-label">Closes</span>
                <span className="pm-detail-value">{new Date(market.endDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {market.url && (
            <a
              href={market.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pm-link"
              onClick={(e) => e.stopPropagation()}
            >
              View on Polymarket
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export function PolymarketPanel({
  visible,
  markets,
  loading,
  error,
  lastUpdated,
  country,
  onClose,
  onRefresh,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const panelRef = useRef(null);

  // Reset expanded card when markets change
  useEffect(() => {
    setExpandedId(null);
  }, [country, markets?.length]);

  if (!visible) return null;

  const title = country ? `${country}` : 'Global';
  const count = markets?.length || 0;

  return (
    <div className="pm-panel" ref={panelRef}>
      <div className="pm-header">
        <div className="pm-header-left">
          <h3 className="pm-title">
            <svg className="pm-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Betting Markets
          </h3>
          <span className="pm-subtitle">
            {title} &middot; {count} market{count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="pm-toolbar">
        <button
          className="pm-refresh"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh markets"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'pm-spin' : ''}>
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          {loading ? 'Updating...' : 'Refresh'}
        </button>
        <span className="pm-updated">
          {lastUpdated ? timeAgo(lastUpdated) : ''}
        </span>
      </div>

      <div className="pm-content">
        {loading && count === 0 && (
          <div className="pm-empty">
            <div className="pm-spinner" />
            Loading markets...
          </div>
        )}

        {error && !loading && (
          <div className="pm-empty pm-error">
            Failed to load markets
          </div>
        )}

        {!loading && !error && count === 0 && (
          <div className="pm-empty">
            No markets found{country ? ` for ${country}` : ''}
          </div>
        )}

        {count > 0 && (
          <div className="pm-list">
            {markets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                isExpanded={expandedId === market.id}
                onToggle={() => setExpandedId(expandedId === market.id ? null : market.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PolymarketPanel;
