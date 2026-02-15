/**
 * EarthOverlay - Transparent overlay layer above the Earth map for:
 * - Scanning sweep line animation
 * - Atmospheric electric blue glow (for 3D globe)
 * - Future: data indicators, highlighted regions
 *
 * DOES NOT block map interactions (pointer-events: none).
 * DOES NOT interfere with 2D/3D map logic.
 */
export default function EarthOverlay({ useGlobe = false }) {
  return (
    <>
      {/* Atmospheric glow - more visible in globe mode */}
      {useGlobe && (
        <div className="earth-atmosphere-glow" aria-hidden="true" />
      )}

      {/* Data overlay container with scanning line */}
      <div className="earth-data-overlay" aria-hidden="true">
        <div className="earth-scan-line" />
      </div>
    </>
  );
}
