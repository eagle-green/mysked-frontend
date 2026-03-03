import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { getPositionColor } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = {
  selectedDate: Dayjs;
};

type WeeklySummaryData = {
  daily: {
    tcp_active: number;
    lct_active: number;
    hwy_active: number;
    field_supervisor_active: number;
  };
  weekly: {
    weekStart: string;
    weekEnd: string;
    tcp_active: number;
    lct_active: number;
    hwy_active: number;
    field_supervisor_active: number;
  };
};

export function JobDispatchNoteWeeklySummary({ selectedDate }: Props) {
  const { data, isLoading } = useQuery<WeeklySummaryData>({
    queryKey: ['job-dispatch-note-weekly-summary', selectedDate.format('YYYY-MM-DD')],
    queryFn: async () => {
      const url = `${endpoints.work.jobDashboard}/dispatch-note-weekly-summary?date=${encodeURIComponent(selectedDate.format('YYYY-MM-DD'))}`;
      const response = await fetcher(url);
      return response as WeeklySummaryData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const renderMetricItem = (
    label: string,
    count: number,
    roleKey: 'tcp' | 'lct' | 'hwy' | 'field_supervisor',
    compact?: boolean
  ) => {
    const color = getPositionColor(roleKey);

    return (
      <Stack 
        direction="row" 
        spacing={1} 
        alignItems="center" 
        sx={{ 
          minWidth: compact ? 'auto' : 180,
        }}
      >
        <Label color={color} sx={{ minWidth: compact ? 120 : 100 }}>
          {label}
        </Label>
        <Typography variant="h6" fontWeight="bold">
          {count}
        </Typography>
      </Stack>
    );
  };

  if (isLoading) {
    return (
      <Card sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={180} height={24} sx={{ mb: 1.5 }} />
            <Stack direction="row" spacing={2}>
              <Skeleton variant="rounded" width={120} height={32} />
              <Skeleton variant="rounded" width={120} height={32} />
              <Skeleton variant="rounded" width={120} height={32} />
              <Skeleton variant="rounded" width={120} height={32} />
            </Stack>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={200} height={24} sx={{ mb: 1.5 }} />
            <Stack direction="row" spacing={2}>
              <Skeleton variant="rounded" width={120} height={32} />
              <Skeleton variant="rounded" width={120} height={32} />
              <Skeleton variant="rounded" width={120} height={32} />
              <Skeleton variant="rounded" width={120} height={32} />
            </Stack>
          </Box>
        </Stack>
      </Card>
    );
  }

  if (!data) return null;

  const weekRange = data.weekly
    ? `${dayjs(data.weekly.weekStart).format('MMM D')} - ${dayjs(data.weekly.weekEnd).format('MMM D, YYYY')}`
    : '';

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={3}
        divider={<Divider orientation="vertical" flexItem />}
        sx={{ 
          alignItems: { xs: 'flex-start', md: 'center' },
        }}
      >
        {/* Daily Summary */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
            Total Active Today ({selectedDate.format('ddd, MMM D, YYYY')})
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {renderMetricItem('TCP', data.daily.tcp_active, 'tcp', true)}
            {renderMetricItem('LCT', data.daily.lct_active, 'lct', true)}
            {renderMetricItem('HWY', data.daily.hwy_active, 'hwy', true)}
            {renderMetricItem('Field Supervisor', data.daily.field_supervisor_active, 'field_supervisor', true)}
          </Stack>
        </Box>

        {/* Weekly Summary */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
            Total Active This Week ({weekRange})
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {renderMetricItem('TCP', data.weekly.tcp_active, 'tcp', true)}
            {renderMetricItem('LCT', data.weekly.lct_active, 'lct', true)}
            {renderMetricItem('HWY', data.weekly.hwy_active, 'hwy', true)}
            {renderMetricItem('Field Supervisor', data.weekly.field_supervisor_active, 'field_supervisor', true)}
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}
