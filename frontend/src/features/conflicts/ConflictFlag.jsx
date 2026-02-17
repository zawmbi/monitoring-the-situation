/**
 * ConflictFlag — renders either an emoji flag or a military-style SVG icon
 * for non-state actors in civil conflicts.
 *
 * Usage: <ConflictFlag flag={summary.sideB.flag} color={summary.sideB.color} size={20} />
 *
 * If `flag` starts with 'svg:', renders a military icon.
 * Otherwise renders the emoji string as-is.
 */

const SVG_ICONS = {
  /** Armed militia / irregular forces — shield with crossed rifles */
  militia: (color, size) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 7v6c0 5.25 3.85 10.15 9 11.25C17.15 23.15 21 18.25 21 13V7L12 2z"
        fill={`${color}30`} stroke={color} strokeWidth="1.5" />
      <line x1="7" y1="8" x2="17" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="17" y1="8" x2="7" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="13" r="2" fill={color} opacity="0.7" />
    </svg>
  ),

  /** Paramilitary — military chevron badge */
  paramilitary: (color, size) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 7v6c0 5.25 3.85 10.15 9 11.25C17.15 23.15 21 18.25 21 13V7L12 2z"
        fill={`${color}30`} stroke={color} strokeWidth="1.5" />
      <polyline points="7,11 12,8 17,11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points="7,15 12,12 17,15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),

  /** Resistance / rebel movement — star inside circle */
  resistance: (color, size) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill={`${color}30`} stroke={color} strokeWidth="1.5" />
      <polygon
        points="12,4 14.5,9.5 20.5,9.8 15.8,13.8 17.3,19.6 12,16.5 6.7,19.6 8.2,13.8 3.5,9.8 9.5,9.5"
        fill={color} opacity="0.85" />
    </svg>
  ),
};

export default function ConflictFlag({ flag, color = '#ccc', size = 20 }) {
  if (!flag) return null;

  if (flag.startsWith('svg:')) {
    const iconKey = flag.slice(4);
    const renderer = SVG_ICONS[iconKey];
    if (renderer) {
      return <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>{renderer(color, size)}</span>;
    }
  }

  // Plain emoji — render as text
  return <span>{flag}</span>;
}
