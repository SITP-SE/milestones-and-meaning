import { applyServicePricing } from '@/server/services/apply-service-pricing';

describe('applyServicePricing', () => {
  const content = {
    hero: {
      eyebrow: 'Wedding Officiation',
      headline: 'A ceremony that feels yours.',
      lines: ['Personalized officiation.'],
      showPrice: true,
    },
    offering: {
      eyebrow: 'Personalized Memorial Service',
      body: 'A personalized memorial.',
    },
  };

  test('uses the full service price regardless of legacy deposit settings', () => {
    const priced = applyServicePricing(content, {
      priceCents: 59500,
      requiresDeposit: true,
    });

    expect(priced.hero.price).toBe('$595');
    expect(priced.hero.deposit).toBeUndefined();
  });

  test('hides a zero price and deposit when the service is unpriced', () => {
    const priced = applyServicePricing(content, {
      priceCents: 0,
      requiresDeposit: false,
    });

    expect(priced.hero.price).toBeUndefined();
    expect(priced.hero.deposit).toBeUndefined();
    expect(priced.offering.price).toBe('Pricing discussed together');
  });

  test('replaces an offering price from the service', () => {
    const priced = applyServicePricing(content, {
      priceCents: 40000,
      requiresDeposit: false,
    });

    expect(priced.offering.price).toBe('$400');
    expect(priced.hero.deposit).toBeUndefined();
  });

  test('does not put a price on a hero that is not marked to show one', () => {
    const priced = applyServicePricing(
      {
        ...content,
        hero: { ...content.hero, showPrice: false },
      },
      {
        priceCents: 40000,
        requiresDeposit: false,
      },
    );

    expect(priced.hero.price).toBeUndefined();
    expect(priced.offering.price).toBe('$400');
  });

  test('returns the original content when no service is found', () => {
    expect(applyServicePricing(content, null)).toBe(content);
  });

  test('removes legacy deposit copy from stored page content', () => {
    const priced = applyServicePricing(
      {
        ...content,
        hero: {
          ...content.hero,
          deposit: '$250 deposit',
        },
      },
      {
        priceCents: 59500,
        requiresDeposit: true,
      },
    );

    expect(priced.hero.price).toBe('$595');
    expect(priced.hero.deposit).toBeUndefined();
  });

  test('shows the funeral package price when direct purchase is enabled', () => {
    const priced = applyServicePricing(
      {
        hero: {
          headline: 'Funeral & Memorial Services',
          lines: ['Compassionate support.'],
        },
      },
      {
        id: 'funeral_memorial_officiation',
        priceCents: 40000,
      },
    );

    expect(priced.hero.price).toBe('$400');
  });
});
