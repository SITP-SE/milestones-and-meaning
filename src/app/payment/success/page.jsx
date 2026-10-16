import Link from 'next/link';

import { isOnlinePaymentEligible } from '@/lib/online-payment-eligibility';
import { getStripeClient } from '@/server/stripe/client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Payment Status | Milestones & Meaning',
  robots: {
    index: false,
    follow: false,
  },
};

async function isPaymentConfirmed(sessionId) {
  if (typeof sessionId !== 'string' || !/^cs_[a-zA-Z0-9_]{1,255}$/.test(sessionId)) {
    return false;
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return (
      session?.object === 'checkout.session' &&
      session.id === sessionId &&
      session.mode === 'payment' &&
      session.status === 'complete' &&
      session.payment_status === 'paid' &&
      session.currency === 'cad' &&
      isOnlinePaymentEligible(session.metadata?.serviceId, session.amount_total)
    );
  } catch {
    // Never claim payment succeeded when Stripe cannot verify it.
    return false;
  }
}

export default async function PaymentSuccessPage({ searchParams }) {
  const { session_id: sessionId } = await searchParams;
  const confirmed = await isPaymentConfirmed(sessionId);

  return (
    <main className="bg-shell px-6 py-20 lg:px-[50px] lg:py-28">
      <div className="mx-auto flex max-w-[720px] flex-col items-center gap-6 text-center">
        <h1 className="font-heading text-brand text-[clamp(2rem,5vw,3rem)]">
          {confirmed ? 'Payment confirmed' : 'Payment status not confirmed'}
        </h1>

        {confirmed ? (
          <p className="text-lead text-ink leading-relaxed">
            Stripe has confirmed your payment. Thank you for choosing Milestones & Meaning. Gabi
            will follow up about the next steps and arrangements. Your service date is not booked
            yet.
          </p>
        ) : (
          <p className="text-lead text-ink leading-relaxed">
            We couldn&apos;t verify a completed payment. If you&apos;ve already paid, please check
            your payment confirmation before attempting another purchase. Contact us if you need
            help.
          </p>
        )}

        <Link
          href="/services"
          className="bg-terracotta text-lead inline-flex rounded-full px-6 py-3.5 font-medium text-white transition-opacity hover:opacity-90"
        >
          Back to Services
        </Link>
      </div>
    </main>
  );
}
