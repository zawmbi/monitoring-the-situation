import React from 'react';

function getColor(lastUpdated) {
  if (!lastUpdated) return '#666';
  const age = Date.now() - new Date(lastUpdated).getTime();
  if (age < 5 * 60 * 1000) return '#4caf50';    // green: < 5 min
  if (age < 30 * 60 * 1000) return '#ff9800';    // orange: < 30 min
  if (age < 60 * 60 * 1000) return '#ff5722';    // red-orange: < 1 hr
  return '#f44336';                                 // red: > 1 hr
}

function formatAge(lastUpdated) {
  if (!lastUpdated) return 'Unknown';
  const age = Date.now() - new Date(lastUpdated).getTime();
  const mins = Math.floor(age / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function FreshnessIndicator({ lastUpdated, source }) {
  const color = getColor(lastUpdated);
  return (
    <span
      title={`${source || 'Data'}: ${lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Unknown'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '9px',
        color: 'rgba(255,255,255,0.4)',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      {formatAge(lastUpdated)}
    </span>
  );
}
