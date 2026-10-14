import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

// Browser-side Firebase is only used for admin sign-in (Auth). Firestore is
// read and written on the server, and firestore.rules deny all client access,
// so the client Firestore SDK is not loaded here. Importing it also broke
// server rendering on Cloudflare Workers: its server build generates code at
// runtime, which Workers forbid.

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

if (
  process.env.NODE_ENV === 'development' &&
  typeof window !== 'undefined' &&
  !globalThis.__FIREBASE_EMULATORS_CONNECTED__
) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
    disableWarnings: true,
  });

  globalThis.__FIREBASE_EMULATORS_CONNECTED__ = true;
}

export { app };
