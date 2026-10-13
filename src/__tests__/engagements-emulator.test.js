/** @jest-environment node */

import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';

import { getAdminSession } from '@/server/auth/session';
import { getAdminEngagements } from '@/server/engagements/get-admin-engagements';
import { updateEngagementStatus } from '@/server/engagements/update-engagement-status';
import { adminDb } from '@/server/firebase/admin';

jest.mock('@/server/auth/session', () => ({
  getAdminSession: jest.fn(),
}));

// Never run database integration tests against production.
const isLocalEmulator =
  ['127.0.0.1:8080', 'localhost:8080'].includes(
    process.env.FIRESTORE_EMULATOR_HOST,
  ) &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ===
    'milestones-and-meaning';

const describeWithEmulator = isLocalEmulator ? describe : describe.skip;

describeWithEmulator('service engagement Firestore integration', () => {
  let engagementRef;

  beforeAll(async () => {
    engagementRef = adminDb
      .collection('serviceEngagements')
      .doc(`test_${randomUUID()}`);

    await engagementRef.set({
      clientName: 'Test Client',
      clientEmail: 'test@example.com',
      clientPhone: null,
      serviceId: 'strong_start',
      status: 'pending',
      source: 'stripe',
      paymentId: 'test-payment',
      giftId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  beforeEach(() => {
    getAdminSession.mockResolvedValue({
      uid: 'admin-1',
      admin: true,
    });
  });

  afterAll(async () => {
    if (engagementRef) {
      await engagementRef.delete();
    }
  });

  test('retrieves an engagement from Firestore', async () => {
    const engagements = await getAdminEngagements();

    const engagement = engagements.find(
      (item) => item.id === engagementRef.id,
    );

    expect(engagement).toEqual(
      expect.objectContaining({
        clientName: 'Test Client',
        serviceId: 'strong_start',
        status: 'pending',
        paymentId: 'test-payment',
      }),
    );

    expect(engagement.createdAt).toEqual(
      expect.any(String),
    );
  });

  test('updates only the engagement status', async () => {
    await updateEngagementStatus(engagementRef.id, 'active');

    const snapshot = await engagementRef.get();
    const data = snapshot.data();

    expect(data.status).toBe('active');
    expect(data.clientName).toBe('Test Client');
    expect(data.paymentId).toBe('test-payment');
    expect(data.updatedAt).toBeDefined();
  });

  test('rejects unauthorized status updates', async () => {
    getAdminSession.mockResolvedValue(null);

    await expect(
      updateEngagementStatus(engagementRef.id, 'completed'),
    ).rejects.toThrow('Unauthorized');

    const snapshot = await engagementRef.get();

    expect(snapshot.data().status).toBe('active');
  });
});
