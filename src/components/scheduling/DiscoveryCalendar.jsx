'use client';

import Cal, { getCalApi } from '@calcom/embed-react';
import { useEffect } from 'react';

const CAL_LINK = 'milestonesandmeaning/discovery-call';

export default function DiscoveryCalendar() {
  useEffect(() => {
    async function initializeCalendar() {
      const cal = await getCalApi({
        namespace: 'discovery-call',
      });

      cal('ui', {
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
    }

    initializeCalendar();
  }, []);

  return (
    <Cal
      namespace="discovery-call"
      calLink={CAL_LINK}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
      }}
      config={{
        layout: 'month_view',
        useSlotsViewOnSmallScreen: 'true',
      }}
    />
  );
}
