import { adminDb, FieldValue } from '@/server/firebase/admin';
import { validatePaidCheckout } from '@/server/payments/validate-paid-checkout';

export async function recordPaidCheckout(session) {
  // Only process sessions with valid, confirmed payment data.
  const payment = validatePaidCheckout(session);

  // Use stable IDs to prevent duplicate records.
  const paymentRef = adminDb.collection('payments').doc(payment.checkoutSessionId);

  const engagementRef = adminDb
    .collection('serviceEngagements')
    .doc(`stripe_${payment.checkoutSessionId}`);

  return adminDb.runTransaction(async (transaction) => {
    const existingPayment = await transaction.get(paymentRef);

    // A repeated Stripe event must not create another engagement.
    if (existingPayment.exists) {
      return {
        created: false,
        paymentId: paymentRef.id,
        engagementId: engagementRef.id,
      };
    }

    const timestamp = FieldValue.serverTimestamp();

    transaction.create(paymentRef, {
      ...payment,
      refundAmountCents: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    transaction.create(engagementRef, {
      clientName: payment.clientName,
      clientEmail: payment.clientEmail,
      clientPhone: payment.clientPhone,
      serviceId: payment.serviceId,
      status: 'pending',
      source: 'stripe',
      paymentId: paymentRef.id,
      giftId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return {
      created: true,
      paymentId: paymentRef.id,
      engagementId: engagementRef.id,
    };
  });
}
