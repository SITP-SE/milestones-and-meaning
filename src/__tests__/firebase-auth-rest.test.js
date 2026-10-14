/** @jest-environment node */

import { generateKeyPair, importPKCS8, importX509, jwtVerify, SignJWT, UnsecuredJWT } from 'jose';

import {
  clearCertificateCache,
  createSessionCookie,
  ID_TOKEN_CERTS_URL,
  SESSION_COOKIE_CERTS_URL,
  verifyIdToken,
  verifySessionCookie,
} from '@/server/firebase/auth-rest';
import {
  clearGoogleAccessTokenCache,
  getGoogleAccessToken,
  GOOGLE_TOKEN_URL,
} from '@/server/firebase/google-access-token';

// Test-only RSA key and self-signed certificate. Not used anywhere else.
const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5Opcd46ZgNDvP
SL+NTxnxxbPOBb2Nr0zYz9t0TuQDSIICy4c5GMtDsV/O1b4QW9I/V4YBoGz98Ten
PY29gBeXC0/wIjAtOKrueba+fG5MIromaJ2Ye4B+Q+gwM8jTdTtME15ZFf+kXa6e
PuZphhtrAoy6QCqG8IKnyawU+EJ+JiFXqBM2dZX5dv2j0EfH8pXDpcs2YAc7RtgY
7DuwF6bzysPojsucfzzREMS75FUKF+xKSwTXzNcI4EWEDkHopmEhRMpFX3FK3qCT
45un6LDL0dxVMGgQDmogGsdXS5s6fcy9RIVwHPWsO1Q3w5Y4zbn9EfS5BENyk6rU
9Ra0XxRHAgMBAAECggEAH2NDz09P1raTOgVwXEA+u78OQIetftBpW8YhQHzL25iS
W2nk0LKYYzCv9Qs4SWpd3tj0ftsSDRgun5rpJWcK2FAU7DLG6irToFSkuHO6dxFd
bPvGVNv8wqi8NEraKacQdMxFbSAysUYkvHEZN2F/zOriMP+FlVc1NLySef01u01t
4K7FdL6VLEYOXbrk+yV8vUe7LC08Bdqb/wur73jcjg5fF1hzIEosIKGz2RL/ft9r
pdEuuhDVPA+Jsj3LFGcTRAzpvy52B3aFSwRkBjCvBvHgp6vE61YXsf+G3whoe6wt
Sdjqxc3x4Ph6iceSCbFQuhGkTQw4gCOoLuPg0/r3uQKBgQDnq6KEIJmskVEwRsFc
5Fhv+FghBjdPxi3+ZOaIiPAxGtuhEFuvQdQrnLLxFyZRXdRA5FNGD7MxRvFtwVX8
/Df4KTWCubOArndNPgMBe/YrZ2J4g1L9HmNVEYB6TRzGB1Bpj3QA+TYMaiEBKV8G
xeUXMA38WHa5nJqSEQJnig2/3wKBgQDMrmSBZHDxSEMQIzREkg7EvZac4L+P3TrU
/E7vcPJ2yGtYsx7BvoJwyu6mLecu1w/HoY9mpkVBF+6v4ulih2RypdSSVZ9Nf9GE
vutgv4fbKh3dkN9gA94GkSaM1XUYBlaR8EvmCXWVx1VEbItz4nKORql758veczpK
drNVUyWYmQKBgQCnyWYNvbKvChw8E7KtvW/TwJDLcj4TF9xt19QjZNJZLjONRlSw
7MNmxrnO5M5KteMpEHTDVFGayd/HdvP5Iw7CO85WnHpGI5WiKtxwccBLlTf7QlmT
mzOkA+YCLeE+B0QU/+GrZtLfUOoQdk8tj5wpHBO1BLkQGzzTt1//bzwgDwKBgDW3
AptOb7FyhF8Ezh+8sPGCy7bp6Hvp1Bm3CUQfQRJZMIq7nzO7OmI9b3nfDA+n0vVR
+d83fW9Cx5oTE6qO25aW3H12yPK+u455yC3AtfeXSvUtouGAwlC44QQOtMcUSr3L
8S8yhlBDWqY1UjecUvHxq2LgBwme9co68n9O7cvpAoGBAIn536suQht1O0HW7YEw
v7mTRGs1ZmcALNgu9ANXwWBaGVtbPuZXDJVekuNJ3DQ5aAMEZYrhp69jN2uu00kI
a+8Q6/fJh1iJaFlOLsUdd/n9RogYo4UrEzhWXGq5L/9/rhXzwEkfBrhM33B5ieTa
l2JgySRgbjqapWfzZCg9W8Yf
-----END PRIVATE KEY-----`;
const TEST_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIDLzCCAhegAwIBAgIUN0GvKYEI1h5IppBIHXbRVUDwWrwwDQYJKoZIhvcNAQEL
BQAwJjEkMCIGA1UEAwwbbWlsZXN0b25lcy1hbmQtbWVhbmluZy10ZXN0MCAXDTI2
MTAxNDIwMDAwNFoYDzIxMjYwOTIwMjAwMDA0WjAmMSQwIgYDVQQDDBttaWxlc3Rv
bmVzLWFuZC1tZWFuaW5nLXRlc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK
AoIBAQC5Opcd46ZgNDvPSL+NTxnxxbPOBb2Nr0zYz9t0TuQDSIICy4c5GMtDsV/O
1b4QW9I/V4YBoGz98TenPY29gBeXC0/wIjAtOKrueba+fG5MIromaJ2Ye4B+Q+gw
M8jTdTtME15ZFf+kXa6ePuZphhtrAoy6QCqG8IKnyawU+EJ+JiFXqBM2dZX5dv2j
0EfH8pXDpcs2YAc7RtgY7DuwF6bzysPojsucfzzREMS75FUKF+xKSwTXzNcI4EWE
DkHopmEhRMpFX3FK3qCT45un6LDL0dxVMGgQDmogGsdXS5s6fcy9RIVwHPWsO1Q3
w5Y4zbn9EfS5BENyk6rU9Ra0XxRHAgMBAAGjUzBRMB0GA1UdDgQWBBRUXE46gcQA
3/FrA2tjygd+fLeOXDAfBgNVHSMEGDAWgBRUXE46gcQA3/FrA2tjygd+fLeOXDAP
BgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQBIYaGmSMz7FdPNAq5o
k3PnKgu0WCeQ9PUwYzZN1iods+uWJrey2Bwb0rmgFP7DFcL9Q93e6bvx2TFmLGax
wfPmOmmYROcPrUubGQsKKl34G/rZ65B22AAe/GxZGutG1VrS7tnFa6gweq8Puzw5
JnD1BZiZcgbIdNJVal6+w4kqhCVa7aIA3fyrNIDAaG+uHfnB0QNeK2AEu/fWI6Jq
j77dM3urtY0ttwnqn/nU2NzOkZbZUlCfo4syrTK2OIvlBv/Twq7mK6MqCrvUhG1Z
3NifL1Z6IGcTg/Myk9wspPtL/iPIzWtumZ9PGbUTtpX/OCt0Cp0wqr9nLW/DJeDO
HX2+
-----END CERTIFICATE-----`;

const PROJECT_ID = 'test-project';
const CLIENT_EMAIL = 'server@test-project.iam.gserviceaccount.com';
const ID_TOKEN_ISSUER = `https://securetoken.google.com/${PROJECT_ID}`;
const SESSION_ISSUER = `https://session.firebase.google.com/${PROJECT_ID}`;

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

async function signFirebaseToken(
  claims = {},
  { issuer = ID_TOKEN_ISSUER, audience = PROJECT_ID, kid = 'test-key', key, expiresIn = 3600 } = {},
) {
  const signingKey = key ?? (await importPKCS8(TEST_PRIVATE_KEY, 'RS256'));
  const now = nowSeconds();

  return new SignJWT({ auth_time: now - 10, admin: true, ...claims })
    .setProtectedHeader({ alg: 'RS256', kid, typ: 'JWT' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject('admin-user')
    .setIssuedAt(now - 10)
    .setExpirationTime(now + expiresIn)
    .sign(signingKey);
}

describe('Firebase Auth REST helpers', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  let lookupUser;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: PROJECT_ID,
      FIREBASE_ADMIN_CLIENT_EMAIL: CLIENT_EMAIL,
      // Stored the way hosting dashboards usually keep it, with literal "\n".
      FIREBASE_ADMIN_PRIVATE_KEY: TEST_PRIVATE_KEY.replace(/\n/g, '\\n'),
    };
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

    clearCertificateCache();
    clearGoogleAccessTokenCache();

    lookupUser = {
      localId: 'admin-user',
      disabled: false,
      validSince: String(nowSeconds() - 3600),
    };

    global.fetch = jest.fn(async (url, init = {}) => {
      if (url === GOOGLE_TOKEN_URL) {
        return jsonResponse({ access_token: 'access-token', expires_in: 3600 });
      }

      if (url === ID_TOKEN_CERTS_URL || url === SESSION_COOKIE_CERTS_URL) {
        return jsonResponse(
          { 'test-key': TEST_CERTIFICATE },
          { headers: { 'Cache-Control': 'public, max-age=3600' } },
        );
      }

      if (url.endsWith(`/projects/${PROJECT_ID}:createSessionCookie`)) {
        return jsonResponse({ sessionCookie: 'session-cookie-value' });
      }

      if (url.endsWith(`/projects/${PROJECT_ID}/accounts:lookup`)) {
        return jsonResponse({ users: lookupUser ? [lookupUser] : undefined });
      }

      throw new Error(`Unexpected fetch: ${init.method ?? 'GET'} ${url}`);
    });
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  describe('getGoogleAccessToken', () => {
    test('exchanges a signed service-account assertion for an access token', async () => {
      await expect(getGoogleAccessToken()).resolves.toBe('access-token');

      const [url, init] = global.fetch.mock.calls[0];
      expect(url).toBe(GOOGLE_TOKEN_URL);
      expect(init.method).toBe('POST');

      const form = new URLSearchParams(init.body);
      expect(form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');

      const publicKey = await importX509(TEST_CERTIFICATE, 'RS256');
      const { payload } = await jwtVerify(form.get('assertion'), publicKey, {
        issuer: CLIENT_EMAIL,
        audience: GOOGLE_TOKEN_URL,
      });

      expect(payload.scope).toContain('https://www.googleapis.com/auth/datastore');
      expect(payload.scope).toContain('https://www.googleapis.com/auth/identitytoolkit');
    });

    test('reuses the token until it is close to expiring', async () => {
      await getGoogleAccessToken();
      await getGoogleAccessToken();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('fails clearly without credentials', async () => {
      delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;

      await expect(getGoogleAccessToken()).rejects.toThrow(
        'Incomplete Firebase Admin credentials.',
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('fails when Google rejects the assertion', async () => {
      global.fetch.mockResolvedValueOnce(jsonResponse({ error: 'invalid_grant' }, { status: 400 }));

      await expect(getGoogleAccessToken()).rejects.toThrow('status 400');
    });
  });

  describe('verifyIdToken', () => {
    test('accepts a valid Firebase ID token', async () => {
      const decoded = await verifyIdToken(await signFirebaseToken());

      expect(decoded).toEqual(
        expect.objectContaining({ uid: 'admin-user', sub: 'admin-user', admin: true }),
      );
    });

    test.each([
      ['a different project', { options: { audience: 'other-project' } }],
      ['a different issuer', { options: { issuer: 'https://securetoken.google.com/other' } }],
      ['a session cookie issuer', { options: { issuer: SESSION_ISSUER } }],
      ['an expired token', { options: { expiresIn: -60 } }],
      ['an unknown key ID', { options: { kid: 'other-key' } }],
    ])('rejects a token with %s', async (_label, { claims = {}, options = {} }) => {
      const token = await signFirebaseToken(claims, options);

      await expect(verifyIdToken(token)).rejects.toThrow();
    });

    test('rejects a token signed by a different key', async () => {
      const { privateKey } = await generateKeyPair('RS256');

      await expect(
        verifyIdToken(await signFirebaseToken({}, { key: privateKey })),
      ).rejects.toThrow();
    });

    test('rejects unsigned tokens outside the emulator', async () => {
      const token = new UnsecuredJWT({ auth_time: nowSeconds(), admin: true })
        .setIssuer(ID_TOKEN_ISSUER)
        .setAudience(PROJECT_ID)
        .setSubject('admin-user')
        .setExpirationTime('1h')
        .encode();

      await expect(verifyIdToken(token)).rejects.toThrow('invalid header');
    });

    test('accepts unsigned emulator tokens but still checks claims', async () => {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

      const unsigned = (audience) =>
        new UnsecuredJWT({ auth_time: nowSeconds(), admin: true })
          .setIssuer(ID_TOKEN_ISSUER)
          .setAudience(audience)
          .setSubject('admin-user')
          .setExpirationTime('1h')
          .encode();

      await expect(verifyIdToken(unsigned(PROJECT_ID))).resolves.toMatchObject({
        uid: 'admin-user',
      });
      await expect(verifyIdToken(unsigned('other-project'))).rejects.toThrow('audience');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('createSessionCookie', () => {
    test('exchanges an ID token for a session cookie', async () => {
      const cookie = await createSessionCookie('id-token', { expiresIn: 5 * 24 * 60 * 60 * 1000 });

      expect(cookie).toBe('session-cookie-value');

      const [url, init] = global.fetch.mock.calls.at(-1);
      expect(url).toBe(
        `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}:createSessionCookie`,
      );
      expect(init.headers.Authorization).toBe('Bearer access-token');
      expect(JSON.parse(init.body)).toEqual({ idToken: 'id-token', validDuration: '432000' });
    });

    test('rejects durations Firebase does not allow', async () => {
      await expect(createSessionCookie('id-token', { expiresIn: 1000 })).rejects.toThrow(
        'between 5 minutes and 2 weeks',
      );
    });

    test('uses the Auth emulator when configured', async () => {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

      await createSessionCookie('id-token', { expiresIn: 60 * 60 * 1000 });

      const [url, init] = global.fetch.mock.calls.at(-1);
      expect(url).toBe(
        `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}:createSessionCookie`,
      );
      expect(init.headers.Authorization).toBe('Bearer owner');
    });
  });

  describe('verifySessionCookie', () => {
    test('accepts a valid session cookie', async () => {
      const cookie = await signFirebaseToken({}, { issuer: SESSION_ISSUER });

      await expect(verifySessionCookie(cookie)).resolves.toMatchObject({ uid: 'admin-user' });
    });

    test('rejects an ID token presented as a session cookie', async () => {
      await expect(verifySessionCookie(await signFirebaseToken())).rejects.toThrow();
    });

    test('checks for revoked sessions and disabled users when asked', async () => {
      const cookie = await signFirebaseToken({}, { issuer: SESSION_ISSUER });

      await expect(verifySessionCookie(cookie, true)).resolves.toMatchObject({ uid: 'admin-user' });

      const [url, init] = global.fetch.mock.calls.at(-1);
      expect(url).toBe(
        `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`,
      );
      expect(JSON.parse(init.body)).toEqual({ localId: ['admin-user'] });

      lookupUser = { ...lookupUser, disabled: true };
      await expect(verifySessionCookie(cookie, true)).rejects.toThrow('disabled');

      lookupUser = { localId: 'admin-user', validSince: String(nowSeconds() + 60) };
      await expect(verifySessionCookie(cookie, true)).rejects.toThrow('revoked');

      lookupUser = null;
      await expect(verifySessionCookie(cookie, true)).rejects.toThrow('not found');
    });
  });
});
