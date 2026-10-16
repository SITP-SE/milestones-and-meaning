/** @jest-environment node */

import { GET } from '@/app/api/cron/reconcile-payments/route';
import { reconcileMissingPayments } from '@/server/payments/reconcile-missing-payments';

jest.mock('@/server/payments/reconcile-missing-payments', () => ({
  reconcileMissingPayments: jest.fn(),
}));

const TEST_SECRET = 'test-cron-secret-with-enough-length';
const originalSecret = process.env.CRON_SECRET;

function makeRequest(secret) {
  const headers = {};

  if (secret) {
    headers.authorization = `Bearer ${secret}`;
  }

  return new Request('http://localhost:3000/api/cron/reconcile-payments', {
    method: 'GET',
    headers,
  });
}

describe('payment reconciliation cron endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = TEST_SECRET;

    reconcileMissingPayments.mockResolvedValue({
      scanned: 10,
      missing: 2,
      recovered: 2,
      alreadyRecorded: 0,
    });
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
  });

  test('rejects requests without authorization', async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(reconcileMissingPayments).not.toHaveBeenCalled();
  });

  test('rejects invalid secrets', async () => {
    const response = await GET(makeRequest('wrong-secret'));

    expect(response.status).toBe(401);
    expect(reconcileMissingPayments).not.toHaveBeenCalled();
  });

  test('refuses to run when the secret is not configured', async () => {
    delete process.env.CRON_SECRET;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const response = await GET(makeRequest(TEST_SECRET));

      expect(response.status).toBe(503);
      expect(reconcileMissingPayments).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('runs reconciliation with valid authorization', async () => {
    const response = await GET(makeRequest(TEST_SECRET));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      scanned: 10,
      missing: 2,
      recovered: 2,
      alreadyRecorded: 0,
    });

    expect(reconcileMissingPayments).toHaveBeenCalledTimes(1);
  });

  test('returns 500 when reconciliation fails', async () => {
    reconcileMissingPayments.mockRejectedValue(new Error('Stripe unavailable'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const response = await GET(makeRequest(TEST_SECRET));

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: 'Reconciliation failed.',
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
