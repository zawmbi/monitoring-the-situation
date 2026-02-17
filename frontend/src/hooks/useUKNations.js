/**
 * Hook to lazily fetch UK nations boundary GeoJSON.
 * Only downloads when UK nations are toggled on.
 */
import { useState, useEffect } from 'react';

const UK_GEOJSON_URL =
  'https://raw.githubusercontent.com/martinjc/UK-GeoJSON/master/json/administrative/gb/lad.json';

// We use a simpler source: countries of the UK from Natural Earth via GitHub
const UK_NATIONS_GEOJSON_URL =
  'https://raw.githubusercontent.com/martinjc/UK-GeoJSON/master/json/administrative/uk/countries.json';

const NAME_ALIASES = {
  'Great Britain': 'England',
};

function normalizeNationName(raw) {
  if (!raw) return raw;
  const trimmed = raw.trim();
  return NAME_ALIASES[trimmed] || trimmed;
}

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

    fetch(UK_NATIONS_GEOJSON_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(geojson => {
        if (cancelled) return;
        const features = (geojson.features || []).map((f, i) => {
          const rawName = f.properties?.CTRY21NM || f.properties?.name || f.properties?.NAME || '';
          const name = normalizeNationName(rawName);
          return {
            ...f,
            id: i,
            properties: {
              ...f.properties,
              name,
              originalName: rawName,
            },
          };
        });
        const result = { type: 'FeatureCollection', features };
        cachedData = result;
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('[useUKNations] Failed to load UK GeoJSON:', err);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [enabled]);

  return { data, loading };
}
