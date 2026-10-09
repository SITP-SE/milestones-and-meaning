import { Suspense } from 'react';

import ServicesLoading from '@/components/home/sections/ServicesLoading';
import ServicesSection from '@/components/home/sections/ServicesSection';

export const metadata = {
  title: 'Our Services | Milestones & Meaning',
  description:
    'Thoughtfully designed services to support your relationship and your journey together.',
};

export default function ServicesIndexPage() {
  return (
    <Suspense fallback={<ServicesLoading />}>
      <ServicesSection />
    </Suspense>
  );
}
