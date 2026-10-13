import { getAdminSession } from '@/server/auth/session';
import { adminDb } from '@/server/firebase/admin';

export async function getAdminEngagements() {
  const session = await getAdminSession();

  // Verify authorization before accessing Firestore.
  if (!session || session.admin !== true) {
    throw new Error('Unauthorized');
  }

  // Limit reads to avoid loading every client record at once.
  const snapshot = await adminDb
    .collection('serviceEngagements')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      serviceId: data.serviceId,
      status: data.status,
      source: data.source,
      paymentId: data.paymentId ?? null,
      giftId: data.giftId ?? null,
      createdAt: data.createdAt?.toDate().toISOString() ?? null,
      updatedAt: data.updatedAt?.toDate().toISOString() ?? null,
    };
  });
}
