/**
 * useSubscription hook
 *
 * Manages subscription state and checkout flow.
 * Follows the existing hook pattern (useState, useCallback).
 *
 * SECURITY: Subscription status is read from Firestore (set by
 * Stripe webhooks via Cloud Functions). The frontend NEVER determines
 * tier access — it only displays the status. All tier enforcement
 * happens in Cloud Functions.
 */

import { useState, useEffect, useCallback } from 'react';
import { getSubscription, createCheckout, createPortalSession } from '../firebase/firestore.js';
import { useAuth } from './useAuth.js';

export function useSubscription() {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch subscription details
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      return;
    }

    setLoading(true);
    getSubscription(user.uid)
      .then((sub) => {
        setSubscription(sub);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  // Start a checkout session
  const checkout = useCallback(
    async (priceId) => {
      if (!user) {
        setError('Please sign in first');
        return null;
      }

      setError(null);
      try {
        const result = await createCheckout({
          priceId,
          successUrl: `${window.location.origin}?subscription=success`,
          cancelUrl: `${window.location.origin}?subscription=canceled`,
        });

        if (result.data.success && result.data.url) {
          // Redirect to Stripe Checkout
          window.location.href = result.data.url;
          return result.data;
        }

        setError(result.data.error || 'Failed to create checkout');
        return result.data;
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [user],
  );

  // Open the Stripe Customer Portal
  const openPortal = useCallback(async () => {
    if (!user) {
      setError('Please sign in first');
      return null;
    }

    setError(null);
    try {
      const result = await createPortalSession({
        returnUrl: window.location.origin,
      });

      if (result.data.success && result.data.url) {
        window.location.href = result.data.url;
        return result.data;
      }

      setError(result.data.error || 'Failed to open portal');
      return result.data;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [user]);

  return {
    subscription,
    isPro: profile?.subscription_status === 'pro',
    loading,
    error,
    checkout,
    openPortal,
  };
}
