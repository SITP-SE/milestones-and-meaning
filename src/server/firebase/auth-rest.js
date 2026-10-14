import { decodeJwt, decodeProtectedHeader, importX509, jwtVerify } from 'jose';

import { getAuthEmulatorHost, getProjectId } from '@/server/firebase/config';
import { getGoogleAccessToken } from '@/server/firebase/google-access-token';

// Firebase Auth server operations built on fetch() and `jose`, replacing
// firebase-admin/auth so the site can run on Cloudflare Workers. It mirrors
// the three firebase-admin methods this app uses:
//
//   verifyIdToken(idToken)
//   createSessionCookie(idToken, { expiresIn })
//   verifySessionCookie(sessionCookie, checkRevoked)
//
// The checks follow firebase-admin's token verifier:
// https://firebase.google.com/docs/auth/admin/verify-id-tokens
// https://firebase.google.com/docs/auth/admin/manage-cookies

// Same public-key endpoints firebase-admin uses (kid -> X.509 certificate).
export const ID_TOKEN_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
export const SESSION_COOKIE_CERTS_URL =
  'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys';

const IDENTITY_TOOLKIT_URL = 'https://identitytoolkit.googleapis.com/v1';

const ID_TOKEN_ISSUER_PREFIX = 'https://securetoken.google.com/';
const SESSION_COOKIE_ISSUER_PREFIX = 'https://session.firebase.google.com/';

const MIN_SESSION_DURATION_MS = 5 * 60 * 1000;
const MAX_SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

// Google rotates these keys and says how long to cache them (Cache-Control).
// Only fetched data is shared between requests, never an in-flight fetch,
// because Cloudflare Workers do not allow cross-request I/O.
const certificateCache = new Map();

async function getCertificates(url) {
  const cached = certificateCache.get(url);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.certificates;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch Firebase public keys (${response.status}).`);
  }

  const certificates = await response.json();
  const maxAge = /max-age=(\d+)/.exec(response.headers.get('cache-control') ?? '')?.[1];

  certificateCache.set(url, {
    certificates,
    expiresAt: Date.now() + (maxAge ? Number(maxAge) * 1000 : 60 * 60 * 1000),
  });

  return certificates;
}

function assertClaims(payload, issuer, audience) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];

  if (payload.iss !== issuer) throw new Error('Token has an incorrect issuer.');
  if (!audiences.includes(audience)) throw new Error('Token has an incorrect audience.');
  if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) {
    throw new Error('Token has expired.');
  }
}

async function verifyFirebaseJwt(token, { certificatesUrl, issuerPrefix, emulatorHost }) {
  if (typeof token !== 'string' || !token) {
    throw new Error('Token must be a non-empty string.');
  }

  const projectId = getProjectId();
  const issuer = `${issuerPrefix}${projectId}`;
  let payload;

  if (emulatorHost) {
    // The Auth emulator issues unsigned tokens. firebase-admin also skips
    // the signature check in emulator mode but still checks the claims.
    payload = decodeJwt(token);
    assertClaims(payload, issuer, projectId);
  } else {
    const { alg, kid } = decodeProtectedHeader(token);

    if (alg !== 'RS256' || typeof kid !== 'string') {
      throw new Error('Token has an invalid header.');
    }

    const certificates = await getCertificates(certificatesUrl);

    if (!Object.hasOwn(certificates, kid)) {
      throw new Error('Token was signed with an unknown key.');
    }

    const publicKey = await importX509(certificates[kid], 'RS256');

    // Checks the signature, issuer, audience, expiry, and not-before time.
    ({ payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
      issuer,
      audience: projectId,
    }));
  }

  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) {
    throw new Error('Token has an invalid subject.');
  }

  if (typeof payload.auth_time !== 'number') {
    throw new Error('Token has no auth_time.');
  }

  // firebase-admin exposes the user ID as `uid` as well as `sub`.
  return { ...payload, uid: payload.sub };
}

async function identityToolkit(path, body) {
  const emulatorHost = getAuthEmulatorHost();
  const baseUrl = emulatorHost
    ? `http://${emulatorHost}/identitytoolkit.googleapis.com/v1`
    : IDENTITY_TOOLKIT_URL;

  // The emulator accepts "owner" as an admin credential.
  const token = emulatorHost ? 'owner' : await getGoogleAccessToken();

  const response = await fetch(`${baseUrl}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => null);

    throw new Error(
      `Identity Toolkit request failed (${response.status}): ${details?.error?.message ?? response.statusText}`,
    );
  }

  return response.json();
}

export function verifyIdToken(idToken) {
  return verifyFirebaseJwt(idToken, {
    certificatesUrl: ID_TOKEN_CERTS_URL,
    issuerPrefix: ID_TOKEN_ISSUER_PREFIX,
    emulatorHost: getAuthEmulatorHost(),
  });
}

export async function createSessionCookie(idToken, { expiresIn } = {}) {
  if (
    !Number.isSafeInteger(expiresIn) ||
    expiresIn < MIN_SESSION_DURATION_MS ||
    expiresIn > MAX_SESSION_DURATION_MS
  ) {
    throw new Error('Session cookie duration must be between 5 minutes and 2 weeks.');
  }

  const { sessionCookie } = await identityToolkit(
    `projects/${getProjectId()}:createSessionCookie`,
    { idToken, validDuration: String(Math.floor(expiresIn / 1000)) },
  );

  if (typeof sessionCookie !== 'string' || !sessionCookie) {
    throw new Error('Firebase did not return a session cookie.');
  }

  return sessionCookie;
}

export async function verifySessionCookie(sessionCookie, checkRevoked = false) {
  const decoded = await verifyFirebaseJwt(sessionCookie, {
    certificatesUrl: SESSION_COOKIE_CERTS_URL,
    issuerPrefix: SESSION_COOKIE_ISSUER_PREFIX,
    emulatorHost: getAuthEmulatorHost(),
  });

  if (checkRevoked) {
    // Look the user up so disabled accounts and revoked sessions are rejected.
    const { users } = await identityToolkit(`projects/${getProjectId()}/accounts:lookup`, {
      localId: [decoded.uid],
    });

    const user = users?.[0];

    if (!user) throw new Error('User not found.');
    if (user.disabled) throw new Error('User account is disabled.');

    // validSince (seconds) moves forward when a user's sessions are revoked.
    if (user.validSince && decoded.auth_time < Number(user.validSince)) {
      throw new Error('Session has been revoked.');
    }
  }

  return decoded;
}

// For tests.
export function clearCertificateCache() {
  certificateCache.clear();
}
