import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// This script must only ever talk to the local Firebase emulator.
// Setting the host here prevents accidentally creating development
// users in the real Firebase Authentication project.
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

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

await seedAuth();

console.log('Firebase emulator seed complete.');
