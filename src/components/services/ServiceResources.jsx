export default function ServiceResources({ eyebrow, headline, body, items }) {
  return (
    <div>
      <p className="text-lead text-brand uppercase">{eyebrow}</p>
      <h2 className="font-wordmark text-ink mt-5 text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] leading-none">
        {headline}
      </h2>
      <p className="text-lead text-ink mt-5 max-w-[640px]">{body}</p>
      <ul className="mt-10 grid gap-12 md:grid-cols-3 md:gap-10">
        {items.map((item) => (
          <li key={item.title}>
            <div aria-hidden="true" className="bg-brand h-[200px] rounded-[10px]" />
            <p className="text-body text-ink mt-4 font-medium tracking-wide uppercase">
              {item.label}
            </p>
            <h3 className="font-heading text-ink mt-2 text-[1.25rem] leading-snug font-medium">
              {item.title}
            </h3>
            <p className="text-body text-ink/80 mt-2">{item.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
