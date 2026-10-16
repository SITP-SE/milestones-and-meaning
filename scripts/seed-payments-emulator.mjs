import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { buildDemoPayments } from './seed-data/payment-demo-data.js';

const PROJECT_ID = 'milestones-and-meaning';
const EMULATOR_HOST = '127.0.0.1:8080';

// Reject unexpected emulator configuration instead of silently
// connecting to a different Firestore instance.
if (process.env.FIRESTORE_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST !== EMULATOR_HOST) {
  throw new Error(`Unexpected Firestore emulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

// Explicitly force all Firestore operations onto the local emulator.
// This script must never connect to production Firestore.
process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;

const app = initializeApp({ projectId: PROJECT_ID }, 'local-payment-demo-seed');

try {
  const db = getFirestore(app);
  const payments = buildDemoPayments();

  // Use one Firestore batch for efficient, repeatable seeding.
  // This stays below Firestore's 500-write batch limit.
  const batch = db.batch();

  for (const { id, data } of payments) {
    const paymentRef = db.collection('payments').doc(id);

    // Fixed demo IDs make subsequent runs overwrite the same fixtures.
    // No unrelated payment records are deleted or modified.
    batch.set(paymentRef, data);
  }

  await batch.commit();

  const counts = payments.reduce((summary, payment) => {
    const status = payment.data.status;
    summary[status] = (summary[status] ?? 0) + 1;
    return summary;
  }, {});

  console.log('Local payment demo seed complete.');
  console.log(`Firestore emulator: ${EMULATOR_HOST}`);
  console.log(`Payments seeded: ${payments.length}`);
  console.log(`Paid: ${counts.paid ?? 0}`);
  console.log(`Partially refunded: ${counts.partially_refunded ?? 0}`);
  console.log(`Fully refunded: ${counts.refunded ?? 0}`);
  console.log('These are demonstration records, not Stripe payments.');
} catch (error) {
  console.error('Unable to seed local demo payments:', error);
  process.exitCode = 1;
} finally {
  await deleteApp(app);
}
