import Link from 'next/link';

const variants = {
  solid: 'bg-terracotta text-white',
  outline: 'border-terracotta text-terracotta border-2',
};

export default function ServiceButton({ href, variant = 'solid', className = '', children }) {
  return (
    <Link
      href={href}
      className={`${variants[variant]} text-lead inline-flex items-center gap-2.5 rounded-[10px] px-5 py-5 font-medium transition-opacity hover:opacity-90 ${className}`}
    >
      {children}
    </Link>
  );
}
