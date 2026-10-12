'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      // The admin session is stored in an HttpOnly cookie, so client-side
      // JavaScript cannot delete it directly. The server must clear it.
      const response = await fetch('/api/auth/session', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Logout failed.');
      }

      // Replace the current page so the protected admin page is not left
      // in the browser history as the active page after logout.
      router.replace('/admin/login');
      router.refresh();
    } catch {
      // For now, keep the failure simple. We can add proper admin UI
      // feedback once the dashboard design exists.
      setIsLoggingOut(false);
    }
  }

  return (
    <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
      {isLoggingOut ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
