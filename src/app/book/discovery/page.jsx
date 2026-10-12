import DiscoveryCalendar from '@/components/scheduling/DiscoveryCalendar';

export const metadata = {
  title: 'Book a Discovery Session | Milestones & Meaning',
  description: 'Schedule a free 15-minute Discovery Session with Milestones & Meaning.',
};

export default function DiscoveryPage() {
  return (
    <section className="bg-shell px-6 py-12 lg:px-[50px] lg:py-20">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center">
        <p className="text-lead text-terracotta uppercase">Free 15-minute consultation</p>

        <h1 className="font-heading text-brand text-h1 mt-4 text-center">
          Book a Discovery Session
        </h1>

        <p className="text-lead text-ink mt-5 max-w-[650px] text-center">
          Have questions or want to meet Gabi before getting started? Schedule a free 15-minute
          conversation to explore how we can support you.
        </p>

        <div className="mt-10 h-[750px] w-full overflow-hidden rounded-[20px] bg-white sm:h-[800px]">
          <DiscoveryCalendar />
        </div>
      </div>
    </section>
  );
}
