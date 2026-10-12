import { unstable_cache } from 'next/cache';

import { adminDb } from '@/server/firebase/admin';

function compareServices(a, b) {
  const orderDiff = (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);

  if (orderDiff !== 0) {
    return orderDiff;
  }

  return String(a.title ?? a.name ?? '').localeCompare(String(b.title ?? b.name ?? ''));
}

// Read directly from Firestore without caching.
// Admin operations use this function so changes appear immediately.
export async function readServices() {
  const snapshot = await adminDb.collection('services').get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort(compareServices);
}

// Public pages can tolerate cached data to reduce Firestore reads.
// The cache expires after one hour. Skip it against the emulator so a
// reseed shows up immediately.
const getCachedServices = unstable_cache(readServices, ['services'], {
  revalidate: 3600,
  tags: ['services'],
});

export function getServices() {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return readServices();
  }

  return getCachedServices();
}

export async function getServiceForPage(pageId) {
  const href = `/services/${pageId}`;
  const services = await getServices();

  return services.find((service) => service.href === href) ?? null;
}
