import type { ICalendarJob } from 'src/types/calendar';

import { mutate } from 'swr';
import { useQuery } from '@tanstack/react-query';

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

  const regionColorMap: Record<string, string> = {
    'Metro Vancouver': JOB_COLOR_OPTIONS[0], // info.main
    'Vancouver Island': JOB_COLOR_OPTIONS[1], // success.main
  };

  const query = useQuery({
    queryKey: ['calendar-jobs'],
    queryFn: async () => {
      const response = await fetcher([
        CALENDAR_ENDPOINT,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
      ]);
      return (response.data.jobs || []).map((job: any) => {
        const region = job.site?.region || '';
        const color = regionColorMap[region] || JOB_COLOR_OPTIONS[0];
        return {
          id: job.id,
          color,
          textColor: color,
          title: job.site?.name ?? '(No Site Name)',
          allDay: job.allDay ?? false,
          description: job.description ?? '',
          start: job.start_time,
          end: job.end_time,
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

export function useGetUserJobs() {
  const token = sessionStorage.getItem('jwt_access_token');
  const { user } = useAuthContext();

  const regionColorMap: Record<string, string> = {
    'Metro Vancouver': JOB_COLOR_OPTIONS[0], // info.main
    'Vancouver Island': JOB_COLOR_OPTIONS[1], // success.main
  };

  const query = useQuery({
    queryKey: ['user-jobs'],
    queryFn: async () => {
      const response = await fetcher([
        USER_JOBS_ENDPOINT,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
      ]);
      
      // Transform jobs into calendar events, creating separate events for each worker assignment
      const calendarEvents = (response.data.jobs || []).flatMap((job: any) => {
        const region = job.site?.region || '';
        const color = regionColorMap[region] || JOB_COLOR_OPTIONS[0];
        
        // Filter worker assignments to only include the current user and accepted status
        const userAssignments = job.workers.filter((worker: any) => 
          worker.user_id === user?.id && worker.status === 'accepted'
        );
        
        // Create an event for each worker assignment using their individual start and end times
        return userAssignments.map((worker: any) => ({
          id: `${job.id}-${worker.id}`, // Create unique ID for each worker assignment event
          color,
          textColor: color,
          title: job.site?.name ?? '(No Site Name)',
          allDay: job.allDay ?? false,
          description: job.description ?? '',
          start: worker.start_time, // Use worker's start time
          end: worker.end_time, // Use worker's end time
          jobId: job.id, // Keep reference to original job
          workerId: worker.id, // Keep reference to worker assignment
        }));
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
    (currentData) => {
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
    (currentData) => {
      const currentJobs: ICalendarJob[] = currentData?.jobs;

      const jobs = currentJobs.filter((job) => job.id !== jobId);

      return { ...currentData, jobs };
    },
    false
  );
}
