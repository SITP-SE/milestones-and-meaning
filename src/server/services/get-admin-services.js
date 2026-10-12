import { getAdminSession } from '@/server/auth/session';
import { readServices } from '@/server/services/get-services';

export async function getAdminServices() {
  // Verify authorization within the data-access function.
  // This prevents unauthorized access even if the function
  // is called from somewhere outside the protected admin layout.
  const session = await getAdminSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  // Admins need fresh data rather than the public cached version.
  return readServices();
}
