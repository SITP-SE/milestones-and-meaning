export const ENGAGEMENT_STATUSES = ['pending', 'active', 'completed', 'cancelled'];

export function validateNewEngagement(data) {
  const clientName = typeof data?.clientName === 'string' ? data.clientName.trim() : '';

  const clientEmail =
    typeof data?.clientEmail === 'string' ? data.clientEmail.trim().toLowerCase() : '';

  const clientPhone = typeof data?.clientPhone === 'string' ? data.clientPhone.trim() : '';

  const serviceId = typeof data?.serviceId === 'string' ? data.serviceId.trim() : '';

  if (!clientName || clientName.length > 120) {
    throw new Error('Invalid client name.');
  }

  if (
    clientEmail &&
    (clientEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail))
  ) {
    throw new Error('Invalid client email.');
  }

  if (
    clientPhone &&
    (clientPhone.length > 40 ||
      !/^[+()\d.\s-]+$/.test(clientPhone) ||
      (clientPhone.match(/\d/g) ?? []).length < 7)
  ) {
    throw new Error('Invalid client phone.');
  }

  if (!clientEmail && !clientPhone) {
    throw new Error('At least one contact method is required.');
  }

  if (!/^[a-z0-9_-]{1,80}$/.test(serviceId)) {
    throw new Error('Invalid service ID.');
  }

  return {
    clientName,
    clientEmail: clientEmail || null,
    clientPhone: clientPhone || null,
    serviceId,
  };
}

export function validateEngagementStatus(status) {
  if (!ENGAGEMENT_STATUSES.includes(status)) {
    throw new Error('Invalid engagement status.');
  }

  return status;
}
