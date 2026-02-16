import { useEffect, useRef } from 'react';
import { TwinklingStarfieldLayer } from './TwinklingStarfieldLayer';

const LAYER_ID = 'starfield';

/**
 * useStarfield — adds a twinkling WebGL starfield layer to the MapLibre globe.
 *
 * Uses a custom MapLibre CustomLayerInterface that renders Three.js star
 * points directly in the map's WebGL context. Each star has a random
 * phase and speed so they twinkle independently via a time-driven sine wave.
 *
 * Listens for style reloads (e.g. projection changes) and re-adds the layer
 * so stars survive globe ↔ mercator toggles without a page refresh.
 */
export function useStarfield(map, enabled) {
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || !enabled) return;

    const addLayer = () => {
      if (map.getLayer(LAYER_ID)) return;

      const layer = new TwinklingStarfieldLayer({
        id: LAYER_ID,
        starCount: 4000,
        starSize: 2.0,
        starColor: 0xffffff,
      });
      layerRef.current = layer;

      // Add as the very first layer so it renders behind everything
      const firstLayerId = map.getStyle().layers?.[0]?.id;
      map.addLayer(layer, firstLayerId);
    };

    if (map.isStyleLoaded()) {
      addLayer();
    } else {
      map.once('style.load', addLayer);
    }

    // Re-add the layer after any style reload (e.g. projection switch)
    // so stars survive globe ↔ mercator toggles.
    const onStyleData = () => {
      if (!map.getLayer(LAYER_ID) && layerRef.current) {
        // Layer was wiped by a style reload — re-add it
        try {
          const firstLayerId = map.getStyle().layers?.[0]?.id;
          map.addLayer(layerRef.current, firstLayerId);
        } catch {
          // style may not be fully ready yet; next event will retry
        }
      }
    };
    map.on('styledata', onStyleData);

    return () => {
      map.off('styledata', onStyleData);
      try {
        if (map.getLayer(LAYER_ID)) {
          map.removeLayer(LAYER_ID);
        }
      } catch {
        // map may already be destroyed
      }
      layerRef.current = null;
    };
  }, [map, enabled]);
}
