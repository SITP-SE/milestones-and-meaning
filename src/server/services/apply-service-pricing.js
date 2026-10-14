import { DISCUSSED_PRICE_LABEL, formatPrice } from '@/lib/format-price';

// Public service pages show the live services collection price,
// not the copy stored on the page document.
export function applyServicePricing(content, service) {
  if (!content || !service) {
    return content;
  }

  const price = formatPrice(service.priceCents);

  return {
    ...content,
    hero: content.hero
      ? {
          ...content.hero,
          price: content.hero.showPrice ? (price ?? undefined) : undefined,
          // Ignore deposit copy left in older Firestore page documents.
          deposit: undefined,
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
