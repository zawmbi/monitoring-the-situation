/**
 * CountryPanel Component
 * Fixed right-side panel showing country information (like Polymarket panel)
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { getLeaderApproval } from './leaderApproval';
import './country.css';

function getCurrentTimeForOffset(offsetHours) {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const targetTime = new Date(utc + (3600000 * offsetHours));
  const hours = targetTime.getHours();
  const minutes = targetTime.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

function parseOffsetFromTimezone(tzString) {
  const match = (tzString || '').match(/([-+]?\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  return Number.isFinite(val) ? val : 0;
}

function displayTemp(celsius, unit) {
  if (celsius == null) return '--';
  if (unit === 'F') return `${Math.round(celsius * 9 / 5 + 32)}°F`;
  return `${celsius}°C`;
}

function formatArea(area) {
  if (!area) return null;
  if (area >= 1_000_000) return `${(area / 1_000_000).toFixed(2)}M km²`;
  return `${area.toLocaleString()} km²`;
}

function formatPopDensity(pop, area) {
  if (!pop || !area) return null;
  const density = pop / area;
  if (density >= 1000) return `${(density / 1000).toFixed(1)}k/km²`;
  return `${Math.round(density)}/km²`;
}

/* ── Helpers ── */

function formatDateLabel(dateStr) {
  const [y, m] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function formatCountdown(dateStr) {
  const days = daysUntil(dateStr);
  if (days == null) return null;
  if (days === 0) return 'Today';
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const d = days % 30;
  const parts = [];
  if (years) parts.push(`${years}y`);
  if (months) parts.push(`${months}mo`);
  if (d && !years) parts.push(`${d}d`);
  return parts.join(' ') || '< 1d';
}

/* ── SVG approval chart ── */

function ApprovalChart({ history }) {
  const [hover, setHover] = useState(null);

  const W = 296, H = 140, PAD_L = 28, PAD_R = 8, PAD_T = 14, PAD_B = 24;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const { yMin, yMax, approvePoints, disapprovePoints, labels } = useMemo(() => {
    const allVals = history.flatMap(d => [d.approve, d.disapprove]);
    const lo = Math.max(0, Math.floor(Math.min(...allVals) / 5) * 5 - 5);
    const hi = Math.min(100, Math.ceil(Math.max(...allVals) / 5) * 5 + 5);
    const n = history.length;

    const toX = (i) => PAD_L + (i / Math.max(1, n - 1)) * chartW;
    const toY = (v) => PAD_T + (1 - (v - lo) / (hi - lo)) * chartH;

    return {
      yMin: lo,
      yMax: hi,
      approvePoints: history.map((d, i) => ({ x: toX(i), y: toY(d.approve), val: d.approve, date: d.date })),
      disapprovePoints: history.map((d, i) => ({ x: toX(i), y: toY(d.disapprove), val: d.disapprove, date: d.date })),
      labels: history.map((d, i) => ({ x: toX(i), label: formatDateLabel(d.date) })),
    };
  }, [history]);

  const makePath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const approvePath = makePath(approvePoints);
  const disapprovePath = makePath(disapprovePoints);

  // Y-axis grid lines
  const yTicks = [];
  const step = yMax - yMin <= 30 ? 5 : 10;
  for (let v = yMin; v <= yMax; v += step) {
    const y = PAD_T + (1 - (v - yMin) / (yMax - yMin)) * chartH;
    yTicks.push({ y, label: `${v}%` });
  }

  // Show ~4 evenly-spaced X labels
  const xLabelIndices = [];
  const labelCount = Math.min(4, labels.length);
  for (let i = 0; i < labelCount; i++) {
    xLabelIndices.push(Math.round((i / Math.max(1, labelCount - 1)) * (labels.length - 1)));
  }

  const handleHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let closest = 0;
    let closestDist = Infinity;
    approvePoints.forEach((p, i) => {
      const dist = Math.abs(p.x - mx);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    });
    setHover(closest);
  };

  return (
    <svg
      className="cp-approval-chart"
      viewBox={`0 0 ${W} ${H}`}
      onMouseMove={handleHover}
      onMouseLeave={() => setHover(null)}
    >
      {/* Grid */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD_L} x2={W - PAD_R} y1={t.y} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <text x={PAD_L - 4} y={t.y + 3} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end" fontFamily="inherit">{t.label}</text>
        </g>
      ))}

      {/* X labels */}
      {xLabelIndices.map(i => (
        <text key={i} x={labels[i].x} y={H - 4} fill="rgba(255,255,255,0.3)" fontSize="7.5" textAnchor="middle" fontFamily="inherit">
          {labels[i].label}
        </text>
      ))}

      {/* Disapprove line */}
      <path d={disapprovePath} fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
      {/* Approve line */}
      <path d={approvePath} fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />

      {/* Dots at endpoints */}
      {approvePoints.length > 0 && (
        <>
          <circle cx={approvePoints[approvePoints.length - 1].x} cy={approvePoints[approvePoints.length - 1].y} r="3" fill="#22c55e" />
          <circle cx={disapprovePoints[disapprovePoints.length - 1].x} cy={disapprovePoints[disapprovePoints.length - 1].y} r="3" fill="#ef4444" />
        </>
      )}

      {/* Hover crosshair */}
      {hover != null && approvePoints[hover] && (
        <g>
          <line x1={approvePoints[hover].x} x2={approvePoints[hover].x} y1={PAD_T} y2={PAD_T + chartH} stroke="rgba(255,255,255,0.15)" strokeWidth="0.7" strokeDasharray="3,2" />
          <circle cx={approvePoints[hover].x} cy={approvePoints[hover].y} r="3.5" fill="#22c55e" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          <circle cx={disapprovePoints[hover].x} cy={disapprovePoints[hover].y} r="3.5" fill="#ef4444" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />

          {/* Tooltip */}
          <rect
            x={Math.min(approvePoints[hover].x - 38, W - PAD_R - 78)}
            y={Math.max(2, PAD_T - 13)}
            width="76" height="14" rx="3"
            fill="rgba(0,0,0,0.75)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"
          />
          <text
            x={Math.min(approvePoints[hover].x, W - PAD_R - 40)}
            y={Math.max(11, PAD_T - 3)}
            fill="#eef2ff" fontSize="8" textAnchor="middle" fontFamily="inherit"
          >
            {formatDateLabel(approvePoints[hover].date)}
            {' \u2022 '}
            <tspan fill="#22c55e">{approvePoints[hover].val}%</tspan>
            {' / '}
            <tspan fill="#ef4444">{disapprovePoints[hover].val}%</tspan>
          </text>
        </g>
      )}
    </svg>
  );
}

/* ── Approval popup ── */

function ApprovalPopup({ countryName, leaderName, onClose }) {
  const popupRef = useRef(null);
  const approval = useMemo(() => getLeaderApproval(countryName), [countryName]);

  useEffect(() => {
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  if (!approval) return null;

  const latest = approval.approvalHistory[approval.approvalHistory.length - 1];
  const net = latest.approve - latest.disapprove;

  return (
    <div className="cp-approval-popup" ref={popupRef}>
      <div className="cp-approval-popup-header">
        <span className="cp-approval-popup-title">Approval Rating</span>
        <button className="cp-close cp-approval-popup-close" onClick={onClose} aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Current numbers */}
      <div className="cp-approval-current">
        <div className="cp-approval-stat">
          <span className="cp-approval-stat-val cp-approval-stat--approve">{latest.approve}%</span>
          <span className="cp-approval-stat-label">Approve</span>
        </div>
        <div className="cp-approval-stat">
          <span className="cp-approval-stat-val cp-approval-stat--disapprove">{latest.disapprove}%</span>
          <span className="cp-approval-stat-label">Disapprove</span>
        </div>
        <div className="cp-approval-stat">
          <span className={`cp-approval-stat-val ${net > 0 ? 'cp-approval-stat--approve' : net < 0 ? 'cp-approval-stat--disapprove' : ''}`}>
            {net > 0 ? '+' : ''}{net}
          </span>
          <span className="cp-approval-stat-label">Net</span>
        </div>
      </div>

      {/* Chart */}
      <div className="cp-approval-chart-wrap">
        <ApprovalChart history={approval.approvalHistory} />
        <div className="cp-approval-legend">
          <span className="cp-approval-legend-item"><span className="cp-approval-dot cp-approval-dot--approve" /> Approve</span>
          <span className="cp-approval-legend-item"><span className="cp-approval-dot cp-approval-dot--disapprove" /> Disapprove</span>
        </div>
      </div>

      {/* Political info */}
      <div className="cp-approval-info">
        {approval.party && (
          <div className="cp-detail-row">
            <span className="cp-detail-key">Party</span>
            <span className="cp-detail-val">{approval.party}</span>
          </div>
        )}
        {approval.governmentType && (
          <div className="cp-detail-row">
            <span className="cp-detail-key">System</span>
            <span className="cp-detail-val">{approval.governmentType}</span>
          </div>
        )}
        {approval.inaugurated && (
          <div className="cp-detail-row">
            <span className="cp-detail-key">Inaugurated</span>
            <span className="cp-detail-val">{new Date(approval.inaugurated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        )}
        {approval.termNumber && (
          <div className="cp-detail-row">
            <span className="cp-detail-key">Term</span>
            <span className="cp-detail-val">
              {approval.termNumber}{approval.termLimit ? ` of ${approval.termLimit}` : ''}
              {approval.termLimit && approval.termNumber >= approval.termLimit ? ' (final)' : ''}
            </span>
          </div>
        )}
        {approval.lastElection && (
          <div className="cp-detail-row">
            <span className="cp-detail-key">Last Election</span>
            <span className="cp-detail-val">{new Date(approval.lastElection).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        )}
        <div className="cp-detail-row">
          <span className="cp-detail-key">Next Election</span>
          <span className="cp-detail-val">
            {approval.nextElection
              ? <>{new Date(approval.nextElection).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} <span className="cp-approval-countdown">({formatCountdown(approval.nextElection)})</span></>
              : <span className="cp-muted">Suspended</span>
            }
          </span>
        </div>
      </div>

      {approval.note && (
        <div className="cp-approval-note">{approval.note}</div>
      )}
    </div>
  );
}

export function CountryPanel({ data, onClose, weather, weatherLoading, tempUnit = 'F', currencyData, currencyLoading }) {
  const [leaderImgError, setLeaderImgError] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const hasApproval = !!(data && getLeaderApproval(data.name));

  if (!data) return null;

  const localTime = getCurrentTimeForOffset(parseOffsetFromTimezone(data.timezone));
  const isScope = data.scope === 'state' || data.scope === 'province';
  const bgImage = weather?.image?.url;

  return (
    <div className="cp-panel">
      {/* Header */}
      <div className="cp-header">
        <div className="cp-header-left">
          {data.flag && <span className="cp-flag-emoji">{data.flag}</span>}
          <div>
            <h3 className="cp-title">{data.name}</h3>
            {data.officialName && data.officialName !== data.name && (
              <div className="cp-official-name">{data.officialName}</div>
            )}
            {data.region && (
              <span className="cp-subtitle">
                {data.region}{data.subregion ? ` — ${data.subregion}` : ''}
              </span>
            )}
          </div>
        </div>
        <button
          className="cp-close"
          onClick={onClose}
          aria-label="Close panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="cp-content">
        {/* Leader section */}
        {!isScope && data.leader && data.leader !== 'Unavailable' && data.leader !== 'Loading...' && (
          <div className="cp-section">
            <div className="cp-section-label">Head of State / Government</div>
            <div className="cp-leader-card">
              {data.leaderPhoto && !leaderImgError ? (
                <img
                  className="cp-leader-photo"
                  src={data.leaderPhoto}
                  alt={data.leader}
                  onError={() => setLeaderImgError(true)}
                />
              ) : (
                <div className="cp-leader-photo cp-leader-photo--placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className="cp-leader-info">
                <div className="cp-leader-name">{data.leader}</div>
                {data.leaderTitle && <div className="cp-leader-title">{data.leaderTitle}</div>}
              </div>
              {hasApproval && (
                <button
                  className="cp-approval-btn"
                  onClick={() => setShowApproval(true)}
                  aria-label="View approval rating"
                  title="Approval rating"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </button>
              )}
            </div>
            {showApproval && hasApproval && (
              <ApprovalPopup
                countryName={data.name}
                leaderName={data.leader}
                onClose={() => setShowApproval(false)}
              />
            )}
          </div>
        )}
        {!isScope && data.leader === 'Loading...' && (
          <div className="cp-section">
            <div className="cp-section-label">Head of State / Government</div>
            <div className="cp-loading-line" />
          </div>
        )}

        {/* Currency section */}
        {!isScope && data.currency && (
          <div className="cp-section">
            <div className="cp-section-label">Currency</div>
            <div className="cp-currency-card">
              <div className="cp-currency-main">
                <span className="cp-currency-symbol">{data.currency.symbol}</span>
                <div>
                  <div className="cp-currency-name">{data.currency.name}</div>
                  <div className="cp-currency-code">{data.currency.code}</div>
                </div>
              </div>
              {currencyLoading && !currencyData && (
                <div className="cp-currency-rate">
                  <div className="cp-loading-line cp-loading-line--small" />
                </div>
              )}
              {currencyData && (
                <div className="cp-currency-rate">
                  <div className="cp-currency-rate-value">
                    1 USD = {currencyData.rate.toFixed(2)} {currencyData.code}
                  </div>
                  <div className={`cp-currency-ytd ${currencyData.ytdChange > 0 ? 'positive' : currencyData.ytdChange < 0 ? 'negative' : ''}`}>
                    {currencyData.ytdChange > 0 ? '+' : ''}{currencyData.ytdChange.toFixed(2)}% YTD vs USD
                  </div>
                </div>
              )}
              {!currencyLoading && !currencyData && data.currency.code !== 'USD' && (
                <div className="cp-currency-rate">
                  <div className="cp-currency-rate-value cp-muted">Rate unavailable</div>
                </div>
              )}
              {data.currency.code === 'USD' && (
                <div className="cp-currency-rate">
                  <div className="cp-currency-rate-value">Base currency</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weather section */}
        {(weather || weatherLoading) && (
          <div className="cp-section">
            <div className="cp-section-label">Weather in {data.capital || data.name}</div>
            {weather ? (
              <div className="cp-weather-card">
                {bgImage && (
                  <div
                    className="cp-weather-bg"
                    style={{ backgroundImage: `url(${bgImage})` }}
                  />
                )}
                <div className="cp-weather-content">
                  <img
                    className="cp-weather-icon"
                    src={weather.iconUrl}
                    alt={weather.description}
                    width="48"
                    height="48"
                  />
                  <div className="cp-weather-main">
                    <span className="cp-weather-temp">{displayTemp(weather.temp, tempUnit)}</span>
                    <span className="cp-weather-desc">{weather.description}</span>
                  </div>
                  <div className="cp-weather-meta">
                    <span>{weather.humidity}% humidity</span>
                    <span>{weather.windSpeed} m/s wind</span>
                    <span>Feels like {displayTemp(weather.feelsLike, tempUnit)}</span>
                  </div>
                </div>
                {weather?.image?.credit && (
                  <div className="cp-photo-credit">
                    Photo by{' '}
                    <a href={weather.image.creditLink} target="_blank" rel="noopener noreferrer">
                      {weather.image.credit}
                    </a>
                    {' / Unsplash'}
                  </div>
                )}
              </div>
            ) : (
              <div className="cp-weather-card cp-weather-card--loading">
                <span className="cp-loading-dot" />
                <span>Fetching weather...</span>
              </div>
            )}
          </div>
        )}

        {/* Country details */}
        <div className="cp-section">
          <div className="cp-section-label">{isScope ? 'Details' : 'Country Details'}</div>
          <div className="cp-details-card">
            {data.population && data.population !== 'Loading...' && (
              <div className="cp-detail-row">
                <span className="cp-detail-key">Population</span>
                <span className="cp-detail-val">{data.population}</span>
              </div>
            )}
            {data.population === 'Loading...' && (
              <div className="cp-detail-row">
                <span className="cp-detail-key">Population</span>
                <div className="cp-loading-line cp-loading-line--small" />
              </div>
            )}
            {data.capital && (
              <div className="cp-detail-row">
                <span className="cp-detail-key">Capital</span>
                <span className="cp-detail-val">{data.capital}</span>
              </div>
            )}
            <div className="cp-detail-row">
              <span className="cp-detail-key">Local Time</span>
              <span className="cp-detail-val">{localTime} ({data.timezone})</span>
            </div>
            {!isScope && data.languages && data.languages.length > 0 && (
              <div className="cp-detail-row">
                <span className="cp-detail-key">Language{data.languages.length > 1 ? 's' : ''}</span>
                <span className="cp-detail-val">{data.languages.slice(0, 3).join(', ')}{data.languages.length > 3 ? ` +${data.languages.length - 3}` : ''}</span>
              </div>
            )}
            {!isScope && data.demonym && (
              <div className="cp-detail-row">
                <span className="cp-detail-key">Demonym</span>
                <span className="cp-detail-val">{data.demonym}</span>
              </div>
            )}
            {!isScope && data.area && (
              <div className="cp-detail-row">
                <span className="cp-detail-key">Area</span>
                <span className="cp-detail-val">{formatArea(data.area)}</span>
              </div>
            )}
            {!isScope && data.populationRaw && data.area && (
              <div className="cp-detail-row">
                <span className="cp-detail-key">Pop. Density</span>
                <span className="cp-detail-val">{formatPopDensity(data.populationRaw, data.area)}</span>
              </div>
            )}
            {!isScope && data.continent && (
              <div className="cp-detail-row">
                <span className="cp-detail-key">Continent</span>
                <span className="cp-detail-val">{data.continent}</span>
              </div>
            )}
          </div>
        </div>

        {/* Infrastructure & Communication */}
        {!isScope && (data.dialingCode || data.tld || data.drivingSide || data.timezoneCount || data.startOfWeek) && (
          <div className="cp-section">
            <div className="cp-section-label">Infrastructure</div>
            <div className="cp-details-card">
              {data.dialingCode && (
                <div className="cp-detail-row">
                  <span className="cp-detail-key">Dialing Code</span>
                  <span className="cp-detail-val">{data.dialingCode}</span>
                </div>
              )}
              {data.tld && (
                <div className="cp-detail-row">
                  <span className="cp-detail-key">Internet TLD</span>
                  <span className="cp-detail-val">{data.tld}</span>
                </div>
              )}
              {data.drivingSide && (
                <div className="cp-detail-row">
                  <span className="cp-detail-key">Driving Side</span>
                  <span className="cp-detail-val" style={{ textTransform: 'capitalize' }}>{data.drivingSide}</span>
                </div>
              )}
              {data.timezoneCount > 1 && (
                <div className="cp-detail-row">
                  <span className="cp-detail-key">Timezones</span>
                  <span className="cp-detail-val">{data.timezoneCount}</span>
                </div>
              )}
              {data.startOfWeek && (
                <div className="cp-detail-row">
                  <span className="cp-detail-key">Week Starts</span>
                  <span className="cp-detail-val" style={{ textTransform: 'capitalize' }}>{data.startOfWeek}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inequality / Indices */}
        {!isScope && data.gini && (
          <div className="cp-section">
            <div className="cp-section-label">Indices</div>
            <div className="cp-details-card">
              <div className="cp-detail-row">
                <span className="cp-detail-key">Gini Coefficient</span>
                <span className="cp-detail-val">{data.gini.value} ({data.gini.year})</span>
              </div>
              <div className="cp-gini-bar-container">
                <div className="cp-gini-bar">
                  <div className="cp-gini-fill" style={{ width: `${data.gini.value}%` }} />
                  <div className="cp-gini-marker" style={{ left: `${data.gini.value}%` }} />
                </div>
                <div className="cp-gini-labels">
                  <span>Equal</span>
                  <span>Unequal</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Geography notes */}
        {!isScope && (data.landlocked || data.latlng) && (
          <div className="cp-section">
            <div className="cp-section-label">Geography</div>
            <div className="cp-details-card">
              {data.latlng && (
                <div className="cp-detail-row">
                  <span className="cp-detail-key">Coordinates</span>
                  <span className="cp-detail-val">{data.latlng[0].toFixed(1)}°, {data.latlng[1].toFixed(1)}°</span>
                </div>
              )}
              {data.landlocked && (
                <div className="cp-detail-row">
                  <span className="cp-detail-key">Coastline</span>
                  <span className="cp-detail-val">Landlocked</span>
                </div>
              )}
              {data.borders && data.borders.length > 0 && (
                <div className="cp-detail-row">
                  <span className="cp-detail-key">Borders</span>
                  <span className="cp-detail-val">{data.borders.length} countries</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status badges */}
        {!isScope && (data.independent != null || data.unMember != null || data.cca2) && (
          <div className="cp-section">
            <div className="cp-section-label">Status</div>
            <div className="cp-badges">
              {data.independent && (
                <span className="cp-badge cp-badge--neutral">Independent</span>
              )}
              {data.unMember && (
                <span className="cp-badge cp-badge--accent">UN Member</span>
              )}
              {data.landlocked && (
                <span className="cp-badge cp-badge--neutral">Landlocked</span>
              )}
              {data.cca2 && (
                <span className="cp-badge cp-badge--neutral">ISO: {data.cca2}</span>
              )}
            </div>
          </div>
        )}

        {data.error && (
          <div className="cp-section">
            <div className="cp-error-notice">{data.error}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CountryPanel;
