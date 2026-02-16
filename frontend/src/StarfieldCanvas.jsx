import { useEffect, useRef } from 'react';
import { MaplibreStarfieldLayer } from '@geoql/maplibre-gl-starfield';

const LAYER_ID = 'starfield';

/**
 * useStarfield — adds a WebGL starfield layer to the MapLibre globe.
 *
 * Uses @geoql/maplibre-gl-starfield which implements MapLibre's
 * CustomLayerInterface and renders star points via Three.js directly
 * in the map's WebGL context. Stars are depth-pushed behind the globe,
 * so no CSS masks or z-index hacks are needed.
 */
export function useStarfield(map, enabled) {
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || !enabled) return;

    // Wait for style to be loaded
    const addLayer = () => {
      if (map.getLayer(LAYER_ID)) return;

      const layer = new MaplibreStarfieldLayer({
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

    return () => {
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
