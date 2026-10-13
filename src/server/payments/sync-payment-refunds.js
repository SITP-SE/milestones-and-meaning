import { FieldValue } from 'firebase-admin/firestore';

import { adminDb } from '@/server/firebase/admin';
import { getRefundStatus } from '@/server/payments/get-refund-status';
import { getSuccessfulRefundAmount } from '@/server/payments/get-successful-refund-amount';

export async function syncPaymentRefunds(paymentIntentId) {
  if (typeof paymentIntentId !== 'string' || !/^pi_[a-zA-Z0-9]+$/.test(paymentIntentId)) {
    throw new Error('Invalid PaymentIntent ID.');
  }

  // Find the Firestore payment associated with this Stripe payment.
  const matches = await adminDb
    .collection('payments')
    .where('stripePaymentIntentId', '==', paymentIntentId)
    .limit(2)
    .get();

  // A missing record must not be silently ignored.
  // Stripe can retry the webhook after the payment is recorded.
  if (matches.size !== 1) {
    throw new Error('Missing or ambiguous payment record.');
  }

  const paymentRef = matches.docs[0].ref;

  // Record when this synchronization starts fetching Stripe data.
  // An older request should not overwrite a newer synchronization.
  const checkedAtMillis = Date.now();

  const refundAmountCents = await getSuccessfulRefundAmount(paymentIntentId);

  return adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(paymentRef);

    if (!snapshot.exists) {
      throw new Error('Payment record no longer exists.');
    }

    const payment = snapshot.data();

    if (payment.stripePaymentIntentId !== paymentIntentId) {
      throw new Error('PaymentIntent reference mismatch.');
    }

    const status = getRefundStatus(payment.amountCents, refundAmountCents);

    // Avoid overwriting a result retrieved by a newer sync attempt.
    if (
      Number.isSafeInteger(payment.refundCheckedAtMillis) &&
      payment.refundCheckedAtMillis >= checkedAtMillis
    ) {
      return {
        updated: false,
        paymentId: paymentRef.id,
        refundAmountCents: payment.refundAmountCents,
        status: payment.status,
      };
    }

    transaction.update(paymentRef, {
      refundAmountCents,
      status,
      refundCheckedAtMillis: checkedAtMillis,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      updated: true,
      paymentId: paymentRef.id,
      refundAmountCents,
      status,
    };
  });
}
