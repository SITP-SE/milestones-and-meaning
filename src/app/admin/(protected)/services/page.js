import { getAdminServices } from '@/server/services/get-admin-services';

// Convert the price stored in Firestore (in cents) into
// a readable currency value.
//
// A price of 0 currently means pricing is discussed
// directly with the client.
function formatPrice(priceCents) {
  if (typeof priceCents !== 'number' || priceCents <= 0) {
    return 'Pricing discussed together';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceCents / 100);
}

// Read-only overview of all services.
//
// This page lives inside the protected admin route group.
// getAdminServices() also performs its own authorization
// check before accessing Firestore.
export default async function AdminServicesPage() {
  // Retrieve fresh service data instead of using the
  // public website's one-hour cache.
  const services = await getAdminServices();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Services</h1>

      <p className="mt-2">View existing services and their settings.</p>

      {/* Display a message when no services exist. */}
      {services.length === 0 ? (
        <p className="mt-6">No services found.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th scope="col" className="p-3">
                  Service
                </th>

                <th scope="col" className="p-3">
                  Price
                </th>

                <th scope="col" className="p-3">
                  Deposit
                </th>

                <th scope="col" className="p-3">
                  Giftable
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Render one row for each Firestore service. */}
              {services.map((service) => (
                <tr key={service.id} className="border-t">
                  <th scope="row" className="p-3 font-medium">
                    {service.title ?? service.name}

                    <p className="mt-1 font-normal">{service.body}</p>
                  </th>

                  {/* Prices are stored as integers in cents. */}
                  <td className="p-3">{formatPrice(service.priceCents)}</td>

                  {/* Indicates whether the standard deposit is required. */}
                  <td className="p-3">{service.requiresDeposit ? 'Yes' : 'No'}</td>

                  {/* Indicates whether a service can be gifted. */}
                  <td className="p-3">{service.isGiftable ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
