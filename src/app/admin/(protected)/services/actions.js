'use server';

import { revalidatePath, updateTag } from 'next/cache';

import { updateService } from '@/server/services/update-service';

// Parse dollar amounts without floating-point multiplication.
// For example, "595.50" becomes exactly 59550 cents.
function parsePriceCents(value) {
  if (typeof value !== 'string') return NaN;

  const input = value.trim();

  if (!/^\d{1,7}(\.\d{1,2})?$/.test(input)) {
    return NaN;
  }

  const [dollars, cents = ''] = input.split('.');

  return Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
}

// Only expected validation errors may be shown to the user.
// Unexpected database errors must not expose internal details.
const validationErrors = new Set([
  'Service title must be between 1 and 120 characters.',
  'Description must be between 1 and 2000 characters.',
  'Invalid service price.',
  'Invalid service settings.',
  'A service requiring a deposit must cost at least $250.',
  'Invalid service ID.',
]);

export async function saveServiceAction(_previousState, formData) {
  const serviceId = formData.get('serviceId');

  // Extract only the fields allowed by the service editor.
  const changes = {
    title: formData.get('title'),
    body: formData.get('body'),
    priceCents: parsePriceCents(formData.get('priceDollars')),
    requiresDeposit: formData.has('requiresDeposit'),
    isGiftable: formData.has('isGiftable'),
  };

  try {
    // The update function independently verifies administrator
    // authorization, validates fields, and updates Firestore.
    await updateService(serviceId, changes);
  } catch (error) {
    // Normalize unexpected thrown values before inspecting errors.
    const errorMessage = error instanceof Error ? error.message : '';

    // Handle expired or unauthorized administrator sessions.
    if (errorMessage === 'Unauthorized') {
      return {
        status: 'error',
        message: 'Your session has expired. Please sign in again.',
      };
    }

    // Show expected validation errors directly in the editing row.
    if (validationErrors.has(errorMessage)) {
      return {
        status: 'error',
        message: errorMessage,
      };
    }

    // Log unexpected failures on the server without exposing
    // Firestore details or stack traces to the browser.
    console.error('Failed to update service', {
      serviceId,
      message: errorMessage || 'Unknown error',
    });

    return {
      status: 'error',
      message: 'Unable to save the service. Please try again.',
    };
  }

  // Invalidate the cached public services collection only
  // after Firestore successfully saves the changes.
  updateTag('services');

  // Refresh pages that display service information.
  revalidatePath('/');
  revalidatePath('/services');
  revalidatePath('/admin/services');

  return {
    status: 'success',
    message: 'Service saved successfully.',
  };
}
