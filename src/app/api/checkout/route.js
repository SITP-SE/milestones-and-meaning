import { NextResponse } from 'next/server';

import { createServiceCheckoutSession } from '@/server/stripe/create-checkout-session';

const MAX_BODY_BYTES = 1024;

export async function POST(request) {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');

  // Accept requests from our own website only.
  if (
    fetchSite === 'cross-site' ||
    (!origin && fetchSite !== 'same-origin') ||
    (origin && origin !== new URL(request.url).origin)
  ) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();

  if (contentType !== 'application/json') {
    return NextResponse.json({ error: 'JSON required.' }, { status: 415 });
  }

  // Limit request size before parsing JSON.
  let body = '';
  let totalBytes = 0;

  try {
    const reader = request.body?.getReader();

    if (!reader) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const decoder = new TextDecoder('utf-8', { fatal: true });

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
      }

      body += decoder.decode(value, { stream: true });
    }

    body += decoder.decode();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  let data;

  try {
    data = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (typeof data?.serviceId !== 'string' || !/^[a-z0-9_-]{1,80}$/.test(data.serviceId)) {
    return NextResponse.json({ error: 'Invalid service ID.' }, { status: 400 });
  }

  try {
    const url = await createServiceCheckoutSession(data.serviceId);

    return NextResponse.json(
      { url },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    if (error.message === 'Service not found.') {
      return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    }

    if (error.message === 'Service is not available for online payment.') {
      return NextResponse.json(
        { error: 'This service is not available for online payment.' },
        { status: 400 },
      );
    }

    // Do not expose Stripe or server configuration details.
    console.error('Failed to create Checkout Session', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Unable to start checkout. Please try again.' },
      { status: 500 },
    );
  }
}
