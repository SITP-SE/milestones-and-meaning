import { adminDb } from '@/server/firebase/admin';
import { getStripeClient } from '@/server/stripe/client';

const LOOKBACK_SECONDS = 7 * 24 * 60 * 60;
const MAX_SCANNED_SESSIONS = 500;

export async function findMissingPaidCheckouts() {
  const createdGte = Math.floor(Date.now() / 1000) - LOOKBACK_SECONDS;

  const sessions = getStripeClient().checkout.sessions.list({
    created: {
      gte: createdGte,
    },
    status: 'complete',
    limit: 100,
  });

  const missingSessionIds = [];
  let scanned = 0;

  for await (const session of sessions) {
    scanned += 1;

    // Never scan an unlimited number of Stripe records.
    if (scanned > MAX_SCANNED_SESSIONS) {
      throw new Error('Stripe reconciliation scan limit exceeded.');
    }

    if (
      session.mode !== 'payment' ||
      session.payment_status !== 'paid' ||
      session.currency !== 'cad'
    ) {
      continue;
    }

    // Only consider sessions with our expected service metadata.
    // Recovery will separately verify ownership against Stripe.
    const serviceId = session.metadata?.serviceId;

    if (typeof serviceId !== 'string' || !/^[a-z0-9_-]{1,80}$/.test(serviceId)) {
      continue;
    }

    if (typeof session.id !== 'string' || !/^cs_[a-zA-Z0-9_]{1,255}$/.test(session.id)) {
      throw new Error('Invalid Stripe Checkout Session ID.');
    }

    const paymentSnapshot = await adminDb.collection('payments').doc(session.id).get();

    if (!paymentSnapshot.exists) {
      missingSessionIds.push(session.id);
    }
  }

  return {
    scanned,
    missingSessionIds,
  };
}
