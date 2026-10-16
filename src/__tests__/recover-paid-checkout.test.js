/** @jest-environment node */

import { recordPaidCheckout } from '@/server/payments/record-paid-checkout';
import { recoverPaidCheckout } from '@/server/payments/recover-paid-checkout';
import { getStripeClient } from '@/server/stripe/client';
import { syncPaymentRefunds } from '@/server/payments/sync-payment-refunds';

jest.mock('@/server/payments/record-paid-checkout', () => ({
  recordPaidCheckout: jest.fn(),
}));

jest.mock('@/server/stripe/client', () => ({
  getStripeClient: jest.fn(),
}));

jest.mock('@/server/payments/sync-payment-refunds', () => ({
  syncPaymentRefunds: jest.fn(),
}));

const validSession = {
  id: 'cs_test_123',
  object: 'checkout.session',
  mode: 'payment',
  payment_status: 'paid',
  currency: 'cad',
  amount_total: 95500,
  payment_intent: 'pi_test123',
  metadata: {
    serviceId: 'strong_start',
  },
  customer_details: {
    name: 'Test Client',
    email: 'test@example.com',
    phone: null,
  },
};

describe('recoverPaidCheckout', () => {
  let retrieveSession;
  let retrievePaymentIntent;

  beforeEach(() => {
    jest.clearAllMocks();

    retrieveSession = jest.fn().mockResolvedValue(validSession);

    retrievePaymentIntent = jest.fn().mockResolvedValue({
      id: 'pi_test123',
      object: 'payment_intent',
      metadata: {
        serviceId: 'strong_start',
        source: 'milestones_and_meaning',
      },
    });

    syncPaymentRefunds.mockResolvedValue({
      updated: true,
      paymentId: 'cs_test_123',
      refundAmountCents: 0,
      status: 'paid',
    });

    getStripeClient.mockReturnValue({
      checkout: {
        sessions: {
          retrieve: retrieveSession,
        },
      },
      paymentIntents: {
        retrieve: retrievePaymentIntent,
      },
    });

    recordPaidCheckout.mockResolvedValue({
      created: true,
      paymentId: 'cs_test_123',
      engagementId: 'stripe_cs_test_123',
    });
  });

  test('recovers a confirmed Stripe payment', async () => {
    const result = await recoverPaidCheckout('cs_test_123');

    expect(retrieveSession).toHaveBeenCalledWith('cs_test_123');
    expect(recordPaidCheckout).toHaveBeenCalledWith(validSession);

    expect(result).toEqual({
      created: true,
      paymentId: 'cs_test_123',
      engagementId: 'stripe_cs_test_123',
    });
  });

  test('supports already-recorded payments', async () => {
    recordPaidCheckout.mockResolvedValue({
      created: false,
      paymentId: 'cs_test_123',
      engagementId: 'stripe_cs_test_123',
    });

    const result = await recoverPaidCheckout('cs_test_123');

    expect(result.created).toBe(false);
    expect(recordPaidCheckout).toHaveBeenCalledTimes(1);
  });

  test('rejects invalid Checkout Session IDs', async () => {
    await expect(recoverPaidCheckout('../invalid')).rejects.toThrow('Invalid Checkout Session ID.');

    expect(getStripeClient).not.toHaveBeenCalled();
    expect(recordPaidCheckout).not.toHaveBeenCalled();
  });

  test('rejects mismatched Stripe sessions', async () => {
    retrieveSession.mockResolvedValue({
      ...validSession,
      id: 'cs_test_different',
    });

    await expect(recoverPaidCheckout('cs_test_123')).rejects.toThrow(
      'Stripe Checkout Session mismatch.',
    );

    expect(recordPaidCheckout).not.toHaveBeenCalled();
  });

  test('rejects payments that are not confirmed', async () => {
    retrieveSession.mockResolvedValue({
      ...validSession,
      payment_status: 'unpaid',
    });

    await expect(recoverPaidCheckout('cs_test_123')).rejects.toThrow(
      'Checkout payment is not confirmed.',
    );

    expect(recordPaidCheckout).not.toHaveBeenCalled();
  });

  test('rejects incomplete customer information', async () => {
    retrieveSession.mockResolvedValue({
      ...validSession,
      customer_details: {
        name: null,
        email: null,
        phone: null,
      },
    });

    await expect(recoverPaidCheckout('cs_test_123')).rejects.toThrow();

    expect(recordPaidCheckout).not.toHaveBeenCalled();
  });

  test('propagates Stripe API failures', async () => {
    retrieveSession.mockRejectedValue(new Error('Stripe unavailable'));

    await expect(recoverPaidCheckout('cs_test_123')).rejects.toThrow('Stripe unavailable');

    expect(recordPaidCheckout).not.toHaveBeenCalled();
  });

  test('propagates Firestore recording failures', async () => {
    recordPaidCheckout.mockRejectedValue(new Error('Firestore unavailable'));

    await expect(recoverPaidCheckout('cs_test_123')).rejects.toThrow('Firestore unavailable');
  });

  test('verifies the PaymentIntent before recovering', async () => {
    await recoverPaidCheckout('cs_test_123');

    expect(retrievePaymentIntent).toHaveBeenCalledWith('pi_test123');

    expect(recordPaidCheckout).toHaveBeenCalledTimes(1);
  });

  test('rejects unrelated Stripe payments', async () => {
    retrievePaymentIntent.mockResolvedValue({
      id: 'pi_test123',
      object: 'payment_intent',
      metadata: {
        serviceId: 'strong_start',
        source: 'another_application',
      },
    });

    await expect(recoverPaidCheckout('cs_test_123')).rejects.toThrow(
      'Checkout Session does not belong to this application.',
    );

    expect(recordPaidCheckout).not.toHaveBeenCalled();
  });

  test('rejects mismatched service metadata', async () => {
    retrievePaymentIntent.mockResolvedValue({
      id: 'pi_test123',
      object: 'payment_intent',
      metadata: {
        serviceId: 'wedding_officiation',
        source: 'milestones_and_meaning',
      },
    });

    await expect(recoverPaidCheckout('cs_test_123')).rejects.toThrow(
      'Checkout Session does not belong to this application.',
    );

    expect(recordPaidCheckout).not.toHaveBeenCalled();
  });

  test('supports older website payments without a source marker', async () => {
    retrievePaymentIntent.mockResolvedValue({
      id: 'pi_test123',
      object: 'payment_intent',
      metadata: {
        serviceId: 'strong_start',
      },
    });

    const result = await recoverPaidCheckout('cs_test_123');

    expect(result.created).toBe(true);
    expect(recordPaidCheckout).toHaveBeenCalledTimes(1);
  });

  test('synchronizes refunds after recovering a payment', async () => {
    await recoverPaidCheckout('cs_test_123');

    expect(recordPaidCheckout).toHaveBeenCalledWith(validSession);
    expect(syncPaymentRefunds).toHaveBeenCalledWith('pi_test123');
  });

  test('synchronizes refunds for already-recorded payments', async () => {
    recordPaidCheckout.mockResolvedValue({
      created: false,
      paymentId: 'cs_test_123',
      engagementId: 'stripe_cs_test_123',
    });

    const result = await recoverPaidCheckout('cs_test_123');

    expect(result.created).toBe(false);
    expect(syncPaymentRefunds).toHaveBeenCalledWith('pi_test123');
  });

  test('propagates refund synchronization failures for safe retry', async () => {
    syncPaymentRefunds.mockRejectedValue(new Error('Refund synchronization unavailable'));

    await expect(recoverPaidCheckout('cs_test_123')).rejects.toThrow(
      'Refund synchronization unavailable',
    );

    expect(recordPaidCheckout).toHaveBeenCalledTimes(1);
    expect(syncPaymentRefunds).toHaveBeenCalledTimes(1);
  });
});
