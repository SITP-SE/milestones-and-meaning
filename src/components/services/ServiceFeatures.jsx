export default function ServiceFeatures({ items }) {
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <li
          key={item.title}
          className="border-mist border-b py-6 last:border-b-0 sm:px-6 sm:odd:border-r lg:border-r lg:border-b-0 lg:px-8 lg:py-0 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
        >
          <h2 className="text-body text-terracotta font-medium tracking-wide uppercase">
            {item.title}
          </h2>
          <p className="text-body text-ink mt-3 leading-normal">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}
