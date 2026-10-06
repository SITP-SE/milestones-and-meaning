export default function ServiceExplain({ eyebrow, headline, paragraphs }) {
  return (
    <div>
      {eyebrow && <p className="text-lead text-brand uppercase">{eyebrow}</p>}
      <h2 className="font-wordmark text-ink mt-5 text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] leading-none">
        {headline}
      </h2>
      <div className="mt-5 flex w-full flex-col gap-4">
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-lead text-ink leading-normal">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
