// Firebase settings for server code.
//
// Values are read when a Firebase call is made, not when this module loads.
// On Cloudflare Workers, runtime secrets are only available once a request is
// being handled, and CI builds have no credentials at all.

export function getProjectId() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.');
  }

  return projectId;
}

// Local development uses the Firebase emulators and must not require or use
// production service-account credentials.
export function getFirestoreEmulatorHost() {
  return process.env.FIRESTORE_EMULATOR_HOST || null;
}

export function getAuthEmulatorHost() {
  return process.env.FIREBASE_AUTH_EMULATOR_HOST || null;
}

export function getServiceAccount() {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Hosting dashboards often store the key with literal "\n" sequences.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Fail clearly instead of silently falling back to another credential source.
  if (!clientEmail || !privateKey) {
    throw new Error('Incomplete Firebase Admin credentials.');
  }

  return { clientEmail, privateKey };
}
