import Link from 'next/link';

import LogoutButton from './logout-button';

// Entry point for administrator management features.
// Each linked section remains protected by the admin layout.
export default function AdminPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>

      <p className="mt-2">You are signed in.</p>

      <nav aria-label="Admin sections" className="mt-8">
        <ul className="flex flex-col gap-4">
          <li>
            <Link href="/admin/services" className="underline">
              Manage services
            </Link>
          </li>

          <li>
            <Link href="/admin/payments" className="underline">
              View payments
            </Link>
          </li>
        </ul>
      </nav>

      <div className="mt-8">
        <LogoutButton />
      </div>
    </main>
  );
}
