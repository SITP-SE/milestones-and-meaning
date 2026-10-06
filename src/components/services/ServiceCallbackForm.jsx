'use client';

import { useState } from 'react';
import { PhoneIcon } from '@/components/ui/icons';

export default function ServiceCallbackForm({ eyebrow, headline, body }) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section
      id="callback"
      className="border-terracotta/50 scroll-mt-24 rounded-[20px] border p-6 sm:p-8 lg:p-10"
    >
      <p className="text-body text-terracotta font-medium tracking-wide uppercase">{eyebrow}</p>
      <h2 className="font-wordmark text-ink mt-3 text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] leading-none">
        {headline}
      </h2>
      <p className="text-lead text-ink mt-4 max-w-[680px] leading-normal">{body}</p>

      {submitted ? (
        <div
          className="border-terracotta text-ink mt-8 flex items-center gap-3 rounded-[10px] border p-5"
          role="status"
        >
          <PhoneIcon className="text-terracotta size-5 shrink-0" />
          <p className="text-lead">Thank you. We&apos;ll call you as soon as we can.</p>
        </div>
      ) : (
        <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="text-body text-ink flex flex-col gap-2 font-medium">
            Name
            <input
              type="text"
              name="name"
              autoComplete="name"
              required
              className="border-mist bg-paper text-lead text-ink focus:border-terracotta rounded-[10px] border px-4 py-3 font-normal transition-colors outline-none"
            />
          </label>
          <label className="text-body text-ink flex flex-col gap-2 font-medium">
            Phone number
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              required
              className="border-mist bg-paper text-lead text-ink focus:border-terracotta rounded-[10px] border px-4 py-3 font-normal transition-colors outline-none"
            />
          </label>
          <button
            type="submit"
            className="bg-terracotta text-lead inline-flex w-fit items-center gap-2.5 rounded-[10px] px-5 py-4 font-medium text-white transition-opacity hover:opacity-90 sm:col-span-2"
          >
            <PhoneIcon className="size-5" />
            Request a callback
          </button>
        </form>
      )}
    </section>
  );
}
