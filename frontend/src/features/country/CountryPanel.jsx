/**
 * CountryPanel Component
 * Displays country information when clicked, with weather overlay
 */

import { useRef, useEffect, useState } from 'react';
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

export function CountryPanel({ data, position, onClose, onPositionChange, bounds, weather, weatherLoading, tempUnit = 'F' }) {
  const panelRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const clampPos = (x, y) => {
    if (!bounds) return { x, y };
    const pad = 16;
    const w = 320;
    const h = 220;
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

  if (!data || !position) return null;

  const bgImage = weather?.image?.url;
  const localTime = getCurrentTimeForOffset(parseOffsetFromTimezone(data.timezone));

  return (
    <div
      ref={panelRef}
      className="country-panel"
      style={{ left: position.x, top: position.y }}
      onMouseDown={onMouseDown}
    >
      {/* Weather background image */}
      {bgImage && (
        <div
          className="country-panel-weather-bg"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* Header with country name + close */}
      <div className="country-panel-header">
        <div>
          <div className="country-panel-title">{data.name}</div>
          {data.region && <div className="country-panel-subtitle">{data.region}{data.subregion ? ` — ${data.subregion}` : ''}</div>}
        </div>
        <button className="country-panel-close" onClick={onClose} aria-label="Close">x</button>
      </div>

      {/* Weather banner */}
      {weather && (
        <div className="country-panel-weather-banner">
          <img
            className="country-panel-weather-icon"
            src={weather.iconUrl}
            alt={weather.description}
            width="48"
            height="48"
          />
          <div className="country-panel-weather-main">
            <span className="country-panel-weather-temp">{displayTemp(weather.temp, tempUnit)}</span>
            <span className="country-panel-weather-desc">{weather.description}</span>
          </div>
          <div className="country-panel-weather-meta">
            <span>{weather.humidity}% humidity</span>
            <span>{weather.windSpeed} m/s wind</span>
            <span>Feels like {displayTemp(weather.feelsLike, tempUnit)}</span>
          </div>
        </div>
      )}
      {weatherLoading && !weather && (
        <div className="country-panel-weather-banner country-panel-weather-banner--loading">
          <span className="country-panel-weather-loading-dot" />
          <span>Fetching weather...</span>
        </div>
      )}

      {/* Info rows */}
      <div className="country-panel-body">
        {data.population && (
          <div className="country-panel-row">
            <span>Population</span>
            <strong>{data.population}</strong>
          </div>
        )}
        {data.capital && (
          <div className="country-panel-row">
            <span>Capital</span>
            <strong>{data.capital}</strong>
          </div>
        )}
        <div className="country-panel-row">
          <span>Local Time</span>
          <strong>{localTime} ({data.timezone})</strong>
        </div>
        {data.error && (
          <div className="country-panel-row country-panel-row--error">
            <span>Error</span>
            <strong>{data.error}</strong>
          </div>
        )}

        {/* Unsplash credit */}
        {weather?.image?.credit && (
          <div className="country-panel-photo-credit">
            Photo by{' '}
            <a href={weather.image.creditLink} target="_blank" rel="noopener noreferrer">
              {weather.image.credit}
            </a>
            {' / Unsplash'}
          </div>
        )}
        <div className="country-panel-note">Drag to move</div>
      </div>
    </div>
  );
}

export default CountryPanel;
