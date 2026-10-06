import { cookies } from 'next/headers';

import { adminAuth } from '@/server/firebase/admin';

export const SESSION_COOKIE_NAME = 'admin_session';

export async function getAdminSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    // Verify both that Firebase created the session and that it has not
    // been revoked, for example after an administrator is disabled.
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

    // A valid Firebase account is not enough to access the admin area.
    // The account must explicitly carry our admin authorization claim.
    if (decodedToken.admin !== true) {
      return null;
    }

    return decodedToken;
  } catch {
    // Invalid, expired, or revoked sessions are treated as signed out.
    return null;
  }
}
