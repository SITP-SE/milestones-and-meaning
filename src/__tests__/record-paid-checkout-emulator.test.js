/** @jest-environment node */

import { randomUUID } from 'node:crypto';

import { adminDb } from '@/server/firebase/admin';
import { recordPaidCheckout } from '@/server/payments/record-paid-checkout';

// Never run database integration tests against production.
const isLocalEmulator =
  ['127.0.0.1:8080', 'localhost:8080'].includes(process.env.FIRESTORE_EMULATOR_HOST) &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'milestones-and-meaning';

const describeWithEmulator = isLocalEmulator ? describe : describe.skip;

describeWithEmulator('paid Checkout Firestore integration', () => {
  let session;
  let paymentRef;
  let engagementRef;

  beforeEach(() => {
    const uniqueId = randomUUID().replaceAll('-', '');
    const checkoutSessionId = `cs_test_${uniqueId}`;

    session = {
      object: 'checkout.session',
      id: checkoutSessionId,
      mode: 'payment',
      payment_status: 'paid',
      currency: 'cad',
      amount_total: 95500,
      payment_intent: `pi_${uniqueId}`,
      metadata: {
        serviceId: 'strong_start',
      },
      customer_details: {
        individual_name: 'Test Client',
        email: 'test@example.com',
        phone: null,
      },
    };

    paymentRef = adminDb.collection('payments').doc(checkoutSessionId);

    engagementRef = adminDb.collection('serviceEngagements').doc(`stripe_${checkoutSessionId}`);
  });

  afterEach(async () => {
    // Remove all temporary test documents.
    await Promise.all([paymentRef.delete(), engagementRef.delete()]);
  });

  test('creates both payment and engagement documents', async () => {
    const result = await recordPaidCheckout(session);

    expect(result).toEqual({
      created: true,
      paymentId: paymentRef.id,
      engagementId: engagementRef.id,
    });

    const [paymentSnapshot, engagementSnapshot] = await Promise.all([
      paymentRef.get(),
      engagementRef.get(),
    ]);

    expect(paymentSnapshot.exists).toBe(true);
    expect(engagementSnapshot.exists).toBe(true);

    expect(paymentSnapshot.data()).toEqual(
      expect.objectContaining({
        clientName: 'Test Client',
        amountCents: 95500,
        currency: 'cad',
        status: 'paid',
        refundAmountCents: 0,
      }),
    );

    expect(engagementSnapshot.data()).toEqual(
      expect.objectContaining({
        clientName: 'Test Client',
        serviceId: 'strong_start',
        status: 'pending',
        source: 'stripe',
        paymentId: paymentRef.id,
      }),
    );
  });

  test('does not recreate documents for duplicate notifications', async () => {
    const firstResult = await recordPaidCheckout(session);

    const originalPayment = await paymentRef.get();
    const originalCreatedAt = originalPayment.data().createdAt.toMillis();

    const secondResult = await recordPaidCheckout(session);

    expect(firstResult.created).toBe(true);
    expect(secondResult.created).toBe(false);

    const [paymentSnapshot, engagementSnapshot] = await Promise.all([
      paymentRef.get(),
      engagementRef.get(),
    ]);

    expect(paymentSnapshot.exists).toBe(true);
    expect(engagementSnapshot.exists).toBe(true);

    // The existing payment must not be recreated.
    expect(paymentSnapshot.data().createdAt.toMillis()).toBe(originalCreatedAt);
  });

  test('rolls back both writes when the engagement already exists', async () => {
    // Intentionally create a conflicting engagement document.
    await engagementRef.set({
      marker: 'existing-record',
    });

    await expect(recordPaidCheckout(session)).rejects.toThrow();

    const [paymentSnapshot, engagementSnapshot] = await Promise.all([
      paymentRef.get(),
      engagementRef.get(),
    ]);

    // The payment write must not be partially committed.
    expect(paymentSnapshot.exists).toBe(false);

    // The original engagement must remain untouched.
    expect(engagementSnapshot.exists).toBe(true);
    expect(engagementSnapshot.data()).toEqual({
      marker: 'existing-record',
    });
  });
});
