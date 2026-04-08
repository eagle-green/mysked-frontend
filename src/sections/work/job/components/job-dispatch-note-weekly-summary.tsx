import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';

import { getPositionColor } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';

import { JobWidgetSummary } from './job-widget-summary';

// ----------------------------------------------------------------------

type Props = {
  selectedDate: Dayjs;
};

type SummaryTab = 'today' | 'week_total' | 'week_average';

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
    tcp_avg: number;
    lct_avg: number;
    hwy_avg: number;
    field_supervisor_avg: number;
  };
  charts: {
    categories: string[];
    tcp: number[];
    lct: number[];
    hwy: number[];
    field_supervisor: number[];
    tcp_percent: number;
    lct_percent: number;
    hwy_percent: number;
    field_supervisor_percent: number;
    weekly_categories: string[];
    tcp_weekly_total: number[];
    lct_weekly_total: number[];
    hwy_weekly_total: number[];
    field_supervisor_weekly_total: number[];
    tcp_weekly_total_percent: number;
    lct_weekly_total_percent: number;
    hwy_weekly_total_percent: number;
    field_supervisor_weekly_total_percent: number;
    tcp_weekly_avg: number[];
    lct_weekly_avg: number[];
    hwy_weekly_avg: number[];
    field_supervisor_weekly_avg: number[];
    tcp_weekly_avg_percent: number;
    lct_weekly_avg_percent: number;
    hwy_weekly_avg_percent: number;
    field_supervisor_weekly_avg_percent: number;
  };
};

export function JobDispatchNoteWeeklySummary({ selectedDate }: Props) {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState<SummaryTab>('today');

  const { data, isLoading } = useQuery<WeeklySummaryData>({
    queryKey: ['job-dispatch-note-weekly-summary', selectedDate.format('YYYY-MM-DD')],
    queryFn: async () => {
      const url = `${endpoints.work.jobDashboard}/dispatch-note-weekly-summary?date=${encodeURIComponent(selectedDate.format('YYYY-MM-DD'))}`;
      const response = await fetcher(url);
      return response as WeeklySummaryData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getChartColor = (position: string) => {
    const color = getPositionColor(position);
    const paletteColor = theme.palette[color as keyof typeof theme.palette];
    return (typeof paletteColor === 'object' && paletteColor && 'main' in paletteColor
      ? (paletteColor as { main: string }).main
      : theme.palette.primary.main) as string;
  };

  const weekRange = data?.weekly
    ? `${dayjs(data.weekly.weekStart).format('MMM D')} - ${dayjs(data.weekly.weekEnd).format('MMM D, YYYY')}`
    : '';

  // Get the appropriate data based on current tab
  const getMetricValue = (role: 'tcp' | 'lct' | 'hwy' | 'field_supervisor') => {
    if (!data) return 0;
    
    switch (currentTab) {
      case 'today':
        return data.daily[`${role}_active`];
      case 'week_total':
        return data.weekly[`${role}_active`];
      case 'week_average':
        return data.weekly[`${role}_avg`];
      default:
        return 0;
    }
  };

  const getPercent = (role: 'tcp' | 'lct' | 'hwy' | 'field_supervisor') => {
    if (!data?.charts) return undefined;
    
    switch (currentTab) {
      case 'today':
        return data.charts[`${role}_percent`];
      case 'week_total':
        return data.charts[`${role}_weekly_total_percent`];
      case 'week_average':
        return data.charts[`${role}_weekly_avg_percent`];
      default:
        return undefined;
    }
  };

  const getChartSeries = (role: 'tcp' | 'lct' | 'hwy' | 'field_supervisor') => {
    if (!data?.charts) return [];
    
    switch (currentTab) {
      case 'today':
        return data.charts[role] || [];
      case 'week_total':
        return data.charts[`${role}_weekly_total`] || [];
      case 'week_average':
        return data.charts[`${role}_weekly_avg`] || [];
      default:
        return [];
    }
  };

  const getChartCategories = () => {
    if (!data?.charts) return [];
    return currentTab === 'today' ? data.charts.categories : data.charts.weekly_categories;
  };

  const getPeriodLabel = () => currentTab === 'today' ? 'last 7 days' : 'Last 4 weeks';

  const getTitle = (role: string) => {
    const roleLabel = role === 'field_supervisor' ? 'Field Supervisor' : role.toUpperCase();
    
    switch (currentTab) {
      case 'today':
        return `${roleLabel}\nActive Today`;
      case 'week_total':
        return `${roleLabel}\nWeek Total`;
      case 'week_average':
        return `${roleLabel}\nWeek Avg`;
      default:
        return roleLabel;
    }
  };

  return (
    <Box>
      <Tabs
        value={currentTab}
        onChange={(_, v: SummaryTab) => setCurrentTab(v)}
        sx={[
          (sxTheme) => ({
            mb: 3,
            px: 0,
            boxShadow: `inset 0 -2px 0 0 ${varAlpha(sxTheme.vars.palette.grey['500Channel'], 0.08)}`,
          }),
        ]}
      >
        <Tab 
          value="today" 
          label={`Today (${selectedDate.format('ddd, MMM D')})`}
        />
        <Tab 
          value="week_total" 
          label={`Week Total${weekRange ? ` (${weekRange})` : ''}`}
        />
        <Tab 
          value="week_average" 
          label="Week Average"
        />
      </Tabs>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <JobWidgetSummary
            isLoading={isLoading}
            title={getTitle('tcp')}
            total={getMetricValue('tcp')}
            percent={getPercent('tcp')}
            periodLabel={getPeriodLabel()}
            chart={{
              categories: getChartCategories(),
              series: getChartSeries('tcp'),
              colors: [getChartColor('tcp')],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <JobWidgetSummary
            isLoading={isLoading}
            title={getTitle('lct')}
            total={getMetricValue('lct')}
            percent={getPercent('lct')}
            periodLabel={getPeriodLabel()}
            chart={{
              categories: getChartCategories(),
              series: getChartSeries('lct'),
              colors: [getChartColor('lct')],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <JobWidgetSummary
            isLoading={isLoading}
            title={getTitle('hwy')}
            total={getMetricValue('hwy')}
            percent={getPercent('hwy')}
            periodLabel={getPeriodLabel()}
            chart={{
              categories: getChartCategories(),
              series: getChartSeries('hwy'),
              colors: [getChartColor('hwy')],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <JobWidgetSummary
            isLoading={isLoading}
            title={getTitle('field_supervisor')}
            total={getMetricValue('field_supervisor')}
            percent={getPercent('field_supervisor')}
            periodLabel={getPeriodLabel()}
            chart={{
              categories: getChartCategories(),
              series: getChartSeries('field_supervisor'),
              colors: [getChartColor('field_supervisor')],
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
