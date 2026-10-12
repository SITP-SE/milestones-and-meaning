import { getPage } from '@/server/pages/get-page';
import { adminDb } from '@/server/firebase/admin';

jest.mock('@/server/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

describe('getPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns a page from Firestore', async () => {
    const get = jest.fn().mockResolvedValue({
      exists: true,
      id: 'grief-support',
      data: () => ({
        content: {
          hero: {
            headline: 'Test headline',
          },
        },
      }),
    });

    const doc = jest.fn().mockReturnValue({ get });
    adminDb.collection.mockReturnValue({ doc });

    const page = await getPage('grief-support');

    expect(adminDb.collection).toHaveBeenCalledWith('pages');
    expect(doc).toHaveBeenCalledWith('grief-support');

    expect(page).toEqual({
      id: 'grief-support',
      content: {
        hero: {
          headline: 'Test headline',
        },
      },
    });
  });

  test('returns null when the page does not exist', async () => {
    const get = jest.fn().mockResolvedValue({
      exists: false,
    });

    const doc = jest.fn().mockReturnValue({ get });
    adminDb.collection.mockReturnValue({ doc });

    const page = await getPage('missing-page');

    expect(page).toBeNull();
  });

  test('returns null for an invalid page ID', async () => {
    const page = await getPage('../invalid-page');

    expect(page).toBeNull();
    expect(adminDb.collection).not.toHaveBeenCalled();
  });

  test('returns null when the page ID is empty', async () => {
    const page = await getPage('');

    expect(page).toBeNull();
    expect(adminDb.collection).not.toHaveBeenCalled();
  });
});
