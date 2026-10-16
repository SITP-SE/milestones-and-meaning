import { NextResponse } from 'next/server';

import { reconcileMissingPayments } from '@/server/payments/reconcile-missing-payments';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;

  // Never allow reconciliation without a configured secret.
  if (!secret || secret.length < 16) {
    console.error('Payment reconciliation cron secret is not configured.');

    return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
  }

  // Vercel sends the secret as a Bearer token.
  const authorization = request.headers.get('authorization');

  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const summary = await reconcileMissingPayments();

    return NextResponse.json(
      {
        success: true,
        ...summary,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.error('Scheduled Stripe reconciliation failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Reconciliation failed.' }, { status: 500 });
  }
}
