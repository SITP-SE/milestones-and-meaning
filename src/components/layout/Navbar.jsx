'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import MobileMenu from './MobileMenu';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'About Us', href: '/#about' },
  { label: 'Resources', href: '/#resources' },
  { label: 'Contact us', href: '/#contact' },
];

function isCurrent(pathname, href) {
  if (href === '/') return pathname === '/';
  if (href.startsWith('/#')) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const lastY = useRef(0);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const links = navLinks.map((link) => ({
    ...link,
    current: isCurrent(pathname, link.href),
  }));

  const handleMenuOpenChange = useCallback((open) => {
    setHidden(false);
    setMenuOpen(open);
  }, []);

  useEffect(() => {
    lastY.current = window.scrollY;

    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (menuOpen || y < 8) {
        setHidden(false);
      } else if (delta > 6) {
        setHidden(true);
      } else if (delta < -6) {
        setHidden(false);
      }

      lastY.current = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuOpen]);

  return (
    <header
      className={`bg-shell sticky top-0 z-40 w-full transition-transform duration-300 ease-out motion-reduce:transition-none ${
        hidden && !menuOpen ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-3.5 lg:px-[50px] lg:py-2.5"
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/logo-heart.png"
            alt=""
            width={40}
            height={34}
            priority
            className="h-[34px] w-10 object-cover"
          />
          <span className="font-wordmark text-brand text-[1.25rem] leading-[1.2]">
            Milestones &amp; Meaning
          </span>
        </Link>

        <ul className="hidden items-center gap-x-5 lg:flex">
          {links.map(({ label, href, current }) => (
            <li key={label}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className="text-body text-brand relative block transition-opacity hover:opacity-70"
              >
                {label}
                {current && (
                  <span
                    aria-hidden="true"
                    className="bg-brand absolute inset-x-1 -bottom-1.5 h-0.5"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/#contact"
          className="bg-terracotta text-body hidden items-center gap-2.5 rounded-full p-[15px] font-light text-white transition-opacity hover:opacity-90 lg:flex"
        >
          Book a Consultation
          <span aria-hidden="true">&rarr;</span>
        </Link>

        <MobileMenu links={links} open={menuOpen} onOpenChange={handleMenuOpenChange} />
      </nav>
    </header>
  );
}
