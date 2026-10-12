import ServiceTopicsReveal, { TopicList } from './ServiceTopicsReveal';

export default function ServiceReasons({
  eyebrow,
  headline,
  body,
  items,
  columns = 2,
  mobilePreview,
}) {
  const columnCount = columns === 3 ? 3 : 2;
  const size = Math.ceil(items.length / columnCount);
  const groups = Array.from({ length: columnCount }, (_, column) =>
    items.slice(column * size, column * size + size).map((item, index) => ({
      ...item,
      number: column * size + index + 1,
    })),
  );
  const numbered = items.map((item, index) => ({ ...item, number: index + 1 }));
  const previewCount =
    typeof mobilePreview === 'number' && mobilePreview > 0 && mobilePreview < items.length
      ? mobilePreview
      : null;

  return (
    <div>
      <p className="text-lead text-brand uppercase">{eyebrow}</p>
      <h2 className="font-heading text-ink mt-5 text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] leading-none">
        {headline}
      </h2>
      {body && <p className="text-lead text-ink mt-5 max-w-[640px]">{body}</p>}
      {previewCount ? (
        <div className="mt-10 lg:hidden">
          <ServiceTopicsReveal
            preview={numbered.slice(0, previewCount)}
            rest={numbered.slice(previewCount)}
          />
        </div>
      ) : null}
      <div
        className={`mt-10 grid gap-x-16 ${previewCount ? 'hidden lg:grid' : 'grid'} ${
          columnCount === 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'
        }`}
      >
        {groups
          .filter((column) => column.length > 0)
          .map((column) => (
            <TopicList key={column[0].number} items={column} />
          ))}
      </div>
    </div>
  );
}
