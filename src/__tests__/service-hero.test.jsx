import { render, screen } from '@testing-library/react';

import ServiceHero from '@/components/services/ServiceHero';

// The hero test checks layout content, not Next.js image optimization.
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ alt }) {
    return <span role="img" aria-label={alt} />;
  },
}));

describe('ServiceHero', () => {
  const baseProps = {
    eyebrow: 'PREPARE',
    headline: 'The Strong Start Program',
    lines: ['Six personalized preparation sessions.'],
    price: '$955',
    checkoutServiceId: 'strong_start',
    cta: {
      label: 'Book a Consultation',
      href: '/#contact',
    },
    image: {
      src: '/images/service-marriage.png',
      alt: 'Wedding rings',
    },
  };

  test('shows the full price without the obsolete deposit separator', () => {
    render(<ServiceHero {...baseProps} />);

    expect(screen.getByText('$955')).toBeInTheDocument();
    expect(screen.queryByText('|')).not.toBeInTheDocument();

    // Rendering the entire component catches undefined variables
    // such as the previously removed deposit reference.
    expect(screen.getByRole('button', { name: 'Proceed to Payment' })).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: 'Book a Free 15-Minute Consultation',
      }),
    ).toHaveAttribute('href', '/book/discovery');
  });

  test('renders correctly without a price or checkout', () => {
    render(
      <ServiceHero
        {...baseProps}
        price={undefined}
        checkoutServiceId={undefined}
        cta={undefined}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'The Strong Start Program',
      }),
    ).toBeInTheDocument();

    expect(screen.queryByText('$955')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Proceed to Payment' })).not.toBeInTheDocument();
  });
});
