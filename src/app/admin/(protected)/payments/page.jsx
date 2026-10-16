import Link from 'next/link';

import { getAdminPayments } from '@/server/payments/get-admin-payments';
import { getAdminServices } from '@/server/services/get-admin-services';

// Payment information must always be read fresh.
// Do not cache private administrator records.
export const dynamic = 'force-dynamic';

const PAYMENT_STATUSES = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  partially_refunded: 'Partially refunded',
  refunded: 'Refunded',
};

function formatAmount(amountCents) {
  // Stripe and Firestore store monetary amounts as integer cents.
  // Convert to dollars only when displaying the amount.
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
    return 'Unavailable';
  }

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amountCents / 100);
}

function formatRecordedDate(value) {
  if (!value) return 'Unavailable';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  // Display UTC explicitly so the date is unambiguous.
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

function getStripePaymentUrl(payment) {
  const paymentIntentId = payment.stripePaymentIntentId;

  // Never construct a URL from an unvalidated database value.
  if (typeof paymentIntentId !== 'string' || !/^pi_[a-zA-Z0-9]+$/.test(paymentIntentId)) {
    return null;
  }

  // Current payment documents use the Checkout Session as their ID.
  // This tells us whether the payment was made in test or live mode.
  const checkoutId = payment.id;

  if (typeof checkoutId !== 'string') {
    return null;
  }

  if (/^cs_test_[a-zA-Z0-9_]+$/.test(checkoutId)) {
    return `https://dashboard.stripe.com/test/payments/${paymentIntentId}`;
  }

  if (/^cs_live_[a-zA-Z0-9_]+$/.test(checkoutId)) {
    return `https://dashboard.stripe.com/payments/${paymentIntentId}`;
  }

  // Do not guess which Stripe environment contains the payment.
  return null;
}

export default async function AdminPaymentsPage() {
  // getAdminPayments verifies administrator authorization
  // before retrieving any customer payment information.
  const payments = await getAdminPayments();

  // Avoid another Firestore read when no payments exist.
  const services = payments.length > 0 ? await getAdminServices() : [];

  // Payment records currently store service IDs rather than names.
  // Match those IDs to their current public service names.
  const serviceNames = new Map(
    services.map((service) => [service.id, service.title ?? service.name ?? service.id]),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/admin" className="text-sm underline">
        Back to dashboard
      </Link>

      <h1 className="mt-6 text-3xl font-semibold">Payments</h1>

      <p className="mt-2 text-gray-600">
        View recent customer payments and their current refund status.
      </p>

      {payments.length === 0 ? (
        <p className="mt-8">No payments recorded yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">The 50 most recently recorded payments</caption>

            <thead>
              <tr className="border-b">
                <th scope="col" className="p-3">
                  Client
                </th>
                <th scope="col" className="p-3">
                  Service
                </th>
                <th scope="col" className="p-3">
                  Amount
                </th>
                <th scope="col" className="p-3">
                  Recorded date
                </th>
                <th scope="col" className="p-3">
                  Status
                </th>
                <th scope="col" className="p-3">
                  Stripe
                </th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => {
                const stripeUrl = getStripePaymentUrl(payment);

                const serviceName =
                  serviceNames.get(payment.serviceId) ?? payment.serviceId ?? 'Unknown service';

                return (
                  <tr key={payment.id} className="border-b">
                    <th scope="row" className="p-3 font-medium">
                      {payment.clientName ?? 'Unknown client'}
                    </th>

                    <td className="p-3">{serviceName}</td>

                    <td className="p-3">
                      <span>{formatAmount(payment.amountCents)}</span>

                      {/* Show refunded amounts without changing
                          the original purchase total. */}
                      {payment.refundAmountCents > 0 && (
                        <p className="mt-1 text-xs text-gray-600">
                          {formatAmount(payment.refundAmountCents)} refunded
                        </p>
                      )}
                    </td>

                    <td className="p-3">
                      {payment.createdAt ? (
                        <time dateTime={payment.createdAt}>
                          {formatRecordedDate(payment.createdAt)}
                        </time>
                      ) : (
                        'Unavailable'
                      )}
                    </td>

                    <td className="p-3">{PAYMENT_STATUSES[payment.status] ?? 'Unknown'}</td>

                    <td className="p-3">
                      {stripeUrl ? (
                        <a
                          href={stripeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium underline"
                        >
                          View in Stripe
                        </a>
                      ) : (
                        <span className="text-gray-500">Not available</span>
                      )}

                      {/* Keep the original Stripe reference visible
                          for manual reconciliation and support. */}
                      {payment.stripePaymentIntentId && (
                        <p className="mt-1 font-mono text-xs break-all text-gray-600">
                          {payment.stripePaymentIntentId}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-sm text-gray-600">
        Showing up to 50 recent payments. Dates indicate when Firestore recorded each payment, not
        necessarily the exact purchase time. Refunds are managed directly in Stripe.
      </p>
    </main>
  );
}
