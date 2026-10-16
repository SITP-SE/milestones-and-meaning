import { getFirestoreEmulatorHost, getProjectId } from '@/server/firebase/config';
import { getGoogleAccessToken } from '@/server/firebase/google-access-token';

// A small Firestore client built on the Firestore REST API and fetch().
//
// It replaces firebase-admin/firestore, which cannot run on Cloudflare
// Workers (its gRPC/protobuf layer generates code with `new Function`, which
// Workers forbid). It mirrors only the part of the firebase-admin API this app
// uses:
//
//   db.collection('x').get()
//   db.collection('x').orderBy('field', 'desc').limit(50).get()
//   db.collection('x').doc('id').get() / .set(data) / .update(data) / .delete()
//   FieldValue.serverTimestamp()
//
// Reads return plain JavaScript values. Timestamps come back as `Timestamp`
// objects with toDate(), like firebase-admin.
//
// REST reference: https://firebase.google.com/docs/firestore/reference/rest

const FIRESTORE_API_URL = 'https://firestore.googleapis.com/v1';

// ---------------------------------------------------------------------------
// Timestamp and FieldValue
// ---------------------------------------------------------------------------

export class Timestamp {
  constructor(seconds, nanoseconds = 0) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  static fromDate(date) {
    const millis = date.getTime();
    const seconds = Math.floor(millis / 1000);

    return new Timestamp(seconds, (millis - seconds * 1000) * 1_000_000);
  }

  static now() {
    return Timestamp.fromDate(new Date());
  }

  toMillis() {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1_000_000);
  }

  toDate() {
    return new Date(this.toMillis());
  }

  isEqual(other) {
    return (
      other instanceof Timestamp &&
      other.seconds === this.seconds &&
      other.nanoseconds === this.nanoseconds
    );
  }
}

// Firestore returns RFC 3339 UTC timestamps with up to nine fractional digits.
function parseTimestamp(value) {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z$/.exec(value);

  if (!match) {
    throw new Error(`Unexpected Firestore timestamp: ${value}`);
  }

  const seconds = Date.parse(`${match[1]}Z`) / 1000;
  const nanoseconds = match[2] ? Number(match[2].padEnd(9, '0')) : 0;

  return new Timestamp(seconds, nanoseconds);
}

function formatTimestamp(timestamp) {
  const wholeSeconds = new Date(timestamp.seconds * 1000).toISOString().slice(0, 19);

  return `${wholeSeconds}.${String(timestamp.nanoseconds).padStart(9, '0')}Z`;
}

const SERVER_TIMESTAMP = Object.freeze({ firestoreSentinel: 'serverTimestamp' });

export const FieldValue = Object.freeze({
  serverTimestamp: () => SERVER_TIMESTAMP,
});

// ---------------------------------------------------------------------------
// Value encoding (JavaScript <-> Firestore REST "Value" JSON)
// ---------------------------------------------------------------------------

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function bytesToBase64(bytes) {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export function encodeValue(value) {
  if (value === SERVER_TIMESTAMP) {
    throw new Error('FieldValue.serverTimestamp() is only supported on top-level fields.');
  }

  if (value === null) return { nullValue: null };

  if (value === undefined) {
    // firebase-admin rejects undefined too, rather than silently dropping it.
    throw new Error('Cannot use "undefined" as a Firestore value.');
  }

  switch (typeof value) {
    case 'boolean':
      return { booleanValue: value };
    case 'string':
      return { stringValue: value };
    case 'bigint':
      return { integerValue: value.toString() };
    case 'number':
      if (Number.isSafeInteger(value) && !Object.is(value, -0)) {
        return { integerValue: String(value) };
      }

      // JSON has no NaN/Infinity, so the REST API takes them as strings.
      return { doubleValue: Number.isFinite(value) ? value : String(value) };
    default:
      break;
  }

  if (value instanceof Timestamp) return { timestampValue: formatTimestamp(value) };
  if (value instanceof Date) return { timestampValue: formatTimestamp(Timestamp.fromDate(value)) };
  if (value instanceof Uint8Array) return { bytesValue: bytesToBase64(value) };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };

  if (isPlainObject(value)) {
    const fields = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      fields[key] = encodeValue(fieldValue);
    }

    return { mapValue: { fields } };
  }

  throw new Error('Unsupported Firestore value type.');
}

export function decodeValue(value) {
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  // firebase-admin also returns integers as JavaScript numbers by default.
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('stringValue' in value) return value.stringValue;
  if ('timestampValue' in value) return parseTimestamp(value.timestampValue);
  if ('bytesValue' in value) return base64ToBytes(value.bytesValue);
  // Returned as the full resource name, not a DocumentReference.
  if ('referenceValue' in value) return value.referenceValue;

  if ('geoPointValue' in value) {
    return {
      latitude: value.geoPointValue.latitude ?? 0,
      longitude: value.geoPointValue.longitude ?? 0,
    };
  }

  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields);

  throw new Error('Unsupported Firestore value in response.');
}

function decodeFields(fields = {}) {
  const result = {};

  for (const [key, value] of Object.entries(fields)) {
    result[key] = decodeValue(value);
  }

  return result;
}

// Field names that aren't simple identifiers must be backtick-quoted.
function quoteFieldName(name) {
  if (/^[A-Za-z_][A-Za-z_0-9]*$/.test(name)) return name;

  return `\`${name.replace(/[\\`]/g, '\\$&')}\``;
}

// orderBy() accepts dotted paths into nested maps, like firebase-admin.
function toFieldPath(path) {
  if (typeof path !== 'string' || !path) {
    throw new Error('Invalid Firestore field path.');
  }

  return path.split('.').map(quoteFieldName).join('.');
}

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------

class DocumentSnapshot {
  constructor(id, document, ref) {
    this.id = id;
    this.ref = ref;
    this.exists = Boolean(document);
    this.createTime = document?.createTime ? parseTimestamp(document.createTime) : undefined;
    this.updateTime = document?.updateTime ? parseTimestamp(document.updateTime) : undefined;
    this._document = document;
  }

  data() {
    return this._document ? decodeFields(this._document.fields) : undefined;
  }

  get(field) {
    return this.data()?.[field];
  }
}

function snapshotFromDocument(document, client, collectionId) {
  const id = document.name.slice(document.name.lastIndexOf('/') + 1);
  const ref = new DocumentReference(client, collectionId, id);

  return new DocumentSnapshot(id, document, ref);
}

class QuerySnapshot {
  constructor(docs) {
    this.docs = docs;
    this.size = docs.length;
    this.empty = docs.length === 0;
  }

  forEach(callback) {
    this.docs.forEach(callback);
  }
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

class FirestoreRestClient {
  get databaseName() {
    return `projects/${getProjectId()}/databases/(default)`;
  }

  get documentsName() {
    return `${this.databaseName}/documents`;
  }

  async request(path, { method = 'GET', body } = {}) {
    const emulatorHost = getFirestoreEmulatorHost();
    const baseUrl = emulatorHost ? `http://${emulatorHost}/v1` : FIRESTORE_API_URL;

    // The emulator accepts "owner" as an admin credential that bypasses
    // security rules, the same way firebase-admin talks to it.
    const token = emulatorHost ? 'owner' : await getGoogleAccessToken();

    const headers = { Authorization: `Bearer ${token}` };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${baseUrl}/${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const details = await response.json().catch(() => null);
      const reason = details?.error?.message ?? response.statusText;
      const error = new Error(`Firestore request failed (${response.status}): ${reason}`);

      error.status = response.status;
      error.code = details?.error?.status;

      throw error;
    }

    return response.json();
  }

  commit(writes) {
    return this.request(`${this.documentsName}:commit`, {
      method: 'POST',
      body: { writes },
    });
  }
}

function assertSegment(value, kind) {
  if (typeof value !== 'string' || !value || value.includes('/')) {
    throw new Error(`Invalid Firestore ${kind}.`);
  }
}

// Builds a Write for set() and update(). Server timestamps become field
// transforms that Firestore applies when it commits the write.
function buildWrite(name, data, { requireExists }) {
  if (!isPlainObject(data)) {
    throw new Error('Firestore document data must be a plain object.');
  }

  const fields = {};
  const transforms = [];

  for (const [key, value] of Object.entries(data)) {
    if (requireExists && key.includes('.')) {
      // firebase-admin would treat this as a nested path. Not needed yet.
      throw new Error(`Nested field paths are not supported in update(): ${key}`);
    }

    if (value === SERVER_TIMESTAMP) {
      transforms.push({ fieldPath: quoteFieldName(key), setToServerValue: 'REQUEST_TIME' });
    } else {
      fields[key] = encodeValue(value);
    }
  }

  const write = { update: { name, fields } };

  if (requireExists) {
    // update(): change only the given fields, and fail if the document is missing.
    write.updateMask = { fieldPaths: Object.keys(fields).map(quoteFieldName) };
    write.currentDocument = { exists: true };
  }

  if (transforms.length > 0) {
    write.updateTransforms = transforms;
  }

  return write;
}

class DocumentReference {
  constructor(client, collectionId, id) {
    this._client = client;
    this._collectionId = collectionId;
    this.id = id;
    this.path = `${collectionId}/${id}`;
  }

  get _name() {
    return `${this._client.documentsName}/${this.path}`;
  }

  async get() {
    const urlPath =
      `${this._client.documentsName}/` +
      `${encodeURIComponent(this._collectionId)}/${encodeURIComponent(this.id)}`;

    try {
      return snapshotFromDocument(
        await this._client.request(urlPath),
        this._client,
        this._collectionId,
      );
    } catch (error) {
      if (error.status === 404) {
        return new DocumentSnapshot(this.id, null, this);
      }

      throw error;
    }
  }

  async set(data) {
    await this._client.commit([buildWrite(this._name, data, { requireExists: false })]);
  }

  async update(data) {
    await this._client.commit([buildWrite(this._name, data, { requireExists: true })]);
  }

  async delete() {
    await this._client.commit([{ delete: this._name }]);
  }
}

class Query {
  constructor(client, collectionId, orders = [], limit = null, filter = null) {
    this._client = client;
    this._collectionId = collectionId;
    this._orders = orders;
    this._limit = limit;
    this._filter = filter;
  }

  where(fieldPath, operator, value) {
    if (operator !== '==' || this._filter) {
      throw new Error('Only one equality filter is supported.');
    }

    return new Query(this._client, this._collectionId, this._orders, this._limit, {
      fieldFilter: {
        field: { fieldPath: toFieldPath(fieldPath) },
        op: 'EQUAL',
        value: encodeValue(value),
      },
    });
  }

  orderBy(fieldPath, direction = 'asc') {
    if (direction !== 'asc' && direction !== 'desc') {
      throw new Error('orderBy() direction must be "asc" or "desc".');
    }

    const order = {
      field: { fieldPath: toFieldPath(fieldPath) },
      direction: direction === 'desc' ? 'DESCENDING' : 'ASCENDING',
    };

    return new Query(
      this._client,
      this._collectionId,
      [...this._orders, order],
      this._limit,
      this._filter,
    );
  }

  limit(count) {
    if (!Number.isSafeInteger(count) || count < 1) {
      throw new Error('limit() must be a positive integer.');
    }

    return new Query(this._client, this._collectionId, this._orders, count, this._filter);
  }

  async get() {
    const structuredQuery = { from: [{ collectionId: this._collectionId }] };
    if (this._filter) structuredQuery.where = this._filter;
    if (this._orders.length > 0) structuredQuery.orderBy = this._orders;
    if (this._limit !== null) structuredQuery.limit = this._limit;

    // runQuery returns every match in one response; entries without a
    // `document` only carry read metadata.
    const results = await this._client.request(`${this._client.documentsName}:runQuery`, {
      method: 'POST',
      body: { structuredQuery },
    });

    return new QuerySnapshot(
      results
        .filter((result) => result.document)
        .map((result) => snapshotFromDocument(result.document, this._client, this._collectionId)),
    );
  }
}

class CollectionReference extends Query {
  constructor(client, collectionId) {
    super(client, collectionId);
    this.id = collectionId;
  }

  doc(id) {
    assertSegment(id, 'document ID');

    return new DocumentReference(this._client, this._collectionId, id);
  }
}

export function createFirestore() {
  const client = new FirestoreRestClient();

  return {
    collection(collectionId) {
      assertSegment(collectionId, 'collection ID');

      return new CollectionReference(client, collectionId);
    },
  };
}
