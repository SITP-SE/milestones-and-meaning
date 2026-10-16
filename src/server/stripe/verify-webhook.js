import { getStripeClient } from '@/server/stripe/client';

export function verifyStripeWebhook(payload, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured.');
  }

  if (!signature) {
    throw new Error('Missing Stripe webhook signature.');
  }

  // Verify the original request body without parsing or modifying it.
  const stripe = getStripeClient();

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
