/**
 * CountryPanel Component
 * Displays country information when clicked
 */

import { useRef, useEffect, useState } from 'react';
import './country.css';

// Get current time for a UTC offset
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

export function CountryPanel({ data, position, onClose, onPositionChange, bounds }) {
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

  return (
    <div
      ref={panelRef}
      className="country-panel"
      style={{ left: position.x, top: position.y }}
      onMouseDown={onMouseDown}
    >
      <div className="country-panel-header">
        <div>
          <div className="country-panel-title">{data.name}</div>
          <div className="country-panel-subtitle">{data.leader || 'Unavailable'}</div>
        </div>
        <button className="country-panel-close" onClick={onClose} aria-label="Close">x</button>
      </div>
      <div className="country-panel-body">
        <div className="country-panel-row">
          <span>Population</span>
          <strong>{data.population}</strong>
        </div>
        {data.capital && (
          <div className="country-panel-row">
            <span>Capital</span>
            <strong>{data.capital}</strong>
          </div>
        )}
        {data.region && (
          <div className="country-panel-row">
            <span>Region</span>
            <strong>{data.region}{data.subregion ? ` - ${data.subregion}` : ''}</strong>
          </div>
        )}
        <div className="country-panel-row">
          <span>Timezone</span>
          <strong>{data.timezone}</strong>
        </div>
        <div className="country-panel-row">
          <span>Local Time</span>
          <strong>{getCurrentTimeForOffset(parseOffsetFromTimezone(data.timezone))}</strong>
        </div>
        {data.error && (
          <div className="country-panel-row">
            <span>Error</span>
            <strong>{data.error}</strong>
          </div>
        )}
        <div className="country-panel-note">Drag to move - Esc/x to close</div>
      </div>
    </div>
  );
}

export default CountryPanel;
