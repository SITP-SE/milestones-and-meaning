'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MobileMenu({ links }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="text-brand flex h-11 w-11 items-center justify-center"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="border-terracotta bg-shell absolute inset-x-0 top-full border-b px-6 py-4"
        >
          <ul className="flex flex-col gap-1">
            {links.map(({ label, href, current }) => (
              <li key={label}>
                <Link
                  href={href}
                  aria-current={current ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  className="text-body text-brand block py-2"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/#contact"
            onClick={() => setOpen(false)}
            className="bg-terracotta text-body mt-3 inline-flex items-center gap-2.5 rounded-full px-4 py-3 text-white"
          >
            Book a Consultation
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" fill="none" aria-hidden="true">
      <path
        d="M1 1.5h24M1 9h24M1 16.5h24"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 3l14 14M17 3L3 17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
