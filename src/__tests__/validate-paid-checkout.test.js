import { validatePaidCheckout } from '@/server/payments/validate-paid-checkout';

const validSession = {
  object: 'checkout.session',
  id: 'cs_test_123',
  mode: 'payment',
  payment_status: 'paid',
  currency: 'cad',
  amount_total: 95500,
  payment_intent: 'pi_123',
  metadata: {
    serviceId: 'strong_start',
  },
  customer_details: {
    individual_name: 'Sarah Johnson',
    email: 'Sarah@Example.com',
    phone: null,
  },
};

describe('validatePaidCheckout', () => {
  test('accepts a confirmed CAD payment', () => {
    expect(validatePaidCheckout(validSession)).toEqual({
      checkoutSessionId: 'cs_test_123',
      stripePaymentIntentId: 'pi_123',
      clientName: 'Sarah Johnson',
      clientEmail: 'sarah@example.com',
      clientPhone: null,
      serviceId: 'strong_start',
      amountCents: 95500,
      currency: 'cad',
      status: 'paid',
    });
  });

  test('rejects unpaid Checkout Sessions', () => {
    expect(() =>
      validatePaidCheckout({
        ...validSession,
        payment_status: 'unpaid',
      }),
    ).toThrow('Checkout payment is not confirmed.');
  });

  test('rejects payments in currencies other than CAD', () => {
    expect(() =>
      validatePaidCheckout({
        ...validSession,
        currency: 'usd',
      }),
    ).toThrow('Invalid Checkout payment amount.');
  });

  test('rejects invalid amounts', () => {
    expect(() =>
      validatePaidCheckout({
        ...validSession,
        amount_total: -100,
      }),
    ).toThrow('Invalid Checkout payment amount.');
  });

  test('rejects missing service references', () => {
    expect(() =>
      validatePaidCheckout({
        ...validSession,
        metadata: {},
      }),
    ).toThrow('Invalid service ID.');
  });

  test('rejects missing customer names', () => {
    expect(() =>
      validatePaidCheckout({
        ...validSession,
        customer_details: {
          individual_name: '',
          email: 'sarah@example.com',
        },
      }),
    ).toThrow('Invalid client name.');
  });

  test('rejects missing PaymentIntent references', () => {
    expect(() =>
      validatePaidCheckout({
        ...validSession,
        payment_intent: null,
      }),
    ).toThrow('Invalid PaymentIntent reference.');
  });
});
