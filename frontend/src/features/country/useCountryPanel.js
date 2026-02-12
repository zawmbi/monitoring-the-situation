/**
 * useCountryPanel Hook
 * Manages country/state/province panel state and data fetching
 */

import { useState, useEffect, useRef } from 'react';
import { fetchCountryProfile } from '../../services/countryInfo';
import { fetchCurrencyVsUSD } from '../../services/currencyService';
import { fetchLeaderApproval, hasApprovalData, preloadApprovals } from '../../services/approvalService';
import { fetchEconomicProfile } from '../../services/economicService';
import { getLeader, getLeaderLive, fetchLeaderPhoto } from './worldLeaders';
import { resolveCountryName } from './countryAliases';
import US_STATE_INFO from '../../usStateInfo';
import CA_PROVINCE_INFO from '../../caProvinceInfo';

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

      // Prefer live leader data over static
      const leader = liveLeader || leaderData || {};

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
    setCountryPanel({
      open: true,
      data: {
        name: stateName,
        capital: info?.capital || 'Unknown',
        region: 'United States',
        subregion: info?.abbr || '',
        timezone: info?.timezone || 'UTC-5',
        population: '',
        leader: '',
        scope: 'state',
      },
    });
  };

  const openProvincePanel = (provinceName) => {
    const info = CA_PROVINCE_INFO[provinceName] || CA_PROVINCE_INFO[provinceName.replace(' Territory', '')];
    setCountryPanel({
      open: true,
      data: {
        name: provinceName,
        capital: info?.capital || 'Unknown',
        region: 'Canada',
        subregion: info?.abbr || '',
        timezone: info?.timezone || 'UTC-5',
        population: '',
        leader: '',
        scope: 'province',
      },
    });
  };

  const closeCountryPanel = () => {
    setCountryPanel({ open: false, data: null });
    setCurrencyData(null);
    setApprovalData(null);
    setEconomicData(null);
  };

  return {
    countryPanel,
    currencyData,
    currencyLoading,
    approvalData,
    approvalLoading,
    economicData,
    economicLoading,
    openCountryPanel,
    openStatePanel,
    openProvincePanel,
    closeCountryPanel,
  };
}

export default useCountryPanel;
