import type { ICalendarJob } from 'src/types/calendar';

import { mutate } from 'swr';
import { useQuery } from '@tanstack/react-query';

import { getRoleLabel } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_COLOR_OPTIONS } from 'src/assets/data/job';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const enableServer = true;

const CALENDAR_ENDPOINT = endpoints.work.job;
const USER_JOBS_ENDPOINT = `${endpoints.work.job}/user`;

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
        CALENDAR_ENDPOINT,
        { headers: { Authorization: token ? `Bearer ${token}` : '' } },
      ]);
      return (response.data.jobs || [])
        .filter((job: any) => job.status !== 'draft' && job.status !== 'cancelled')
        .map((job: any) => {
          let color = '';
          const region = typeof job.site?.region === 'string' ? job.site.region : '';
          
          // Use client color if available, otherwise fall back to status-based colors
          if (job.client?.color) {
            color = job.client.color;
          } else if (job.status === 'pending') {
            color = JOB_COLOR_OPTIONS[2]; // warning.main (yellow)
          } else {
            color = JOB_COLOR_OPTIONS[0]; // info.main (blue)
          }
          
          return {
            id: job.id,
            color,
            textColor: color,
            title: job.site?.name,
            allDay: job.allDay ?? false,
            description: job.description ?? '',
            start: job.start_time,
            end: job.end_time,
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
      const response = await fetcher([
        USER_JOBS_ENDPOINT,
        { headers: { Authorization: token ? `Bearer ${token}` : '' } },
      ]);
      const calendarEvents = (response.data.jobs || []).flatMap((job: any) => {
        const region = typeof job.site?.region === 'string' ? job.site.region : '';
        // Include both pending and accepted
        const userAssignments = job.workers.filter(
          (worker: any) => worker.id === user?.id && ['pending', 'accepted'].includes(worker.status)
        );
        return userAssignments.map((worker: any) => {
          let color = '';
          
          // Use client color if available, otherwise fall back to status-based colors
          if (job.client?.color) {
            color = job.client.color;
          } else if (worker.status === 'pending') {
            color = JOB_COLOR_OPTIONS[2]; // warning.main (yellow)
          } else {
            color = JOB_COLOR_OPTIONS[0]; // info.main (blue)
          }
          
          return {
            id: `${job.id}-${worker.id}`,
            color,
            textColor: color,
            title: `${job.site?.name ?? '(No Site Name)'} (${getRoleLabel(worker.position) ?? 'Unknown Role'})`,
            allDay: job.allDay ?? false,
            description: job.description ?? '',
            start: worker.start_time,
            end: worker.end_time,
            jobId: job.id,
            workerId: worker.id,
            status: worker.status,
            region,
          };
        });
      });
      return calendarEvents;
    },
  });

  return {
    jobs: query.data || [],
    jobsLoading: query.isLoading,
    jobsError: query.error,
    jobsEmpty: !query.isLoading && query.data?.length === 0,
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
