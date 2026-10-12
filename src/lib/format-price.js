export const DISCUSSED_PRICE_LABEL = 'Pricing discussed together';
export const SERVICE_DEPOSIT_LABEL = '$250 deposit';

export function formatPrice(priceCents) {
  if (typeof priceCents !== 'number' || priceCents <= 0) {
    return null;
  }

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceCents / 100);
}
