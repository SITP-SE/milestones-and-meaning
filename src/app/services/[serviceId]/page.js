import { notFound } from 'next/navigation';

import ServicePage from '@/components/services/ServicePage';
import { getPage } from '@/server/pages/get-page';
import { applyServicePricing } from '@/server/services/apply-service-pricing';
import { getServiceForPage } from '@/server/services/get-services';

// Cache the rendered page for an hour. Paths are generated on first
// request so `next build` does not need Firestore.
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { serviceId } = await params;
  const page = await getPage(serviceId);
  const hero = page?.content?.hero;

  if (!hero) return {};

  return {
    title: `${hero.eyebrow} | Milestones & Meaning`,
    description: hero.lines.join(' '),
  };
}

export default async function ServiceDetailPage({ params }) {
  const { serviceId } = await params;
  const [page, service] = await Promise.all([getPage(serviceId), getServiceForPage(serviceId)]);

  if (!page) {
    notFound();
  }

  return <ServicePage content={applyServicePricing(page.content, service)} />;
}
