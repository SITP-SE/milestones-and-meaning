import Image from 'next/image';
import Link from 'next/link';
import { SprigIcon } from '@/components/ui/icons';
import TrustBar from './TrustBar';

const openingLines = [
  'The beginning of a marriage.',
  'A promise made.',
  'A relationship finding its way again.',
  'A goodbye you never expected.',
];

export default function Hero() {
  return (
    <section className="bg-cream overflow-x-clip pt-10 lg:pt-[75px]">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 px-6 lg:flex-row lg:gap-2.5 lg:px-0">
        <div className="flex w-full flex-col items-center gap-6 text-center lg:w-[645px] lg:items-start lg:gap-[50px] lg:p-[50px] lg:text-left">
          <h1 className="font-heading text-h1 text-brand font-semibold">
            <span className="block">Some moments</span>
            <span className="block">change everything.</span>
          </h1>

          <div className="text-lead text-ink">
            {openingLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <p className="font-script text-script text-brand -rotate-2">
            We&apos;re here for what comes next
          </p>

          <Link
            href="/#contact"
            className="bg-terracotta text-body flex items-center gap-2.5 rounded-[10px] p-5 text-white transition-opacity hover:opacity-90"
          >
            Book a Free 15-Minute Consultation
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <MobileCollage />
        <HeroCollage />
      </div>

      <TrustBar />
    </section>
  );
}

function MobileCollage() {
  return (
    <div className="relative aspect-[5/4] w-full max-w-[420px] lg:hidden">
      <div
        aria-hidden="true"
        className="bg-blush absolute bottom-[8%] left-[6%] z-0 h-[28%] w-[52%] rounded-[28px]"
      />
      <SprigIcon className="text-terracotta absolute bottom-[20%] left-0 z-10 h-[42%] w-[30%]" />
      <div className="absolute top-[2%] right-0 z-10 h-[58%] w-[78%] -rotate-3 overflow-hidden rounded-[18px] shadow-[0_10px_28px_rgba(82,25,9,0.12)]">
        <Image
          src="/images/hero-flowers.png"
          alt="A vase of peach roses lit by afternoon sun"
          fill
          priority
          sizes="78vw"
          className="object-cover"
        />
      </div>
      <div className="bg-paper absolute top-[34%] left-[16%] z-20 w-[40%] -rotate-6 p-1.5 pb-6 shadow-[0_10px_24px_rgba(82,25,9,0.14)]">
        <div className="relative aspect-[4/5] w-full">
          <Image
            src="/images/hero-hands.png"
            alt="An older couple's hands resting together"
            fill
            sizes="42vw"
            className="object-cover"
          />
        </div>
      </div>
      <div className="bg-paper absolute right-[1%] bottom-[1%] z-30 w-[56%] rotate-6 p-1.5 pb-6 shadow-[0_12px_28px_rgba(82,25,9,0.16)]">
        <div className="relative aspect-[4/3] w-full">
          <Image
            src="/images/hero-sunset.png"
            alt="The sun setting over open water"
            fill
            sizes="56vw"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}

function HeroCollage() {
  return (
    <div className="relative hidden aspect-[545/596] w-full max-w-[545px] shrink-0 lg:block lg:w-[545px]">
      <div className="absolute top-[17.45%] left-[24.4%] h-[39.26%] w-[73.03%] -rotate-4 overflow-hidden rounded-tl-[20px]">
        <Image
          src="/images/hero-flowers.png"
          alt="A vase of peach roses lit by afternoon sun"
          fill
          priority
          sizes="(min-width: 1024px) 398px, 73vw"
          className="object-cover"
        />
      </div>

      <div
        aria-hidden="true"
        className="bg-blush absolute top-[77.68%] left-[3.67%] h-[24.83%] w-[63.49%] rotate-2 rounded-tl-[20px]"
      />

      <div className="bg-paper absolute top-[44.07%] left-[13.39%] h-[34.95%] w-[27.52%] -rotate-5 p-[1.835%]">
        <div className="relative h-[79.8%] w-full">
          <Image
            src="/images/hero-hands.png"
            alt="An older couple's hands resting together"
            fill
            sizes="(min-width: 1024px) 130px, 28vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="bg-paper absolute top-[70.64%] left-[37.25%] h-[34.9%] w-[54.31%] rotate-10 p-[1.835%]">
        <div className="relative h-[79.8%] w-full">
          <Image
            src="/images/hero-sunset.png"
            alt="The sun setting over open water"
            fill
            sizes="(min-width: 1024px) 276px, 54vw"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
