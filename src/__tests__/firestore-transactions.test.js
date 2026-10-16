/** @jest-environment node */

import { adminDb, FieldValue } from '@/server/firebase/admin';
import { getGoogleAccessToken } from '@/server/firebase/google-access-token';

// Prevent unit tests from contacting Google Cloud.
jest.mock('@/server/firebase/google-access-token', () => ({
  getGoogleAccessToken: jest.fn(),
}));

const DATABASE = 'projects/test-project/databases/(default)';
const DOCUMENTS = `${DATABASE}/documents`;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Find a particular Firestore REST request in the mocked HTTP calls.
function findRequest(suffix) {
  return global.fetch.mock.calls.find(([url]) => url.endsWith(suffix));
}

describe('Firestore REST transactions', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  let paymentRef;
  let engagementRef;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
    };

    delete process.env.FIRESTORE_EMULATOR_HOST;

    getGoogleAccessToken.mockResolvedValue('test-access-token');

    paymentRef = adminDb.collection('payments').doc('cs_test_123');

    engagementRef = adminDb.collection('serviceEngagements').doc('stripe_cs_test_123');

    // Mock Firestore REST endpoints.
    // Transaction reads now use POST :batchGet, not document GET.
    global.fetch = jest.fn(async (url) => {
      if (url.endsWith(':beginTransaction')) {
        return jsonResponse({
          transaction: 'transaction-123',
        });
      }

      if (url.endsWith(':batchGet')) {
        // Simulate a payment document that doesn't exist yet.
        return jsonResponse([
          {
            missing: `${DOCUMENTS}/payments/cs_test_123`,
          },
        ]);
      }

      // Commit and rollback both succeed by default.
      return jsonResponse({});
    });
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  test('exposes transaction support on adminDb', () => {
    expect(adminDb.runTransaction).toEqual(expect.any(Function));
  });

  test('atomically creates payment and engagement records', async () => {
    const result = await adminDb.runTransaction(async (transaction) => {
      const existing = await transaction.get(paymentRef);

      expect(existing.exists).toBe(false);

      // Queue the payment and engagement in the same transaction.
      transaction.create(paymentRef, {
        status: 'paid',
        amountCents: 99500,
        createdAt: FieldValue.serverTimestamp(),
      });

      transaction.create(engagementRef, {
        status: 'pending',
        paymentId: paymentRef.id,
      });

      return { created: true };
    });

    expect(result).toEqual({ created: true });

    const [, options] = findRequest(`${DOCUMENTS}:commit`);
    const body = JSON.parse(options.body);

    // Both writes must be submitted in the same commit request.
    expect(body.transaction).toBe('transaction-123');
    expect(body.writes).toHaveLength(2);

    // Creating an existing payment must fail to prevent duplicates.
    expect(body.writes[0].currentDocument).toEqual({
      exists: false,
    });

    expect(body.writes[0].update.fields).toEqual({
      status: { stringValue: 'paid' },
      amountCents: { integerValue: '99500' },
    });

    expect(body.writes[0].updateTransforms).toEqual([
      {
        fieldPath: 'createdAt',
        setToServerValue: 'REQUEST_TIME',
      },
    ]);

    expect(body.writes[1].update.name).toBe(`${DOCUMENTS}/serviceEngagements/stripe_cs_test_123`);
  });

  test('uses batchGet with the transaction ID in the request body', async () => {
    await adminDb.runTransaction(async (transaction) => {
      await transaction.get(paymentRef);
    });

    const [, options] = findRequest(`${DOCUMENTS}:batchGet`);

    expect(options.method).toBe('POST');

    expect(JSON.parse(options.body)).toEqual({
      documents: [`${DOCUMENTS}/payments/cs_test_123`],
      transaction: 'transaction-123',
    });

    // This specifically prevents regression to the emulator's
    // problematic GET request with a transaction query parameter.
    expect(global.fetch.mock.calls.some(([url]) => url.includes('?transaction='))).toBe(false);
  });

  test('reads existing payment data and updates selected fields', async () => {
    global.fetch.mockImplementation(async (url) => {
      if (url.endsWith(':beginTransaction')) {
        return jsonResponse({
          transaction: 'transaction-123',
        });
      }

      if (url.endsWith(':batchGet')) {
        // Simulate an existing payment returned by Firestore.
        return jsonResponse([
          {
            found: {
              name: `${DOCUMENTS}/payments/cs_test_123`,
              fields: {
                amountCents: { integerValue: '99500' },
                status: { stringValue: 'paid' },
              },
            },
          },
        ]);
      }

      return jsonResponse({});
    });

    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(paymentRef);

      expect(snapshot.exists).toBe(true);
      expect(snapshot.data().amountCents).toBe(99500);

      transaction.update(paymentRef, {
        status: 'partially_refunded',
        refundAmountCents: 25000,
      });
    });

    const [, options] = findRequest(`${DOCUMENTS}:commit`);
    const body = JSON.parse(options.body);

    expect(body.writes[0].currentDocument).toEqual({
      exists: true,
    });

    // Only these fields may change. Other payment data is preserved.
    expect(body.writes[0].updateMask.fieldPaths).toEqual(['status', 'refundAmountCents']);
  });

  test('rolls back when payment processing fails', async () => {
    await expect(
      adminDb.runTransaction(async () => {
        throw new Error('Payment validation failed');
      }),
    ).rejects.toThrow('Payment validation failed');

    expect(findRequest(`${DOCUMENTS}:rollback`)).toBeDefined();

    // Failed transactions must never commit writes.
    expect(findRequest(`${DOCUMENTS}:commit`)).toBeUndefined();
  });

  test('retries a Firestore transaction conflict', async () => {
    let commitAttempts = 0;
    let callbackAttempts = 0;

    global.fetch.mockImplementation(async (url) => {
      if (url.endsWith(':beginTransaction')) {
        return jsonResponse({
          transaction: 'transaction-123',
        });
      }

      if (url.endsWith(':commit')) {
        commitAttempts += 1;

        // Simulate a concurrent transaction conflict.
        if (commitAttempts === 1) {
          return jsonResponse(
            {
              error: {
                status: 'ABORTED',
                message: 'Transaction conflict',
              },
            },
            409,
          );
        }
      }

      return jsonResponse({});
    });

    await adminDb.runTransaction(async (transaction) => {
      callbackAttempts += 1;

      transaction.create(paymentRef, {
        status: 'paid',
      });
    });

    // Firestore should be retried after an ABORTED conflict.
    expect(commitAttempts).toBe(2);
    expect(callbackAttempts).toBe(2);
  });

  test('uses emulator credentials for local transactions', async () => {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

    await adminDb.runTransaction(async (transaction) => {
      transaction.create(paymentRef, {
        status: 'paid',
      });
    });

    const [url, options] = global.fetch.mock.calls[0];

    expect(url).toBe(`http://127.0.0.1:8080/v1/${DOCUMENTS}:beginTransaction`);

    expect(options.headers.Authorization).toBe('Bearer owner');

    // Emulator tests must not use production Google credentials.
    expect(getGoogleAccessToken).not.toHaveBeenCalled();
  });

  test('rejects reads after writes are queued', async () => {
    await expect(
      adminDb.runTransaction(async (transaction) => {
        transaction.create(paymentRef, {
          status: 'paid',
        });

        await transaction.get(engagementRef);
      }),
    ).rejects.toThrow('Transaction reads must occur before writes.');

    expect(findRequest(`${DOCUMENTS}:commit`)).toBeUndefined();
  });

  test('rejects malformed transactional reads', async () => {
    global.fetch.mockImplementation(async (url) => {
      if (url.endsWith(':beginTransaction')) {
        return jsonResponse({
          transaction: 'transaction-123',
        });
      }

      if (url.endsWith(':batchGet')) {
        // Simulate an unexpected or malformed Firestore response.
        return jsonResponse([]);
      }

      return jsonResponse({});
    });

    await expect(
      adminDb.runTransaction(async (transaction) => {
        await transaction.get(paymentRef);
      }),
    ).rejects.toThrow('Invalid Firestore transaction read response.');

    // Invalid database data must not cause payment creation.
    expect(findRequest(`${DOCUMENTS}:commit`)).toBeUndefined();
    expect(findRequest(`${DOCUMENTS}:rollback`)).toBeDefined();
  });
});
