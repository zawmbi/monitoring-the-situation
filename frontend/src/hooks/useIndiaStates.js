/**
 * Hook to lazily fetch Indian state boundary GeoJSON from Natural Earth / GitHub CDN.
 * Only downloads when Indian states are toggled on.
 */
import { useState, useEffect } from 'react';

const INDIA_GEOJSON_URL = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson';

// Mapping from GeoJSON feature names to our IN_STATE_INFO keys
const NAME_ALIASES = {
  'Orissa': 'Odisha',
  'Uttaranchal': 'Uttarakhand',
  'Pondicherry': 'Puducherry',
  'Daman & Diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'Dadra & Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'NCT of Delhi': 'Delhi',
  'Jammu & Kashmir': 'Jammu and Kashmir',
  'Andaman & Nicobar Island': 'Andaman and Nicobar Islands',
  'Andaman & Nicobar Islands': 'Andaman and Nicobar Islands',
};

function normalizeStateName(raw) {
  if (!raw) return raw;
  const trimmed = raw.trim();
  return NAME_ALIASES[trimmed] || trimmed;
}

let cachedData = null;

export function useIndiaStates(enabled) {
  const [data, setData] = useState(cachedData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || cachedData) {
      if (cachedData) setData(cachedData);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(INDIA_GEOJSON_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(geojson => {
        if (cancelled) return;
        // Normalize feature names
        const features = (geojson.features || []).map((f, i) => {
          const rawName = f.properties?.NAME_1 || f.properties?.name || f.properties?.NAME || f.properties?.st_nm || '';
          const name = normalizeStateName(rawName);
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
        console.error('[useIndiaStates] Failed to load India GeoJSON:', err);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [enabled]);

  return { data, loading };
}
