import { cookies } from 'next/headers';

import { getAdminSession, SESSION_COOKIE_NAME } from '@/server/auth/session';
import { adminAuth } from '@/server/firebase/admin';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/server/firebase/admin', () => ({
  adminAuth: {
    verifySessionCookie: jest.fn(),
  },
}));

describe('getAdminSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns null when there is no session cookie', async () => {
    cookies.mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    const session = await getAdminSession();

    expect(session).toBeNull();
    expect(adminAuth.verifySessionCookie).not.toHaveBeenCalled();
  });

  test('returns the decoded session for an authorized admin', async () => {
    const decodedToken = {
      uid: 'admin-user',
      admin: true,
    };

    cookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: 'valid-session-cookie',
      }),
    });

    adminAuth.verifySessionCookie.mockResolvedValue(decodedToken);

    const session = await getAdminSession();

    // The second argument tells Firebase Admin to also check whether
    // this user's session has been revoked.
    expect(adminAuth.verifySessionCookie).toHaveBeenCalledWith('valid-session-cookie', true);

    expect(session).toEqual(decodedToken);
  });

  test('rejects an authenticated user without the admin claim', async () => {
    cookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: 'valid-session-cookie',
      }),
    });

    adminAuth.verifySessionCookie.mockResolvedValue({
      uid: 'regular-user',
      admin: false,
    });

    const session = await getAdminSession();

    expect(session).toBeNull();
  });

  test('rejects an invalid, expired, or revoked session', async () => {
    cookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: 'invalid-session-cookie',
      }),
    });

    adminAuth.verifySessionCookie.mockRejectedValue(new Error('Invalid session'));

    const session = await getAdminSession();

    expect(session).toBeNull();
  });
});
