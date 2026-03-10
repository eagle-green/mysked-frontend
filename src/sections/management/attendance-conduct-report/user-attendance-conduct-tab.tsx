import type { IUser } from 'src/types/user';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { varAlpha } from 'minimal-shared/utils';

import { useQuery } from '@tanstack/react-query';

import dayjs from 'dayjs';

import { fDate, fTime } from 'src/utils/format-time';
import { getPositionColor } from 'src/utils/format-role';
import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';
import { provinceList } from 'src/assets/data/assets';

import { Label } from 'src/components/label';
import { TableNoData } from 'src/components/table';
import { Scrollbar } from 'src/components/scrollbar';

import type { AttendanceConductCategoryItem } from './attendance-conduct-score-overview';
import { AttendanceConductScoreOverview } from './attendance-conduct-score-overview';
import {
  AttendanceConductDataActivity,
  MOCK_ACTIVITY_SERIES,
} from './attendance-conduct-data-activity';
import { JobDetailsDialog } from 'src/sections/work/calendar/job-details-dialog';

// ----------------------------------------------------------------------

const CATEGORY_ALL = 'all';

/** Min height for the score + incident activity row so both cards match (score card content height). */
const SCORE_ACTIVITY_ROW_MIN_HEIGHT = 538;

/** Categories that impact score (shown in score overview and data activity). */
const SCORE_IMPACT_CATEGORIES: { value: string; label: string; key: string }[] = [
  { value: 'noShowUnpaid', label: 'No Show', key: 'noShowUnpaid' },
  { value: 'sentHomeNoPpe', label: 'Sent home from site (No PPE)', key: 'sentHomeNoPpe' },
  { value: 'leftEarlyNoNotice', label: 'Left Early No Notice', key: 'leftEarlyNoNotice' },
  { value: 'lateOnSite', label: 'Late on Site', key: 'lateOnSite' },
  { value: 'refusalOfShifts', label: 'Refusal of Shift', key: 'refusalOfShifts' },
  { value: 'unauthorizedDriving', label: 'Unauthorized Driving', key: 'unauthorizedDriving' },
  { value: 'drivingInfractions', label: 'Driving Infractions', key: 'drivingInfractions' },
  { value: 'verbalWarningsWriteUp', label: 'Verbal Warnings / Write Up', key: 'verbalWarningsWriteUp' },
];

/** Mock: points deducted from score per occurrence (replace with backend rule later). */
const SCORE_DEDUCT_PER_OCCURRENCE: Record<string, number> = {
  noShowUnpaid: 15,
  sentHomeNoPpe: 10,
  leftEarlyNoNotice: 5,
  lateOnSite: 5,
  refusalOfShifts: 10,
  unauthorizedDriving: 15,
  drivingInfractions: 10,
  verbalWarningsWriteUp: 5,
};

const CONDUCT_CATEGORIES: { value: string; label: string; key: string }[] = [
  // Attendance / no-show & site issues
  { value: 'noShowUnpaid', label: 'No Show (Unpaid)', key: 'noShowUnpaid' },
  { value: 'sentHomeNoPpe', label: 'Sent home from site (No PPE)', key: 'sentHomeNoPpe' },
  { value: 'leftEarlyNoNotice', label: 'Left Early No Notice', key: 'leftEarlyNoNotice' },
  { value: 'lateOnSite', label: 'Late on Site', key: 'lateOnSite' },
  // Leave / time-off (unpaid then paid)
  { value: 'vacationDayUnpaid', label: 'Vacation Day (Unpaid)', key: 'vacationDayUnpaid' },
  { value: 'sickLeaveUnpaid', label: 'Sick Leave (Unpaid)', key: 'sickLeaveUnpaid' },
  { value: 'personalDayOffUnpaid', label: 'Personal Day Off (Unpaid)', key: 'personalDayOffUnpaid' },
  { value: 'vacationDay10', label: 'Vacation Day (10)', key: 'vacationDay10' },
  { value: 'sickLeave5', label: 'Sick Leave (5)', key: 'sickLeave5' },
  // Refusal & unapproved
  { value: 'refusalOfShifts', label: 'Refusal of shift', key: 'refusalOfShifts' },
  { value: 'unapprovedDaysOffShortNotice', label: 'Unapproved Days Off / Short Notice', key: 'unapprovedDaysOffShortNotice' },
  // Driving
  { value: 'unauthorizedDriving', label: 'Unauthorized Driving', key: 'unauthorizedDriving' },
  { value: 'drivingInfractions', label: 'Driving Infractions', key: 'drivingInfractions' },
  // Other conduct
  { value: 'unapprovePayoutWithoutDayOff', label: 'Unapprove Payout without day Off', key: 'unapprovePayoutWithoutDayOff' },
  { value: 'verbalWarningsWriteUp', label: 'Verbal Warnings / Write Up', key: 'verbalWarningsWriteUp' },
];

type ConductData = {
  score: number;
  noShowUnpaid: number;
  sentHomeNoPpe: number;
  leftEarlyNoNotice: number;
  lateOnSite: number;
  vacationDayUnpaid: number;
  sickLeaveUnpaid: number;
  personalDayOffUnpaid: number;
  vacationDay10: number;
  refusalOfShifts: number;
  unauthorizedDriving: number;
  unapprovePayoutWithoutDayOff: number;
  unapprovedDaysOffShortNotice: number;
  drivingInfractions: number;
  sickLeave5: number;
  verbalWarningsWriteUp: number;
};

const defaultConductData: ConductData = {
  score: 100,
  noShowUnpaid: 0,
  sentHomeNoPpe: 0,
  leftEarlyNoNotice: 0,
  lateOnSite: 0,
  vacationDayUnpaid: 0,
  sickLeaveUnpaid: 0,
  personalDayOffUnpaid: 0,
  vacationDay10: 0,
  refusalOfShifts: 0,
  unauthorizedDriving: 0,
  unapprovePayoutWithoutDayOff: 0,
  unapprovedDaysOffShortNotice: 0,
  drivingInfractions: 0,
  sickLeave5: 0,
  verbalWarningsWriteUp: 0,
};

/** Mock data with some non-zero counts for demo (replace with API data). */
const mockConductDataWithCounts: ConductData = {
  ...defaultConductData,
  score: 100,
  noShowUnpaid: 1,
  verbalWarningsWriteUp: 2,
  leftEarlyNoNotice: 1,
  sickLeaveUnpaid: 2,
  drivingInfractions: 0,
  unapprovedDaysOffShortNotice: 0,
};

type Props = {
  currentUser: IUser;
};

/** Columns for No Show and Sent home from site (No PPE) detail tables: Job #, Date, Customer, Site, Position, Detail. */
const JOB_DETAIL_TABLE_HEAD = [
  { id: 'job_number', label: 'Job #' },
  { id: 'date', label: 'Date' },
  { id: 'customer', label: 'Customer' },
  { id: 'site', label: 'Site' },
  { id: 'position', label: 'Position' },
  { id: 'detail', label: 'Detail' },
];

/** Columns for Late on Site tab: Job #, Date, Customer, Site, Position, Arrived Time, Detail. */
const LATE_ON_SITE_TABLE_HEAD = [
  { id: 'job_number', label: 'Job #' },
  { id: 'date', label: 'Date' },
  { id: 'customer', label: 'Customer' },
  { id: 'site', label: 'Site' },
  { id: 'position', label: 'Position' },
  { id: 'arrived_time', label: 'Arrived Time' },
  { id: 'detail', label: 'Detail' },
];

/** Columns for Vacation Day (Unpaid) tab. */
const VACATION_DAY_TABLE_HEAD = [
  { id: 'requested_time', label: 'Requested Time' },
  { id: 'date_range', label: 'Date Range' },
  { id: 'days', label: 'Days' },
  { id: 'confirmed_by', label: 'Confirmed By' },
  { id: 'detail', label: 'Detail' },
];

/** Columns for Unauthorized Driving & Driving Infractions: Date, Detail. */
const DATE_DETAIL_TABLE_HEAD = [
  { id: 'date', label: 'Date' },
  { id: 'detail', label: 'Detail' },
];

/** Columns for Unapprove Payout without day Off. */
const PAYOUT_WITHOUT_DAY_OFF_TABLE_HEAD = [
  { id: 'requested_date', label: 'Requested Date' },
  { id: 'hours', label: 'Hours' },
  { id: 'approved_by', label: 'Approved By' },
  { id: 'detail', label: 'Detail' },
];

/** Columns for Verbal Warnings / Write Up. */
const VERBAL_WARNINGS_TABLE_HEAD = [
  { id: 'date', label: 'Date' },
  { id: 'category', label: 'Category' },
  { id: 'requested_by', label: 'Requested By' },
  { id: 'detail', label: 'Detail' },
];

/** Date format for No Show table: Feb 01 2026 */
const NO_SHOW_DATE_FORMAT = 'MMM DD YYYY';

/** Build full site address from job's flat site_* fields – same format as Job List. */
function getFullAddressFromJob(job: any): string {
  if (job.site_display_address?.trim()) return job.site_display_address.trim();
  let addr = [
    job.site_unit_number,
    job.site_street_number,
    job.site_street_name,
    job.site_city,
    job.site_province,
    job.site_postal_code,
    job.site_country,
  ]
    .filter(Boolean)
    .join(', ')
    .trim();
  if (addr && provinceList?.length) {
    provinceList.forEach(({ value, code }: { value: string; code: string }) => {
      addr = addr!.replace(value, code);
    });
  }
  return addr || '';
}

export function UserAttendanceConductTab({ currentUser }: Props) {
  const [categoryTab, setCategoryTab] = useState<string>(CATEGORY_ALL);
  const [noShowDetailsDialog, setNoShowDetailsDialog] = useState<{ open: boolean; job: any | null }>({
    open: false,
    job: null,
  });
  const [rejectionDetailsDialog, setRejectionDetailsDialog] = useState<{ open: boolean; job: any | null }>({
    open: false,
    job: null,
  });
  const [jobDetailsDialogOpen, setJobDetailsDialogOpen] = useState(false);
  const [selectedJobIdForDetails, setSelectedJobIdForDetails] = useState<string | null>(null);

  const { data: conductData, isLoading } = useQuery({
    queryKey: ['user-attendance-conduct', currentUser.id],
    queryFn: async () => {
      // TODO: replace with dedicated endpoint when backend supports it
      // const res = await fetcher(`${endpoints.management.user}/${currentUser.id}/attendance-conduct`);
      // return res.data;
      return mockConductDataWithCounts;
    },
    enabled: !!currentUser?.id,
  });

  const { data: noShowJobHistory, isLoading: isLoadingNoShow } = useQuery({
    queryKey: ['worker-job-history', currentUser.id, 'no_show'],
    queryFn: async () => {
      const response = await fetcher(
        `${endpoints.work.job}/worker/${currentUser.id}/history?status=no_show&limit=500&offset=0`
      );
      return response.data;
    },
    enabled: !!currentUser?.id && categoryTab === 'noShowUnpaid',
  });

  const { data: rejectedJobHistory, isLoading: isLoadingRejected } = useQuery({
    queryKey: ['worker-job-history', currentUser.id, 'rejected'],
    queryFn: async () => {
      const response = await fetcher(
        `${endpoints.work.job}/worker/${currentUser.id}/history?status=rejected&limit=500&offset=0`
      );
      return response.data;
    },
    enabled: !!currentUser?.id && categoryTab === 'refusalOfShifts',
  });

  const data = conductData ?? mockConductDataWithCounts;
  const noShowJobs = noShowJobHistory?.jobs ?? [];
  const rejectionJobs = rejectedJobHistory?.jobs ?? [];

  // TODO: replace with API when backend supports "sent home from site (no PPE)" history
  const sentHomeNoPpeJobs: any[] = [];

  // TODO: replace with API when backend supports "left early no notice" history
  const leftEarlyNoNoticeJobs: any[] = [];

  // TODO: replace with API when backend supports late on site history
  const lateOnSiteJobs: any[] = [];

  // TODO: replace with API when backend supports vacation day (unpaid) requests
  const vacationDayUnpaidRows: any[] = [];

  // TODO: replace with API when backend supports sick leave (unpaid) requests
  const sickLeaveUnpaidRows: any[] = [];

  // TODO: replace with API when backend supports personal day off (unpaid) requests
  const personalDayOffUnpaidRows: any[] = [];

  // TODO: replace with API when backend supports vacation day (10) requests
  const vacationDay10Rows: any[] = [];

  // TODO: replace with API when backend supports sick leave (5) requests
  const sickLeave5Rows: any[] = [];

  // TODO: replace with API when backend supports unapproved days off / short notice
  const unapprovedDaysOffShortNoticeJobs: any[] = [];

  // TODO: replace with API when backend supports unauthorized driving
  const unauthorizedDrivingRows: any[] = [];

  // TODO: replace with API when backend supports driving infractions
  const drivingInfractionsRows: any[] = [];

  // TODO: replace with API when backend supports unapprove payout without day off
  const unapprovePayoutWithoutDayOffRows: any[] = [];

  // TODO: replace with API when backend supports verbal warnings / write up
  const verbalWarningsWriteUpRows: any[] = [];

  const scoreOverviewData: AttendanceConductCategoryItem[] = useMemo(
    () =>
      SCORE_IMPACT_CATEGORIES.map((cat) => {
        const count = (data as Record<string, number>)[cat.key] ?? 0;
        const pointsPer = SCORE_DEDUCT_PER_OCCURRENCE[cat.key] ?? 0;
        const deduct = count > 0 ? count * pointsPer : 0;
        return {
          name: cat.label,
          count,
          deduct: deduct > 0 ? deduct : undefined,
        };
      }),
    [data]
  );

  const categoriesToShow = useMemo(() => {
    if (categoryTab === CATEGORY_ALL) return CONDUCT_CATEGORIES;
    return CONDUCT_CATEGORIES.filter((c) => c.value === categoryTab);
  }, [categoryTab]);

  const handleCategoryTabChange = (_: React.SyntheticEvent, value: string) => {
    setCategoryTab(value);
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: 'stretch',
          minHeight: { xs: undefined, md: SCORE_ACTIVITY_ROW_MIN_HEIGHT },
        }}
      >
        <AttendanceConductScoreOverview
          score={data.score}
          data={scoreOverviewData}
          sx={{ flexShrink: 0, width: { xs: '100%', md: 320 } }}
        />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            minHeight: 0,
          }}
        >
          <AttendanceConductDataActivity
            title="Incident activity"
            chart={{ series: MOCK_ACTIVITY_SERIES }}
            sx={{ width: '100%', height: '100%', minHeight: SCORE_ACTIVITY_ROW_MIN_HEIGHT }}
          />
        </Box>
      </Box>

      <Card>
        <Tabs
          value={categoryTab}
          onChange={handleCategoryTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={[
            (theme) => ({
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          <Tab value={CATEGORY_ALL} label="All" />
          {CONDUCT_CATEGORIES.map((cat) => (
            <Tab key={cat.value} value={cat.value} label={cat.label} />
          ))}
        </Tabs>

        <Scrollbar sx={{ maxHeight: 440 }}>
          <Table size="small" stickyHeader>
            {categoryTab === 'noShowUnpaid' ||
            categoryTab === 'sentHomeNoPpe' ||
            categoryTab === 'leftEarlyNoNotice' ||
            categoryTab === 'refusalOfShifts' ||
            categoryTab === 'unapprovedDaysOffShortNotice' ? (
              (() => {
                const isNoShow = categoryTab === 'noShowUnpaid';
                const isRefusal = categoryTab === 'refusalOfShifts';
                const jobs =
                  categoryTab === 'noShowUnpaid'
                    ? noShowJobs
                    : categoryTab === 'sentHomeNoPpe'
                      ? sentHomeNoPpeJobs
                      : categoryTab === 'leftEarlyNoNotice'
                        ? leftEarlyNoNoticeJobs
                        : categoryTab === 'refusalOfShifts'
                          ? rejectionJobs
                          : unapprovedDaysOffShortNoticeJobs;
                const isLoadingJobs = isNoShow
                  ? isLoadingNoShow
                  : isRefusal
                    ? isLoadingRejected
                    : false;
                return (
                  <>
                    <TableHead>
                      <TableRow>
                        {JOB_DETAIL_TABLE_HEAD.map((head) => (
                          <TableCell key={head.id} sx={{ fontWeight: 600 }}>
                            {head.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isLoadingJobs ? (
                        <TableRow>
                          <TableCell colSpan={JOB_DETAIL_TABLE_HEAD.length}>Loading…</TableCell>
                        </TableRow>
                      ) : jobs.length === 0 ? (
                        <TableNoData
                          notFound
                          colSpan={JOB_DETAIL_TABLE_HEAD.length}
                          sx={{ py: 10 }}
                        />
                      ) : (
                        jobs.map((job: any, index: number) => {
                          const positionLabel =
                            job.position != null && job.position !== ''
                              ? (JOB_POSITION_OPTIONS.find((opt) => opt.value === job.position)?.label ||
                                  job.position)
                              : 'N/A';
                          return (
                            <TableRow key={job.job_worker_id ?? `${job.job_id}-${index}`} hover>
                              <TableCell>
                                {job.job_id ? (
                                  <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => {
                                      setSelectedJobIdForDetails(job.job_id);
                                      setJobDetailsDialogOpen(true);
                                    }}
                                    sx={{
                                      fontWeight: 600,
                                      color: 'primary.main',
                                      cursor: 'pointer',
                                      textDecoration: 'none',
                                      '&:hover': { textDecoration: 'underline' },
                                    }}
                                  >
                                    #{job.job_number}
                                  </Link>
                                ) : (
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    #{job.job_number}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {fDate(job.start_time, NO_SHOW_DATE_FORMAT)}
                                </Typography>
                                {(job.worker_start_time != null || job.worker_end_time != null) && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                    {[job.worker_start_time, job.worker_end_time]
                                      .filter(Boolean)
                                      .map((t) => fTime(t))
                                      .join(' - ')}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                                  <Avatar
                                    src={
                                      (
                                        job.company?.logo_url ||
                                        job.company_logo_url ||
                                        job.logo_url ||
                                        ''
                                      ).trim()
                                        ? (job.company?.logo_url || job.company_logo_url || job.logo_url).trim()
                                        : undefined
                                    }
                                    alt={job.company_name || job.company?.name || ''}
                                    sx={{ width: 32, height: 32 }}
                                  >
                                    {(job.company_name || job.company?.name)?.charAt(0)?.toUpperCase()}
                                  </Avatar>
                                  <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                                    <Typography variant="body2">
                                      {job.company_name || job.company?.name || ''}
                                    </Typography>
                                  </Stack>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Stack sx={{ typography: 'body2' }}>
                                  {job.site_name ? (
                                    <Typography variant="body2">{job.site_name}</Typography>
                                  ) : null}
                                  {getFullAddressFromJob(job) ? (
                                    <Typography variant="body2" color="text.secondary">
                                      {getFullAddressFromJob(job)}
                                    </Typography>
                                  ) : null}
                                  {!job.site_name && !getFullAddressFromJob(job) && (
                                    <Typography variant="body2" color="text.secondary">
                                      —
                                    </Typography>
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Label variant="soft" color={getPositionColor(job.position)}>
                                  {positionLabel}
                                </Label>
                              </TableCell>
                              <TableCell>
                                {isNoShow ? (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => setNoShowDetailsDialog({ open: true, job })}
                                  >
                                    View
                                  </Button>
                                ) : isRefusal ? (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => setRejectionDetailsDialog({ open: true, job })}
                                  >
                                    View
                                  </Button>
                                ) : (
                                  <Typography variant="body2">
                                    {job.detail ?? job.incident_reason ?? '—'}
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </>
                );
              })()
            ) : categoryTab === 'lateOnSite' ? (
              <>
                <TableHead>
                  <TableRow>
                    {LATE_ON_SITE_TABLE_HEAD.map((head) => (
                      <TableCell key={head.id} sx={{ fontWeight: 600 }}>
                        {head.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lateOnSiteJobs.length === 0 ? (
                    <TableNoData
                      notFound
                      colSpan={LATE_ON_SITE_TABLE_HEAD.length}
                      sx={{ py: 10 }}
                    />
                  ) : (
                    lateOnSiteJobs.map((job: any, index: number) => {
                      const positionLabel =
                        job.position != null && job.position !== ''
                          ? (JOB_POSITION_OPTIONS.find((opt) => opt.value === job.position)?.label ||
                              job.position)
                          : 'N/A';
                      return (
                        <TableRow key={job.job_worker_id ?? `${job.job_id}-${index}`} hover>
                          <TableCell>
                            {job.job_id ? (
                              <Link
                                component="button"
                                variant="body2"
                                onClick={() => {
                                  setSelectedJobIdForDetails(job.job_id);
                                  setJobDetailsDialogOpen(true);
                                }}
                                sx={{
                                  fontWeight: 600,
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' },
                                }}
                              >
                                #{job.job_number}
                              </Link>
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                #{job.job_number}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {fDate(job.start_time, NO_SHOW_DATE_FORMAT)}
                            </Typography>
                            {(job.worker_start_time != null || job.worker_end_time != null) && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                {[job.worker_start_time, job.worker_end_time]
                                  .filter(Boolean)
                                  .map((t) => fTime(t))
                                  .join(' - ')}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              src={
                                (
                                  job.company?.logo_url ||
                                  job.company_logo_url ||
                                  job.logo_url ||
                                  ''
                                ).trim()
                                  ? (job.company?.logo_url || job.company_logo_url || job.logo_url).trim()
                                  : undefined
                              }
                              alt={job.company_name || job.company?.name || ''}
                              sx={{ width: 32, height: 32 }}
                            >
                              {(job.company_name || job.company?.name)?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                              <Typography variant="body2">
                                {job.company_name || job.company?.name || ''}
                              </Typography>
                            </Stack>
                          </Box>
                          </TableCell>
                          <TableCell>
                            <Stack sx={{ typography: 'body2' }}>
                              {job.site_name ? (
                                <Typography variant="body2">{job.site_name}</Typography>
                              ) : null}
                              {getFullAddressFromJob(job) ? (
                                <Typography variant="body2" color="text.secondary">
                                  {getFullAddressFromJob(job)}
                                </Typography>
                              ) : null}
                              {!job.site_name && !getFullAddressFromJob(job) && (
                                <Typography variant="body2" color="text.secondary">
                                  —
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Label variant="soft" color={getPositionColor(job.position)}>
                              {positionLabel}
                            </Label>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {job.arrived_time != null ? fTime(job.arrived_time) : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {job.detail ?? job.incident_reason ?? '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </>
            ) : categoryTab === 'vacationDayUnpaid' ||
              categoryTab === 'sickLeaveUnpaid' ||
              categoryTab === 'personalDayOffUnpaid' ||
              categoryTab === 'vacationDay10' ||
              categoryTab === 'sickLeave5' ? (
              (() => {
                const requestRows =
                  categoryTab === 'vacationDayUnpaid'
                    ? vacationDayUnpaidRows
                    : categoryTab === 'sickLeaveUnpaid'
                      ? sickLeaveUnpaidRows
                      : categoryTab === 'personalDayOffUnpaid'
                        ? personalDayOffUnpaidRows
                        : categoryTab === 'vacationDay10'
                          ? vacationDay10Rows
                          : sickLeave5Rows;
                return (
                  <>
                    <TableHead>
                      <TableRow>
                        {VACATION_DAY_TABLE_HEAD.map((head) => (
                          <TableCell key={head.id} sx={{ fontWeight: 600 }}>
                            {head.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {requestRows.length === 0 ? (
                        <TableNoData
                          notFound
                          colSpan={VACATION_DAY_TABLE_HEAD.length}
                          sx={{ py: 10 }}
                        />
                      ) : (
                        requestRows.map((row: any, index: number) => (
                      <TableRow key={row.id ?? index} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {row.requested_time != null
                              ? fDate(row.requested_time, NO_SHOW_DATE_FORMAT) +
                                (row.requested_time_has_time ? ` ${fTime(row.requested_time)}` : '')
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.date_range ??
                              (row.start_date && row.end_date
                                ? `${fDate(row.start_date, NO_SHOW_DATE_FORMAT)} - ${fDate(row.end_date, NO_SHOW_DATE_FORMAT)}`
                                : '—')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.days != null
                              ? row.days
                              : row.start_date && row.end_date
                                ? dayjs(row.end_date).diff(dayjs(row.start_date), 'day') + 1
                                : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.confirmed_by ?? '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.detail ?? '—'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </>
                );
              })()
            ) : categoryTab === 'unauthorizedDriving' || categoryTab === 'drivingInfractions' ? (
              (() => {
                const rows =
                  categoryTab === 'unauthorizedDriving' ? unauthorizedDrivingRows : drivingInfractionsRows;
                return (
                  <>
                    <TableHead>
                      <TableRow>
                        {DATE_DETAIL_TABLE_HEAD.map((head) => (
                          <TableCell key={head.id} sx={{ fontWeight: 600 }}>
                            {head.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableNoData
                          notFound
                          colSpan={DATE_DETAIL_TABLE_HEAD.length}
                          sx={{ py: 10 }}
                        />
                      ) : (
                        rows.map((row: any, index: number) => (
                          <TableRow key={row.id ?? index} hover>
                            <TableCell>
                              <Typography variant="body2">
                                {row.date != null ? fDate(row.date, NO_SHOW_DATE_FORMAT) : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{row.detail ?? '—'}</Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </>
                );
              })()
            ) : categoryTab === 'unapprovePayoutWithoutDayOff' ? (
              <>
                <TableHead>
                  <TableRow>
                    {PAYOUT_WITHOUT_DAY_OFF_TABLE_HEAD.map((head) => (
                      <TableCell key={head.id} sx={{ fontWeight: 600 }}>
                        {head.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unapprovePayoutWithoutDayOffRows.length === 0 ? (
                    <TableNoData
                      notFound
                      colSpan={PAYOUT_WITHOUT_DAY_OFF_TABLE_HEAD.length}
                      sx={{ py: 10 }}
                    />
                  ) : (
                    unapprovePayoutWithoutDayOffRows.map((row: any, index: number) => (
                      <TableRow key={row.id ?? index} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {row.requested_date != null ? fDate(row.requested_date, NO_SHOW_DATE_FORMAT) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.hours ?? '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.approved_by ?? '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.detail ?? '—'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </>
            ) : categoryTab === 'verbalWarningsWriteUp' ? (
              <>
                <TableHead>
                  <TableRow>
                    {VERBAL_WARNINGS_TABLE_HEAD.map((head) => (
                      <TableCell key={head.id} sx={{ fontWeight: 600 }}>
                        {head.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {verbalWarningsWriteUpRows.length === 0 ? (
                    <TableNoData
                      notFound
                      colSpan={VERBAL_WARNINGS_TABLE_HEAD.length}
                      sx={{ py: 10 }}
                    />
                  ) : (
                    verbalWarningsWriteUpRows.map((row: any, index: number) => (
                      <TableRow key={row.id ?? index} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {row.date != null ? fDate(row.date, NO_SHOW_DATE_FORMAT) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.category ?? '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.requested_by ?? '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.detail ?? '—'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </>
            ) : (
              <>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Count
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={2}>Loading…</TableCell>
                    </TableRow>
                  ) : (
                    categoriesToShow.map((cat) => {
                      const count = (data as Record<string, number>)[cat.key] ?? 0;
                      return (
                        <TableRow key={cat.value} hover>
                          <TableCell>{cat.label}</TableCell>
                          <TableCell align="right">{count > 0 ? count : ''}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </>
            )}
          </Table>
        </Scrollbar>
      </Card>

      {/* No Show Details – same dialog as Job History no show incident details */}
      <Dialog
        open={noShowDetailsDialog.open}
        onClose={() => setNoShowDetailsDialog({ open: false, job: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>No Show Details</DialogTitle>
        <DialogContent>
          {noShowDetailsDialog.job && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {(noShowDetailsDialog.job.incident_reporter_first_name != null ||
                noShowDetailsDialog.job.incident_reporter_last_name != null) && (
                <Box sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1, display: 'block' }}
                  >
                    Reported By:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      alt={`${noShowDetailsDialog.job.incident_reporter_first_name ?? ''} ${noShowDetailsDialog.job.incident_reporter_last_name ?? ''}`}
                      src={noShowDetailsDialog.job.incident_reporter_photo_url || ''}
                      sx={{ width: 40, height: 40 }}
                    >
                      {(noShowDetailsDialog.job.incident_reporter_first_name ?? '?')
                        .charAt(0)
                        .toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {[noShowDetailsDialog.job.incident_reporter_first_name, noShowDetailsDialog.job.incident_reporter_last_name]
                        .filter(Boolean)
                        .join(' ') || '—'}
                    </Typography>
                  </Box>
                </Box>
              )}
              {noShowDetailsDialog.job.incident_reported_at && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Reported Date & Time:
                  </Typography>
                  <Typography variant="body2">
                    {fDate(noShowDetailsDialog.job.incident_reported_at)} at{' '}
                    {fTime(noShowDetailsDialog.job.incident_reported_at)}
                  </Typography>
                </Box>
              )}
              {noShowDetailsDialog.job.incident_reason ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Memo / Reason:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {noShowDetailsDialog.job.incident_reason}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No memo or reason provided
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoShowDetailsDialog({ open: false, job: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Details */}
      <Dialog
        open={rejectionDetailsDialog.open}
        onClose={() => setRejectionDetailsDialog({ open: false, job: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rejection Details</DialogTitle>
        <DialogContent>
          {rejectionDetailsDialog.job && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {rejectionDetailsDialog.job.rejected_at && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Rejected Date & Time:
                  </Typography>
                  <Typography variant="body2">
                    {fDate(rejectionDetailsDialog.job.rejected_at, 'MMM DD YYYY')} at{' '}
                    {fTime(rejectionDetailsDialog.job.rejected_at)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Rejected By:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {rejectionDetailsDialog.job.response_by_first_name != null ||
                  rejectionDetailsDialog.job.response_by_last_name != null ? (
                    <>
                      <Avatar
                        alt={`${rejectionDetailsDialog.job.response_by_first_name ?? ''} ${rejectionDetailsDialog.job.response_by_last_name ?? ''}`}
                        src={rejectionDetailsDialog.job.response_by_photo_url || ''}
                        sx={{ width: 40, height: 40 }}
                      >
                        {(rejectionDetailsDialog.job.response_by_first_name ?? '?').charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {[rejectionDetailsDialog.job.response_by_first_name, rejectionDetailsDialog.job.response_by_last_name]
                          .filter(Boolean)
                          .join(' ') || '—'}
                        {rejectionDetailsDialog.job.response_by &&
                          rejectionDetailsDialog.job.response_by !== currentUser.id && (
                            <Typography component="span" variant="body2" color="text.secondary">
                              {' '}(on behalf of worker)
                            </Typography>
                          )}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Avatar
                        alt={currentUser.display_name ?? `${currentUser.first_name} ${currentUser.last_name}`}
                        src={currentUser.photo_url || ''}
                        sx={{ width: 40, height: 40 }}
                      >
                        {(currentUser.first_name ?? '?').charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {(currentUser.display_name ??
                          [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ')) ||
                          '—'}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
              {rejectionDetailsDialog.job.rejection_reason ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Reason:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {rejectionDetailsDialog.job.rejection_reason}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No reason provided
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDetailsDialog({ open: false, job: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <JobDetailsDialog
        open={jobDetailsDialogOpen}
        onClose={() => {
          setJobDetailsDialogOpen(false);
          setSelectedJobIdForDetails(null);
        }}
        jobId={selectedJobIdForDetails ?? ''}
      />
    </Box>
  );
}
