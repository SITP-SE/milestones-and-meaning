import { connection } from 'next/server';

import { getServices } from '@/server/services/get-services';
import Services from './Services';

export default async function ServicesSection() {
  // Wait for a request before accessing Firestore.
  await connection();

  let services = [];

  try {
    services = await getServices();
  } catch (error) {
    console.error('Failed to load services from Firestore.', error);
  }

  return <Services services={services} />;
}
