import { Bone } from '@/components/ui/Skeleton';

export default function ServicesLoading() {
  return (
    <section id="services" className="bg-shell px-6 py-16 lg:px-[50px] lg:py-20" aria-busy="true">
      <span className="sr-only">Loading services</span>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center">
        <h2 className="font-heading text-ink text-center text-[1.75rem] leading-tight sm:text-[2.5rem] lg:text-[3.125rem]">
          Our Services
        </h2>
        <p className="text-body text-ink sm:text-lead mt-3 max-w-[640px] text-center">
          Thoughtfully designed services to support your relationship and your journey together
        </p>

        <div className="border-ink/15 bg-cream mt-10 flex w-full flex-col overflow-hidden rounded-[22px] border-2 lg:flex-row">
          <Bone className="h-56 w-full rounded-none sm:h-72 lg:h-auto lg:min-h-[280px] lg:w-[46%]" />
          <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8 lg:p-10">
            <Bone className="h-4 w-40" />
            <Bone className="h-8 w-3/4 max-w-[20rem]" />
            <Bone className="h-4 w-full max-w-[28rem]" />
            <Bone className="h-4 w-5/6 max-w-[24rem]" />
            <Bone className="mt-2 h-8 w-24" />
          </div>
        </div>

        <ul className="mt-6 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 5 }, (_, index) => (
            <li
              key={index}
              className={`border-ink/15 flex flex-col gap-3 rounded-[18px] border-2 p-5 lg:col-span-2 ${
                index === 3 ? 'lg:col-start-2' : ''
              }`}
            >
              <Bone className="h-4 w-24" />
              <Bone className="h-6 w-4/5" />
              <Bone className="h-4 w-full" />
              <Bone className="mt-4 h-4 w-20" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
