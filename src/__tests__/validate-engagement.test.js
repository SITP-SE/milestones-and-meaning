import {
  validateNewEngagement,
  validateEngagementStatus,
} from '@/server/engagements/validate-engagement';

const validEngagement = {
  clientName: 'Sarah Johnson',
  clientEmail: 'Sarah@Example.com',
  clientPhone: '4165550123',
  serviceId: 'strong_start',
};

describe('service engagement validation', () => {
  test('accepts valid client information', () => {
    expect(validateNewEngagement(validEngagement)).toEqual({
      ...validEngagement,
      clientEmail: 'sarah@example.com',
    });
  });

  test('supports phone-only contacts', () => {
    const result = validateNewEngagement({
      ...validEngagement,
      clientEmail: '',
    });

    expect(result.clientEmail).toBeNull();
  });

  test('requires at least one contact method', () => {
    expect(() =>
      validateNewEngagement({
        ...validEngagement,
        clientEmail: '',
        clientPhone: '',
      }),
    ).toThrow('At least one contact method is required.');
  });

  test('rejects invalid service IDs', () => {
    expect(() =>
      validateNewEngagement({
        ...validEngagement,
        serviceId: '../admin',
      }),
    ).toThrow('Invalid service ID.');
  });

  test('rejects invalid email addresses', () => {
    expect(() =>
      validateNewEngagement({
        ...validEngagement,
        clientEmail: 'invalid-email',
      }),
    ).toThrow('Invalid client email.');
  });

  test('ignores unexpected fields', () => {
    const result = validateNewEngagement({
      ...validEngagement,
      status: 'completed',
      paymentId: 'unverified-payment',
    });

    expect(result).not.toHaveProperty('status');
    expect(result).not.toHaveProperty('paymentId');
  });

  test('accepts valid statuses', () => {
    expect(validateEngagementStatus('active')).toBe('active');
  });

  test('rejects invalid statuses', () => {
    expect(() => validateEngagementStatus('unknown')).toThrow('Invalid engagement status.');
  });
});
