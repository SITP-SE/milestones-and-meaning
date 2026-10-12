import Image from 'next/image';
import Link from 'next/link';

const chapters = [
  {
    label: '01 · Prepare',
    title: 'Build a strong foundation',
    body: 'Personalized conversations before marriage.',
    cta: 'Explore Strong Start',
    href: '/strong-start',
    image: '/images/journey-prepare.png',
    alt: 'Two people walking along the shore at sunset',
  },
  {
    label: '02 · Celebrate',
    title: 'Mark the moment',
    body: 'Ceremonies shaped around your story.',
    cta: 'Explore marriage packages',
    href: '/marriage-package',
    image: '/images/journey-celebrate.png',
    alt: 'Wedding bands and a rose on soft fabric',
  },
  {
    label: '03 · Strengthen',
    title: 'Keep choosing each other',
    body: 'Ongoing support for real life together.',
    cta: 'Explore relationship support',
    href: '/relationship-check-in',
    image: '/images/journey-strengthen.png',
    alt: 'A couple exchanging rings',
  },
  {
    label: '04 · Navigate',
    title: 'Find support through change',
    body: 'Compassionate guidance through grief and transition.',
    cta: 'Explore grief support',
    href: '/services/funeral',
    image: '/images/journey-navigate.png',
    alt: 'A lit candle beside a small bouquet',
  },
];

export default function Journey() {
  return (
    <section className="bg-shell px-6 py-16 lg:px-[50px] lg:py-20">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center">
        <div className="text-brand flex items-center gap-4">
          <span aria-hidden="true" className="bg-brand/60 h-px w-12 sm:w-20" />
          <p className="text-body sm:text-eyebrow tracking-wide">THE JOURNEY</p>
          <span aria-hidden="true" className="bg-brand/60 h-px w-12 sm:w-20" />
        </div>

        <h2 className="font-heading text-ink sm:text-h2 mt-5 text-center text-[1.5rem] leading-tight">
          Support for every chapter.
        </h2>

        <p className="text-body text-ink sm:text-lead mt-4 max-w-[640px] text-center">
          Life moves in cycles, and every chapter deserves care, intention and support. We&apos;re
          here for the big moments and the in between
        </p>

        <ul className="mt-10 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {chapters.map((chapter) => (
            <li key={chapter.label} className="h-full">
              <Link
                href={chapter.href}
                className="border-ink/15 bg-paper relative flex h-full flex-col overflow-hidden rounded-[20px] border transition-opacity hover:opacity-95"
              >
                <div className="relative hidden aspect-[4/3] shrink-0 lg:block">
                  <Image
                    src={chapter.image}
                    alt={chapter.alt}
                    fill
                    sizes="(min-width: 1024px) 275px, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col px-4 py-4">
                  <p className="text-body text-copper font-medium tracking-wide uppercase">
                    {chapter.label}
                  </p>
                  <h3 className="font-heading text-ink mt-2 text-[1.125rem] leading-snug font-medium">
                    {chapter.title}
                  </h3>
                  <p className="text-body text-ink/80 mt-2">{chapter.body}</p>
                  <p className="text-body text-copper mt-auto pt-5">
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
