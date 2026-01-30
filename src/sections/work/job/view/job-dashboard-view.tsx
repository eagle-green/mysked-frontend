import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';

import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useSearchParams } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { getPositionColor } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import {
  JobWidgetSummary,
  JobDashboardWeeklyTable,
  JobDashboardAvailableTable,
  JobDashboardCommentSections,
  JobDashboardActiveByJobTable,
  JobDashboardWeeklyViewDayToolbar,
} from '../components';

// ----------------------------------------------------------------------

type DashboardMetrics = {
  tcpAvailable: number;
  lctAvailable: number;
  hwyAvailable: number;
  fieldSupervisorAvailable: number;
  tcpActive: number;
  lctActive: number;
  hwyActive: number;
  fieldSupervisorActive: number;
  tcpPercent?: number;
  lctPercent?: number;
  hwyPercent?: number;
  fieldSupervisorPercent?: number;
  tcpActivePercent?: number;
  lctActivePercent?: number;
  hwyActivePercent?: number;
  fieldSupervisorActivePercent?: number;
  /** From last 4 weeks chart when in weekly view */
  tcpPercentWeekly?: number;
  lctPercentWeekly?: number;
  hwyPercentWeekly?: number;
  fieldSupervisorPercentWeekly?: number;
  tcpActivePercentWeekly?: number;
  lctActivePercentWeekly?: number;
  hwyActivePercentWeekly?: number;
  fieldSupervisorActivePercentWeekly?: number;
  tcpChart?: number[];
  lctChart?: number[];
  hwyChart?: number[];
  fieldSupervisorChart?: number[];
  tcpActiveChart?: number[];
  lctActiveChart?: number[];
  hwyActiveChart?: number[];
  fieldSupervisorActiveChart?: number[];
  chartCategories?: string[];
  /** Last 4 weeks: categories and series for weekly view */
  chartCategoriesWeekly?: string[];
  tcpChartWeekly?: number[];
  lctChartWeekly?: number[];
  hwyChartWeekly?: number[];
  fieldSupervisorChartWeekly?: number[];
  tcpActiveChartWeekly?: number[];
  lctActiveChartWeekly?: number[];
  hwyActiveChartWeekly?: number[];
  fieldSupervisorActiveChartWeekly?: number[];
};

type DashboardViewTab = 'available' | 'active' | 'weekly';
type WeeklySubTab = 'available' | 'active';
type ActiveViewMode = 'by_employee' | 'by_job';

/** Last 7 days as "Mon\nJan 20" for chart categories (ref = most recent day) */
function getLastSevenDaysCategoryLabels(ref: Dayjs): string[] {
  return [6, 5, 4, 3, 2, 1, 0].map((d) => {
    const day = ref.subtract(d, 'day');
    return `${day.format('ddd')}\n${day.format('MMM D')}`;
  });
}

/** Monday of the week containing d (week = Mon–Sun) */
function getMonday(d: Dayjs): Dayjs {
  return d.day() === 0
    ? d.subtract(6, 'day').startOf('day')
    : d.startOf('week').add(1, 'day').startOf('day');
}

/** Mock dashboard metrics for meeting/demo (use ?mock=1 in URL). */
function getMockDashboardMetrics(): DashboardMetrics {
  const last7 = [42, 45, 48, 44, 52, 55, 58];
  const last4Weeks = [320, 340, 310, 360];
  return {
    tcpAvailable: 58,
    lctAvailable: 38,
    hwyAvailable: 22,
    fieldSupervisorAvailable: 12,
    tcpActive: 24,
    lctActive: 18,
    hwyActive: 10,
    fieldSupervisorActive: 6,
    tcpPercent: 5.5,
    lctPercent: -2.1,
    hwyPercent: 8.0,
    fieldSupervisorPercent: 3.2,
    tcpActivePercent: 12.5,
    lctActivePercent: 6.0,
    hwyActivePercent: 4.0,
    fieldSupervisorActivePercent: 8.0,
    tcpPercentWeekly: 6.2,
    lctPercentWeekly: -3.0,
    hwyPercentWeekly: 5.0,
    fieldSupervisorPercentWeekly: 4.0,
    tcpActivePercentWeekly: 10.0,
    lctActivePercentWeekly: 5.0,
    hwyActivePercentWeekly: 3.0,
    fieldSupervisorActivePercentWeekly: 6.0,
    tcpChart: last7,
    lctChart: [28, 30, 32, 35, 36, 38, 38],
    hwyChart: [18, 19, 20, 21, 20, 22, 22],
    fieldSupervisorChart: [8, 9, 10, 11, 11, 12, 12],
    tcpActiveChart: [18, 20, 22, 21, 23, 24, 24],
    lctActiveChart: [12, 14, 15, 16, 17, 18, 18],
    hwyActiveChart: [6, 7, 8, 9, 9, 10, 10],
    fieldSupervisorActiveChart: [4, 5, 5, 6, 5, 6, 6],
    tcpChartWeekly: last4Weeks,
    lctChartWeekly: [220, 235, 210, 240],
    hwyChartWeekly: [140, 150, 145, 155],
    fieldSupervisorChartWeekly: [80, 85, 82, 88],
    tcpActiveChartWeekly: [180, 195, 190, 200],
    lctActiveChartWeekly: [120, 130, 125, 135],
    hwyActiveChartWeekly: [70, 75, 72, 78],
    fieldSupervisorActiveChartWeekly: [40, 42, 44, 45],
  };
}

/** Last 4 weeks (Mon–Sun) as "Week N\nJan 5 - Jan 11" for chart categories */
function getLastFourWeekCategoryLabels(ref: Dayjs): string[] {
  const thisMonday = getMonday(ref);
  return [1, 2, 3, 4].map((w) => {
    const weekStart = thisMonday.subtract(5 - w, 'week'); // Week 1 = 4w ago, Week 4 = 1w ago
    const weekEnd = weekStart.add(6, 'day');
    return `Week ${w}\n${weekStart.format('MMM D')} - ${weekEnd.format('MMM D')}`;
  });
}

export function JobDashboardView() {
  const searchParams = useSearchParams();
  const useMockData = searchParams.get('mock') === '1' || searchParams.get('demo') === '1';

  const [dashboardDate, setDashboardDate] = useState<Dayjs>(() => dayjs().startOf('day'));
  const [weeklyWeekStart, setWeeklyWeekStart] = useState<Dayjs>(() => getMonday(dayjs()));
  const [viewTab, setViewTab] = useState<DashboardViewTab>('available');
  const [activeViewMode, setActiveViewMode] = useState<ActiveViewMode>('by_employee');
  const [weeklySubTab, setWeeklySubTab] = useState<WeeklySubTab>('active');
  const [weeklySelectedDay, setWeeklySelectedDay] = useState<number | null>(null);

  const weeklyEndDate = useMemo(() => weeklyWeekStart.add(6, 'day'), [weeklyWeekStart]);

  type QuickWeekIndex = 1 | 2 | 3 | 4;
  const selectedQuickWeek = useMemo((): QuickWeekIndex | null => {
    const thisMonday = getMonday(dayjs());
    for (let n = 1; n <= 4; n += 1) {
      const weekMonday = thisMonday.subtract(4 - n, 'week');
      if (weeklyWeekStart.isSame(weekMonday, 'day')) return n as QuickWeekIndex;
    }
    return null;
  }, [weeklyWeekStart]);

  const setWeekByQuickIndex = (n: QuickWeekIndex) => {
    const thisMonday = getMonday(dayjs());
    setWeeklyWeekStart(thisMonday.subtract(4 - n, 'week'));
  };

  const theme = useTheme();

  const effectiveMetricsDate = useMemo(() => {
    if (viewTab === 'weekly') return weeklyWeekStart;
    return dashboardDate;
  }, [viewTab, dashboardDate, weeklyWeekStart]);

  const useWeekMetrics = viewTab === 'weekly';

  const { data, isLoading } = useQuery<DashboardMetrics>({
    queryKey: [
      'job-dashboard-metrics',
      effectiveMetricsDate.format('YYYY-MM-DD'),
      useWeekMetrics ? 'week' : 'day',
      useMockData ? 'mock' : 'api',
    ],
    queryFn: async () => {
      if (useMockData) return getMockDashboardMetrics();
      const dateParam = `date=${encodeURIComponent(effectiveMetricsDate.format('YYYY-MM-DD'))}`;
      const weekParam = useWeekMetrics
        ? `&weekStart=${encodeURIComponent(weeklyWeekStart.format('YYYY-MM-DD'))}`
        : '';
      const url = `${endpoints.work.jobDashboard}/metrics?${dateParam}${weekParam}`;
      const response = await fetcher(url);
      return response as DashboardMetrics;
    },
    enabled: !useMockData,
  });

  const metrics = useMockData
    ? getMockDashboardMetrics()
    : (isLoading ? null : data);

  if (!useMockData && isLoading) {
    return <LoadingScreen />;
  }

  const metricsDisplay = metrics || {
    tcpAvailable: 0,
    lctAvailable: 0,
    hwyAvailable: 0,
    fieldSupervisorAvailable: 0,
    tcpActive: 0,
    lctActive: 0,
    hwyActive: 0,
    fieldSupervisorActive: 0,
    tcpPercent: 0,
    lctPercent: 0,
    hwyPercent: 0,
    fieldSupervisorPercent: 0,
    tcpActivePercent: 0,
    lctActivePercent: 0,
    hwyActivePercent: 0,
    fieldSupervisorActivePercent: 0,
  };

  const getChartColor = (position: string) => {
    const color = getPositionColor(position);
    const paletteColor = theme.palette[color as keyof typeof theme.palette];
    return (typeof paletteColor === 'object' && paletteColor && 'main' in paletteColor
      ? (paletteColor as { main: string }).main
      : theme.palette.primary.main) as string;
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Job Dashboard"
        links={[
          { name: 'Work Management', href: paths.work.root },
          { name: 'Job', href: paths.work.job.root },
          { name: 'Dashboard' },
        ]}
        action={
          viewTab === 'weekly' ? (
            <Stack direction="column" alignItems="flex-end" gap={1.5}>
              <Stack direction="row" alignItems="center" gap={1.5}>
                <DatePicker
                  label="Start date"
                  value={weeklyWeekStart}
                  onChange={(newValue) => newValue && setWeeklyWeekStart(getMonday(newValue))}
                  format="MM/DD/YYYY ddd"
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 140 },
                    },
                  }}
                />
                <DatePicker
                  label="End date"
                  value={weeklyEndDate}
                  onChange={(newValue) => newValue && setWeeklyWeekStart(getMonday(newValue))}
                  format="MM/DD/YYYY ddd"
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 140 },
                    },
                  }}
                />
              </Stack>
              <ToggleButtonGroup
                value={selectedQuickWeek}
                exclusive
                onChange={(_, v: QuickWeekIndex | null) => v != null && setWeekByQuickIndex(v)}
                size="small"
                sx={{
                  '& .MuiToggleButtonGroup-grouped': { px: 1, py: 0.5 },
                  '& .MuiToggleButtonGroup-grouped.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                {([1, 2, 3, 4] as const).map((n) => (
                  <ToggleButton key={n} value={n} aria-label={`Week ${n}`}>
                    Week {n}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          ) : (
            <DatePicker
              label="View as of"
              value={dashboardDate}
              onChange={(newValue) => newValue && setDashboardDate(newValue.startOf('day'))}
              format="MM/DD/YYYY ddd"
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 180 },
                },
              }}
            />
          )
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs
        value={viewTab}
        onChange={(_, v: DashboardViewTab) => setViewTab(v)}
        sx={[
          (sxTheme) => ({
            mb: 2,
            px: 0,
            boxShadow: `inset 0 -2px 0 0 ${varAlpha(sxTheme.vars.palette.grey['500Channel'], 0.08)}`,
          }),
        ]}
      >
        <Tab value="available" label="Available" />
        <Tab value="active" label="Active" />
        <Tab value="weekly" label="Weekly" />
      </Tabs>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <JobWidgetSummary
            title={viewTab === 'weekly' ? `Weekly\n${weeklySubTab === 'available' ? 'TCP Available' : 'TCP Active'}` : viewTab === 'available' ? 'TCP Available' : 'TCP Active'}
            total={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metricsDisplay.tcpAvailable : metricsDisplay.tcpActive) : viewTab === 'available' ? metricsDisplay.tcpAvailable : metricsDisplay.tcpActive}
            percent={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metricsDisplay.tcpPercentWeekly : metricsDisplay.tcpActivePercentWeekly) : viewTab === 'available' ? metricsDisplay.tcpPercent : metricsDisplay.tcpActivePercent}
            periodLabel={viewTab === 'weekly' ? 'Last 4 weeks' : 'last 7 days'}
            trendInverted={viewTab === 'available' || (viewTab === 'weekly' && weeklySubTab === 'available')}
            chart={{
              categories: viewTab === 'weekly' ? getLastFourWeekCategoryLabels(dayjs()) : getLastSevenDaysCategoryLabels(dashboardDate),
              series: (viewTab === 'weekly' ? (weeklySubTab === 'available' ? metricsDisplay.tcpChartWeekly : metricsDisplay.tcpActiveChartWeekly) : viewTab === 'available' ? metricsDisplay.tcpChart : metricsDisplay.tcpActiveChart) || [],
              colors: [getChartColor('tcp')],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <JobWidgetSummary
            title={viewTab === 'weekly' ? `Weekly\n${weeklySubTab === 'available' ? 'LCT Available' : 'LCT Active'}` : viewTab === 'available' ? 'LCT Available' : 'LCT Active'}
            total={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metricsDisplay.lctAvailable : metricsDisplay.lctActive) : viewTab === 'available' ? metricsDisplay.lctAvailable : metricsDisplay.lctActive}
            percent={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metricsDisplay.lctPercentWeekly : metricsDisplay.lctActivePercentWeekly) : viewTab === 'available' ? metricsDisplay.lctPercent : metricsDisplay.lctActivePercent}
            periodLabel={viewTab === 'weekly' ? 'Last 4 weeks' : 'last 7 days'}
            trendInverted={viewTab === 'available' || (viewTab === 'weekly' && weeklySubTab === 'available')}
            titleTooltip={
              viewTab === 'available' || (viewTab === 'weekly' && weeklySubTab === 'available')
                ? 'LCT/TCP numbers are included as LCT.'
                : undefined
            }
            chart={{
              categories: viewTab === 'weekly' ? getLastFourWeekCategoryLabels(dayjs()) : getLastSevenDaysCategoryLabels(dashboardDate),
              series: (viewTab === 'weekly' ? (weeklySubTab === 'available' ? metricsDisplay.lctChartWeekly : metricsDisplay.lctActiveChartWeekly) : viewTab === 'available' ? metricsDisplay.lctChart : metricsDisplay.lctActiveChart) || [],
              colors: [getChartColor('lct')],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <JobWidgetSummary
            title={viewTab === 'weekly' ? `Weekly\n${weeklySubTab === 'available' ? 'HWY Available' : 'HWY Active'}` : viewTab === 'available' ? 'HWY Available' : 'HWY Active'}
            total={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metricsDisplay.hwyAvailable : metricsDisplay.hwyActive) : viewTab === 'available' ? metricsDisplay.hwyAvailable : metricsDisplay.hwyActive}
            percent={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metricsDisplay.hwyPercentWeekly : metricsDisplay.hwyActivePercentWeekly) : viewTab === 'available' ? metricsDisplay.hwyPercent : metricsDisplay.hwyActivePercent}
            periodLabel={viewTab === 'weekly' ? 'Last 4 weeks' : 'last 7 days'}
            trendInverted={viewTab === 'available' || (viewTab === 'weekly' && weeklySubTab === 'available')}
            chart={{
              categories: viewTab === 'weekly' ? getLastFourWeekCategoryLabels(dayjs()) : getLastSevenDaysCategoryLabels(dashboardDate),
              series: (viewTab === 'weekly' ? (weeklySubTab === 'available' ? metricsDisplay.hwyChartWeekly : metricsDisplay.hwyActiveChartWeekly) : viewTab === 'available' ? metricsDisplay.hwyChart : metricsDisplay.hwyActiveChart) || [],
              colors: [getChartColor('hwy')],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <JobWidgetSummary
            title={viewTab === 'weekly' ? `Weekly\n${weeklySubTab === 'available' ? 'Field Supervisor Available' : 'Field Supervisor Active'}` : viewTab === 'available' ? 'Field Supervisor Available' : 'Field Supervisor Active'}
            total={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metricsDisplay.fieldSupervisorAvailable : metricsDisplay.fieldSupervisorActive) : viewTab === 'available' ? metricsDisplay.fieldSupervisorAvailable : metricsDisplay.fieldSupervisorActive}
            percent={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metricsDisplay.fieldSupervisorPercentWeekly : metricsDisplay.fieldSupervisorActivePercentWeekly) : viewTab === 'available' ? metricsDisplay.fieldSupervisorPercent : metricsDisplay.fieldSupervisorActivePercent}
            periodLabel={viewTab === 'weekly' ? 'Last 4 weeks' : 'last 7 days'}
            trendInverted={viewTab === 'available' || (viewTab === 'weekly' && weeklySubTab === 'available')}
            chart={{
              categories: viewTab === 'weekly' ? getLastFourWeekCategoryLabels(dayjs()) : getLastSevenDaysCategoryLabels(dashboardDate),
              series: (viewTab === 'weekly' ? (weeklySubTab === 'available' ? metricsDisplay.fieldSupervisorChartWeekly : metricsDisplay.fieldSupervisorActiveChartWeekly) : viewTab === 'available' ? metricsDisplay.fieldSupervisorChart : metricsDisplay.fieldSupervisorActiveChart) || [],
              colors: [getChartColor('field_supervisor')],
            }}
          />
        </Grid>

        {viewTab === 'weekly' ? (
          <>
            <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
              <Card>
                <JobDashboardWeeklyViewDayToolbar
                  weekStart={weeklyWeekStart}
                  mode={weeklySubTab}
                  onModeChange={setWeeklySubTab}
                  activeViewMode={activeViewMode}
                  onActiveViewModeChange={setActiveViewMode}
                  selectedDay={weeklySelectedDay}
                  onDayChange={setWeeklySelectedDay}
                />
              </Card>
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              {weeklySubTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable
                  asOf={weeklySelectedDay !== null ? weeklyWeekStart.add(weeklySelectedDay, 'day') : undefined}
                  weekStart={weeklySelectedDay === null ? weeklyWeekStart : undefined}
                  region="Metro Vancouver"
                  title="Metro Vancouver"
                  useMockData={useMockData}
                />
              ) : (
                <JobDashboardWeeklyTable
                  weekStart={weeklyWeekStart}
                  mode={weeklySubTab}
                  onModeChange={setWeeklySubTab}
                  selectedDay={weeklySelectedDay}
                  onDayChange={setWeeklySelectedDay}
                  region="Metro Vancouver"
                  hideViewDayToolbar
                  title="Metro Vancouver"
                  useMockData={useMockData}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              {weeklySubTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable
                  asOf={weeklySelectedDay !== null ? weeklyWeekStart.add(weeklySelectedDay, 'day') : undefined}
                  weekStart={weeklySelectedDay === null ? weeklyWeekStart : undefined}
                  region="Vancouver Island"
                  title="Vancouver Island"
                  useMockData={useMockData}
                />
              ) : (
                <JobDashboardWeeklyTable
                  weekStart={weeklyWeekStart}
                  mode={weeklySubTab}
                  onModeChange={setWeeklySubTab}
                  selectedDay={weeklySelectedDay}
                  onDayChange={setWeeklySelectedDay}
                  region="Vancouver Island"
                  hideViewDayToolbar
                  title="Vancouver Island"
                  useMockData={useMockData}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              {weeklySubTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable
                  asOf={weeklySelectedDay !== null ? weeklyWeekStart.add(weeklySelectedDay, 'day') : undefined}
                  weekStart={weeklySelectedDay === null ? weeklyWeekStart : undefined}
                  region="Interior BC"
                  title="Interior BC"
                  useMockData={useMockData}
                />
              ) : (
                <JobDashboardWeeklyTable
                  weekStart={weeklyWeekStart}
                  mode={weeklySubTab}
                  onModeChange={setWeeklySubTab}
                  selectedDay={weeklySelectedDay}
                  onDayChange={setWeeklySelectedDay}
                  region="Interior BC"
                  hideViewDayToolbar
                  title="Interior BC"
                  useMockData={useMockData}
                />
              )}
            </Grid>
          </>
        ) : (
          <>
            {viewTab === 'active' && (
              <Grid size={{ xs: 12 }} sx={{ mt: 1, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                  View
                </Typography>
                <ToggleButtonGroup
                  value={activeViewMode}
                  exclusive
                  onChange={(_, v: ActiveViewMode | null) => v != null && setActiveViewMode(v)}
                  size="small"
                  sx={{
                    '& .MuiToggleButtonGroup-grouped': { px: 1.5, py: 0.5 },
                    '& .MuiToggleButtonGroup-grouped.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ToggleButton value="by_employee">By Employee</ToggleButton>
                  <ToggleButton value="by_job">By Job</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            )}
            <Grid size={{ xs: 12 }} sx={{ mt: viewTab === 'active' ? 0 : 1 }}>
              {viewTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable asOf={dashboardDate} region="Metro Vancouver" title="Metro Vancouver" useMockData={useMockData} />
              ) : (
                <JobDashboardAvailableTable
                  asOf={dashboardDate}
                  mode={viewTab}
                  region="Metro Vancouver"
                  title="Metro Vancouver"
                  useMockData={useMockData}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              {viewTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable asOf={dashboardDate} region="Vancouver Island" title="Vancouver Island" useMockData={useMockData} />
              ) : (
                <JobDashboardAvailableTable
                  asOf={dashboardDate}
                  mode={viewTab}
                  region="Vancouver Island"
                  title="Vancouver Island"
                  useMockData={useMockData}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              {viewTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable asOf={dashboardDate} region="Interior BC" title="Interior BC" useMockData={useMockData} />
              ) : (
                <JobDashboardAvailableTable
                  asOf={dashboardDate}
                  mode={viewTab}
                  region="Interior BC"
                  title="Interior BC"
                  useMockData={useMockData}
                />
              )}
            </Grid>
          </>
        )}

        <Grid size={{ xs: 12 }}>
          <JobDashboardCommentSections
            viewTab={viewTab}
            weekStart={viewTab === 'weekly' ? weeklyWeekStart : undefined}
            selectedDay={viewTab === 'weekly' ? weeklySelectedDay : undefined}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
