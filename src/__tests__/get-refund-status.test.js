import { getRefundStatus } from '@/server/payments/get-refund-status';

describe('getRefundStatus', () => {
  test('returns paid when nothing is refunded', () => {
    expect(getRefundStatus(95500, 0)).toBe('paid');
  });

  test('returns partially refunded for a partial refund', () => {
    expect(getRefundStatus(95500, 20000)).toBe('partially_refunded');
  });

  test('returns refunded when the full amount is refunded', () => {
    expect(getRefundStatus(95500, 95500)).toBe('refunded');
  });

  test('rejects refunds greater than the payment', () => {
    expect(() => getRefundStatus(95500, 100000)).toThrow('Invalid refund amounts.');
  });

  test('rejects negative refund amounts', () => {
    expect(() => getRefundStatus(95500, -100)).toThrow('Invalid refund amounts.');
  });

  test('rejects non-integer amounts', () => {
    expect(() => getRefundStatus(95500, 100.5)).toThrow('Invalid refund amounts.');
  });
});
