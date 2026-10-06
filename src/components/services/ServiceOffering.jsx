import Image from 'next/image';
import ServiceButton from './ServiceButton';

export default function ServiceOffering({ eyebrow, price, body, includes, cta, image }) {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-stretch md:gap-[50px]">
      <div className="relative min-h-[280px] w-full overflow-hidden rounded-[10px] md:min-h-[360px] md:w-1/2">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 768px) 500px, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex w-full flex-col items-start gap-[30px] md:w-1/2">
        <div className="flex flex-col gap-4">
          <h2 className="text-lead text-brand font-normal uppercase">{eyebrow}</h2>
          <p className="font-wordmark text-ink text-[clamp(2.5rem,6vw,3.125rem)] leading-none">
            {price}
          </p>
        </div>
        <p className="text-lead text-ink leading-normal">{body}</p>
        <ul className="text-lead text-ink list-disc space-y-1 pl-5 leading-normal">
          {includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <ServiceButton href={cta.href}>
          {cta.label} <span aria-hidden="true">&rarr;</span>
        </ServiceButton>
      </div>
    </div>
  );
}
