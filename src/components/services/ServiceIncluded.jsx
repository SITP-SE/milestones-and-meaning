import { Fragment } from 'react';

export default function ServiceIncluded({ headline, groups }) {
  return (
    <div>
      <h2 className="text-lead text-brand uppercase">{headline}</h2>
      <div className="mt-8 flex flex-col gap-6 md:grid md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-6 lg:gap-8">
        {groups.map((group, index) => (
          <Fragment key={group.title}>
            {index > 0 && (
              <span
                aria-hidden="true"
                className="text-terracotta flex items-center justify-center text-[1.75rem] leading-none"
              >
                +
              </span>
            )}
            <div className="border-mist rounded-[10px] border p-6 lg:p-8">
              <h3 className="font-heading text-ink text-[1.625rem] leading-none">{group.title}</h3>
              <ul className="mt-5 list-disc space-y-3 pl-5">
                {group.items.map((item) => (
                  <li key={item} className="text-lead text-ink leading-normal">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
