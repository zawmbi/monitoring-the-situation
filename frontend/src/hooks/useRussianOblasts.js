/**
 * Hook to lazily fetch Russian federal subject boundary GeoJSON.
 * Only downloads when Russian oblasts are toggled on.
 */
import { useState, useEffect } from 'react';

const RUSSIA_GEOJSON_URL =
  'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/russia.geojson';

const NAME_ALIASES = {
  'Adygeya': 'Adygea',
  'Altay': 'Altai Republic',
  'Bashkortostan': 'Bashkortostan',
  'Buryat': 'Buryatia',
  'Buryatiya': 'Buryatia',
  'Chechnya': 'Chechnya',
  'Chuvash': 'Chuvashia',
  'Dagestan': 'Dagestan',
  'Ingush': 'Ingushetia',
  'Ingushetiya': 'Ingushetia',
  'Kabardin-Balkar': 'Kabardino-Balkaria',
  'Kalmyk': 'Kalmykia',
  'Kalmykiya': 'Kalmykia',
  'Karachay-Cherkess': 'Karachay-Cherkessia',
  'Karelia': 'Karelia',
  'Khakass': 'Khakassia',
  'Khakasiya': 'Khakassia',
  'Komi': 'Komi',
  'Mariy-El': 'Mari El',
  'Mordovia': 'Mordovia',
  'Mordoviya': 'Mordovia',
  'North Ossetia': 'North Ossetia-Alania',
  'Sakha': 'Sakha',
  'Tatarstan': 'Tatarstan',
  'Tuva': 'Tuva',
  'Tyva': 'Tuva',
  'Udmurt': 'Udmurtia',
  'Udmurtiya': 'Udmurtia',
  'Gorno-Altay': 'Altai Republic',
  'Yevreyskaya': 'Jewish Autonomous Oblast',
  'Yevrey': 'Jewish Autonomous Oblast',
  'Jewish Autonomous': 'Jewish Autonomous Oblast',
  'Nenetskiy': 'Nenets Autonomous Okrug',
  'Nenets': 'Nenets Autonomous Okrug',
  'Khanty-Mansiy': 'Khanty-Mansi Autonomous Okrug',
  'Khanty-Mansiysk': 'Khanty-Mansi Autonomous Okrug',
  'Yamalo-Nenets': 'Yamalo-Nenets Autonomous Okrug',
  'Chukot': 'Chukotka Autonomous Okrug',
  'Chukotka': 'Chukotka',
  'Zabaykal\'sk': 'Zabaykalsky Krai',
  'Transbaikal': 'Zabaykalsky Krai',
  'Primor\'ye': 'Primorsky Krai',
  'Primorye': 'Primorsky Krai',
  'Primor\'sk': 'Primorsky Krai',
  'City of St. Petersburg': 'Saint Petersburg',
  'St.-Petersburg': 'Saint Petersburg',
  'Moskva': 'Moscow',
  'City of Moscow': 'Moscow',
  'Sevastopol\'': 'Sevastopol',
};

function normalizeRegionName(raw) {
  if (!raw) return raw;
  const trimmed = raw.trim();
  if (NAME_ALIASES[trimmed]) return NAME_ALIASES[trimmed];
  // Try stripping common suffixes for matching
  const stripped = trimmed
    .replace(/ Oblast$/i, '')
    .replace(/ Krai$/i, '')
    .replace(/ Republic$/i, '')
    .replace(/ Autonomous Okrug$/i, '');
  if (NAME_ALIASES[stripped]) return NAME_ALIASES[stripped];
  return trimmed;
}

let cachedData = null;

export function useRussianOblasts(enabled) {
  const [data, setData] = useState(cachedData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || cachedData) {
      if (cachedData) setData(cachedData);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(RUSSIA_GEOJSON_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(geojson => {
        if (cancelled) return;
        const features = (geojson.features || []).map((f, i) => {
          const rawName = f.properties?.name || f.properties?.NAME || f.properties?.NAME_1 || '';
          const name = normalizeRegionName(rawName);
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
        console.error('[useRussianOblasts] Failed to load Russia GeoJSON:', err);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [enabled]);

  return { data, loading };
}
