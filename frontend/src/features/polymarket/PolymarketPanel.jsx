/**
 * PolymarketPanel Component
 * Displays Polymarket prediction markets with >100k volume
 */

import { useState, useRef, useEffect } from 'react';
import { timeAgo } from '../../utils/time';
import './polymarket.css';

function formatVolume(value) {
  if (value === null || value === undefined) return '--';
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';

  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}k`;
  }
  return `$${num.toFixed(0)}`;
}

function MarketCard({ market, onSelect, isSelected }) {
  return (
    <button
      type="button"
      className={`polymarket-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect && onSelect(market)}
    >
      <div className="polymarket-card-header">
        <div className="polymarket-question">{market.question || 'Untitled Market'}</div>
        {market.category && (
          <div className="polymarket-category">{market.category}</div>
        )}
      </div>
      <div className="polymarket-card-stats">
        <div className="polymarket-stat">
          <span className="stat-label">Volume</span>
          <span className="stat-value">{formatVolume(market.volume)}</span>
        </div>
        <div className="polymarket-stat">
          <span className="stat-label">Liquidity</span>
          <span className="stat-value">{formatVolume(market.liquidity)}</span>
        </div>
      </div>
      {market.endDate && (
        <div className="polymarket-card-footer">
          <span className="polymarket-end-date">
            Ends: {new Date(market.endDate).toLocaleDateString()}
          </span>
        </div>
      )}
    </button>
  );
}

function MarketDetailModal({ market, onClose }) {
  if (!market) return null;

  return (
    <div className="polymarket-modal-backdrop" onClick={onClose}>
      <div className="polymarket-modal" onClick={(e) => e.stopPropagation()}>
        <div className="polymarket-modal-header">
          <div>
            <div className="polymarket-modal-title">{market.question}</div>
            {market.category && (
              <div className="polymarket-modal-category">{market.category}</div>
            )}
          </div>
          <button className="polymarket-modal-close" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>

        <div className="polymarket-modal-body">
          {market.description && (
            <div className="polymarket-description">
              <h4>Description</h4>
              <p>{market.description}</p>
            </div>
          )}

          <div className="polymarket-stats-grid">
            <div className="polymarket-stat-card">
              <div className="stat-label">Volume</div>
              <div className="stat-value large">{formatVolume(market.volume)}</div>
            </div>
            <div className="polymarket-stat-card">
              <div className="stat-label">Liquidity</div>
              <div className="stat-value large">{formatVolume(market.liquidity)}</div>
            </div>
          </div>

          {market.outcomes && market.outcomes.length > 0 && (
            <div className="polymarket-outcomes">
              <h4>Outcomes</h4>
              <div className="outcomes-list">
                {market.outcomes.map((outcome, idx) => (
                  <div key={idx} className="outcome-item">
                    <span className="outcome-name">{outcome}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {market.endDate && (
            <div className="polymarket-end-info">
              <strong>Market closes:</strong> {new Date(market.endDate).toLocaleString()}
            </div>
          )}

          {market.url && (
            <a
              href={market.url}
              target="_blank"
              rel="noopener noreferrer"
              className="polymarket-link-btn"
            >
              View on Polymarket →
            </a>
          )}
        </div>
      </div>
    </div>
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
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (markets && markets.length > 0 && !selectedMarket) {
      setSelectedMarket(markets[0]);
    }
  }, [markets, selectedMarket]);

  const handleSelectMarket = (market) => {
    setSelectedMarket(market);
  };

  const handleOpenModal = () => {
    if (selectedMarket) {
      setShowModal(true);
    }
  };

  if (!visible) return null;

  return (
    <>
      <div className="polymarket-panel" ref={panelRef}>
        <div className="polymarket-panel-header">
          <div className="polymarket-panel-title-section">
            <h3 className="polymarket-panel-title">
              {country ? `${country} Markets` : 'Polymarket'}
            </h3>
            <div className="polymarket-panel-subtitle">
              Prediction markets &gt; $1k volume
            </div>
          </div>
          <button
            className="polymarket-panel-close"
            onClick={onClose}
            aria-label="Close Polymarket panel"
          >
            x
          </button>
        </div>

        <div className="polymarket-panel-meta">
          <button
            className="polymarket-btn"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          {selectedMarket && (
            <button
              className="polymarket-btn ghost"
              onClick={handleOpenModal}
            >
              View Details
            </button>
          )}
          <div className="polymarket-meta-small">
            Updated {lastUpdated ? timeAgo(lastUpdated) : '--'}
          </div>
        </div>

        <div className="polymarket-content">
          {loading && markets.length === 0 && (
            <div className="polymarket-notice">Loading markets...</div>
          )}

          {error && !loading && (
            <div className="polymarket-notice error">
              {error.message || 'Failed to load markets'}
            </div>
          )}

          {!loading && !error && markets.length === 0 && (
            <div className="polymarket-notice">
              {country
                ? `No markets found for ${country}`
                : 'No markets available'}
            </div>
          )}

          {markets.length > 0 && (
            <div className="polymarket-grid">
              {markets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  onSelect={handleSelectMarket}
                  isSelected={selectedMarket?.id === market.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && selectedMarket && (
        <MarketDetailModal
          market={selectedMarket}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default PolymarketPanel;
