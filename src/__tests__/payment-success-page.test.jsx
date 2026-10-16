import { render, screen } from '@testing-library/react';

import PaymentSuccessPage from '@/app/payment/success/page';
import { getStripeClient } from '@/server/stripe/client';

jest.mock('@/server/stripe/client', () => ({
  getStripeClient: jest.fn(),
}));

describe('PaymentSuccessPage', () => {
  const sessionId = 'cs_test_session123';
  let retrieveSession;

  async function renderPage(id = sessionId) {
    const page = await PaymentSuccessPage({
      searchParams: Promise.resolve({ session_id: id }),
    });

    render(page);
  }

  beforeEach(() => {
    jest.clearAllMocks();

    retrieveSession = jest.fn().mockResolvedValue({
      object: 'checkout.session',
      id: sessionId,
      mode: 'payment',
      status: 'complete',
      payment_status: 'paid',
      currency: 'cad',
      amount_total: 40000,
      metadata: {
        serviceId: 'funeral_memorial_officiation',
      },
    });

    getStripeClient.mockReturnValue({
      checkout: {
        sessions: {
          retrieve: retrieveSession,
        },
      },
    });
  });

  test('confirms a verified funeral package payment', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { name: 'Payment confirmed' })).toBeInTheDocument();

    expect(retrieveSession).toHaveBeenCalledWith(sessionId);

    expect(screen.getByText(/Your service date is not booked yet/)).toBeInTheDocument();
  });

  test('rejects invalid session IDs without calling Stripe', async () => {
    await renderPage('../invalid');

    expect(
      screen.getByRole('heading', {
        name: 'Payment status not confirmed',
      }),
    ).toBeInTheDocument();

    expect(getStripeClient).not.toHaveBeenCalled();
  });

  test('does not confirm unpaid sessions', async () => {
    retrieveSession.mockResolvedValue({
      object: 'checkout.session',
      id: sessionId,
      mode: 'payment',
      status: 'open',
      payment_status: 'unpaid',
      currency: 'cad',
      amount_total: 40000,
      metadata: {
        serviceId: 'funeral_memorial_officiation',
      },
    });

    await renderPage();

    expect(
      screen.getByRole('heading', {
        name: 'Payment status not confirmed',
      }),
    ).toBeInTheDocument();
  });

  test('rejects sessions for unapproved services', async () => {
    retrieveSession.mockResolvedValue({
      object: 'checkout.session',
      id: sessionId,
      mode: 'payment',
      status: 'complete',
      payment_status: 'paid',
      currency: 'cad',
      amount_total: 40000,
      metadata: {
        serviceId: 'unapproved_service',
      },
    });

    await renderPage();

    expect(
      screen.getByRole('heading', {
        name: 'Payment status not confirmed',
      }),
    ).toBeInTheDocument();
  });

  test('handles Stripe verification failures safely', async () => {
    retrieveSession.mockRejectedValue(new Error('Stripe unavailable'));

    await renderPage();

    expect(
      screen.getByRole('heading', {
        name: 'Payment status not confirmed',
      }),
    ).toBeInTheDocument();
  });
});
