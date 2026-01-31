import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';

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

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { getPositionColor } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

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
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dashboardDate, setDashboardDate] = useState<Dayjs>(() => {
    const d = searchParams.get('date');
    return d ? dayjs(d).startOf('day') : dayjs().startOf('day');
  });
  const [weeklyWeekStart, setWeeklyWeekStart] = useState<Dayjs>(() => {
    const w = searchParams.get('weekStart');
    return w ? dayjs(w).startOf('day') : getMonday(dayjs());
  });
  const [viewTab, setViewTab] = useState<DashboardViewTab>(
    () => (searchParams.get('tab') as DashboardViewTab) || 'available'
  );
  const [activeViewMode, setActiveViewMode] = useState<ActiveViewMode>(
    () => (searchParams.get('viewMode') as ActiveViewMode) || 'by_employee'
  );
  const [weeklySubTab, setWeeklySubTab] = useState<WeeklySubTab>(
    () => (searchParams.get('weeklySubTab') as WeeklySubTab) || 'active'
  );
  const [weeklySelectedDay, setWeeklySelectedDay] = useState<number | null>(() => {
    const d = searchParams.get('weeklyDay');
    if (d === '' || d === null || d === undefined) return null;
    const n = parseInt(d, 10);
    return Number.isNaN(n) || n < 0 || n > 6 ? null : n;
  });

  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    params.set('tab', viewTab);
    params.set('date', dashboardDate.format('YYYY-MM-DD'));
    params.set('weekStart', weeklyWeekStart.format('YYYY-MM-DD'));
    params.set('viewMode', activeViewMode);
    params.set('weeklySubTab', weeklySubTab);
    if (weeklySelectedDay !== null) params.set('weeklyDay', String(weeklySelectedDay));
    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [viewTab, dashboardDate, weeklyWeekStart, activeViewMode, weeklySubTab, weeklySelectedDay, router]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

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

  const { data, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: [
      'job-dashboard-metrics',
      effectiveMetricsDate.format('YYYY-MM-DD'),
      useWeekMetrics ? 'week' : 'day',
    ],
    queryFn: async () => {
      const dateParam = `date=${encodeURIComponent(effectiveMetricsDate.format('YYYY-MM-DD'))}`;
      const weekParam = useWeekMetrics
        ? `&weekStart=${encodeURIComponent(weeklyWeekStart.format('YYYY-MM-DD'))}`
        : '';
      const url = `${endpoints.work.jobDashboard}/metrics?${dateParam}${weekParam}`;
      const response = await fetcher(url);
      return response as DashboardMetrics;
    },
    staleTime: 60 * 1000,
  });

  const metricsDisplay = data || {
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
            isLoading={metricsLoading}
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
            isLoading={metricsLoading}
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
            isLoading={metricsLoading}
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
            isLoading={metricsLoading}
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
                <JobDashboardActiveByJobTable asOf={dashboardDate} region="Metro Vancouver" title="Metro Vancouver" />
              ) : (
                <JobDashboardAvailableTable
                  key="available-metro-vancouver"
                  asOf={dashboardDate}
                  mode={viewTab}
                  region="Metro Vancouver"
                  title="Metro Vancouver"
                />
              )}
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              {viewTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable asOf={dashboardDate} region="Vancouver Island" title="Vancouver Island" />
              ) : (
                <JobDashboardAvailableTable
                  key="available-vancouver-island"
                  asOf={dashboardDate}
                  mode={viewTab}
                  region="Vancouver Island"
                  title="Vancouver Island"
                />
              )}
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              {viewTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable asOf={dashboardDate} region="Interior BC" title="Interior BC" />
              ) : (
                <JobDashboardAvailableTable
                  key="available-interior-bc"
                  asOf={dashboardDate}
                  mode={viewTab}
                  region="Interior BC"
                  title="Interior BC"
                />
              )}
            </Grid>
          </>
        )}

        <Grid size={{ xs: 12 }}>
          <JobDashboardCommentSections
            viewTab={viewTab}
            dashboardDate={dashboardDate}
            weekStart={viewTab === 'weekly' ? weeklyWeekStart : undefined}
            selectedDay={viewTab === 'weekly' ? weeklySelectedDay : undefined}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
