'use client';

import { useState } from 'react';

export function TopicItem({ item, className = '', style }) {
  return (
    <li
      style={style}
      className={`border-mist flex items-center gap-4 border-b px-2.5 py-4 ${className}`}
    >
      <span className="font-heading text-terracotta text-[1.625rem] leading-none">
        {String(item.number).padStart(2, '0')}
      </span>
      <p className="text-lead text-ink">{item.text}</p>
    </li>
  );
}

export function TopicList({ items }) {
  return (
    <ol>
      {items.map((item) => (
        <TopicItem key={item.text} item={item} />
      ))}
    </ol>
  );
}

export default function ServiceTopicsReveal({ preview, rest }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <TopicList items={preview} />
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <ol>
            {rest.map((item, index) => (
              <TopicItem
                key={item.text}
                item={item}
                style={{
                  transitionDelay: open ? `${70 + index * 50}ms` : '0ms',
                }}
                className={`origin-top transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
                  open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                }`}
              />
            ))}
          </ol>
        </div>
      </div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="text-terracotta text-body mt-4 flex w-full cursor-pointer items-center justify-between gap-4 font-medium"
      >
        {open ? 'Show fewer topics' : 'Show more topics'}
        <span
          aria-hidden="true"
          className={`text-[1.75rem] leading-none transition-transform duration-300 ease-out motion-reduce:transition-none ${
            open ? 'rotate-45' : 'rotate-0'
          }`}
        >
          +
        </span>
      </button>
    </div>
  );
}
