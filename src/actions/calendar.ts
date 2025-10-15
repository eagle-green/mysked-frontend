import type { ICalendarJob } from 'src/types/calendar';

import dayjs from 'dayjs';
import { mutate } from 'swr';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useQuery } from '@tanstack/react-query';

import { getRoleLabel } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_COLOR_OPTIONS } from 'src/assets/data/job';

import { useAuthContext } from 'src/auth/hooks';

import { TIME_OFF_TYPES } from 'src/types/timeOff';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Helper function to convert UTC to user's local timezone
const convertToLocalTimezone = (utcDateString: string): string => {
  if (!utcDateString) return utcDateString;

  try {
    return utcDateString;
  } catch (error) {
    console.warn('Failed to convert timezone for date:', utcDateString, error);
    return utcDateString; // Fallback to original
  }
};

// Helper function to get time-off event color
function getTimeOffEventColor(type: string, status: string): string {
  // If status is pending, use warning color regardless of type
  if (status === 'pending') {
    return '#FF9800'; // warning color
  }

  // For approved requests, use type-specific colors
  const timeOffType = TIME_OFF_TYPES.find((t) => t.value === type);
  return timeOffType?.color || '#9E9E9E'; // default gray
}

// ----------------------------------------------------------------------

const enableServer = true;

const CALENDAR_ENDPOINT = endpoints.work.job;
const USER_JOBS_ENDPOINT = `${endpoints.work.job}/user`;
// const TIME_OFF_ENDPOINT = '/api/time-off';
const USER_TIME_OFF_ENDPOINT = '/api/time-off/user-dates';

// const swrOptions: SWRConfiguration = {
//   revalidateIfStale: enableServer,
//   revalidateOnFocus: enableServer,
//   revalidateOnReconnect: enableServer,
// };

// ----------------------------------------------------------------------

// type JobsData = {
//   jobs: IJobItem[];
// };

export function useGetJobs() {
  const token = sessionStorage.getItem('jwt_access_token');

  const query = useQuery({
    queryKey: ['calendar-jobs'],
    queryFn: async () => {
      const response = await fetcher([
        `${CALENDAR_ENDPOINT}?is_open_job=false`,
        { headers: { Authorization: token ? `Bearer ${token}` : '' } },
      ]);
      return (response.data.jobs || [])
        .filter((job: any) => job.status !== 'draft' && job.status !== 'cancelled')
        .map((job: any) => {
          let color = '';
          const region = typeof job.site?.region === 'string' ? job.site.region : '';

          // Use company color if available, otherwise fall back to status-based colors
          if (job.company?.color) {
            color = job.company.color;
          } else if (job.status === 'pending') {
            color = JOB_COLOR_OPTIONS[2]; // warning.main (yellow)
          } else {
            color = JOB_COLOR_OPTIONS[0]; // info.main (blue)
          }

          return {
            id: job.id,
            color,
            textColor: color,
        title: `#${job.job_number} ${job.company?.name || ''}${job.client?.name ? ` - ${job.client.name}` : ''}${job.site?.name ? ` - ${job.site.name}` : ''}`,
            allDay: job.allDay ?? false,
            description: job.description ?? '',
            start: convertToLocalTimezone(job.start_time),
            end: convertToLocalTimezone(job.end_time),
            status: job.status,
            region,
          };
        });
    },
  });

  return {
    jobs: query.data || [],
    jobsLoading: query.isLoading,
    jobsError: query.error,
    jobsEmpty: !query.isLoading && query.data?.length === 0,
  };
}

export function useGetWorkerCalendarJobs() {
  const token = sessionStorage.getItem('jwt_access_token');
  const { user } = useAuthContext();

  const query = useQuery({
    queryKey: ['worker-calendar-jobs'],
    queryFn: async () => {
      // Fetch both jobs and time-off requests
      const [jobsResponse, timeOffResponse] = await Promise.all([
        fetcher([
          `${USER_JOBS_ENDPOINT}?is_open_job=false`,
          { headers: { Authorization: token ? `Bearer ${token}` : '' } },
        ]),
        fetcher([
          USER_TIME_OFF_ENDPOINT,
          { headers: { Authorization: token ? `Bearer ${token}` : '' } },
        ]),
      ]);

      // Process jobs
      const jobEvents = (jobsResponse.data.jobs || []).flatMap((job: any) => {
        const region = typeof job.site?.region === 'string' ? job.site.region : '';
        // Include both pending and accepted
        const userAssignments = job.workers.filter(
          (worker: any) => worker.id === user?.id && ['pending', 'accepted'].includes(worker.status)
        );

        return userAssignments.map((worker: any) => {
          let color = '';

          // Use company color if available, otherwise fall back to status-based colors
          if (job.company?.color) {
            color = job.company.color;
          } else if (worker.status === 'pending') {
            color = JOB_COLOR_OPTIONS[2]; // warning.main (yellow)
          } else {
            color = JOB_COLOR_OPTIONS[0]; // info.main (blue)
          }

          // Format: #123 8a customer_name - client_name (position)
          const startTime =
            dayjs(worker.start_time).format('h').toLowerCase() +
            dayjs(worker.start_time).format('a').toLowerCase().charAt(0); // "8a"
          const customerName = job.company?.name || '';
          const clientName = job.client?.name || '';
          const position = getRoleLabel(worker.position) || '';
          const eventTitle = `#${job.job_number} ${startTime} ${customerName}${clientName ? ` - ${clientName}` : ''} (${position})`.trim();

          return {
            id: `${job.id}-${worker.id}`,
            color,
            textColor: color,
            title: eventTitle,
            text: eventTitle, // Add text property as backup
            allDay: job.allDay ?? false,
            description: job.description ?? '',
            start: convertToLocalTimezone(worker.start_time),
            end: convertToLocalTimezone(worker.end_time),
            jobId: job.id,
            workerId: worker.id,
            status: worker.status,
            region,
            type: 'job',
            // Add these properties for FullCalendar
            display: 'block',
            editable: false,
            startEditable: false,
            durationEditable: false,
            resourceEditable: false,
          };
        });
      });

      // Process time-off requests as background events that fill the entire day
      // Only show pending and approved requests (hide rejected)
      const timeOffEvents = (timeOffResponse.data || [])
        .filter((timeOff: any) => timeOff.status === 'pending' || timeOff.status === 'approved')
        .map((timeOff: any) => {
          const color = getTimeOffEventColor(timeOff.type, timeOff.status);

          // For multi-day events, we need to add one day to the end date to include the full end day
          // FullCalendar treats end dates as exclusive, so we need to add one day
          const endDate = new Date(timeOff.end_date);
          endDate.setDate(endDate.getDate() + 1);
          const adjustedEndDate = endDate.toISOString().split('T')[0];

          return {
            id: `timeoff-${timeOff.id}`,
            color,
            textColor: color,
            title: `${TIME_OFF_TYPES.find((t) => t.value === timeOff.type)?.label || timeOff.type} - ${timeOff.status.charAt(0).toUpperCase() + timeOff.status.slice(1)}`,
            allDay: true,
            display: 'background', // This makes it fill the entire day as background
            description: timeOff.reason,
            start: timeOff.start_date, // Use date string directly for allDay events
            end: adjustedEndDate, // Use adjusted date string directly
            type: 'timeoff',
            timeOffId: timeOff.id,
            timeOffType: timeOff.type,
            timeOffStatus: timeOff.status,
            timeOffReason: timeOff.reason,
            originalStartDate: timeOff.start_date,
            originalEndDate: timeOff.end_date,
          };
        });

      // Combine both types of events
      const allEvents = [...jobEvents, ...timeOffEvents];

      return allEvents;
    },
    staleTime: 0, // Disable caching temporarily for debugging
    gcTime: 0, // Disable garbage collection caching
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    jobs: query.data || [],
    jobsLoading: query.isLoading,
    jobsError: query.error,
    jobsEmpty: !query.isLoading && query.data?.length === 0,
  };
}

export function useGetTimeOffRequests() {
  const token = sessionStorage.getItem('jwt_access_token');

  const query = useQuery({
    queryKey: ['time-off-requests'],
    queryFn: async () => {
      const response = await fetcher([
        USER_TIME_OFF_ENDPOINT,
        { headers: { Authorization: token ? `Bearer ${token}` : '' } },
      ]);

      return (response.data || []).map((timeOff: any) => {
        const color = getTimeOffEventColor(timeOff.type, timeOff.status);

        // For multi-day events, we need to add one day to the end date to include the full end day
        // FullCalendar treats end dates as exclusive, so we need to add one day
        const endDate = new Date(timeOff.end_date);
        endDate.setDate(endDate.getDate() + 1);
        const adjustedEndDate = endDate.toISOString().split('T')[0];

        return {
          id: `timeoff-${timeOff.id}`,
          color,
          textColor: color,
          title: `${TIME_OFF_TYPES.find((t) => t.value === timeOff.type)?.label || timeOff.type} - ${timeOff.status.charAt(0).toUpperCase() + timeOff.status.slice(1)}`,
          allDay: true,
          description: timeOff.reason,
          start: timeOff.start_date, // Use date string directly for allDay events
          end: adjustedEndDate, // Use adjusted date string directly
          type: 'timeoff',
          timeOffId: timeOff.id,
          timeOffType: timeOff.type,
          timeOffStatus: timeOff.status,
          timeOffReason: timeOff.reason,
        };
      });
    },
  });

  return {
    timeOffRequests: query.data || [],
    timeOffRequestsLoading: query.isLoading,
    timeOffRequestsError: query.error,
    timeOffRequestsEmpty: !query.isLoading && query.data?.length === 0,
  };
}

// ----------------------------------------------------------------------

export async function createJob(jobData: ICalendarJob) {
  /**
   * Work on server
   */
  if (enableServer) {
    await fetcher([CALENDAR_ENDPOINT, { method: 'post', data: jobData }]);
  }

  /**
   * Work in local
   */

  mutate(
    CALENDAR_ENDPOINT,
    (currentData) => {
      const currentJobs: ICalendarJob[] = currentData?.jobs;

      const jobs = [...currentJobs, jobData];

      return { ...currentData, jobs };
    },
    false
  );
}

// ----------------------------------------------------------------------

export async function updateJob(jobData: Partial<ICalendarJob>) {
  /**
   * Work on server
   */
  if (enableServer) {
    await fetcher([CALENDAR_ENDPOINT, { method: 'put', data: jobData }]);
  }

  /**
   * Work in local
   */

  mutate(
    CALENDAR_ENDPOINT,
    (currentData: any) => {
      const currentJobs: ICalendarJob[] = currentData?.jobs;

      const jobs = currentJobs.map((job) => (job.id === jobData.id ? { ...job, ...jobData } : job));

      return { ...currentData, jobs };
    },
    false
  );
}

// ----------------------------------------------------------------------

export async function deleteJob(jobId: string) {
  /**
   * Work on server
   */
  if (enableServer) {
    await fetcher([CALENDAR_ENDPOINT, { method: 'patch', data: { jobId } }]);
  }

  /**
   * Work in local
   */

  mutate(
    CALENDAR_ENDPOINT,
    (currentData: any) => {
      const currentJobs: ICalendarJob[] = currentData?.jobs;

      const jobs = currentJobs.filter((job) => job.id !== jobId);

      return { ...currentData, jobs };
    },
    false
  );
}

export { useGetWorkerCalendarJobs as useGetUserJobs };
