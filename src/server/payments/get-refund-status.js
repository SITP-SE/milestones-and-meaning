export function getRefundStatus(amountCents, refundAmountCents) {
  if (
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0 ||
    !Number.isSafeInteger(refundAmountCents) ||
    refundAmountCents < 0 ||
    refundAmountCents > amountCents
  ) {
    throw new Error('Invalid refund amounts.');
  }

  if (refundAmountCents === 0) {
    return 'paid';
  }

  if (refundAmountCents === amountCents) {
    return 'refunded';
  }

  return 'partially_refunded';
}
