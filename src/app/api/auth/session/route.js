import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/server/auth/session';
import { adminAuth } from '@/server/firebase/admin';

// Admin sessions last for five days before requiring another login.
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

// Only accept tokens from a recent login.
// This reduces the chance of an old/stolen ID token being exchanged
// for a new long-lived session cookie.
const RECENT_SIGN_IN_SECONDS = 5 * 60;

export async function POST(request) {
  try {
    const { idToken } = await request.json();

    // Never pass unvalidated request data directly to Firebase Admin.
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    // Verify that Firebase actually issued this ID token.
    // Client-side authentication alone is not trusted for admin access.
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Authentication and authorization are separate:
    // being a valid Firebase user does not automatically make someone an admin.
    if (decodedToken.admin !== true) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    // Require the administrator to have signed in recently before
    // allowing the ID token to become a longer-lived session.
    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (nowInSeconds - decodedToken.auth_time > RECENT_SIGN_IN_SECONDS) {
      return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
    }

    // Exchange the short-lived Firebase ID token for a server-managed
    // session cookie that protected admin pages can verify.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ success: true });

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      // Prevent browser JavaScript from reading the authentication cookie.
      httpOnly: true,

      // HTTPS-only in production. Local development uses HTTP.
      secure: process.env.NODE_ENV === 'production',

      // Helps protect against cross-site request abuse while still allowing
      // normal navigation within the application.
      sameSite: 'lax',

      path: '/',
      maxAge: SESSION_DURATION_MS / 1000,
    });

    return response;
  } catch {
    // Do not expose Firebase/internal authentication errors to the client.
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }
}
