import { render, screen } from '@testing-library/react';

import AdminPaymentsPage from '@/app/admin/(protected)/payments/page';
import { getAdminPayments } from '@/server/payments/get-admin-payments';
import { getAdminServices } from '@/server/services/get-admin-services';

jest.mock('@/server/payments/get-admin-payments', () => ({
  getAdminPayments: jest.fn(),
}));

jest.mock('@/server/services/get-admin-services', () => ({
  getAdminServices: jest.fn(),
}));

describe('AdminPaymentsPage', () => {
  const payment = {
    id: 'cs_test_123',
    clientName: 'Sarah Johnson',
    serviceId: 'strong_start',
    amountCents: 99500,
    currency: 'cad',
    status: 'paid',
    refundAmountCents: 0,
    stripePaymentIntentId: 'pi_123',
    createdAt: '2026-10-13T12:00:00.000Z',
  };

  // Server Components are async, so resolve the component
  // before passing the returned JSX to React Testing Library.
  async function renderPage() {
    const page = await AdminPaymentsPage();
    render(page);
  }

  beforeEach(() => {
    jest.clearAllMocks();

    getAdminPayments.mockResolvedValue([payment]);

    getAdminServices.mockResolvedValue([
      {
        id: 'strong_start',
        title: 'The Strong Start Program',
      },
    ]);
  });

  test('displays payment details', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { name: 'Payments' })).toBeInTheDocument();

    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('The Strong Start Program')).toBeInTheDocument();
    expect(screen.getByText('$995.00')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('2026-10-13 12:00 UTC')).toBeInTheDocument();

    expect(getAdminPayments).toHaveBeenCalledTimes(1);
    expect(getAdminServices).toHaveBeenCalledTimes(1);
  });

  test('provides a Stripe test-mode payment link', async () => {
    await renderPage();

    const link = screen.getByRole('link', {
      name: 'View in Stripe',
    });

    expect(link).toHaveAttribute('href', 'https://dashboard.stripe.com/test/payments/pi_123');

    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('pi_123')).toBeInTheDocument();
  });

  test('provides a live Stripe payment link', async () => {
    getAdminPayments.mockResolvedValue([
      {
        ...payment,
        id: 'cs_live_456',
        stripePaymentIntentId: 'pi_456',
      },
    ]);

    await renderPage();

    expect(screen.getByRole('link', { name: 'View in Stripe' })).toHaveAttribute(
      'href',
      'https://dashboard.stripe.com/payments/pi_456',
    );
  });

  test('displays partial refunds', async () => {
    getAdminPayments.mockResolvedValue([
      {
        ...payment,
        status: 'partially_refunded',
        refundAmountCents: 25000,
      },
    ]);

    await renderPage();

    expect(screen.getByText('Partially refunded')).toBeInTheDocument();
    expect(screen.getByText('$250.00 refunded')).toBeInTheDocument();

    // A refund must not change the original payment amount.
    expect(screen.getByText('$995.00')).toBeInTheDocument();
  });

  test('handles empty payment history without reading services', async () => {
    getAdminPayments.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByText('No payments recorded yet.')).toBeInTheDocument();

    expect(getAdminServices).not.toHaveBeenCalled();
  });

  test('falls back to the service ID when a service is missing', async () => {
    getAdminServices.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByText('strong_start')).toBeInTheDocument();
  });

  test('does not construct a Stripe link from invalid references', async () => {
    getAdminPayments.mockResolvedValue([
      {
        ...payment,
        stripePaymentIntentId: 'invalid_reference',
      },
    ]);

    await renderPage();

    expect(screen.queryByRole('link', { name: 'View in Stripe' })).not.toBeInTheDocument();

    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  test('propagates payment retrieval errors', async () => {
    getAdminPayments.mockRejectedValue(new Error('Firestore unavailable'));

    await expect(AdminPaymentsPage()).rejects.toThrow('Firestore unavailable');

    // Never read additional data if the payment query fails.
    expect(getAdminServices).not.toHaveBeenCalled();
  });
});
