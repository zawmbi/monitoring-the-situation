/**
 * Wikidata World Leaders Service
 * Fetches current heads of state and government from Wikidata SPARQL.
 *
 * API: https://query.wikidata.org/sparql  (no key required)
 * License: CC0 1.0 (public domain) — no restrictions on commercial use.
 *
 * Rate limits: 60 seconds of query time per minute.
 * Cache: 7 days (leadership changes are rare; background refresh weekly).
 */

import { cacheService } from './cache.service.js';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const CACHE_KEY = 'wikidata:leaders';
const CACHE_TTL = 7 * 24 * 3600; // 7 days

/**
 * SPARQL query to get current heads of state (P35) and heads of government (P6)
 * for all sovereign countries (Q6256) and some additional territories.
 *
 * The query filters for current office holders (no end date or end date in the future)
 * and gets their English name, title, and Wikipedia article for photo fetching.
 */
const LEADERS_QUERY = `
SELECT DISTINCT ?country ?countryLabel ?leaderName ?positionLabel ?article WHERE {
  # Get sovereign states
  ?country wdt:P31 wd:Q6256 .

  # Get head of state (P35) or head of government (P6)
  {
    ?country p:P35 ?stmt .
    ?stmt ps:P35 ?leader .
    ?stmt pq:P580 ?start .  # has a start date
    FILTER NOT EXISTS { ?stmt pq:P582 ?end . FILTER(?end < NOW()) }
  } UNION {
    ?country p:P6 ?stmt .
    ?stmt ps:P6 ?leader .
    ?stmt pq:P580 ?start .
    FILTER NOT EXISTS { ?stmt pq:P582 ?end . FILTER(?end < NOW()) }
  }

  # Get leader name
  ?leader rdfs:label ?leaderName .
  FILTER(LANG(?leaderName) = "en")

  # Get the position held
  ?stmt ps:P35|ps:P6 ?leader .
  {
    ?stmt ps:P35 ?leader .
    ?country wdt:P1906 ?position .
  } UNION {
    ?stmt ps:P6 ?leader .
    ?country wdt:P1313 ?position .
  }

  # Get English Wikipedia article for photo fetching
  OPTIONAL {
    ?article schema:about ?leader ;
             schema:isPartOf <https://en.wikipedia.org/> .
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?countryLabel
`;

/**
 * Simpler, more reliable fallback query that just gets head of state and head of government.
 */
const SIMPLE_QUERY = `
SELECT ?country ?countryLabel ?leader ?leaderLabel ?posLabel ?article WHERE {
  ?country wdt:P31 wd:Q6256 .

  {
    ?country p:P35 ?s .
    ?s ps:P35 ?leader ; pq:P580 ?start .
    FILTER NOT EXISTS { ?s pq:P582 ?end . FILTER(?end < NOW()) }
    BIND("Head of State" AS ?posLabel)
  } UNION {
    ?country p:P6 ?s .
    ?s ps:P6 ?leader ; pq:P580 ?start .
    FILTER NOT EXISTS { ?s pq:P582 ?end . FILTER(?end < NOW()) }
    BIND("Head of Government" AS ?posLabel)
  }

  OPTIONAL {
    ?article schema:about ?leader ;
             schema:isPartOf <https://en.wikipedia.org/> .
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?countryLabel
`;

// Map Wikidata country names to the names used in our app
const COUNTRY_NAME_MAP = {
  "People's Republic of China": 'China',
  'Republic of China': 'Taiwan',
  'Kingdom of the Netherlands': 'Netherlands',
  'Czech Republic': 'Czechia',
  'Republic of the Congo': 'Republic of the Congo',
  'Democratic Republic of the Congo': 'DR Congo',
  'Kingdom of Denmark': 'Denmark',
  'Kingdom of Norway': 'Norway',
  'Kingdom of Sweden': 'Sweden',
  'Kingdom of Spain': 'Spain',
  'Kingdom of Belgium': 'Belgium',
  'Republic of Ireland': 'Ireland',
  'State of Israel': 'Israel',
  'Republic of Korea': 'South Korea',
  "Democratic People's Republic of Korea": 'North Korea',
  'Russian Federation': 'Russia',
  'United Mexican States': 'Mexico',
  'Federative Republic of Brazil': 'Brazil',
  'Argentine Republic': 'Argentina',
  'Republic of India': 'India',
  'Islamic Republic of Iran': 'Iran',
  'Republic of Türkiye': 'Turkey',
  'Republic of Turkey': 'Turkey',
  'Republic of South Africa': 'South Africa',
  'Federal Republic of Germany': 'Germany',
  'Italian Republic': 'Italy',
  'French Republic': 'France',
  'Republic of Poland': 'Poland',
  'Republic of Finland': 'Finland',
  'Hellenic Republic': 'Greece',
  'Portuguese Republic': 'Portugal',
  'Swiss Confederation': 'Switzerland',
  'Republic of Austria': 'Austria',
  'State of Japan': 'Japan',
  'Republic of Indonesia': 'Indonesia',
  'Kingdom of Thailand': 'Thailand',
  'Republic of the Philippines': 'Philippines',
  'Socialist Republic of Vietnam': 'Vietnam',
  'Malaysia': 'Malaysia',
  'Republic of Singapore': 'Singapore',
  'Commonwealth of Australia': 'Australia',
  'New Zealand': 'New Zealand',
  'Kingdom of Saudi Arabia': 'Saudi Arabia',
  'Arab Republic of Egypt': 'Egypt',
  'Republic of Colombia': 'Colombia',
  'Republic of Chile': 'Chile',
  'Republic of Peru': 'Peru',
  "Republic of Côte d'Ivoire": 'Ivory Coast',
  'Republic of the Sudan': 'Sudan',
  'Federal Republic of Nigeria': 'Nigeria',
  'Republic of Kenya': 'Kenya',
  'Federal Democratic Republic of Ethiopia': 'Ethiopia',
};

class WikidataService {
  /**
   * Fetch all current world leaders from Wikidata.
   * Returns a map: { countryName: { name, title, wiki } }
   */
  async getWorldLeaders() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    console.log('[Wikidata] Fetching current world leaders...');

    try {
      const data = await this.runQuery(SIMPLE_QUERY);
      if (!data) return null;

      const leaders = {};

      for (const binding of data.results.bindings) {
        const rawCountry = binding.countryLabel?.value;
        if (!rawCountry) continue;

        const country = COUNTRY_NAME_MAP[rawCountry] || rawCountry;
        const name = binding.leaderLabel?.value;
        const position = binding.posLabel?.value || '';
        const articleUrl = binding.article?.value || '';

        if (!name || name.startsWith('Q')) continue; // Skip unresolved QIDs

        // Extract Wikipedia article title from URL
        const wikiMatch = articleUrl.match(/\/wiki\/(.+)$/);
        const wiki = wikiMatch ? wikiMatch[1] : '';

        // Determine title from position
        const title = this.inferTitle(position, country);

        // Prefer head of government for countries that have both (e.g., UK PM over King)
        const existing = leaders[country];
        if (existing) {
          // If we already have head of government, don't override with head of state
          if (position === 'Head of State' && existing._pos === 'Head of Government') {
            continue;
          }
        }

        leaders[country] = { name, title, wiki, _pos: position };
      }

      // Clean up internal _pos field
      for (const key of Object.keys(leaders)) {
        delete leaders[key]._pos;
      }

      const result = {
        leaders,
        count: Object.keys(leaders).length,
        source: 'Wikidata (CC0)',
        fetchedAt: new Date().toISOString(),
      };

      await cacheService.set(CACHE_KEY, result, CACHE_TTL);
      console.log(`[Wikidata] Cached ${result.count} world leaders`);
      return result;
    } catch (error) {
      console.error('[Wikidata] Failed to fetch leaders:', error.message);
      return null;
    }
  }

  /**
   * Get a single country's leader from the cached set.
   */
  async getLeaderByCountry(countryName) {
    const data = await this.getWorldLeaders();
    if (!data?.leaders) return null;
    return data.leaders[countryName] || null;
  }

  /**
   * Execute a SPARQL query against Wikidata.
   */
  async runQuery(query) {
    const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent': 'Monitored/1.0 (conflict-monitor; contact: dev@monitored.app)',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`Wikidata SPARQL responded ${res.status}: ${res.statusText}`);
    }

    return res.json();
  }

  /**
   * Infer a human-readable title based on position and country customs.
   */
  inferTitle(position, country) {
    if (position === 'Head of Government') {
      const pmCountries = [
        'United Kingdom', 'Canada', 'Australia', 'New Zealand', 'India', 'Japan',
        'Italy', 'Spain', 'Netherlands', 'Belgium', 'Sweden', 'Norway', 'Denmark',
        'Finland', 'Greece', 'Portugal', 'Ireland', 'Poland', 'Czechia', 'Hungary',
        'Slovakia', 'Croatia', 'Slovenia', 'Bulgaria', 'Romania', 'Serbia',
        'Lithuania', 'Latvia', 'Estonia', 'Luxembourg', 'Malta', 'Iceland',
        'Thailand', 'Malaysia', 'Singapore', 'Vietnam', 'Cambodia', 'Laos',
        'Pakistan', 'Bangladesh', 'Nepal', 'Ethiopia', 'Israel',
      ];
      if (country === 'Germany' || country === 'Austria') return 'Chancellor';
      if (country === 'Ireland') return 'Taoiseach';
      if (pmCountries.includes(country)) return 'Prime Minister';
      return 'Prime Minister';
    }
    // Head of State
    const monarchies = [
      'United Kingdom', 'Japan', 'Thailand', 'Saudi Arabia', 'Jordan',
      'Morocco', 'Spain', 'Belgium', 'Netherlands', 'Sweden', 'Norway',
      'Denmark', 'Malaysia', 'Cambodia', 'Bahrain', 'Kuwait', 'Qatar',
      'Oman', 'Brunei', 'Tonga', 'Bhutan', 'Lesotho', 'Eswatini',
      'Monaco', 'Luxembourg', 'Liechtenstein',
    ];
    if (monarchies.includes(country)) return 'Monarch';
    return 'President';
  }
}

export const wikidataService = new WikidataService();
export default wikidataService;
