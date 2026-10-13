import { adminDb } from '@/server/firebase/admin';
import { getStripeClient } from '@/server/stripe/client';

function getCheckoutConfig() {
  let appUrl;

  try {
    appUrl = new URL(process.env.APP_URL);
  } catch {
    throw new Error('Invalid application URL configuration.');
  }

  const isLocal =
    appUrl.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(appUrl.hostname);

  if (
    !(appUrl.protocol === 'https:' || isLocal) ||
    appUrl.username ||
    appUrl.password ||
    appUrl.pathname !== '/' ||
    appUrl.search ||
    appUrl.hash
  ) {
    throw new Error('Invalid application URL configuration.');
  }

  return { origin: appUrl.origin };
}

export async function createServiceCheckoutSession(serviceId) {
  if (typeof serviceId !== 'string' || !/^[a-z0-9_-]{1,80}$/.test(serviceId)) {
    throw new Error('Invalid service ID.');
  }

  const { origin } = getCheckoutConfig();

  // Never accept payment amounts from the browser.
  const snapshot = await adminDb.collection('services').doc(serviceId).get();

  if (!snapshot.exists) {
    throw new Error('Service not found.');
  }

  const service = snapshot.data();
  const priceCents = service?.priceCents;

  // Services with consultation-based pricing cannot use
  // the standard fixed-price checkout.
  if (!Number.isSafeInteger(priceCents) || priceCents <= 0 || priceCents > 100000000) {
    throw new Error('Service is not available for online payment.');
  }

  if (typeof service.title !== 'string' || !service.title.trim()) {
    throw new Error('Invalid service information.');
  }

  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    adaptive_pricing: {
      enabled: false,
    },
    name_collection: {
      individual: {
        enabled: true,
        optional: false,
      },
    },

    line_items: [
      {
        price_data: {
          currency: 'cad',
          unit_amount: priceCents,
          product_data: {
            name: service.title.trim(),
          },
        },
        quantity: 1,
      },
    ],

    metadata: {
      serviceId,
    },

    payment_intent_data: {
      metadata: {
        serviceId,
      },
    },

    success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/services`,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a Checkout URL.');
  }

  return session.url;
}
