/**
 * Hook to lazily fetch Russian federal subject boundary GeoJSON.
 * Only downloads when Russian oblasts are toggled on.
 */
import { useState, useEffect } from 'react';

const RUSSIA_GEOJSON_URL =
  'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/russia.geojson';

// Maps name_latin (English) and Cyrillic-derived names to our RU_OBLAST_INFO keys
const NAME_ALIASES = {
  // name_latin → RU_OBLAST_INFO key mappings (from codeforamerica GeoJSON)
  'Republic of Adygea': 'Adygea',
  'Republic of Buryatia': 'Buryatia',
  'Republic of Altai': 'Altai Republic',
  'Republic of Bashkortostan': 'Bashkortostan',
  'Republic of Dagestan': 'Dagestan',
  'Republic of Ingushetia': 'Ingushetia',
  'Kabardino-Balkar Republic': 'Kabardino-Balkaria',
  'Republic of Kalmykia': 'Kalmykia',
  'Karachay-Cherkess Republic': 'Karachay-Cherkessia',
  'Republic of Karelia': 'Karelia',
  'Komi Republic': 'Komi Republic',
  'Republic of Mari El': 'Mari El',
  'Republic of Mordovia': 'Mordovia',
  'Republic of North Ossetia-Alania': 'North Ossetia-Alania',
  'Republic of Sakha (Yakutia)': 'Sakha (Yakutia)',
  'Republic of Tatarstan': 'Tatarstan',
  'Republic of Tuva': 'Tuva',
  'Tyva Republic': 'Tuva',
  'Udmurt Republic': 'Udmurtia',
  'Republic of Khakassia': 'Khakassia',
  'Chechen Republic': 'Chechnya',
  'Chuvash Republic': 'Chuvashia',
  'Republic of Crimea': 'Crimea',
  'Trans-Baikal Territory': 'Zabaykalsky Krai',
  'Zabaykalsky Territory': 'Zabaykalsky Krai',
  'Kamchatka Territory': 'Kamchatka Krai',
  'Krasnoyarsk Territory': 'Krasnoyarsk Krai',
  'Primorsky Territory': 'Primorsky Krai',
  'Khabarovsk Territory': 'Khabarovsk Krai',
  'Perm Territory': 'Perm Krai',
  'Stavropol Territory': 'Stavropol Krai',
  'Altai Territory': 'Altai Krai',
  'Krasnodar Territory': 'Krasnodar Krai',
  'Chukotka Autonomous Area': 'Chukotka Autonomous Okrug',
  'Khanty-Mansi Autonomous Area': 'Khanty-Mansi Autonomous Okrug',
  'Nenets Autonomous Area': 'Nenets Autonomous Okrug',
  'Yamalo-Nenets Autonomous Area': 'Yamalo-Nenets Autonomous Okrug',
  'Jewish Autonomous Area': 'Jewish Autonomous Oblast',
  'City of Moscow': 'Moscow',
  'City of Saint Petersburg': 'Saint Petersburg',
  'City of St. Petersburg': 'Saint Petersburg',
  'City of Sevastopol': 'Sevastopol',
  'St. Petersburg': 'Saint Petersburg',

  // Additional Cyrillic / transliterated fallbacks
  'Adygeya': 'Adygea',
  'Altay': 'Altai Republic',
  'Buryat': 'Buryatia',
  'Buryatiya': 'Buryatia',
  'Chuvash': 'Chuvashia',
  'Ingush': 'Ingushetia',
  'Ingushetiya': 'Ingushetia',
  'Kabardin-Balkar': 'Kabardino-Balkaria',
  'Kalmyk': 'Kalmykia',
  'Kalmykiya': 'Kalmykia',
  'Karachay-Cherkess': 'Karachay-Cherkessia',
  'Khakass': 'Khakassia',
  'Khakasiya': 'Khakassia',
  'Mariy-El': 'Mari El',
  'Mordoviya': 'Mordovia',
  'North Ossetia': 'North Ossetia-Alania',
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
  'St.-Petersburg': 'Saint Petersburg',
  'Moskva': 'Moscow',
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
    .replace(/ Region$/i, '')
    .replace(/ Territory$/i, '')
    .replace(/ Area$/i, '')
    .replace(/ Autonomous Okrug$/i, '')
    .replace(/ Autonomous Area$/i, '');
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
          // Prefer name_latin (English) over name (Cyrillic)
          const rawName = f.properties?.name_latin || f.properties?.name || f.properties?.NAME || f.properties?.NAME_1 || '';
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
