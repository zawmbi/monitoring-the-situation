/**
 * Hook to lazily fetch UK nations boundary GeoJSON.
 * Only downloads when UK nations are toggled on.
 * Uses georgique/world-geojson for reliable boundaries,
 * then injects nation names into the empty properties.
 */
import { useState, useEffect } from 'react';

const BASE_URL =
  'https://raw.githubusercontent.com/georgique/world-geojson/develop/areas/united_kingdom';

const NATIONS = [
  { file: 'england.json', name: 'England' },
  { file: 'scotland.json', name: 'Scotland' },
  { file: 'wales.json', name: 'Wales' },
  { file: 'northern_ireland.json', name: 'Northern Ireland' },
];

let cachedData = null;

export function useUKNations(enabled) {
  const [data, setData] = useState(cachedData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || cachedData) {
      if (cachedData) setData(cachedData);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      NATIONS.map(async (nation) => {
        const res = await fetch(`${BASE_URL}/${nation.file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${nation.file}`);
        const geojson = await res.json();
        // Each file is a FeatureCollection with possibly multiple polygons
        // (islands etc.). Merge them all under one name.
        return (geojson.features || []).map((f) => ({
          ...f,
          properties: {
            ...f.properties,
            name: nation.name,
          },
        }));
      })
    )
      .then((allFeatureArrays) => {
        if (cancelled) return;
        const features = allFeatureArrays.flat().map((f, i) => ({
          ...f,
          id: i,
          properties: {
            ...f.properties,
            originalId: String(i),
          },
        }));
        const result = { type: 'FeatureCollection', features };
        cachedData = result;
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[useUKNations] Failed to load UK GeoJSON:', err);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [enabled]);

  return { data, loading };
}
