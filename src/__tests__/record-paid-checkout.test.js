/** @jest-environment node */

import { adminDb, FieldValue } from '@/server/firebase/admin';
import { recordPaidCheckout } from '@/server/payments/record-paid-checkout';

jest.mock('@/server/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
    runTransaction: jest.fn(),
  },
  FieldValue: {
    serverTimestamp: jest.fn(),
  },
}));

const validSession = {
  object: 'checkout.session',
  id: 'cs_test_123',
  mode: 'payment',
  payment_status: 'paid',
  currency: 'cad',
  amount_total: 95500,
  payment_intent: 'pi_123',
  metadata: {
    serviceId: 'strong_start',
  },
  customer_details: {
    individual_name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: null,
  },
};

describe('recordPaidCheckout', () => {
  let get;
  let create;

  beforeEach(() => {
    jest.clearAllMocks();

    FieldValue.serverTimestamp.mockReturnValue('SERVER_TIMESTAMP');

    get = jest.fn().mockResolvedValue({ exists: false });
    create = jest.fn();

    adminDb.collection.mockImplementation((collectionName) => ({
      doc: (id) => ({
        id,
        path: `${collectionName}/${id}`,
      }),
    }));

    adminDb.runTransaction.mockImplementation((callback) => callback({ get, create }));
  });

  test('creates a payment and engagement together', async () => {
    const result = await recordPaidCheckout(validSession);

    expect(result).toEqual({
      created: true,
      paymentId: 'cs_test_123',
      engagementId: 'stripe_cs_test_123',
    });

    expect(adminDb.runTransaction).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(2);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'payments/cs_test_123',
      }),
      expect.objectContaining({
        clientName: 'Sarah Johnson',
        serviceId: 'strong_start',
        amountCents: 95500,
        currency: 'cad',
        status: 'paid',
        refundAmountCents: 0,
      }),
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'serviceEngagements/stripe_cs_test_123',
      }),
      expect.objectContaining({
        clientName: 'Sarah Johnson',
        serviceId: 'strong_start',
        status: 'pending',
        source: 'stripe',
        paymentId: 'cs_test_123',
      }),
    );
  });

  test('does not create duplicate records', async () => {
    get.mockResolvedValue({ exists: true });

    const result = await recordPaidCheckout(validSession);

    expect(result.created).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  test('rejects unconfirmed payments', async () => {
    await expect(
      recordPaidCheckout({
        ...validSession,
        payment_status: 'unpaid',
      }),
    ).rejects.toThrow('Checkout payment is not confirmed.');

    expect(adminDb.runTransaction).not.toHaveBeenCalled();
  });

  test('propagates transaction failures', async () => {
    adminDb.runTransaction.mockRejectedValue(new Error('Firestore unavailable'));

    await expect(recordPaidCheckout(validSession)).rejects.toThrow('Firestore unavailable');
  });
});
