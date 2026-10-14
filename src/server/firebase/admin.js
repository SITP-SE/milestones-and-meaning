// Server-side Firebase access with administrator privileges.
//
// This used to be the firebase-admin SDK. Its Firestore client cannot run on
// Cloudflare Workers (it generates code at runtime, which Workers forbid), so
// these objects now call the Firestore and Firebase Auth REST APIs with
// fetch(). They keep the same method names as firebase-admin for everything
// this app uses, so callers did not need to change.
//
// Credentials and emulator settings are read when a call is made:
// - Local development: FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST
//   point at the Firebase emulators and no service account is needed.
// - Production: FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY
//   (Cloudflare runtime secrets) authorize the requests.
// - CI builds make no Firebase calls, so they need no credentials.
//
// Scripts in /scripts run in Node and still use firebase-admin directly.

import {
  createSessionCookie,
  verifyIdToken,
  verifySessionCookie,
} from '@/server/firebase/auth-rest';
import { createFirestore, FieldValue, Timestamp } from '@/server/firebase/firestore-rest';

export const adminDb = createFirestore();

export const adminAuth = {
  verifyIdToken,
  createSessionCookie,
  verifySessionCookie,
};

export { FieldValue, Timestamp };
