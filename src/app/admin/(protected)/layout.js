import { redirect } from 'next/navigation';

import { getAdminSession } from '@/server/auth/session';

export default async function ProtectedAdminLayout({ children }) {
  // Every admin page placed inside the `(protected)` route group
  // passes through this server-side authorization check.
  //
  // The parentheses are a Next.js route group, so they do not appear
  // in the URL. For example:
  // admin/(protected)/page.js -> /admin
  // admin/(protected)/services/page.js -> /admin/services
  const session = await getAdminSession();

  if (!session) {
    // Redirect before rendering any protected admin content.
    redirect('/admin/login');
  }

  return children;
}
