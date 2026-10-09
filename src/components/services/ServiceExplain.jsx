export default function ServiceExplain({ eyebrow, headline, paragraphs }) {
  return (
    <>
      <details className="border-mist bg-paper group rounded-[10px] border p-4 lg:hidden">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-start justify-between gap-4">
            <span>
              {eyebrow && <span className="text-body text-brand block uppercase">{eyebrow}</span>}
              <span className="font-wordmark text-ink mt-2 block text-[1.5rem] leading-tight">
                {headline}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="text-terracotta text-[1.75rem] leading-none transition-transform group-open:rotate-45"
            >
              +
            </span>
          </span>
          {paragraphs[0] && (
            <p className="text-body text-ink/80 mt-3 line-clamp-2 leading-normal group-open:hidden">
              {paragraphs[0]}
            </p>
          )}
        </summary>
        <div className="border-mist mt-4 flex w-full flex-col gap-4 border-t pt-4">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-body text-ink leading-normal">
              {paragraph}
            </p>
          ))}
        </div>
      </details>

      <div className="hidden lg:block">
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
    </>
  );
}
