import { getFirestoreEmulatorHost, getProjectId } from '@/server/firebase/config';
import { decodeValue, encodeValue, FieldValue } from '@/server/firebase/firestore-rest';
import { getGoogleAccessToken } from '@/server/firebase/google-access-token';

const FIRESTORE_API_URL = 'https://firestore.googleapis.com/v1';
const MAX_TRANSACTION_ATTEMPTS = 3;

function getDocumentName(databaseName, ref) {
  // The current adapter supports root-level collection documents.
  if (typeof ref?.path !== 'string' || !/^[^/]+\/[^/]+$/.test(ref.path)) {
    throw new Error('Invalid transaction document reference.');
  }

  const path = ref.path.split('/').map(encodeURIComponent).join('/');

  return `${databaseName}/documents/${path}`;
}

function decodeDocument(document) {
  return Object.fromEntries(
    Object.entries(document.fields ?? {}).map(([name, value]) => [name, decodeValue(value)]),
  );
}

function buildTransactionWrite(databaseName, ref, data, operation) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid transaction document data.');
  }

  const name = getDocumentName(databaseName, ref);
  const fields = {};
  const transforms = [];

  for (const [key, value] of Object.entries(data)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new Error('Invalid transaction field name.');
    }

    // Firestore applies server timestamps as write transforms.
    if (value === FieldValue.serverTimestamp()) {
      transforms.push({
        fieldPath: key,
        setToServerValue: 'REQUEST_TIME',
      });
    } else {
      fields[key] = encodeValue(value);
    }
  }

  const write = {
    update: { name, fields },

    // create() requires a missing document.
    // update() requires an existing document.
    currentDocument: {
      exists: operation === 'update',
    },
  };

  if (operation === 'update') {
    // Preserve all database fields not included in this update.
    write.updateMask = {
      fieldPaths: Object.keys(fields),
    };
  }

  if (transforms.length > 0) {
    write.updateTransforms = transforms;
  }

  return write;
}

export async function runFirestoreTransaction(callback) {
  if (typeof callback !== 'function') {
    throw new Error('A transaction callback is required.');
  }

  const databaseName = `projects/${getProjectId()}/databases/(default)`;
  const emulatorHost = getFirestoreEmulatorHost();

  const apiUrl = emulatorHost ? `http://${emulatorHost}/v1` : FIRESTORE_API_URL;

  // The local emulator accepts "owner" as an administrator credential.
  // Production uses our existing Google OAuth implementation.
  const accessToken = emulatorHost ? 'owner' : await getGoogleAccessToken();

  async function request(path, { method = 'POST', body } = {}) {
    const response = await fetch(`${apiUrl}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const details = await response.json().catch(() => null);

      const error = new Error(
        `Firestore transaction failed (${response.status}): ${
          details?.error?.message ?? response.statusText
        }`,
      );

      error.status = response.status;
      error.code = details?.error?.status;

      throw error;
    }

    return response.json();
  }

  // Retry transactions only when Firestore reports a retryable conflict.
  // The callback must not perform irreversible external operations.
  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    const started = await request(`${databaseName}/documents:beginTransaction`, {
      body: {
        options: { readWrite: {} },
      },
    });

    const transactionId = started.transaction;

    if (typeof transactionId !== 'string' || !transactionId) {
      throw new Error('Firestore did not return a transaction ID.');
    }

    const writes = [];

    const transaction = {
      async get(ref) {
        // Transactional reads must happen before any writes.
        if (writes.length > 0) {
          throw new Error('Transaction reads must occur before writes.');
        }

        const name = getDocumentName(databaseName, ref);

        // IMPORTANT:
        // Use batchGet instead of GET with ?transaction=...
        //
        // The Firestore emulator has a known REST bug involving
        // BYTE_STRING transaction parameters in GET requests.
        //
        // batchGet accepts the transaction ID in the JSON body.
        // This remains a real Firestore transactional read.
        const response = await request(`${databaseName}/documents:batchGet`, {
          body: {
            documents: [name],
            transaction: transactionId,
          },
        });

        // batchGet returns an array of document results.
        // Accept a single object as well for defensive compatibility.
        const results = Array.isArray(response) ? response : [response];

        const result = results.find(
          (entry) => entry?.found?.name === name || entry?.missing === name,
        );

        // A malformed response must never be treated as a missing
        // payment record, because that could create duplicates.
        if (!result) {
          throw new Error('Invalid Firestore transaction read response.');
        }

        if (result.missing === name) {
          return {
            id: ref.id,
            ref,
            exists: false,
            data: () => undefined,
          };
        }

        const data = decodeDocument(result.found);

        return {
          id: ref.id,
          ref,
          exists: true,
          data: () => data,
        };
      },

      create(ref, data) {
        writes.push(buildTransactionWrite(databaseName, ref, data, 'create'));
      },

      update(ref, data) {
        writes.push(buildTransactionWrite(databaseName, ref, data, 'update'));
      },
    };

    try {
      const result = await callback(transaction);

      // Firestore commits every queued write atomically.
      // Either all documents are updated or none are.
      await request(`${databaseName}/documents:commit`, {
        body: {
          transaction: transactionId,
          writes,
        },
      });

      return result;
    } catch (error) {
      // Release the transaction after failed reads or writes.
      // Preserve the original error if rollback also fails.
      try {
        await request(`${databaseName}/documents:rollback`, {
          body: { transaction: transactionId },
        });
      } catch {
        // Firestore may have already aborted the transaction.
      }

      if (error.code === 'ABORTED' && attempt < MAX_TRANSACTION_ATTEMPTS - 1) {
        continue;
      }

      throw error;
    }
  }
}
