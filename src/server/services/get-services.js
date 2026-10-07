import { unstable_cache } from 'next/cache';

import { adminDb } from '@/server/firebase/admin';

function compareServices(a, b) {
  const orderDiff = (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);

  if (orderDiff !== 0) {
    return orderDiff;
  }

  return String(a.title ?? a.name ?? '').localeCompare(String(b.title ?? b.name ?? ''));
}

export const getServices = unstable_cache(
  async () => {
    const snapshot = await adminDb.collection('services').get();

    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort(compareServices);
  },
  ['services'],
  { revalidate: 3600 },
);
