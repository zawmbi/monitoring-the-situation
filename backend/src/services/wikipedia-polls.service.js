/**
 * Wikipedia Polls Service — DEPRECATED
 *
 * This source has been deprecated in favor of FiveThirtyEight polling data.
 * All exported methods retain their original signatures but return empty results
 * to avoid breaking downstream consumers.
 *
 * Previously: fetched rendered HTML from Wikipedia via the MediaWiki API and
 * parsed polling tables from wikitable-classed elements using regex extraction.
 *
 * Replacement: Use fiveThirtyEight.service.js via pollingAggregator.service.js
 */

class WikipediaPollsService {
  async fetchStatePolls(stateName, raceType = 'regular') {
    return {
      state: stateName,
      polls: [],
      generalPolls: [],
      primaryPolls: [],
      fetchedAt: new Date().toISOString(),
    };
  }

  async fetchAllSenatePolls(races) {
    const results = {};
    for (const [state] of Object.entries(races)) {
      results[state] = {
        state,
        polls: [],
        generalPolls: [],
        primaryPolls: [],
        fetchedAt: new Date().toISOString(),
      };
    }
    return results;
  }
}

export const wikipediaPollsService = new WikipediaPollsService();
export default wikipediaPollsService;
