/**
 * Source Credibility & Truth Engine Service
 * Assesses source credibility, detects misinformation patterns,
 * and provides multi-source verification for trending claims.
 *
 * Sources: GDELT Project API (free, no auth), static credibility database
 */

import { cacheService } from './cache.service.js';
import { fetchGDELTRaw } from './gdelt.client.js';

const CACHE_TTL = 600; // 10 minutes
const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

/* ── Source Credibility Database ─────────────────────────────────────────────
 * Static credibility ratings for 80+ major news sources.
 * Each entry: { domain, name, tier, score, bias, country, type }
 * Tiers: 1 (90-100), 2 (75-89), 3 (60-74), 4 (40-59), 5 (0-39)
 * ────────────────────────────────────────────────────────────────────────── */

const SOURCE_CREDIBILITY_DB = [
  // ── Tier 1: Wire services & highly trusted outlets (90-100) ──
  { domain: 'reuters.com', name: 'Reuters', tier: 1, score: 98, bias: 'center', country: 'UK', type: 'wire' },
  { domain: 'apnews.com', name: 'Associated Press', tier: 1, score: 97, bias: 'center', country: 'US', type: 'wire' },
  { domain: 'afp.com', name: 'Agence France-Presse', tier: 1, score: 96, bias: 'center', country: 'FR', type: 'wire' },
  { domain: 'bbc.com', name: 'BBC News', tier: 1, score: 94, bias: 'center', country: 'UK', type: 'broadcast' },
  { domain: 'bbc.co.uk', name: 'BBC News', tier: 1, score: 94, bias: 'center', country: 'UK', type: 'broadcast' },
  { domain: 'npr.org', name: 'NPR', tier: 1, score: 93, bias: 'center', country: 'US', type: 'broadcast' },
  { domain: 'pbs.org', name: 'PBS NewsHour', tier: 1, score: 93, bias: 'center', country: 'US', type: 'broadcast' },
  { domain: 'economist.com', name: 'The Economist', tier: 1, score: 92, bias: 'center', country: 'UK', type: 'newspaper' },
  { domain: 'csmonitor.com', name: 'Christian Science Monitor', tier: 1, score: 91, bias: 'center', country: 'US', type: 'newspaper' },
  { domain: 'c-span.org', name: 'C-SPAN', tier: 1, score: 95, bias: 'center', country: 'US', type: 'broadcast' },
  { domain: 'dw.com', name: 'Deutsche Welle', tier: 1, score: 91, bias: 'center', country: 'DE', type: 'broadcast' },
  { domain: 'swissinfo.ch', name: 'SWI swissinfo.ch', tier: 1, score: 90, bias: 'center', country: 'CH', type: 'digital' },

  // ── Tier 2: Major quality newspapers & broadcasters (75-89) ──
  { domain: 'nytimes.com', name: 'The New York Times', tier: 2, score: 88, bias: 'center-left', country: 'US', type: 'newspaper' },
  { domain: 'washingtonpost.com', name: 'The Washington Post', tier: 2, score: 87, bias: 'center-left', country: 'US', type: 'newspaper' },
  { domain: 'theguardian.com', name: 'The Guardian', tier: 2, score: 85, bias: 'center-left', country: 'UK', type: 'newspaper' },
  { domain: 'ft.com', name: 'Financial Times', tier: 2, score: 89, bias: 'center', country: 'UK', type: 'newspaper' },
  { domain: 'wsj.com', name: 'The Wall Street Journal', tier: 2, score: 86, bias: 'center-right', country: 'US', type: 'newspaper' },
  { domain: 'spiegel.de', name: 'Der Spiegel', tier: 2, score: 84, bias: 'center-left', country: 'DE', type: 'newspaper' },
  { domain: 'lemonde.fr', name: 'Le Monde', tier: 2, score: 85, bias: 'center-left', country: 'FR', type: 'newspaper' },
  { domain: 'elpais.com', name: 'El Pais', tier: 2, score: 83, bias: 'center-left', country: 'ES', type: 'newspaper' },
  { domain: 'corriere.it', name: 'Corriere della Sera', tier: 2, score: 82, bias: 'center', country: 'IT', type: 'newspaper' },
  { domain: 'bloomberg.com', name: 'Bloomberg', tier: 2, score: 87, bias: 'center', country: 'US', type: 'digital' },
  { domain: 'latimes.com', name: 'Los Angeles Times', tier: 2, score: 82, bias: 'center-left', country: 'US', type: 'newspaper' },
  { domain: 'theatlantic.com', name: 'The Atlantic', tier: 2, score: 83, bias: 'center-left', country: 'US', type: 'digital' },
  { domain: 'newyorker.com', name: 'The New Yorker', tier: 2, score: 84, bias: 'center-left', country: 'US', type: 'newspaper' },
  { domain: 'politico.com', name: 'Politico', tier: 2, score: 81, bias: 'center', country: 'US', type: 'digital' },
  { domain: 'abc.net.au', name: 'ABC Australia', tier: 2, score: 86, bias: 'center', country: 'AU', type: 'broadcast' },
  { domain: 'cbc.ca', name: 'CBC News', tier: 2, score: 85, bias: 'center', country: 'CA', type: 'broadcast' },
  { domain: 'nhk.or.jp', name: 'NHK World', tier: 2, score: 84, bias: 'center', country: 'JP', type: 'broadcast' },
  { domain: 'france24.com', name: 'France 24', tier: 2, score: 83, bias: 'center', country: 'FR', type: 'broadcast' },
  { domain: 'axios.com', name: 'Axios', tier: 2, score: 80, bias: 'center', country: 'US', type: 'digital' },
  { domain: 'propublica.org', name: 'ProPublica', tier: 2, score: 88, bias: 'center-left', country: 'US', type: 'digital' },
  { domain: 'thehill.com', name: 'The Hill', tier: 2, score: 78, bias: 'center', country: 'US', type: 'digital' },
  { domain: 'usatoday.com', name: 'USA Today', tier: 2, score: 77, bias: 'center', country: 'US', type: 'newspaper' },
  { domain: 'time.com', name: 'TIME', tier: 2, score: 82, bias: 'center-left', country: 'US', type: 'newspaper' },
  { domain: 'foreignaffairs.com', name: 'Foreign Affairs', tier: 2, score: 89, bias: 'center', country: 'US', type: 'digital' },
  { domain: 'japantimes.co.jp', name: 'The Japan Times', tier: 2, score: 80, bias: 'center', country: 'JP', type: 'newspaper' },
  { domain: 'scmp.com', name: 'South China Morning Post', tier: 2, score: 76, bias: 'center', country: 'HK', type: 'newspaper' },
  { domain: 'haaretz.com', name: 'Haaretz', tier: 2, score: 80, bias: 'center-left', country: 'IL', type: 'newspaper' },
  { domain: 'theaustralian.com.au', name: 'The Australian', tier: 2, score: 78, bias: 'center-right', country: 'AU', type: 'newspaper' },

  // ── Tier 3: Cable news & large mixed-quality outlets (60-74) ──
  { domain: 'cnn.com', name: 'CNN', tier: 3, score: 72, bias: 'center-left', country: 'US', type: 'broadcast' },
  { domain: 'foxnews.com', name: 'Fox News', tier: 3, score: 62, bias: 'right', country: 'US', type: 'broadcast' },
  { domain: 'msnbc.com', name: 'MSNBC', tier: 3, score: 64, bias: 'left', country: 'US', type: 'broadcast' },
  { domain: 'aljazeera.com', name: 'Al Jazeera', tier: 3, score: 70, bias: 'center', country: 'QA', type: 'broadcast' },
  { domain: 'news.sky.com', name: 'Sky News', tier: 3, score: 71, bias: 'center', country: 'UK', type: 'broadcast' },
  { domain: 'abcnews.go.com', name: 'ABC News', tier: 3, score: 73, bias: 'center', country: 'US', type: 'broadcast' },
  { domain: 'cbsnews.com', name: 'CBS News', tier: 3, score: 74, bias: 'center', country: 'US', type: 'broadcast' },
  { domain: 'nbcnews.com', name: 'NBC News', tier: 3, score: 73, bias: 'center-left', country: 'US', type: 'broadcast' },
  { domain: 'cnbc.com', name: 'CNBC', tier: 3, score: 74, bias: 'center', country: 'US', type: 'broadcast' },
  { domain: 'bild.de', name: 'Bild', tier: 3, score: 60, bias: 'center-right', country: 'DE', type: 'newspaper' },
  { domain: 'telegraph.co.uk', name: 'The Telegraph', tier: 3, score: 70, bias: 'center-right', country: 'UK', type: 'newspaper' },
  { domain: 'independent.co.uk', name: 'The Independent', tier: 3, score: 68, bias: 'center-left', country: 'UK', type: 'digital' },
  { domain: 'thedailybeast.com', name: 'The Daily Beast', tier: 3, score: 63, bias: 'center-left', country: 'US', type: 'digital' },
  { domain: 'newsweek.com', name: 'Newsweek', tier: 3, score: 65, bias: 'center', country: 'US', type: 'digital' },
  { domain: 'vice.com', name: 'VICE News', tier: 3, score: 62, bias: 'center-left', country: 'US', type: 'digital' },
  { domain: 'thesun.co.uk', name: 'The Sun', tier: 3, score: 60, bias: 'center-right', country: 'UK', type: 'newspaper' },
  { domain: 'businessinsider.com', name: 'Business Insider', tier: 3, score: 68, bias: 'center', country: 'US', type: 'digital' },
  { domain: 'timesofisrael.com', name: 'The Times of Israel', tier: 3, score: 70, bias: 'center', country: 'IL', type: 'digital' },
  { domain: 'hindustantimes.com', name: 'Hindustan Times', tier: 3, score: 66, bias: 'center', country: 'IN', type: 'newspaper' },
  { domain: 'timesofindia.indiatimes.com', name: 'Times of India', tier: 3, score: 65, bias: 'center', country: 'IN', type: 'newspaper' },

  // ── Tier 4: Tabloids & highly partisan outlets (40-59) ──
  { domain: 'dailymail.co.uk', name: 'Daily Mail', tier: 4, score: 48, bias: 'right', country: 'UK', type: 'newspaper' },
  { domain: 'nypost.com', name: 'New York Post', tier: 4, score: 50, bias: 'right', country: 'US', type: 'newspaper' },
  { domain: 'breitbart.com', name: 'Breitbart', tier: 4, score: 40, bias: 'right', country: 'US', type: 'digital' },
  { domain: 'huffpost.com', name: 'HuffPost', tier: 4, score: 55, bias: 'left', country: 'US', type: 'digital' },
  { domain: 'vox.com', name: 'Vox', tier: 4, score: 58, bias: 'left', country: 'US', type: 'digital' },
  { domain: 'dailywire.com', name: 'The Daily Wire', tier: 4, score: 42, bias: 'right', country: 'US', type: 'digital' },
  { domain: 'salon.com', name: 'Salon', tier: 4, score: 48, bias: 'left', country: 'US', type: 'digital' },
  { domain: 'jacobin.com', name: 'Jacobin', tier: 4, score: 50, bias: 'left', country: 'US', type: 'digital' },
  { domain: 'theblaze.com', name: 'The Blaze', tier: 4, score: 42, bias: 'right', country: 'US', type: 'digital' },
  { domain: 'mirror.co.uk', name: 'Daily Mirror', tier: 4, score: 46, bias: 'center-left', country: 'UK', type: 'newspaper' },
  { domain: 'express.co.uk', name: 'Daily Express', tier: 4, score: 44, bias: 'right', country: 'UK', type: 'newspaper' },
  { domain: 'motherjones.com', name: 'Mother Jones', tier: 4, score: 55, bias: 'left', country: 'US', type: 'digital' },
  { domain: 'rawstory.com', name: 'Raw Story', tier: 4, score: 45, bias: 'left', country: 'US', type: 'digital' },
  { domain: 'washingtontimes.com', name: 'Washington Times', tier: 4, score: 48, bias: 'right', country: 'US', type: 'newspaper' },
  { domain: 'oann.com', name: 'OAN', tier: 4, score: 40, bias: 'right', country: 'US', type: 'broadcast' },
  { domain: 'epochtimes.com', name: 'The Epoch Times', tier: 4, score: 40, bias: 'right', country: 'US', type: 'digital' },

  // ── Tier 5: Known unreliable sources & state propaganda (0-39) ──
  { domain: 'rt.com', name: 'RT (Russia Today)', tier: 5, score: 25, bias: 'right', country: 'RU', type: 'state' },
  { domain: 'sputniknews.com', name: 'Sputnik News', tier: 5, score: 20, bias: 'right', country: 'RU', type: 'state' },
  { domain: 'tass.com', name: 'TASS', tier: 5, score: 28, bias: 'center-right', country: 'RU', type: 'state' },
  { domain: 'presstv.ir', name: 'Press TV', tier: 5, score: 22, bias: 'left', country: 'IR', type: 'state' },
  { domain: 'globalresearch.ca', name: 'Global Research', tier: 5, score: 15, bias: 'left', country: 'CA', type: 'digital' },
  { domain: 'infowars.com', name: 'InfoWars', tier: 5, score: 10, bias: 'right', country: 'US', type: 'digital' },
  { domain: 'naturalnews.com', name: 'Natural News', tier: 5, score: 8, bias: 'right', country: 'US', type: 'digital' },
  { domain: 'zerohedge.com', name: 'Zero Hedge', tier: 5, score: 30, bias: 'right', country: 'US', type: 'digital' },
  { domain: 'xinhuanet.com', name: 'Xinhua News Agency', tier: 5, score: 30, bias: 'center', country: 'CN', type: 'state' },
  { domain: 'globaltimes.cn', name: 'Global Times', tier: 5, score: 25, bias: 'center', country: 'CN', type: 'state' },
  { domain: 'kcna.kp', name: 'KCNA', tier: 5, score: 5, bias: 'center', country: 'KP', type: 'state' },
  { domain: 'veteranstoday.com', name: 'Veterans Today', tier: 5, score: 10, bias: 'left', country: 'US', type: 'digital' },
];

/* ── Sensationalism detection patterns ─────────────────────────────────── */

const SENSATIONAL_WORDS = [
  'shocking', 'bombshell', 'explosive', 'breaking', 'urgent', 'devastating',
  'horrifying', 'terrifying', 'unbelievable', 'outrageous', 'insane', 'crazy',
  'nightmare', 'catastrophic', 'apocalyptic', 'destroy', 'slammed', 'blasted',
  'obliterated', 'eviscerated', 'annihilated', 'crushed', 'panic', 'chaos',
  'you won\'t believe', 'what they don\'t want you to know', 'exposed',
  'conspiracy', 'coverup', 'secret', 'hidden truth', 'wake up',
];

const EMOTIONAL_AMPLIFIERS = [
  'absolutely', 'totally', 'completely', 'utterly', 'extremely',
  'incredibly', 'massively', 'hugely', 'wildly', 'insanely',
];

/* ── Domain lookup index for fast access ───────────────────────────────── */

const SOURCE_INDEX = new Map();
for (const entry of SOURCE_CREDIBILITY_DB) {
  SOURCE_INDEX.set(entry.domain, entry);
}

/* ── Helper utilities ──────────────────────────────────────────────────── */

/**
 * Extract the root domain from a URL or domain string.
 */
function extractDomain(urlOrDomain) {
  if (!urlOrDomain) return null;
  try {
    let hostname = urlOrDomain;
    if (urlOrDomain.includes('://')) {
      hostname = new URL(urlOrDomain).hostname;
    }
    hostname = hostname.replace(/^www\./, '');
    return hostname.toLowerCase();
  } catch {
    return urlOrDomain.toLowerCase().replace(/^www\./, '');
  }
}

/**
 * Look up a source in the credibility database.
 * Tries exact domain match first, then partial match.
 */
function lookupSource(domain) {
  if (!domain) return null;
  const clean = extractDomain(domain);
  if (!clean) return null;

  // Exact match
  if (SOURCE_INDEX.has(clean)) return SOURCE_INDEX.get(clean);

  // Partial match (e.g. "edition.cnn.com" -> "cnn.com")
  for (const [key, entry] of SOURCE_INDEX) {
    if (clean.endsWith(key) || key.endsWith(clean)) return entry;
  }

  return null;
}

/**
 * Compute a sensationalism score from 0-100 for a headline.
 * Higher = more sensational.
 */
function scoreSensationalism(headline) {
  if (!headline) return 0;
  const lower = headline.toLowerCase();
  let score = 0;

  // All-caps detection
  const words = headline.split(/\s+/);
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase());
  const capsRatio = words.length > 0 ? capsWords.length / words.length : 0;
  if (capsRatio > 0.5) score += 30;
  else if (capsRatio > 0.25) score += 15;

  // Excessive punctuation
  const exclamations = (headline.match(/!/g) || []).length;
  const questions = (headline.match(/\?/g) || []).length;
  score += Math.min(exclamations * 10, 25);
  score += Math.min(questions * 5, 15);

  // Sensational words
  let sensationalHits = 0;
  for (const word of SENSATIONAL_WORDS) {
    if (lower.includes(word)) sensationalHits++;
  }
  score += Math.min(sensationalHits * 12, 40);

  // Emotional amplifiers
  let amplifierHits = 0;
  for (const amp of EMOTIONAL_AMPLIFIERS) {
    if (lower.includes(amp)) amplifierHits++;
  }
  score += Math.min(amplifierHits * 5, 15);

  // Clickbait patterns
  if (/\d+\s+(reasons?|things?|ways?|facts?|secrets?)\s/i.test(headline)) score += 8;
  if (/you\s+(need|must|should|won't|have)\s/i.test(headline)) score += 10;

  return Math.min(score, 100);
}

/**
 * Score tone extremity on a scale of 0-100. GDELT tones range roughly from -25 to +25.
 * Extreme values (very negative or very positive) suggest bias.
 */
function scoreToneExtremity(toneValue) {
  if (toneValue == null || isNaN(toneValue)) return 50; // neutral default
  const abs = Math.abs(parseFloat(toneValue));
  // Normalize: tone 0 = no extremity (0), tone 15+ = max extremity (100)
  return Math.min(Math.round((abs / 15) * 100), 100);
}

/**
 * Determine the credibility level label from a numeric score.
 */
function credibilityLevel(score) {
  if (score >= 80) return 'verified';
  if (score >= 65) return 'likely-reliable';
  if (score >= 50) return 'unverified';
  if (score >= 30) return 'questionable';
  return 'unreliable';
}

/**
 * Generate a deterministic ID from a string.
 */
function hashId(str) {
  let hash = 0;
  const s = str || '';
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/* ── Main Service Class ────────────────────────────────────────────────── */

class CredibilityService {
  /**
   * Assess the credibility of a single article.
   * @param {{ url?: string, domain?: string, title?: string, tone?: number, crossRefs?: number }} article
   * @returns {{ score: number, level: string, factors: Array<{ name: string, value: number, detail: string }> }}
   */
  assessArticleCredibility(article) {
    const factors = [];
    let totalWeight = 0;
    let weightedSum = 0;

    // Factor 1: Source reputation (weight 40%)
    const source = lookupSource(article.url || article.domain);
    const sourceScore = source ? source.score : 50;
    factors.push({
      name: 'source_reputation',
      value: sourceScore,
      detail: source
        ? `${source.name} (Tier ${source.tier}, score ${source.score})`
        : 'Unknown source - default score applied',
    });
    weightedSum += sourceScore * 40;
    totalWeight += 40;

    // Factor 2: Cross-reference count (weight 25%)
    const crossRefs = article.crossRefs || 0;
    let crossRefScore;
    if (crossRefs >= 10) crossRefScore = 100;
    else if (crossRefs >= 5) crossRefScore = 80;
    else if (crossRefs >= 3) crossRefScore = 65;
    else if (crossRefs >= 1) crossRefScore = 45;
    else crossRefScore = 20;
    factors.push({
      name: 'cross_references',
      value: crossRefScore,
      detail: `${crossRefs} other source${crossRefs !== 1 ? 's' : ''} reporting the same story`,
    });
    weightedSum += crossRefScore * 25;
    totalWeight += 25;

    // Factor 3: Tone extremity (weight 15%)
    const toneExtremity = scoreToneExtremity(article.tone);
    const toneScore = Math.max(0, 100 - toneExtremity);
    factors.push({
      name: 'tone_neutrality',
      value: toneScore,
      detail: toneExtremity > 60
        ? 'Extreme tone detected - potential bias'
        : toneExtremity > 30
          ? 'Moderate tone - within normal range'
          : 'Neutral tone - balanced reporting',
    });
    weightedSum += toneScore * 15;
    totalWeight += 15;

    // Factor 4: Headline sensationalism (weight 20%)
    const sensationalism = scoreSensationalism(article.title);
    const headlineScore = Math.max(0, 100 - sensationalism);
    factors.push({
      name: 'headline_quality',
      value: headlineScore,
      detail: sensationalism > 50
        ? 'High sensationalism detected in headline'
        : sensationalism > 25
          ? 'Moderate sensationalism in headline'
          : 'Professional, non-sensational headline',
    });
    weightedSum += headlineScore * 20;
    totalWeight += 20;

    const finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;

    return {
      score: finalScore,
      level: credibilityLevel(finalScore),
      factors,
      source: source || null,
    };
  }

  /**
   * Fetch trending claims from GDELT and group by topic.
   * Returns top 20 claims with cross-source verification status.
   */
  async fetchTrendingClaims() {
    const cacheKey = 'credibility:claims';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      // Fetch high-volume stories across multiple topic categories
      const queries = [
        'conflict OR war OR military',
        'election OR vote OR political',
        'economy OR recession OR inflation',
        'climate OR disaster OR earthquake',
        'technology OR AI OR cyber',
      ];

      const allArticles = [];

      const results = await Promise.allSettled(
        queries.map(async (query) => {
          const encoded = encodeURIComponent(query);
          const url = `${GDELT_BASE}?query=${encoded}&mode=artlist&maxrecords=50&format=json&timespan=3d&sort=datedesc`;
          const data = await fetchGDELTRaw(url, 'Credibility');
          return data?.articles || [];
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allArticles.push(...result.value);
        }
      }

      // Group articles by approximate topic (using title similarity)
      const claimGroups = new Map();

      for (const article of allArticles) {
        if (!article.title) continue;
        const titleNorm = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        const titleKey = titleNorm.split(/\s+/).slice(0, 6).join(' ');

        if (!claimGroups.has(titleKey)) {
          claimGroups.set(titleKey, {
            id: `claim-${hashId(titleKey)}`,
            title: article.title,
            articles: [],
            sources: new Set(),
            countries: new Set(),
            tones: [],
          });
        }

        const group = claimGroups.get(titleKey);
        const domain = extractDomain(article.url || article.domain);
        group.articles.push(article);
        if (domain) group.sources.add(domain);
        if (article.sourcecountry) group.countries.add(article.sourcecountry);
        if (article.tone != null) group.tones.push(parseFloat(article.tone));
      }

      // Convert groups to claims array and score them
      const claims = [];
      for (const [, group] of claimGroups) {
        if (group.sources.size < 2) continue; // Only include multi-source claims

        const uniqueSources = [...group.sources];
        const avgTone = group.tones.length > 0
          ? group.tones.reduce((sum, t) => sum + t, 0) / group.tones.length
          : 0;

        // Assess consensus: how many high-tier sources agree
        let tier1Count = 0;
        let tier2Count = 0;
        let tier3Count = 0;
        let lowTierCount = 0;
        for (const domain of uniqueSources) {
          const src = lookupSource(domain);
          if (!src) continue;
          if (src.tier === 1) tier1Count++;
          else if (src.tier === 2) tier2Count++;
          else if (src.tier === 3) tier3Count++;
          else lowTierCount++;
        }

        const highCredSources = tier1Count + tier2Count;
        const totalKnown = tier1Count + tier2Count + tier3Count + lowTierCount;

        let verificationStatus;
        if (highCredSources >= 3) verificationStatus = 'verified';
        else if (highCredSources >= 1 && tier3Count >= 2) verificationStatus = 'likely-reliable';
        else if (totalKnown >= 3) verificationStatus = 'unverified';
        else if (lowTierCount > highCredSources) verificationStatus = 'questionable';
        else verificationStatus = 'unverified';

        const credScore = this.assessArticleCredibility({
          domain: uniqueSources[0],
          title: group.title,
          tone: avgTone,
          crossRefs: uniqueSources.length - 1,
        });

        claims.push({
          id: group.id,
          title: group.title,
          sourceCount: uniqueSources.length,
          sources: uniqueSources.slice(0, 8),
          countries: [...group.countries].slice(0, 5),
          avgTone: Math.round(avgTone * 100) / 100,
          credibilityScore: credScore.score,
          verificationStatus,
          tier1Sources: tier1Count,
          tier2Sources: tier2Count,
          tier3Sources: tier3Count,
          lowTierSources: lowTierCount,
          articleCount: group.articles.length,
        });
      }

      // Sort by source count (higher is more relevant), take top 20
      claims.sort((a, b) => b.sourceCount - a.sourceCount);
      const topClaims = claims.slice(0, 20);

      await cacheService.set(cacheKey, topClaims, CACHE_TTL);
      return topClaims;
    } catch (err) {
      console.error('[Credibility] Error fetching trending claims:', err.message);
      return [];
    }
  }

  /**
   * Detect potential narrative manipulation patterns.
   * Flags stories that appear primarily in low-credibility sources,
   * show sudden volume spikes, or have suspicious geographic clustering.
   */
  async detectNarrativeManipulation() {
    const cacheKey = 'credibility:manipulation';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      // Fetch a broad set of recent articles
      const query = encodeURIComponent('breaking OR crisis OR scandal OR threat OR war');
      const url = `${GDELT_BASE}?query=${query}&mode=artlist&maxrecords=100&format=json&timespan=2d&sort=datedesc`;
      const data = await fetchGDELTRaw(url, 'Credibility');
      const articles = data?.articles || [];

      // Group by approximate topic
      const topicGroups = new Map();
      for (const article of articles) {
        if (!article.title) continue;
        const key = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).slice(0, 5).join(' ');

        if (!topicGroups.has(key)) {
          topicGroups.set(key, {
            title: article.title,
            articles: [],
            sources: [],
            countries: [],
          });
        }

        const group = topicGroups.get(key);
        group.articles.push(article);
        const domain = extractDomain(article.url || article.domain);
        if (domain) group.sources.push(domain);
        if (article.sourcecountry) group.countries.push(article.sourcecountry);
      }

      const alerts = [];

      for (const [, group] of topicGroups) {
        if (group.articles.length < 3) continue;

        const uniqueSources = [...new Set(group.sources)];
        const uniqueCountries = [...new Set(group.countries)];

        // Analyze source tiers
        let highCred = 0;
        let lowCred = 0;
        let unknownCred = 0;
        for (const domain of uniqueSources) {
          const src = lookupSource(domain);
          if (!src) { unknownCred++; continue; }
          if (src.tier <= 2) highCred++;
          else if (src.tier >= 4) lowCred++;
        }

        const flags = [];
        let severity = 'low';

        // Pattern 1: Many low-credibility sources, few high-credibility
        if (lowCred >= 3 && highCred === 0) {
          flags.push('Story appears exclusively in low-credibility sources');
          severity = 'high';
        } else if (lowCred > highCred * 2 && lowCred >= 2) {
          flags.push('Disproportionately covered by low-credibility sources');
          severity = 'medium';
        }

        // Pattern 2: Geographic clustering (>70% from one country)
        if (uniqueCountries.length > 0) {
          const countryCounts = {};
          for (const c of group.countries) {
            countryCounts[c] = (countryCounts[c] || 0) + 1;
          }
          const topCountry = Object.entries(countryCounts).sort(([, a], [, b]) => b - a)[0];
          if (topCountry) {
            const ratio = topCountry[1] / group.countries.length;
            if (ratio > 0.7 && group.countries.length >= 3) {
              flags.push(`${Math.round(ratio * 100)}% of coverage originates from ${topCountry[0]}`);
              if (severity === 'low') severity = 'medium';
            }
          }
        }

        // Pattern 3: Sudden article volume spike
        if (group.articles.length >= 10 && uniqueSources.length <= 3) {
          flags.push(`High volume (${group.articles.length} articles) from very few sources (${uniqueSources.length})`);
          if (severity !== 'high') severity = 'medium';
        }

        // Pattern 4: Extreme average tone
        const tones = group.articles
          .filter(a => a.tone != null)
          .map(a => parseFloat(a.tone));
        if (tones.length > 0) {
          const avgTone = tones.reduce((s, t) => s + t, 0) / tones.length;
          if (Math.abs(avgTone) > 10) {
            flags.push(`Extreme average tone (${avgTone > 0 ? '+' : ''}${avgTone.toFixed(1)}) suggests coordinated sentiment`);
            if (severity === 'low') severity = 'medium';
          }
        }

        if (flags.length > 0) {
          alerts.push({
            id: `alert-${hashId(group.title)}`,
            title: group.title,
            flags,
            severity,
            articleCount: group.articles.length,
            sourceCount: uniqueSources.length,
            sources: uniqueSources.slice(0, 6),
            countries: uniqueCountries.slice(0, 5),
            highCredSources: highCred,
            lowCredSources: lowCred,
            unknownSources: unknownCred,
          });
        }
      }

      // Sort: high severity first, then medium, then low
      const severityOrder = { high: 0, medium: 1, low: 2 };
      alerts.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

      const topAlerts = alerts.slice(0, 15);
      await cacheService.set(cacheKey, topAlerts, CACHE_TTL);
      return topAlerts;
    } catch (err) {
      console.error('[Credibility] Error detecting manipulation:', err.message);
      return [];
    }
  }

  /**
   * Analyze source distribution across tiers, geographies, and bias spectrum.
   */
  async getSourceDistribution() {
    const cacheKey = 'credibility:distribution';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      // Fetch a wide sample of recent articles
      const query = encodeURIComponent('*');
      const url = `${GDELT_BASE}?query=${query}&mode=artlist&maxrecords=100&format=json&timespan=1d&sort=datedesc`;
      const data = await fetchGDELTRaw(url, 'Credibility');
      const articles = data?.articles || [];

      // Count by tier
      const tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, unknown: 0 };
      const countryCounts = {};
      const biasCounts = { left: 0, 'center-left': 0, center: 0, 'center-right': 0, right: 0, unknown: 0 };
      const typeCounts = { wire: 0, newspaper: 0, broadcast: 0, digital: 0, state: 0, unknown: 0 };
      const sourcesUsed = new Set();

      for (const article of articles) {
        const domain = extractDomain(article.url || article.domain);
        if (!domain) continue;
        sourcesUsed.add(domain);

        const src = lookupSource(domain);
        if (src) {
          tierCounts[src.tier] = (tierCounts[src.tier] || 0) + 1;
          biasCounts[src.bias] = (biasCounts[src.bias] || 0) + 1;
          typeCounts[src.type] = (typeCounts[src.type] || 0) + 1;
        } else {
          tierCounts.unknown++;
          biasCounts.unknown++;
          typeCounts.unknown++;
        }

        const country = article.sourcecountry || 'Unknown';
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      }

      // Top countries
      const topCountries = Object.entries(countryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([country, count]) => ({ country, count }));

      const distribution = {
        tiers: tierCounts,
        countries: topCountries,
        bias: biasCounts,
        types: typeCounts,
        totalArticles: articles.length,
        uniqueSources: sourcesUsed.size,
      };

      await cacheService.set(cacheKey, distribution, CACHE_TTL);
      return distribution;
    } catch (err) {
      console.error('[Credibility] Error getting source distribution:', err.message);
      return {
        tiers: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, unknown: 0 },
        countries: [],
        bias: { left: 0, 'center-left': 0, center: 0, 'center-right': 0, right: 0, unknown: 0 },
        types: { wire: 0, newspaper: 0, broadcast: 0, digital: 0, state: 0, unknown: 0 },
        totalArticles: 0,
        uniqueSources: 0,
      };
    }
  }

  /**
   * Main method: fetch and combine all credibility data.
   * Returns a unified payload for the frontend.
   */
  async getCombinedData() {
    const cacheKey = 'credibility:combined';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const [claimsResult, manipulationResult, distributionResult] = await Promise.allSettled([
      this.fetchTrendingClaims(),
      this.detectNarrativeManipulation(),
      this.getSourceDistribution(),
    ]);

    const claims = claimsResult.status === 'fulfilled' ? claimsResult.value : [];
    const manipulationAlerts = manipulationResult.status === 'fulfilled' ? manipulationResult.value : [];
    const distribution = distributionResult.status === 'fulfilled' ? distributionResult.value : {};

    // Compute source stats from the credibility database
    const sourceStats = {
      totalInDatabase: SOURCE_CREDIBILITY_DB.length,
      byTier: {
        tier1: SOURCE_CREDIBILITY_DB.filter(s => s.tier === 1).length,
        tier2: SOURCE_CREDIBILITY_DB.filter(s => s.tier === 2).length,
        tier3: SOURCE_CREDIBILITY_DB.filter(s => s.tier === 3).length,
        tier4: SOURCE_CREDIBILITY_DB.filter(s => s.tier === 4).length,
        tier5: SOURCE_CREDIBILITY_DB.filter(s => s.tier === 5).length,
      },
      avgScore: Math.round(
        SOURCE_CREDIBILITY_DB.reduce((sum, s) => sum + s.score, 0) / SOURCE_CREDIBILITY_DB.length
      ),
    };

    // Compute average credibility of trending claims
    const avgClaimCredibility = claims.length > 0
      ? Math.round(claims.reduce((sum, c) => sum + c.credibilityScore, 0) / claims.length)
      : 0;

    const verifiedClaims = claims.filter(c => c.verificationStatus === 'verified').length;
    const flaggedNarratives = manipulationAlerts.filter(a => a.severity === 'high' || a.severity === 'medium').length;

    const result = {
      claims,
      manipulationAlerts,
      sourceStats,
      distribution,
      summary: {
        totalSources: distribution.uniqueSources || 0,
        avgCredibility: avgClaimCredibility,
        flaggedNarratives,
        verifiedClaims,
      },
      updatedAt: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  }
}

export const credibilityService = new CredibilityService();
