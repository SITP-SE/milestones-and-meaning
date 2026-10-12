import Link from 'next/link';

import LogoutButton from './logout-button';

// Main entry point for the protected admin dashboard.
//
// Additional administration features will be linked
// here as they are implemented.
export default function AdminPage() {
  return (
    <main>
      <h1>Admin Dashboard</h1>

      <p>You are signed in.</p>

      {/* Navigate to the service management section. */}
      <Link href="/admin/services">Manage services</Link>

      {/* End the administrator's authenticated session. */}
      <LogoutButton />
    </main>
  );
}
