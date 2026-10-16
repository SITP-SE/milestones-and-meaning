import { getAdminSession } from '@/server/auth/session';
import { adminDb } from '@/server/firebase/admin';

export async function getAdminPayments() {
  const session = await getAdminSession();

  // Payment records contain private customer information.
  // Verify administrator authorization before accessing Firestore.
  if (!session || session.admin !== true) {
    throw new Error('Unauthorized');
  }

  // Retrieve only the 50 most recently recorded payments.
  // This prevents loading the entire payment collection
  // and keeps database reads predictable as the business grows.
  const snapshot = await adminDb
    .collection('payments')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => {
    const payment = doc.data();

    // Return only the information required by the admin interface.
    // Do not expose unrelated or potentially sensitive database fields.
    return {
      id: doc.id,
      clientName: payment.clientName,
      serviceId: payment.serviceId,
      amountCents: payment.amountCents,
      currency: payment.currency,
      status: payment.status,
      refundAmountCents: payment.refundAmountCents ?? 0,
      stripePaymentIntentId: payment.stripePaymentIntentId ?? null,

      // Firestore timestamps cannot be passed directly to every UI component.
      // Convert the timestamp to an ISO string for consistent display.
      createdAt: payment.createdAt?.toDate().toISOString() ?? null,
    };
  });
}
