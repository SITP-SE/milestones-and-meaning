import Image from 'next/image';
import Link from 'next/link';

const offerings = [
  {
    label: 'PREPARE',
    title: 'The Strong Start Program',
    body: 'Six-session marriage preparation',
    price: '$955',
    href: '/strong-start',
  },
  {
    label: 'CELEBRATE',
    title: 'Wedding Officiation',
    body: 'A meaningful ceremony tailored to your story.',
    price: '$595',
    href: '/wedding-officiation',
  },
  {
    label: 'STRENGTHEN',
    title: 'Relationship Check-In',
    body: 'A supportive space to connect, reflect & realign',
    price: 'Pricing discussed together',
    href: '/relationship-check-in',
  },
  {
    label: 'NAVIGATE',
    title: 'Grief & Bereavement Support',
    body: 'Compassionate support for your unique journey.',
    price: 'Pricing discussed together',
    href: '/grief-support',
  },
  {
    label: 'NAVIGATE',
    title: 'Funeral & Memorial Services',
    body: 'Thoughtful, personalized services to honor a life.',
    price: '$400',
    href: '/funeral',
  },
];

export default function Services() {
  return (
    <section id="services" className="bg-shell px-6 py-16 lg:px-[50px] lg:py-20">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center">
        <h2 className="font-heading text-ink text-center text-[1.75rem] leading-tight sm:text-[2.5rem] lg:text-[3.125rem]">
          Our Services
        </h2>
        <p className="text-body text-ink mt-3 max-w-[640px] text-center sm:text-lead">
          Thoughtfully designed services to support your relationship and your journey together
        </p>

        <Link
          href="/marriage-package"
          className="border-ink/15 bg-cream mt-10 flex w-full flex-col overflow-hidden rounded-[22px] border-2 transition-opacity hover:opacity-95 lg:flex-row"
        >
          <div className="relative h-56 w-full sm:h-72 lg:h-auto lg:w-[46%]">
            <Image
              src="/images/service-marriage.png"
              alt="An open journal, wedding rings, and a pencil on linen"
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col p-6 sm:p-8 lg:p-10">
            <p className="text-body text-ember font-medium tracking-wide">SIGNATURE OFFERING</p>
            <h3 className="font-heading text-ink mt-3 text-[1.35rem] leading-tight sm:text-[1.625rem]">
              Complete Marriage Package
            </h3>
            <p className="text-body text-stone mt-3">
              Six personalized preparation sessions and a ceremony shaped by someone who already
              knows your story.
            </p>
            <span aria-hidden="true" className="bg-ink/25 mt-5 h-px w-14" />
            <p className="font-heading text-ink mt-4 text-[1.5rem] leading-none sm:text-[1.875rem]">
              $1,925
            </p>
            <p className="text-body text-brand mt-4">
              Explore the complete package <span aria-hidden="true">&rarr;</span>
            </p>
          </div>
        </Link>

        <ul className="mt-6 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {offerings.map((offering, index) => (
            <li
              key={offering.title}
              className={`lg:col-span-2 ${index === 3 ? 'lg:col-start-2' : ''}`}
            >
              <Link
                href={offering.href}
                className="border-ink/15 flex h-full flex-col rounded-[18px] border-2 p-5 transition-opacity hover:opacity-95"
              >
                <p className="text-body text-copper font-medium tracking-wide">{offering.label}</p>
                <h3 className="font-heading text-ink mt-2 text-[1.25rem] leading-tight sm:text-[1.4rem]">
                  {offering.title}
                </h3>
                <p className="text-body text-ink/80 mt-2 font-light">{offering.body}</p>
                <p className="text-body text-brand mt-6 flex items-end justify-between gap-4 font-bold">
                  <span>{offering.price}</span>
                  <span aria-hidden="true" className="text-[1.25rem] font-normal">
                    &rarr;
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
