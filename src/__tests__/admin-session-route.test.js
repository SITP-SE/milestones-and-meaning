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
    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({}),
    });

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

    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        idToken: 'valid-user-token',
      }),
    });

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

    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        idToken: 'old-admin-token',
      }),
    });

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

    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        idToken: 'valid-admin-token',
      }),
    });

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
    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'DELETE',
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    const response = await DELETE(request);

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
  test('rejects logout requests from another website', async () => {
    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'DELETE',
      headers: {
        Origin: 'https://attacker.example',
      },
    });

    const response = await DELETE(request);

    expect(response.status).toBe(403);
  });
  test('rejects cross-site logout requests without an Origin header', async () => {
    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'DELETE',
      headers: {
        'Sec-Fetch-Site': 'cross-site',
      },
    });

    const response = await DELETE(request);

    expect(response.status).toBe(403);
  });
  test('rejects logout requests without security headers', async () => {
    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'DELETE',
    });

    const response = await DELETE(request);

    expect(response.status).toBe(403);
  });
  test('rejects login requests without security headers', async () => {
    adminAuth.verifyIdToken.mockResolvedValue({
      uid: 'admin-user',
      admin: true,
      auth_time: Math.floor(Date.now() / 1000),
    });

    adminAuth.createSessionCookie.mockResolvedValue('firebase-session-cookie');

    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: 'valid-admin-token',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(adminAuth.verifyIdToken).not.toHaveBeenCalled();
  });
  test('rejects same-site logout requests without an Origin header', async () => {
    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'DELETE',
      headers: {
        'Sec-Fetch-Site': 'same-site',
      },
    });

    const response = await DELETE(request);

    expect(response.status).toBe(403);
  });
  test.each([
    ['non-JSON requests', 'hello', 'text/plain', 415],
    ['malformed JSON', '{invalid', 'application/json', 400],
    ['oversized requests', JSON.stringify({ idToken: 'x'.repeat(20000) }), 'application/json', 413],
  ])('rejects %s', async (name, body, contentType, expectedStatus) => {
    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Origin: 'http://localhost:3000',
      },
      body,
    });

    const response = await POST(request);

    expect(response.status).toBe(expectedStatus);
    expect(adminAuth.verifyIdToken).not.toHaveBeenCalled();
  });
});
