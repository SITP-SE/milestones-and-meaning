import { cache } from 'react';

import { adminDb } from '@/server/firebase/admin';

export const getPage = cache(async (pageId) => {
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
});
