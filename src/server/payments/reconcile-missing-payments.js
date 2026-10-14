import { findMissingPaidCheckouts } from '@/server/payments/find-missing-paid-checkouts';
import { recoverPaidCheckout } from '@/server/payments/recover-paid-checkout';

export async function reconcileMissingPayments() {
  // Discover successful Stripe payments missing from Firestore.
  const { scanned, missingSessionIds } = await findMissingPaidCheckouts();

  const summary = {
    scanned,
    missing: missingSessionIds.length,
    recovered: 0,
    alreadyRecorded: 0,
  };

  let failures = 0;

  // Recover payments sequentially to avoid unnecessary load.
  for (const sessionId of missingSessionIds) {
    try {
      const result = await recoverPaidCheckout(sessionId);

      if (result.created) {
        summary.recovered += 1;
      } else {
        // Another webhook or recovery may have recorded it already.
        summary.alreadyRecorded += 1;
      }
    } catch {
      failures += 1;

      // Log only the Stripe session reference, not customer data.
      console.error('Stripe payment reconciliation failed', {
        checkoutSessionId: sessionId,
      });
    }
  }

  // Report incomplete reconciliation so monitoring can detect it.
  if (failures > 0) {
    throw new Error(
      `Failed to recover ${failures} of ${missingSessionIds.length} missing Stripe payments.`,
    );
  }

  return summary;
}
