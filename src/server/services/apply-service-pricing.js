import { DISCUSSED_PRICE_LABEL, formatPrice, SERVICE_DEPOSIT_LABEL } from '@/lib/format-price';

// Public service pages show the live services collection price,
// not the copy stored on the page document.
export function applyServicePricing(content, service) {
  if (!content || !service) {
    return content;
  }

  const price = formatPrice(service.priceCents);
  const deposit = service.requiresDeposit ? SERVICE_DEPOSIT_LABEL : undefined;

  return {
    ...content,
    hero: content.hero
      ? {
          ...content.hero,
          price: content.hero.showPrice ? (price ?? undefined) : undefined,
          deposit: content.hero.showPrice ? deposit : undefined,
        }
      : content.hero,
    offering: content.offering
      ? {
          ...content.offering,
          price: price ?? DISCUSSED_PRICE_LABEL,
        }
      : content.offering,
  };
}
