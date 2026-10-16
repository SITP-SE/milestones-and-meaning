import {
  buildDemoPayments,
  DEMO_PAYMENT_COUNT,
} from '../../scripts/seed-data/payment-demo-data.js';

import { services } from '../../scripts/seed-data/services.js';

describe('Local payment demo data', () => {
  const referenceDate = new Date('2026-10-16T12:00:00.000Z');

  test('generates 65 payment records', () => {
    const payments = buildDemoPayments(referenceDate);

    expect(payments).toHaveLength(DEMO_PAYMENT_COUNT);
    expect(payments).toHaveLength(65);
  });

  test('uses unique, repeatable demonstration IDs', () => {
    const firstRun = buildDemoPayments(referenceDate);
    const secondRun = buildDemoPayments(referenceDate);

    const ids = firstRun.map((payment) => payment.id);

    expect(new Set(ids).size).toBe(DEMO_PAYMENT_COUNT);
    expect(ids[0]).toBe('demo_payment_001');
    expect(ids[64]).toBe('demo_payment_065');

    // Running the generator again must not introduce new IDs.
    expect(secondRun).toEqual(firstRun);
  });

  test('uses the configured prices of eligible services', () => {
    const eligibleServices = new Set([
      'complete_marriage_package',
      'strong_start',
      'wedding_officiation',
    ]);

    for (const payment of buildDemoPayments(referenceDate)) {
      const { data } = payment;

      expect(eligibleServices.has(data.serviceId)).toBe(true);
      expect(data.amountCents).toBe(services[data.serviceId].priceCents);
      expect(data.currency).toBe('cad');

      expect(Number.isSafeInteger(data.amountCents)).toBe(true);
      expect(data.amountCents).toBeGreaterThan(0);
    }
  });

  test('generates paid, partially refunded, and refunded records', () => {
    const payments = buildDemoPayments(referenceDate);

    const statuses = new Set(payments.map((payment) => payment.data.status));

    expect(statuses).toEqual(new Set(['paid', 'partially_refunded', 'refunded']));

    for (const { data } of payments) {
      if (data.status === 'paid') {
        expect(data.refundAmountCents).toBe(0);
      }

      if (data.status === 'partially_refunded') {
        expect(data.refundAmountCents).toBeGreaterThan(0);
        expect(data.refundAmountCents).toBeLessThan(data.amountCents);
      }

      if (data.status === 'refunded') {
        expect(data.refundAmountCents).toBe(data.amountCents);
      }
    }
  });

  test('generates valid chronological timestamps', () => {
    const payments = buildDemoPayments(referenceDate);

    expect(payments[0].data.createdAt).toEqual(referenceDate);

    for (let index = 0; index < payments.length; index += 1) {
      const createdAt = payments[index].data.createdAt;

      expect(createdAt).toBeInstanceOf(Date);
      expect(Number.isNaN(createdAt.getTime())).toBe(false);

      if (index > 0) {
        expect(createdAt.getTime()).toBeLessThan(payments[index - 1].data.createdAt.getTime());
      }
    }
  });

  test('never creates fake Stripe transaction references', () => {
    for (const payment of buildDemoPayments(referenceDate)) {
      expect(payment.id).toMatch(/^demo_payment_\d{3}$/);
      expect(payment.data.stripePaymentIntentId).toBeNull();
      expect(payment.data.isDemo).toBe(true);
      expect(payment.data.seedSource).toBe('local_payment_demo');
    }
  });

  test('rejects invalid reference dates', () => {
    expect(() => buildDemoPayments(new Date('invalid'))).toThrow(
      'A valid reference date is required.',
    );

    expect(() => buildDemoPayments(null)).toThrow('A valid reference date is required.');
  });
});
