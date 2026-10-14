import { getAdminSession } from '@/server/auth/session';
import { adminDb, FieldValue } from '@/server/firebase/admin';
import { updateEngagementStatus } from '@/server/engagements/update-engagement-status';

jest.mock('@/server/auth/session', () => ({
  getAdminSession: jest.fn(),
}));

jest.mock('@/server/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
  FieldValue: {
    serverTimestamp: jest.fn(),
  },
}));

describe('updateEngagementStatus', () => {
  let update;
  let doc;

  beforeEach(() => {
    jest.clearAllMocks();

    getAdminSession.mockResolvedValue({
      uid: 'admin-1',
      admin: true,
    });

    FieldValue.serverTimestamp.mockReturnValue('SERVER_TIMESTAMP');

    update = jest.fn().mockResolvedValue(undefined);
    doc = jest.fn().mockReturnValue({ update });

    adminDb.collection.mockReturnValue({ doc });
  });

  test('updates an engagement status', async () => {
    const result = await updateEngagementStatus('engagement-1', 'active');

    expect(result).toEqual({
      id: 'engagement-1',
      status: 'active',
    });

    expect(adminDb.collection).toHaveBeenCalledWith('serviceEngagements');

    expect(doc).toHaveBeenCalledWith('engagement-1');

    expect(update).toHaveBeenCalledWith({
      status: 'active',
      updatedAt: 'SERVER_TIMESTAMP',
    });
  });

  test('rejects unauthorized users', async () => {
    getAdminSession.mockResolvedValue(null);

    await expect(updateEngagementStatus('engagement-1', 'active')).rejects.toThrow('Unauthorized');

    expect(adminDb.collection).not.toHaveBeenCalled();
  });

  test('rejects invalid engagement IDs', async () => {
    await expect(updateEngagementStatus('../admin', 'active')).rejects.toThrow(
      'Invalid engagement ID.',
    );

    expect(update).not.toHaveBeenCalled();
  });

  test('rejects invalid statuses', async () => {
    await expect(updateEngagementStatus('engagement-1', 'unknown')).rejects.toThrow(
      'Invalid engagement status.',
    );

    expect(update).not.toHaveBeenCalled();
  });

  test('does not modify payment or client fields', async () => {
    await updateEngagementStatus('engagement-1', 'completed');

    expect(update).toHaveBeenCalledWith({
      status: 'completed',
      updatedAt: 'SERVER_TIMESTAMP',
    });

    expect(update.mock.calls[0][0]).not.toHaveProperty('paymentId');

    expect(update.mock.calls[0][0]).not.toHaveProperty('clientName');
  });

  test('propagates Firestore failures', async () => {
    update.mockRejectedValue(new Error('Firestore unavailable'));

    await expect(updateEngagementStatus('engagement-1', 'active')).rejects.toThrow(
      'Firestore unavailable',
    );
  });
});
