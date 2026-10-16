import { services } from './services.js';

// These services have fixed prices and support online payment.
// Bereavement, funeral, and consultation-based services are excluded.
const PAID_SERVICE_IDS = ['complete_marriage_package', 'strong_start', 'wedding_officiation'];

// Fictional names only. Never use real customer information in seed data.
const DEMO_CLIENT_NAMES = [
  'Alex Morgan',
  'Taylor Bennett',
  'Jordan Parker',
  'Casey Williams',
  'Riley Anderson',
  'Morgan Davis',
  'Jamie Thompson',
  'Avery Collins',
  'Charlie Wilson',
  'Quinn Mitchell',
  'Peyton Campbell',
  'Drew Robinson',
  'Harper Edwards',
  'Skyler Brooks',
  'Reese Martin',
];

export const DEMO_PAYMENT_COUNT = 65;

export function buildDemoPayments(now = new Date()) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError('A valid reference date is required.');
  }

  const oneDayInMillis = 24 * 60 * 60 * 1000;

  return Array.from({ length: DEMO_PAYMENT_COUNT }, (_, index) => {
    const serviceId = PAID_SERVICE_IDS[index % PAID_SERVICE_IDS.length];
    const amountCents = services[serviceId].priceCents;

    // Include all three supported payment states.
    // Most records remain paid, with some refunds for dashboard testing.
    const status = index % 5 === 0 ? 'refunded' : index % 5 === 1 ? 'partially_refunded' : 'paid';

    const refundAmountCents =
      status === 'refunded'
        ? amountCents
        : status === 'partially_refunded'
          ? Math.floor(amountCents / 4)
          : 0;

    // Spread transactions over several weeks to test date ordering.
    const createdAt = new Date(now.getTime() - index * oneDayInMillis);

    return {
      id: `demo_payment_${String(index + 1).padStart(3, '0')}`,
      data: {
        clientName: DEMO_CLIENT_NAMES[index % DEMO_CLIENT_NAMES.length],
        serviceId,
        amountCents,
        currency: 'cad',
        status,
        refundAmountCents,
        createdAt,
        updatedAt: createdAt,

        // These are not real Stripe transactions.
        // The admin interface should not generate Stripe links for them.
        stripePaymentIntentId: null,

        // Identify these documents for future inspection or cleanup.
        isDemo: true,
        seedSource: 'local_payment_demo',
      },
    };
  });
}
