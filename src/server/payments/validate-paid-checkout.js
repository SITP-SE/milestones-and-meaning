import { validateNewEngagement } from '@/server/engagements/validate-engagement';

export function validatePaidCheckout(session) {
  if (
    session?.object !== 'checkout.session' ||
    session.mode !== 'payment' ||
    session.payment_status !== 'paid'
  ) {
    throw new Error('Checkout payment is not confirmed.');
  }

  if (typeof session.id !== 'string' || !/^cs_[a-zA-Z0-9_]{1,255}$/.test(session.id)) {
    throw new Error('Invalid Checkout Session ID.');
  }

  if (
    session.currency !== 'cad' ||
    !Number.isSafeInteger(session.amount_total) ||
    session.amount_total <= 0
  ) {
    throw new Error('Invalid Checkout payment amount.');
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

  if (typeof paymentIntentId !== 'string' || !/^pi_[a-zA-Z0-9]+$/.test(paymentIntentId)) {
    throw new Error('Invalid PaymentIntent reference.');
  }

  const client = validateNewEngagement({
    clientName:
      session.customer_details?.individual_name ||
      session.collected_information?.individual_name ||
      session.customer_details?.name,
    clientEmail: session.customer_details?.email,
    clientPhone: session.customer_details?.phone,
    serviceId: session.metadata?.serviceId,
  });

  return {
    checkoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    ...client,
    amountCents: session.amount_total,
    currency: 'cad',
    status: 'paid',
  };
}
