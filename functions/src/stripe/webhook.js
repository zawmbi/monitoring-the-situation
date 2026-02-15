/**
 * Stripe webhook handler — HTTP Cloud Function
 *
 * SECURITY: This endpoint is the ONLY way subscription status gets
 * updated in Firestore. The frontend never writes to the subscriptions
 * collection directly.
 *
 * Webhook verification:
 * 1. Stripe-Signature header is validated against the webhook secret
 * 2. Only specific event types are processed
 * 3. All updates go through Firestore — never through client
 *
 * The raw request body MUST be preserved (not parsed as JSON) for
 * Stripe signature verification to work.
 */

import Stripe from 'stripe';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

// SECURITY: Secrets are stored in Firebase environment config,
// never in source code or .env files committed to version control.
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

const db = getFirestore();

/**
 * Handle incoming Stripe webhook events.
 *
 * SECURITY: This function runs as an HTTP function (not callable)
 * because Stripe sends raw HTTP POST requests with a signature header.
 * The rawBody is used for signature verification — if the body has been
 * parsed or modified, verification will fail, protecting against forgery.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function handleStripeWebhook(req, res) {
  // SECURITY: Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2024-04-10' });

  // SECURITY: Verify the webhook signature using the raw body.
  // This ensures the request actually came from Stripe and wasn't
  // forged by an attacker who knows the endpoint URL.
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      stripeWebhookSecret.value(),
    );
  } catch (err) {
    console.error('[Stripe] Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Process the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error(`[Stripe] Error processing ${event.type}:`, err);
    // SECURITY: Return 200 even on processing errors to prevent
    // Stripe from retrying and creating duplicate operations.
    // Log the error for investigation.
    res.status(200).json({ received: true, error: 'Processing error logged' });
  }
}

/**
 * Handle successful checkout — user just subscribed.
 * Links the Stripe customer ID to the Firebase UID and activates pro.
 */
async function handleCheckoutComplete(session) {
  // SECURITY: The Firebase UID is passed as client_reference_id during
  // checkout session creation. This is the link between Stripe and Firebase.
  const uid = session.client_reference_id;
  if (!uid) {
    console.error('[Stripe] No client_reference_id in checkout session');
    return;
  }

  const customerId = session.customer;
  const subscriptionId = session.subscription;

  // Fetch subscription details from Stripe for period info
  const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2024-04-10' });
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update subscription record in Firestore
  await db.collection('subscriptions').doc(uid).set({
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000),
    updated_at: FieldValue.serverTimestamp(),
  });

  // SECURITY: Update the user's subscription_status field.
  // This is the ONLY place where subscription_status changes to 'pro'.
  await db.collection('users').doc(uid).update({
    subscription_status: 'pro',
  });

  console.log(`[Stripe] User ${uid} upgraded to pro`);
}

/**
 * Handle subscription updates (renewal, plan change, etc.)
 */
async function handleSubscriptionUpdate(subscription) {
  // Find the user by Stripe customer ID
  const uid = await findUserByCustomerId(subscription.customer);
  if (!uid) return;

  const status = subscription.status;
  const isPro = status === 'active' || status === 'trialing';

  await db.collection('subscriptions').doc(uid).update({
    status,
    current_period_end: new Date(subscription.current_period_end * 1000),
    updated_at: FieldValue.serverTimestamp(),
  });

  await db.collection('users').doc(uid).update({
    subscription_status: isPro ? 'pro' : 'free',
  });

  console.log(`[Stripe] Subscription updated for ${uid}: ${status}`);
}

/**
 * Handle subscription cancellation.
 * Downgrades the user to free tier.
 */
async function handleSubscriptionDeleted(subscription) {
  const uid = await findUserByCustomerId(subscription.customer);
  if (!uid) return;

  await db.collection('subscriptions').doc(uid).update({
    status: 'canceled',
    updated_at: FieldValue.serverTimestamp(),
  });

  // SECURITY: Downgrade to free tier on cancellation
  await db.collection('users').doc(uid).update({
    subscription_status: 'free',
  });

  console.log(`[Stripe] Subscription canceled for ${uid}`);
}

/**
 * Handle failed payment — mark subscription as past_due.
 */
async function handlePaymentFailed(invoice) {
  const uid = await findUserByCustomerId(invoice.customer);
  if (!uid) return;

  await db.collection('subscriptions').doc(uid).update({
    status: 'past_due',
    updated_at: FieldValue.serverTimestamp(),
  });

  // SECURITY: Don't immediately downgrade on payment failure —
  // give the user a grace period (Stripe handles retry logic).
  // But do update the status for visibility.
  console.log(`[Stripe] Payment failed for ${uid}`);
}

/**
 * Find a user's Firebase UID by their Stripe customer ID.
 * SECURITY: Searches the subscriptions collection, which maps 1:1 with users.
 */
async function findUserByCustomerId(customerId) {
  const snap = await db
    .collection('subscriptions')
    .where('stripe_customer_id', '==', customerId)
    .limit(1)
    .get();

  if (snap.empty) {
    console.error(`[Stripe] No user found for customer ${customerId}`);
    return null;
  }

  return snap.docs[0].id;
}

// Export secrets so Firebase knows to bind them to this function
export const secrets = [stripeSecretKey, stripeWebhookSecret];
