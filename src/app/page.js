import { Suspense } from 'react';

import About from '@/components/home/sections/About';
import Hero from '@/components/home/sections/Hero';
import Journey from '@/components/home/sections/Journey';
import ServicesLoading from '@/components/home/sections/ServicesLoading';
import ServicesSection from '@/components/home/sections/ServicesSection';

export default function Home() {
  return (
    <>
      <Hero />
      <Journey />
      <About />
      <Suspense fallback={<ServicesLoading />}>
        <ServicesSection />
      </Suspense>
    </>
  );
}
