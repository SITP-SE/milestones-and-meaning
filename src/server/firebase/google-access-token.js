import { importPKCS8, SignJWT } from 'jose';

import { getServiceAccount } from '@/server/firebase/config';

// Exchanges the Firebase service account for a short-lived Google OAuth
// access token (the "JWT bearer" flow), which authorizes the Firestore and
// Identity Toolkit REST calls. This is what firebase-admin's cert() did.
// https://developers.google.com/identity/protocols/oauth2/service-account#httprest

export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/datastore',
  'https://www.googleapis.com/auth/identitytoolkit',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// Refresh a little before Google's expiry time.
const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

// Only the resolved token string is shared between requests. Cloudflare
// Workers do not let one request wait on I/O that another request started,
// so the in-flight fetch itself is never cached.
let cachedToken = null;

export async function getGoogleAccessToken() {
  if (cachedToken && cachedToken.expiresAt - EXPIRY_MARGIN_MS > Date.now()) {
    return cachedToken.value;
  }

  const { clientEmail, privateKey } = getServiceAccount();
  const key = await importPKCS8(privateKey, 'RS256');
  const nowSeconds = Math.floor(Date.now() / 1000);

  const assertion = await new SignJWT({ scope: SCOPES })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(clientEmail)
    .setAudience(GOOGLE_TOKEN_URL)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + 3600)
    .sign(key);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google access token request failed with status ${response.status}.`);
  }

  const { access_token: value, expires_in: expiresInSeconds } = await response.json();

  if (typeof value !== 'string' || !value) {
    throw new Error('Google access token response did not include a token.');
  }

  cachedToken = { value, expiresAt: Date.now() + Number(expiresInSeconds) * 1000 };

  return value;
}

// For tests.
export function clearGoogleAccessTokenCache() {
  cachedToken = null;
}
