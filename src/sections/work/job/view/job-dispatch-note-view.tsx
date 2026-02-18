import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import {
  JobDispatchNoteTable,
  JobDispatchNoteDateNav,
  JobDispatchNoteZoomControls,
  JobDispatchNoteCommentsDrawer,
} from '../components';

// ----------------------------------------------------------------------

const DASHBOARD_REGIONS = ['Metro Vancouver', 'Vancouver Island', 'Interior BC'] as const;
type DashboardRegion = (typeof DASHBOARD_REGIONS)[number];

type Worker = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  photo_url?: string | null;
  position: string;
  start_time: string;
  end_time: string;
  status: string;
  is_timesheet_manager: boolean;
  vehicle?: {
    type: string;
    license_plate: string;
    unit_number: string;
  } | null;
};

type Job = {
  id: string;
  job_number: string;
  status?: string | null;
  cancelledAt?: string | null;
  memo?: string | null;
  created_by?: {
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  updated_by?: {
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  customer: {
    id: string;
    name: string;
  };
  client: {
    id: string;
    name: string;
  };
  location?: string;
  lct_count: number;
  tcp_count: number;
  hwy_count: number;
  field_supervisor_count: number;
  workers: Worker[];
  region?: string;
};

type DashboardMetrics = {
  tcp_active: number;
  tcp_available: number;
  lct_active: number;
  lct_available: number;
  hwy_active: number;
  hwy_available: number;
  field_supervisor_active: number;
  field_supervisor_available: number;
};

type DispatchNoteData = {
  jobs: Job[];
  metrics: DashboardMetrics;
};

export function JobDispatchNoteView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const settings = useSettingsContext();

  // Auto-collapse sidebar on mount and restore on unmount
  useEffect(() => {
    const previousNavLayout = settings.state.navLayout;
    
    // Collapse sidebar when entering Dispatch Note
    if (previousNavLayout !== 'mini') {
      settings.setField('navLayout', 'mini');
    }

    // Restore previous layout when leaving
    return () => {
      if (previousNavLayout !== 'mini') {
        settings.setField('navLayout', previousNavLayout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // State from URL or defaults
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    const d = searchParams.get('date');
    return d ? dayjs(d) : dayjs();
  });

  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    const saved = localStorage.getItem('dispatch-note-zoom');
    return saved ? parseFloat(saved) : 1.0;
  });

  // Update URL when date changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('date', selectedDate.format('YYYY-MM-DD'));
    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [selectedDate, router]);

  // Save zoom level to localStorage
  useEffect(() => {
    localStorage.setItem('dispatch-note-zoom', zoomLevel.toString());
  }, [zoomLevel]);

  // Fetch dashboard data
  const { data, isLoading } = useQuery<DispatchNoteData>({
    queryKey: ['job-dispatch-note', selectedDate.format('YYYY-MM-DD')],
    queryFn: async () => {
      const url = `${endpoints.work.jobDashboard}/dispatch-note?date=${encodeURIComponent(selectedDate.format('YYYY-MM-DD'))}`;
      const response = await fetcher(url);
      return response as DispatchNoteData;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  // Group jobs by region
  const jobsByRegion = useMemo(() => {
    const grouped: Record<DashboardRegion, Job[]> = {
      'Metro Vancouver': [],
      'Vancouver Island': [],
      'Interior BC': [],
    };

    if (!data?.jobs) return grouped;

    data.jobs.forEach((job) => {
      if (job.region && DASHBOARD_REGIONS.includes(job.region as DashboardRegion)) {
        grouped[job.region as DashboardRegion].push(job);
      }
    });

    return grouped;
  }, [data?.jobs]);


  return (
    <>
      <DashboardContent maxWidth={false} sx={{ px: 3 }}>
        {/* Header */}
        <CustomBreadcrumbs
          heading="Dispatch Note"
          links={[
            { name: 'Work Management', href: paths.work.root },
            { name: 'Job', href: paths.work.job.root },
            { name: 'Dispatch Note' },
          ]}
        action={
          <JobDispatchNoteZoomControls zoomLevel={zoomLevel} onZoomChange={setZoomLevel} />
        }
          sx={{ mb: 3 }}
        />

      {/* Date Navigation */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <JobDispatchNoteDateNav selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          width: `${100 / zoomLevel}%`,
          transition: 'transform 0.2s ease',
        }}
      >
        <Stack spacing={3}>
          {isLoading ? (
            <>
              {[1, 2, 3].map((index) => (
                <Card key={index} sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
                  </Stack>
                </Card>
              ))}
            </>
          ) : (
            (() => {
              const regionsWithJobs = DASHBOARD_REGIONS.map((region) => {
                const jobs = jobsByRegion[region] || [];
                return { region, jobs };
              }).filter(({ jobs }) => jobs.length > 0);

              // If no jobs at all, show empty state
              if (regionsWithJobs.length === 0) {
                return (
                  <Card sx={{ p: 6, textAlign: 'center' }}>
                    <Box sx={{ mb: 2 }}>
                      <Iconify 
                        icon={"solar:calendar-mark-bold-duotone" as any}
                        width={64} 
                        sx={{ color: 'text.disabled', opacity: 0.5 }}
                      />
                    </Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Jobs Scheduled
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      There are no jobs scheduled for {selectedDate.format('MMMM D, YYYY')}
                    </Typography>
                  </Card>
                );
              }

              // Render regions with jobs
              return regionsWithJobs.map(({ region, jobs }) => (
                <JobDispatchNoteTable
                  key={region}
                  title={region}
                  jobs={jobs}
                  selectedDate={selectedDate.format('YYYY-MM-DD')}
                  metrics={data?.metrics}
                />
              ));
            })()
          )}
        </Stack>
      </Box>
    </DashboardContent>

    {/* Comments Drawer */}
    <JobDispatchNoteCommentsDrawer selectedDate={selectedDate} />
  </>
  );
}
