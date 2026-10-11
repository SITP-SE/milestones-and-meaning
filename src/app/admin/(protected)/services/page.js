import ServicesTable from '@/components/admin/services/ServicesTable';
import { getAdminServices } from '@/server/services/get-admin-services';

// Server Component: retrieve fresh services after verifying
// the administrator's session.
export default async function AdminServicesPage() {
  const services = await getAdminServices();

  // Send only the fields needed by the client-side editor.
  // This avoids passing unnecessary Firestore document data
  // into a Client Component.
  const editableServices = services.map((service) => ({
    id: service.id,
    title: service.title ?? service.name ?? '',
    body: service.body ?? '',
    priceCents: service.priceCents ?? 0,
    requiresDeposit: service.requiresDeposit === true,
    isGiftable: service.isGiftable === true,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Services</h1>

      <p className="mt-2">View and manage existing services.</p>

      {editableServices.length === 0 ? (
        <p className="mt-6">No services found.</p>
      ) : (
        <div className="mt-6">
          <ServicesTable services={editableServices} />
        </div>
      )}
    </main>
  );
}
