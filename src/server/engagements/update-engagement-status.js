import { FieldValue } from 'firebase-admin/firestore';

import { getAdminSession } from '@/server/auth/session';
import { validateEngagementStatus } from '@/server/engagements/validate-engagement';
import { adminDb } from '@/server/firebase/admin';

export async function updateEngagementStatus(engagementId, status) {
  // Only an authorized administrator may change an engagement.
  const session = await getAdminSession();

  if (!session || session.admin !== true) {
    throw new Error('Unauthorized');
  }

  // Validate the Firestore document ID.
  if (typeof engagementId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(engagementId)) {
    throw new Error('Invalid engagement ID.');
  }

  // Accept only supported service statuses.
  const validStatus = validateEngagementStatus(status);

  // update() fails if the document does not exist.
  // Only status and updatedAt may be modified.
  await adminDb.collection('serviceEngagements').doc(engagementId).update({
    status: validStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    id: engagementId,
    status: validStatus,
  };
}
