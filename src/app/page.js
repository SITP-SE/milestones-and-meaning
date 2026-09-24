import About from '@/components/home/sections/About';
import Hero from '@/components/home/sections/Hero';
import Journey from '@/components/home/sections/Journey';
import Services from '@/components/home/sections/Services';

export default function Home() {
  return (
    <>
      <Hero />
      <Journey />
      <About />
      <Services />
    </>
  );
}
