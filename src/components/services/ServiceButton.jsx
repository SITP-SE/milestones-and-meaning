'use client';

import Link from 'next/link';

const variants = {
  solid: 'bg-terracotta text-white',
  outline: 'border-terracotta text-terracotta border-2',
};

const shapes = {
  default: 'rounded-[10px] px-5 py-5',
  pill: 'rounded-full px-6 py-3.5',
};

export default function ServiceButton({
  href,
  variant = 'solid',
  shape = 'default',
  className = '',
  children,
}) {
  function handleClick(event) {
    if (!href.startsWith('#')) return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ block: 'start' });
    window.history.replaceState(null, '', href);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`${variants[variant]} ${shapes[shape] ?? shapes.default} text-lead inline-flex items-center gap-2.5 font-medium transition-opacity hover:opacity-90 ${className}`}
    >
      {children}
    </Link>
  );
}
