import { getAdminSession } from '@/server/auth/session';
import { adminDb } from '@/server/firebase/admin';

// Validate service data before it reaches Firestore.
// Only accept fields supported by the service editor.
export function validateServiceUpdate(data) {
  const title = typeof data?.title === 'string' ? data.title.trim() : '';
  const body = typeof data?.body === 'string' ? data.body.trim() : '';

  if (!title || title.length > 120) {
    throw new Error('Service title must be between 1 and 120 characters.');
  }

  if (!body || body.length > 2000) {
    throw new Error('Description must be between 1 and 2000 characters.');
  }

  // Store monetary amounts as integer cents, never floating-point dollars.
  if (
    !Number.isSafeInteger(data.priceCents) ||
    data.priceCents < 0 ||
    data.priceCents > 100000000
  ) {
    throw new Error('Invalid service price.');
  }

  if (typeof data.requiresDeposit !== 'boolean' || typeof data.isGiftable !== 'boolean') {
    throw new Error('Invalid service settings.');
  }

  // The existing business rule uses a standard $250 deposit.
  if (data.requiresDeposit && data.priceCents < 25000) {
    throw new Error('A service requiring a deposit must cost at least $250.');
  }

  return {
    title,
    name: title,
    body,
    priceCents: data.priceCents,
    requiresDeposit: data.requiresDeposit,
    isGiftable: data.isGiftable,
  };
}

export async function updateService(serviceId, data) {
  // Authorization must happen inside the mutation function.
  // Protecting the admin page alone is not sufficient.
  const session = await getAdminSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  // Reject invalid document IDs rather than accepting arbitrary paths.
  if (typeof serviceId !== 'string' || !/^[a-z0-9_-]{1,80}$/.test(serviceId)) {
    throw new Error('Invalid service ID.');
  }

  const changes = validateServiceUpdate(data);

  // update() changes only these approved fields and fails if the
  // document doesn't exist. It preserves href, image, order, etc.
  await adminDb.collection('services').doc(serviceId).update(changes);
}
