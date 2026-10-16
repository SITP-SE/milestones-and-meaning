import { NextResponse } from 'next/server';

import { recordPaidCheckout } from '@/server/payments/record-paid-checkout';
import { syncPaymentRefunds } from '@/server/payments/sync-payment-refunds';
import { verifyStripeWebhook } from '@/server/stripe/verify-webhook';

export const runtime = 'nodejs';

const REFUND_EVENT_TYPES = new Set(['refund.created', 'refund.updated', 'refund.failed']);

const MAX_WEBHOOK_BYTES = 1024 * 1024;

async function readWebhookBody(request) {
  const reader = request.body?.getReader();

  if (!reader) {
    throw new Error('Missing webhook body.');
  }

  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    totalBytes += value.byteLength;

    if (totalBytes > MAX_WEBHOOK_BYTES) {
      await reader.cancel();
      throw new Error('Webhook body too large.');
    }

    chunks.push(Buffer.from(value));
  }

  // Preserve the original bytes for Stripe signature verification.
  return Buffer.concat(chunks);
}

export async function POST(request) {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing webhook signature.' }, { status: 400 });
  }

  let payload;

  try {
    payload = await readWebhookBody(request);
  } catch (error) {
    if (error.message === 'Webhook body too large.') {
      return NextResponse.json({ error: 'Webhook too large.' }, { status: 413 });
    }

    return NextResponse.json({ error: 'Invalid webhook body.' }, { status: 400 });
  }

  // Ignore Stripe events that this endpoint does not handle.

  let event;

  try {
    event = verifyStripeWebhook(payload, signature);
  } catch {
    // Never process a webhook whose signature cannot be verified.
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  const isCheckout = event.type === 'checkout.session.completed';
  const isRefund = REFUND_EVENT_TYPES.has(event.type);

  if (!isCheckout && !isRefund) {
    return NextResponse.json({ received: true });
  }

  // Completing Checkout does not always mean payment succeeded.
  if (isCheckout && event.data.object?.payment_status !== 'paid') {
    return NextResponse.json({ received: true });
  }

  try {
    if (isCheckout) {
      await recordPaidCheckout(event.data.object);
    } else {
      const refund = event.data.object;

      if (refund?.object !== 'refund') {
        throw new Error('Invalid refund event.');
      }

      // Our Checkout payments use Stripe PaymentIntents.
      // Other types of Stripe refunds may not have one.
      if (refund.payment_intent == null) {
        return NextResponse.json({ received: true });
      }

      const paymentIntentId =
        typeof refund.payment_intent === 'string'
          ? refund.payment_intent
          : refund.payment_intent?.id;

      if (!paymentIntentId) {
        throw new Error('Invalid refund PaymentIntent.');
      }

      await syncPaymentRefunds(paymentIntentId);
    }
  } catch {
    console.error('Stripe payment synchronization failed', {
      eventId: event.id,
      eventType: event.type,
    });

    // Stripe should retry if database or Stripe retrieval fails.
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
