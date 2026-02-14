import { useState } from 'react';
import { timeAgo } from '../../utils/time';
import './financial.css';

// ── Formatters ──

const fmt = (v, decimals = 2) => {
  if (v == null || !Number.isFinite(Number(v))) return '--';
  return Number(v).toFixed(decimals);
};

const fmtChg = (v) => {
  if (v == null || !Number.isFinite(Number(v))) return '';
  const n = Number(v);
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;
};

const fmtPct = (v) => {
  if (v == null || !Number.isFinite(Number(v))) return '';
  const n = Number(v);
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
};

const chgClass = (v) => {
  if (v == null) return '';
  return Number(v) >= 0 ? 'fd-positive' : 'fd-negative';
};

// ── Mini sparkline SVG ──

function Sparkline({ history, width = 60, height = 20, color = '#60a5fa' }) {
  if (!history || history.length < 2) return null;
  const closes = history.map(h => h.close).filter(v => v != null);
  if (closes.length < 2) return null;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const points = closes.map((v, i) => {
    const x = (i / (closes.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="fd-sparkline">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── Yield Curve Chart ──

function YieldCurveChart({ points }) {
  if (!points || points.length < 2) return null;

  const W = 280, H = 100, PL = 32, PR = 8, PT = 8, PB = 22;
  const cw = W - PL - PR, ch = H - PT - PB;

  const yields = points.map(p => p.yield).filter(v => v != null);
  if (yields.length < 2) return null;
  const yMin = Math.floor(Math.min(...yields) * 2) / 2 - 0.25;
  const yMax = Math.ceil(Math.max(...yields) * 2) / 2 + 0.25;
  const yRange = yMax - yMin || 1;

  const toX = (i) => PL + (i / (points.length - 1)) * cw;
  const toY = (v) => PT + (1 - (v - yMin) / yRange) * ch;

  const path = points
    .filter(p => p.yield != null)
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(points.indexOf(p)).toFixed(1)},${toY(p.yield).toFixed(1)}`)
    .join(' ');

  // Y-axis ticks
  const yTicks = [];
  const step = yRange <= 2 ? 0.5 : 1;
  for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) {
    yTicks.push(v);
  }

  return (
    <svg className="fd-yield-chart" viewBox={`0 0 ${W} ${H}`}>
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PL} x2={W - PR} y1={toY(v)} y2={toY(v)} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <text x={PL - 4} y={toY(v) + 3} fill="rgba(255,255,255,0.35)" fontSize="7.5" textAnchor="end" fontFamily="inherit">{v.toFixed(1)}%</text>
        </g>
      ))}
      {points.map((p, i) => (
        <text key={i} x={toX(i)} y={H - 4} fill="rgba(255,255,255,0.4)" fontSize="7" textAnchor="middle" fontFamily="inherit">{p.maturity}</text>
      ))}
      <path d={path} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.filter(p => p.yield != null).map((p, i) => (
        <circle key={i} cx={toX(points.indexOf(p))} cy={toY(p.yield)} r="3" fill="#60a5fa" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
      ))}
    </svg>
  );
}

// ── Fear & Greed gauge ──

function FearGreedGauge({ score, label }) {
  if (score == null) return null;
  const pct = Math.max(0, Math.min(100, score));
  const color = pct <= 25 ? '#ef4444' : pct <= 45 ? '#f59e0b' : pct <= 55 ? '#a3a3a3' : pct <= 75 ? '#84cc16' : '#22c55e';
  return (
    <div className="fd-gauge">
      <div className="fd-gauge-bar">
        <div className="fd-gauge-fill" style={{ width: `${pct}%`, background: color }} />
        <div className="fd-gauge-marker" style={{ left: `${pct}%`, borderColor: color }} />
      </div>
      <div className="fd-gauge-labels">
        <span className="fd-gauge-fear">Fear</span>
        <span className="fd-gauge-score" style={{ color }}>{score}</span>
        <span className="fd-gauge-greed">Greed</span>
      </div>
      <div className="fd-gauge-label" style={{ color }}>{label}</div>
    </div>
  );
}

// ── Signal badge ──

function SignalBadge({ signal }) {
  if (!signal) return null;
  const colors = { elevated: '#ef4444', moderate: '#f59e0b', calm: '#22c55e' };
  return (
    <span className="fd-signal" style={{ color: colors[signal] || '#a3a3a3' }}>
      {signal.toUpperCase()}
    </span>
  );
}

// ── Main Panel ──

export function FinancialPanel({ data, loading, error, onRefresh }) {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggle = (id) => setExpandedSection(prev => prev === id ? null : id);

  if (loading && !data) {
    return (
      <div className="fd-panel">
        <div className="fd-loading">Loading financial data...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="fd-panel">
        <div className="fd-error">Financial data unavailable: {error.message}</div>
        <button className="fd-retry-btn" onClick={onRefresh}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const { yieldCurve, volatility, credit, dollarIndex, commodities, sovereignBonds, fearGreed } = data;

  return (
    <div className="fd-panel">
      {/* Header */}
      <div className="fd-header">
        <div className="fd-header-left">
          <span className="fd-title">Financial Data Terminal</span>
          <span className="fd-subtitle">Deep market intelligence</span>
        </div>
        <div className="fd-header-right">
          <button className="fd-refresh-btn" onClick={onRefresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          {data.lastUpdated && (
            <span className="fd-updated">{timeAgo(data.lastUpdated)}</span>
          )}
        </div>
      </div>

      {/* Fear & Greed */}
      {(fearGreed?.market || fearGreed?.crypto) && (
        <div className="fd-section">
          <div className="fd-section-title" onClick={() => toggle('fg')}>
            <span>Fear & Greed</span>
            <span className="fd-chevron">{expandedSection === 'fg' ? '\u25B2' : '\u25BC'}</span>
          </div>
          <div className={`fd-section-body ${expandedSection === 'fg' ? '' : 'fd-collapsed'}`}>
            <div className="fd-fg-grid">
              {fearGreed.market && (
                <div className="fd-fg-item">
                  <div className="fd-fg-label">Market Sentiment</div>
                  <FearGreedGauge score={fearGreed.market.score} label={fearGreed.market.label} />
                </div>
              )}
              {fearGreed.crypto && (
                <div className="fd-fg-item">
                  <div className="fd-fg-label">Crypto Sentiment</div>
                  <FearGreedGauge score={fearGreed.crypto.score} label={fearGreed.crypto.label} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* US Treasury Yield Curve */}
      {yieldCurve && yieldCurve.points?.length > 0 && (
        <div className="fd-section">
          <div className="fd-section-title" onClick={() => toggle('yield')}>
            <span>
              US Treasury Yield Curve
              {yieldCurve.inverted && <span className="fd-badge fd-badge--warn">INVERTED</span>}
            </span>
            <span className="fd-chevron">{expandedSection === 'yield' ? '\u25B2' : '\u25BC'}</span>
          </div>
          <div className={`fd-section-body ${expandedSection === 'yield' ? '' : 'fd-collapsed'}`}>
            <YieldCurveChart points={yieldCurve.points} />
            <div className="fd-yield-table">
              {yieldCurve.points.map((p) => (
                <div key={p.maturity} className="fd-yield-row">
                  <span className="fd-yield-mat">{p.maturity}</span>
                  <span className="fd-yield-val">{fmt(p.yield, 3)}%</span>
                  <span className={`fd-yield-chg ${chgClass(p.change)}`}>{fmtChg(p.change)}</span>
                </div>
              ))}
            </div>
            {yieldCurve.spreads && (
              <div className="fd-spreads">
                <div className="fd-spread-title">Key Spreads</div>
                <div className="fd-spread-grid">
                  {Object.entries(yieldCurve.spreads).map(([key, val]) => (
                    val != null && (
                      <div key={key} className="fd-spread-item">
                        <span className="fd-spread-label">{key}</span>
                        <span className={`fd-spread-val ${val < 0 ? 'fd-negative' : 'fd-positive'}`}>
                          {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Volatility */}
      {volatility?.length > 0 && (
        <div className="fd-section">
          <div className="fd-section-title" onClick={() => toggle('vol')}>
            <span>Volatility Indices</span>
            <span className="fd-chevron">{expandedSection === 'vol' ? '\u25B2' : '\u25BC'}</span>
          </div>
          <div className={`fd-section-body ${expandedSection === 'vol' ? '' : 'fd-collapsed'}`}>
            <div className="fd-vol-grid">
              {volatility.map((v) => (
                <div key={v.symbol} className="fd-vol-card">
                  <div className="fd-vol-header">
                    <span className="fd-vol-name">{v.name}</span>
                    <SignalBadge signal={v.signal} />
                  </div>
                  <div className="fd-vol-level">{fmt(v.level, 2)}</div>
                  <div className={`fd-vol-change ${chgClass(v.change)}`}>
                    {fmtChg(v.change)} ({fmtPct(v.changePercent)})
                  </div>
                  <div className="fd-vol-desc">{v.description}</div>
                  <Sparkline history={v.history} color={v.signal === 'elevated' ? '#ef4444' : v.signal === 'moderate' ? '#f59e0b' : '#60a5fa'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dollar Index */}
      {dollarIndex && (
        <div className="fd-section">
          <div className="fd-section-title" onClick={() => toggle('dxy')}>
            <span>US Dollar Index (DXY)</span>
            <span className="fd-chevron">{expandedSection === 'dxy' ? '\u25B2' : '\u25BC'}</span>
          </div>
          <div className={`fd-section-body ${expandedSection === 'dxy' ? '' : 'fd-collapsed'}`}>
            <div className="fd-dxy-card">
              <div className="fd-dxy-price">{fmt(dollarIndex.price, 3)}</div>
              <div className={`fd-dxy-change ${chgClass(dollarIndex.change)}`}>
                {fmtChg(dollarIndex.change)} ({fmtPct(dollarIndex.changePercent)})
              </div>
              {dollarIndex.dayHigh != null && (
                <div className="fd-dxy-range">
                  Day: {fmt(dollarIndex.dayLow, 2)} — {fmt(dollarIndex.dayHigh, 2)}
                </div>
              )}
              <div className="fd-dxy-desc">{dollarIndex.description}</div>
              <Sparkline history={dollarIndex.history} width={120} height={28} />
            </div>
          </div>
        </div>
      )}

      {/* Credit / CDS Proxies */}
      {credit?.length > 0 && (
        <div className="fd-section">
          <div className="fd-section-title" onClick={() => toggle('credit')}>
            <span>Credit & CDS Proxies</span>
            <span className="fd-chevron">{expandedSection === 'credit' ? '\u25B2' : '\u25BC'}</span>
          </div>
          <div className={`fd-section-body ${expandedSection === 'credit' ? '' : 'fd-collapsed'}`}>
            <div className="fd-credit-note">
              ETF prices as proxies for credit spreads. Falling HYG/JNK = widening credit spreads = risk-off.
            </div>
            <div className="fd-credit-grid">
              {credit.map((c) => (
                <div key={c.symbol} className="fd-credit-card">
                  <div className="fd-credit-header">
                    <span className="fd-credit-ticker">{c.symbol}</span>
                    <span className="fd-credit-cat">{c.category}</span>
                  </div>
                  <div className="fd-credit-name">{c.name}</div>
                  <div className="fd-credit-price">${fmt(c.price)}</div>
                  <div className={`fd-credit-change ${chgClass(c.changePercent)}`}>
                    {fmtChg(c.change)} ({fmtPct(c.changePercent)})
                  </div>
                  <Sparkline history={c.history} color={Number(c.changePercent) >= 0 ? '#22c55e' : '#ef4444'} />
                  <div className="fd-credit-desc">{c.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Extended Commodities */}
      {commodities && Object.keys(commodities).length > 0 && (
        <div className="fd-section">
          <div className="fd-section-title" onClick={() => toggle('comm')}>
            <span>Extended Commodities</span>
            <span className="fd-chevron">{expandedSection === 'comm' ? '\u25B2' : '\u25BC'}</span>
          </div>
          <div className={`fd-section-body ${expandedSection === 'comm' ? '' : 'fd-collapsed'}`}>
            {Object.entries(commodities).map(([category, items]) => (
              <div key={category} className="fd-comm-category">
                <div className="fd-comm-cat-title">{category}</div>
                <div className="fd-comm-grid">
                  {items.map((c) => (
                    <div key={c.symbol} className="fd-comm-card">
                      <div className="fd-comm-name">{c.name}</div>
                      <div className="fd-comm-price">
                        ${fmt(c.price)}{c.unit && <span className="fd-comm-unit">{c.unit}</span>}
                      </div>
                      <div className={`fd-comm-change ${chgClass(c.changePercent)}`}>
                        {fmtPct(c.changePercent)}
                      </div>
                      <Sparkline history={c.history} color={Number(c.changePercent) >= 0 ? '#22c55e' : '#ef4444'} width={50} height={16} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sovereign Bond Yields */}
      {sovereignBonds?.length > 0 && (
        <div className="fd-section">
          <div className="fd-section-title" onClick={() => toggle('sov')}>
            <span>Sovereign 10Y Bond Yields</span>
            <span className="fd-chevron">{expandedSection === 'sov' ? '\u25B2' : '\u25BC'}</span>
          </div>
          <div className={`fd-section-body ${expandedSection === 'sov' ? '' : 'fd-collapsed'}`}>
            <div className="fd-sov-grid">
              {sovereignBonds.map((s) => (
                <div key={s.country} className="fd-sov-card">
                  <span className="fd-sov-country">{s.country}</span>
                  <span className="fd-sov-name">{s.name}</span>
                  <span className="fd-sov-yield">{fmt(s.yield, 3)}%</span>
                  <span className={`fd-sov-change ${chgClass(s.change)}`}>
                    {fmtChg(s.change)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fd-footer">
        Data via Yahoo Finance & alternative.me. CDS proxies derived from credit ETF prices. Not financial advice.
      </div>
    </div>
  );
}

export default FinancialPanel;
