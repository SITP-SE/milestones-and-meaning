import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { pages } from './seed-data/pages.js';

// This script must only ever talk to the local Firebase emulators.
// Setting the hosts here prevents development data from accidentally
// being written to the real Firebase project.
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const PROJECT_ID = 'milestones-and-meaning';

// These accounts exist only inside the local Auth emulator.
// Their purpose is to make authentication testing repeatable.
const users = [
  {
    email: 'admin@example.com',
    password: 'Admin123!',
    claims: {
      admin: true,
    },
  },
  {
    email: 'user@example.com',
    password: 'User123!',
    claims: {},
  },
];

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        projectId: PROJECT_ID,
      });

const auth = getAuth(app);
const db = getFirestore(app);

async function getOrCreateUser({ email, password }) {
  try {
    // Reuse the account if the emulator has already been seeded.
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }

    // A fresh emulator has no users, so create the account.
    return auth.createUser({
      email,
      password,
      emailVerified: true,
    });
  }
}

async function seedAuth() {
  for (const userDefinition of users) {
    const user = await getOrCreateUser(userDefinition);

    // Explicitly replace the custom claims so repeated runs always produce
    // the same authorization state.
    await auth.setCustomUserClaims(user.uid, userDefinition.claims);

    console.log(`Seeded ${userDefinition.email}`);
  }
}

async function seedPages() {
  for (const [pageId, pageData] of Object.entries(pages)) {
    // The Firestore document ID acts as the page ID, so it does not need
    // to be duplicated inside the document itself.
    await db.collection('pages').doc(pageId).set(pageData);

    console.log(`Seeded pages/${pageId}`);
  }
}

await seedAuth();
await seedPages();

console.log('Firebase emulator seed complete.');
