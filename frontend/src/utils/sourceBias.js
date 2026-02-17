/**
 * Source political bias lookup — mirrors the backend SOURCE_CREDIBILITY_DB.
 * Maps article source domains to their political lean.
 * Used by NewsFeed to show Ground News–style lean indicators.
 */

const BIAS_DB = {
  // Tier 1: Center
  'reuters.com': 'center', 'apnews.com': 'center', 'afp.com': 'center',
  'bbc.com': 'center', 'bbc.co.uk': 'center', 'npr.org': 'center',
  'pbs.org': 'center', 'economist.com': 'center', 'csmonitor.com': 'center',
  'c-span.org': 'center', 'dw.com': 'center', 'swissinfo.ch': 'center',

  // Tier 2
  'nytimes.com': 'center-left', 'washingtonpost.com': 'center-left',
  'theguardian.com': 'center-left', 'ft.com': 'center', 'wsj.com': 'center-right',
  'spiegel.de': 'center-left', 'lemonde.fr': 'center-left', 'elpais.com': 'center-left',
  'corriere.it': 'center', 'bloomberg.com': 'center', 'latimes.com': 'center-left',
  'theatlantic.com': 'center-left', 'newyorker.com': 'center-left',
  'politico.com': 'center', 'abc.net.au': 'center', 'cbc.ca': 'center',
  'nhk.or.jp': 'center', 'france24.com': 'center', 'axios.com': 'center',
  'propublica.org': 'center-left', 'thehill.com': 'center', 'usatoday.com': 'center',
  'time.com': 'center-left', 'foreignaffairs.com': 'center',
  'japantimes.co.jp': 'center', 'scmp.com': 'center', 'haaretz.com': 'center-left',
  'theaustralian.com.au': 'center-right',

  // Tier 3
  'cnn.com': 'center-left', 'foxnews.com': 'right', 'msnbc.com': 'left',
  'aljazeera.com': 'center', 'news.sky.com': 'center',
  'abcnews.go.com': 'center', 'cbsnews.com': 'center', 'nbcnews.com': 'center-left',
  'cnbc.com': 'center', 'bild.de': 'center-right', 'telegraph.co.uk': 'center-right',
  'independent.co.uk': 'center-left', 'thedailybeast.com': 'center-left',
  'newsweek.com': 'center', 'vice.com': 'center-left', 'thesun.co.uk': 'center-right',
  'businessinsider.com': 'center', 'timesofisrael.com': 'center',
  'hindustantimes.com': 'center', 'timesofindia.indiatimes.com': 'center',

  // Tier 4
  'dailymail.co.uk': 'right', 'nypost.com': 'right', 'breitbart.com': 'right',
  'huffpost.com': 'left', 'vox.com': 'left', 'dailywire.com': 'right',
  'salon.com': 'left', 'jacobin.com': 'left', 'theblaze.com': 'right',
  'mirror.co.uk': 'center-left', 'express.co.uk': 'right',
  'motherjones.com': 'left', 'rawstory.com': 'left',
  'washingtontimes.com': 'right', 'oann.com': 'right', 'epochtimes.com': 'right',

  // Tier 5
  'rt.com': 'right', 'sputniknews.com': 'right', 'tass.com': 'center-right',
  'presstv.ir': 'left', 'globalresearch.ca': 'left', 'infowars.com': 'right',
  'naturalnews.com': 'right', 'zerohedge.com': 'right',
  'xinhuanet.com': 'center', 'globaltimes.cn': 'center', 'kcna.kp': 'center',
  'veteranstoday.com': 'left',
};

/** Display config for each bias category */
export const BIAS_CONFIG = {
  'left':         { label: 'Left',         shortLabel: 'L',  color: '#3b82f6' },
  'center-left':  { label: 'Leans Left',   shortLabel: 'LL', color: '#60a5fa' },
  'center':       { label: 'Center',       shortLabel: 'C',  color: '#9ca3af' },
  'center-right': { label: 'Leans Right',  shortLabel: 'LR', color: '#fb923c' },
  'right':        { label: 'Right',        shortLabel: 'R',  color: '#ef4444' },
};

/**
 * Extract the root domain from a URL string.
 * e.g. "https://www.nytimes.com/2024/..." → "nytimes.com"
 */
function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return hostname;
  } catch {
    return null;
  }
}

/**
 * Look up the political bias for a news article.
 * Tries: exact domain match, then stripped subdomain match.
 * @param {string} url - Article URL
 * @param {string} sourceName - Source name (fallback lookup by matching known names)
 * @returns {{ bias: string, label: string, shortLabel: string, color: string } | null}
 */
export function getSourceBias(url, sourceName) {
  const domain = url ? extractDomain(url) : null;

  let bias = null;

  // Try exact domain match
  if (domain && BIAS_DB[domain]) {
    bias = BIAS_DB[domain];
  }

  // Try stripping one subdomain level (e.g., "edition.cnn.com" → "cnn.com")
  if (!bias && domain) {
    const parts = domain.split('.');
    if (parts.length > 2) {
      const shorter = parts.slice(-2).join('.');
      if (BIAS_DB[shorter]) bias = BIAS_DB[shorter];
    }
  }

  if (!bias) return null;

  const config = BIAS_CONFIG[bias];
  return config ? { bias, ...config } : null;
}
