import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { JobDetailsDialog } from 'src/sections/work/calendar/job-details-dialog';

import { TimeOffDetailsDialog } from '../time-off-details-dialog';
import { AttendanceConductReportDetailDialog } from '../attendance-conduct-report-detail-dialog';
import { AttendanceConductDashboardTopWorkers } from '../attendance-conduct-dashboard-top-workers';
import { AttendanceConductDashboardCurrentVisits } from '../attendance-conduct-dashboard-current-visits';
import { AttendanceConductDashboardWebsiteVisits } from '../attendance-conduct-dashboard-website-visits';
import { AttendanceConductDashboardRecentReports } from '../attendance-conduct-dashboard-recent-reports';
import { INCIDENT_ACTIVITY_LABELS, getIncidentActivityColors } from '../attendance-conduct-data-activity';

import type { TimeOffDetailsRequest } from '../time-off-details-dialog';
import type { ReportDetail } from '../attendance-conduct-report-detail-dialog';
import type { TopWorkerRow } from '../attendance-conduct-dashboard-top-workers';
import type { RecentReportItem } from '../attendance-conduct-dashboard-recent-reports';

// ----------------------------------------------------------------------

/** Category keys in same order as Incident activity (No Show → Verbal Warnings / Write Up). */
const INCIDENT_ACTIVITY_ORDER = [
  'noShowUnpaid',
  'refusalOfShifts',
  'sentHomeNoPpe',
  'leftEarlyNoNotice',
  'lateOnSite',
  'unapprovedDaysOffShortNotice',
  'calledInSick',
  'unauthorizedDriving',
  'drivingInfractions',
  'verbalWarningsWriteUp',
];

/** Conduct (score-impact) categories for "Incidents (affects score)" filter. */
const CONDUCT_CATEGORIES = [...INCIDENT_ACTIVITY_ORDER];

/** Category display labels (for Report distribution and dialogs). */
const CATEGORY_LABELS: Record<string, string> = {
  noShowUnpaid: 'No Show (Unpaid)',
  refusalOfShifts: 'Refusal of shift',
  sentHomeNoPpe: 'Sent home from site (No PPE)',
  leftEarlyNoNotice: 'Left Early No Notice',
  lateOnSite: 'Late on Site',
  unapprovedDaysOffShortNotice: 'Unapproved Days Off / Short Notice',
  calledInSick: 'Called in Sick',
  unauthorizedDriving: 'Unauthorized Driving',
  drivingInfractions: 'Driving Infractions',
  verbalWarningsWriteUp: 'Verbal Warnings / Write Up',
  sickLeaveUnpaid: 'Sick Leave (Unpaid)',
  sickLeave5: 'Sick Leave (5)',
  vacationDayUnpaid: 'Vacation Day (Unpaid)',
  vacationDay10: 'Vacation Day (10)',
  personalDayOffUnpaid: 'Personal Day Off (Unpaid)',
  unapprovePayoutWithoutDayOff: 'Unapprove Payout without Day Off',
};

/**
 * Report distribution series: all 10 Incident activity categories in fixed order (same as INCIDENT_ACTIVITY_LABELS).
 * Uses tiny value for 0 so every category appears in pie with correct color.
 */
function getReportDistributionSeries(
  byCategory: Record<string, number>
): { label: string; value: number; categoryKey: string }[] {
  return INCIDENT_ACTIVITY_ORDER.map((cat, i) => {
    const count = byCategory[cat] ?? 0;
    return {
      label: INCIDENT_ACTIVITY_LABELS[i] ?? CATEGORY_LABELS[cat] ?? cat,
      value: count > 0 ? count : 0.001,
      categoryKey: cat,
    };
  });
}

function getCurrentMonthParam(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatMonthSubheader(monthParam: string): string {
  const [y, m] = monthParam.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Month name only (e.g. "March") for dialog title. */
function getMonthName(monthParam: string): string {
  const [, m] = monthParam.split('-').map(Number);
  return new Date(2000, m - 1, 1).toLocaleDateString('en-US', { month: 'long' });
}

/** Last 9 months for "Reports over time" (index 0 = 9 months ago, index 8 = current month). */
function getLast9Months(): { monthParam: string; label: string; monthLabel: string }[] {
  const now = new Date();
  const arr: { monthParam: string; label: string; monthLabel: string }[] = [];
  for (let i = 0; i < 9; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (8 - i), 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const monthParam = `${y}-${m}`;
    arr.push({
      monthParam,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      monthLabel: formatMonthSubheader(monthParam),
    });
  }
  return arr;
}

// ----------------------------------------------------------------------

function mapUserToTopWorkerRow(
  user: Record<string, unknown>,
  rank: number,
  completedJobsByUser?: Record<string, number>
): TopWorkerRow {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || (user.email as string) || (user.id as string);
  const userIdKey = user.id != null ? String(user.id) : '';
  const scores = (user as { scores?: Record<string, number> }).scores;
  const score =
    userIdKey && scores?.[userIdKey] != null
      ? Number(scores[userIdKey])
      : user.conduct_score != null
        ? Number(user.conduct_score)
        : user.score != null
          ? Number(user.score)
          : 100;
  return {
    id: String(user.id),
    name,
    photoUrl: (user.photo_url as string) ?? null,
    position: (user.role as string) ?? '',
    score: Math.round(score),
    rank,
    hireDate: (user.hire_date as string) ?? null,
    completedJobCount: userIdKey && completedJobsByUser ? (completedJobsByUser[userIdKey] ?? 0) : 0,
  };
}


export function AttendanceConductReportDashboardView() {
  const theme = useTheme();
  const currentMonth = getCurrentMonthParam();
  const { data: statsByCategoryData } = useQuery({
    queryKey: ['attendance-conduct-dashboard-stats-by-category', currentMonth],
    queryFn: async () => {
      const res = await fetcher(
        `${endpoints.attendanceConductReport.statsByCategory}?month=${encodeURIComponent(currentMonth)}`
      );
      const byCategory = res?.data?.byCategory ?? res?.byCategory ?? {};
      const startDate = res?.data?.startDate ?? res?.startDate;
      const endDate = res?.data?.endDate ?? res?.endDate;
      return { byCategory: byCategory as Record<string, number>, startDate, endDate };
    },
  });

  const reportDistributionSeries = useMemo(() => {
    const byCategory = statsByCategoryData?.byCategory ?? {};
    return getReportDistributionSeries(byCategory);
  }, [statsByCategoryData?.byCategory]);

  const reportDistributionSubheader = useMemo(() => `This month (${formatMonthSubheader(currentMonth)})`, [currentMonth]);

  const { data: topWorkersData, isLoading: loadingTopWorkers } = useQuery({
    queryKey: ['attendance-conduct-dashboard-top-workers'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '10',
        orderBy: 'score',
        order: 'desc',
        include: 'conductCounts',
        status: 'active',
        excludeRole: 'admin',
      });
      const res = await fetcher(`${endpoints.management.user}?${params.toString()}`);
      const users = res?.data?.users ?? res?.users ?? [];
      const counts = res?.data?.counts ?? res?.counts ?? {};
      const scores = res?.data?.scores ?? res?.scores ?? {};
      const completedJobs = res?.data?.completedJobs ?? res?.completedJobs ?? {};
      return { users, counts, scores, completedJobs };
    },
  });

  const { data: opposingWorkersData, isLoading: loadingOpposingWorkers } = useQuery({
    queryKey: ['attendance-conduct-dashboard-opposing-workers'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '10',
        orderBy: 'score',
        order: 'asc',
        include: 'conductCounts',
        status: 'active',
        excludeRole: 'admin',
      });
      const res = await fetcher(`${endpoints.management.user}?${params.toString()}`);
      const users = res?.data?.users ?? res?.users ?? [];
      const counts = res?.data?.counts ?? res?.counts ?? {};
      const scores = res?.data?.scores ?? res?.scores ?? {};
      const completedJobs = res?.data?.completedJobs ?? res?.completedJobs ?? {};
      return { users, counts, scores, completedJobs };
    },
  });

  const topWorkersRows: TopWorkerRow[] = useMemo(() => {
    if (!topWorkersData?.users) return [];
    const users = topWorkersData.users as Record<string, unknown>[];
    const scores = (topWorkersData.scores ?? {}) as Record<string, number>;
    const completedJobs = (topWorkersData.completedJobs ?? {}) as Record<string, number>;
    const uWithScores = users.map((u) => ({ ...u, scores }));
    const withRankData = uWithScores.map((u) => {
      const row = mapUserToTopWorkerRow(u, 0, completedJobs);
      return { user: u, row };
    });
    withRankData.sort((a, b) => {
      const scoreA = a.row.score;
      const scoreB = b.row.score;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const jobsA = a.row.completedJobCount ?? 0;
      const jobsB = b.row.completedJobCount ?? 0;
      if (jobsB !== jobsA) return jobsB - jobsA;
      const dateA = a.row.hireDate ?? '';
      const dateB = b.row.hireDate ?? '';
      if (dateA !== dateB) {
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.localeCompare(dateB);
      }
      const lastA = String((a.user as { last_name?: string }).last_name ?? '').toLowerCase();
      const lastB = String((b.user as { last_name?: string }).last_name ?? '').toLowerCase();
      if (lastA !== lastB) return lastA.localeCompare(lastB);
      const firstA = String((a.user as { first_name?: string }).first_name ?? '').toLowerCase();
      const firstB = String((b.user as { first_name?: string }).first_name ?? '').toLowerCase();
      return firstA.localeCompare(firstB);
    });
    return withRankData.map(({ row }, i) => ({ ...row, rank: i + 1 }));
  }, [topWorkersData?.users, topWorkersData?.scores, topWorkersData?.completedJobs]);

  const opposingWorkersRows: TopWorkerRow[] = useMemo(() => {
    if (!opposingWorkersData?.users) return [];
    const users = opposingWorkersData.users as Record<string, unknown>[];
    const scores = (opposingWorkersData.scores ?? {}) as Record<string, number>;
    const completedJobs = (opposingWorkersData.completedJobs ?? {}) as Record<string, number>;
    const uWithScores = users.map((u) => ({ ...u, scores }));
    const withRankData = uWithScores.map((u) => {
      const row = mapUserToTopWorkerRow(u, 0, completedJobs);
      return { user: u, row };
    });
    withRankData.sort((a, b) => {
      const scoreA = a.row.score;
      const scoreB = b.row.score;
      if (scoreA !== scoreB) return scoreA - scoreB;
      const jobsA = a.row.completedJobCount ?? 0;
      const jobsB = b.row.completedJobCount ?? 0;
      if (jobsA !== jobsB) return jobsA - jobsB;
      const dateA = a.row.hireDate ?? '';
      const dateB = b.row.hireDate ?? '';
      if (dateA !== dateB) {
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.localeCompare(dateA);
      }
      const lastA = String((a.user as { last_name?: string }).last_name ?? '').toLowerCase();
      const lastB = String((b.user as { last_name?: string }).last_name ?? '').toLowerCase();
      if (lastA !== lastB) return lastA.localeCompare(lastB);
      const firstA = String((a.user as { first_name?: string }).first_name ?? '').toLowerCase();
      const firstB = String((b.user as { first_name?: string }).first_name ?? '').toLowerCase();
      return firstA.localeCompare(firstB);
    });
    return withRankData.map(({ row }, i) => ({ ...row, rank: i + 1 }));
  }, [opposingWorkersData?.users, opposingWorkersData?.scores, opposingWorkersData?.completedJobs]);

  const [workersTab, setWorkersTab] = useState<0 | 1>(0);

  const { data: recentReportsData, isLoading: loadingRecent } = useQuery({
    queryKey: ['attendance-conduct-dashboard-recent-reports'],
    queryFn: async () => {
      const res = await fetcher(`${endpoints.attendanceConductReport.recent}?limit=15`);
      const list = res?.data?.reports ?? res?.reports ?? [];
      return Array.isArray(list) ? list : [];
    },
  });

  const recentReports: RecentReportItem[] = Array.isArray(recentReportsData) ? recentReportsData : [];

  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    categoryKey: string | null;
    categoryLabel: string;
  }>({ open: false, categoryKey: null, categoryLabel: '' });

  const [reportDetailDialog, setReportDetailDialog] = useState<{
    open: boolean;
    report: ReportDetail | null;
    title: string;
  }>({ open: false, report: null, title: '' });

  const [timeDialog, setTimeDialog] = useState<{
    open: boolean;
    monthParam: string | null;
    monthLabel: string;
    filter: 'conduct' | 'leavePayout';
    filterLabel: string;
  }>({ open: false, monthParam: null, monthLabel: '', filter: 'conduct', filterLabel: 'Incidents (affects score)' });

  const [timeDialogPage, setTimeDialogPage] = useState(0);
  const [timeDialogRowsPerPage, setTimeDialogRowsPerPage] = useState(10);

  const [timeOffDetailsDialog, setTimeOffDetailsDialog] = useState<{
    open: boolean;
    request: TimeOffDetailsRequest | null;
    tabLabel: string;
  }>({ open: false, request: null, tabLabel: '' });

  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [jobDetailsId, setJobDetailsId] = useState<string | null>(null);

  const last9Months = useMemo(() => getLast9Months(), []);

  const { data: countsByMonthData } = useQuery({
    queryKey: ['attendance-conduct-dashboard-counts-by-month'],
    queryFn: async () => {
      const res = await fetcher(endpoints.attendanceConductReport.countsByMonth);
      const counts = res?.data?.counts ?? res?.counts ?? [];
      const otherCounts = res?.data?.otherCounts ?? res?.otherCounts ?? [];
      return {
        counts: Array.isArray(counts) ? counts : [],
        otherCounts: Array.isArray(otherCounts) ? otherCounts : [],
      };
    },
  });

  const reportsOverTimeSeries = useMemo(() => {
    const counts = countsByMonthData?.counts ?? [];
    const otherCounts = countsByMonthData?.otherCounts ?? [];
    const conductData = last9Months.map((m) => {
      const found = counts.find((c: { month?: string }) => c.month === m.monthParam);
      return found ? (typeof found.count === 'number' ? found.count : Number(found.count) || 0) : 0;
    });
    const otherData = last9Months.map((m) => {
      const found = otherCounts.find((c: { month?: string }) => c.month === m.monthParam);
      return found ? (typeof found.count === 'number' ? found.count : Number(found.count) || 0) : 0;
    });
    return [
      { name: 'Incidents (affects score)', data: conductData },
      { name: 'Leave & Payout', data: otherData },
    ];
  }, [countsByMonthData?.counts, countsByMonthData?.otherCounts, last9Months]);

  const reportsOverTimeYMax = useMemo(() => {
    const series = reportsOverTimeSeries;
    const all = [...(series[0]?.data ?? []), ...(series[1]?.data ?? [])];
    const maxVal = Math.max(0, ...all);
    if (maxVal <= 0) return 8;
    return Math.max(5, Math.ceil((maxVal * 1.2) / 5) * 5);
  }, [reportsOverTimeSeries]);

  const { data: categoryReportsData, isLoading: loadingCategoryReports } = useQuery({
    queryKey: [
      'attendance-conduct-reports-by-category',
      categoryDialog.categoryKey,
      currentMonth,
    ],
    queryFn: async () => {
      if (!categoryDialog.categoryKey) return { reports: [] };
      const res = await fetcher(
        `${endpoints.attendanceConductReport.listByCategory}?category=${encodeURIComponent(categoryDialog.categoryKey)}&month=${encodeURIComponent(currentMonth)}`
      );
      const reports = res?.data?.reports ?? res?.reports ?? [];
      return { reports: Array.isArray(reports) ? reports : [] };
    },
    enabled: categoryDialog.open && !!categoryDialog.categoryKey,
  });

  const categoryReports = categoryReportsData?.reports ?? [];

  const { data: timeReportsData, isLoading: loadingTimeReports } = useQuery({
    queryKey: [
      timeDialog.filter === 'leavePayout' ? 'leave-payout-by-month' : 'attendance-conduct-reports-by-month',
      timeDialog.monthParam,
      timeDialog.filter,
    ],
    queryFn: async () => {
      if (!timeDialog.monthParam) return { reports: [] };
      const endpoint =
        timeDialog.filter === 'leavePayout'
          ? `${endpoints.attendanceConductReport.leavePayoutByMonth}?month=${encodeURIComponent(timeDialog.monthParam)}`
          : `${endpoints.attendanceConductReport.listByMonth}?month=${encodeURIComponent(timeDialog.monthParam)}`;
      const res = await fetcher(endpoint);
      const reports = res?.data?.reports ?? res?.reports ?? [];
      return { reports: Array.isArray(reports) ? reports : [] };
    },
    enabled: timeDialog.open && !!timeDialog.monthParam,
  });

  const handlePieSliceClick = useCallback(
    (index: number) => {
      const series = reportDistributionSeries.length > 0 ? reportDistributionSeries : [];
      const item = series[index];
      if (!item || !('categoryKey' in item) || !item.categoryKey) return;
      setCategoryDialog({
        open: true,
        categoryKey: item.categoryKey,
        categoryLabel: item.label,
      });
    },
    [reportDistributionSeries]
  );

  const handleCloseCategoryDialog = useCallback(() => {
    setCategoryDialog({ open: false, categoryKey: null, categoryLabel: '' });
  }, []);

  const handleOpenReportById = useCallback(
    async (id: string, category: string) => {
      try {
        const res = await fetcher(`${endpoints.attendanceConductReport.list}/${id}`);
        const report = res?.data?.report ?? res?.report;
        const categoryLabel = CATEGORY_LABELS[category] ?? category;
        setReportDetailDialog({
          open: true,
          report: (report ?? null) as ReportDetail | null,
          title: `${categoryLabel} Details`,
        });
      } catch {
        setReportDetailDialog({ open: true, report: null, title: 'Error loading report' });
      }
    },
    []
  );

  const handleCloseReportDetail = useCallback(() => {
    setReportDetailDialog({ open: false, report: null, title: '' });
  }, []);

  /** Open Time Off Details dialog (same as Attendance & Conduct tab: Sick Leave (5) Details, etc.). */
  const handleOpenTimeOffDetail = useCallback(
    (row: {
      category?: string;
      created_at?: string | null;
      start_date?: string | null;
      end_date?: string | null;
      reason?: string | null;
      confirmed_at?: string | null;
      confirmed_by_first_name?: string | null;
      confirmed_by_last_name?: string | null;
      confirmed_by_photo_url?: string | null;
    }) => {
      const categoryLabel = row.category ? (CATEGORY_LABELS[row.category] ?? row.category) : 'Time Off';
      const request: TimeOffDetailsRequest = {
        created_at: row.created_at ?? null,
        start_date: row.start_date ?? null,
        end_date: row.end_date ?? null,
        reason: row.reason ?? null,
        confirmed_at: row.confirmed_at ?? null,
        confirmed_by_first_name: row.confirmed_by_first_name ?? null,
        confirmed_by_last_name: row.confirmed_by_last_name ?? null,
        confirmed_by_photo_url: row.confirmed_by_photo_url ?? null,
      };
      setTimeOffDetailsDialog({ open: true, request, tabLabel: categoryLabel });
    },
    []
  );

  const handleBarClick = useCallback(
    (dataPointIndex: number, seriesIndex: number) => {
      const monthInfo = last9Months[dataPointIndex];
      if (!monthInfo) return;
      setTimeDialogPage(0);
      const isLeavePayout = seriesIndex === 1;
      setTimeDialog({
        open: true,
        monthParam: monthInfo.monthParam,
        monthLabel: monthInfo.monthLabel,
        filter: isLeavePayout ? 'leavePayout' : 'conduct',
        filterLabel: isLeavePayout ? 'Leave & Payout' : 'Incidents (affects score)',
      });
    },
    [last9Months]
  );

  const handleCloseTimeDialog = useCallback(() => {
    setTimeDialog({ open: false, monthParam: null, monthLabel: '', filter: 'conduct', filterLabel: 'Incidents (affects score)' });
    setTimeDialogPage(0);
  }, []);

  const timeReportsFiltered = useMemo(() => {
    const timeReports = timeReportsData?.reports ?? [];
    if (timeDialog.filter === 'leavePayout') return timeReports;
    return timeReports.filter((r: { category?: string }) => r.category != null && CONDUCT_CATEGORIES.includes(r.category));
  }, [timeReportsData?.reports, timeDialog.filter]);

  const timeReportsPaged = useMemo(() => {
    const start = timeDialogPage * timeDialogRowsPerPage;
    return timeReportsFiltered.slice(start, start + timeDialogRowsPerPage);
  }, [timeReportsFiltered, timeDialogPage, timeDialogRowsPerPage]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Attendance & Conduct Dashboard"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Employee', href: paths.management.user.list },
          { name: 'Attendance & Conduct Report', href: paths.management.user.attendanceConductReport },
          { name: 'Dashboard' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.management.user.attendanceConductReportCreate}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Add Report
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {/* Report distribution + Reports over time: same row on md+. Reports over time card uses flex + height 100% so chart fills and no extra room below (same idea as Score + Incident activity row which uses minHeight + height 100%). */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AttendanceConductDashboardCurrentVisits
            title="Report distribution"
            subheader={reportDistributionSubheader}
            onSliceClick={handlePieSliceClick}
            chart={{
              colors: getIncidentActivityColors(theme),
              series: reportDistributionSeries,
              options: {
                tooltip: {
                  y: {
                    formatter: (value: number) =>
                      value < 0.01 ? '0' : String(Math.round(value)),
                  },
                },
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }} sx={{ display: 'flex' }}>
          <AttendanceConductDashboardWebsiteVisits
            title="Reports over time"
            subheader="Last 9 months"
            onBarClick={handleBarClick}
            chart={{
              categories: last9Months.map((m) => m.label),
              series: reportsOverTimeSeries,
              options: { yaxis: { min: 0, max: reportsOverTimeYMax } },
            }}
            sx={{ height: '100%', flex: 1, minHeight: 0 }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <Card>
            <Tabs
              value={workersTab}
              onChange={(_, v) => setWorkersTab(v as 0 | 1)}
              sx={[
                (muiTheme) => ({
                  px: 2.5,
                  boxShadow: `inset 0 -2px 0 0 ${varAlpha(muiTheme.vars.palette.grey['500Channel'], 0.08)}`,
                }),
              ]}
            >
              <Tab label="Top workers" />
              <Tab label="Workers needing attention" />
            </Tabs>
            <AttendanceConductDashboardTopWorkers
              title={workersTab === 0 ? 'Top workers' : 'Workers needing attention'}
              subheader={
                workersTab === 0
                  ? 'Employees with highest conduct score (active only)'
                  : 'Employees with lowest conduct score (active only)'
              }
            tableData={
              workersTab === 0
                ? (loadingTopWorkers ? [] : topWorkersRows)
                : (loadingOpposingWorkers ? [] : opposingWorkersRows)
              }
              rankPrefix={workersTab === 0 ? 'TOP' : 'BOTTOM'}
              invertRankColors={workersTab === 1}
              noCard
              headCells={[
                { id: 'name', label: 'Employee' },
                { id: 'position', label: 'Position' },
                { id: 'hireDate', label: 'Hire Date' },
                { id: 'completedJobCount', label: 'Completed Job #', align: 'center' },
                { id: 'score', label: 'Score', align: 'center' },
                { id: 'rank', label: 'Rank', align: 'right' },
              ]}
            />
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AttendanceConductDashboardRecentReports
            title="Recent reports"
            subheader="Formal reports and schedule incidents (no show, job reject, called in sick), newest first"
            list={loadingRecent ? [] : recentReports}
          />
        </Grid>
      </Grid>

      <Dialog
        open={categoryDialog.open}
        onClose={handleCloseCategoryDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{categoryDialog.categoryLabel} - {getMonthName(currentMonth)}</DialogTitle>
        <DialogContent>
          {loadingCategoryReports ? (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>Loading…</Box>
          ) : categoryReports.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No reports</Box>
          ) : (
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categoryReports.map((row: {
                  id: string;
                  user_id: string;
                  job_id?: string | number | null;
                  source?: string | null;
                  user_first_name?: string | null;
                  user_last_name?: string | null;
                  user_photo_url?: string | null;
                  category?: string;
                  report_date_time?: string | null;
                  created_at?: string | null;
                }) => {
                  const name = [row.user_first_name, row.user_last_name].filter(Boolean).join(' ').trim() || '—';
                  const dateStr = row.report_date_time ?? row.created_at;
                  const isJobWorker =
                    row.job_id != null &&
                    (row.source === 'job_worker' || String(row.id).startsWith('jw-'));
                  return (
                    <TableRow key={String(row.id)}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            alt={name}
                            src={row.user_photo_url ?? undefined}
                            sx={{ width: 32, height: 32 }}
                          >
                            {name !== '—' ? name.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                          {name}
                        </Box>
                      </TableCell>
                      <TableCell>{dateStr ? fDate(dateStr, 'MMM DD, YYYY') : '—'}</TableCell>
                      <TableCell align="right">
                        {isJobWorker ? (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setJobDetailsId(String(row.job_id));
                              setJobDetailsOpen(true);
                            }}
                          >
                            View job
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleOpenReportById(row.id, row.category ?? '')}
                          >
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={timeDialog.open}
        onClose={handleCloseTimeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{timeDialog.filterLabel} - {timeDialog.monthLabel}</DialogTitle>
        <DialogContent>
          {loadingTimeReports ? (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>Loading…</Box>
          ) : timeReportsFiltered.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No reports</Box>
          ) : (
            <>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">View</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeReportsPaged.map((row: {
                  id: string;
                  user_id: string;
                  job_id?: string | number | null;
                  source?: string | null;
                  user_first_name?: string | null;
                  user_last_name?: string | null;
                  user_photo_url?: string | null;
                  category?: string;
                  report_date_time?: string | null;
                  created_at?: string | null;
                }) => {
                  const name = [row.user_first_name, row.user_last_name].filter(Boolean).join(' ').trim() || '—';
                  const dateStr = row.report_date_time ?? row.created_at;
                  const categoryLabel = row.category ? (CATEGORY_LABELS[row.category] ?? row.category) : '—';
                  const isJw =
                    row.job_id != null &&
                    (row.source === 'job_worker' || String(row.id).startsWith('jw-'));
                  return (
                    <TableRow key={String(row.id)}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            alt={name}
                            src={row.user_photo_url ?? undefined}
                            sx={{ width: 32, height: 32 }}
                          >
                            {name !== '—' ? name.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                          {name}
                        </Box>
                      </TableCell>
                      <TableCell>{categoryLabel}</TableCell>
                      <TableCell>{dateStr ? fDate(dateStr, 'MMM DD, YYYY') : '—'}</TableCell>
                      <TableCell align="right">
                        {String(row.id).startsWith('to-') ? (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleOpenTimeOffDetail(row)}
                          >
                            View
                          </Button>
                        ) : isJw ? (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setJobDetailsId(String(row.job_id));
                              setJobDetailsOpen(true);
                            }}
                          >
                            View job
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleOpenReportById(row.id, row.category ?? '')}
                          >
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={timeReportsFiltered.length}
                page={timeDialogPage}
                onPageChange={(_, newPage) => setTimeDialogPage(newPage)}
                rowsPerPage={timeDialogRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setTimeDialogRowsPerPage(parseInt(e.target.value, 10));
                  setTimeDialogPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Rows:"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTimeDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <AttendanceConductReportDetailDialog
        open={reportDetailDialog.open}
        onClose={handleCloseReportDetail}
        report={reportDetailDialog.report}
        title={reportDetailDialog.title}
      />

      <TimeOffDetailsDialog
        open={timeOffDetailsDialog.open}
        onClose={() => setTimeOffDetailsDialog({ open: false, request: null, tabLabel: '' })}
        request={timeOffDetailsDialog.request}
        tabLabel={timeOffDetailsDialog.tabLabel}
      />

      {jobDetailsId && (
        <JobDetailsDialog
          open={jobDetailsOpen}
          onClose={() => {
            setJobDetailsOpen(false);
            setJobDetailsId(null);
          }}
          jobId={jobDetailsId}
        />
      )}
    </DashboardContent>
  );
}
