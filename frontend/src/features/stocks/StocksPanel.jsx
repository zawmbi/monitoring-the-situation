import { useEffect, useMemo, useState, useRef } from 'react';
import { formatClock, timeAgo } from '../../utils/time';
import './stocks.css';

const formatPrice = (value) => {
  if (value === null || value === undefined) return '--';
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return `$${num.toFixed(2)}`;
};

const formatChange = (change, percent) => {
  const hasChange = change !== null && change !== undefined && Number.isFinite(Number(change));
  const hasPercent = percent !== null && percent !== undefined && Number.isFinite(Number(percent));
  if (!hasChange && !hasPercent) return '--';
  const changeVal = hasChange ? `${Number(change) >= 0 ? '+' : ''}${Number(change).toFixed(2)}` : '';
  const percentVal = hasPercent ? `${Number(percent) >= 0 ? '+' : ''}${Number(percent).toFixed(2)}%` : '';
  if (hasChange && hasPercent) return `${changeVal} (${percentVal})`;
  return changeVal || percentVal;
};

function StocksList({ stocks = [], loading, error, onSelectStock, selectedSymbol }) {
  const visible = (stocks || []).slice(0, 100);
  return (
    <div className="stocks-list">
      <div className="stocks-header">
        <h3 className="stocks-title">Top 100 movers</h3>
        <div className="stocks-subtitle">Alpha Vantage live snapshot</div>
      </div>
      {loading && <div className="notice">Loading stocks...</div>}
      {error && !loading && <div className="notice">Stocks unavailable: {error.message}</div>}
      {!loading && !error && (
        <div className="stocks-grid">
          {visible.map((stock, idx) => (
            <button
              key={stock.symbol || stock.id || idx}
              type="button"
              className={`stock-item ${selectedSymbol === stock.symbol ? 'selected' : ''}`}
              onClick={() => onSelectStock && onSelectStock(stock)}
            >
              <div className="stock-rank">#{idx + 1}</div>
              <div className="stock-name-block">
                <div className="stock-symbol">{stock.symbol || '?'}</div>
                <div className="stock-name">{stock.name || 'Unknown'}</div>
                <div className="stock-meta">
                  {[stock.exchange, stock.region].filter(Boolean).join(' - ') || '--'}
                </div>
              </div>
              <div className="stock-price">{formatPrice(stock.price)}</div>
              <div className={`stock-change ${Number(stock.change) >= 0 ? 'positive' : 'negative'}`}>
                {formatChange(stock.change, stock.changePercent)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StocksMetaBar({ localClock, market, onOpenModal, onRefresh, loading, lastUpdated }) {
  return (
    <div className="stocks-meta-bar">
      <div className="stocks-meta-block">
        <div className="stocks-meta-label">Local time</div>
        <div className="stocks-meta-value">{formatClock(localClock)}</div>
      </div>
      {market && (
        <div className="stocks-meta-block">
          <div className="stocks-meta-label">{market.region} market</div>
          <div className={`stocks-meta-value status-${market.status || 'unknown'}`}>
            {market.status || 'unknown'}
          </div>
          <div className="stocks-meta-small">
            {market.localOpen || '?'} - {market.localClose || '?'} {market.timezone ? `(${market.timezone})` : ''}
          </div>
        </div>
      )}
      <div className="stocks-meta-actions">
        <button className="stocks-btn" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh now'}
        </button>
        <button className="stocks-btn ghost" onClick={onOpenModal}>
          Go to stocks popup
        </button>
      </div>
      <div className="stocks-meta-small">Updated {lastUpdated ? timeAgo(lastUpdated) : '--'}</div>
    </div>
  );
}

function StocksModal({
  open,
  onClose,
  stocks,
  marketStatus,
  selectedStock,
  onSelectStock,
  localClock,
  lastUpdated,
  loading,
}) {
  if (!open) return null;

  const international = (stocks || []).filter(stock => stock.region && stock.region !== 'United States').slice(0, 30);
  const focus = selectedStock || stocks?.[0];

  return (
    <div className="stocks-modal-backdrop" onClick={onClose}>
      <div className="stocks-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stocks-modal-header">
          <div>
            <div className="stocks-modal-title">Global stocks snapshot</div>
            <div className="stocks-modal-subtitle">
              Live from Alpha Vantage - {formatClock(localClock)} local - {lastUpdated ? `updated ${timeAgo(lastUpdated)}` : 'awaiting data'}
            </div>
          </div>
          <button className="stocks-modal-close" onClick={onClose} aria-label="Close stocks popup">x</button>
        </div>

        <div className="stocks-modal-body">
          <div className="stocks-modal-column">
            <div className="stock-detail-card">
              <div className="stock-detail-title">{focus?.symbol || 'Select a ticker'}</div>
              <div className="stock-detail-name">{focus?.name || 'Waiting for selection'}</div>
              <div className="stock-detail-meta">
                {[focus?.exchange, focus?.region].filter(Boolean).join(' - ') || 'Unknown listing'}
              </div>
              <div className="stock-detail-stats">
                <div>
                  <div className="stocks-meta-label">Last price</div>
                  <div className="stocks-meta-value">{formatPrice(focus?.price)}</div>
                </div>
                <div>
                  <div className="stocks-meta-label">Move</div>
                  <div className={`stocks-meta-value ${Number(focus?.change) >= 0 ? 'positive' : 'negative'}`}>
                    {formatChange(focus?.change, focus?.changePercent)}
                  </div>
                </div>
                <div>
                  <div className="stocks-meta-label">Volume</div>
                  <div className="stocks-meta-value">
                    {focus?.volume ? focus.volume.toLocaleString() : '--'}
                  </div>
                </div>
              </div>
            </div>

            <div className="stocks-scroll-list">
              {(international.length ? international : stocks || []).slice(0, 50).map((stock, idx) => (
                <button
                  key={`${stock.symbol || 'stock'}-${idx}`}
                  type="button"
                  className={`stock-item compact ${selectedStock?.symbol === stock.symbol ? 'selected' : ''}`}
                  onClick={() => onSelectStock && onSelectStock(stock)}
                >
                  <div className="stock-rank">#{idx + 1}</div>
                  <div className="stock-name-block">
                    <div className="stock-symbol">{stock.symbol || '?'}</div>
                    <div className="stock-name">{stock.name || 'Unknown'}</div>
                    <div className="stock-meta">
                      {[stock.exchange, stock.region].filter(Boolean).join(' - ') || '--'}
                    </div>
                  </div>
                  <div className="stock-price">{formatPrice(stock.price)}</div>
                  <div className={`stock-change ${Number(stock.change) >= 0 ? 'positive' : 'negative'}`}>
                    {formatChange(stock.change, stock.changePercent)}
                  </div>
                </button>
              ))}
              {!stocks?.length && !loading && (
                <div className="notice">No stocks to show yet.</div>
              )}
            </div>
          </div>

          <div className="stocks-modal-column">
            <div className="market-status-grid">
              {marketStatus?.length ? (
                marketStatus.map((market, idx) => (
                  <div key={`${market.region || 'region'}-${idx}`} className="market-status-card">
                    <div className="market-status-top">
                      <div className="market-region">{market.region}</div>
                      <div className={`market-badge status-${market.status || 'unknown'}`}>
                        {market.status || 'unknown'}
                      </div>
                    </div>
                    <div className="market-window">
                      {market.localOpen || '?'} - {market.localClose || '?'} {market.timezone ? `(${market.timezone})` : ''}
                    </div>
                    <div className="market-exchanges">{market.primaryExchanges}</div>
                    {market.notes && <div className="market-notes">{market.notes}</div>}
                  </div>
                ))
              ) : (
                <div className="notice">Market status unavailable.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StocksPanel({
  visible,
  stocks,
  marketStatus,
  loading,
  error,
  lastUpdated,
  onClose,
  onRefresh,
}) {
  const [selectedStock, setSelectedStock] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [localClock, setLocalClock] = useState(() => new Date());
  const [pos, setPos] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setInterval(() => setLocalClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (stocks && stocks.length && !selectedStock) {
      setSelectedStock(stocks[0]);
    }
  }, [stocks, selectedStock]);

  const primaryMarket = useMemo(() => {
    if (!marketStatus || !marketStatus.length) return null;
    return marketStatus.find((m) => m.region === 'United States') || marketStatus[0];
  }, [marketStatus]);

  const onMouseDown = (e) => {
    if (e.target.closest('button, a, input, .stocks-list')) return;
    setIsDragging(true);
    const currentX = pos.x != null ? pos.x : e.currentTarget.getBoundingClientRect().left;
    const currentY = pos.y != null ? pos.y : e.currentTarget.getBoundingClientRect().top;
    if (pos.x == null) setPos({ x: currentX, y: currentY });
    dragOffset.current = { x: e.clientX - currentX, y: e.clientY - currentY };
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const nextX = Math.max(0, e.clientX - dragOffset.current.x);
      const nextY = Math.max(0, e.clientY - dragOffset.current.y);
      setPos({ x: nextX, y: nextY });
    };
    const onUp = () => setIsDragging(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  if (!visible) return null;

  const panelStyle = pos.x != null
    ? { left: pos.x, top: pos.y, right: 'auto' }
    : {};

  return (
    <>
      <div
        className={`stocks-panel${isDragging ? ' stocks-panel--dragging' : ''}`}
        style={panelStyle}
        onMouseDown={onMouseDown}
      >
        <div className="stocks-panel-header">
          <span className="stocks-panel-drag-hint">Drag to move</span>
        </div>
        <StocksMetaBar
          localClock={localClock}
          market={primaryMarket}
          onOpenModal={() => setShowModal(true)}
          onRefresh={onRefresh}
          loading={loading}
          lastUpdated={lastUpdated}
        />
        <StocksList
          stocks={stocks}
          loading={loading}
          error={error}
          onSelectStock={setSelectedStock}
          selectedSymbol={selectedStock?.symbol}
        />
      </div>
      <StocksModal
        open={showModal}
        onClose={() => setShowModal(false)}
        stocks={stocks}
        marketStatus={marketStatus}
        selectedStock={selectedStock}
        onSelectStock={setSelectedStock}
        localClock={localClock}
        lastUpdated={lastUpdated}
        loading={loading}
      />
    </>
  );
}

export default StocksPanel;
