/**
 * useCountryPanel Hook
 * Manages country panel state and data fetching
 */

import { useState } from 'react';
import { fetchCountryProfile } from '../../services/countryInfo';

export function useCountryPanel() {
  const [countryPanel, setCountryPanel] = useState({
    open: false,
    data: null,
    pos: { x: 160, y: 120 },
  });

  const openCountryPanel = async (countryName, position) => {
    // Set initial state with loading
    setCountryPanel({
      open: true,
      data: {
        name: countryName,
        population: 'Loading...',
        leader: 'Loading...',
        timezone: 'UTC',
      },
      pos: position,
    });

    // Fetch country data
    try {
      const profile = await fetchCountryProfile(countryName);
      if (profile) {
        setCountryPanel(prev => ({
          ...prev,
          data: {
            name: profile.name || countryName,
            population: profile.population || 'Unknown',
            leader: profile.leader || 'Unavailable',
            timezone: profile.timezone || 'UTC',
            capital: profile.capital,
            region: profile.region,
            subregion: profile.subregion,
          },
        }));
      }
    } catch (err) {
      setCountryPanel(prev => ({
        ...prev,
        data: {
          name: countryName,
          population: 'Unknown',
          leader: 'Unavailable',
          timezone: 'UTC',
          error: err?.message || 'Unable to load country info',
        },
      }));
    }
  };

  const closeCountryPanel = () => {
    setCountryPanel({ open: false, data: null, pos: { x: 160, y: 120 } });
  };

  const updateCountryPanelPosition = (pos) => {
    setCountryPanel(prev => ({ ...prev, pos }));
  };

  return {
    countryPanel,
    openCountryPanel,
    closeCountryPanel,
    updateCountryPanelPosition,
  };
}

export default useCountryPanel;
