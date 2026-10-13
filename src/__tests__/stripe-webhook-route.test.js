/** @jest-environment node */

import { POST } from '@/app/api/stripe/webhook/route';
import { recordPaidCheckout } from '@/server/payments/record-paid-checkout';
import { syncPaymentRefunds } from '@/server/payments/sync-payment-refunds';
import { verifyStripeWebhook } from '@/server/stripe/verify-webhook';

jest.mock('@/server/payments/record-paid-checkout', () => ({
  recordPaidCheckout: jest.fn(),
}));

jest.mock('@/server/payments/sync-payment-refunds', () => ({
  syncPaymentRefunds: jest.fn(),
}));

jest.mock('@/server/stripe/verify-webhook', () => ({
  verifyStripeWebhook: jest.fn(),
}));

const session = {
  id: 'cs_test_123',
  object: 'checkout.session',
  payment_status: 'paid',
};

function makeRequest(body = '{"test":true}', signature = 'test-signature') {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (signature) {
    headers['stripe-signature'] = signature;
  }

  return new Request('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    headers,
    body,
  });
}

describe('Stripe webhook API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    syncPaymentRefunds.mockResolvedValue({
      updated: true,
    });

    verifyStripeWebhook.mockReturnValue({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: session,
      },
    });

    recordPaidCheckout.mockResolvedValue({
      created: true,
    });
  });

  test('records a verified successful payment', async () => {
    const request = makeRequest();
    const response = await POST(request);

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      received: true,
    });

    expect(verifyStripeWebhook).toHaveBeenCalledWith(
      Buffer.from('{"test":true}'),
      'test-signature',
    );

    expect(recordPaidCheckout).toHaveBeenCalledWith(session);
  });

  test('rejects missing signatures', async () => {
    const response = await POST(makeRequest('{}', null));

    expect(response.status).toBe(400);
    expect(verifyStripeWebhook).not.toHaveBeenCalled();
    expect(recordPaidCheckout).not.toHaveBeenCalled();
  });

  test('rejects invalid signatures', async () => {
    verifyStripeWebhook.mockImplementation(() => {
      throw new Error('Signature verification failed');
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
    expect(recordPaidCheckout).not.toHaveBeenCalled();
  });

  test('ignores unrelated Stripe events', async () => {
    verifyStripeWebhook.mockReturnValue({
      id: 'evt_other',
      type: 'customer.created',
      data: {
        object: {},
      },
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(recordPaidCheckout).not.toHaveBeenCalled();
  });

  test('does not record unpaid Checkout Sessions', async () => {
    verifyStripeWebhook.mockReturnValue({
      id: 'evt_unpaid',
      type: 'checkout.session.completed',
      data: {
        object: {
          ...session,
          payment_status: 'unpaid',
        },
      },
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(recordPaidCheckout).not.toHaveBeenCalled();
  });

  test('returns 500 when Firestore fails', async () => {
    recordPaidCheckout.mockRejectedValue(new Error('Firestore unavailable'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const response = await POST(makeRequest());

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: 'Webhook processing failed.',
      });

      expect(recordPaidCheckout).toHaveBeenCalledTimes(1);

      expect(consoleSpy).toHaveBeenCalledWith('Stripe payment synchronization failed', {
        eventId: 'evt_test_123',
        eventType: 'checkout.session.completed',
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('rejects oversized webhook bodies', async () => {
    const response = await POST(makeRequest('x'.repeat(1024 * 1024 + 1)));

    expect(response.status).toBe(413);
    expect(verifyStripeWebhook).not.toHaveBeenCalled();
    expect(recordPaidCheckout).not.toHaveBeenCalled();
  });

  test.each(['refund.created', 'refund.updated', 'refund.failed'])(
    'synchronizes %s events',
    async (eventType) => {
      verifyStripeWebhook.mockReturnValue({
        id: 'evt_refund_123',
        type: eventType,
        data: {
          object: {
            id: 're_test123',
            object: 'refund',
            payment_intent: 'pi_test123',
          },
        },
      });

      const response = await POST(makeRequest());

      expect(response.status).toBe(200);
      expect(syncPaymentRefunds).toHaveBeenCalledWith('pi_test123');
      expect(recordPaidCheckout).not.toHaveBeenCalled();
    },
  );

  test('returns 500 when refund synchronization fails', async () => {
    verifyStripeWebhook.mockReturnValue({
      id: 'evt_refund_failure',
      type: 'refund.updated',
      data: {
        object: {
          object: 'refund',
          payment_intent: 'pi_test123',
        },
      },
    });

    syncPaymentRefunds.mockRejectedValue(new Error('Firestore unavailable'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const response = await POST(makeRequest());

      expect(response.status).toBe(500);
      expect(syncPaymentRefunds).toHaveBeenCalledWith('pi_test123');
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('ignores refunds without a PaymentIntent', async () => {
    verifyStripeWebhook.mockReturnValue({
      id: 'evt_refund_other',
      type: 'refund.created',
      data: {
        object: {
          object: 'refund',
          payment_intent: null,
        },
      },
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(syncPaymentRefunds).not.toHaveBeenCalled();
  });

  test('rejects malformed refund events', async () => {
    verifyStripeWebhook.mockReturnValue({
      id: 'evt_refund_invalid',
      type: 'refund.created',
      data: {
        object: {
          object: 'unexpected',
          payment_intent: 'pi_test123',
        },
      },
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const response = await POST(makeRequest());

      expect(response.status).toBe(500);
      expect(syncPaymentRefunds).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
