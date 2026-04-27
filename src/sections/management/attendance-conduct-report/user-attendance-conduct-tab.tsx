import type { Dayjs } from 'dayjs';
import type { IUser } from 'src/types/user';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Menu from '@mui/material/Menu';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import CardContent from '@mui/material/CardContent';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TablePagination from '@mui/material/TablePagination';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { getPositionColor } from 'src/utils/format-role';
import { fDate, fTime, fDateTime, formatPatterns } from 'src/utils/format-time';
import { openDocumentUrl, getDocumentDisplayUrl } from 'src/utils/document-url';

import { fetcher, endpoints } from 'src/lib/axios';
import { provinceList } from 'src/assets/data/assets';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { TableNoData } from 'src/components/table';
import { Scrollbar } from 'src/components/scrollbar';

import { JobDetailsDialog } from 'src/sections/work/calendar/job-details-dialog';

import { AttendanceConductScoreOverview } from './attendance-conduct-score-overview';
import { DeductHistoryMobileList } from './user-attendance-conduct-deduct-mobile-list';
import { AUTO_BONUS_DISPLAY, getEarnBackCategory, EARN_BACK_CATEGORIES } from './conduct-score-policy';
import {
  buildIncidentActivitySeries,
  AttendanceConductDataActivity,
} from './attendance-conduct-data-activity';
import {
  isAttachmentPdf,
  isAttachmentImage,
  AttachmentPdfPreview,
  AttachmentImagePreview,
} from './attendance-conduct-report-attachment-previews';

import type { AttendanceConductCategoryItem, AttendanceConductPositiveItem } from './attendance-conduct-score-overview';

// ----------------------------------------------------------------------

/** Categories that impact score (shown in score overview and data activity). */
const SCORE_IMPACT_CATEGORIES: { value: string; label: string; key: string }[] = [
  { value: 'noShowUnpaid', label: 'No Show', key: 'noShowUnpaid' },
  { value: 'sentHomeNoPpe', label: 'Sent home from site (No PPE)', key: 'sentHomeNoPpe' },
  { value: 'leftEarlyNoNotice', label: 'Left Early No Notice', key: 'leftEarlyNoNotice' },
  { value: 'lateOnSite', label: 'Late on Site', key: 'lateOnSite' },
  { value: 'refusalOfShifts', label: 'Refusal of Shift', key: 'refusalOfShifts' },
  { value: 'calledInSick', label: 'Called in Sick', key: 'calledInSick' },
  { value: 'unauthorizedDriving', label: 'Unauthorized Driving', key: 'unauthorizedDriving' },
  { value: 'drivingInfractions', label: 'Driving Infractions', key: 'drivingInfractions' },
  { value: 'verbalWarningsWriteUp', label: 'Verbal Warnings / Write Up', key: 'verbalWarningsWriteUp' },
];

/** Fallback points when stored score is missing (aligned with conduct report create policy). */
const SCORE_DEDUCT_PER_OCCURRENCE: Record<string, number> = {
  noShowUnpaid: 30,
  sentHomeNoPpe: 20,
  leftEarlyNoNotice: 20,
  lateOnSite: 10,
  refusalOfShifts: 25,
  calledInSick: 2,
  unapprovedDaysOffShortNotice: 10,
  unauthorizedDriving: 30,
  drivingInfractions: 15,
  verbalWarningsWriteUp: 5,
};

/** Only show score impact for incidents on or after this date (attendance & conduct launch). */
const SCORE_IMPACT_CUTOFF_DATE = '2026-03-11';

function getScoreImpactDisplay(
  categoryKey: string,
  incidentDate: string | Date | null | undefined
): string {
  if (incidentDate == null) return '0';
  const deduct = SCORE_DEDUCT_PER_OCCURRENCE[categoryKey];
  if (deduct == null) return '0';
  if (dayjs(incidentDate).isBefore(dayjs(SCORE_IMPACT_CUTOFF_DATE), 'day')) return '0';
  return `-${deduct}`;
}

/** Tab order: score-impacting first → then categories that don’t impact score (sick leave, vacation, payout) later */
const CONDUCT_CATEGORIES: { value: string; label: string; key: string }[] = [
  { value: 'noShowUnpaid', label: 'No Show (Unpaid)', key: 'noShowUnpaid' },
  { value: 'refusalOfShifts', label: 'Refusal of shift', key: 'refusalOfShifts' },
  { value: 'sentHomeNoPpe', label: 'Sent home from site (No PPE)', key: 'sentHomeNoPpe' },
  { value: 'leftEarlyNoNotice', label: 'Left Early No Notice', key: 'leftEarlyNoNotice' },
  { value: 'lateOnSite', label: 'Late on Site', key: 'lateOnSite' },
  { value: 'unapprovedDaysOffShortNotice', label: 'Unapproved Days Off / Short Notice', key: 'unapprovedDaysOffShortNotice' },
  { value: 'calledInSick', label: 'Called in Sick', key: 'calledInSick' },
  { value: 'unauthorizedDriving', label: 'Unauthorized Driving', key: 'unauthorizedDriving' },
  { value: 'drivingInfractions', label: 'Driving Infractions', key: 'drivingInfractions' },
  { value: 'verbalWarningsWriteUp', label: 'Verbal Warnings / Write Up', key: 'verbalWarningsWriteUp' },
  { value: 'sickLeaveUnpaid', label: 'Sick Leave (Unpaid)', key: 'sickLeaveUnpaid' },
  { value: 'sickLeave5', label: 'Sick Leave (5)', key: 'sickLeave5' },
  { value: 'vacationDayUnpaid', label: 'Vacation Day (Unpaid)', key: 'vacationDayUnpaid' },
  { value: 'vacationDay10', label: 'Vacation Day (10)', key: 'vacationDay10' },
  { value: 'personalDayOffUnpaid', label: 'Personal Day Off (Unpaid)', key: 'personalDayOffUnpaid' },
  { value: 'unapprovePayoutWithoutDayOff', label: 'Unapprove Payout without Day Off', key: 'unapprovePayoutWithoutDayOff' },
];

/** Tab label color per category (same style as Attendance & Conduct Report List page). */
const TAB_COLOR: Record<string, 'error' | 'warning' | 'success' | 'default'> = {
  noShowUnpaid: 'error',
  sentHomeNoPpe: 'error',
  leftEarlyNoNotice: 'error',
  lateOnSite: 'error',
  vacationDayUnpaid: 'warning',
  sickLeaveUnpaid: 'warning',
  personalDayOffUnpaid: 'warning',
  vacationDay10: 'success',
  sickLeave5: 'success',
  calledInSick: 'warning',
  refusalOfShifts: 'error',
  unapprovedDaysOffShortNotice: 'error',
  unauthorizedDriving: 'error',
  drivingInfractions: 'error',
  unapprovePayoutWithoutDayOff: 'default',
  verbalWarningsWriteUp: 'error',
};

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
  sickLeave5: number;
  calledInSick: number;
  refusalOfShifts: number;
  unauthorizedDriving: number;
  unapprovePayoutWithoutDayOff: number;
  unapprovedDaysOffShortNotice: number;
  drivingInfractions: number;
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
  sickLeave5: 0,
  calledInSick: 0,
  refusalOfShifts: 0,
  unauthorizedDriving: 0,
  unapprovePayoutWithoutDayOff: 0,
  unapprovedDaysOffShortNotice: 0,
  drivingInfractions: 0,
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
  /** The employee being viewed (edit page) – used for display and other queries. */
  currentUser: IUser;
  /** Optional: use this for reports API so it matches the list row link (same as route param). */
  userId?: string;
  /**
   * When false (e.g. worker on Profile), hides delete, earn-back create/delete, and report row menus.
   * Default: true (management / admin edit user).
   */
  allowAdminActions?: boolean;
};

/** Columns for No Show and Sent home from site (No PPE) detail tables: Job #, Date, Customer, Site, Position, Score Impact, Reported by, Detail. */
const JOB_DETAIL_TABLE_HEAD = [
  { id: 'job_number', label: 'Job #' },
  { id: 'date', label: 'Date' },
  { id: 'customer', label: 'Customer' },
  { id: 'site', label: 'Site' },
  { id: 'position', label: 'Position' },
  { id: 'score_impact', label: 'Score Impact' },
  { id: 'reported_by', label: 'Reported by' },
  { id: 'detail', label: 'Detail' },
];

/** Columns for Unapproved Days Off: Job #, Date, Customer, Site, Position, When they notified, Score Impact, Reported by, Detail. */
const UNAPPROVED_DAYS_OFF_TABLE_HEAD = [
  { id: 'job_number', label: 'Job #' },
  { id: 'date', label: 'Date' },
  { id: 'customer', label: 'Customer' },
  { id: 'site', label: 'Site' },
  { id: 'position', label: 'Position' },
  { id: 'when_notified', label: 'When they notified' },
  { id: 'score_impact', label: 'Score Impact' },
  { id: 'reported_by', label: 'Reported by' },
  { id: 'detail', label: 'Detail' },
];

/** Columns for Late on Site tab: Job #, Date, Customer, Site, Position, Arrived Time, Score Impact, Reported by, Detail. */
const LATE_ON_SITE_TABLE_HEAD = [
  { id: 'job_number', label: 'Job #' },
  { id: 'date', label: 'Date' },
  { id: 'customer', label: 'Customer' },
  { id: 'site', label: 'Site' },
  { id: 'position', label: 'Position' },
  { id: 'arrived_time', label: 'Arrived Time' },
  { id: 'score_impact', label: 'Score Impact' },
  { id: 'reported_by', label: 'Reported by' },
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

/** Columns for Unauthorized Driving & Driving Infractions: Date, Score Impact, Reported by, Detail. */
const DATE_DETAIL_TABLE_HEAD = [
  { id: 'date', label: 'Date' },
  { id: 'score_impact', label: 'Score Impact' },
  { id: 'reported_by', label: 'Reported by' },
  { id: 'detail', label: 'Detail' },
];

/** Columns for Unapprove Payout without day Off. */
const PAYOUT_WITHOUT_DAY_OFF_TABLE_HEAD = [
  { id: 'requested_date', label: 'Requested Date' },
  { id: 'hours', label: 'Hours' },
  { id: 'reported_by', label: 'Reported by' },
  { id: 'detail', label: 'Detail' },
];

/** Columns for Verbal Warnings / Write Up. */
const VERBAL_WARNINGS_TABLE_HEAD = [
  { id: 'date', label: 'Date' },
  { id: 'category', label: 'Category' },
  { id: 'score_impact', label: 'Score Impact' },
  { id: 'reported_by', label: 'Reported by' },
  { id: 'detail', label: 'Detail' },
];

/** Format write-up category value (e.g. test_category_0) as display label (e.g. Test Category 0). */
function formatWriteUpCategoryLabel(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Date format for No Show table: Feb 01 2026 */
const NO_SHOW_DATE_FORMAT = 'MMM DD YYYY';

/** Reported by cell: avatar + name (primary), date and time (secondary), same style as Job List Created By. */
function ReportedByCell({
  firstName,
  lastName,
  photoUrl,
  dateTime,
}: {
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  dateTime?: string | null;
}) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (!name && !dateTime) return null;
  return (
    <ListItemText
      primary={
        name ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              src={photoUrl ?? undefined}
              alt={name}
              sx={{ width: 32, height: 32 }}
            >
              {firstName?.charAt(0)?.toUpperCase() ?? '?'}
            </Avatar>
            <Typography variant="body2" noWrap>
              {name}
            </Typography>
          </Stack>
        ) : null
      }
      secondary={
        dateTime && dayjs(dateTime).isValid()
          ? fDateTime(dateTime, formatPatterns.recordedByDateTime)
          : undefined
      }
      slotProps={{
        primary: { sx: { typography: 'body2' } },
        secondary: { sx: { mt: 0.5, typography: 'caption' } },
      }}
    />
  );
}


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

export function UserAttendanceConductTab({ currentUser, userId: userIdProp, allowAdminActions = true }: Props) {
  const userId = userIdProp ?? currentUser.id;
  const queryClient = useQueryClient();
  const showAdminActions = allowAdminActions;

  const themeMui = useTheme();
  const isMdUp = useMediaQuery(themeMui.breakpoints.up('md'));

  const [categoryTab, setCategoryTab] = useState<string>(CONDUCT_CATEGORIES[0].value);
  const [noShowDetailsDialog, setNoShowDetailsDialog] = useState<{ open: boolean; job: any | null }>({
    open: false,
    job: null,
  });
  const [rejectionDetailsDialog, setRejectionDetailsDialog] = useState<{ open: boolean; job: any | null }>({
    open: false,
    job: null,
  });
  const [calledInSickDetailsDialog, setCalledInSickDetailsDialog] = useState<{ open: boolean; job: any | null }>({
    open: false,
    job: null,
  });
  const [sentHomeNoPpeDetailsDialog, setSentHomeNoPpeDetailsDialog] = useState<{ open: boolean; report: any | null }>({
    open: false,
    report: null,
  });
  const [leftEarlyNoNoticeDetailsDialog, setLeftEarlyNoNoticeDetailsDialog] = useState<{ open: boolean; report: any | null }>({
    open: false,
    report: null,
  });
  const [lateOnSiteDetailsDialog, setLateOnSiteDetailsDialog] = useState<{ open: boolean; report: any | null }>({
    open: false,
    report: null,
  });
  const [unapprovedDaysOffDetailsDialog, setUnapprovedDaysOffDetailsDialog] = useState<{ open: boolean; report: any | null }>({
    open: false,
    report: null,
  });
  /** Unauthorized Driving / Driving Infractions detail dialog */
  const [dateTimeReportDetailsDialog, setDateTimeReportDetailsDialog] = useState<{
    open: boolean;
    report: any | null;
    title: string;
  }>({ open: false, report: null, title: '' });
  /** Verbal Warnings / Write Up detail dialog */
  const [verbalWarningsDetailsDialog, setVerbalWarningsDetailsDialog] = useState<{
    open: boolean;
    report: any | null;
  }>({ open: false, report: null });
  /** Time-off request details dialog (Sick Leave, Vacation Day, Personal Day Off tabs). */
  const [timeOffDetailsDialog, setTimeOffDetailsDialog] = useState<{
    open: boolean;
    request: any | null;
    tabLabel: string;
  }>({ open: false, request: null, tabLabel: '' });
  /** Unapprove Payout without Day Off details dialog. */
  const [payoutDetailsDialog, setPayoutDetailsDialog] = useState<{ open: boolean; report: any | null }>({
    open: false,
    report: null,
  });
  const [jobDetailsDialogOpen, setJobDetailsDialogOpen] = useState(false);
  const [selectedJobIdForDetails, setSelectedJobIdForDetails] = useState<string | null>(null);

  /** Earn-back award dialog */
  const [earnBackDialogOpen, setEarnBackDialogOpen] = useState(false);
  const [earnBackCategory, setEarnBackCategory] = useState('');
  const [earnBackMemo, setEarnBackMemo] = useState('');
  const [earnBackDate, setEarnBackDate] = useState<Dayjs | null>(null);
  const [deleteEarnBackId, setDeleteEarnBackId] = useState<string | null>(null);
  const [viewAwardDialog, setViewAwardDialog] = useState<{ open: boolean; award: any | null }>({ open: false, award: null });
  const [awardMenu, setAwardMenu] = useState<{ el: HTMLElement | null; id: string | null }>({ el: null, id: null });

  // Deductions table pagination
  const [deductPage, setDeductPage] = useState(0);
  const [deductRowsPerPage, setDeductRowsPerPage] = useState(10);

  // Recognition Awards: category filter (like Deduction History) + pagination
  const [awardsFilterTab, setAwardsFilterTab] = useState('all');
  const [awardsPage, setAwardsPage] = useState(0);
  const [awardsRowsPerPage, setAwardsRowsPerPage] = useState(10);

  const { data: conductData, isLoading } = useQuery({
    queryKey: ['user-attendance-conduct', userId],
    queryFn: async () => 
      // TODO: replace with dedicated endpoint when backend supports it
      // const res = await fetcher(`${endpoints.management.user}/${currentUser.id}/attendance-conduct`);
      // return res.data;
       mockConductDataWithCounts
    ,
    enabled: !!userId,
  });

  const { data: noShowJobHistory, isLoading: isLoadingNoShow } = useQuery({
    queryKey: ['worker-job-history', userId, 'no_show'],
    queryFn: async () => {
      const response = await fetcher(
        `${endpoints.work.job}/worker/${userId}/history?status=no_show&limit=500&offset=0`
      );
      return response.data;
    },
    enabled: !!userId,
  });

  const { data: rejectedJobHistory, isLoading: isLoadingRejected } = useQuery({
    queryKey: ['worker-job-history', userId, 'rejected'],
    queryFn: async () => {
      const response = await fetcher(
        `${endpoints.work.job}/worker/${userId}/history?status=rejected&limit=500&offset=0`
      );
      return response.data;
    },
    enabled: !!userId,
  });

  const { data: calledInSickJobHistory, isLoading: isLoadingCalledInSick } = useQuery({
    queryKey: ['worker-job-history', userId, 'called_in_sick'],
    queryFn: async () => {
      const response = await fetcher(
        `${endpoints.work.job}/worker/${userId}/history?status=called_in_sick&limit=500&offset=0`
      );
      return response.data;
    },
    enabled: !!userId,
  });

  const data = conductData ?? mockConductDataWithCounts;
  const noShowJobs = useMemo(() => noShowJobHistory?.jobs ?? [], [noShowJobHistory?.jobs]);
  const rejectionJobs = useMemo(() => rejectedJobHistory?.jobs ?? [], [rejectedJobHistory?.jobs]);
  const calledInSickJobs = useMemo(() => calledInSickJobHistory?.jobs ?? [], [calledInSickJobHistory?.jobs]);

  /** Use route param (userId prop) when provided so reports match list row; otherwise currentUser.id */
  const reportsUserId = userIdProp ?? currentUser?.id;

  const { data: reportsResponse, isLoading: isLoadingReports } = useQuery({
    queryKey: ['attendance-conduct-reports-by-user', reportsUserId],
    queryFn: async () => {
      if (!reportsUserId) return [];
      const url = `${endpoints.attendanceConductReport.list}?userId=${encodeURIComponent(String(reportsUserId))}`;
      const res = await fetcher(url);
      if (Array.isArray(res)) return res;
      if (res && typeof res === 'object' && res.data && Array.isArray((res as any).data.reports))
        return (res as any).data.reports;
      if (res && typeof res === 'object' && Array.isArray((res as any).reports)) return (res as any).reports;
      return [];
    },
    enabled: !!reportsUserId,
  });

  const reports = useMemo(
    () => (Array.isArray(reportsResponse) ? reportsResponse : []),
    [reportsResponse]
  );

  /**
   * No-show rows from job history (job_workers.status = no_show) plus formal reports
   * category noShowUnpaid that are not already represented in history (e.g. report filed without that status on the job).
   */
  const noShowJobsMerged = useMemo(() => {
    const fromHistory = noShowJobs;
    const jobIdsInHistory = new Set(
      fromHistory.map((j: any) => String(j.job_id ?? '').trim()).filter(Boolean)
    );
    const formalNoShows = reports.filter((r: any) => r.category === 'noShowUnpaid');
    const seenSyntheticJobIds = new Set<string>();
    const synthetic: any[] = [];
    for (const r of formalNoShows) {
      const jid = r.job_id != null ? String(r.job_id).trim() : '';
      if (jid && jobIdsInHistory.has(jid)) continue;
      if (jid && seenSyntheticJobIds.has(jid)) continue;
      if (jid) seenSyntheticJobIds.add(jid);
      synthetic.push({
        ...r,
        id: r.report_id ?? r.id,
        job_worker_id: r.job_worker_id,
        job_id: r.job_id,
        job_number: r.job_number,
        start_time: r.start_time,
        worker_start_time: r.worker_start_time,
        worker_end_time: r.worker_end_time,
        position: r.position,
        company_name: r.company_name,
        company_logo_url: r.company_logo_url,
        site_name: r.site_name,
        conduct_score_impact:
          r.score != null && r.score !== '' && !Number.isNaN(Number(r.score))
            ? Number(r.score)
            : undefined,
        incident_reporter_first_name: r.created_by_first_name,
        incident_reporter_last_name: r.created_by_last_name,
        incident_reporter_photo_url: r.created_by_photo_url,
        incident_reported_at: r.created_at,
        incident_reason: r.memo ?? r.detail,
        _fromFormalReport: true,
      });
    }
    return [...fromHistory, ...synthetic];
  }, [noShowJobs, reports]);

  /** Approved time-off for this user (for Sick Leave, Vacation Day, Personal Day Off tabs). */
  const { data: timeOffForUserResponse } = useQuery({
    queryKey: ['time-off-approved-by-user', reportsUserId],
    queryFn: async () => {
      if (!reportsUserId) return { timeOffRequests: [] };
      const res = await fetcher(
        `/api/time-off/admin/all?user_id=${encodeURIComponent(reportsUserId)}&status=approved&page=1&rowsPerPage=500`
      );
      const list = res?.data?.timeOffRequests ?? res?.timeOffRequests ?? [];
      return { timeOffRequests: Array.isArray(list) ? list : [] };
    },
    enabled: !!reportsUserId,
  });

  const timeOffApprovedForUser = useMemo(
    () => timeOffForUserResponse?.timeOffRequests ?? [],
    [timeOffForUserResponse?.timeOffRequests]
  );

  /** Sum calendar days for time-off rows (for tab counts: days not requests). */
  const sumTimeOffDays = (rows: { days?: number | null }[]) =>
    rows.reduce((s, r) => s + (r.days != null ? r.days : 1), 0);

  const mapTimeOffToRow = (r: any) => ({
    id: r.id,
    requested_time: r.created_at ?? r.start_date,
    requested_time_has_time: !!r.created_at,
    start_date: r.start_date,
    end_date: r.end_date,
    date_range:
      r.start_date && r.end_date
        ? `${fDate(r.start_date, NO_SHOW_DATE_FORMAT)} - ${fDate(r.end_date, NO_SHOW_DATE_FORMAT)}`
        : null,
    days:
      r.start_date && r.end_date
        ? dayjs(r.end_date).diff(dayjs(r.start_date), 'day') + 1
        : null,
    confirmed_by_first_name: r.confirmed_by_first_name,
    confirmed_by_last_name: r.confirmed_by_last_name,
    confirmed_by_photo_url: r.confirmed_by_photo_url,
    confirmed_at: r.confirmed_at,
    detail: r.reason ?? null,
    timeOffRequest: r,
  });

  const vacationDayUnpaidRows = useMemo(
    () =>
      timeOffApprovedForUser
        .filter((r: any) => r.type === 'vacation' && r.is_paid === false)
        .map(mapTimeOffToRow),
    [timeOffApprovedForUser]
  );

  const sickLeaveUnpaidRows = useMemo(
    () =>
      timeOffApprovedForUser
        .filter((r: any) => r.type === 'sick_leave' && r.is_paid === false)
        .map(mapTimeOffToRow),
    [timeOffApprovedForUser]
  );

  const personalDayOffUnpaidRows = useMemo(
    () =>
      timeOffApprovedForUser
        .filter((r: any) => (r.type === 'day_off' || r.type === 'personal_leave') && (r.is_paid === false || r.is_paid == null))
        .map(mapTimeOffToRow),
    [timeOffApprovedForUser]
  );

  const vacationDay10Rows = useMemo(
    () =>
      timeOffApprovedForUser
        .filter((r: any) => r.type === 'vacation' && r.is_paid === true)
        .map(mapTimeOffToRow),
    [timeOffApprovedForUser]
  );

  const sickLeave5Rows = useMemo(
    () =>
      timeOffApprovedForUser
        .filter((r: any) => r.type === 'sick_leave' && r.is_paid === true)
        .map(mapTimeOffToRow),
    [timeOffApprovedForUser]
  );

  const sentHomeNoPpeJobs = useMemo(
    () => reports.filter((r: any) => r.category === 'sentHomeNoPpe'),
    [reports]
  );

  const leftEarlyNoNoticeJobs = useMemo(
    () => reports.filter((r: any) => r.category === 'leftEarlyNoNotice'),
    [reports]
  );

  const unapprovedDaysOffShortNoticeJobs = useMemo(
    () => reports.filter((r: any) => r.category === 'unapprovedDaysOffShortNotice'),
    [reports]
  );

  const lateOnSiteJobs = useMemo(
    () =>
      reports
        .filter((r: any) => r.category === 'lateOnSite')
        .map((r: any) => ({ ...r, arrived_time: r.arrived_at_site_time })),
    [reports]
  );

  const unauthorizedDrivingRows = useMemo(
    () =>
      reports
        .filter((r: any) => r.category === 'unauthorizedDriving')
        .map((r: any) => ({
          ...r,
          id: r.id,
          date: r.report_date_time,
          detail: r.detail,
        })),
    [reports]
  );

  const drivingInfractionsRows = useMemo(
    () =>
      reports
        .filter((r: any) => r.category === 'drivingInfractions')
        .map((r: any) => ({
          ...r,
          id: r.id,
          date: r.report_date_time,
          detail: r.detail,
        })),
    [reports]
  );

  const unapprovePayoutWithoutDayOffRows = useMemo(
    () =>
      reports
        .filter((r: any) => r.category === 'unapprovePayoutWithoutDayOff')
        .map((r: any) => ({
          id: r.id,
          requested_date: r.report_date_time,
          hours: r.hours,
          detail: r.detail,
          memo: r.memo,
          created_by_first_name: r.created_by_first_name,
          created_by_last_name: r.created_by_last_name,
          created_by_photo_url: r.created_by_photo_url,
          created_at: r.created_at,
          report: r,
        })),
    [reports]
  );

  const verbalWarningsWriteUpRows = useMemo(
    () =>
      reports
        .filter((r: any) => r.category === 'verbalWarningsWriteUp')
        .map((r: any) => ({
          id: r.id,
          date: r.report_date_time,
          category: r.write_up_category,
          detail: r.detail,
          created_by_first_name: r.created_by_first_name,
          created_by_last_name: r.created_by_last_name,
          created_by_photo_url: r.created_by_photo_url,
          created_at: r.created_at,
          report: r,
        })),
    [reports]
  );


  function getScoreImpactValueForJob(type: 'noShow' | 'rejection' | 'calledInSick', job: any): number {
    const stored = job?.conduct_score_impact;
    if (typeof stored === 'number' && !Number.isNaN(stored)) return -Math.abs(stored);
    const categoryKey = type === 'noShow' ? 'noShowUnpaid' : type === 'rejection' ? 'refusalOfShifts' : 'calledInSick';
    const dateVal = type === 'noShow' ? job?.start_time : type === 'rejection' ? job?.rejected_at : job?.start_time ?? job?.reported_at;
    const display = getScoreImpactDisplay(categoryKey, dateVal);
    if (display === '0') return 0;
    const n = parseInt(display.slice(1), 10);
    return Number.isNaN(n) ? 0 : -n;
  }

  const scoreOverviewData: AttendanceConductCategoryItem[] = useMemo(() => {
    const base = data as Record<string, number>;
    const reportCount = (key: string) => {
      if (key === 'noShowUnpaid') return noShowJobsMerged.length;
      if (key === 'refusalOfShifts') return rejectionJobs.length;
      if (key === 'calledInSick') return calledInSickJobs.length;
      if (key === 'sentHomeNoPpe') return sentHomeNoPpeJobs.length;
      if (key === 'leftEarlyNoNotice') return leftEarlyNoNoticeJobs.length;
      if (key === 'lateOnSite') return lateOnSiteJobs.length;
      if (key === 'unauthorizedDriving') return unauthorizedDrivingRows.length;
      if (key === 'drivingInfractions') return drivingInfractionsRows.length;
      if (key === 'verbalWarningsWriteUp') return verbalWarningsWriteUpRows.length;
      if (key === 'vacationDayUnpaid') return sumTimeOffDays(vacationDayUnpaidRows);
      if (key === 'sickLeaveUnpaid') return sumTimeOffDays(sickLeaveUnpaidRows);
      if (key === 'personalDayOffUnpaid') return sumTimeOffDays(personalDayOffUnpaidRows);
      if (key === 'vacationDay10') return sumTimeOffDays(vacationDay10Rows);
      if (key === 'sickLeave5') return sumTimeOffDays(sickLeave5Rows);
      return base[key] ?? 0;
    };
    return SCORE_IMPACT_CATEGORIES.map((cat) => {
      const count = reportCount(cat.key);
      let deduct: number;
      if (cat.key === 'noShowUnpaid') {
        deduct = noShowJobsMerged.reduce(
          (sum: number, job: any) => sum + Math.abs(getScoreImpactValueForJob('noShow', job)),
          0
        );
      } else if (cat.key === 'refusalOfShifts') {
        deduct = rejectionJobs.reduce(
          (sum: number, job: any) => sum + Math.abs(getScoreImpactValueForJob('rejection', job)),
          0
        );
      } else if (cat.key === 'calledInSick') {
        deduct = calledInSickJobs.reduce(
          (sum: number, job: any) => sum + Math.abs(getScoreImpactValueForJob('calledInSick', job)),
          0
        );
      } else if (cat.key === 'sentHomeNoPpe') {
        deduct = sentHomeNoPpeJobs.reduce((sum: number, r: any) => {
          const v = r.score;
          if (v != null && v !== '' && !Number.isNaN(Number(v))) return sum + Math.abs(Number(v));
          return sum + (SCORE_DEDUCT_PER_OCCURRENCE.sentHomeNoPpe ?? 0);
        }, 0);
      } else if (cat.key === 'leftEarlyNoNotice') {
        deduct = leftEarlyNoNoticeJobs.reduce((sum: number, r: any) => {
          const v = r.score;
          if (v != null && v !== '' && !Number.isNaN(Number(v))) return sum + Math.abs(Number(v));
          return sum + (SCORE_DEDUCT_PER_OCCURRENCE.leftEarlyNoNotice ?? 0);
        }, 0);
      } else if (cat.key === 'lateOnSite') {
        deduct = lateOnSiteJobs.reduce((sum: number, r: any) => {
          const v = r.score;
          if (v != null && v !== '' && !Number.isNaN(Number(v))) return sum + Math.abs(Number(v));
          return sum + (SCORE_DEDUCT_PER_OCCURRENCE.lateOnSite ?? 0);
        }, 0);
      } else if (cat.key === 'unauthorizedDriving') {
        deduct = unauthorizedDrivingRows.reduce((sum: number, r: any) => {
          const v = r.score;
          if (v != null && v !== '' && !Number.isNaN(Number(v))) return sum + Math.abs(Number(v));
          return sum + (SCORE_DEDUCT_PER_OCCURRENCE.unauthorizedDriving ?? 0);
        }, 0);
      } else if (cat.key === 'drivingInfractions') {
        deduct = drivingInfractionsRows.reduce((sum: number, r: any) => {
          const v = r.score;
          if (v != null && v !== '' && !Number.isNaN(Number(v))) return sum + Math.abs(Number(v));
          return sum + (SCORE_DEDUCT_PER_OCCURRENCE.drivingInfractions ?? 0);
        }, 0);
      } else if (cat.key === 'verbalWarningsWriteUp') {
        deduct = verbalWarningsWriteUpRows.reduce((sum: number, r: any) => {
          const v = r.score;
          if (v != null && v !== '' && !Number.isNaN(Number(v))) return sum + Math.abs(Number(v));
          return sum + (SCORE_DEDUCT_PER_OCCURRENCE.verbalWarningsWriteUp ?? 0);
        }, 0);
      } else if (cat.key === 'unapprovedDaysOffShortNotice') {
        deduct = unapprovedDaysOffShortNoticeJobs.reduce((sum: number, r: any) => {
          const v = r.score;
          if (v != null && v !== '' && !Number.isNaN(Number(v))) return sum + Math.abs(Number(v));
          return sum + (SCORE_DEDUCT_PER_OCCURRENCE.unapprovedDaysOffShortNotice ?? 0);
        }, 0);
      } else {
        const pointsPer = SCORE_DEDUCT_PER_OCCURRENCE[cat.key] ?? 0;
        deduct = count > 0 ? count * pointsPer : 0;
      }
      return {
        name: cat.label,
        count,
        deduct: deduct > 0 ? deduct : undefined,
      };
    });
     
  }, [
    data,
    noShowJobsMerged,
    rejectionJobs,
    calledInSickJobs,
    sentHomeNoPpeJobs,
    leftEarlyNoNoticeJobs,
    lateOnSiteJobs,
    unauthorizedDrivingRows,
    drivingInfractionsRows,
    verbalWarningsWriteUpRows,
    unapprovedDaysOffShortNoticeJobs,
    vacationDayUnpaidRows,
    sickLeaveUnpaidRows,
    personalDayOffUnpaidRows,
    vacationDay10Rows,
    sickLeave5Rows,
  ]);



  const categoriesToShow = useMemo(
    () => CONDUCT_CATEGORIES.filter((c) => c.value === categoryTab),
    [categoryTab]
  );

  function formatScoreImpactValue(value: number): string {
    return value === 0 ? '0' : String(value);
  }

  /** Tab counts: time-off tabs use days (not request count); others use list length. */
  /** Incident activity chart: real data, same order as tabs (No Show → Verbal Warnings / Write Up). */
  const incidentActivitySeries = useMemo(() => {
    const reportDate = (r: { report_date_time?: string | null; created_at?: string | null }) =>
      r.report_date_time ?? r.created_at ?? null;
    const datesPerCategory: (string | null | undefined)[][] = [
      noShowJobsMerged.map((j: { start_time?: string | null }) => j.start_time).filter(Boolean),
      rejectionJobs.map((j: { rejected_at?: string | null }) => j.rejected_at).filter(Boolean),
      sentHomeNoPpeJobs.map((r: { report_date_time?: string | null; created_at?: string | null }) => reportDate(r)).filter(Boolean),
      leftEarlyNoNoticeJobs.map((r: { report_date_time?: string | null; created_at?: string | null }) => reportDate(r)).filter(Boolean),
      lateOnSiteJobs.map((r: { report_date_time?: string | null; created_at?: string | null }) => reportDate(r)).filter(Boolean),
      unapprovedDaysOffShortNoticeJobs.map((r: { report_date_time?: string | null; created_at?: string | null }) => reportDate(r)).filter(Boolean),
      calledInSickJobs.map((j: { start_time?: string | null; reported_at?: string | null }) => j.start_time ?? j.reported_at).filter(Boolean),
      unauthorizedDrivingRows.map((r: { report_date_time?: string | null; created_at?: string | null }) => reportDate(r)).filter(Boolean),
      drivingInfractionsRows.map((r: { report_date_time?: string | null; created_at?: string | null }) => reportDate(r)).filter(Boolean),
      verbalWarningsWriteUpRows.map((r: { report_date_time?: string | null; created_at?: string | null }) => reportDate(r)).filter(Boolean),
    ];
    return buildIncidentActivitySeries(datesPerCategory);
  }, [
    noShowJobsMerged,
    rejectionJobs,
    calledInSickJobs,
    sentHomeNoPpeJobs,
    leftEarlyNoNoticeJobs,
    lateOnSiteJobs,
    unapprovedDaysOffShortNoticeJobs,
    unauthorizedDrivingRows,
    drivingInfractionsRows,
    verbalWarningsWriteUpRows,
  ]);

  const tabCountByCategory = useMemo(() => {
    const base = data as Record<string, number>;
    return {
      noShowUnpaid: noShowJobsMerged.length ?? base.noShowUnpaid ?? 0,
      sentHomeNoPpe: sentHomeNoPpeJobs.length ?? base.sentHomeNoPpe ?? 0,
      leftEarlyNoNotice: leftEarlyNoNoticeJobs.length ?? base.leftEarlyNoNotice ?? 0,
      lateOnSite: lateOnSiteJobs.length ?? base.lateOnSite ?? 0,
      vacationDayUnpaid: sumTimeOffDays(vacationDayUnpaidRows),
      sickLeaveUnpaid: sumTimeOffDays(sickLeaveUnpaidRows),
      personalDayOffUnpaid: sumTimeOffDays(personalDayOffUnpaidRows),
      vacationDay10: sumTimeOffDays(vacationDay10Rows),
      sickLeave5: sumTimeOffDays(sickLeave5Rows),
      calledInSick: calledInSickJobs.length ?? base.calledInSick ?? 0,
      refusalOfShifts: rejectionJobs.length ?? base.refusalOfShifts ?? 0,
      unapprovedDaysOffShortNotice: unapprovedDaysOffShortNoticeJobs.length ?? base.unapprovedDaysOffShortNotice ?? 0,
      unauthorizedDriving: unauthorizedDrivingRows.length ?? base.unauthorizedDriving ?? 0,
      drivingInfractions: drivingInfractionsRows.length ?? base.drivingInfractions ?? 0,
      unapprovePayoutWithoutDayOff: unapprovePayoutWithoutDayOffRows.length ?? base.unapprovePayoutWithoutDayOff ?? 0,
      verbalWarningsWriteUp: verbalWarningsWriteUpRows.length ?? base.verbalWarningsWriteUp ?? 0,
    };
  }, [
    data,
    noShowJobsMerged.length,
    rejectionJobs.length,
    calledInSickJobs.length,
    sentHomeNoPpeJobs.length,
    leftEarlyNoNoticeJobs.length,
    lateOnSiteJobs.length,
    unapprovedDaysOffShortNoticeJobs.length,
    unauthorizedDrivingRows.length,
    drivingInfractionsRows.length,
    unapprovePayoutWithoutDayOffRows.length,
    verbalWarningsWriteUpRows.length,
    vacationDayUnpaidRows,
    sickLeaveUnpaidRows,
    personalDayOffUnpaidRows,
    vacationDay10Rows,
    sickLeave5Rows,
  ]);

  const handleCategoryTabChange = (_: React.SyntheticEvent, value: string) => {
    setCategoryTab(value);
    setDeductPage(0);
  };

  const handleAwardsFilterChange = (_: React.SyntheticEvent, newValue: string) => {
    setAwardsFilterTab(newValue);
    setAwardsPage(0);
  };

  const openDeductRowDetails = useCallback(
    (row: any) => {
      switch (categoryTab) {
        case 'noShowUnpaid':
          setNoShowDetailsDialog({ open: true, job: row });
          break;
        case 'refusalOfShifts':
          setRejectionDetailsDialog({ open: true, job: row });
          break;
        case 'calledInSick':
          setCalledInSickDetailsDialog({ open: true, job: row });
          break;
        case 'sentHomeNoPpe':
          setSentHomeNoPpeDetailsDialog({ open: true, report: row });
          break;
        case 'leftEarlyNoNotice':
          setLeftEarlyNoNoticeDetailsDialog({ open: true, report: row });
          break;
        case 'unapprovedDaysOffShortNotice':
          setUnapprovedDaysOffDetailsDialog({ open: true, report: row });
          break;
        case 'lateOnSite':
          setLateOnSiteDetailsDialog({ open: true, report: row });
          break;
        case 'vacationDayUnpaid':
        case 'sickLeaveUnpaid':
        case 'personalDayOffUnpaid':
        case 'vacationDay10':
        case 'sickLeave5':
          setTimeOffDetailsDialog({
            open: true,
            request: row.timeOffRequest ?? row,
            tabLabel: CONDUCT_CATEGORIES.find((c) => c.value === categoryTab)?.label ?? 'Time off',
          });
          break;
        case 'unauthorizedDriving':
        case 'drivingInfractions':
          setDateTimeReportDetailsDialog({
            open: true,
            report: row,
            title:
              categoryTab === 'unauthorizedDriving'
                ? 'Unauthorized Driving Details'
                : 'Driving Infractions Details',
          });
          break;
        case 'unapprovePayoutWithoutDayOff':
          setPayoutDetailsDialog({ open: true, report: row.report ?? row });
          break;
        case 'verbalWarningsWriteUp':
          setVerbalWarningsDetailsDialog({ open: true, report: row.report });
          break;
        default:
          break;
      }
    },
    [categoryTab]
  );

  // ---------------------------------------------------------------------------
  // Earn-back awards
  // ---------------------------------------------------------------------------

  const { data: earnBackAwards, isLoading: isLoadingEarnBack } = useQuery({
    queryKey: ['earn-back-awards', userId],
    queryFn: async () => {
      const res = await fetcher(
        `${endpoints.earnBackAward.list}?userId=${encodeURIComponent(String(userId))}`
      );
      return (res?.data ?? []) as any[];
    },
    enabled: !!userId,
  });

  /** Live-computed automated bonuses from the backend. */
  const { data: computedBonuses, isLoading: isLoadingComputed } = useQuery({
    queryKey: ['earn-back-computed', userId],
    queryFn: async () => {
      const res = await fetcher(
        `${endpoints.earnBackAward.computed}?userId=${encodeURIComponent(String(userId))}`
      );
      return res?.data as { total: number; bonuses: { key: string; label: string; points: number; active: boolean; detail: string }[] } | null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 min — recomputed on demand anyway
  });

  const totalManualEarnBack = useMemo(
    () => (earnBackAwards ?? []).reduce((sum: number, a: any) => sum + (Number(a.points) || 0), 0),
    [earnBackAwards]
  );

  const totalComputedEarnBack = computedBonuses?.total ?? 0;

  /**
   * Same score as Attendance & Conduct list / dashboard (`getScoresByUserIds` on the server).
   * The breakdown below can drift (subset of categories, cutoff display rules); this is the number
   * used everywhere else in the app.
   */
  const { data: canonicalConductScore } = useQuery({
    queryKey: ['user-canonical-conduct-score', userId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '1',
        orderBy: 'first_name',
        order: 'asc',
        include: 'conductCounts',
        ids: String(userId),
      });
      const res = await fetcher(`${endpoints.management.user}?${params.toString()}`);
      const scores = res?.data?.scores ?? res?.scores ?? {};
      const raw = scores[String(userId)];
      if (raw == null || Number.isNaN(Number(raw))) return null;
      return Math.round(Number(raw));
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const createEarnBackMutation = useMutation({
    mutationFn: async (payload: { userId: string; category: string; memo: string; awardedDate: string }) => {
      await fetcher([
        endpoints.earnBackAward.create,
        { method: 'post', data: payload },
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earn-back-awards', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-computed-score', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-canonical-conduct-score', userId] });
      setEarnBackDialogOpen(false);
      setEarnBackCategory('');
      setEarnBackMemo('');
      setEarnBackDate(null);
    },
  });

  const deleteEarnBackMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetcher([endpoints.earnBackAward.delete(id), { method: 'delete' }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earn-back-awards', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-computed-score', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-canonical-conduct-score', userId] });
      setDeleteEarnBackId(null);
    },
  });

  const [reportMenu, setReportMenu] = useState<{ el: HTMLElement | null; id: string | null }>({ el: null, id: null });
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);

  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetcher([endpoints.attendanceConductReport.delete(id), { method: 'delete' }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-conduct-reports-by-user', reportsUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-computed-score', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-canonical-conduct-score', userId] });
      setDeleteReportId(null);
    },
  });

  function handleAddEarnBack() {
    if (!earnBackCategory) return;
    createEarnBackMutation.mutate({
      userId: String(userId),
      category: earnBackCategory,
      memo: earnBackMemo,
      awardedDate: earnBackDate?.format('YYYY-MM-DD') ?? '',
    });
  }

  /** All rows for the currently active deductions tab (used for pagination count + slicing). */
  const deductCurrentRows = useMemo((): any[] => {
    switch (categoryTab) {
      case 'noShowUnpaid': return noShowJobsMerged;
      case 'sentHomeNoPpe': return sentHomeNoPpeJobs;
      case 'leftEarlyNoNotice': return leftEarlyNoNoticeJobs;
      case 'calledInSick': return calledInSickJobs;
      case 'refusalOfShifts': return rejectionJobs;
      case 'unapprovedDaysOffShortNotice': return unapprovedDaysOffShortNoticeJobs;
      case 'lateOnSite': return lateOnSiteJobs;
      case 'vacationDayUnpaid': return vacationDayUnpaidRows;
      case 'sickLeaveUnpaid': return sickLeaveUnpaidRows;
      case 'personalDayOffUnpaid': return personalDayOffUnpaidRows;
      case 'vacationDay10': return vacationDay10Rows;
      case 'sickLeave5': return sickLeave5Rows;
      case 'unauthorizedDriving': return unauthorizedDrivingRows;
      case 'drivingInfractions': return drivingInfractionsRows;
      case 'unapprovePayoutWithoutDayOff': return unapprovePayoutWithoutDayOffRows;
      case 'verbalWarningsWriteUp': return verbalWarningsWriteUpRows;
      default: return [];
    }
   
  }, [
    categoryTab,
    noShowJobsMerged, sentHomeNoPpeJobs, leftEarlyNoNoticeJobs, calledInSickJobs,
    rejectionJobs, unapprovedDaysOffShortNoticeJobs, lateOnSiteJobs,
    vacationDayUnpaidRows, sickLeaveUnpaidRows, personalDayOffUnpaidRows,
    vacationDay10Rows, sickLeave5Rows,
    unauthorizedDrivingRows, drivingInfractionsRows,
    unapprovePayoutWithoutDayOffRows, verbalWarningsWriteUpRows,
  ]);

  const deductPagedRows = useMemo(
    () => deductCurrentRows.slice(deductPage * deductRowsPerPage, (deductPage + 1) * deductRowsPerPage),
    [deductCurrentRows, deductPage, deductRowsPerPage]
  );

  const earnBackAwardsByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of earnBackAwards ?? []) {
      const k = a.category as string | undefined;
      if (k) m[k] = (m[k] ?? 0) + 1;
    }
    return m;
  }, [earnBackAwards]);

  const earnBackAwardsFiltered = useMemo(() => {
    const list = earnBackAwards ?? [];
    if (awardsFilterTab === 'all') return list;
    return list.filter((a: any) => a.category === awardsFilterTab);
  }, [earnBackAwards, awardsFilterTab]);

  const paginatedAwards = useMemo(
    () =>
      earnBackAwardsFiltered.slice(awardsPage * awardsRowsPerPage, (awardsPage + 1) * awardsRowsPerPage),
    [earnBackAwardsFiltered, awardsPage, awardsRowsPerPage]
  );

  /** Positive items for the "+" tab of the score overview. */
  const scorePositiveData = useMemo((): AttendanceConductPositiveItem[] => {
    const items: AttendanceConductPositiveItem[] = [];
    for (const bonus of computedBonuses?.bonuses ?? []) {
      if (bonus.active && bonus.points > 0) {
        items.push({ name: bonus.label, points: bonus.points, auto: true });
      }
    }
    for (const award of earnBackAwards ?? []) {
      const pts = Number(award.points);
      if (!Number.isNaN(pts) && pts > 0) {
        const cat = getEarnBackCategory(award.category);
        items.push({ name: cat?.label ?? award.category, points: pts, auto: false });
      }
    }
    return items;
  }, [computedBonuses, earnBackAwards]);

  /**
   * Derived from the same data that populates the deduction and bonus panels so
   * the displayed score always equals 100 − totalDeductions + totalBonuses.
   */
  const displayedScore = useMemo(() => {
    const totalDeduction = scoreOverviewData.reduce((sum, item) => sum + (item.deduct ?? 0), 0);
    const totalEarnBack = scorePositiveData.reduce((sum, item) => sum + item.points, 0);
    return 100 - totalDeduction + totalEarnBack;
  }, [scoreOverviewData, scorePositiveData]);

  const overviewScore = canonicalConductScore ?? displayedScore;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          /** Stretch so Incident activity card height matches the Score card (taller of the two). */
          alignItems: 'stretch',
        }}
      >
        <AttendanceConductScoreOverview
          score={overviewScore}
          data={scoreOverviewData}
          positiveData={scorePositiveData}
          sx={{
            flexShrink: 0,
            width: { xs: '100%', md: 320 },
            height: { xs: 'auto', md: '100%' },
          }}
        />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            alignSelf: 'stretch',
          }}
        >
          <AttendanceConductDataActivity
            title="Incident activity"
            subheader="Default: last 4 weeks (Mon-Sun). Switch to Last 4 months, Monthly, or Yearly for broader trends."
            chart={{ series: incidentActivitySeries }}
            sx={{ width: '100%', height: '100%', minHeight: 0 }}
          />
        </Box>
      </Box>

      <Card>
        <CardHeader title="Deduction History" />
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
          {CONDUCT_CATEGORIES.map((cat) => {
            const count = tabCountByCategory[cat.value as keyof typeof tabCountByCategory] ?? 0;
            const color = TAB_COLOR[cat.value] ?? 'default';
            return (
              <Tab
                key={cat.value}
                value={cat.value}
                label={cat.label}
                icon={
                  <Label
                    variant={categoryTab === cat.value ? 'filled' : 'soft'}
                    color={color}
                  >
                    {count}
                  </Label>
                }
                iconPosition="end"
              />
            );
          })}
        </Tabs>

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Scrollbar sx={{ maxHeight: 440 }}>
          <Table size="small" stickyHeader>
            {categoryTab === 'noShowUnpaid' ||
            categoryTab === 'sentHomeNoPpe' ||
            categoryTab === 'leftEarlyNoNotice' ||
            categoryTab === 'calledInSick' ||
            categoryTab === 'refusalOfShifts' ||
            categoryTab === 'unapprovedDaysOffShortNotice' ? (
              (() => {
                const isNoShow = categoryTab === 'noShowUnpaid';
                const isRefusal = categoryTab === 'refusalOfShifts';
                const isCalledInSick = categoryTab === 'calledInSick';
                const isUnapprovedDaysOff = categoryTab === 'unapprovedDaysOffShortNotice';
                const isLoadingJobs = isNoShow
                  ? isLoadingNoShow || isLoadingReports
                  : isRefusal
                    ? isLoadingRejected
                    : categoryTab === 'calledInSick'
                      ? isLoadingCalledInSick
                      : false;
                const tableHead = isUnapprovedDaysOff ? UNAPPROVED_DAYS_OFF_TABLE_HEAD : JOB_DETAIL_TABLE_HEAD;
                const hasJob = (j: any) => j.job_id != null && String(j.job_id).trim() !== '';
                return (
                  <>
                    <TableHead>
                      <TableRow>
                        {tableHead.map((head) => (
                          <TableCell
                            key={head.id}
                            align={head.id === 'score_impact' || head.id === 'detail' ? 'center' : undefined}
                            sx={{
                              fontWeight: 600,
                              ...(head.id === 'detail' ? { width: '1%', whiteSpace: 'nowrap' } : {}),
                            }}
                          >
                            {head.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isLoadingJobs ? (
                        <TableRow>
                          <TableCell colSpan={tableHead.length}>Loading…</TableCell>
                        </TableRow>
                      ) : deductCurrentRows.length === 0 ? (
                        <TableNoData
                          notFound
                          colSpan={tableHead.length}
                          sx={{ py: 10 }}
                        />
                      ) : (
                        deductPagedRows.map((job: any, index: number) => {
                          const positionLabel =
                            job.position != null && job.position !== ''
                              ? (JOB_POSITION_OPTIONS.find((opt) => opt.value === job.position)?.label ||
                                  job.position)
                              : 'N/A';
                          const jobLinked = hasJob(job);
                          const validStartTime = job.start_time && dayjs(job.start_time).isValid();
                          return (
                            <TableRow key={job.id ?? job.job_worker_id ?? `${job.job_id}-${index}`} hover>
                              <TableCell>
                                {jobLinked && job.job_number ? (
                                  showAdminActions ? (
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
                                  )
                                ) : !isUnapprovedDaysOff ? (
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    #{job.job_number ?? '—'}
                                  </Typography>
                                ) : null}
                              </TableCell>
                              <TableCell>
                                {(!isUnapprovedDaysOff || (jobLinked && validStartTime)) ? (
                                  <>
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
                                  </>
                                ) : null}
                              </TableCell>
                              <TableCell>
                                {(!isUnapprovedDaysOff || jobLinked) && (job.company_name || job.company?.name || job.company_logo_url || job.logo_url) ? (
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
                                      {(job.company_name || job.company?.name)?.charAt(0)?.toUpperCase() || '—'}
                                    </Avatar>
                                    <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                                      <Typography variant="body2">
                                        {job.company_name || job.company?.name || ''}
                                      </Typography>
                                    </Stack>
                                  </Box>
                                ) : null}
                              </TableCell>
                              <TableCell>
                                {(!isUnapprovedDaysOff || jobLinked) && (job.site_name || getFullAddressFromJob(job)) ? (
                                  <Stack sx={{ typography: 'body2' }}>
                                    {job.site_name ? (
                                      <Typography variant="body2">{job.site_name}</Typography>
                                    ) : null}
                                    {getFullAddressFromJob(job) ? (
                                      <Typography variant="body2" color="text.secondary">
                                        {getFullAddressFromJob(job)}
                                      </Typography>
                                    ) : null}
                                  </Stack>
                                ) : null}
                              </TableCell>
                              <TableCell>
                                {(!isUnapprovedDaysOff || (jobLinked && job.position)) ? (
                                  <Label variant="soft" color={getPositionColor(job.position)}>
                                    {positionLabel}
                                  </Label>
                                ) : null}
                              </TableCell>
                              {isUnapprovedDaysOff && (
                                <TableCell>
                                  {job.notified_at && dayjs(job.notified_at).isValid() ? (
                                    <Typography variant="body2">
                                      {`${fDate(job.notified_at)} at ${fTime(job.notified_at)}`}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      —
                                    </Typography>
                                  )}
                                </TableCell>
                              )}
                              <TableCell align="center">
                                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                                  {(isNoShow || isRefusal || isCalledInSick)
                                    ? formatScoreImpactValue(
                                        getScoreImpactValueForJob(
                                          isNoShow ? 'noShow' : isRefusal ? 'rejection' : 'calledInSick',
                                          job
                                        )
                                      )
                                    : job.score != null && job.score !== 0
                                      ? formatScoreImpactValue(-Math.abs(Number(job.score)))
                                      : getScoreImpactDisplay(
                                          categoryTab,
                                          isRefusal ? job.rejected_at : job.start_time
                                        )}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {isNoShow || isCalledInSick ? (
                                  <ReportedByCell
                                    firstName={job.incident_reporter_first_name}
                                    lastName={job.incident_reporter_last_name}
                                    photoUrl={job.incident_reporter_photo_url}
                                    dateTime={job.incident_reported_at}
                                  />
                                ) : isRefusal ? (
                                  <ReportedByCell
                                    firstName={job.response_by_first_name}
                                    lastName={job.response_by_last_name}
                                    photoUrl={job.response_by_photo_url}
                                    dateTime={job.rejected_at}
                                  />
                                ) : (
                                  <ReportedByCell
                                    firstName={job.created_by_first_name}
                                    lastName={job.created_by_last_name}
                                    photoUrl={job.created_by_photo_url}
                                    dateTime={job.created_at}
                                  />
                                )}
                              </TableCell>
                              <TableCell align="center" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
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
                                ) : isCalledInSick ? (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => setCalledInSickDetailsDialog({ open: true, job })}
                                  >
                                    View
                                  </Button>
                                ) : categoryTab === 'sentHomeNoPpe' ? (
                                  <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => setSentHomeNoPpeDetailsDialog({ open: true, report: job })}
                                    >
                                      View
                                    </Button>
                                    {showAdminActions && (
                                    <IconButton size="small" onClick={(e) => setReportMenu({ el: e.currentTarget, id: String(job.report_id ?? job.id) })}>
                                      <Iconify icon="eva:more-vertical-fill" />
                                    </IconButton>
                                    )}
                                  </Stack>
                                ) : categoryTab === 'leftEarlyNoNotice' ? (
                                  <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => setLeftEarlyNoNoticeDetailsDialog({ open: true, report: job })}
                                    >
                                      View
                                    </Button>
                                    {showAdminActions && (
                                    <IconButton size="small" onClick={(e) => setReportMenu({ el: e.currentTarget, id: String(job.report_id ?? job.id) })}>
                                      <Iconify icon="eva:more-vertical-fill" />
                                    </IconButton>
                                    )}
                                  </Stack>
                                ) : isUnapprovedDaysOff ? (
                                  <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => setUnapprovedDaysOffDetailsDialog({ open: true, report: job })}
                                    >
                                      View
                                    </Button>
                                    {showAdminActions && (
                                    <IconButton size="small" onClick={(e) => setReportMenu({ el: e.currentTarget, id: String(job.report_id ?? job.id) })}>
                                      <Iconify icon="eva:more-vertical-fill" />
                                    </IconButton>
                                    )}
                                  </Stack>
                                ) : (
                                  <Typography variant="body2">
                                    {job.detail ?? job.incident_reason ?? job.memo ?? '—'}
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
                      <TableCell
                        key={head.id}
                        align={head.id === 'score_impact' || head.id === 'detail' ? 'center' : undefined}
                        sx={{
                          fontWeight: 600,
                          ...(head.id === 'detail' ? { width: '1%', whiteSpace: 'nowrap' } : {}),
                        }}
                      >
                        {head.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deductCurrentRows.length === 0 ? (
                    <TableNoData
                      notFound
                      colSpan={LATE_ON_SITE_TABLE_HEAD.length}
                      sx={{ py: 10 }}
                    />
                  ) : (
                    deductPagedRows.map((job: any, index: number) => {
                      const positionLabel =
                        job.position != null && job.position !== ''
                          ? (JOB_POSITION_OPTIONS.find((opt) => opt.value === job.position)?.label ||
                              job.position)
                          : 'N/A';
                      return (
                        <TableRow key={job.id ?? job.job_worker_id ?? `${job.job_id}-${index}`} hover>
                          <TableCell>
                            {job.job_id && showAdminActions ? (
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
                          <TableCell align="center">
                            <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                              {job.score != null && job.score !== ''
                                ? formatScoreImpactValue(-Math.abs(Number(job.score)))
                                : getScoreImpactDisplay('lateOnSite', job.start_time)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <ReportedByCell
                              firstName={job.created_by_first_name}
                              lastName={job.created_by_last_name}
                              photoUrl={job.created_by_photo_url}
                              dateTime={job.created_at}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => setLateOnSiteDetailsDialog({ open: true, report: job })}
                              >
                                View
                              </Button>
                              {showAdminActions && (
                              <IconButton size="small" onClick={(e) => setReportMenu({ el: e.currentTarget, id: String(job.report_id ?? job.id) })}>
                                <Iconify icon="eva:more-vertical-fill" />
                              </IconButton>
                              )}
                            </Stack>
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
              (() => (
                  <>
                    <TableHead>
                      <TableRow>
                        {VACATION_DAY_TABLE_HEAD.map((head) => (
                          <TableCell
                            key={head.id}
                            align={head.id === 'days' || head.id === 'detail' ? 'center' : undefined}
                            sx={{
                              fontWeight: 600,
                              ...(head.id === 'detail' ? { width: '1%', whiteSpace: 'nowrap' } : {}),
                            }}
                          >
                            {head.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deductCurrentRows.length === 0 ? (
                        <TableNoData
                          notFound
                          colSpan={VACATION_DAY_TABLE_HEAD.length}
                          sx={{ py: 10 }}
                        />
                      ) : (
                        deductPagedRows.map((row: any, index: number) => (
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
                        <TableCell align="center">
                          <Typography variant="body2">
                            {row.days != null
                              ? row.days
                              : row.start_date && row.end_date
                                ? dayjs(row.end_date).diff(dayjs(row.start_date), 'day') + 1
                                : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {row.confirmed_by_first_name || row.confirmed_by_last_name || row.confirmed_at ? (
                            <ReportedByCell
                              firstName={row.confirmed_by_first_name}
                              lastName={row.confirmed_by_last_name}
                              photoUrl={row.confirmed_by_photo_url}
                              dateTime={row.confirmed_at}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() =>
                              setTimeOffDetailsDialog({
                                open: true,
                                request: row.timeOffRequest ?? row,
                                tabLabel: CONDUCT_CATEGORIES.find((c) => c.value === categoryTab)?.label ?? 'Time Off',
                              })
                            }
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </>
              ))()
            ) : categoryTab === 'unauthorizedDriving' || categoryTab === 'drivingInfractions' ? (
              (() => (
                  <>
                    <TableHead>
                      <TableRow>
                        {DATE_DETAIL_TABLE_HEAD.map((head) => (
                          <TableCell
                            key={head.id}
                            align={head.id === 'score_impact' || head.id === 'detail' ? 'center' : undefined}
                            sx={{
                              fontWeight: 600,
                              ...(head.id === 'detail' ? { width: '1%', whiteSpace: 'nowrap' } : {}),
                            }}
                          >
                            {head.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deductCurrentRows.length === 0 ? (
                        <TableNoData
                          notFound
                          colSpan={DATE_DETAIL_TABLE_HEAD.length}
                          sx={{ py: 10 }}
                        />
                      ) : (
                        deductPagedRows.map((row: any, index: number) => (
                          <TableRow key={row.id ?? index} hover>
                            <TableCell>
                              <Typography variant="body2">
                                {row.date != null ? fDate(row.date, NO_SHOW_DATE_FORMAT) : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                                {getScoreImpactDisplay(categoryTab, row.date)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <ReportedByCell
                                firstName={row.created_by_first_name}
                                lastName={row.created_by_last_name}
                                photoUrl={row.created_by_photo_url}
                                dateTime={row.created_at}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                              <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() =>
                                    setDateTimeReportDetailsDialog({
                                      open: true,
                                      report: row,
                                      title:
                                        categoryTab === 'unauthorizedDriving'
                                          ? 'Unauthorized Driving Details'
                                          : 'Driving Infractions Details',
                                    })
                                  }
                                >
                                  View
                                </Button>
                                {showAdminActions && (
                                <IconButton size="small" onClick={(e) => setReportMenu({ el: e.currentTarget, id: String(row.report_id ?? row.id) })}>
                                  <Iconify icon="eva:more-vertical-fill" />
                                </IconButton>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </>
              ))()
            ) : categoryTab === 'unapprovePayoutWithoutDayOff' ? (
              <>
                <TableHead>
                  <TableRow>
                    {PAYOUT_WITHOUT_DAY_OFF_TABLE_HEAD.map((head) => (
                      <TableCell
                        key={head.id}
                        align={head.id === 'detail' ? 'center' : undefined}
                        sx={{
                          fontWeight: 600,
                          ...(head.id === 'detail' ? { width: '1%', whiteSpace: 'nowrap' } : {}),
                        }}
                      >
                        {head.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deductCurrentRows.length === 0 ? (
                    <TableNoData
                      notFound
                      colSpan={PAYOUT_WITHOUT_DAY_OFF_TABLE_HEAD.length}
                      sx={{ py: 10 }}
                    />
                  ) : (
                    deductPagedRows.map((row: any, index: number) => (
                      <TableRow key={row.id ?? index} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {row.requested_date != null ? fDate(row.requested_date, NO_SHOW_DATE_FORMAT) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.hours != null && row.hours !== ''
                              ? (Number(row.hours) % 1 === 0 ? String(Math.round(Number(row.hours))) : Number(row.hours))
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <ReportedByCell
                            firstName={row.created_by_first_name}
                            lastName={row.created_by_last_name}
                            photoUrl={row.created_by_photo_url}
                            dateTime={row.created_at}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => setPayoutDetailsDialog({ open: true, report: row.report ?? row })}
                          >
                            View
                          </Button>
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
                      <TableCell
                        key={head.id}
                        align={head.id === 'score_impact' || head.id === 'detail' ? 'center' : undefined}
                        sx={{
                          fontWeight: 600,
                          ...(head.id === 'detail' ? { width: '1%', whiteSpace: 'nowrap' } : {}),
                        }}
                      >
                        {head.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deductCurrentRows.length === 0 ? (
                    <TableNoData
                      notFound
                      colSpan={VERBAL_WARNINGS_TABLE_HEAD.length}
                      sx={{ py: 10 }}
                    />
                  ) : (
                    deductPagedRows.map((row: any, index: number) => (
                      <TableRow key={row.id ?? index} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {row.date != null ? fDate(row.date, NO_SHOW_DATE_FORMAT) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatWriteUpCategoryLabel(row.category)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                            {getScoreImpactDisplay('verbalWarningsWriteUp', row.date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <ReportedByCell
                            firstName={row.created_by_first_name}
                            lastName={row.created_by_last_name}
                            photoUrl={row.created_by_photo_url}
                            dateTime={row.created_at}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => setVerbalWarningsDetailsDialog({ open: true, report: row.report })}
                            >
                              View
                            </Button>
                            {showAdminActions && (
                            <IconButton size="small" onClick={(e) => setReportMenu({ el: e.currentTarget, id: String(row.report_id ?? row.id) })}>
                              <Iconify icon="eva:more-vertical-fill" />
                            </IconButton>
                            )}
                          </Stack>
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
        </Box>

        <Box sx={{ display: { xs: 'block', md: 'none' }, width: '100%', minWidth: 0 }}>
          <DeductHistoryMobileList
            isMdUp={isMdUp}
            categoryTab={categoryTab}
            deductPagedRows={deductPagedRows}
            deductCurrentRows={deductCurrentRows}
            data={data as Record<string, any>}
            categoriesToShow={categoriesToShow}
            isLoadingConduct={isLoading}
            isLoadingNoShow={isLoadingNoShow}
            isLoadingReports={isLoadingReports}
            isLoadingRejected={isLoadingRejected}
            isLoadingCalledInSick={isLoadingCalledInSick}
            onDeductView={openDeductRowDetails}
            onOpenJob={(jobId) => {
              setSelectedJobIdForDetails(jobId);
              setJobDetailsDialogOpen(true);
            }}
            formatWriteUpCategoryLabel={formatWriteUpCategoryLabel}
            formatScoreImpactValue={formatScoreImpactValue}
            getScoreImpactDisplay={getScoreImpactDisplay}
            showAdminActions={showAdminActions}
            onReportMenuOpen={(el, id) => setReportMenu({ el, id })}
          />
        </Box>

        {deductCurrentRows.length > 0 && (
          <TablePagination
            component="div"
            count={deductCurrentRows.length}
            page={deductPage}
            onPageChange={(_, newPage) => setDeductPage(newPage)}
            rowsPerPage={deductRowsPerPage}
            onRowsPerPageChange={(e) => {
              setDeductRowsPerPage(parseInt(e.target.value, 10));
              setDeductPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ px: { xs: 1, md: 0 } }}
          />
        )}
      </Card>

      {/* Deduction record 3-dots action menu */}
      <Menu
        anchorEl={reportMenu.el}
        open={!!reportMenu.el}
        onClose={() => setReportMenu({ el: null, id: null })}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            if (reportMenu.id) setDeleteReportId(reportMenu.id);
            setReportMenu({ el: null, id: null });
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Delete deduction record confirmation dialog */}
      <Dialog
        open={!!deleteReportId}
        onClose={() => setDeleteReportId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Record</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to permanently delete this deduction record? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteReportId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteReportMutation.isPending}
            onClick={() => deleteReportId && deleteReportMutation.mutate(deleteReportId)}
          >
            {deleteReportMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

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
              {noShowDetailsDialog.job.job_id && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Job:
                  </Typography>
                  <Typography variant="body2">
                    {showAdminActions ? (
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => {
                          setSelectedJobIdForDetails(noShowDetailsDialog.job.job_id);
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
                        #{noShowDetailsDialog.job.job_number ?? noShowDetailsDialog.job.job_id}
                      </Link>
                    ) : (
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        #{noShowDetailsDialog.job.job_number ?? noShowDetailsDialog.job.job_id}
                      </Box>
                    )}
                  </Typography>
                </Box>
              )}
              {(noShowDetailsDialog.job.incident_reporter_first_name != null ||
                noShowDetailsDialog.job.incident_reporter_last_name != null ||
                noShowDetailsDialog.job.incident_reported_at) && (
                <Box sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: 'block' }}
                  >
                    Reported By:
                  </Typography>
                  <ReportedByCell
                    firstName={noShowDetailsDialog.job.incident_reporter_first_name}
                    lastName={noShowDetailsDialog.job.incident_reporter_last_name}
                    photoUrl={noShowDetailsDialog.job.incident_reporter_photo_url}
                    dateTime={noShowDetailsDialog.job.incident_reported_at}
                  />
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Score Impact:
                </Typography>
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                  {formatScoreImpactValue(
                    getScoreImpactValueForJob('noShow', noShowDetailsDialog.job)
                  )}
                </Typography>
              </Box>
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
              {rejectionDetailsDialog.job.job_id && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Job:
                  </Typography>
                  <Typography variant="body2">
                    {showAdminActions ? (
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => {
                          setSelectedJobIdForDetails(rejectionDetailsDialog.job.job_id);
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
                        #{rejectionDetailsDialog.job.job_number ?? rejectionDetailsDialog.job.job_id}
                      </Link>
                    ) : (
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        #{rejectionDetailsDialog.job.job_number ?? rejectionDetailsDialog.job.job_id}
                      </Box>
                    )}
                  </Typography>
                </Box>
              )}
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
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Score Impact:
                </Typography>
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                  {formatScoreImpactValue(
                    getScoreImpactValueForJob('rejection', rejectionDetailsDialog.job)
                  )}
                </Typography>
              </Box>
              <Box sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Rejected By:
                </Typography>
                <ReportedByCell
                  firstName={
                    rejectionDetailsDialog.job.response_by_first_name != null ||
                    rejectionDetailsDialog.job.response_by_last_name != null
                      ? rejectionDetailsDialog.job.response_by_first_name
                      : currentUser.first_name
                  }
                  lastName={
                    rejectionDetailsDialog.job.response_by_first_name != null ||
                    rejectionDetailsDialog.job.response_by_last_name != null
                      ? rejectionDetailsDialog.job.response_by_last_name
                      : currentUser.last_name
                  }
                  photoUrl={
                    rejectionDetailsDialog.job.response_by_first_name != null ||
                    rejectionDetailsDialog.job.response_by_last_name != null
                      ? rejectionDetailsDialog.job.response_by_photo_url
                      : currentUser.photo_url
                  }
                  dateTime={rejectionDetailsDialog.job.rejected_at}
                />
                {rejectionDetailsDialog.job.response_by &&
                  rejectionDetailsDialog.job.response_by !== currentUser.id && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      (on behalf of worker)
                    </Typography>
                  )}
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

      {/* Called in Sick Details */}
      <Dialog
        open={calledInSickDetailsDialog.open}
        onClose={() => setCalledInSickDetailsDialog({ open: false, job: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Called in Sick Details</DialogTitle>
        <DialogContent>
          {calledInSickDetailsDialog.job && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {calledInSickDetailsDialog.job.job_id && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Job:
                  </Typography>
                  <Typography variant="body2">
                    {showAdminActions ? (
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => {
                          setSelectedJobIdForDetails(calledInSickDetailsDialog.job.job_id);
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
                        #{calledInSickDetailsDialog.job.job_number ?? calledInSickDetailsDialog.job.job_id}
                      </Link>
                    ) : (
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        #{calledInSickDetailsDialog.job.job_number ?? calledInSickDetailsDialog.job.job_id}
                      </Box>
                    )}
                  </Typography>
                </Box>
              )}
              {(calledInSickDetailsDialog.job.incident_reporter_first_name != null ||
                calledInSickDetailsDialog.job.incident_reporter_last_name != null ||
                calledInSickDetailsDialog.job.incident_reported_at) && (
                <Box sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: 'block' }}
                  >
                    Reported By:
                  </Typography>
                  <ReportedByCell
                    firstName={calledInSickDetailsDialog.job.incident_reporter_first_name}
                    lastName={calledInSickDetailsDialog.job.incident_reporter_last_name}
                    photoUrl={calledInSickDetailsDialog.job.incident_reporter_photo_url}
                    dateTime={calledInSickDetailsDialog.job.incident_reported_at}
                  />
                </Box>
              )}
              {calledInSickDetailsDialog.job.incident_notified_at && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    When they notified:
                  </Typography>
                  <Typography variant="body2">
                    {`${fDate(calledInSickDetailsDialog.job.incident_notified_at)} at ${fTime(calledInSickDetailsDialog.job.incident_notified_at)}`}
                  </Typography>
                </Box>
              )}
              {(calledInSickDetailsDialog.job.incident_reported_at || calledInSickDetailsDialog.job.start_time) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date & Time:
                  </Typography>
                  <Typography variant="body2">
                    {calledInSickDetailsDialog.job.incident_reported_at
                      ? `${fDate(calledInSickDetailsDialog.job.incident_reported_at)} at ${fTime(calledInSickDetailsDialog.job.incident_reported_at)}`
                      : `${fDate(calledInSickDetailsDialog.job.start_time)} at ${fTime(calledInSickDetailsDialog.job.start_time)}`}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Score Impact:
                </Typography>
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                  {formatScoreImpactValue(
                    getScoreImpactValueForJob('calledInSick', calledInSickDetailsDialog.job)
                  )}
                </Typography>
              </Box>
              {(calledInSickDetailsDialog.job.incident_reason || calledInSickDetailsDialog.job.detail) ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Memo / Reason:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {calledInSickDetailsDialog.job.incident_reason ?? calledInSickDetailsDialog.job.detail ?? '—'}
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
          <Button onClick={() => setCalledInSickDetailsDialog({ open: false, job: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sent home from site (No PPE) Details */}
      <Dialog
        open={sentHomeNoPpeDetailsDialog.open}
        onClose={() => setSentHomeNoPpeDetailsDialog({ open: false, report: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sent home from site (No PPE) Details</DialogTitle>
        <DialogContent>
          {sentHomeNoPpeDetailsDialog.report && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {sentHomeNoPpeDetailsDialog.report.job_id && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Job:
                  </Typography>
                  <Typography variant="body2">
                    {showAdminActions ? (
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => {
                          setSelectedJobIdForDetails(sentHomeNoPpeDetailsDialog.report.job_id);
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
                        #{sentHomeNoPpeDetailsDialog.report.job_number ?? sentHomeNoPpeDetailsDialog.report.job_id}
                      </Link>
                    ) : (
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        #{sentHomeNoPpeDetailsDialog.report.job_number ?? sentHomeNoPpeDetailsDialog.report.job_id}
                      </Box>
                    )}
                  </Typography>
                </Box>
              )}
              {(sentHomeNoPpeDetailsDialog.report.report_date_time || sentHomeNoPpeDetailsDialog.report.created_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date & Time:
                  </Typography>
                  <Typography variant="body2">
                    {sentHomeNoPpeDetailsDialog.report.report_date_time
                      ? `${fDate(sentHomeNoPpeDetailsDialog.report.report_date_time)} at ${fTime(sentHomeNoPpeDetailsDialog.report.report_date_time)}`
                      : `${fDate(sentHomeNoPpeDetailsDialog.report.created_at)} at ${fTime(sentHomeNoPpeDetailsDialog.report.created_at)}`}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Score Impact:
                </Typography>
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                  {formatScoreImpactValue(
                    sentHomeNoPpeDetailsDialog.report.score != null && sentHomeNoPpeDetailsDialog.report.score !== ''
                      ? -Math.abs(Number(sentHomeNoPpeDetailsDialog.report.score))
                      : -Math.abs(SCORE_DEDUCT_PER_OCCURRENCE.sentHomeNoPpe ?? 0)
                  )}
                </Typography>
              </Box>
              {(sentHomeNoPpeDetailsDialog.report.created_by_first_name || sentHomeNoPpeDetailsDialog.report.created_by_last_name || sentHomeNoPpeDetailsDialog.report.created_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                    Reported by:
                  </Typography>
                  <ReportedByCell
                    firstName={sentHomeNoPpeDetailsDialog.report.created_by_first_name}
                    lastName={sentHomeNoPpeDetailsDialog.report.created_by_last_name}
                    photoUrl={sentHomeNoPpeDetailsDialog.report.created_by_photo_url}
                    dateTime={sentHomeNoPpeDetailsDialog.report.created_at}
                  />
                </Box>
              )}
              {(sentHomeNoPpeDetailsDialog.report.memo || sentHomeNoPpeDetailsDialog.report.detail) ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Memo / Reason:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {sentHomeNoPpeDetailsDialog.report.memo ?? sentHomeNoPpeDetailsDialog.report.detail ?? '—'}
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
          <Button onClick={() => setSentHomeNoPpeDetailsDialog({ open: false, report: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Left Early No Notice Details */}
      <Dialog
        open={leftEarlyNoNoticeDetailsDialog.open}
        onClose={() => setLeftEarlyNoNoticeDetailsDialog({ open: false, report: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Left Early No Notice Details</DialogTitle>
        <DialogContent>
          {leftEarlyNoNoticeDetailsDialog.report && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {leftEarlyNoNoticeDetailsDialog.report.job_id && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Job:
                  </Typography>
                  <Typography variant="body2">
                    {showAdminActions ? (
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => {
                          setSelectedJobIdForDetails(leftEarlyNoNoticeDetailsDialog.report.job_id);
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
                        #{leftEarlyNoNoticeDetailsDialog.report.job_number ?? leftEarlyNoNoticeDetailsDialog.report.job_id}
                      </Link>
                    ) : (
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        #{leftEarlyNoNoticeDetailsDialog.report.job_number ?? leftEarlyNoNoticeDetailsDialog.report.job_id}
                      </Box>
                    )}
                  </Typography>
                </Box>
              )}
              {(leftEarlyNoNoticeDetailsDialog.report.report_date_time || leftEarlyNoNoticeDetailsDialog.report.created_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date & Time:
                  </Typography>
                  <Typography variant="body2">
                    {leftEarlyNoNoticeDetailsDialog.report.report_date_time
                      ? `${fDate(leftEarlyNoNoticeDetailsDialog.report.report_date_time)} at ${fTime(leftEarlyNoNoticeDetailsDialog.report.report_date_time)}`
                      : `${fDate(leftEarlyNoNoticeDetailsDialog.report.created_at)} at ${fTime(leftEarlyNoNoticeDetailsDialog.report.created_at)}`}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Score Impact:
                </Typography>
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                  {formatScoreImpactValue(
                    leftEarlyNoNoticeDetailsDialog.report.score != null && leftEarlyNoNoticeDetailsDialog.report.score !== ''
                      ? -Math.abs(Number(leftEarlyNoNoticeDetailsDialog.report.score))
                      : -Math.abs(SCORE_DEDUCT_PER_OCCURRENCE.leftEarlyNoNotice ?? 0)
                  )}
                </Typography>
              </Box>
              {(leftEarlyNoNoticeDetailsDialog.report.created_by_first_name || leftEarlyNoNoticeDetailsDialog.report.created_by_last_name || leftEarlyNoNoticeDetailsDialog.report.created_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                    Reported by:
                  </Typography>
                  <ReportedByCell
                    firstName={leftEarlyNoNoticeDetailsDialog.report.created_by_first_name}
                    lastName={leftEarlyNoNoticeDetailsDialog.report.created_by_last_name}
                    photoUrl={leftEarlyNoNoticeDetailsDialog.report.created_by_photo_url}
                    dateTime={leftEarlyNoNoticeDetailsDialog.report.created_at}
                  />
                </Box>
              )}
              {(leftEarlyNoNoticeDetailsDialog.report.memo || leftEarlyNoNoticeDetailsDialog.report.detail) ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Memo / Reason:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {leftEarlyNoNoticeDetailsDialog.report.memo ?? leftEarlyNoNoticeDetailsDialog.report.detail ?? '—'}
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
          <Button onClick={() => setLeftEarlyNoNoticeDetailsDialog({ open: false, report: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Late on Site Details */}
      <Dialog
        open={lateOnSiteDetailsDialog.open}
        onClose={() => setLateOnSiteDetailsDialog({ open: false, report: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Late on Site Details</DialogTitle>
        <DialogContent>
          {lateOnSiteDetailsDialog.report && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {lateOnSiteDetailsDialog.report.job_id && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Job:
                  </Typography>
                  <Typography variant="body2">
                    {showAdminActions ? (
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => {
                          setSelectedJobIdForDetails(lateOnSiteDetailsDialog.report.job_id);
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
                        #{lateOnSiteDetailsDialog.report.job_number ?? lateOnSiteDetailsDialog.report.job_id}
                      </Link>
                    ) : (
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        #{lateOnSiteDetailsDialog.report.job_number ?? lateOnSiteDetailsDialog.report.job_id}
                      </Box>
                    )}
                  </Typography>
                </Box>
              )}
              {(lateOnSiteDetailsDialog.report.report_date_time || lateOnSiteDetailsDialog.report.start_time || lateOnSiteDetailsDialog.report.created_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date & Time:
                  </Typography>
                  <Typography variant="body2">
                    {lateOnSiteDetailsDialog.report.report_date_time
                      ? `${fDate(lateOnSiteDetailsDialog.report.report_date_time)} at ${fTime(lateOnSiteDetailsDialog.report.report_date_time)}`
                      : lateOnSiteDetailsDialog.report.start_time
                        ? `${fDate(lateOnSiteDetailsDialog.report.start_time)} at ${fTime(lateOnSiteDetailsDialog.report.start_time)}`
                        : `${fDate(lateOnSiteDetailsDialog.report.created_at)} at ${fTime(lateOnSiteDetailsDialog.report.created_at)}`}
                  </Typography>
                </Box>
              )}
              {(lateOnSiteDetailsDialog.report.arrived_at_site_time || lateOnSiteDetailsDialog.report.arrived_time) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Arrived Time:
                  </Typography>
                  <Typography variant="body2">
                    {fTime(lateOnSiteDetailsDialog.report.arrived_at_site_time ?? lateOnSiteDetailsDialog.report.arrived_time)}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Score Impact:
                </Typography>
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                  {formatScoreImpactValue(
                    lateOnSiteDetailsDialog.report.score != null && lateOnSiteDetailsDialog.report.score !== ''
                      ? -Math.abs(Number(lateOnSiteDetailsDialog.report.score))
                      : -Math.abs(SCORE_DEDUCT_PER_OCCURRENCE.lateOnSite ?? 0)
                  )}
                </Typography>
              </Box>
              {(lateOnSiteDetailsDialog.report.created_by_first_name || lateOnSiteDetailsDialog.report.created_by_last_name || lateOnSiteDetailsDialog.report.created_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                    Reported by:
                  </Typography>
                  <ReportedByCell
                    firstName={lateOnSiteDetailsDialog.report.created_by_first_name}
                    lastName={lateOnSiteDetailsDialog.report.created_by_last_name}
                    photoUrl={lateOnSiteDetailsDialog.report.created_by_photo_url}
                    dateTime={lateOnSiteDetailsDialog.report.created_at}
                  />
                </Box>
              )}
              {(lateOnSiteDetailsDialog.report.memo || lateOnSiteDetailsDialog.report.detail) ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Memo / Reason:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {lateOnSiteDetailsDialog.report.memo ?? lateOnSiteDetailsDialog.report.detail ?? '—'}
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
          <Button onClick={() => setLateOnSiteDetailsDialog({ open: false, report: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unapproved Days Off / Short Notice Details */}
      <Dialog
        open={unapprovedDaysOffDetailsDialog.open}
        onClose={() => setUnapprovedDaysOffDetailsDialog({ open: false, report: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Unapproved Days Off / Short Notice Details</DialogTitle>
        <DialogContent>
          {unapprovedDaysOffDetailsDialog.report && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {unapprovedDaysOffDetailsDialog.report.notified_at && dayjs(unapprovedDaysOffDetailsDialog.report.notified_at).isValid() && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    When they notified:
                  </Typography>
                  <Typography variant="body2">
                    {`${fDate(unapprovedDaysOffDetailsDialog.report.notified_at)} at ${fTime(unapprovedDaysOffDetailsDialog.report.notified_at)}`}
                  </Typography>
                </Box>
              )}
              {unapprovedDaysOffDetailsDialog.report.job_id && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Job:
                  </Typography>
                  <Typography variant="body2">
                    {showAdminActions ? (
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => {
                          setSelectedJobIdForDetails(unapprovedDaysOffDetailsDialog.report.job_id);
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
                        #{unapprovedDaysOffDetailsDialog.report.job_number ?? unapprovedDaysOffDetailsDialog.report.job_id}
                      </Link>
                    ) : (
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        #{unapprovedDaysOffDetailsDialog.report.job_number ?? unapprovedDaysOffDetailsDialog.report.job_id}
                      </Box>
                    )}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Score Impact:
                </Typography>
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                  {formatScoreImpactValue(
                    unapprovedDaysOffDetailsDialog.report.score != null && unapprovedDaysOffDetailsDialog.report.score !== ''
                      ? -Math.abs(Number(unapprovedDaysOffDetailsDialog.report.score))
                      : -Math.abs(SCORE_DEDUCT_PER_OCCURRENCE.unapprovedDaysOffShortNotice ?? 0)
                  )}
                </Typography>
              </Box>
              {(unapprovedDaysOffDetailsDialog.report.created_by_first_name || unapprovedDaysOffDetailsDialog.report.created_by_last_name || unapprovedDaysOffDetailsDialog.report.created_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                    Reported by:
                  </Typography>
                  <ReportedByCell
                    firstName={unapprovedDaysOffDetailsDialog.report.created_by_first_name}
                    lastName={unapprovedDaysOffDetailsDialog.report.created_by_last_name}
                    photoUrl={unapprovedDaysOffDetailsDialog.report.created_by_photo_url}
                    dateTime={unapprovedDaysOffDetailsDialog.report.created_at}
                  />
                </Box>
              )}
              {(unapprovedDaysOffDetailsDialog.report.memo || unapprovedDaysOffDetailsDialog.report.detail) ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Memo / Reason:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {unapprovedDaysOffDetailsDialog.report.memo ?? unapprovedDaysOffDetailsDialog.report.detail ?? '—'}
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
          <Button onClick={() => setUnapprovedDaysOffDetailsDialog({ open: false, report: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unauthorized Driving / Driving Infractions Details */}
      <Dialog
        open={dateTimeReportDetailsDialog.open}
        onClose={() => setDateTimeReportDetailsDialog({ open: false, report: null, title: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{dateTimeReportDetailsDialog.title}</DialogTitle>
        <DialogContent>
          {dateTimeReportDetailsDialog.report && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {(dateTimeReportDetailsDialog.report.report_date_time || dateTimeReportDetailsDialog.report.date || dateTimeReportDetailsDialog.report.created_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date & Time:
                  </Typography>
                  <Typography variant="body2">
                    {dateTimeReportDetailsDialog.report.report_date_time
                      ? `${fDate(dateTimeReportDetailsDialog.report.report_date_time)} at ${fTime(dateTimeReportDetailsDialog.report.report_date_time)}`
                      : dateTimeReportDetailsDialog.report.date
                        ? `${fDate(dateTimeReportDetailsDialog.report.date)} at ${fTime(dateTimeReportDetailsDialog.report.date)}`
                        : `${fDate(dateTimeReportDetailsDialog.report.created_at)} at ${fTime(dateTimeReportDetailsDialog.report.created_at)}`}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Score Impact:
                </Typography>
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                  {formatScoreImpactValue(
                    dateTimeReportDetailsDialog.report.score != null && dateTimeReportDetailsDialog.report.score !== ''
                      ? -Math.abs(Number(dateTimeReportDetailsDialog.report.score))
                      : -Math.abs(SCORE_DEDUCT_PER_OCCURRENCE[dateTimeReportDetailsDialog.report.category] ?? 0)
                  )}
                </Typography>
              </Box>
              {(dateTimeReportDetailsDialog.report.created_by_first_name || dateTimeReportDetailsDialog.report.created_by_last_name || dateTimeReportDetailsDialog.report.created_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                    Reported by:
                  </Typography>
                  <ReportedByCell
                    firstName={dateTimeReportDetailsDialog.report.created_by_first_name}
                    lastName={dateTimeReportDetailsDialog.report.created_by_last_name}
                    photoUrl={dateTimeReportDetailsDialog.report.created_by_photo_url}
                    dateTime={dateTimeReportDetailsDialog.report.created_at}
                  />
                </Box>
              )}
              {(dateTimeReportDetailsDialog.report.memo || dateTimeReportDetailsDialog.report.detail) ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Memo / Reason:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {dateTimeReportDetailsDialog.report.memo ?? dateTimeReportDetailsDialog.report.detail ?? '—'}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No memo or reason provided
                </Typography>
              )}
              {Array.isArray(dateTimeReportDetailsDialog.report.attachment_urls) && dateTimeReportDetailsDialog.report.attachment_urls.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Attachments:
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 0.5 }}>
                    {dateTimeReportDetailsDialog.report.attachment_urls.map((url: string, i: number) => {
                      const displayUrl = getDocumentDisplayUrl(url);
                      if (isAttachmentPdf(url)) {
                        return (
                          <Box key={i}>
                            <AttachmentPdfPreview url={displayUrl} index={i} />
                          </Box>
                        );
                      }
                      if (isAttachmentImage(url)) {
                        return (
                          <Box key={i}>
                            <AttachmentImagePreview url={displayUrl} index={i} />
                          </Box>
                        );
                      }
                      return (
                        <Box key={i}>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => openDocumentUrl(displayUrl)}
                            sx={{ textTransform: 'none', p: 0, minHeight: 0 }}
                          >
                            Attachment {i + 1} — Open in new tab
                          </Button>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDateTimeReportDetailsDialog({ open: false, report: null, title: '' })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verbal Warnings / Write Up Details */}
      <Dialog
        open={verbalWarningsDetailsDialog.open}
        onClose={() => setVerbalWarningsDetailsDialog({ open: false, report: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Verbal Warnings / Write Up Details</DialogTitle>
        <DialogContent>
          {verbalWarningsDetailsDialog.report && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {(verbalWarningsDetailsDialog.report.report_date_time || verbalWarningsDetailsDialog.report.created_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date & Time:
                  </Typography>
                  <Typography variant="body2">
                    {verbalWarningsDetailsDialog.report.report_date_time
                      ? `${fDate(verbalWarningsDetailsDialog.report.report_date_time)} at ${fTime(verbalWarningsDetailsDialog.report.report_date_time)}`
                      : `${fDate(verbalWarningsDetailsDialog.report.created_at)} at ${fTime(verbalWarningsDetailsDialog.report.created_at)}`}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Category:
                </Typography>
                <Typography variant="body2">
                  {formatWriteUpCategoryLabel(verbalWarningsDetailsDialog.report.write_up_category)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Score Impact:
                </Typography>
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                  {formatScoreImpactValue(
                    verbalWarningsDetailsDialog.report.score != null && verbalWarningsDetailsDialog.report.score !== ''
                      ? -Math.abs(Number(verbalWarningsDetailsDialog.report.score))
                      : -Math.abs(SCORE_DEDUCT_PER_OCCURRENCE.verbalWarningsWriteUp ?? 0)
                  )}
                </Typography>
              </Box>
              {(verbalWarningsDetailsDialog.report.created_by_first_name || verbalWarningsDetailsDialog.report.created_by_last_name || verbalWarningsDetailsDialog.report.created_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                    Reported by:
                  </Typography>
                  <ReportedByCell
                    firstName={verbalWarningsDetailsDialog.report.created_by_first_name}
                    lastName={verbalWarningsDetailsDialog.report.created_by_last_name}
                    photoUrl={verbalWarningsDetailsDialog.report.created_by_photo_url}
                    dateTime={verbalWarningsDetailsDialog.report.created_at}
                  />
                </Box>
              )}
              {(verbalWarningsDetailsDialog.report.detail) ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Detail:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {verbalWarningsDetailsDialog.report.detail}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No detail provided
                </Typography>
              )}
              {Array.isArray(verbalWarningsDetailsDialog.report.attachment_urls) && verbalWarningsDetailsDialog.report.attachment_urls.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Attachments:
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 0.5 }}>
                    {verbalWarningsDetailsDialog.report.attachment_urls.map((url: string, i: number) => {
                      const displayUrl = getDocumentDisplayUrl(url);
                      if (isAttachmentPdf(url)) {
                        return (
                          <Box key={i}>
                            <AttachmentPdfPreview url={displayUrl} index={i} />
                          </Box>
                        );
                      }
                      if (isAttachmentImage(url)) {
                        return (
                          <Box key={i}>
                            <AttachmentImagePreview url={displayUrl} index={i} />
                          </Box>
                        );
                      }
                      return (
                        <Box key={i}>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => openDocumentUrl(displayUrl)}
                            sx={{ textTransform: 'none', p: 0, minHeight: 0 }}
                          >
                            Attachment {i + 1} — Open in new tab
                          </Button>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerbalWarningsDetailsDialog({ open: false, report: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Time Off Request Details (Sick Leave, Vacation Day, Personal Day Off tabs) */}
      <Dialog
        open={timeOffDetailsDialog.open}
        onClose={() => setTimeOffDetailsDialog({ open: false, request: null, tabLabel: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{timeOffDetailsDialog.tabLabel ? `${timeOffDetailsDialog.tabLabel} Details` : 'Time Off Details'}</DialogTitle>
        <DialogContent>
          {timeOffDetailsDialog.request && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {(timeOffDetailsDialog.request.created_at || timeOffDetailsDialog.request.start_date) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Requested time:
                  </Typography>
                  <Typography variant="body2">
                    {timeOffDetailsDialog.request.created_at
                      ? `${fDate(timeOffDetailsDialog.request.created_at, NO_SHOW_DATE_FORMAT)} at ${fTime(timeOffDetailsDialog.request.created_at)}`
                      : fDate(timeOffDetailsDialog.request.start_date, NO_SHOW_DATE_FORMAT)}
                  </Typography>
                </Box>
              )}
              {timeOffDetailsDialog.request.start_date && timeOffDetailsDialog.request.end_date && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date range:
                  </Typography>
                  <Typography variant="body2">
                    {`${fDate(timeOffDetailsDialog.request.start_date, NO_SHOW_DATE_FORMAT)} - ${fDate(timeOffDetailsDialog.request.end_date, NO_SHOW_DATE_FORMAT)}`}
                  </Typography>
                </Box>
              )}
              {timeOffDetailsDialog.request.start_date && timeOffDetailsDialog.request.end_date && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Days:
                  </Typography>
                  <Typography variant="body2">
                    {dayjs(timeOffDetailsDialog.request.end_date).diff(dayjs(timeOffDetailsDialog.request.start_date), 'day') + 1}
                  </Typography>
                </Box>
              )}
              {(timeOffDetailsDialog.request.confirmed_by_first_name ||
                timeOffDetailsDialog.request.confirmed_by_last_name ||
                timeOffDetailsDialog.request.confirmed_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                    Confirmed by:
                  </Typography>
                  <ReportedByCell
                    firstName={timeOffDetailsDialog.request.confirmed_by_first_name}
                    lastName={timeOffDetailsDialog.request.confirmed_by_last_name}
                    photoUrl={timeOffDetailsDialog.request.confirmed_by_photo_url}
                    dateTime={timeOffDetailsDialog.request.confirmed_at}
                  />
                </Box>
              )}
              {(timeOffDetailsDialog.request.reason) ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Detail:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {timeOffDetailsDialog.request.reason}
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
          <Button onClick={() => setTimeOffDetailsDialog({ open: false, request: null, tabLabel: '' })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unapprove Payout without Day Off Details */}
      <Dialog
        open={payoutDetailsDialog.open}
        onClose={() => setPayoutDetailsDialog({ open: false, report: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Unapprove Payout without Day Off Details</DialogTitle>
        <DialogContent>
          {payoutDetailsDialog.report && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {payoutDetailsDialog.report.report_date_time && dayjs(payoutDetailsDialog.report.report_date_time).isValid() && (
                <Stack>
                  <Typography variant="caption" color="text.secondary">Request date</Typography>
                  <Typography variant="body2">
                    {fDate(payoutDetailsDialog.report.report_date_time)} {fTime(payoutDetailsDialog.report.report_date_time) ? `at ${fTime(payoutDetailsDialog.report.report_date_time)}` : ''}
                  </Typography>
                </Stack>
              )}
              {payoutDetailsDialog.report.hours != null && payoutDetailsDialog.report.hours !== '' && (
                <Stack>
                  <Typography variant="caption" color="text.secondary">Hours</Typography>
                  <Typography variant="body2">
                    {Number(payoutDetailsDialog.report.hours) % 1 === 0
                      ? String(Math.round(Number(payoutDetailsDialog.report.hours)))
                      : payoutDetailsDialog.report.hours}
                  </Typography>
                </Stack>
              )}
              {(payoutDetailsDialog.report.created_by_first_name || payoutDetailsDialog.report.created_by_last_name || payoutDetailsDialog.report.created_at) && (
                <Stack>
                  <Typography variant="caption" color="text.secondary">Reported by</Typography>
                  <ReportedByCell
                    firstName={payoutDetailsDialog.report.created_by_first_name}
                    lastName={payoutDetailsDialog.report.created_by_last_name}
                    photoUrl={payoutDetailsDialog.report.created_by_photo_url}
                    dateTime={payoutDetailsDialog.report.created_at}
                  />
                </Stack>
              )}
              {(payoutDetailsDialog.report.memo || payoutDetailsDialog.report.detail) ? (
                <Stack>
                  <Typography variant="caption" color="text.secondary">Memo / Notes</Typography>
                  <Typography variant="body2">{payoutDetailsDialog.report.memo ?? payoutDetailsDialog.report.detail ?? '—'}</Typography>
                </Stack>
              ) : null}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayoutDetailsDialog({ open: false, report: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Automated Bonuses (computed live - no admin action needed)         */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader
          title="Active Bonuses"
          subheader={
            isLoadingComputed
              ? 'Computing...'
              : totalComputedEarnBack > 0
                ? `+${totalComputedEarnBack} pts from ${(computedBonuses?.bonuses ?? []).filter((b) => b.active).length} active bonus${(computedBonuses?.bonuses ?? []).filter((b) => b.active).length !== 1 ? 'es' : ''}`
                : 'No automated bonuses active - keep working toward them!'
          }
        />
        <CardContent sx={{ pt: 2 }}>
          <Stack spacing={1}>
            {isLoadingComputed ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                Loading…
              </Typography>
            ) : (
              (computedBonuses?.bonuses ?? AUTO_BONUS_DISPLAY.map((b) => ({
                key: b.key,
                label: b.label,
                points: 0,
                active: false,
                detail: '—',
              }))).map((bonus) => (
                <Box
                  key={bonus.key}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    py: 1,
                    px: 1.5,
                    borderRadius: 1,
                    bgcolor: bonus.active ? 'success.lighter' : 'action.hover',
                    border: '1px solid',
                    borderColor: bonus.active ? 'success.light' : 'divider',
                  }}
                >
                  {/* Status indicator */}
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 18,
                      lineHeight: 1.4,
                      flexShrink: 0,
                      color: bonus.active ? 'success.main' : 'text.disabled',
                    }}
                  >
                    {bonus.active ? '✓' : '○'}
                  </Typography>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={bonus.active ? 600 : 400}
                      color={bonus.active ? 'success.darker' : 'text.primary'}
                    >
                      {bonus.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {bonus.detail}
                    </Typography>
                  </Box>

                  <Chip
                    label={bonus.active ? `+${bonus.points}` : '+0'}
                    size="small"
                    color={bonus.active ? 'success' : 'default'}
                    variant={bonus.active ? 'filled' : 'soft'}
                    sx={{ flexShrink: 0, fontWeight: bonus.active ? 700 : 400 }}
                  />
                </Box>
              ))
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Manual Awards (admin-granted recognition) — layout mirrors Deduction History (tabs + list)   */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader
          title="Recognition Awards"
          subheader={
            totalManualEarnBack > 0
              ? `+${totalManualEarnBack} pts from ${(earnBackAwards ?? []).length} award${(earnBackAwards ?? []).length !== 1 ? 's' : ''}`
              : 'No awards yet'
          }
          action={
            showAdminActions ? (
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={() => setEarnBackDialogOpen(true)}
              sx={{ mt: 0.5 }}
            >
              + Add Award
            </Button>
            ) : null
          }
        />
        {!isLoadingEarnBack && (earnBackAwards?.length ?? 0) > 0 && (
          <Tabs
            value={awardsFilterTab}
            onChange={handleAwardsFilterChange}
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
            <Tab
              value="all"
              label="All"
              icon={
                <Label
                  variant={awardsFilterTab === 'all' ? 'filled' : 'soft'}
                  color="success"
                >
                  {(earnBackAwards ?? []).length}
                </Label>
              }
              iconPosition="end"
            />
            {EARN_BACK_CATEGORIES.map((c) => (
              <Tab
                key={c.value}
                value={c.value}
                label={c.label}
                icon={
                  <Label
                    variant={awardsFilterTab === c.value ? 'filled' : 'soft'}
                    color="success"
                  >
                    {earnBackAwardsByCategory[c.value] ?? 0}
                  </Label>
                }
                iconPosition="end"
              />
            ))}
          </Tabs>
        )}

        <CardContent
          sx={{
            pt: !isLoadingEarnBack && (earnBackAwards?.length ?? 0) > 0 ? 0 : 2,
            px: 0,
            pb: 2,
          }}
        >
          {isLoadingEarnBack ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center', px: 2.5 }}>
              Loading...
            </Typography>
          ) : !earnBackAwards || earnBackAwards.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center', fontStyle: 'italic', px: 2.5 }}>
              {showAdminActions
                ? 'No recognition awards yet. Use "+ Add Award" to recognise client callbacks, feedback, Worker of the Month, etc.'
                : 'No recognition awards yet. Awards may be added by management (e.g. client callbacks, Worker of the Month).'}
            </Typography>
          ) : earnBackAwardsFiltered.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center', px: 2.5 }}>
              No awards in this category.
            </Typography>
          ) : (
            <>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Scrollbar>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Award</TableCell>
                        <TableCell align="center">Points</TableCell>
                        <TableCell>Award Date</TableCell>
                        <TableCell>Recorded by</TableCell>
                        <TableCell align="center" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                          Detail
                        </TableCell>
                        {showAdminActions && (
                          <TableCell align="right" sx={{ width: '1%', whiteSpace: 'nowrap' }} />
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedAwards.map((award: any) => {
                        const cat = getEarnBackCategory(award.category);
                        return (
                          <TableRow key={award.id} hover>
                            <TableCell>
                              <Typography variant="body2">
                                {cat?.label ?? award.category}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`+${award.points}`}
                                size="small"
                                color="success"
                                variant="soft"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {award.awarded_date
                                  ? fDate(award.awarded_date, 'MMM DD YYYY')
                                  : award.created_at
                                  ? fDate(award.created_at, 'MMM DD YYYY')
                                  : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <ReportedByCell
                                firstName={award.created_by_first_name}
                                lastName={award.created_by_last_name}
                                photoUrl={award.created_by_photo_url}
                                dateTime={award.created_at}
                              />
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ width: '1%', whiteSpace: 'nowrap', verticalAlign: 'middle' }}
                            >
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => setViewAwardDialog({ open: true, award })}
                              >
                                View
                              </Button>
                            </TableCell>
                            {showAdminActions && (
                              <TableCell
                                align="right"
                                sx={{ width: '1%', whiteSpace: 'nowrap', verticalAlign: 'middle' }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={(e) => setAwardMenu({ el: e.currentTarget, id: String(award.id) })}
                                  aria-label="More actions"
                                >
                                  <Iconify icon="eva:more-vertical-fill" />
                                </IconButton>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </Box>
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Stack spacing={2} sx={{ p: 2, pt: 0 }}>
                  {paginatedAwards.map((award: any) => {
                    const cat = getEarnBackCategory(award.category);
                    const awDate = award.awarded_date
                      ? fDate(award.awarded_date, 'MMM DD YYYY')
                      : award.created_at
                        ? fDate(award.created_at, 'MMM DD YYYY')
                        : '-';
                    return (
                      <Card key={String(award.id)} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack spacing={1.5}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="subtitle2" sx={{ wordBreak: 'break-word' }}>
                                {cat?.label ?? award.category}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" mt={0.5}>
                                {awDate}
                              </Typography>
                            </Box>
                            <Chip
                              label={`+${award.points}`}
                              size="small"
                              color="success"
                              variant="soft"
                              sx={{ flexShrink: 0 }}
                            />
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                              Recorded by
                            </Typography>
                            <ReportedByCell
                              firstName={award.created_by_first_name}
                              lastName={award.created_by_last_name}
                              photoUrl={award.created_by_photo_url}
                              dateTime={award.created_at}
                            />
                          </Box>
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              mb={0.5}
                              textAlign="center"
                            >
                              Detail
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Button
                                size="large"
                                fullWidth
                                variant="contained"
                                onClick={() => setViewAwardDialog({ open: true, award })}
                                sx={{ minHeight: 48, py: 1.25, fontSize: '0.95rem', fontWeight: 600 }}
                              >
                                View
                              </Button>
                              {showAdminActions && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => setAwardMenu({ el: e.currentTarget, id: String(award.id) })}
                                  aria-label="Award actions"
                                  sx={{ flexShrink: 0 }}
                                >
                                  <Iconify icon="eva:more-vertical-fill" />
                                </IconButton>
                              )}
                            </Stack>
                          </Box>
                        </Stack>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            </>
          )}

          {showAdminActions && (
            <Menu
            anchorEl={awardMenu.el}
            open={!!awardMenu.el}
            onClose={() => setAwardMenu({ el: null, id: null })}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem
              onClick={() => {
                if (awardMenu.id) setDeleteEarnBackId(awardMenu.id);
                setAwardMenu({ el: null, id: null });
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon sx={{ color: 'error.main' }}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </ListItemIcon>
              Delete
            </MenuItem>
          </Menu>
          )}

          {earnBackAwardsFiltered.length > 0 && (
            <TablePagination
              component="div"
              count={earnBackAwardsFiltered.length}
              page={awardsPage}
              onPageChange={(_, newPage) => setAwardsPage(newPage)}
              rowsPerPage={awardsRowsPerPage}
              onRowsPerPageChange={(e) => {
                setAwardsRowsPerPage(parseInt(e.target.value, 10));
                setAwardsPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{ px: { xs: 1, md: 0 } }}
            />
          )}
        </CardContent>
      </Card>

      {/* View Recognition Award detail dialog */}
      <Dialog
        open={viewAwardDialog.open}
        onClose={() => setViewAwardDialog({ open: false, award: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          Award Detail
          <IconButton
            onClick={() => setViewAwardDialog({ open: false, award: null })}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
          {viewAwardDialog.award && (() => {
            const a = viewAwardDialog.award;
            const cat = getEarnBackCategory(a.category);
            const awardedByName = [a.created_by_first_name, a.created_by_last_name].filter(Boolean).join(' ').trim();
            return (
              <Stack spacing={2} sx={{ pt: 1 }}>
                <Stack>
                  <Typography variant="caption" color="text.secondary">Award Type</Typography>
                  <Typography variant="body2">{cat?.label ?? a.category}</Typography>
                </Stack>
                <Stack>
                  <Typography variant="caption" color="text.secondary">Points</Typography>
                  <Typography variant="body2" color="success.main" fontWeight={700}>+{a.points}</Typography>
                </Stack>
                {(a.awarded_date || a.created_at) && (
                  <Stack>
                    <Typography variant="caption" color="text.secondary">Award Date</Typography>
                    <Typography variant="body2">
                      {a.awarded_date
                        ? fDate(a.awarded_date, 'MMM DD YYYY')
                        : fDate(a.created_at, 'MMM DD YYYY')}
                    </Typography>
                  </Stack>
                )}
                {(awardedByName || a.created_at) && (
                  <Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>Recorded by</Typography>
                    <ReportedByCell
                      firstName={a.created_by_first_name}
                      lastName={a.created_by_last_name}
                      photoUrl={a.created_by_photo_url}
                      dateTime={a.created_at}
                    />
                  </Stack>
                )}
                <Stack>
                  <Typography variant="caption" color="text.secondary">Memo / Notes</Typography>
                  {a.memo ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{a.memo}</Typography>
                  ) : (
                    <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>No memo</Typography>
                  )}
                </Stack>
              </Stack>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Add Recognition Award dialog */}
      <Dialog
        open={earnBackDialogOpen}
        onClose={() => {
          setEarnBackDialogOpen(false);
          setEarnBackCategory('');
          setEarnBackMemo('');
          setEarnBackDate(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Recognition Award</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="earn-back-category-label">Award Type</InputLabel>
              <Select
                labelId="earn-back-category-label"
                label="Award Type"
                value={earnBackCategory}
                onChange={(e) => setEarnBackCategory(e.target.value)}
              >
                {EARN_BACK_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    <Stack>
                      <Typography variant="body2">{cat.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        +{cat.points} pts - {cat.description}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {earnBackCategory && (
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: 'success.lighter',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="success.darker" fontWeight={600}>
                  +{EARN_BACK_CATEGORIES.find((c) => c.value === earnBackCategory)?.points ?? 0} points
                </Typography>
                <Typography variant="body2" color="success.dark">
                  will be permanently added to score
                </Typography>
              </Box>
            )}

            <DatePicker
              label="Award Date (optional)"
              value={earnBackDate}
              onChange={(newValue) => setEarnBackDate(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />

            <TextField
              label="Memo / Notes (optional)"
              multiline
              minRows={2}
              value={earnBackMemo}
              onChange={(e) => setEarnBackMemo(e.target.value)}
              fullWidth
              placeholder="e.g. Client John Smith specifically requested this worker"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEarnBackDialogOpen(false);
              setEarnBackCategory('');
              setEarnBackMemo('');
              setEarnBackDate(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={!earnBackCategory || createEarnBackMutation.isPending}
            onClick={handleAddEarnBack}
          >
            {createEarnBackMutation.isPending ? 'Saving...' : 'Add Award'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete award confirmation */}
      <Dialog
        open={!!deleteEarnBackId}
        onClose={() => setDeleteEarnBackId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remove Award?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will permanently remove the recognition award and reduce the worker&apos;s score accordingly.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteEarnBackId(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteEarnBackMutation.isPending}
            onClick={() => deleteEarnBackId && deleteEarnBackMutation.mutate(deleteEarnBackId)}
          >
            {deleteEarnBackMutation.isPending ? 'Removing...' : 'Remove'}
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
