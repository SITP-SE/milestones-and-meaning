/** @jest-environment node */

import { POST } from '@/app/api/checkout/route';
import { createServiceCheckoutSession } from '@/server/stripe/create-checkout-session';

jest.mock('@/server/stripe/create-checkout-session', () => ({
  createServiceCheckoutSession: jest.fn(),
}));

function makeRequest(body, options = {}) {
  const { origin = 'http://localhost:3000', contentType = 'application/json' } = options;

  return new Request('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': contentType,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('Checkout API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    createServiceCheckoutSession.mockResolvedValue('https://checkout.stripe.com/test-session');
  });

  test('creates a Checkout Session for a valid service', async () => {
    const response = await POST(makeRequest({ serviceId: 'strong_start' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: 'https://checkout.stripe.com/test-session',
    });

    expect(createServiceCheckoutSession).toHaveBeenCalledWith('strong_start');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  test('rejects invalid service IDs', async () => {
    const response = await POST(makeRequest({ serviceId: '../admin' }));

    expect(response.status).toBe(400);
    expect(createServiceCheckoutSession).not.toHaveBeenCalled();
  });

  test('rejects missing service IDs', async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    expect(createServiceCheckoutSession).not.toHaveBeenCalled();
  });

  test('rejects cross-origin requests', async () => {
    const response = await POST(
      makeRequest({ serviceId: 'strong_start' }, { origin: 'https://attacker.example' }),
    );

    expect(response.status).toBe(403);
    expect(createServiceCheckoutSession).not.toHaveBeenCalled();
  });

  test('rejects requests without origin verification', async () => {
    const request = new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: 'strong_start' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(createServiceCheckoutSession).not.toHaveBeenCalled();
  });

  test('rejects non-JSON requests', async () => {
    const response = await POST(makeRequest('invalid', { contentType: 'text/plain' }));

    expect(response.status).toBe(415);
    expect(createServiceCheckoutSession).not.toHaveBeenCalled();
  });

  test('rejects malformed JSON', async () => {
    const response = await POST(makeRequest('{invalid'));

    expect(response.status).toBe(400);
    expect(createServiceCheckoutSession).not.toHaveBeenCalled();
  });

  test('rejects oversized requests', async () => {
    const response = await POST(
      makeRequest({ serviceId: 'strong_start', extra: 'x'.repeat(2000) }),
    );

    expect(response.status).toBe(413);
    expect(createServiceCheckoutSession).not.toHaveBeenCalled();
  });

  test('rejects unavailable services', async () => {
    createServiceCheckoutSession.mockRejectedValue(
      new Error('Service is not available for online payment.'),
    );

    const response = await POST(makeRequest({ serviceId: 'grief_support' }));

    expect(response.status).toBe(400);
  });

  test('does not expose Stripe errors', async () => {
    createServiceCheckoutSession.mockRejectedValue(new Error('Sensitive Stripe API error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const response = await POST(makeRequest({ serviceId: 'strong_start' }));

      expect(response.status).toBe(500);

      const result = await response.json();

      expect(result.error).toBe('Unable to start checkout. Please try again.');
      expect(JSON.stringify(result)).not.toContain('Sensitive Stripe API error');
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
