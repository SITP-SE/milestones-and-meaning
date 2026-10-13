import Stripe from 'stripe';

import { verifyStripeWebhook } from '@/server/stripe/verify-webhook';

const TEST_SECRET = 'whsec_test_only';
const stripe = new Stripe('sk_test_example');

const payload = JSON.stringify({
  id: 'evt_test_123',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123',
      payment_status: 'paid',
    },
  },
});

describe('verifyStripeWebhook', () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    }
  });

  function createSignature(body = payload) {
    return stripe.webhooks.generateTestHeaderString({
      payload: body,
      secret: TEST_SECRET,
    });
  }

  test('accepts a correctly signed Stripe event', () => {
    const signature = createSignature();

    const event = verifyStripeWebhook(payload, signature);

    expect(event.id).toBe('evt_test_123');
    expect(event.type).toBe('checkout.session.completed');
    expect(event.data.object.payment_status).toBe('paid');
  });

  test('rejects a modified webhook payload', () => {
    const signature = createSignature();

    const modifiedPayload = payload.replace('"paid"', '"unpaid"');

    expect(() => verifyStripeWebhook(modifiedPayload, signature)).toThrow();
  });

  test('rejects invalid signatures', () => {
    expect(() => verifyStripeWebhook(payload, 'invalid-signature')).toThrow();
  });

  test('rejects missing signatures', () => {
    expect(() => verifyStripeWebhook(payload, null)).toThrow('Missing Stripe webhook signature.');
  });

  test('rejects missing webhook configuration', () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    expect(() => verifyStripeWebhook(payload, createSignature())).toThrow(
      'Stripe webhook secret is not configured.',
    );
  });
});
