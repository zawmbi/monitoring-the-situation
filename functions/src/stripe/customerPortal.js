/**
 * Create Stripe Customer Portal session — callable Cloud Function
 *
 * SECURITY: Allows subscribed users to manage their subscription
 * (cancel, update payment method, view invoices) via Stripe's
 * hosted portal. No billing data is stored or handled in our app.
 */

import Stripe from 'stripe';
import { getVerifiedUser } from '../middleware/auth.js';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const db = getFirestore();

/**
 * Handle a createCustomerPortal callable request.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {Promise<{ success: boolean, url?: string, error?: string }>}
 */
export async function handleCustomerPortal(request) {
  // 1. SECURITY: Verify authentication
  const uid = request.auth?.uid;
  if (!uid) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. SECURITY: Verify user exists and is not banned
  try {
    await getVerifiedUser(uid);
  } catch (err) {
    return { success: false, error: err.message };
  }

  const { returnUrl } = request.data || {};

  if (!returnUrl) {
    return { success: false, error: 'Return URL is required' };
  }

  // 3. Get the Stripe customer ID from the subscriptions collection
  const subDoc = await db.collection('subscriptions').doc(uid).get();
  if (!subDoc.exists || !subDoc.data().stripe_customer_id) {
    return { success: false, error: 'No active subscription found' };
  }

  try {
    const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2024-04-10' });

    const session = await stripe.billingPortal.sessions.create({
      customer: subDoc.data().stripe_customer_id,
      return_url: returnUrl,
    });

    return { success: true, url: session.url };
  } catch (err) {
    console.error('[Stripe] Portal error:', err);
    return { success: false, error: 'Failed to create portal session' };
  }
}

export const secrets = [stripeSecretKey];
