import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp } from 'firebase-admin/app';

// This script is intended for local development.
// It talks to the Firebase Auth emulator through this environment variable.
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.');
}

// Reuse an existing Admin app if this file is ever loaded more than once.
const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        projectId,
      });

const auth = getAuth(app);

const email = process.argv[2];

if (!email) {
  throw new Error('Usage: node scripts/set-admin-claim.mjs <email>');
}

// Look up the Firebase user first so we assign the claim to the correct UID.
const user = await auth.getUserByEmail(email);

// Custom claims are stored on the Firebase user token.
// Our server checks this exact claim before granting access to /admin.
await auth.setCustomUserClaims(user.uid, {
  ...user.customClaims,
  admin: true,
});

console.log(`Admin claim added to ${email}`);
