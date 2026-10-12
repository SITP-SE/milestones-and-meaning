import { revalidatePath, updateTag } from 'next/cache';

import { saveServiceAction } from '@/app/admin/(protected)/services/actions';
import { updateService } from '@/server/services/update-service';

// Mock database updates to avoid writing to Firestore.
jest.mock('@/server/services/update-service', () => ({
  updateService: jest.fn(),
}));

// Mock Next.js cache functions so we can verify when
// the public services cache is invalidated.
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  updateTag: jest.fn(),
}));

// Create realistic form data submitted by the inline editor.
function createFormData() {
  const formData = new FormData();

  formData.set('serviceId', 'wedding_officiation');
  formData.set('title', 'Wedding Officiation');
  formData.set('body', 'Personalized wedding ceremony.');
  formData.set('priceDollars', '595.25');
  formData.set('requiresDeposit', 'on');
  formData.set('isGiftable', 'on');

  return formData;
}

describe('saveServiceAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateService.mockResolvedValue(undefined);
  });

  test('saves a service and invalidates caches', async () => {
    const result = await saveServiceAction({ status: 'idle' }, createFormData());

    // Verify that dollars are converted to integer cents.
    expect(updateService).toHaveBeenCalledWith('wedding_officiation', {
      title: 'Wedding Officiation',
      body: 'Personalized wedding ceremony.',
      priceCents: 59525,
      requiresDeposit: true,
      isGiftable: true,
    });

    expect(updateTag).toHaveBeenCalledWith('services');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/services');
    expect(result.status).toBe('success');
  });

  test('handles unchecked settings and zero pricing', async () => {
    const formData = createFormData();

    formData.delete('requiresDeposit');
    formData.delete('isGiftable');
    formData.set('priceDollars', '0');

    await saveServiceAction({ status: 'idle' }, formData);

    expect(updateService).toHaveBeenCalledWith(
      'wedding_officiation',
      expect.objectContaining({
        priceCents: 0,
        requiresDeposit: false,
        isGiftable: false,
      }),
    );
  });

  test('returns validation errors without invalidating caches', async () => {
    // Validation happens inside updateService.
    updateService.mockRejectedValue(new Error('Invalid service price.'));

    const result = await saveServiceAction({ status: 'idle' }, createFormData());

    expect(result).toEqual({
      status: 'error',
      message: 'Invalid service price.',
    });

    expect(updateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test('rejects unauthorized submissions', async () => {
    updateService.mockRejectedValue(new Error('Unauthorized'));

    const result = await saveServiceAction({ status: 'idle' }, createFormData());

    expect(result.status).toBe('error');
    expect(result.message).toContain('session has expired');
    expect(updateTag).not.toHaveBeenCalled();
  });

  test('does not expose internal database errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      updateService.mockRejectedValue(new Error('Firestore unavailable'));

      const result = await saveServiceAction({ status: 'idle' }, createFormData());

      expect(result).toEqual({
        status: 'error',
        message: 'Unable to save the service. Please try again.',
      });

      expect(updateTag).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
