import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { pages } from '../seed-data/pages.js';

const EXPECTED_PROJECT_ID = 'milestones-and-meaning';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

const shouldWrite = process.argv.includes('--write');

// Never allow this production migration to accidentally target the emulator.
if (process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Refusing to run while FIRESTORE_EMULATOR_HOST is set.');
}

// Make sure we are targeting the correct Firebase project.
if (projectId !== EXPECTED_PROJECT_ID) {
  throw new Error(`Unexpected Firebase project: ${projectId ?? 'missing'}`);
}

if (!clientEmail || !privateKey) {
  throw new Error('Firebase Admin credentials are required.');
}

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        projectId,
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

const db = getFirestore(app);

function isSafeToPopulate(existingData) {
  if (!existingData || Object.keys(existingData).length === 0) {
    return true;
  }

  const keys = Object.keys(existingData);

  // Allow the empty documents that were manually created in Firestore.
  return (
    keys.length === 1 &&
    keys[0] === 'content' &&
    existingData.content &&
    typeof existingData.content === 'object' &&
    !Array.isArray(existingData.content) &&
    Object.keys(existingData.content).length === 0
  );
}

async function populatePages() {
  for (const [pageId, pageData] of Object.entries(pages)) {
    const documentRef = db.collection('pages').doc(pageId);
    const snapshot = await documentRef.get();

    // Do not overwrite real production content accidentally.
    if (snapshot.exists && !isSafeToPopulate(snapshot.data())) {
      throw new Error(
        `Refusing to overwrite pages/${pageId} because it already contains production data.`,
      );
    }

    if (!shouldWrite) {
      console.log(`[DRY RUN] Would populate pages/${pageId}`);
      continue;
    }

    await documentRef.set(pageData);

    console.log(`Populated pages/${pageId}`);
  }
}

await populatePages();

if (!shouldWrite) {
  console.log('');
  console.log('Dry run complete. No production data was changed.');
  console.log('Run again with --write when you are ready.');
} else {
  console.log('');
  console.log('Production page migration complete.');
}
