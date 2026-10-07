import { getServices } from '@/server/services/get-services';
import { adminDb } from '@/server/firebase/admin';

jest.mock('next/cache', () => ({
  unstable_cache: (fn) => fn,
}));

jest.mock('@/server/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

describe('getServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns services from Firestore sorted by order', async () => {
    adminDb.collection.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        docs: [
          {
            id: 'funeral',
            data: () => ({
              order: 2,
              title: 'Funeral & Memorial Services',
              href: '/services/funeral',
              priceCents: 40000,
            }),
          },
          {
            id: 'wedding-officiation',
            data: () => ({
              order: 1,
              title: 'Wedding Officiation',
              href: '/services/wedding-officiation',
              priceCents: 59500,
            }),
          },
        ],
      }),
    });

    const services = await getServices();

    expect(adminDb.collection).toHaveBeenCalledWith('services');
    expect(services.map((service) => service.id)).toEqual(['wedding-officiation', 'funeral']);
    expect(services[0]).toMatchObject({
      id: 'wedding-officiation',
      title: 'Wedding Officiation',
      priceCents: 59500,
    });
  });

  test('throws when Firestore is unavailable', async () => {
    adminDb.collection.mockReturnValue({
      get: jest.fn().mockRejectedValue(new Error('offline')),
    });

    await expect(getServices()).rejects.toThrow('offline');
  });
});
