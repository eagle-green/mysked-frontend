import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { JobWidgetSummary } from 'src/sections/work/job/components';

import {
  VehicleDashboardRegionTable,
  VehicleDashboardActiveByJobTable,
} from '../components';
import {
  type VehicleActiveViewMode,
  type VehicleWeeklyTableMode,
  type VehicleWeeklySelectedDay,
  VehicleDashboardWeeklyViewDayToolbar,
} from '../components/vehicle-dashboard-weekly-toolbar';

// ----------------------------------------------------------------------

/** Monday of the week containing d (week = Mon–Sun) */
function getMonday(d: Dayjs): Dayjs {
  return d.day() === 0
    ? d.subtract(6, 'day').startOf('day')
    : d.startOf('week').add(1, 'day').startOf('day');
}

type VehicleDashboardViewTab = 'available' | 'active' | 'weekly';

type VehicleDashboardMetrics = {
  lctAvailable: number;
  hwyAvailable: number;
  lctActive?: number;
  hwyActive?: number;
  chartCategories?: string[];
  lctChartSeries?: number[];
  hwyChartSeries?: number[];
  /** Active per day (last 7 days) when metrics requested by date only */
  lctActiveChartSeries?: number[];
  hwyActiveChartSeries?: number[];
  lctAvailablePercent?: number;
  hwyAvailablePercent?: number;
};

export function VehicleDashboardView() {
  const theme = useTheme();
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
  const [viewTab, setViewTab] = useState<VehicleDashboardViewTab>(
    () => (searchParams.get('tab') as VehicleDashboardViewTab) || 'available'
  );
  const [activeViewMode, setActiveViewMode] = useState<VehicleActiveViewMode>(
    () => (searchParams.get('viewMode') as VehicleActiveViewMode) || 'by_vehicle'
  );
  const [weeklySubTab, setWeeklySubTab] = useState<VehicleWeeklyTableMode>(
    () => (searchParams.get('weeklySubTab') as VehicleWeeklyTableMode) || 'active'
  );
  const [weeklySelectedDay, setWeeklySelectedDay] = useState<VehicleWeeklySelectedDay>(() => {
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

  const weeklyEndDate = weeklyWeekStart.add(6, 'day');

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

  // For weekly view, if a specific day is selected, use that day's metrics instead of the whole week
  const effectiveMetricsDate = viewTab === 'weekly' 
    ? (weeklySelectedDay !== null ? weeklyWeekStart.add(weeklySelectedDay, 'day') : weeklyWeekStart)
    : dashboardDate;
  // Use week metrics when in weekly tab and no specific day is selected (for both Available and Active)
  const useWeekMetrics = viewTab === 'weekly' && weeklySelectedDay === null;
  const metricsQueryKey = useWeekMetrics
    ? ['vehicle-dashboard-metrics', 'week', weeklyWeekStart.format('YYYY-MM-DD'), weeklySubTab]
    : ['vehicle-dashboard-metrics', effectiveMetricsDate.format('YYYY-MM-DD'), weeklySelectedDay];
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: metricsQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (useWeekMetrics) {
        params.set('weekStart', weeklyWeekStart.format('YYYY-MM-DD'));
      } else {
        params.set('date', effectiveMetricsDate.format('YYYY-MM-DD'));
      }
      const url = `${endpoints.management.vehicleDashboard}/metrics?${params.toString()}`;
      const response = await fetcher(url);
      return response as VehicleDashboardMetrics;
    },
    staleTime: 60 * 1000,
  });

  const lctAvailable = metrics?.lctAvailable ?? 0;
  const hwyAvailable = metrics?.hwyAvailable ?? 0;
  const lctActive = metrics?.lctActive ?? 0;
  const hwyActive = metrics?.hwyActive ?? 0;
  const lctAvailablePercent = metrics?.lctAvailablePercent ?? 0;
  const hwyAvailablePercent = metrics?.hwyAvailablePercent ?? 0;
  const showActiveCounts = viewTab === 'active' || (viewTab === 'weekly' && weeklySubTab === 'active');
  const isLoading = isLoadingMetrics;
  const primaryColor = theme.palette.primary.main;
  const errorColor = theme.palette.error.main;
  const chartCategories = metrics?.chartCategories ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const lctChartSeries = metrics?.lctChartSeries ?? [];
  const hwyChartSeries = metrics?.hwyChartSeries ?? [];
  const lctActiveChartSeries = metrics?.lctActiveChartSeries ?? [];
  const hwyActiveChartSeries = metrics?.hwyActiveChartSeries ?? [];

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Vehicle Dashboard"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Vehicle', href: paths.management.vehicle.list },
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
        onChange={(_, v: VehicleDashboardViewTab) => setViewTab(v)}
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
        {/* LCT: Available tab = available count + chart; Active tab = active count + active chart (last 7 days); Weekly+Active = active count + active chart (week days). */}
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <JobWidgetSummary
            isLoading={isLoading}
            title={showActiveCounts ? 'LCT Active' : 'LCT Available'}
            total={showActiveCounts ? lctActive : lctAvailable}
            percent={showActiveCounts ? undefined : lctAvailablePercent}
            trendInverted={!showActiveCounts}
            chart={
              showActiveCounts
                ? (useWeekMetrics ? { colors: [primaryColor], categories: chartCategories, series: lctChartSeries } : { colors: [primaryColor], categories: chartCategories, series: lctActiveChartSeries })
                : { colors: [primaryColor], categories: chartCategories, series: lctChartSeries }
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <JobWidgetSummary
            isLoading={isLoading}
            title={showActiveCounts ? 'HWY Active' : 'HWY Available'}
            total={showActiveCounts ? hwyActive : hwyAvailable}
            percent={showActiveCounts ? undefined : hwyAvailablePercent}
            trendInverted={!showActiveCounts}
            chart={
              showActiveCounts
                ? (useWeekMetrics ? { colors: [errorColor], categories: chartCategories, series: hwyChartSeries } : { colors: [errorColor], categories: chartCategories, series: hwyActiveChartSeries })
                : { colors: [errorColor], categories: chartCategories, series: hwyChartSeries }
            }
          />
        </Grid>

        {viewTab === 'active' && (
          <Grid size={{ xs: 12 }} sx={{ mt: 1, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
              View
            </Typography>
            <ToggleButtonGroup
              value={activeViewMode}
              exclusive
              onChange={(_, v: VehicleActiveViewMode | null) => v != null && setActiveViewMode(v)}
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
              <ToggleButton value="by_vehicle">By Vehicle</ToggleButton>
              <ToggleButton value="by_job">By Job</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        )}

        {viewTab === 'weekly' ? (
          <>
            <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
              <Card>
                <VehicleDashboardWeeklyViewDayToolbar
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
            {weeklySubTab === 'active' && activeViewMode === 'by_job' ? (
              <>
                <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                  <VehicleDashboardActiveByJobTable
                    key="vehicle-active-by-job-metro-vancouver-weekly"
                    region="Metro Vancouver"
                    title="Metro Vancouver"
                    asOf={weeklySelectedDay != null ? weeklyWeekStart.add(weeklySelectedDay, 'day') : undefined}
                    weekStart={weeklySelectedDay == null ? weeklyWeekStart : undefined}
                  />
                </Grid>
                <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
                  <VehicleDashboardActiveByJobTable
                    key="vehicle-active-by-job-vancouver-island-weekly"
                    region="Vancouver Island"
                    title="Vancouver Island"
                    asOf={weeklySelectedDay != null ? weeklyWeekStart.add(weeklySelectedDay, 'day') : undefined}
                    weekStart={weeklySelectedDay == null ? weeklyWeekStart : undefined}
                  />
                </Grid>
                <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
                  <VehicleDashboardActiveByJobTable
                    key="vehicle-active-by-job-interior-bc-weekly"
                    region="Interior BC"
                    title="Interior BC"
                    asOf={weeklySelectedDay != null ? weeklyWeekStart.add(weeklySelectedDay, 'day') : undefined}
                    weekStart={weeklySelectedDay == null ? weeklyWeekStart : undefined}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                  <VehicleDashboardRegionTable
                    key={`vehicle-region-metro-vancouver-${viewTab}-${weeklySubTab}`}
                    region="Metro Vancouver"
                    title="Metro Vancouver"
                    viewTab={viewTab}
                    activeViewMode={activeViewMode}
                    weeklySubTab={weeklySubTab}
                    weeklySelectedDay={weeklySelectedDay}
                    dashboardDate={dashboardDate}
                    weeklyWeekStart={weeklyWeekStart}
                  />
                </Grid>
                <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
                  <VehicleDashboardRegionTable
                    key={`vehicle-region-vancouver-island-${viewTab}-${weeklySubTab}`}
                    region="Vancouver Island"
                    title="Vancouver Island"
                    viewTab={viewTab}
                    activeViewMode={activeViewMode}
                    weeklySubTab={weeklySubTab}
                    weeklySelectedDay={weeklySelectedDay}
                    dashboardDate={dashboardDate}
                    weeklyWeekStart={weeklyWeekStart}
                  />
                </Grid>
                <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
                  <VehicleDashboardRegionTable
                    key={`vehicle-region-interior-bc-${viewTab}-${weeklySubTab}`}
                    region="Interior BC"
                    title="Interior BC"
                    viewTab={viewTab}
                    activeViewMode={activeViewMode}
                    weeklySubTab={weeklySubTab}
                    weeklySelectedDay={weeklySelectedDay}
                    dashboardDate={dashboardDate}
                    weeklyWeekStart={weeklyWeekStart}
                  />
                </Grid>
              </>
            )}
          </>
        ) : viewTab === 'active' && activeViewMode === 'by_job' ? (
          <>
            <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
              <VehicleDashboardActiveByJobTable key="vehicle-active-by-job-metro-vancouver" region="Metro Vancouver" title="Metro Vancouver" asOf={dashboardDate} />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <VehicleDashboardActiveByJobTable key="vehicle-active-by-job-vancouver-island" region="Vancouver Island" title="Vancouver Island" asOf={dashboardDate} />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <VehicleDashboardActiveByJobTable key="vehicle-active-by-job-interior-bc" region="Interior BC" title="Interior BC" asOf={dashboardDate} />
            </Grid>
          </>
        ) : (
          <>
            <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
              <VehicleDashboardRegionTable
                key={`vehicle-region-metro-vancouver-${viewTab}`}
                region="Metro Vancouver"
                title="Metro Vancouver"
                viewTab={viewTab}
                activeViewMode={activeViewMode}
                dashboardDate={dashboardDate}
                weeklyWeekStart={weeklyWeekStart}
              />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <VehicleDashboardRegionTable
                key={`vehicle-region-vancouver-island-${viewTab}`}
                region="Vancouver Island"
                title="Vancouver Island"
                viewTab={viewTab}
                activeViewMode={activeViewMode}
                dashboardDate={dashboardDate}
                weeklyWeekStart={weeklyWeekStart}
              />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <VehicleDashboardRegionTable
                key={`vehicle-region-interior-bc-${viewTab}`}
                region="Interior BC"
                title="Interior BC"
                viewTab={viewTab}
                activeViewMode={activeViewMode}
                dashboardDate={dashboardDate}
                weeklyWeekStart={weeklyWeekStart}
              />
            </Grid>
          </>
        )}
      </Grid>
    </DashboardContent>
  );
}
