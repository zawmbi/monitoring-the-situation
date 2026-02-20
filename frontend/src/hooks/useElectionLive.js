/**
 * useElectionLive Hook
 * Fetches live election data from the backend (market-derived ratings + FEC data).
 * Merges with static fallback data from electionData.js.
 * Auto-refreshes every 5 minutes for a live feel.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getStateElectionData, SENATE_RACES, GOVERNOR_RACES } from '../features/elections/electionData';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT = 20000;

export function useElectionLive(stateName) {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMounted = useRef(true);
  const fetchedGlobal = useRef(false);
  const globalCache = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchLiveData = useCallback(async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch('/api/elections/live', {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`${response.status}`);
      const result = await response.json();

      if (!isMounted.current) return;

      if (result.success && result.data) {
        globalCache.current = result.data;
        fetchedGlobal.current = true;
        setLiveData(result.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (!isMounted.current) return;
      // Keep showing stale data on error
      console.warn('[useElectionLive] Fetch failed:', err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  // Initial fetch + periodic refresh
  useEffect(() => {
    if (!fetchedGlobal.current) {
      fetchLiveData();
    } else if (globalCache.current) {
      setLiveData(globalCache.current);
      setLastUpdated(new Date());
    }

    const interval = setInterval(fetchLiveData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  /**
   * Merge static election data with live data for a specific state.
   * Live market-derived ratings override static ratings.
   * FEC fundraising supplements static fundraising data.
   */
  const getStateData = useCallback((state) => {
    const staticData = getStateElectionData(state);
    if (!liveData) return { ...staticData, live: null };

    const marketRatings = liveData.marketRatings || {};
    const fecData = liveData.fecData || {};

    // Merge polling data from Wikipedia
    const pollingData = liveData.pollingData || {};
    const statePolls = pollingData.byState?.[state] || null;

    // Merge Senate data
    let senate = staticData.senate;
    const senateKey = `${state}:senate`;
    const senateLive = marketRatings[senateKey];
    if (senate && senateLive) {
      senate = {
        ...senate,
        liveRating: senateLive.derivedRating,
        dWinProb: senateLive.dWinProb,
        rWinProb: senateLive.rWinProb,
        marketUrl: senateLive.marketUrl,
        marketSource: senateLive.marketSource,
        marketVolume: senateLive.marketVolume,
        marketOutcomes: senateLive.outcomes,
        // Ensemble model fields
        confidence: senateLive.confidence || null,
        signalCount: senateLive.signalCount || 0,
        breakdown: senateLive.breakdown || null,
        pollingMargin: senateLive.pollingMargin || null,
        pollCount: senateLive.pollCount || 0,
        pollingSources: senateLive.pollingSources || [],
        pvi: senateLive.pvi || null,
      };
    }
    // Attach live polls to senate race
    if (senate && statePolls) {
      senate = {
        ...senate,
        liveGeneralPolls: statePolls.generalPolls || [],
        livePrimaryPolls: statePolls.primaryPolls || [],
      };
    }

    // Merge Governor data
    let governor = staticData.governor;
    const govKey = `${state}:governor`;
    const govLive = marketRatings[govKey];
    if (governor && govLive) {
      governor = {
        ...governor,
        liveRating: govLive.derivedRating,
        dWinProb: govLive.dWinProb,
        rWinProb: govLive.rWinProb,
        marketUrl: govLive.marketUrl,
        marketSource: govLive.marketSource,
        marketVolume: govLive.marketVolume,
        marketOutcomes: govLive.outcomes,
        confidence: govLive.confidence || null,
        signalCount: govLive.signalCount || 0,
        breakdown: govLive.breakdown || null,
        pvi: govLive.pvi || null,
      };
    }

    // Merge House district data
    let houseDistricts = staticData.houseDistricts || [];
    if (houseDistricts.length > 0) {
      houseDistricts = houseDistricts.map(d => {
        const distKey = `${state}:house:${d.code}`;
        const distLive = marketRatings[distKey];
        if (!distLive) return d;
        return {
          ...d,
          liveRating: distLive.derivedRating,
          dWinProb: distLive.dWinProb,
          rWinProb: distLive.rWinProb,
          marketUrl: distLive.marketUrl,
          marketSource: distLive.marketSource,
          marketVolume: distLive.marketVolume,
          marketOutcomes: distLive.outcomes,
          confidence: distLive.confidence || null,
          signalCount: distLive.signalCount || 0,
          breakdown: distLive.breakdown || null,
        };
      });
    }

    // State code lookup for FEC/IE data
    const stateCodeMap = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY',
    };
    const sc = stateCodeMap[state] || '';
    const ieData = (liveData.independentExpenditures || {})[sc] || null;

    // Merge FEC candidate data into race fundraising
    const fecCandidates = (liveData.fecCandidates || {})[sc] || [];
    const fecSummary = fecData[sc] || null;

    // Build live fundraising from FEC candidates
    if (fecCandidates.length > 0) {
      const liveFundraising = {};
      for (const c of fecCandidates) {
        const p = c.party;
        if (!p) continue;
        if (!liveFundraising[p]) liveFundraising[p] = 0;
        liveFundraising[p] += c.totalRaised || 0;
      }
      const formatMoney = (num) => {
        if (!num || num === 0) return null;
        if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
        return `$${num.toFixed(0)}`;
      };
      const liveFundraisingFormatted = {};
      for (const [p, total] of Object.entries(liveFundraising)) {
        const formatted = formatMoney(total);
        if (formatted) liveFundraisingFormatted[p] = formatted;
      }

      if (Object.keys(liveFundraisingFormatted).length > 0) {
        if (senate) {
          senate = { ...senate, liveFundraising: liveFundraisingFormatted, fecCandidates };
        }
      }
    }

    return {
      ...staticData,
      senate,
      governor,
      houseDistricts,
      independentExpenditures: ieData,
      fecCandidates,
      fecSummary,
      upcomingElections: liveData.upcomingElections || [],
      genericBallot: pollingData.genericBallot || null,
      approval: pollingData.approval || null,
      live: {
        timestamp: liveData.timestamp,
        fecConfigured: liveData.fecConfigured,
        civicConfigured: liveData.civicConfigured,
        marketCount: liveData.marketCount,
        model: liveData.model || null,
        senateProjection: liveData.model?.senateProjection || null,
      },
    };
  }, [liveData]);

  // Also fetch election news from GDELT
  const [newsData, setNewsData] = useState(null);
  const newsCache = useRef(null);

  const fetchElectionNews = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch('/api/elections/news', {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return;
      const result = await response.json();
      if (!isMounted.current) return;
      if (result.success && result.data) {
        newsCache.current = result.data;
        setNewsData(result.data);
      }
    } catch (err) {
      // Keep stale news on error
    }
  }, []);

  // Fetch state-specific election news
  const fetchStateNews = useCallback(async (state) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch(`/api/elections/news/${encodeURIComponent(state)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (err) {
      return null;
    }
  }, []);

  // Fetch news on mount
  useEffect(() => {
    if (!newsCache.current) fetchElectionNews();
    const newsInterval = setInterval(fetchElectionNews, 10 * 60 * 1000);
    return () => clearInterval(newsInterval);
  }, [fetchElectionNews]);

  return {
    liveData,
    loading,
    lastUpdated,
    refresh: fetchLiveData,
    getStateData,
    isLive: !!liveData && Object.keys(liveData.marketRatings || {}).length > 0,
    newsData,
    fetchStateNews,
  };
}

/**
 * Hook to get election live data for the full map.
 * Returns market-derived ratings keyed by state, for map coloring.
 */
export function useElectionMapData() {
  const { liveData, isLive, loading } = useElectionLive();

  const getMapRating = useCallback((stateName, raceType = 'senate') => {
    if (!liveData?.marketRatings) return null;
    const key = `${stateName}:${raceType}`;
    const live = liveData.marketRatings[key];
    return live?.derivedRating || null;
  }, [liveData]);

  return { getMapRating, isLive, loading };
}

export default useElectionLive;
