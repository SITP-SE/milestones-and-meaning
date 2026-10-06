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
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

    if (decodedToken.admin !== true) {
      return null;
    }

    return decodedToken;
  } catch {
    return null;
  }
}
