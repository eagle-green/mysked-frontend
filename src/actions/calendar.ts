import type { SWRConfiguration } from 'swr';
import type { ICalendarJob } from 'src/types/calendar';

import { mutate } from 'swr';
import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_COLOR_OPTIONS } from 'src/assets/data/job';

// ----------------------------------------------------------------------

const enableServer = false;

const CALENDAR_ENDPOINT = endpoints.work.job;

const swrOptions: SWRConfiguration = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
};

// ----------------------------------------------------------------------

type JobsData = {
  jobs: ICalendarJob[];
};

export function useGetJobs() {
  const token = sessionStorage.getItem('jwt_access_token');

  const regionColorMap: Record<string, string> = {
    'Metro Vancouver': JOB_COLOR_OPTIONS[0], // info.main
    'Vancouver Island': JOB_COLOR_OPTIONS[1], // success.main
  };

  const query = useQuery({
    queryKey: ['calendar-jobs'],
    queryFn: async () => {
      const data = await fetcher([
        CALENDAR_ENDPOINT,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
      ]);
      return (data.jobs || []).map((job: any) => {
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
