import Image from 'next/image';
import { MessageIcon, PhoneIcon } from '@/components/ui/icons';
import ServiceButton from './ServiceButton';

const backgrounds = {
  linen: 'bg-linen',
  cream: 'bg-cream',
  shell: 'bg-shell',
  sand: 'bg-sand',
  peach: 'bg-peach',
};

export default function ServiceHero({
  eyebrow,
  headline,
  lines,
  price,
  deposit,
  cta,
  image,
  tone = 'linen',
  hideImageOnMobile = false,
  children,
}) {
  return (
    <section className={backgrounds[tone] ?? 'bg-linen'}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 px-6 py-16 lg:flex-row lg:items-center lg:gap-[50px] lg:px-[50px] lg:pt-[100px] lg:pb-[50px]">
        <div className="flex w-full max-w-[610px] flex-col items-center gap-10 text-center lg:items-start lg:text-left">
          <div className="flex flex-col gap-5">
            <p className="text-lead text-terracotta uppercase">{eyebrow}</p>
            <h1 className="font-wordmark text-ink text-[clamp(2.25rem,1.4rem+2.4vw,3.125rem)] leading-none">
              {headline.split('\n').map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <div className="text-lead text-ink leading-normal">
              {lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
          {(price || deposit) && (
            <p className="flex items-baseline gap-3">
              {price && (
                <span className="font-wordmark text-brand text-[clamp(1.75rem,4vw,2.25rem)] leading-none font-bold">
                  {price}
                </span>
              )}
              {price && deposit && (
                <span aria-hidden="true" className="text-mist text-lead">
                  |
                </span>
              )}
              {deposit && <span className="text-lead text-stone">{deposit}</span>}
            </p>
          )}
          {cta && (
            <ServiceButton href={cta.href} shape={cta.pill ? 'pill' : 'default'}>
              {cta.icon === 'phone' && <PhoneIcon className="size-5" />}
              {cta.icon !== false && cta.icon !== 'phone' && <MessageIcon className="size-5" />}
              {cta.label}
            </ServiceButton>
          )}
        </div>
        <div
          className={`relative aspect-square w-full max-w-[400px] overflow-hidden rounded-[10px] ${
            hideImageOnMobile ? 'hidden lg:block' : ''
          }`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority
            sizes="(min-width: 1024px) 400px, 100vw"
            className="object-cover"
          />
        </div>
      </div>
      {children && (
        <div className="mx-auto w-full max-w-[1200px] px-6 pb-20 lg:px-[50px] lg:pb-28">
          {children}
        </div>
      )}
    </section>
  );
}
