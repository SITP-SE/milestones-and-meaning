/** @jest-environment node */

import { randomUUID } from 'node:crypto';

import { adminDb } from '@/server/firebase/admin';
import { getSuccessfulRefundAmount } from '@/server/payments/get-successful-refund-amount';
import { syncPaymentRefunds } from '@/server/payments/sync-payment-refunds';

jest.mock('@/server/payments/get-successful-refund-amount', () => ({
  getSuccessfulRefundAmount: jest.fn(),
}));

// Never run integration tests against production Firestore.
const isLocalEmulator =
  ['127.0.0.1:8080', 'localhost:8080'].includes(process.env.FIRESTORE_EMULATOR_HOST) &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'milestones-and-meaning';

const describeWithEmulator = isLocalEmulator ? describe : describe.skip;

describeWithEmulator('refund synchronization Firestore integration', () => {
  let paymentIntentId;
  let paymentRef;
  let engagementRef;

  beforeEach(async () => {
    jest.clearAllMocks();

    const uniqueId = randomUUID().replaceAll('-', '');
    const checkoutSessionId = `cs_test_${uniqueId}`;

    paymentIntentId = `pi_${uniqueId}`;

    paymentRef = adminDb.collection('payments').doc(checkoutSessionId);

    engagementRef = adminDb.collection('serviceEngagements').doc(`stripe_${checkoutSessionId}`);

    await Promise.all([
      paymentRef.set({
        stripePaymentIntentId: paymentIntentId,
        amountCents: 95500,
        refundAmountCents: 0,
        currency: 'cad',
        status: 'paid',
      }),
      engagementRef.set({
        paymentId: checkoutSessionId,
        status: 'active',
        source: 'stripe',
      }),
    ]);

    getSuccessfulRefundAmount.mockResolvedValue(20000);
  });

  afterEach(async () => {
    await Promise.all([paymentRef.delete(), engagementRef.delete()]);
  });

  test('updates a partially refunded payment', async () => {
    const result = await syncPaymentRefunds(paymentIntentId);

    expect(result.updated).toBe(true);
    expect(result.refundAmountCents).toBe(20000);
    expect(result.status).toBe('partially_refunded');

    const snapshot = await paymentRef.get();

    expect(snapshot.data()).toEqual(
      expect.objectContaining({
        amountCents: 95500,
        refundAmountCents: 20000,
        status: 'partially_refunded',
      }),
    );
  });

  test('updates a fully refunded payment', async () => {
    getSuccessfulRefundAmount.mockResolvedValue(95500);

    await syncPaymentRefunds(paymentIntentId);

    const snapshot = await paymentRef.get();

    expect(snapshot.data()).toEqual(
      expect.objectContaining({
        refundAmountCents: 95500,
        status: 'refunded',
      }),
    );
  });

  test('does not double-count repeated refund notifications', async () => {
    await syncPaymentRefunds(paymentIntentId);
    await syncPaymentRefunds(paymentIntentId);

    const snapshot = await paymentRef.get();

    expect(snapshot.data()).toEqual(
      expect.objectContaining({
        refundAmountCents: 20000,
        status: 'partially_refunded',
      }),
    );

    const engagement = await engagementRef.get();

    // Financial refunds must not cancel the engagement.
    expect(engagement.data().status).toBe('active');
  });

  test('does not overwrite a newer synchronization result', async () => {
    await paymentRef.update({
      refundAmountCents: 20000,
      status: 'partially_refunded',
      refundCheckedAtMillis: Date.now() + 600000,
    });

    getSuccessfulRefundAmount.mockResolvedValue(0);

    const result = await syncPaymentRefunds(paymentIntentId);

    expect(result.updated).toBe(false);

    const snapshot = await paymentRef.get();

    expect(snapshot.data().refundAmountCents).toBe(20000);
    expect(snapshot.data().status).toBe('partially_refunded');
  });

  test('leaves payment unchanged when refund total is invalid', async () => {
    getSuccessfulRefundAmount.mockResolvedValue(100000);

    await expect(syncPaymentRefunds(paymentIntentId)).rejects.toThrow('Invalid refund amounts.');

    const snapshot = await paymentRef.get();

    expect(snapshot.data().refundAmountCents).toBe(0);
    expect(snapshot.data().status).toBe('paid');
  });
});
