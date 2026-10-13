import { adminDb } from '@/server/firebase/admin';
import { getStripeClient } from '@/server/stripe/client';
import { createServiceCheckoutSession } from '@/server/stripe/create-checkout-session';

jest.mock('@/server/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

jest.mock('@/server/stripe/client', () => ({
  getStripeClient: jest.fn(),
}));

describe('createServiceCheckoutSession', () => {
  const originalAppUrl = process.env.APP_URL;

  let getService;
  let createSession;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.APP_URL = 'http://localhost:3000';

    getService = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        title: 'The Strong Start Program',
        priceCents: 95500,
      }),
    });

    adminDb.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: getService,
      }),
    });

    createSession = jest.fn().mockResolvedValue({
      url: 'https://checkout.stripe.com/test-session',
    });

    getStripeClient.mockReturnValue({
      checkout: {
        sessions: {
          create: createSession,
        },
      },
    });
  });

  afterAll(() => {
    if (originalAppUrl === undefined) {
      delete process.env.APP_URL;
    } else {
      process.env.APP_URL = originalAppUrl;
    }
  });

  test('creates a full-price CAD Checkout Session', async () => {
    const url = await createServiceCheckoutSession('strong_start');

    expect(url).toBe('https://checkout.stripe.com/test-session');

    expect(adminDb.collection).toHaveBeenCalledWith('services');

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        payment_method_types: ['card'],
        adaptive_pricing: {
          enabled: false,
        },
        name_collection: {
          individual: {
            enabled: true,
            optional: false,
          },
        },
        line_items: [
          {
            price_data: {
              currency: 'cad',
              unit_amount: 95500,
              product_data: {
                name: 'The Strong Start Program',
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          serviceId: 'strong_start',
        },
        payment_intent_data: {
          metadata: {
            serviceId: 'strong_start',
          },
        },
      }),
    );
  });

  test('rejects invalid service IDs', async () => {
    await expect(createServiceCheckoutSession('../admin')).rejects.toThrow('Invalid service ID.');

    expect(adminDb.collection).not.toHaveBeenCalled();
  });

  test('rejects nonexistent services', async () => {
    getService.mockResolvedValue({ exists: false });

    await expect(createServiceCheckoutSession('unknown_service')).rejects.toThrow(
      'Service not found.',
    );

    expect(createSession).not.toHaveBeenCalled();
  });

  test('rejects services without fixed pricing', async () => {
    getService.mockResolvedValue({
      exists: true,
      data: () => ({
        title: 'Grief Support',
        priceCents: 0,
      }),
    });

    await expect(createServiceCheckoutSession('grief_support')).rejects.toThrow(
      'Service is not available for online payment.',
    );

    expect(createSession).not.toHaveBeenCalled();
  });

  test('rejects invalid prices', async () => {
    getService.mockResolvedValue({
      exists: true,
      data: () => ({
        title: 'Invalid Service',
        priceCents: -100,
      }),
    });

    await expect(createServiceCheckoutSession('strong_start')).rejects.toThrow(
      'Service is not available for online payment.',
    );

    expect(createSession).not.toHaveBeenCalled();
  });

  test('rejects insecure application URLs', async () => {
    process.env.APP_URL = 'http://example.com';

    await expect(createServiceCheckoutSession('strong_start')).rejects.toThrow(
      'Invalid application URL configuration.',
    );

    expect(createSession).not.toHaveBeenCalled();
  });

  test('propagates Stripe failures', async () => {
    createSession.mockRejectedValue(new Error('Stripe unavailable'));

    await expect(createServiceCheckoutSession('strong_start')).rejects.toThrow(
      'Stripe unavailable',
    );
  });
});
