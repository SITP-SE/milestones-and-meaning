import Image from 'next/image';
import Link from 'next/link';
import MobileMenu from './MobileMenu';

const navLinks = [
  { label: 'Home', href: '/', current: true },
  { label: 'Services', href: '/#services' },
  { label: 'About Us', href: '/#about' },
  { label: 'Resources', href: '/#resources' },
  { label: 'Contact us', href: '/#contact' },
];

export default function Navbar() {
  return (
    <header className="border-terracotta bg-shell relative w-full border-b">
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
          {navLinks.map(({ label, href, current }) => (
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

        <MobileMenu links={navLinks} />
      </nav>
    </header>
  );
}
