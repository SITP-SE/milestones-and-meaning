import Link from 'next/link';

export default function ServicePrompt({ title, body, cta }) {
  return (
    <Link
      href={cta.href}
      className="border-mist flex flex-col gap-3 rounded-[10px] border p-3 transition-opacity hover:opacity-90 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
    >
      <div className="flex min-w-0 flex-1 items-stretch gap-3 sm:gap-4">
        <span aria-hidden="true" className="bg-terracotta w-[5px] shrink-0" />
        <div>
          <p className="text-body text-ink sm:text-lead font-bold">{title}</p>
          <p className="text-body text-ink sm:text-lead mt-1 leading-normal sm:mt-2">{body}</p>
        </div>
      </div>
      <span className="border-terracotta text-terracotta text-body flex w-full items-center rounded-[10px] border-2 bg-transparent px-4 py-2.5 font-medium sm:hidden">
        {cta.label} <span aria-hidden="true">&rarr;</span>
      </span>
      <span className="border-terracotta text-terracotta text-lead hidden shrink-0 items-center gap-2.5 rounded-[10px] border-2 px-5 py-5 font-medium sm:inline-flex">
        {cta.label} <span aria-hidden="true">&rarr;</span>
      </span>
    </Link>
  );
}
