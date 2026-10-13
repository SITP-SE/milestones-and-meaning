import { NextResponse } from 'next/server';

import { recordPaidCheckout } from '@/server/payments/record-paid-checkout';
import { verifyStripeWebhook } from '@/server/stripe/verify-webhook';

export const runtime = 'nodejs';

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

  let event;

  try {
    event = verifyStripeWebhook(payload, signature);
  } catch {
    // Never process a webhook whose signature cannot be verified.
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  // Other events, including refunds, will be handled separately.
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;

  // A completed Checkout Session is not necessarily paid.
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true });
  }

  try {
    await recordPaidCheckout(session);
  } catch {
    // Record only event identifiers, not customer or card data.
    console.error('Stripe payment synchronization failed', {
      eventId: event.id,
      eventType: event.type,
    });

    // Stripe must receive an error so it can retry delivery.
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }

  // Acknowledge only after Firestore has successfully committed.
  return NextResponse.json({ received: true });
}
