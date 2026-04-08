import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';

/** React Query key for nav badge: draft timesheets where current user is timesheet manager. */
export const MY_DRAFT_TIMESHEET_MANAGER_COUNT_QUERY_KEY = [
  'my-draft-timesheet-manager-count',
] as const;

/** Draft timesheet count for current user as timesheet manager (My Schedule → Work → Timesheet nav badge). */
export function useGetMyDraftTimesheetManagerCount() {
  const { user } = useAuthContext();

  const query = useQuery({
    queryKey: MY_DRAFT_TIMESHEET_MANAGER_COUNT_QUERY_KEY,
    queryFn: async () => {
      const response = await fetcher(endpoints.timesheet.draftManagerCount);
      const data = response?.data ?? response;
      return typeof data?.count === 'number' ? data.count : 0;
    },
    enabled: !!user?.id && user?.role !== 'admin',
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    draftTimesheetManagerCount: query.data ?? 0,
    draftTimesheetManagerCountLoading: query.isLoading,
    draftTimesheetManagerCountError: query.error,
  };
}
