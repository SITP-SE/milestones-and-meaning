import { getAdminServices } from '@/server/services/get-admin-services';
import { getAdminSession } from '@/server/auth/session';
import { readServices } from '@/server/services/get-services';

// Mock authentication so we can simulate different
// session states without connecting to Firebase.
jest.mock('@/server/auth/session', () => ({
  getAdminSession: jest.fn(),
}));

// Mock Firestore service retrieval.
//
// These tests focus on authorization and error handling,
// not the database query itself.
jest.mock('@/server/services/get-services', () => ({
  readServices: jest.fn(),
}));

describe('getAdminServices', () => {
  // Reset mocks between tests to prevent one test from
  // affecting another.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns fresh services for an administrator', async () => {
    const services = [
      {
        id: 'wedding',
        title: 'Wedding Officiation',
      },
    ];

    // Simulate a verified administrator session.
    getAdminSession.mockResolvedValue({
      uid: 'admin-1',
      admin: true,
    });

    // Simulate services returned from Firestore.
    readServices.mockResolvedValue(services);

    const result = await getAdminServices();

    expect(result).toEqual(services);

    // Verify the service reader was called.
    expect(readServices).toHaveBeenCalledTimes(1);
  });

  test('rejects unauthorized access before reading Firestore', async () => {
    // Simulate an unauthenticated request.
    getAdminSession.mockResolvedValue(null);

    await expect(getAdminServices()).rejects.toThrow('Unauthorized');

    // Security requirement:
    // Unauthorized requests must not access Firestore.
    expect(readServices).not.toHaveBeenCalled();
  });

  test('propagates database failures', async () => {
    // Simulate an authenticated administrator.
    getAdminSession.mockResolvedValue({
      uid: 'admin-1',
      admin: true,
    });

    // Simulate a Firestore connection failure.
    readServices.mockRejectedValue(new Error('Firestore unavailable'));

    await expect(getAdminServices()).rejects.toThrow('Firestore unavailable');
  });
});
