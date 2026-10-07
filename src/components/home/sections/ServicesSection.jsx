import { getServices } from '@/server/services/get-services';
import Services from './Services';

export default async function ServicesSection() {
  let services = [];

  try {
    services = await getServices();
  } catch (error) {
    console.error('Failed to load services from Firestore.', error);
  }

  return <Services services={services} />;
}
