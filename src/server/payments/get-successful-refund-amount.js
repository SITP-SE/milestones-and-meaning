import { getStripeClient } from '@/server/stripe/client';

export async function getSuccessfulRefundAmount(paymentIntentId) {
  if (typeof paymentIntentId !== 'string' || !/^pi_[a-zA-Z0-9]+$/.test(paymentIntentId)) {
    throw new Error('Invalid PaymentIntent ID.');
  }

  const refunds = getStripeClient().refunds.list({
    payment_intent: paymentIntentId,
    limit: 100,
  });

  let totalCents = 0;

  // Stripe's SDK automatically retrieves additional pages.
  for await (const refund of refunds) {
    if (refund.status !== 'succeeded') {
      continue;
    }

    if (refund.currency !== 'cad' || !Number.isSafeInteger(refund.amount) || refund.amount <= 0) {
      throw new Error('Invalid Stripe refund amount.');
    }

    totalCents += refund.amount;

    if (!Number.isSafeInteger(totalCents)) {
      throw new Error('Invalid total refund amount.');
    }
  }

  return totalCents;
}
