/** @jest-environment node */

import { SESSION_COOKIE_NAME } from '@/server/auth/session';
import { adminAuth } from '@/server/firebase/admin';
import { DELETE, POST } from '@/app/api/auth/session/route';

jest.mock('@/server/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: jest.fn(),
    createSessionCookie: jest.fn(),
  },
}));

describe('admin session API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects a request without an ID token', async () => {
    const request = {
      json: jest.fn().mockResolvedValue({}),
    };

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(adminAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  test('rejects an authenticated user without the admin claim', async () => {
    adminAuth.verifyIdToken.mockResolvedValue({
      uid: 'regular-user',
      admin: false,
      auth_time: Math.floor(Date.now() / 1000),
    });

    const request = {
      json: jest.fn().mockResolvedValue({
        idToken: 'valid-user-token',
      }),
    };

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(adminAuth.createSessionCookie).not.toHaveBeenCalled();
  });

  test('rejects a login that is no longer recent', async () => {
    adminAuth.verifyIdToken.mockResolvedValue({
      uid: 'admin-user',
      admin: true,

      // Older than the five-minute limit used by the session endpoint.
      auth_time: Math.floor(Date.now() / 1000) - 10 * 60,
    });

    const request = {
      json: jest.fn().mockResolvedValue({
        idToken: 'old-admin-token',
      }),
    };

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(adminAuth.createSessionCookie).not.toHaveBeenCalled();
  });

  test('creates a session for an authorized admin', async () => {
    adminAuth.verifyIdToken.mockResolvedValue({
      uid: 'admin-user',
      admin: true,
      auth_time: Math.floor(Date.now() / 1000),
    });

    adminAuth.createSessionCookie.mockResolvedValue('firebase-session-cookie');

    const request = {
      json: jest.fn().mockResolvedValue({
        idToken: 'valid-admin-token',
      }),
    };

    const response = await POST(request);

    expect(response.status).toBe(200);

    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith('valid-admin-token');

    expect(adminAuth.createSessionCookie).toHaveBeenCalled();

    // The successful response must contain the server-managed admin session.
    const cookie = response.cookies.get(SESSION_COOKIE_NAME);

    expect(cookie?.value).toBe('firebase-session-cookie');
    expect(cookie?.httpOnly).toBe(true);
  });

  test('clears the session cookie when logging out', async () => {
    const response = await DELETE();

    expect(response.status).toBe(200);

    // Logout expires the HttpOnly cookie instead of trying to remove it
    // from browser JavaScript.
    const cookie = response.cookies.get(SESSION_COOKIE_NAME);

    expect(cookie?.value).toBe('');
    expect(cookie?.maxAge).toBe(0);
  });
  test('rejects login requests from another website', async () => {
    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://attacker.example',
      },
      body: JSON.stringify({
        idToken: 'fake-token',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(adminAuth.verifyIdToken).not.toHaveBeenCalled();
  });
});
