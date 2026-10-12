import { render, screen, waitFor } from '@testing-library/react';
import { getCalApi } from '@calcom/embed-react';

import DiscoveryCalendar from '@/components/scheduling/DiscoveryCalendar';

// Mock Cal.com so tests never create real appointments.
jest.mock('@calcom/embed-react', () => ({
  __esModule: true,
  default: ({ namespace, calLink, config }) => (
    <div
      data-testid="cal-embed"
      data-namespace={namespace}
      data-cal-link={calLink}
      data-layout={config.layout}
    />
  ),
  getCalApi: jest.fn(),
}));

describe('DiscoveryCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCalApi.mockResolvedValue(jest.fn());
  });

  test('renders Gabi’s Discovery Session', () => {
    render(<DiscoveryCalendar />);

    const embed = screen.getByTestId('cal-embed');

    expect(embed).toHaveAttribute('data-cal-link', 'milestonesandmeaning/discovery-call');

    expect(embed).toHaveAttribute('data-namespace', 'discovery-call');

    expect(embed).toHaveAttribute('data-layout', 'month_view');
  });

  test('configures Cal.com UI', async () => {
    const configureUi = jest.fn();
    getCalApi.mockResolvedValue(configureUi);

    render(<DiscoveryCalendar />);

    await waitFor(() => {
      expect(configureUi).toHaveBeenCalledWith('ui', {
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
    });

    expect(getCalApi).toHaveBeenCalledWith({
      namespace: 'discovery-call',
    });
  });
});
