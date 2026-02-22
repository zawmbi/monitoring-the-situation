/**
 * Court Rulings & Major Legal Cases Service
 * Sources: GDELT Doc API for court/judicial articles
 *          Static tracked cases reference data
 */

import { cacheService } from './cache.service.js';
import { fetchGDELT } from './gdelt.client.js';

const CACHE_KEY = 'court:combined';
const CACHE_TTL = 900; // 15 minutes

// Major pending/recent cases to track (static reference data)
const TRACKED_CASES = [
  { id: 'icc-netanyahu', court: 'ICC', title: 'ICC Arrest Warrant - Benjamin Netanyahu', status: 'active', category: 'international', link: 'https://www.icc-cpi.int/situations/palestine', description: 'Arrest warrant issued for alleged war crimes and crimes against humanity in the Palestine situation.' },
  { id: 'icc-putin', court: 'ICC', title: 'ICC Arrest Warrant - Vladimir Putin', status: 'active', category: 'international', link: 'https://www.icc-cpi.int/situations/ukraine', description: 'Arrest warrant for alleged unlawful deportation of children from Ukraine to Russia.' },
  { id: 'icj-genocide', court: 'ICJ', title: 'ICJ South Africa v. Israel - Application of the Convention on the Prevention and Punishment of the Crime of Genocide in the Gaza Strip', status: 'pending', category: 'international', link: 'https://www.icj-cij.org/case/192', description: 'South Africa alleges Israel has violated its obligations under the Genocide Convention in Gaza.' },
  { id: 'scotus-term', court: 'SCOTUS', title: 'United States Supreme Court 2025-26 Term - Major Pending Cases', status: 'active', category: 'domestic', link: 'https://www.supremecourt.gov/oral_arguments/argument_calendars.aspx', description: 'Key cases on executive power, immigration, gun rights, and environmental regulation.' },
  { id: 'trump-cases', court: 'Federal', title: 'United States v. Donald J. Trump - Federal Criminal Cases (Election Interference & Classified Documents)', status: 'pending', category: 'domestic', link: 'https://www.courtlistener.com/docket/67656604/united-states-v-trump/', description: 'Federal prosecutions related to 2020 election interference and classified documents retention.' },
  { id: 'tiktok-ban', court: 'SCOTUS', title: 'TikTok Inc. v. Garland - Challenge to Protecting Americans from Foreign Adversary Controlled Applications Act', status: 'decided', category: 'tech', link: 'https://www.supremecourt.gov/search.aspx?filename=/docket/docketfiles/html/public/24-656.html', description: 'Constitutional challenge to the federal law requiring TikTok divestiture or ban.' },
  { id: 'google-antitrust', court: 'Federal', title: 'United States v. Google LLC - Search & Advertising Antitrust Case', status: 'active', category: 'tech', link: 'https://www.courtlistener.com/docket/16913808/united-states-v-google-llc/', description: 'DOJ antitrust action alleging Google monopolized search and search advertising markets.' },
  { id: 'meta-ftc', court: 'Federal', title: 'Federal Trade Commission v. Meta Platforms Inc. - Social Networking Monopoly Trial', status: 'active', category: 'tech', link: 'https://www.ftc.gov/legal-library/browse/cases-proceedings/191-0134-facebook-inc-ftc-v', description: 'FTC seeks to unwind Meta acquisitions of Instagram and WhatsApp for illegal monopoly maintenance.' },
];

const COURT_QUERIES = [
  '"Supreme Court" ruling OR decision',
  '"court ruling" OR "landmark case" OR "ICC" ruling OR "ICJ" ruling',
  '"antitrust" ruling OR "trade court" OR "sanctions ruling"',
];

async function fetchCourtArticles() {
  const allArticles = [];

  const results = await Promise.allSettled(
    COURT_QUERIES.map(query =>
      fetchGDELT(query, { maxRecords: 25, timespan: '7d', caller: 'Court' })
    )
  );

  results.forEach(r => {
    if (r.status === 'fulfilled') allArticles.push(...r.value);
  });

  // Deduplicate by URL
  const seen = new Set();
  return allArticles
    .filter(article => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    })
    .slice(0, 50);
}

export const courtService = {
  async getCombinedData() {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    const articles = await fetchCourtArticles();

    const result = {
      trackedCases: TRACKED_CASES,
      articles,
      summary: {
        totalTracked: TRACKED_CASES.length,
        totalArticles: articles.length,
      },
      dataSource: {
        trackedCases: 'Static reference data (manually curated)',
        articles: 'GDELT Doc API',
      },
      lastUpdated: new Date().toISOString(),
    };

    await cacheService.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  },
};
