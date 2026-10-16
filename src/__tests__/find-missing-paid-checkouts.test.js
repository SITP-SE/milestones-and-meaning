/** @jest-environment node */

import { adminDb } from '@/server/firebase/admin';
import { findMissingPaidCheckouts } from '@/server/payments/find-missing-paid-checkouts';
import { getStripeClient } from '@/server/stripe/client';

jest.mock('@/server/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

jest.mock('@/server/stripe/client', () => ({
  getStripeClient: jest.fn(),
}));

const validSession = {
  id: 'cs_test_123',
  mode: 'payment',
  payment_status: 'paid',
  currency: 'cad',
  metadata: {
    serviceId: 'strong_start',
  },
};

function sessionStream(sessions) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const session of sessions) {
        yield session;
      }
    },
  };
}

describe('findMissingPaidCheckouts', () => {
  let listSessions;
  let getPayment;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1720000000000);

    listSessions = jest.fn().mockReturnValue(sessionStream([validSession]));

    getStripeClient.mockReturnValue({
      checkout: {
        sessions: {
          list: listSessions,
        },
      },
    });

    getPayment = jest.fn().mockResolvedValue({
      exists: false,
    });

    adminDb.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: getPayment,
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('finds a paid session missing from Firestore', async () => {
    const result = await findMissingPaidCheckouts();

    expect(result).toEqual({
      scanned: 1,
      missingSessionIds: ['cs_test_123'],
    });

    expect(adminDb.collection).toHaveBeenCalledWith('payments');

    expect(listSessions).toHaveBeenCalledWith({
      created: {
        gte: 1720000000 - 7 * 24 * 60 * 60,
      },
      status: 'complete',
      limit: 100,
    });
  });

  test('ignores payments already recorded in Firestore', async () => {
    getPayment.mockResolvedValue({
      exists: true,
    });

    const result = await findMissingPaidCheckouts();

    expect(result.missingSessionIds).toEqual([]);
  });

  test('ignores unpaid sessions', async () => {
    listSessions.mockReturnValue(
      sessionStream([
        {
          ...validSession,
          payment_status: 'unpaid',
        },
      ]),
    );

    const result = await findMissingPaidCheckouts();

    expect(result.missingSessionIds).toEqual([]);
    expect(getPayment).not.toHaveBeenCalled();
  });

  test('ignores unrelated sessions', async () => {
    listSessions.mockReturnValue(
      sessionStream([
        {
          ...validSession,
          metadata: {},
        },
      ]),
    );

    const result = await findMissingPaidCheckouts();

    expect(result.missingSessionIds).toEqual([]);
    expect(getPayment).not.toHaveBeenCalled();
  });

  test('finds multiple missing payments', async () => {
    listSessions.mockReturnValue(
      sessionStream([
        validSession,
        {
          ...validSession,
          id: 'cs_test_456',
        },
      ]),
    );

    const result = await findMissingPaidCheckouts();

    expect(result).toEqual({
      scanned: 2,
      missingSessionIds: ['cs_test_123', 'cs_test_456'],
    });
  });

  test('propagates Firestore failures', async () => {
    getPayment.mockRejectedValue(new Error('Firestore unavailable'));

    await expect(findMissingPaidCheckouts()).rejects.toThrow('Firestore unavailable');
  });

  test('rejects scans exceeding the safety limit', async () => {
    listSessions.mockReturnValue(
      sessionStream(
        Array.from({ length: 501 }, (_, index) => ({
          ...validSession,
          id: `cs_test_${index}`,
        })),
      ),
    );

    await expect(findMissingPaidCheckouts()).rejects.toThrow(
      'Stripe reconciliation scan limit exceeded.',
    );
  });
});
