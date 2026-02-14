import type { Dayjs } from 'dayjs';

import { JobDashboardCommentSections } from './job-dashboard-comment-sections';

// ----------------------------------------------------------------------

type Props = {
  selectedDate: Dayjs;
};

export function JobDispatchNoteSidePanel({ selectedDate }: Props) {
  return (
    <JobDashboardCommentSections
      viewTab="available"
      dashboardDate={selectedDate}
    />
  );
}
