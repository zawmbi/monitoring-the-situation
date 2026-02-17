export function timeAgo(dateString) {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function timeAgoShort(dateString) {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatClock(date) {
  if (!date) return '--';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatRange(start, end, timezone) {
  const tz = timezone ? ` (${timezone})` : '';
  return `${start || '?'} - ${end || '?'}${tz}`;
}

/**
 * Detect the user's IANA timezone from the browser (e.g. "America/New_York").
 * Falls back to UTC offset string.
 */
export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Get the short timezone abbreviation (e.g. "EST", "PST").
 */
export function getUserTimezoneAbbr() {
  try {
    const parts = Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(new Date());
    const tz = parts.find(p => p.type === 'timeZoneName');
    return tz ? tz.value : 'LOCAL';
  } catch {
    return 'LOCAL';
  }
}

/**
 * Get the user's UTC offset in hours (e.g. -5 for EST).
 */
export function getUserUtcOffset() {
  return -(new Date().getTimezoneOffset() / 60);
}
