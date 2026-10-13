import { getAdminSession } from '@/server/auth/session';
import { getAdminEngagements } from '@/server/engagements/get-admin-engagements';
import { adminDb } from '@/server/firebase/admin';

jest.mock('@/server/auth/session', () => ({
  getAdminSession: jest.fn(),
}));

jest.mock('@/server/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

describe('getAdminEngagements', () => {
  let orderBy;
  let limit;
  let get;

  beforeEach(() => {
    jest.clearAllMocks();

    getAdminSession.mockResolvedValue({
      uid: 'admin-1',
      admin: true,
    });

    get = jest.fn().mockResolvedValue({
      docs: [],
    });

    limit = jest.fn().mockReturnValue({ get });
    orderBy = jest.fn().mockReturnValue({ limit });

    adminDb.collection.mockReturnValue({ orderBy });
  });

  test('returns service engagements for an administrator', async () => {
    get.mockResolvedValue({
      docs: [
        {
          id: 'engagement-1',
          data: () => ({
            clientName: 'Sarah Johnson',
            clientEmail: 'sarah@example.com',
            clientPhone: '4165550123',
            serviceId: 'strong_start',
            status: 'active',
            source: 'stripe',
            paymentId: 'payment-1',
            giftId: null,
            createdAt: {
              toDate: () => new Date('2026-10-13T12:00:00Z'),
            },
            updatedAt: {
              toDate: () => new Date('2026-10-13T12:00:00Z'),
            },
          }),
        },
      ],
    });

    const result = await getAdminEngagements();

    expect(result).toEqual([
      {
        id: 'engagement-1',
        clientName: 'Sarah Johnson',
        clientEmail: 'sarah@example.com',
        clientPhone: '4165550123',
        serviceId: 'strong_start',
        status: 'active',
        source: 'stripe',
        paymentId: 'payment-1',
        giftId: null,
        createdAt: '2026-10-13T12:00:00.000Z',
        updatedAt: '2026-10-13T12:00:00.000Z',
      },
    ]);

    expect(adminDb.collection).toHaveBeenCalledWith('serviceEngagements');
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(limit).toHaveBeenCalledWith(50);
  });

  test('rejects unauthorized access', async () => {
    getAdminSession.mockResolvedValue(null);

    await expect(getAdminEngagements()).rejects.toThrow('Unauthorized');

    expect(adminDb.collection).not.toHaveBeenCalled();
  });

  test('returns an empty array when no records exist', async () => {
    const result = await getAdminEngagements();

    expect(result).toEqual([]);
  });

  test('propagates Firestore failures', async () => {
    get.mockRejectedValue(new Error('Firestore unavailable'));

    await expect(getAdminEngagements()).rejects.toThrow('Firestore unavailable');
  });

  test('does not expose unexpected Firestore fields', async () => {
    get.mockResolvedValue({
      docs: [
        {
          id: 'engagement-1',
          data: () => ({
            clientName: 'Sarah',
            serviceId: 'strong_start',
            status: 'pending',
            confidentialNotes: 'Private information',
          }),
        },
      ],
    });

    const result = await getAdminEngagements();

    expect(result[0]).not.toHaveProperty('confidentialNotes');
  });
});
