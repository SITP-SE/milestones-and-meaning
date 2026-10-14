const ONLINE_PAYMENT_SERVICE_IDS = new Set([
  'complete_marriage_package',
  'strong_start',
  'wedding_officiation',
  'funeral_memorial_officiation',
]);

// Only explicitly approved services can use online Checkout.
// The price must also be a valid, positive amount in CAD cents.
export function isOnlinePaymentEligible(serviceId, priceCents) {
  return (
    ONLINE_PAYMENT_SERVICE_IDS.has(serviceId) &&
    Number.isSafeInteger(priceCents) &&
    priceCents > 0 &&
    priceCents <= 100000000
  );
}
