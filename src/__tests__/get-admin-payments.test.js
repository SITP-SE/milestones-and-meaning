import { getAdminSession } from '@/server/auth/session';
import { adminDb } from '@/server/firebase/admin';
import { getAdminPayments } from '@/server/payments/get-admin-payments';

// Mock authentication so tests can simulate different users
// without creating real Firebase sessions.
jest.mock('@/server/auth/session', () => ({
  getAdminSession: jest.fn(),
}));

// Mock Firestore to avoid accessing a real database.
// These tests focus on retrieval, authorization, and data handling.
jest.mock('@/server/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

describe('getAdminPayments', () => {
  let orderBy;
  let limit;
  let get;

  beforeEach(() => {
    jest.clearAllMocks();

    // By default, simulate a valid administrator session.
    getAdminSession.mockResolvedValue({
      uid: 'admin-1',
      admin: true,
    });

    // Simulate an empty Firestore query.
    get = jest.fn().mockResolvedValue({
      docs: [],
    });

    limit = jest.fn().mockReturnValue({ get });
    orderBy = jest.fn().mockReturnValue({ limit });

    adminDb.collection.mockReturnValue({ orderBy });
  });

  test('retrieves recent payments for an administrator', async () => {
    get.mockResolvedValue({
      docs: [
        {
          id: 'cs_test_123',
          data: () => ({
            clientName: 'Sarah Johnson',
            serviceId: 'strong_start',
            amountCents: 99500,
            currency: 'cad',
            status: 'paid',
            refundAmountCents: 0,
            stripePaymentIntentId: 'pi_123',
            createdAt: {
              toDate: () => new Date('2026-10-13T12:00:00Z'),
            },
          }),
        },
      ],
    });

    const result = await getAdminPayments();

    expect(result).toEqual([
      {
        id: 'cs_test_123',
        clientName: 'Sarah Johnson',
        serviceId: 'strong_start',
        amountCents: 99500,
        currency: 'cad',
        status: 'paid',
        refundAmountCents: 0,
        stripePaymentIntentId: 'pi_123',
        createdAt: '2026-10-13T12:00:00.000Z',
      },
    ]);

    // Verify that the correct collection and query are used.
    expect(adminDb.collection).toHaveBeenCalledWith('payments');
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(limit).toHaveBeenCalledWith(50);
  });

  test('rejects unauthenticated users before reading Firestore', async () => {
    getAdminSession.mockResolvedValue(null);

    await expect(getAdminPayments()).rejects.toThrow('Unauthorized');

    // An unauthorized request must never reach the database.
    expect(adminDb.collection).not.toHaveBeenCalled();
  });

  test('rejects authenticated users without administrator privileges', async () => {
    getAdminSession.mockResolvedValue({
      uid: 'regular-user',
      admin: false,
    });

    await expect(getAdminPayments()).rejects.toThrow('Unauthorized');

    expect(adminDb.collection).not.toHaveBeenCalled();
  });

  test('returns an empty array when no payments exist', async () => {
    const result = await getAdminPayments();

    expect(result).toEqual([]);
  });

  test('handles missing optional payment fields', async () => {
    get.mockResolvedValue({
      docs: [
        {
          id: 'cs_test_456',
          data: () => ({
            clientName: 'John Smith',
            serviceId: 'wedding_officiation',
            amountCents: 59500,
            currency: 'cad',
            status: 'paid',
          }),
        },
      ],
    });

    const result = await getAdminPayments();

    expect(result[0]).toEqual(
      expect.objectContaining({
        refundAmountCents: 0,
        stripePaymentIntentId: null,
        createdAt: null,
      }),
    );
  });

  test('returns partially refunded payment information', async () => {
    get.mockResolvedValue({
      docs: [
        {
          id: 'cs_test_789',
          data: () => ({
            clientName: 'Jane Doe',
            serviceId: 'strong_start',
            amountCents: 99500,
            currency: 'cad',
            status: 'partially_refunded',
            refundAmountCents: 25000,
            stripePaymentIntentId: 'pi_789',
          }),
        },
      ],
    });

    const result = await getAdminPayments();

    expect(result[0]).toEqual(
      expect.objectContaining({
        status: 'partially_refunded',
        amountCents: 99500,
        refundAmountCents: 25000,
      }),
    );
  });

  test('does not expose unexpected database fields', async () => {
    get.mockResolvedValue({
      docs: [
        {
          id: 'cs_test_123',
          data: () => ({
            clientName: 'Sarah Johnson',
            serviceId: 'strong_start',
            amountCents: 99500,
            currency: 'cad',
            status: 'paid',
            internalNotes: 'Private administrative notes',
            clientPhone: '4165550123',
          }),
        },
      ],
    });

    const result = await getAdminPayments();

    // Only explicitly selected fields should reach the UI.
    expect(result[0]).not.toHaveProperty('internalNotes');
    expect(result[0]).not.toHaveProperty('clientPhone');
  });

  test('propagates Firestore failures', async () => {
    get.mockRejectedValue(new Error('Firestore unavailable'));

    await expect(getAdminPayments()).rejects.toThrow('Firestore unavailable');
  });
});
