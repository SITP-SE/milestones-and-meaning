import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Next.js development can reload modules multiple times.
// Reuse the existing Firebase Admin app instead of initializing another one.
const adminApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

export { adminApp };
