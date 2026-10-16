import { getSuccessfulRefundAmount } from '@/server/payments/get-successful-refund-amount';
import { getStripeClient } from '@/server/stripe/client';

jest.mock('@/server/stripe/client', () => ({
  getStripeClient: jest.fn(),
}));

const listRefunds = jest.fn();

function refundStream(refunds) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const refund of refunds) {
        yield refund;
      }
    },
  };
}

function makeRefund(amount, status = 'succeeded') {
  return {
    amount,
    status,
    currency: 'cad',
  };
}

describe('getSuccessfulRefundAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getStripeClient.mockReturnValue({
      refunds: {
        list: listRefunds,
      },
    });
  });

  test('returns zero when there are no refunds', async () => {
    listRefunds.mockReturnValue(refundStream([]));

    await expect(getSuccessfulRefundAmount('pi_test123')).resolves.toBe(0);

    expect(listRefunds).toHaveBeenCalledWith({
      payment_intent: 'pi_test123',
      limit: 100,
    });
  });

  test('totals multiple successful refunds', async () => {
    listRefunds.mockReturnValue(refundStream([makeRefund(10050), makeRefund(5000)]));

    await expect(getSuccessfulRefundAmount('pi_test123')).resolves.toBe(15050);
  });

  test('excludes pending, failed, and canceled refunds', async () => {
    listRefunds.mockReturnValue(
      refundStream([
        makeRefund(10000, 'pending'),
        makeRefund(20000, 'failed'),
        makeRefund(30000, 'canceled'),
        makeRefund(5000, 'succeeded'),
      ]),
    );

    await expect(getSuccessfulRefundAmount('pi_test123')).resolves.toBe(5000);
  });

  test('processes more than one page of refunds', async () => {
    listRefunds.mockReturnValue(refundStream(Array.from({ length: 101 }, () => makeRefund(100))));

    await expect(getSuccessfulRefundAmount('pi_test123')).resolves.toBe(10100);
  });

  test('rejects invalid PaymentIntent IDs', async () => {
    await expect(getSuccessfulRefundAmount('invalid')).rejects.toThrow('Invalid PaymentIntent ID.');

    expect(listRefunds).not.toHaveBeenCalled();
  });

  test('rejects invalid refund amounts', async () => {
    listRefunds.mockReturnValue(refundStream([makeRefund(100.5)]));

    await expect(getSuccessfulRefundAmount('pi_test123')).rejects.toThrow(
      'Invalid Stripe refund amount.',
    );
  });

  test('rejects refunds in another currency', async () => {
    listRefunds.mockReturnValue(
      refundStream([
        {
          ...makeRefund(1000),
          currency: 'usd',
        },
      ]),
    );

    await expect(getSuccessfulRefundAmount('pi_test123')).rejects.toThrow(
      'Invalid Stripe refund amount.',
    );
  });
});
