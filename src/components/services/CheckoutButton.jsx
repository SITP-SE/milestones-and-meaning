'use client';

import { useState } from 'react';

const CHECKOUT_ERROR = 'Unable to start secure checkout. Please try again.';

export default function CheckoutButton({ serviceId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCheckout() {
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceId }),
      });

      if (!response.ok) {
        throw new Error('Checkout request failed.');
      }

      const data = await response.json();
      const url = new URL(data.url);

      // Only redirect to Stripe-hosted Checkout.
      if (url.origin !== 'https://checkout.stripe.com' || url.username || url.password) {
        throw new Error('Invalid Checkout destination.');
      }

      window.location.assign(url.toString());
    } catch {
      setError(CHECKOUT_ERROR);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className="bg-terracotta text-lead inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? 'Redirecting to secure checkout...' : 'Pay in Full'}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
