// Server-side Firebase access with administrator privileges.
//
// This used to be the firebase-admin SDK. Its Firestore client cannot run on
// Cloudflare Workers (it generates code at runtime, which Workers forbid), so
// these objects now call the Firestore and Firebase Auth REST APIs with
// Server-side Firebase access with administrator privileges.
//
// The Firestore REST adapter runs on Cloudflare Workers without relying
// on the Node-only Firestore Admin SDK.
//
// Local emulators use FIRESTORE_EMULATOR_HOST.
// Production uses Firebase service-account credentials supplied through
// the hosting environment's secrets.

import {
  createSessionCookie,
  verifyIdToken,
  verifySessionCookie,
} from '@/server/firebase/auth-rest';

import { createFirestore, FieldValue, Timestamp } from '@/server/firebase/firestore-rest';

import { runFirestoreTransaction } from '@/server/firebase/firestore-transactions';

// Preserve all existing Firestore methods and add real transaction support.
// Payment and refund handlers can continue using adminDb.runTransaction().
export const adminDb = {
  ...createFirestore(),
  runTransaction: runFirestoreTransaction,
};

export const adminAuth = {
  verifyIdToken,
  createSessionCookie,
  verifySessionCookie,
};

export { FieldValue, Timestamp };
