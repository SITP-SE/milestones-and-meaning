import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import CheckoutButton from '@/components/services/CheckoutButton';

const originalFetch = global.fetch;

describe('CheckoutButton', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    if (originalFetch === undefined) {
      delete global.fetch;
    } else {
      global.fetch = originalFetch;
    }
  });

  test('sends only the service ID to checkout', async () => {
    let resolveRequest;

    global.fetch.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    render(<CheckoutButton serviceId="strong_start" />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay in Full' }));

    expect(global.fetch).toHaveBeenCalledWith('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceId: 'strong_start',
      }),
    });

    expect(
      screen.getByRole('button', {
        name: 'Redirecting to secure checkout...',
      }),
    ).toBeDisabled();

    resolveRequest({ ok: false });

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to start secure checkout.');
  });

  test('allows retrying after a failed request', async () => {
    global.fetch.mockResolvedValue({ ok: false });

    render(<CheckoutButton serviceId="strong_start" />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay in Full' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    const button = screen.getByRole('button', {
      name: 'Pay in Full',
    });

    expect(button).toBeEnabled();

    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  test.each([
    'https://untrusted.example/checkout',
    'http://checkout.stripe.com/test',
    'https://checkout.stripe.com.attacker.example/test',
    '/relative-url',
  ])('rejects an unsafe checkout URL: %s', async (url) => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ url }),
    });

    render(<CheckoutButton serviceId="strong_start" />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay in Full' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to start secure checkout.');

    expect(screen.getByRole('button', { name: 'Pay in Full' })).toBeEnabled();
  });

  test('handles network failures gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('Network unavailable'));

    render(<CheckoutButton serviceId="strong_start" />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay in Full' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to start secure checkout.');
  });
});
