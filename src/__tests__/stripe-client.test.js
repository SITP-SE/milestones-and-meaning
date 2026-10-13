import Stripe from 'stripe';

import { getStripeClient } from '@/server/stripe/client';

jest.mock('stripe');

describe('Stripe client', () => {
  const originalSecretKey = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
  });

  afterAll(() => {
    if (originalSecretKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = originalSecretKey;
    }
  });

  test('rejects missing Stripe credentials', () => {
    expect(() => getStripeClient()).toThrow('Stripe secret key is not configured.');

    expect(Stripe).not.toHaveBeenCalled();
  });

  test('initializes and reuses the Stripe client', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_example';

    const first = getStripeClient();
    const second = getStripeClient();

    expect(first).toBe(second);
    expect(Stripe).toHaveBeenCalledTimes(1);
    expect(Stripe).toHaveBeenCalledWith('sk_test_example');
  });
});
