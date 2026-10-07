import { adminDb } from '@/server/firebase/admin';

export async function getPage(pageId) {
  if (!pageId || !/^[a-z0-9-]+$/.test(pageId)) {
    return null;
  }

  const snapshot = await adminDb.collection('pages').doc(pageId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}
