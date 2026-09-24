const credentials = [
  'Licensed Marriage Therapist',
  '20+ Years of Experience',
  'Professional Officiant',
  'Over 200+ Clients',
];

export default function About() {
  return (
    <section id="about" className="bg-cream px-6 py-16 lg:px-[50px] lg:py-20">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="text-brand mb-8 flex w-full items-center justify-center gap-4 lg:hidden">
          <span aria-hidden="true" className="bg-brand/60 h-px flex-1" />
          <p className="text-body shrink-0 tracking-wide sm:text-eyebrow">ABOUT GABI</p>
          <span aria-hidden="true" className="bg-brand/60 h-px flex-1" />
        </div>

        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div
            aria-hidden="true"
            className="bg-brand h-64 w-full max-w-[420px] shrink-0 rounded-[22px] sm:h-80 lg:h-[420px] lg:w-[420px]"
          />

          <div className="flex w-full flex-col items-center text-center lg:items-start lg:text-left">
            <div className="text-brand hidden w-full items-center justify-start gap-4 lg:flex">
              <p className="text-eyebrow shrink-0 tracking-wide">ABOUT GABI</p>
              <span aria-hidden="true" className="bg-brand/60 h-px min-w-16 flex-1" />
            </div>

            <h2 className="font-heading text-ink mt-5 text-[1.5rem] leading-tight sm:text-h2">
              Hi, I&apos;m Gabi.
            </h2>

            <div className="text-body text-ink mt-6 flex flex-col gap-4 sm:text-lead">
              <p>
                I help couples create strong foundations, celebrate what matters, and navigate
                life&apos;s transitions with clarity and care. My approach is warm, practical, and
                rooted in respect for your unique story.
              </p>
              <p>
                Whether you&apos;re facing a crossroads or wanting to deepen what you already have,
                I&apos;m here to help you move forward - together.
              </p>
            </div>

            <ul className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {credentials.map((item) => (
                <li key={item}>
                  <p className="text-body text-ink border-ink/40 rounded-full border px-4 py-2">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* <p className="font-heading text-ink mt-16 italic text-center text-[1.25rem] leading-snug sm:text-[1.5rem] lg:text-[1.875rem]">
          &quot;Every couple is different. No two sessions I run are the same&quot;
        </p> */}
      </div>
    </section>
  );
}
