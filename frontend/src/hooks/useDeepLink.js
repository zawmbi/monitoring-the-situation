import { useEffect, useCallback } from 'react';

/**
 * Reads URL search params on mount and returns state overrides.
 * Updates URL when state changes (without page reload).
 */
export function useDeepLink(state, setState) {
  // Read URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const overrides = {};

    if (params.get('panel')) overrides.panel = params.get('panel');
    if (params.get('country')) overrides.country = params.get('country');
    if (params.get('tab')) overrides.tab = params.get('tab');
    if (params.get('conflict')) overrides.conflict = params.get('conflict');

    if (Object.keys(overrides).length > 0) {
      setState(overrides);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL when state changes
  const updateUrl = useCallback((newState) => {
    const params = new URLSearchParams();
    if (newState.panel) params.set('panel', newState.panel);
    if (newState.country) params.set('country', newState.country);
    if (newState.tab) params.set('tab', newState.tab);
    if (newState.conflict) params.set('conflict', newState.conflict);

    const search = params.toString();
    const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, []);

  return { updateUrl };
}
