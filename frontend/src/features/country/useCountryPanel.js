/**
 * useCountryPanel Hook
 * Manages country/state/province panel state and data fetching
 */

import { useState, useEffect, useRef } from 'react';
import { fetchCountryProfile } from '../../services/countryInfo';
import { fetchCurrencyVsUSD } from '../../services/currencyService';
import { fetchLeaderApproval, hasApprovalData, preloadApprovals } from '../../services/approvalService';
import { fetchEconomicProfile } from '../../services/economicService';
import { fetchMarketData } from '../../services/marketService';
import { getLeader, getLeaderLive, fetchLeaderPhoto } from './worldLeaders';
import { resolveCountryName } from './countryAliases';
import US_STATE_INFO from '../../usStateInfo';
import CA_PROVINCE_INFO from '../../caProvinceInfo';

// Helper to compute Wikimedia flag image URL from state/province name
function getFlagUrl(name) {
  const exceptions = {
    'Georgia': 'Flag_of_Georgia_(U.S._state).svg',
    'District of Columbia': 'Flag_of_the_District_of_Columbia.svg',
    'Puerto Rico': 'Flag_of_Puerto_Rico.svg',
    'Newfoundland and Labrador': 'Flag_of_Newfoundland_and_Labrador.svg',
    'Northwest Territories': 'Flag_of_the_Northwest_Territories.svg',
    'Prince Edward Island': 'Flag_of_Prince_Edward_Island.svg',
  };
  const file = exceptions[name] || `Flag_of_${name.replace(/ /g, '_')}.svg`;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${file}`;
}

// Kick off Wikipedia approval data preload on module init
preloadApprovals();

export function useCountryPanel() {
  const [countryPanel, setCountryPanel] = useState({
    open: false,
    data: null,
  });
  const [currencyData, setCurrencyData] = useState(null);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [approvalData, setApprovalData] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [economicData, setEconomicData] = useState(null);
  const [economicLoading, setEconomicLoading] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);

  // Fetch currency data when country data changes
  useEffect(() => {
    if (!countryPanel.open || !countryPanel.data?.currency?.code) {
      setCurrencyData(null);
      return;
    }

    const code = countryPanel.data.currency.code;
    let cancelled = false;
    setCurrencyLoading(true);

    fetchCurrencyVsUSD(code).then(result => {
      if (!cancelled) {
        setCurrencyData(result);
        setCurrencyLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [countryPanel.open, countryPanel.data?.currency?.code]);

  // Fetch approval data when country panel opens
  useEffect(() => {
    const name = countryPanel.data?.name;
    if (!countryPanel.open || !name || countryPanel.data?.scope) {
      setApprovalData(null);
      return;
    }

    let cancelled = false;
    setApprovalLoading(true);

    fetchLeaderApproval(name).then(result => {
      if (!cancelled) {
        setApprovalData(result);
        setApprovalLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [countryPanel.open, countryPanel.data?.name, countryPanel.data?.scope]);

  // Fetch economic data when country panel opens
  useEffect(() => {
    const name = countryPanel.data?.name;
    const cca2 = countryPanel.data?.cca2;
    if (!countryPanel.open || !name || countryPanel.data?.scope) {
      setEconomicData(null);
      return;
    }

    let cancelled = false;
    setEconomicLoading(true);

    fetchEconomicProfile(name, cca2).then(result => {
      if (!cancelled) {
        setEconomicData(result);
        setEconomicLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [countryPanel.open, countryPanel.data?.name, countryPanel.data?.cca2, countryPanel.data?.scope]);

  // Fetch market data when country panel opens; re-fetch every 30s for live ticking
  useEffect(() => {
    const cca2 = countryPanel.data?.cca2;
    if (!countryPanel.open || !cca2 || countryPanel.data?.scope) {
      setMarketData(null);
      return;
    }

    let cancelled = false;
    setMarketLoading(true);

    const doFetch = (skipCache = false) => {
      fetchMarketData(cca2, skipCache).then(result => {
        if (!cancelled) {
          setMarketData(result);
          setMarketLoading(false);
        }
      });
    };

    doFetch(false);
    const interval = setInterval(() => doFetch(true), 30000);

    return () => { cancelled = true; clearInterval(interval); };
  }, [countryPanel.open, countryPanel.data?.cca2, countryPanel.data?.scope]);

  const openCountryPanel = async (rawName) => {
    // Resolve abbreviated TopoJSON names to standard names
    const countryName = resolveCountryName(rawName);

    // Look up leader from static/cached data for instant display
    const leaderData = getLeader(countryName);

    // Set initial state with loading
    setCountryPanel({
      open: true,
      data: {
        name: countryName,
        population: 'Loading...',
        leader: leaderData?.name || 'Loading...',
        leaderTitle: leaderData?.title || '',
        leaderPhoto: null,
        timezone: 'UTC',
        loading: true,
      },
    });

    // Fetch live leader (from Wikidata via backend), photo, and country data in parallel
    const liveLeaderPromise = getLeaderLive(countryName);
    const photoPromise = leaderData?.wiki
      ? fetchLeaderPhoto(leaderData.wiki)
      : Promise.resolve(null);

    // Fetch country data
    try {
      const [profile, liveLeader, leaderPhotoUrl] = await Promise.all([
        fetchCountryProfile(countryName),
        liveLeaderPromise,
        photoPromise,
      ]);

      // Merge live and static leader data — prefer live name/wiki but keep
      // the curated static title when the leader is the same person (Wikidata
      // sometimes returns incorrect titles like "Prime Minister" for the US).
      let leader;
      if (liveLeader && leaderData) {
        leader = {
          ...leaderData,
          ...liveLeader,
          title: leaderData.title || liveLeader.title || '',
        };
      } else {
        leader = liveLeader || leaderData || {};
      }

      // If the live leader has a different wiki article, fetch their photo too
      let finalPhoto = leaderPhotoUrl;
      if (liveLeader?.wiki && liveLeader.wiki !== leaderData?.wiki) {
        finalPhoto = await fetchLeaderPhoto(liveLeader.wiki).catch(() => leaderPhotoUrl);
      }

      if (profile) {
        setCountryPanel(prev => ({
          ...prev,
          data: {
            name: profile.name || countryName,
            officialName: profile.officialName,
            population: profile.population || 'Unknown',
            populationRaw: profile.populationRaw,
            leader: leader.name || profile.leader || 'Unavailable',
            leaderTitle: leader.title || '',
            leaderPhoto: finalPhoto || null,
            timezone: profile.timezone || 'UTC',
            timezoneCount: profile.timezoneCount,
            capital: profile.capital,
            region: profile.region,
            subregion: profile.subregion,
            flagUrl: profile.flagUrl,
            flag: profile.flag,
            currency: profile.currency,
            languages: profile.languages,
            area: profile.area,
            continent: profile.continent,
            cca2: profile.cca2,
            independent: profile.independent,
            unMember: profile.unMember,
            borders: profile.borders,
            dialingCode: profile.dialingCode,
            tld: profile.tld,
            drivingSide: profile.drivingSide,
            demonym: profile.demonym,
            gini: profile.gini,
            latlng: profile.latlng,
            landlocked: profile.landlocked,
            startOfWeek: profile.startOfWeek,
            loading: false,
          },
        }));
      }
    } catch (err) {
      const leaderPhotoUrl = await photoPromise.catch(() => null);
      setCountryPanel(prev => ({
        ...prev,
        data: {
          ...prev.data,
          population: 'Unknown',
          leader: leaderData?.name || 'Unavailable',
          leaderPhoto: leaderPhotoUrl || null,
          error: err?.message || 'Unable to load country info',
          loading: false,
        },
      }));
    }
  };

  const openStatePanel = (stateName) => {
    const info = US_STATE_INFO[stateName];
    const pop = info?.population;
    setCountryPanel({
      open: true,
      data: {
        name: stateName,
        capital: info?.capital || 'Unknown',
        region: 'United States',
        subregion: info?.abbr || '',
        timezone: info?.timezone || 'UTC-5',
        population: pop ? pop.toLocaleString() : '',
        populationRaw: pop || null,
        area: info?.area || null,
        leader: info?.governor || '',
        leaderTitle: info?.leaderTitle || 'Governor',
        leaderParty: info?.governorParty || null,
        leaderPhoto: null,
        largestCity: info?.largestCity || null,
        statehood: info?.statehood || null,
        nickname: info?.nickname || null,
        flagUrl: getFlagUrl(stateName),
        scope: 'state',
        loading: false,
      },
    });

    // Fetch leader photo asynchronously from Wikipedia
    if (info?.wiki) {
      fetchLeaderPhoto(info.wiki).then(photoUrl => {
        if (photoUrl) {
          setCountryPanel(prev => {
            if (!prev.data || prev.data.name !== stateName) return prev;
            return { ...prev, data: { ...prev.data, leaderPhoto: photoUrl } };
          });
        }
      });
    }
  };

  const openProvincePanel = (provinceName) => {
    const info = CA_PROVINCE_INFO[provinceName] || CA_PROVINCE_INFO[provinceName.replace(' Territory', '')];
    const pop = info?.population;
    setCountryPanel({
      open: true,
      data: {
        name: provinceName,
        capital: info?.capital || 'Unknown',
        region: 'Canada',
        subregion: info?.abbr || '',
        timezone: info?.timezone || 'UTC-5',
        population: pop ? pop.toLocaleString() : '',
        populationRaw: pop || null,
        area: info?.area || null,
        leader: info?.premier || '',
        leaderTitle: 'Premier',
        leaderParty: info?.premierParty || null,
        leaderPhoto: null,
        largestCity: info?.largestCity || null,
        confederation: info?.confederation || null,
        regionType: info?.type || 'Province',
        nickname: info?.nickname || null,
        flagUrl: getFlagUrl(provinceName),
        scope: 'province',
        loading: false,
      },
    });

    // Fetch leader photo asynchronously from Wikipedia
    if (info?.wiki) {
      fetchLeaderPhoto(info.wiki).then(photoUrl => {
        if (photoUrl) {
          setCountryPanel(prev => {
            if (!prev.data || prev.data.name !== provinceName) return prev;
            return { ...prev, data: { ...prev.data, leaderPhoto: photoUrl } };
          });
        }
      });
    }
  };

  const openEUPanel = () => {
    setCountryPanel({
      open: true,
      data: {
        name: 'European Union',
        officialName: 'European Union',
        scope: 'eu',
        population: '448,400,000',
        populationRaw: 448400000,
        capital: 'Brussels',
        region: 'Europe',
        subregion: 'Supranational Union',
        flag: '\u{1F1EA}\u{1F1FA}',
        flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg',
        currency: { code: 'EUR', name: 'Euro', symbol: '\u{20AC}' },
        languages: ['24 official languages'],
        area: 4233262,
        continent: 'Europe',
        cca2: 'EU',
        leader: 'Ursula von der Leyen',
        leaderTitle: 'President of the European Commission',
        leaderPhoto: null,
        timezone: 'UTC+1',
        timezoneCount: 4,
        independent: true,
        unMember: false,
        dialingCode: null,
        tld: '.eu',
        drivingSide: 'right',
        demonym: 'European',
        gini: null,
        latlng: [50.85, 4.35],
        landlocked: false,
        startOfWeek: 'monday',
        borders: [],
        euMembers: [
          'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia',
          'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
          'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
          'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia',
          'Slovenia', 'Spain', 'Sweden',
        ],
        euStats: {
          gdpTotal: '$16.6 trillion (2024)',
          gdpPerCapita: '$37,040',
          memberStates: 27,
          foundedTreaty: 'Treaty of Rome (1957)',
          eurozone: 20,
          schengenArea: 29,
          officialLanguages: 24,
        },
        loading: false,
      },
    });

    // Fetch EU leader photo
    fetchLeaderPhoto('Ursula_von_der_Leyen').then(url => {
      setCountryPanel(prev => {
        if (!prev.data || prev.data.name !== 'European Union') return prev;
        return { ...prev, data: { ...prev.data, leaderPhoto: url } };
      });
    });
  };

  const closeCountryPanel = () => {
    setCountryPanel({ open: false, data: null });
    setCurrencyData(null);
    setApprovalData(null);
    setEconomicData(null);
    setMarketData(null);
  };

  return {
    countryPanel,
    currencyData,
    currencyLoading,
    approvalData,
    approvalLoading,
    economicData,
    economicLoading,
    marketData,
    marketLoading,
    openCountryPanel,
    openStatePanel,
    openProvincePanel,
    openEUPanel,
    closeCountryPanel,
  };
}

export default useCountryPanel;
