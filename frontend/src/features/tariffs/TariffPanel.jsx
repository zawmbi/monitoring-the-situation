/**
 * TariffPanel Component
 * Displays US tariff information for a selected country in a draggable popup.
 */

import { useRef, useEffect, useState } from 'react';
import { getTariffByName } from './tariffData';
import './tariffs.css';

export function TariffPanel({ countryName, position, onClose, onPositionChange, bounds }) {
  const panelRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const tariff = getTariffByName(countryName);

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
  const activeRates = goodsEntries.filter(([, r]) => r > 0).map(([, r]) => r);
  const bannedGoods = goodsEntries.filter(([, r]) => r === 0);
  const tariffedGoods = goodsEntries.filter(([, r]) => r > 0);
  const maxRate = Math.max(tariff.universal || 1, ...activeRates, 1);

  function rateBarColor(rate) {
    if (rate === 0) return 'var(--tariff-banned)';
    if (rate <= 10) return 'var(--tariff-low)';
    if (rate <= 25) return 'var(--tariff-mid)';
    if (rate <= 50) return 'var(--tariff-high)';
    return 'var(--tariff-extreme)';
  }

  return (
    <div
      ref={panelRef}
      className={`tariff-panel ${isEmbargo ? 'tariff-panel--embargo' : ''}`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={onMouseDown}
    >
      <div className="tariff-panel-header">
        <div>
          <div className="tariff-panel-title">US Tariffs on {tariff.country}</div>
          <div className="tariff-panel-subtitle">
            {isEmbargo ? 'Trade embargo' : isSanctioned ? 'Sanctioned — restricted trade' : 'Import tariff rates'}
          </div>
        </div>
        <button className="tariff-panel-close" onClick={onClose} aria-label="Close">x</button>
      </div>

      <div className="tariff-panel-body">
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
              style={{ '--bar-pct': `${Math.min(100, (tariff.universal / maxRate) * 100)}%`, '--bar-color': rateBarColor(tariff.universal) }}
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
                      style={{ '--bar-pct': `${Math.min(100, (rate / maxRate) * 100)}%`, '--bar-color': rateBarColor(rate) }}
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

        <div className="tariff-panel-note">Drag to move - Esc/x to close</div>
      </div>
    </div>
  );
}

export default TariffPanel;
