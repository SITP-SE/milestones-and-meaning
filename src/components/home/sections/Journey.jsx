import Image from 'next/image';
import Link from 'next/link';

const chapters = [
  {
    title: 'Prepare',
    eyebrow: 'BEFORE THE PROMISE.',
    body: "Build a strong foundation for what's ahead with premarital conversations, values alignment and guidance.",
    cta: 'Strong Start Program',
    href: '/strong-start',
    image: '/images/journey-prepare.png',
    alt: 'Two people walking along the shore at sunset',
    panel: 'bg-clay text-brand',
  },
  {
    title: 'Celebrate',
    eyebrow: 'MARK THE MOMENT',
    body: 'Meaningful ceremonies and weddings that feel like you - not just a checklist',
    cta: 'Complete Marriage Package',
    href: '/marriage-package',
    image: '/images/journey-celebrate.png',
    alt: 'Wedding bands and a rose on soft fabric',
    panel: 'bg-peach text-brand',
  },
  {
    title: 'Strengthen',
    eyebrow: 'KEEP CHOOSING EACH OTHER',
    body: 'Ongoing relationship support for real life - communication, conflict, change and growth.',
    cta: 'Relationship Support',
    href: '/relationship-check-in',
    image: '/images/journey-strengthen.png',
    alt: 'A couple exchanging rings',
    panel: 'bg-sand text-brand',
  },
  {
    title: 'Navigate',
    eyebrow: 'WHEN LIFE CHANGES SHAPE',
    body: 'Bereavement, grief and major transitions - with compassion, practical support and space to heal',
    cta: 'Funeral / Memorial Officiation',
    href: '/funeral',
    image: '/images/journey-navigate.png',
    alt: 'A lit candle beside a small bouquet',
    panel: 'bg-cocoa text-white',
  },
];

export default function Journey() {
  return (
    <section className="bg-shell px-6 py-16 lg:px-[50px] lg:py-20">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center">
        <div className="text-brand flex items-center gap-4">
          <span aria-hidden="true" className="bg-brand/60 h-px w-12 sm:w-20" />
          <p className="text-body tracking-wide sm:text-eyebrow">THE JOURNEY</p>
          <span aria-hidden="true" className="bg-brand/60 h-px w-12 sm:w-20" />
        </div>

        <h2 className="font-heading text-ink mt-5 text-center text-[1.5rem] leading-tight sm:text-h2">
          Support for every chapter.
        </h2>

        <p className="text-body text-ink mt-4 max-w-[640px] text-center sm:text-lead">
          Life moves in cycles, and every chapter deserves care, intention and support. We&apos;re
          here for the big moments and the in between
        </p>

        <ul className="mt-10 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {chapters.map((chapter) => (
            <li key={chapter.title}>
              <Link
                href={chapter.href}
                className="flex h-full flex-col overflow-hidden rounded-[22px] transition-opacity hover:opacity-95"
              >
                <div className="relative hidden h-44 w-full sm:block sm:h-40">
                  <Image
                    src={chapter.image}
                    alt={chapter.alt}
                    fill
                    sizes="(min-width: 1024px) 275px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className={`flex flex-1 flex-col gap-5 p-4 sm:gap-5 sm:p-5 ${chapter.panel}`}>
                  <h3 className="font-heading text-[1.25rem] leading-none sm:text-[1.75rem]">
                    {chapter.title}
                  </h3>
                  <p className="text-body font-light tracking-wide uppercase hidden sm:block">{chapter.eyebrow}</p>
                  <p className="text-body">{chapter.body}</p>
                  <p className="text-body mt-auto pt-2 underline sm:pt-6">
                    {chapter.cta} <span aria-hidden="true">&rarr;</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/#resources"
          className="text-body text-brand border-brand/50 mt-8 rounded-full border px-5 py-2.5 transition-opacity hover:opacity-70"
        >
          Find more resources <span aria-hidden="true">&rarr;</span>
        </Link>

        <p className="font-heading text-ink mt-14 max-w-[820px] text-center text-[1.25rem] leading-snug italic sm:text-[1.5rem] lg:text-[1.875rem]">
          &quot;You don&apos;t need to have a relationship problem to invest in your
          relationship&quot;
        </p>
      </div>
    </section>
  );
}
