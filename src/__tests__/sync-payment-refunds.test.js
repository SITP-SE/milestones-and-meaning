/** @jest-environment node */

import { adminDb } from '@/server/firebase/admin';
import { getSuccessfulRefundAmount } from '@/server/payments/get-successful-refund-amount';
import { syncPaymentRefunds } from '@/server/payments/sync-payment-refunds';

jest.mock('@/server/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
    runTransaction: jest.fn(),
  },
}));

jest.mock('@/server/payments/get-successful-refund-amount', () => ({
  getSuccessfulRefundAmount: jest.fn(),
}));

describe('syncPaymentRefunds', () => {
  const paymentRef = { id: 'cs_test_123' };

  let queryGet;
  let transactionGet;
  let transactionUpdate;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(Date, 'now').mockReturnValue(12345);

    queryGet = jest.fn().mockResolvedValue({
      size: 1,
      docs: [{ ref: paymentRef }],
    });

    adminDb.collection.mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: queryGet,
        }),
      }),
    });

    transactionGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        stripePaymentIntentId: 'pi_test123',
        amountCents: 95500,
        refundAmountCents: 0,
        status: 'paid',
      }),
    });

    transactionUpdate = jest.fn();

    adminDb.runTransaction.mockImplementation((callback) =>
      callback({
        get: transactionGet,
        update: transactionUpdate,
      }),
    );

    getSuccessfulRefundAmount.mockResolvedValue(20000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('records a partial refund', async () => {
    const result = await syncPaymentRefunds('pi_test123');

    expect(result).toEqual({
      updated: true,
      paymentId: 'cs_test_123',
      refundAmountCents: 20000,
      status: 'partially_refunded',
    });

    expect(transactionUpdate).toHaveBeenCalledWith(
      paymentRef,
      expect.objectContaining({
        refundAmountCents: 20000,
        status: 'partially_refunded',
        refundCheckedAtMillis: 12345,
      }),
    );
  });

  test('records a full refund', async () => {
    getSuccessfulRefundAmount.mockResolvedValue(95500);

    const result = await syncPaymentRefunds('pi_test123');

    expect(result.status).toBe('refunded');

    expect(transactionUpdate).toHaveBeenCalledWith(
      paymentRef,
      expect.objectContaining({
        refundAmountCents: 95500,
        status: 'refunded',
      }),
    );
  });

  test('does not overwrite a newer synchronization', async () => {
    transactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        stripePaymentIntentId: 'pi_test123',
        amountCents: 95500,
        refundAmountCents: 20000,
        status: 'partially_refunded',
        refundCheckedAtMillis: 12346,
      }),
    });

    getSuccessfulRefundAmount.mockResolvedValue(0);

    const result = await syncPaymentRefunds('pi_test123');

    expect(result).toEqual({
      updated: false,
      paymentId: 'cs_test_123',
      refundAmountCents: 20000,
      status: 'partially_refunded',
    });

    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  test('rejects missing payment records', async () => {
    queryGet.mockResolvedValue({
      size: 0,
      docs: [],
    });

    await expect(syncPaymentRefunds('pi_test123')).rejects.toThrow(
      'Missing or ambiguous payment record.',
    );

    expect(getSuccessfulRefundAmount).not.toHaveBeenCalled();
  });

  test('rejects ambiguous payment records', async () => {
    queryGet.mockResolvedValue({
      size: 2,
      docs: [{ ref: paymentRef }, { ref: { id: 'duplicate' } }],
    });

    await expect(syncPaymentRefunds('pi_test123')).rejects.toThrow(
      'Missing or ambiguous payment record.',
    );

    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  test('rejects a mismatched PaymentIntent', async () => {
    transactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        stripePaymentIntentId: 'pi_different',
        amountCents: 95500,
      }),
    });

    await expect(syncPaymentRefunds('pi_test123')).rejects.toThrow(
      'PaymentIntent reference mismatch.',
    );

    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  test('propagates Stripe retrieval errors', async () => {
    getSuccessfulRefundAmount.mockRejectedValue(new Error('Stripe unavailable'));

    await expect(syncPaymentRefunds('pi_test123')).rejects.toThrow('Stripe unavailable');

    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  test('rejects refund totals exceeding the payment', async () => {
    getSuccessfulRefundAmount.mockResolvedValue(100000);

    await expect(syncPaymentRefunds('pi_test123')).rejects.toThrow('Invalid refund amounts.');

    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  test('does not let a slower older fetch overwrite a newer result', async () => {
    let resolveOlderFetch;

    getSuccessfulRefundAmount
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOlderFetch = resolve;
          }),
      )
      .mockResolvedValueOnce(20000);

    const payment = {
      stripePaymentIntentId: 'pi_test123',
      amountCents: 95500,
      refundAmountCents: 0,
      status: 'paid',
    };

    transactionGet.mockImplementation(async () => ({
      exists: true,
      data: () => ({ ...payment }),
    }));

    transactionUpdate.mockImplementation((_ref, changes) => {
      Object.assign(payment, changes);
    });

    Date.now.mockReturnValueOnce(100).mockReturnValueOnce(200);

    const olderSync = syncPaymentRefunds('pi_test123');

    // Allow the first request to begin fetching from Stripe.
    await new Promise((resolve) => setImmediate(resolve));

    expect(resolveOlderFetch).toEqual(expect.any(Function));

    // The newer request finishes first.
    await syncPaymentRefunds('pi_test123');

    // The older request finally returns outdated information.
    resolveOlderFetch(0);

    const olderResult = await olderSync;

    expect(olderResult.updated).toBe(false);
    expect(payment.refundAmountCents).toBe(20000);
    expect(payment.status).toBe('partially_refunded');
  });
});
