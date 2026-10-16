/** @jest-environment node */

import { findMissingPaidCheckouts } from '@/server/payments/find-missing-paid-checkouts';
import { reconcileMissingPayments } from '@/server/payments/reconcile-missing-payments';
import { recoverPaidCheckout } from '@/server/payments/recover-paid-checkout';

jest.mock('@/server/payments/find-missing-paid-checkouts', () => ({
  findMissingPaidCheckouts: jest.fn(),
}));

jest.mock('@/server/payments/recover-paid-checkout', () => ({
  recoverPaidCheckout: jest.fn(),
}));

describe('reconcileMissingPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    findMissingPaidCheckouts.mockResolvedValue({
      scanned: 10,
      missingSessionIds: ['cs_test_123', 'cs_test_456'],
    });

    recoverPaidCheckout.mockResolvedValue({
      created: true,
    });
  });

  test('recovers missing Stripe payments', async () => {
    const result = await reconcileMissingPayments();

    expect(result).toEqual({
      scanned: 10,
      missing: 2,
      recovered: 2,
      alreadyRecorded: 0,
    });

    expect(recoverPaidCheckout).toHaveBeenNthCalledWith(1, 'cs_test_123');

    expect(recoverPaidCheckout).toHaveBeenNthCalledWith(2, 'cs_test_456');
  });

  test('handles reconciliation when nothing is missing', async () => {
    findMissingPaidCheckouts.mockResolvedValue({
      scanned: 10,
      missingSessionIds: [],
    });

    const result = await reconcileMissingPayments();

    expect(result).toEqual({
      scanned: 10,
      missing: 0,
      recovered: 0,
      alreadyRecorded: 0,
    });

    expect(recoverPaidCheckout).not.toHaveBeenCalled();
  });

  test('does not count already-recorded payments as recovered', async () => {
    recoverPaidCheckout
      .mockResolvedValueOnce({ created: true })
      .mockResolvedValueOnce({ created: false });

    const result = await reconcileMissingPayments();

    expect(result.recovered).toBe(1);
    expect(result.alreadyRecorded).toBe(1);
  });

  test('continues recovering other payments after a failure', async () => {
    recoverPaidCheckout
      .mockRejectedValueOnce(new Error('Firestore unavailable'))
      .mockResolvedValueOnce({ created: true });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(reconcileMissingPayments()).rejects.toThrow(
        'Failed to recover 1 of 2 missing Stripe payments.',
      );

      expect(recoverPaidCheckout).toHaveBeenCalledTimes(2);

      expect(consoleSpy).toHaveBeenCalledWith('Stripe payment reconciliation failed', {
        checkoutSessionId: 'cs_test_123',
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('propagates payment discovery failures', async () => {
    findMissingPaidCheckouts.mockRejectedValue(new Error('Stripe unavailable'));

    await expect(reconcileMissingPayments()).rejects.toThrow('Stripe unavailable');

    expect(recoverPaidCheckout).not.toHaveBeenCalled();
  });
});
