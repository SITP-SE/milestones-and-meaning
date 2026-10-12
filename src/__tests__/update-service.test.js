import { getAdminSession } from '@/server/auth/session';
import { adminDb } from '@/server/firebase/admin';
import { updateService, validateServiceUpdate } from '@/server/services/update-service';

jest.mock('@/server/auth/session', () => ({
  getAdminSession: jest.fn(),
}));

jest.mock('@/server/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

const validService = {
  title: 'Wedding Officiation',
  body: 'A personalized wedding ceremony.',
  priceCents: 59500,
  requiresDeposit: true,
  isGiftable: true,
};

describe('updateService', () => {
  let update;

  beforeEach(() => {
    jest.clearAllMocks();

    update = jest.fn().mockResolvedValue(undefined);

    adminDb.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ update }),
    });
  });

  test('updates approved service fields for an administrator', async () => {
    getAdminSession.mockResolvedValue({ uid: 'admin-1', admin: true });

    await updateService('wedding_officiation', validService);

    expect(adminDb.collection).toHaveBeenCalledWith('services');
    expect(update).toHaveBeenCalledWith({
      ...validService,
      name: 'Wedding Officiation',
    });
  });

  test('rejects unauthorized changes before accessing Firestore', async () => {
    getAdminSession.mockResolvedValue(null);

    await expect(updateService('wedding_officiation', validService)).rejects.toThrow(
      'Unauthorized',
    );

    expect(adminDb.collection).not.toHaveBeenCalled();
  });

  test('rejects invalid service IDs', async () => {
    getAdminSession.mockResolvedValue({ uid: 'admin-1', admin: true });

    await expect(updateService('../admin', validService)).rejects.toThrow('Invalid service ID.');

    expect(update).not.toHaveBeenCalled();
  });

  test('rejects invalid prices', () => {
    expect(() => validateServiceUpdate({ ...validService, priceCents: -100 })).toThrow(
      'Invalid service price.',
    );
  });

  test('rejects deposits greater than service prices', () => {
    expect(() => validateServiceUpdate({ ...validService, priceCents: 10000 })).toThrow(
      'A service requiring a deposit must cost at least $250.',
    );
  });

  test('does not allow unexpected fields to be updated', async () => {
    getAdminSession.mockResolvedValue({ uid: 'admin-1', admin: true });

    await updateService('wedding_officiation', {
      ...validService,
      href: '/malicious-destination',
      isArchived: true,
    });

    // Extra fields are excluded by the validator.
    expect(update.mock.calls[0][0]).not.toHaveProperty('href');
    expect(update.mock.calls[0][0]).not.toHaveProperty('isArchived');
  });

  test('propagates Firestore errors', async () => {
    getAdminSession.mockResolvedValue({ uid: 'admin-1', admin: true });
    update.mockRejectedValue(new Error('Firestore unavailable'));

    await expect(updateService('wedding_officiation', validService)).rejects.toThrow(
      'Firestore unavailable',
    );
  });
});
