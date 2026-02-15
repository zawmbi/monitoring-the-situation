/**
 * Create Stripe Checkout session — callable Cloud Function
 *
 * SECURITY: Creates a Stripe Checkout session for the authenticated user.
 * The Firebase UID is passed as client_reference_id so we can link the
 * subscription back to the user when the webhook fires.
 *
 * Never exposes the Stripe secret key to the frontend — all Stripe API
 * calls happen server-side in Cloud Functions.
 */

import Stripe from 'stripe';
import { getVerifiedUser } from '../middleware/auth.js';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const db = getFirestore();

/**
 * Handle a createCheckoutSession callable request.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {Promise<{ success: boolean, url?: string, error?: string }>}
 */
export async function handleCreateCheckout(request) {
  // 1. SECURITY: Verify authentication — anonymous users cannot subscribe
  const uid = request.auth?.uid;
  if (!uid) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. SECURITY: Verify user exists and is not banned
  let user;
  try {
    user = await getVerifiedUser(uid);
  } catch (err) {
    return { success: false, error: err.message };
  }

  // SECURITY: Anonymous users must upgrade to a full account first.
  // Stripe requires an email for billing, and anonymous accounts
  // don't have one.
  if (user.is_anonymous) {
    return { success: false, error: 'Please sign in with Google before subscribing' };
  }

  // SECURITY: Prevent duplicate subscriptions
  if (user.subscription_status === 'pro') {
    return { success: false, error: 'Already subscribed to Pro' };
  }

  const { priceId, successUrl, cancelUrl } = request.data || {};

  if (!priceId || !successUrl || !cancelUrl) {
    return { success: false, error: 'Missing required checkout parameters' };
  }

  // SECURITY: Validate URLs to prevent open redirect attacks.
  // Only allow redirects to our own domain.
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url);
      return allowedOrigins.some((origin) => parsed.origin === origin);
    } catch {
      return false;
    }
  };

  if (!isValidUrl(successUrl) || !isValidUrl(cancelUrl)) {
    return { success: false, error: 'Invalid redirect URL' };
  }

  try {
    const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2024-04-10' });

    // Check if user already has a Stripe customer ID
    const subDoc = await db.collection('subscriptions').doc(uid).get();
    let customerId = subDoc.exists ? subDoc.data().stripe_customer_id : null;

    // Create a new Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { firebase_uid: uid },
      });
      customerId = customer.id;
    }

    // SECURITY: client_reference_id links this checkout to the Firebase UID.
    // This is used in the webhook handler to update the correct user.
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: uid,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return { success: true, url: session.url };
  } catch (err) {
    console.error('[Stripe] Checkout error:', err);
    return { success: false, error: 'Failed to create checkout session' };
  }
}

export const secrets = [stripeSecretKey];
