import Image from 'next/image';
import Link from 'next/link';

function formatPrice(priceCents) {
  if (typeof priceCents !== 'number' || priceCents <= 0) {
    return 'Pricing discussed together';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export default function Services({ services = [] }) {
  const featured = services.find((service) => service.label === 'SIGNATURE OFFERING');
  const offerings = services.filter((service) => service !== featured);

  return (
    <section id="services" className="bg-shell px-6 py-16 lg:px-[50px] lg:py-20">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center">
        <h2 className="font-heading text-ink text-center text-[1.75rem] leading-tight sm:text-[2.5rem] lg:text-[3.125rem]">
          Our Services
        </h2>
        <p className="text-body text-ink sm:text-lead mt-3 max-w-[640px] text-center">
          Thoughtfully designed services to support your relationship and your journey together
        </p>

        {featured && (
          <Link
            href={featured.href}
            className="border-ink/15 bg-cream mt-10 flex w-full flex-col overflow-hidden rounded-[22px] border-2 transition-opacity hover:opacity-95 lg:flex-row"
          >
            {featured.image?.src && (
              <div className="relative h-56 w-full sm:h-72 lg:h-auto lg:w-[46%]">
                <Image
                  src={featured.image.src}
                  alt={featured.image.alt ?? ''}
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col p-6 sm:p-8 lg:p-10">
              <p className="text-body text-ember font-medium tracking-wide">{featured.label}</p>
              <h3 className="font-heading text-ink mt-3 text-[1.35rem] leading-tight sm:text-[1.625rem]">
                {featured.title ?? featured.name}
              </h3>
              <p className="text-body text-stone mt-3">{featured.body}</p>
              <span aria-hidden="true" className="bg-ink/25 mt-5 h-px w-14" />
              <p className="font-heading text-ink mt-4 text-[1.5rem] leading-none sm:text-[1.875rem]">
                {formatPrice(featured.priceCents)}
              </p>
              <p className="text-body text-brand mt-4">
                Explore the complete package <span aria-hidden="true">&rarr;</span>
              </p>
            </div>
          </Link>
        )}

        <ul className="mt-6 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {offerings.map((service, index) => (
            <li
              key={service.id ?? service.href ?? service.title}
              className={`lg:col-span-2 ${offerings.length === 5 && index === 3 ? 'lg:col-start-2' : ''}`}
            >
              <Link
                href={service.href}
                className="border-ink/15 flex h-full flex-col rounded-[18px] border-2 p-5 transition-opacity hover:opacity-95"
              >
                <p className="text-body text-copper font-medium tracking-wide">{service.label}</p>
                <h3 className="font-heading text-ink mt-2 text-[1.25rem] leading-tight sm:text-[1.4rem]">
                  {service.title ?? service.name}
                </h3>
                <p className="text-body text-ink/80 mt-2 font-light">{service.body}</p>
                <p className="text-body text-brand mt-6 flex items-end justify-between gap-4 font-bold">
                  <span>{formatPrice(service.priceCents)}</span>
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
