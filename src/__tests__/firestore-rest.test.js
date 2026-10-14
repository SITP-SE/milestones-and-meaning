/** @jest-environment node */

import { createFirestore, FieldValue, Timestamp } from '@/server/firebase/firestore-rest';
import { getGoogleAccessToken } from '@/server/firebase/google-access-token';

jest.mock('@/server/firebase/google-access-token', () => ({
  getGoogleAccessToken: jest.fn(),
}));

const DOCUMENTS = 'projects/test-project/databases/(default)/documents';
const API = 'https://firestore.googleapis.com/v1';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function lastRequest() {
  const [url, init] = global.fetch.mock.calls.at(-1);

  return { url, init, body: init.body ? JSON.parse(init.body) : undefined };
}

describe('Firestore REST client', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  let db;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env = { ...originalEnv, NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project' };
    delete process.env.FIRESTORE_EMULATOR_HOST;

    global.fetch = jest.fn();
    getGoogleAccessToken.mockResolvedValue('access-token');

    db = createFirestore();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  test('reads a document and decodes its fields', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        name: `${DOCUMENTS}/pages/funeral`,
        fields: {
          title: { stringValue: 'Funeral' },
          order: { integerValue: '3' },
          rating: { doubleValue: 4.5 },
          published: { booleanValue: true },
          image: { nullValue: null },
          tags: { arrayValue: { values: [{ stringValue: 'a' }, { stringValue: 'b' }] } },
          empty: { arrayValue: {} },
          content: {
            mapValue: {
              fields: { hero: { mapValue: { fields: { eyebrow: { stringValue: 'E' } } } } },
            },
          },
          createdAt: { timestampValue: '2026-10-14T19:41:27.123456789Z' },
        },
        createTime: '2026-10-14T19:41:27Z',
        updateTime: '2026-10-14T19:41:27.5Z',
      }),
    );

    const snapshot = await db.collection('pages').doc('funeral').get();

    const { url, init } = lastRequest();
    expect(url).toBe(`${API}/${DOCUMENTS}/pages/funeral`);
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer access-token');

    expect(snapshot.exists).toBe(true);
    expect(snapshot.id).toBe('funeral');

    const data = snapshot.data();
    expect(data).toEqual(
      expect.objectContaining({
        title: 'Funeral',
        order: 3,
        rating: 4.5,
        published: true,
        image: null,
        tags: ['a', 'b'],
        empty: [],
        content: { hero: { eyebrow: 'E' } },
      }),
    );

    expect(data.createdAt).toBeInstanceOf(Timestamp);
    expect(data.createdAt.nanoseconds).toBe(123456789);
    expect(data.createdAt.toDate().toISOString()).toBe('2026-10-14T19:41:27.123Z');
    expect(snapshot.updateTime.toMillis()).toBe(Date.parse('2026-10-14T19:41:27.500Z'));
  });

  test('returns a missing snapshot for a 404', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({ error: { code: 404, status: 'NOT_FOUND', message: 'not found' } }, 404),
    );

    const snapshot = await db.collection('pages').doc('nope').get();

    expect(snapshot.exists).toBe(false);
    expect(snapshot.data()).toBeUndefined();
  });

  test('throws on other errors', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(
        { error: { code: 403, status: 'PERMISSION_DENIED', message: 'Missing permissions' } },
        403,
      ),
    );

    await expect(db.collection('pages').doc('funeral').get()).rejects.toMatchObject({
      status: 403,
      code: 'PERMISSION_DENIED',
    });
  });

  test('reads a whole collection with runQuery', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse([
        { document: { name: `${DOCUMENTS}/services/a`, fields: { order: { integerValue: '1' } } } },
        { document: { name: `${DOCUMENTS}/services/b`, fields: {} } },
        { readTime: '2026-10-14T19:41:27Z' },
      ]),
    );

    const snapshot = await db.collection('services').get();

    const { url, init, body } = lastRequest();
    expect(url).toBe(`${API}/${DOCUMENTS}:runQuery`);
    expect(init.method).toBe('POST');
    expect(body).toEqual({ structuredQuery: { from: [{ collectionId: 'services' }] } });

    expect(snapshot.size).toBe(2);
    expect(snapshot.docs.map((doc) => doc.id)).toEqual(['a', 'b']);
    expect(snapshot.docs[0].data()).toEqual({ order: 1 });
    expect(snapshot.docs[1].data()).toEqual({});
  });

  test('sends orderBy and limit', async () => {
    global.fetch.mockResolvedValue(jsonResponse([{ readTime: '2026-10-14T19:41:27Z' }]));

    const snapshot = await db
      .collection('serviceEngagements')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    expect(lastRequest().body).toEqual({
      structuredQuery: {
        from: [{ collectionId: 'serviceEngagements' }],
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
        limit: 50,
      },
    });

    expect(snapshot.empty).toBe(true);
  });

  test('update() changes only the given fields and requires the document to exist', async () => {
    global.fetch.mockImplementation(async () => jsonResponse({ writeResults: [{}] }));

    await db.collection('serviceEngagements').doc('e1').update({
      status: 'active',
      priceCents: 59550,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const { url, body } = lastRequest();
    expect(url).toBe(`${API}/${DOCUMENTS}:commit`);
    expect(body).toEqual({
      writes: [
        {
          update: {
            name: `${DOCUMENTS}/serviceEngagements/e1`,
            fields: {
              status: { stringValue: 'active' },
              priceCents: { integerValue: '59550' },
            },
          },
          updateMask: { fieldPaths: ['status', 'priceCents'] },
          currentDocument: { exists: true },
          updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
        },
      ],
    });
  });

  test('update() rejects when the document does not exist', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(
        { error: { code: 404, status: 'NOT_FOUND', message: 'No document to update' } },
        404,
      ),
    );

    await expect(db.collection('services').doc('missing').update({ title: 'x' })).rejects.toThrow(
      'No document to update',
    );
  });

  test('set() replaces the document and delete() removes it', async () => {
    global.fetch.mockImplementation(async () => jsonResponse({ writeResults: [{}] }));

    const ref = db.collection('serviceEngagements').doc('e2');

    await ref.set({
      clientName: 'Test Client',
      clientPhone: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    expect(lastRequest().body).toEqual({
      writes: [
        {
          update: {
            name: `${DOCUMENTS}/serviceEngagements/e2`,
            fields: {
              clientName: { stringValue: 'Test Client' },
              clientPhone: { nullValue: null },
            },
          },
          updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
        },
      ],
    });

    await ref.delete();

    expect(lastRequest().body).toEqual({
      writes: [{ delete: `${DOCUMENTS}/serviceEngagements/e2` }],
    });
  });

  test('encodes dates, timestamps, doubles, and nested values', async () => {
    global.fetch.mockImplementation(async () => jsonResponse({ writeResults: [{}] }));

    await db
      .collection('things')
      .doc('t1')
      .set({
        at: new Date('2026-01-02T03:04:05.678Z'),
        exact: new Timestamp(1767323045, 5),
        ratio: 0.5,
        notANumber: NaN,
        nested: { list: [1, 'two', false] },
      });

    expect(lastRequest().body.writes[0].update.fields).toEqual({
      at: { timestampValue: '2026-01-02T03:04:05.678000000Z' },
      exact: { timestampValue: '2026-01-02T03:04:05.000000005Z' },
      ratio: { doubleValue: 0.5 },
      notANumber: { doubleValue: 'NaN' },
      nested: {
        mapValue: {
          fields: {
            list: {
              arrayValue: {
                values: [{ integerValue: '1' }, { stringValue: 'two' }, { booleanValue: false }],
              },
            },
          },
        },
      },
    });
  });

  test('rejects undefined values and invalid paths', async () => {
    await expect(db.collection('things').doc('t1').set({ value: undefined })).rejects.toThrow(
      'undefined',
    );

    expect(() => db.collection('things').doc('../admin')).toThrow('Invalid Firestore document ID.');
    expect(() => db.collection('a/b')).toThrow('Invalid Firestore collection ID.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('uses the emulator without credentials when FIRESTORE_EMULATOR_HOST is set', async () => {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    global.fetch.mockResolvedValue(
      jsonResponse({ name: `${DOCUMENTS}/pages/funeral`, fields: {} }),
    );

    await db.collection('pages').doc('funeral').get();

    const { url, init } = lastRequest();
    expect(url).toBe(`http://127.0.0.1:8080/v1/${DOCUMENTS}/pages/funeral`);
    expect(init.headers.Authorization).toBe('Bearer owner');
    expect(getGoogleAccessToken).not.toHaveBeenCalled();
  });
});
