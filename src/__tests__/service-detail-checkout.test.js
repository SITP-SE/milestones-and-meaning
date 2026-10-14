/** @jest-environment node */

import ServiceDetailPage from '@/app/services/[serviceId]/page';
import { getPage } from '@/server/pages/get-page';
import { getServiceForPage } from '@/server/services/get-services';

jest.mock('@/server/pages/get-page', () => ({
  getPage: jest.fn(),
}));

jest.mock('@/server/services/get-services', () => ({
  getServiceForPage: jest.fn(),
}));

describe('service detail Checkout eligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getPage.mockResolvedValue({
      content: {
        hero: {
          showPrice: true,
        },
      },
    });
  });

  test.each([
    ['strong-start', 'strong_start', 95500, 'strong_start'],
    ['marriage-package', 'complete_marriage_package', 192500, 'complete_marriage_package'],
    ['wedding-officiation', 'wedding_officiation', 59500, 'wedding_officiation'],
    ['funeral', 'funeral_memorial_officiation', 40000, 'funeral_memorial_officiation'],
    ['grief-support', 'grief_support', 0, null],
    ['other', 'unapproved_service', 40000, null],
    ['strong-start', 'strong_start', 0, null],
  ])(
    'passes correct Checkout eligibility for %s (%s) at %i cents',
    async (pageId, serviceId, priceCents, expectedId) => {
      getServiceForPage.mockResolvedValue({
        id: serviceId,
        priceCents,
      });

      const result = await ServiceDetailPage({
        params: Promise.resolve({ serviceId: pageId }),
      });

      expect(result.props.checkoutServiceId).toBe(expectedId);
      expect(getServiceForPage).toHaveBeenCalledWith(pageId);
    },
  );

  test('does not offer Checkout when service data is missing', async () => {
    getServiceForPage.mockResolvedValue(null);

    const result = await ServiceDetailPage({
      params: Promise.resolve({ serviceId: 'funeral' }),
    });

    expect(result.props.checkoutServiceId).toBeNull();
  });
});
