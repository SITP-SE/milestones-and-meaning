/** @jest-environment node */

import { randomUUID } from 'node:crypto';

import { adminDb } from '@/server/firebase/admin';
import { recoverPaidCheckout } from '@/server/payments/recover-paid-checkout';
import { getStripeClient } from '@/server/stripe/client';

jest.mock('@/server/stripe/client', () => ({
  getStripeClient: jest.fn(),
}));

// Prevent integration tests from accessing production Firestore.
const isLocalEmulator =
  ['127.0.0.1:8080', 'localhost:8080'].includes(process.env.FIRESTORE_EMULATOR_HOST) &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'milestones-and-meaning';

const describeWithEmulator = isLocalEmulator ? describe : describe.skip;

describeWithEmulator('payment recovery Firestore integration', () => {
  let session;
  let paymentRef;
  let engagementRef;
  let retrieveSession;
  let stripeRefunds;

  beforeEach(() => {
    jest.clearAllMocks();

    stripeRefunds = [];

    const uniqueId = randomUUID().replaceAll('-', '');
    const sessionId = `cs_test_${uniqueId}`;

    session = {
      object: 'checkout.session',
      id: sessionId,
      mode: 'payment',
      payment_status: 'paid',
      currency: 'cad',
      amount_total: 95500,
      payment_intent: `pi_${uniqueId}`,
      metadata: {
        serviceId: 'strong_start',
      },
      customer_details: {
        name: 'Recovery Test Client',
        email: 'recovery@example.com',
        phone: null,
      },
    };

    paymentRef = adminDb.collection('payments').doc(sessionId);

    engagementRef = adminDb.collection('serviceEngagements').doc(`stripe_${sessionId}`);

    retrieveSession = jest.fn().mockImplementation(async () => session);

    getStripeClient.mockReturnValue({
      checkout: {
        sessions: {
          retrieve: retrieveSession,
        },
      },
      paymentIntents: {
        retrieve: jest.fn().mockImplementation(async (paymentIntentId) => ({
          id: paymentIntentId,
          object: 'payment_intent',
          metadata: {
            serviceId: 'strong_start',
            source: 'milestones_and_meaning',
          },
        })),
      },
      refunds: {
        list: jest.fn().mockImplementation(() => ({
          async *[Symbol.asyncIterator]() {
            for (const refund of stripeRefunds) {
              yield refund;
            }
          },
        })),
      },
    });
  });

  afterEach(async () => {
    await Promise.all([paymentRef.delete(), engagementRef.delete()]);
  });

  test('recovers missing payment and engagement records', async () => {
    const result = await recoverPaidCheckout(session.id);

    expect(result.created).toBe(true);
    expect(retrieveSession).toHaveBeenCalledWith(session.id);

    const [payment, engagement] = await Promise.all([paymentRef.get(), engagementRef.get()]);

    expect(payment.exists).toBe(true);
    expect(engagement.exists).toBe(true);

    expect(payment.data()).toEqual(
      expect.objectContaining({
        amountCents: 95500,
        currency: 'cad',
        status: 'paid',
        serviceId: 'strong_start',
      }),
    );

    expect(engagement.data()).toEqual(
      expect.objectContaining({
        status: 'pending',
        source: 'stripe',
        paymentId: paymentRef.id,
      }),
    );
  });

  test('does not duplicate records when recovery runs twice', async () => {
    const first = await recoverPaidCheckout(session.id);

    const originalPayment = await paymentRef.get();
    const originalCreatedAt = originalPayment.data().createdAt.toMillis();

    const second = await recoverPaidCheckout(session.id);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);

    const payment = await paymentRef.get();
    const engagement = await engagementRef.get();

    expect(payment.exists).toBe(true);
    expect(engagement.exists).toBe(true);

    expect(payment.data().createdAt.toMillis()).toBe(originalCreatedAt);
  });

  test('does not create records for unpaid sessions', async () => {
    session.payment_status = 'unpaid';

    await expect(recoverPaidCheckout(session.id)).rejects.toThrow(
      'Checkout payment is not confirmed.',
    );

    const [payment, engagement] = await Promise.all([paymentRef.get(), engagementRef.get()]);

    expect(payment.exists).toBe(false);
    expect(engagement.exists).toBe(false);
  });

  test('recovers a previously partially refunded payment', async () => {
    stripeRefunds.push({
      id: 're_test_partial',
      amount: 20000,
      currency: 'cad',
      status: 'succeeded',
    });

    const result = await recoverPaidCheckout(session.id);

    expect(result.created).toBe(true);

    const [payment, engagement] = await Promise.all([paymentRef.get(), engagementRef.get()]);

    expect(payment.data()).toEqual(
      expect.objectContaining({
        amountCents: 95500,
        refundAmountCents: 20000,
        status: 'partially_refunded',
      }),
    );

    // Refunding money must not automatically cancel services.
    expect(engagement.data().status).toBe('pending');
  });

  test('recovers a previously fully refunded payment', async () => {
    stripeRefunds.push({
      id: 're_test_full',
      amount: 95500,
      currency: 'cad',
      status: 'succeeded',
    });

    const result = await recoverPaidCheckout(session.id);

    expect(result.created).toBe(true);

    const payment = await paymentRef.get();

    expect(payment.data()).toEqual(
      expect.objectContaining({
        amountCents: 95500,
        refundAmountCents: 95500,
        status: 'refunded',
      }),
    );
  });
});
