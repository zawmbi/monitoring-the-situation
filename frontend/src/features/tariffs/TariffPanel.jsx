/**
 * TariffPanel Component
 * Displays US tariff information for a selected country in a draggable popup.
 * Includes live tariff news feed and sector-specific tariff breakdowns.
 */

import { useRef, useEffect, useState } from 'react';
import { getTariffByName } from './tariffData';
import useTariffData from '../../hooks/useTariffData';
import InlineMarkets from '../../components/InlineMarkets';
import { timeAgo } from '../../utils/time';
import './tariffs.css';

/* Fixed scale max for bars — 200% gives meaningful visual range */
const BAR_SCALE_MAX = 200;

function rateBarColor(rate) {
  if (rate === 0) return 'var(--tariff-banned)';
  if (rate <= 10) return 'var(--tariff-low)';
  if (rate <= 25) return 'var(--tariff-mid)';
  if (rate <= 50) return 'var(--tariff-high)';
  return 'var(--tariff-extreme)';
}

export function TariffPanel({ countryName, position, onClose, onPositionChange, bounds }) {
  const panelRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tab, setTab] = useState('rates');
  const dragOffset = useRef({ x: 0, y: 0 });

  const tariff = getTariffByName(countryName);
  const { news, loading, lastUpdated } = useTariffData(true);

  const clampPos = (x, y) => {
    if (!bounds) return { x, y };
    const pad = 16;
    const w = 360;
    const h = 400;
    return {
      x: Math.max(pad, Math.min(x, bounds.width - w - pad)),
      y: Math.max(pad + 40, Math.min(y, bounds.height - h - pad)),
    };
  };

  const onMouseDown = (e) => {
    if (e.target.closest('button, a')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging) return;
      const next = clampPos(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y);
      onPositionChange(next);
    };
    const onUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, onPositionChange, bounds]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!tariff || !position) return null;

  const isEmbargo = tariff.embargo === true;
  const isSanctioned = tariff.sanctioned === true;
  const goodsEntries = Object.entries(tariff.goods || {});
  const bannedGoods = goodsEntries.filter(([, r]) => r === 0);
  const tariffedGoods = goodsEntries.filter(([, r]) => r > 0);

  // Filter news relevant to this country
  const countryLower = countryName.toLowerCase();
  const countryNews = news.filter((item) => {
    const text = (item.title + ' ' + (item.summary || '')).toLowerCase();
    return text.includes(countryLower);
  });
  // Show country-specific news first, then general tariff news
  const displayNews = countryNews.length > 0
    ? [...countryNews, ...news.filter((n) => !countryNews.includes(n))]
    : news;

  return (
    <div
      ref={panelRef}
      className={`tariff-panel ${isEmbargo ? 'tariff-panel--embargo' : ''}`}
    >
      <div className="tariff-panel-header">
        <div>
          <div className="tariff-panel-title">US Tariffs on {tariff.country}</div>
          <div className="tariff-panel-subtitle">
            {isEmbargo ? 'Trade embargo' : isSanctioned ? 'Sanctioned — restricted trade' : 'Import tariff rates'}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tariff-tabs">
        <button className={`tariff-tab ${tab === 'rates' ? 'tariff-tab--active' : ''}`} onClick={() => setTab('rates')}>
          Rates
        </button>
        <button className={`tariff-tab ${tab === 'news' ? 'tariff-tab--active' : ''}`} onClick={() => setTab('news')}>
          Live News
          {news.length > 0 && <span className="tariff-tab-count">{news.length}</span>}
        </button>
        <button className={`tariff-tab ${tab === 'markets' ? 'tariff-tab--active' : ''}`} onClick={() => setTab('markets')}>
          Markets
        </button>
      </div>

      <div className="tariff-panel-body">
        {tab === 'rates' && (
          <>
            {/* Embargo display */}
            {isEmbargo ? (
              <div className="tariff-universal tariff-universal--embargo">
                <div className="tariff-universal-label">Trade Status</div>
                <div className="tariff-embargo-badge">EMBARGO</div>
                <div className="tariff-embargo-desc">All trade prohibited by US sanctions</div>
              </div>
            ) : (
              /* Universal Rate - Hero */
              <div className={`tariff-universal ${isSanctioned ? 'tariff-universal--sanctioned' : ''}`}>
                <div className="tariff-universal-label">
                  Universal Tariff Rate
                  {isSanctioned && <span className="tariff-sanctioned-tag">SANCTIONED</span>}
                </div>
                <div className="tariff-universal-rate" style={{ color: rateBarColor(tariff.universal) }}>
                  {tariff.universal}%
                </div>
                <div
                  className="tariff-bar"
                  style={{ '--bar-pct': `${Math.min(100, (tariff.universal / BAR_SCALE_MAX) * 100)}%`, '--bar-color': rateBarColor(tariff.universal) }}
                />
              </div>
            )}

            {/* Banned goods (rate === 0) for sanctioned countries */}
            {!isEmbargo && bannedGoods.length > 0 && (
              <div className="tariff-goods">
                <div className="tariff-goods-title tariff-goods-title--banned">Banned Imports</div>
                <div className="tariff-goods-list">
                  {bannedGoods.map(([good]) => (
                    <div key={good} className="tariff-good-row tariff-good-row--banned">
                      <span className="tariff-good-name">{good}</span>
                      <span className="tariff-banned-label">BANNED</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tariffed goods */}
            {!isEmbargo && tariffedGoods.length > 0 && (
              <div className="tariff-goods">
                <div className="tariff-goods-title">Sector-Specific Tariffs</div>
                <div className="tariff-goods-list">
                  {tariffedGoods.map(([good, rate]) => (
                    <div key={good} className="tariff-good-row">
                      <span className="tariff-good-name">{good}</span>
                      <div className="tariff-good-rate-wrap">
                        <div
                          className="tariff-good-bar"
                          style={{ '--bar-pct': `${Math.min(100, (rate / BAR_SCALE_MAX) * 100)}%`, '--bar-color': rateBarColor(rate) }}
                        />
                        <span className="tariff-good-rate" style={{ color: rateBarColor(rate) }}>
                          {rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {tariff.notes && (
              <div className={`tariff-notes ${isEmbargo ? 'tariff-notes--embargo' : ''}`}>{tariff.notes}</div>
            )}
          </>
        )}

        {tab === 'news' && (
          <div className="tariff-news-feed">
            {loading && news.length === 0 && (
              <div className="tariff-news-loading">Loading tariff news...</div>
            )}
            {!loading && displayNews.length === 0 && (
              <div className="tariff-news-empty">No tariff news available</div>
            )}
            {displayNews.slice(0, 15).map((item) => {
              const isCountryRelated = countryNews.includes(item);
              return (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`tariff-news-item ${isCountryRelated ? 'tariff-news-item--relevant' : ''}`}
                >
                  <div className="tariff-news-title">{item.title}</div>
                  {item.summary && (
                    <div className="tariff-news-summary">{item.summary.substring(0, 120)}...</div>
                  )}
                  <div className="tariff-news-meta">
                    <span>{item.source}</span>
                    <span>{timeAgo(item.publishedAt)}</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {tab === 'markets' && (
          <div style={{ padding: '8px 0' }}>
            <InlineMarkets
              keywords={['tariff', 'trade', 'import', 'export', countryName]}
              title="Trade & Tariff Markets"
              enabled={true}
              maxItems={6}
            />
          </div>
        )}

        <div className="tariff-panel-footer-row">
          {lastUpdated && (
            <span className="tariff-live-updated">Live data {timeAgo(lastUpdated)}</span>
          )}
          <span className="tariff-panel-note">Drag to move · Esc to close</span>
        </div>
      </div>
    </div>
  );
}

export default TariffPanel;
