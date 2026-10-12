import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

const usingEmulators =
  Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) || Boolean(process.env.FIRESTORE_EMULATOR_HOST);

function getAdminOptions() {
  // Local development should use the Firebase emulators and must not
  // require or use production service-account credentials.
  if (usingEmulators) {
    return { projectId };
  }

  const hasAnyCredential = Boolean(clientEmail || privateKey);
  const hasCompleteCredential = Boolean(clientEmail && privateKey);

  // If production credentials were partially configured, fail clearly
  // instead of silently falling back to an unexpected credential source.
  if (hasAnyCredential && !hasCompleteCredential) {
    throw new Error('Incomplete Firebase Admin credentials.');
  }

  // Vercel supplies these values as server-only environment variables.
  if (hasCompleteCredential) {
    return {
      projectId,
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    };
  }

  // CI only needs to build the application, so Firebase Admin can
  // initialize without production credentials when no API call is made.
  return { projectId };
}

// Next.js development can reload modules multiple times.
// Reuse the existing Firebase Admin app instead of initializing another one.
const adminApp = getApps().length > 0 ? getApp() : initializeApp(getAdminOptions());

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

export { adminApp };
