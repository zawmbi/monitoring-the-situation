/**
 * CountryPanel Component
 * Fixed right-side panel showing country information (like Polymarket panel)
 */

import { useState } from 'react';
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

export function CountryPanel({ data, onClose, weather, weatherLoading, tempUnit = 'F', currencyData, currencyLoading }) {
  const [leaderImgError, setLeaderImgError] = useState(false);

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
            </div>
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
