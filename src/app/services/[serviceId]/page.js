import { notFound } from 'next/navigation';
import ServicePage from '@/components/services/ServicePage';
import { getPage, getPageIds } from '@/data/pages';

export async function generateStaticParams() {
  const ids = await getPageIds();
  return ids.map((serviceId) => ({ serviceId }));
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
  const page = await getPage(serviceId);

  if (!page) notFound();

  return <ServicePage content={page.content} />;
}
