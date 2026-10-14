import { recordPaidCheckout } from '@/server/payments/record-paid-checkout';
import { validatePaidCheckout } from '@/server/payments/validate-paid-checkout';
import { getStripeClient } from '@/server/stripe/client';
import { syncPaymentRefunds } from '@/server/payments/sync-payment-refunds';

export async function recoverPaidCheckout(checkoutSessionId) {
  if (
    typeof checkoutSessionId !== 'string' ||
    !/^cs_[a-zA-Z0-9_]{1,255}$/.test(checkoutSessionId)
  ) {
    throw new Error('Invalid Checkout Session ID.');
  }

  const stripe = getStripeClient();

  // Retrieve the authoritative Checkout Session from Stripe.
  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);

  if (session?.id !== checkoutSessionId) {
    throw new Error('Stripe Checkout Session mismatch.');
  }

  // Validate the confirmed payment before any Firestore writes.
  const payment = validatePaidCheckout(session);

  // Confirm that its PaymentIntent belongs to our application.
  const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);

  if (
    paymentIntent?.object !== 'payment_intent' ||
    paymentIntent.id !== payment.stripePaymentIntentId
  ) {
    throw new Error('Invalid Stripe PaymentIntent.');
  }

  const metadata = paymentIntent.metadata ?? {};

  const serviceMatches = metadata.serviceId === payment.serviceId;

  const isWebsitePayment = metadata.source === 'milestones_and_meaning';

  // Older payments have serviceId metadata but no source marker.
  const isLegacyWebsitePayment =
    (metadata.source === undefined || metadata.source === '') && serviceMatches;

  if (!serviceMatches || (!isWebsitePayment && !isLegacyWebsitePayment)) {
    throw new Error('Checkout Session does not belong to this application.');
  }

  // Create missing payment and engagement records atomically.
  // An existing payment will not be duplicated.
  const result = await recordPaidCheckout(session);

  // Retrieve current refunds from Stripe so recovered payments
  // reflect partial or full refunds that already occurred.
  await syncPaymentRefunds(payment.stripePaymentIntentId);

  return result;
}
