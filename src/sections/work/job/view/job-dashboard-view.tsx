import type { Dayjs } from 'dayjs';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';

import { DashboardContent } from 'src/layouts/dashboard';
import { fetcher, endpoints } from 'src/lib/axios';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { LoadingScreen } from 'src/components/loading-screen';

import { paths } from 'src/routes/paths';
import { getPositionColor } from 'src/utils/format-role';

import {
  JobWidgetSummary,
  JobDashboardAvailableTable,
  JobDashboardActiveByJobTable,
  JobDashboardWeeklyTable,
  JobDashboardWeeklyViewDayToolbar,
  JobDashboardCommentSections,
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
  const [dashboardDate, setDashboardDate] = useState<Dayjs>(() => dayjs().startOf('day'));
  const [weeklyWeekStart, setWeeklyWeekStart] = useState<Dayjs>(() => getMonday(dayjs()));
  const [viewTab, setViewTab] = useState<DashboardViewTab>('available');
  const [activeViewMode, setActiveViewMode] = useState<ActiveViewMode>('by_employee');
  const [weeklySubTab, setWeeklySubTab] = useState<WeeklySubTab>('active');
  const [weeklySelectedDay, setWeeklySelectedDay] = useState<number | null>(null);

  const weeklyEndDate = useMemo(() => weeklyWeekStart.add(6, 'day'), [weeklyWeekStart]);

  const setWeekByQuickIndex = (n: 1 | 2 | 3 | 4) => {
    const thisMonday = getMonday(dayjs());
    setWeeklyWeekStart(thisMonday.subtract(4 - n, 'week'));
  };

  // TODO: Replace with real API call once backend is ready. Pass dashboardDate when ready:
  // e.g. fetcher(endpoints.work.jobDashboard, { params: { date: dashboardDate.format('YYYY-MM-DD') } })
  const { data, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['job-dashboard-metrics', dashboardDate.format('YYYY-MM-DD')],
    queryFn: async () => {
      // Mock data for visual testing
      // Uncomment below and remove mock data when backend is ready:
      // const response = await fetcher(endpoints.work.jobDashboard, {
      //   params: { date: dashboardDate.format('YYYY-MM-DD') },
      // });
      // return response;
      
      // Mock data - remove this when backend is ready
      return new Promise<DashboardMetrics>((resolve) => {
        setTimeout(() => {
          resolve({
            tcpAvailable: 24,
            lctAvailable: 18,
            hwyAvailable: 12,
            fieldSupervisorAvailable: 8,
            tcpActive: 12,
            lctActive: 9,
            hwyActive: 6,
            fieldSupervisorActive: 4,
            tcpPercent: 2.6,
            lctPercent: -1.2,
            hwyPercent: 5.3,
            fieldSupervisorPercent: 0.8,
            tcpActivePercent: 1.2,
            lctActivePercent: -0.5,
            hwyActivePercent: 3.1,
            fieldSupervisorActivePercent: 0.4,
            tcpChart: [15, 18, 12, 20, 24, 22, 24],
            lctChart: [20, 19, 18, 17, 18, 19, 18],
            hwyChart: [10, 11, 12, 11, 12, 13, 12],
            fieldSupervisorChart: [7, 8, 7, 8, 8, 8, 8],
            tcpActiveChart: [10, 11, 12, 11, 12, 12, 12],
            lctActiveChart: [8, 9, 9, 8, 9, 9, 9],
            hwyActiveChart: [5, 6, 5, 6, 6, 6, 6],
            fieldSupervisorActiveChart: [3, 4, 4, 4, 4, 4, 4],
            chartCategories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            chartCategoriesWeekly: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
            tcpChartWeekly: [18, 20, 22, 24],
            lctChartWeekly: [17, 18, 18, 18],
            hwyChartWeekly: [11, 12, 12, 12],
            fieldSupervisorChartWeekly: [7, 8, 8, 8],
            tcpActiveChartWeekly: [10, 11, 12, 12],
            lctActiveChartWeekly: [8, 9, 9, 9],
            hwyActiveChartWeekly: [5, 6, 6, 6],
            fieldSupervisorActiveChartWeekly: [3, 4, 4, 4],
          });
        }, 500); // Simulate API delay
      });
    },
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  const metrics = data || {
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

  const theme = useTheme();

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
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 140 },
                    },
                  }}
                />
              </Stack>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {([1, 2, 3, 4] as const).map((n) => (
                  <Button
                    key={n}
                    size="small"
                    variant="contained"
                    onClick={() => setWeekByQuickIndex(n)}
                    sx={{ minWidth: 0, px: 1 }}
                  >
                    Week {n}
                  </Button>
                ))}
              </Box>
            </Stack>
          ) : (
            <DatePicker
              label="View as of"
              value={dashboardDate}
              onChange={(newValue) => newValue && setDashboardDate(newValue.startOf('day'))}
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
          (theme) => ({
            mb: 2,
            px: 0,
            boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
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
            title={viewTab === 'weekly' ? (weeklySubTab === 'available' ? 'TCP Available' : 'TCP Active') : viewTab === 'available' ? 'TCP Available' : 'TCP Active'}
            total={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metrics.tcpAvailable : metrics.tcpActive) : viewTab === 'available' ? metrics.tcpAvailable : metrics.tcpActive}
            percent={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metrics.tcpPercent : metrics.tcpActivePercent) : viewTab === 'available' ? metrics.tcpPercent : metrics.tcpActivePercent}
            periodLabel={viewTab === 'weekly' ? 'Last 4 weeks' : undefined}
            chart={{
              categories: viewTab === 'weekly' ? getLastFourWeekCategoryLabels(dayjs()) : getLastSevenDaysCategoryLabels(dashboardDate),
              series: (viewTab === 'weekly' ? (weeklySubTab === 'available' ? metrics.tcpChartWeekly : metrics.tcpActiveChartWeekly) : viewTab === 'available' ? metrics.tcpChart : metrics.tcpActiveChart) || [],
              colors: [getChartColor('tcp')],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <JobWidgetSummary
            title={viewTab === 'weekly' ? (weeklySubTab === 'available' ? 'LCT Available' : 'LCT Active') : viewTab === 'available' ? 'LCT Available' : 'LCT Active'}
            total={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metrics.lctAvailable : metrics.lctActive) : viewTab === 'available' ? metrics.lctAvailable : metrics.lctActive}
            percent={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metrics.lctPercent : metrics.lctActivePercent) : viewTab === 'available' ? metrics.lctPercent : metrics.lctActivePercent}
            periodLabel={viewTab === 'weekly' ? 'Last 4 weeks' : undefined}
            chart={{
              categories: viewTab === 'weekly' ? getLastFourWeekCategoryLabels(dayjs()) : getLastSevenDaysCategoryLabels(dashboardDate),
              series: (viewTab === 'weekly' ? (weeklySubTab === 'available' ? metrics.lctChartWeekly : metrics.lctActiveChartWeekly) : viewTab === 'available' ? metrics.lctChart : metrics.lctActiveChart) || [],
              colors: [getChartColor('lct')],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <JobWidgetSummary
            title={viewTab === 'weekly' ? (weeklySubTab === 'available' ? 'HWY Available' : 'HWY Active') : viewTab === 'available' ? 'HWY Available' : 'HWY Active'}
            total={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metrics.hwyAvailable : metrics.hwyActive) : viewTab === 'available' ? metrics.hwyAvailable : metrics.hwyActive}
            percent={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metrics.hwyPercent : metrics.hwyActivePercent) : viewTab === 'available' ? metrics.hwyPercent : metrics.hwyActivePercent}
            periodLabel={viewTab === 'weekly' ? 'Last 4 weeks' : undefined}
            chart={{
              categories: viewTab === 'weekly' ? getLastFourWeekCategoryLabels(dayjs()) : getLastSevenDaysCategoryLabels(dashboardDate),
              series: (viewTab === 'weekly' ? (weeklySubTab === 'available' ? metrics.hwyChartWeekly : metrics.hwyActiveChartWeekly) : viewTab === 'available' ? metrics.hwyChart : metrics.hwyActiveChart) || [],
              colors: [getChartColor('hwy')],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <JobWidgetSummary
            title={viewTab === 'weekly' ? (weeklySubTab === 'available' ? 'Field Supervisor Available' : 'Field Supervisor Active') : viewTab === 'available' ? 'Field Supervisor Available' : 'Field Supervisor Active'}
            total={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metrics.fieldSupervisorAvailable : metrics.fieldSupervisorActive) : viewTab === 'available' ? metrics.fieldSupervisorAvailable : metrics.fieldSupervisorActive}
            percent={viewTab === 'weekly' ? (weeklySubTab === 'available' ? metrics.fieldSupervisorPercent : metrics.fieldSupervisorActivePercent) : viewTab === 'available' ? metrics.fieldSupervisorPercent : metrics.fieldSupervisorActivePercent}
            periodLabel={viewTab === 'weekly' ? 'Last 4 weeks' : undefined}
            chart={{
              categories: viewTab === 'weekly' ? getLastFourWeekCategoryLabels(dayjs()) : getLastSevenDaysCategoryLabels(dashboardDate),
              series: (viewTab === 'weekly' ? (weeklySubTab === 'available' ? metrics.fieldSupervisorChartWeekly : metrics.fieldSupervisorActiveChartWeekly) : viewTab === 'available' ? metrics.fieldSupervisorChart : metrics.fieldSupervisorActiveChart) || [],
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
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Metro Vancouver
              </Typography>
              {weeklySubTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable asOf={dashboardDate} region="Metro Vancouver" />
              ) : (
                <JobDashboardWeeklyTable
                weekStart={weeklyWeekStart}
                mode={weeklySubTab}
                onModeChange={setWeeklySubTab}
                selectedDay={weeklySelectedDay}
                onDayChange={setWeeklySelectedDay}
                region="Metro Vancouver"
                hideViewDayToolbar
              />
              )}
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Vancouver Island
              </Typography>
              {weeklySubTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable asOf={dashboardDate} region="Vancouver Island" />
              ) : (
                <JobDashboardWeeklyTable
                  weekStart={weeklyWeekStart}
                  mode={weeklySubTab}
                  onModeChange={setWeeklySubTab}
                  selectedDay={weeklySelectedDay}
                  onDayChange={setWeeklySelectedDay}
                  region="Vancouver Island"
                  hideViewDayToolbar
                />
              )}
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Interior BC
              </Typography>
              {weeklySubTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable asOf={dashboardDate} region="Interior BC" />
              ) : (
                <JobDashboardWeeklyTable
                  weekStart={weeklyWeekStart}
                  mode={weeklySubTab}
                  onModeChange={setWeeklySubTab}
                  selectedDay={weeklySelectedDay}
                  onDayChange={setWeeklySelectedDay}
                  region="Interior BC"
                  hideViewDayToolbar
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
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Metro Vancouver
              </Typography>
              {viewTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable asOf={dashboardDate} region="Metro Vancouver" />
              ) : (
                <JobDashboardAvailableTable
                  asOf={dashboardDate}
                  mode={viewTab}
                  region="Metro Vancouver"
                />
              )}
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Vancouver Island
              </Typography>
              {viewTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable asOf={dashboardDate} region="Vancouver Island" />
              ) : (
                <JobDashboardAvailableTable
                  asOf={dashboardDate}
                  mode={viewTab}
                  region="Vancouver Island"
                />
              )}
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Interior BC
              </Typography>
              {viewTab === 'active' && activeViewMode === 'by_job' ? (
                <JobDashboardActiveByJobTable asOf={dashboardDate} region="Interior BC" />
              ) : (
                <JobDashboardAvailableTable
                  asOf={dashboardDate}
                  mode={viewTab}
                  region="Interior BC"
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
