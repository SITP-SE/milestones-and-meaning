export default function ServiceReasons({ eyebrow, headline, body, items }) {
  const midpoint = Math.ceil(items.length / 2);
  const columns = [
    items.slice(0, midpoint).map((item, index) => ({ ...item, number: index + 1 })),
    items.slice(midpoint).map((item, index) => ({ ...item, number: midpoint + index + 1 })),
  ];

  return (
    <div>
      <p className="text-lead text-brand uppercase">{eyebrow}</p>
      <h2 className="font-wordmark text-ink mt-5 text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] leading-none">
        {headline}
      </h2>
      <p className="text-lead text-ink mt-5 max-w-[640px]">{body}</p>
      <div className="mt-10 grid gap-x-16 md:grid-cols-2">
        {columns.map((column) => (
          <ol key={column[0].number}>
            {column.map((item) => (
              <li
                key={item.text}
                className="border-mist flex items-center gap-4 border-b px-2.5 py-4"
              >
                <span className="font-wordmark text-terracotta text-[1.625rem] leading-none">
                  {String(item.number).padStart(2, '0')}
                </span>
                <p className="text-lead text-ink">{item.text}</p>
              </li>
            ))}
          </ol>
        ))}
      </div>
    </div>
  );
}
