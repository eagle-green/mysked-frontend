import { z } from 'zod';
import dayjs, { type Dayjs } from 'dayjs';
import { useId, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';
import {
  type AttendanceConductUploadCategory,
  uploadAttendanceConductReportViaBackend,
} from 'src/utils/backend-storage';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import {
  type LateOnSiteTier,
  CONDUCT_REPORT_SCORE,
  type WriteUpScoreType,
  type CalledInSickNotice,
  resolveConductReportScore,
  type DrivingInfractionTier,
  isAllowedConductReportScore,
} from '../conduct-score-policy';

// Match Employee List table row: Avatar 32x32, photo_url, first_name initial
function EmployeeAvatar({ user }: { user: any }) {
  const initial = user?.first_name?.charAt(0)?.toUpperCase() ?? '?';
  return (
    <Avatar
      src={user?.photo_url ?? undefined}
      alt={user?.first_name}
      sx={{ width: 32, height: 32 }}
    >
      {initial}
    </Avatar>
  );
}

// ----------------------------------------------------------------------

/** Categories for the create form: same as conduct report tabs + Called in Sick (vacation/sick/personal day off removed from create). */
const CREATE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'noShowUnpaid', label: 'No Show (Unpaid)' },
  { value: 'calledInSick', label: 'Called in Sick' },
  { value: 'sentHomeNoPpe', label: 'Sent home from site (No PPE)' },
  { value: 'leftEarlyNoNotice', label: 'Left Early No Notice' },
  { value: 'lateOnSite', label: 'Late on Site' },
  { value: 'unapprovedDaysOffShortNotice', label: 'Unapproved Days Off / Short Notice' },
  { value: 'unauthorizedDriving', label: 'Unauthorized Driving' },
  { value: 'drivingInfractions', label: 'Driving Infractions' },
  { value: 'unapprovePayoutWithoutDayOff', label: 'Unapprove Payout without Day Off' },
  { value: 'verbalWarningsWriteUp', label: 'Verbal Warnings / Write Up' },
];

const JOB_SEARCH_CATEGORIES = [
  'noShowUnpaid',
  'calledInSick',
  'sentHomeNoPpe',
  'leftEarlyNoNotice',
  'unapprovedDaysOffShortNotice',
  'lateOnSite',
];

/** Categories that carry a conduct score on create (policy-based values). */
const CATEGORIES_WITH_SCORE = [
  'noShowUnpaid',
  'calledInSick',
  'sentHomeNoPpe',
  'leftEarlyNoNotice',
  'lateOnSite',
  'unapprovedDaysOffShortNotice',
  'unauthorizedDriving',
  'drivingInfractions',
  'verbalWarningsWriteUp',
];

// ----------------------------------------------------------------------

type ConductReportScorePolicyFieldsProps = {
  categoryValue: string;
  lateOnSiteTier: LateOnSiteTier;
  setLateOnSiteTier: (v: LateOnSiteTier) => void;
  drivingInfractionTier: DrivingInfractionTier;
  setDrivingInfractionTier: (v: DrivingInfractionTier) => void;
  writeUpScoreType: WriteUpScoreType;
  setWriteUpScoreType: (v: WriteUpScoreType) => void;
  calledInSickHasDocumentation: boolean;
  setCalledInSickHasDocumentation: (v: boolean) => void;
  calledInSickNotice: CalledInSickNotice;
  setCalledInSickNotice: (v: CalledInSickNotice) => void;
  reportScoreError?: string;
  onClearReportScoreError: () => void;
};

function ConductReportScorePolicyFields({
  categoryValue,
  lateOnSiteTier,
  setLateOnSiteTier,
  drivingInfractionTier,
  setDrivingInfractionTier,
  writeUpScoreType,
  setWriteUpScoreType,
  calledInSickHasDocumentation,
  setCalledInSickHasDocumentation,
  calledInSickNotice,
  setCalledInSickNotice,
  reportScoreError,
  onClearReportScoreError,
}: ConductReportScorePolicyFieldsProps) {
  const calledInSickDocSwitchId = useId();

  if (!CATEGORIES_WITH_SCORE.includes(categoryValue)) return null;

  const fixedBox = (label: string, points: number) => (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Score impact (policy)
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}{' '}
        <Typography component="span" variant="body2" fontWeight={700} color="error.main">
          −{points}
        </Typography>{' '}
        points from the employee&apos;s conduct score.
      </Typography>
    </Box>
  );

  return (
    <Stack spacing={2}>
      {categoryValue === 'noShowUnpaid' &&
        fixedBox('This report deducts', CONDUCT_REPORT_SCORE.noShowUnpaid)}
      {categoryValue === 'sentHomeNoPpe' &&
        fixedBox('This report deducts', CONDUCT_REPORT_SCORE.sentHomeNoPpe)}
      {categoryValue === 'leftEarlyNoNotice' &&
        fixedBox('This report deducts', CONDUCT_REPORT_SCORE.leftEarlyNoNotice)}
      {categoryValue === 'unapprovedDaysOffShortNotice' &&
        fixedBox('This report deducts', CONDUCT_REPORT_SCORE.unapprovedDaysOffShortNotice)}
      {categoryValue === 'unauthorizedDriving' &&
        fixedBox('This report deducts', CONDUCT_REPORT_SCORE.unauthorizedDriving)}

      {categoryValue === 'calledInSick' && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Score impact (policy) *
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Based on how much notice the worker gave before the scheduled shift start. If they have a doctor&apos;s note on file, turn on the first option. Otherwise, choose when they notified you in the section below.
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <Switch
              id={calledInSickDocSwitchId}
              checked={calledInSickHasDocumentation}
              onChange={(_, checked) => {
                onClearReportScoreError();
                setCalledInSickHasDocumentation(checked);
                if (checked) {
                  setCalledInSickNotice('');
                }
              }}
            />
            <Typography
              variant="body2"
              component="label"
              htmlFor={calledInSickDocSwitchId}
              sx={{ cursor: 'pointer', userSelect: 'none', flex: 1, minWidth: 0 }}
            >
              Worker provided a doctor&apos;s note or equivalent documentation: 0 points
            </Typography>
          </Stack>
          <FormControl
            component="fieldset"
            error={!!reportScoreError}
            variant="standard"
            disabled={calledInSickHasDocumentation}
            sx={{ mt: 2 }}
          >
            <Typography component="legend" variant="subtitle2" sx={{ mb: 1 }}>
              If no documentation, when did they notify? (vs scheduled shift start) *
            </Typography>
            <RadioGroup
              value={calledInSickNotice}
              onChange={(e) => {
                onClearReportScoreError();
                setCalledInSickHasDocumentation(false);
                setCalledInSickNotice(e.target.value as CalledInSickNotice);
              }}
            >
              <FormControlLabel
                value="over8"
                control={<Radio />}
                label={`More than 8 hours before shift: ${CONDUCT_REPORT_SCORE.calledInSickOver8Hours} points (no deduction)`}
              />
              <FormControlLabel
                value="4to8"
                control={<Radio />}
                label={`Same-day notice, 4-8 hours before shift: −${CONDUCT_REPORT_SCORE.calledInSick4to8Hours} points`}
              />
              <FormControlLabel
                value="under4"
                control={<Radio />}
                label={`Last minute (under 4 hours before shift): −${CONDUCT_REPORT_SCORE.calledInSickUnder4Hours} points`}
              />
            </RadioGroup>
            {reportScoreError && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {reportScoreError}
              </Typography>
            )}
          </FormControl>
        </Box>
      )}

      {categoryValue === 'lateOnSite' && (
        <FormControl component="fieldset" error={!!reportScoreError} variant="standard">
          <Typography component="legend" variant="subtitle2" sx={{ mb: 1 }}>
            How late was the worker? *
          </Typography>
          <RadioGroup
            value={lateOnSiteTier}
            onChange={(e) => {
              onClearReportScoreError();
              setLateOnSiteTier(e.target.value as LateOnSiteTier);
            }}
          >
            <FormControlLabel
              value="tier1"
              control={<Radio />}
              label={`1-15 minutes late: −${CONDUCT_REPORT_SCORE.lateOnSiteTier1} points`}
            />
            <FormControlLabel
              value="tier2"
              control={<Radio />}
              label={`16-45 minutes late: −${CONDUCT_REPORT_SCORE.lateOnSiteTier2} points`}
            />
            <FormControlLabel
              value="tier3"
              control={<Radio />}
              label={`More than 45 minutes late: −${CONDUCT_REPORT_SCORE.lateOnSiteTier3} points`}
            />
          </RadioGroup>
          {reportScoreError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {reportScoreError}
            </Typography>
          )}
        </FormControl>
      )}

      {categoryValue === 'drivingInfractions' && (
        <FormControl component="fieldset" error={!!reportScoreError} variant="standard">
          <Typography component="legend" variant="subtitle2" sx={{ mb: 1 }}>
            Severity *
          </Typography>
          <RadioGroup
            value={drivingInfractionTier}
            onChange={(e) => {
              onClearReportScoreError();
              setDrivingInfractionTier(e.target.value as DrivingInfractionTier);
            }}
          >
            <FormControlLabel
              value="minor"
              control={<Radio />}
              label={`Minor (e.g. parking, paperwork): −${CONDUCT_REPORT_SCORE.drivingInfractionMinor} points`}
            />
            <FormControlLabel
              value="major"
              control={<Radio />}
              label={`Major (e.g. DUI, serious violation): −${CONDUCT_REPORT_SCORE.drivingInfractionMajor} points`}
            />
          </RadioGroup>
          {reportScoreError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {reportScoreError}
            </Typography>
          )}
        </FormControl>
      )}

      {categoryValue === 'verbalWarningsWriteUp' && (
        <FormControl component="fieldset" error={!!reportScoreError} variant="standard">
          <Typography component="legend" variant="subtitle2" sx={{ mb: 1 }}>
            Warning type *
          </Typography>
          <RadioGroup
            value={writeUpScoreType}
            onChange={(e) => {
              onClearReportScoreError();
              setWriteUpScoreType(e.target.value as WriteUpScoreType);
            }}
          >
            <FormControlLabel
              value="verbal"
              control={<Radio />}
              label={`Verbal warning: −${CONDUCT_REPORT_SCORE.verbalWarning} points`}
            />
            <FormControlLabel
              value="written"
              control={<Radio />}
              label={`Written warning: −${CONDUCT_REPORT_SCORE.writtenWarning} points`}
            />
          </RadioGroup>
          {reportScoreError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {reportScoreError}
            </Typography>
          )}
        </FormControl>
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

/** Base categories for Verbal Warnings / Write Up (traffic management company). */
const VERBAL_WRITE_UP_BASE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'safety_violation', label: 'Safety Violation' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'policy_violation', label: 'Policy Violation' },
  { value: 'work_performance', label: 'Work Performance' },
  { value: 'customer_complaint', label: 'Customer Complaint' },
  { value: 'equipment_ppe', label: 'Equipment / PPE' },
  { value: 'driving', label: 'Driving' },
  { value: 'other', label: 'Other' },
];

/** Build zod schema for create report form; validates based on category and searchAllJobs. */
function buildCreateReportSchema(categoryValue: string, searchAllJobs: boolean) {
  const hasJobStep = JOB_SEARCH_CATEGORIES.includes(categoryValue);
  const withScore = CATEGORIES_WITH_SCORE.includes(categoryValue);

  return z
    .object({
      employeeId: z.string().min(1, { message: 'Employee is required' }),
      category: z.string().min(1, { message: 'Category is required' }),
      jobId: z.string().nullable(),
      searchAllJobs: z.boolean(),
      jobPosition: z.string(),
      jobStartTime: z.any(),
      jobEndTime: z.any(),
      daysOffNotifiedDateTime: z.any(),
      arrivedAtSiteTime: z.any(),
      unauthorizedDrivingDateTime: z.any(),
      unauthorizedDrivingNotes: z.string(),
      payoutRequestDateTime: z.any(),
      payoutHours: z.string(),
      verbalWarningsDateTime: z.any(),
      verbalWarningsCategory: z.string(),
      verbalWarningsDetail: z.string(),
      reportScore: z.string(),
    })
    .superRefine((data, ctx) => {
      if (hasJobStep) {
        const jobRequired =
          categoryValue !== 'unapprovedDaysOffShortNotice' || searchAllJobs;
        if (jobRequired && (!data.jobId || data.jobId === '')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Job number is required',
            path: ['jobId'],
          });
        }
        if (searchAllJobs) {
          if (!data.jobPosition?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Position is required when Search all jobs is on',
              path: ['jobPosition'],
            });
          }
          const startValid = data.jobStartTime != null && dayjs(data.jobStartTime).isValid();
          if (!startValid) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Start time is required when Search all jobs is on',
              path: ['jobStartTime'],
            });
          }
          const endValid = data.jobEndTime != null && dayjs(data.jobEndTime).isValid();
          if (!endValid) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'End time is required when Search all jobs is on',
              path: ['jobEndTime'],
            });
          }
        }
      }
      if (categoryValue === 'unapprovedDaysOffShortNotice') {
        if (!data.daysOffNotifiedDateTime || !dayjs(data.daysOffNotifiedDateTime).isValid()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'When did the worker notify? is required',
            path: ['daysOffNotifiedDateTime'],
          });
        }
      }
      if (categoryValue === 'lateOnSite') {
        if (!data.arrivedAtSiteTime || !dayjs(data.arrivedAtSiteTime).isValid()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Arrived at site is required',
            path: ['arrivedAtSiteTime'],
          });
        }
      }
      if (categoryValue === 'unauthorizedDriving' || categoryValue === 'drivingInfractions') {
        if (!data.unauthorizedDrivingDateTime || !dayjs(data.unauthorizedDrivingDateTime).isValid()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Date and time is required',
            path: ['unauthorizedDrivingDateTime'],
          });
        }
        if (!data.unauthorizedDrivingNotes?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Details are required',
            path: ['unauthorizedDrivingNotes'],
          });
        }
      }
      if (categoryValue === 'unapprovePayoutWithoutDayOff') {
        if (!data.payoutRequestDateTime || !dayjs(data.payoutRequestDateTime).isValid()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Request date and time is required',
            path: ['payoutRequestDateTime'],
          });
        }
        const hoursNum = parseFloat(data.payoutHours);
        if (data.payoutHours.trim() === '' || Number.isNaN(hoursNum) || hoursNum < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'How many hours is required',
            path: ['payoutHours'],
          });
        }
      }
      if (categoryValue === 'verbalWarningsWriteUp') {
        if (!data.verbalWarningsDateTime || !dayjs(data.verbalWarningsDateTime).isValid()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Date and time is required',
            path: ['verbalWarningsDateTime'],
          });
        }
        if (!data.verbalWarningsCategory?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Category is required',
            path: ['verbalWarningsCategory'],
          });
        }
        if (!data.verbalWarningsDetail?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Detail is required',
            path: ['verbalWarningsDetail'],
          });
        }
      }
      if (withScore) {
        const scoreTrim = (data.reportScore ?? '').trim();
        const scoreNum = parseInt(scoreTrim, 10);
        if (
          scoreTrim === '' ||
          Number.isNaN(scoreNum) ||
          !isAllowedConductReportScore(categoryValue, scoreNum)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Choose a valid score impact for this category',
            path: ['reportScore'],
          });
        }
      }
    });
}

// ----------------------------------------------------------------------

export function AttendanceConductReportCreateView() {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<{ value: string; label: string } | null>(null);
  const [searchAllJobs, setSearchAllJobs] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [autocompleteInputValue, setAutocompleteInputValue] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [memoReason, setMemoReason] = useState('');
  const [arrivedAtSiteTime, setArrivedAtSiteTime] = useState<Dayjs | null>(null);
  const [arrivedTimePickerOpen, setArrivedTimePickerOpen] = useState(false);
  const [unauthorizedDrivingDateTime, setUnauthorizedDrivingDateTime] = useState<Dayjs | null>(null);
  const [unauthorizedDrivingDateTimePickerOpen, setUnauthorizedDrivingDateTimePickerOpen] = useState(false);
  const [unauthorizedDrivingNotes, setUnauthorizedDrivingNotes] = useState('');
  const [unauthorizedDrivingFiles, setUnauthorizedDrivingFiles] = useState<File[]>([]);
  const [payoutRequestDateTime, setPayoutRequestDateTime] = useState<Dayjs | null>(null);
  const [payoutRequestDateTimePickerOpen, setPayoutRequestDateTimePickerOpen] = useState(false);
  const [payoutHours, setPayoutHours] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [verbalWarningsDateTime, setVerbalWarningsDateTime] = useState<Dayjs | null>(null);
  const [verbalWarningsDateTimePickerOpen, setVerbalWarningsDateTimePickerOpen] = useState(false);
  const [verbalWarningsCategory, setVerbalWarningsCategory] = useState<string>('');
  const [verbalWarningsDetail, setVerbalWarningsDetail] = useState('');
  const [verbalWarningsFiles, setVerbalWarningsFiles] = useState<File[]>([]);
  const [addWriteUpCategoryDialogOpen, setAddWriteUpCategoryDialogOpen] = useState(false);
  const [newWriteUpCategoryName, setNewWriteUpCategoryName] = useState('');
  const [editWriteUpCategoryDialogOpen, setEditWriteUpCategoryDialogOpen] = useState(false);
  const [editingWriteUpCategory, setEditingWriteUpCategory] = useState<{ value: string; label: string; id?: string } | null>(null);
  const [editWriteUpCategoryName, setEditWriteUpCategoryName] = useState('');
  const [daysOffNotifiedDateTime, setDaysOffNotifiedDateTime] = useState<Dayjs | null>(null);
  const [daysOffNotifiedDateTimePickerOpen, setDaysOffNotifiedDateTimePickerOpen] = useState(false);
  /** For Unapproved Days Off: does the worker have an assigned shift that day? If true, show job search. */
  const [workerHasShiftThatDay, setWorkerHasShiftThatDay] = useState<boolean>(false);
  const [lateOnSiteTier, setLateOnSiteTier] = useState<LateOnSiteTier>('');
  const [drivingInfractionTier, setDrivingInfractionTier] = useState<DrivingInfractionTier>('');
  const [writeUpScoreType, setWriteUpScoreType] = useState<WriteUpScoreType>('');
  const [calledInSickHasDocumentation, setCalledInSickHasDocumentation] = useState(false);
  const [calledInSickNotice, setCalledInSickNotice] = useState<CalledInSickNotice>('');
  const [jobPosition, setJobPosition] = useState<string>('');
  const [jobStartTime, setJobStartTime] = useState<Dayjs | null>(null);
  const [jobEndTime, setJobEndTime] = useState<Dayjs | null>(null);
  const [jobStartTimePickerOpen, setJobStartTimePickerOpen] = useState(false);
  const [jobEndTimePickerOpen, setJobEndTimePickerOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [categoryInputValue, setCategoryInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const categoryValue = selectedCategory?.value ?? '';
  const showScoreInStep3 = CATEGORIES_WITH_SCORE.includes(categoryValue);
  const showJobSearch = JOB_SEARCH_CATEGORIES.includes(categoryValue);
  const isLateOnSite = categoryValue === 'lateOnSite';
  const isUnauthorizedDriving = categoryValue === 'unauthorizedDriving';
  const isDrivingInfractions = categoryValue === 'drivingInfractions';
  const showDateDetailsAttachmentsStep = isUnauthorizedDriving || isDrivingInfractions;
  const isPayoutWithoutDayOff = categoryValue === 'unapprovePayoutWithoutDayOff';
  const isVerbalWarningsWriteUp = categoryValue === 'verbalWarningsWriteUp';
  const isUnapprovedDaysOff = categoryValue === 'unapprovedDaysOffShortNotice';

  const queryClient = useQueryClient();
  const { data: writeUpCategoriesData } = useQuery({
    queryKey: ['attendance-conduct-report', 'write-up-categories'],
    queryFn: async () => {
      const res = await fetcher(endpoints.attendanceConductReport.writeUpCategories);
      const list = res?.data?.categories ?? res?.categories ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: isVerbalWarningsWriteUp,
  });
  const writeUpCategoriesFromApi = (writeUpCategoriesData ?? []).map((c: { id: string; name: string }) => ({
    value: c.name.toLowerCase().replace(/\s+/g, '_'),
    label: c.name,
    id: c.id,
  }));
  const writeUpCategoryOptions: { value: string; label: string; id?: string }[] = [
    ...VERBAL_WRITE_UP_BASE_CATEGORIES,
    ...writeUpCategoriesFromApi,
  ];

  // Debounce employee search
  const [employeeQueryDebounced, setEmployeeQueryDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setEmployeeQueryDebounced(employeeSearchQuery), 300);
    return () => clearTimeout(t);
  }, [employeeSearchQuery]);

  // Debounce job search input
  useEffect(() => {
    const t = setTimeout(() => setJobSearchQuery(autocompleteInputValue), 300);
    return () => clearTimeout(t);
  }, [autocompleteInputValue]);

  // Keep category Autocomplete input in sync with selection (controlled input)
  useEffect(() => {
    setCategoryInputValue(selectedCategory?.label ?? '');
  }, [selectedCategory]);

  // Fetch employees for autocomplete (same API as Employee List; support both response shapes)
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['users-search', employeeQueryDebounced],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '100',
        orderBy: 'first_name',
        order: 'asc',
        status: 'active',
        ...(employeeQueryDebounced.trim() && { search: employeeQueryDebounced.trim() }),
      });
      const response = await fetcher(`${endpoints.management.user}?${params.toString()}`);
      const data = response?.data ?? response;
      const users = data?.users ?? data?.data?.users ?? (Array.isArray(data) ? data : []);
      return Array.isArray(users) ? users : [];
    },
    enabled: true,
  });

  const employeeOptions = Array.isArray(employeesData) ? employeesData : [];

  // Assigned jobs for selected employee (when "Search all jobs" is OFF - same as Add Worker Incident)
  const employeeId = selectedEmployee?.id ?? null;
  const { data: assignedJobsData, isLoading: isLoadingAssignedJobs } = useQuery({
    queryKey: ['worker-assigned-jobs-for-conduct-report', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const [acceptedResponse, completedResponse, pendingResponse] = await Promise.all([
        fetcher(`${endpoints.work.job}/worker/${employeeId}/history?status=accepted&limit=1000`),
        fetcher(`${endpoints.work.job}/worker/${employeeId}/history?status=completed&limit=1000`),
        fetcher(`${endpoints.work.job}/worker/${employeeId}/history?status=pending&limit=1000`),
      ]);
      const acceptedJobs = acceptedResponse?.data?.jobs ?? acceptedResponse?.jobs ?? [];
      const completedJobs = completedResponse?.data?.jobs ?? completedResponse?.jobs ?? [];
      const pendingJobs = pendingResponse?.data?.jobs ?? pendingResponse?.jobs ?? [];
      const jobsMap = new Map();
      [...acceptedJobs, ...completedJobs, ...pendingJobs].forEach((job: any) => {
        const id = job?.job_id ?? job?.id;
        if (id && !jobsMap.has(id)) jobsMap.set(id, job);
      });
      return Array.from(jobsMap.values());
    },
    enabled: showJobSearch && !!employeeId && !searchAllJobs,
  });

  const assignedJobs = Array.isArray(assignedJobsData) ? assignedJobsData : [];

  // Search all jobs by job number (when "Search all jobs" is ON - same as Add Worker Incident)
  const { data: searchedJobsData = [], isLoading: isSearchingJobs } = useQuery({
    queryKey: ['search-jobs-by-number', jobSearchQuery],
    queryFn: async () => {
      const term = jobSearchQuery.replace(/^#/, '').trim();
      if (!term) return [];
      const response = await fetcher(
        `${endpoints.work.job}?search=${encodeURIComponent(term)}&limit=50&rowsPerPage=50`
      );
      return response?.jobs ?? response?.data?.jobs ?? [];
    },
    enabled: showJobSearch && searchAllJobs && jobSearchQuery.trim().length >= 2,
  });

  const searchedJobs = Array.isArray(searchedJobsData) ? searchedJobsData : [];
  const options = searchAllJobs ? searchedJobs : assignedJobs;
  const selectedOption =
    selectedJob && options.some((j: any) => (j.id || j.job_id) === (selectedJob.id || selectedJob.job_id))
      ? selectedJob
      : options.find(
          (j: any) =>
            String(j.id || j.job_id) === String(selectedJob?.id || selectedJob?.job_id)
        ) ?? selectedJob;

  const handleEmployeeChange = (_: any, newValue: any) => {
    setSelectedEmployee(newValue);
    setSelectedCategory(null);
    setSelectedJob(null);
    setAutocompleteInputValue('');
    setJobSearchQuery('');
    setMemoReason('');
  };

  const handleCategoryChange = (_: any, newValue: { value: string; label: string } | null) => {
    setSelectedCategory(newValue);
    // Reset entire form whenever category changes
    setSearchAllJobs(false);
    setSelectedJob(null);
    setAutocompleteInputValue('');
    setJobSearchQuery('');
    setMemoReason('');
    setJobPosition('');
    setJobStartTime(null);
    setJobEndTime(null);
    setArrivedAtSiteTime(null);
    setArrivedTimePickerOpen(false);
    setUnauthorizedDrivingDateTime(null);
    setUnauthorizedDrivingDateTimePickerOpen(false);
    setUnauthorizedDrivingNotes('');
    setUnauthorizedDrivingFiles([]);
    setPayoutRequestDateTime(null);
    setPayoutRequestDateTimePickerOpen(false);
    setPayoutHours('');
    setPayoutNotes('');
    setVerbalWarningsDateTime(null);
    setVerbalWarningsDateTimePickerOpen(false);
    setVerbalWarningsCategory('');
    setVerbalWarningsDetail('');
    setVerbalWarningsFiles([]);
    setDaysOffNotifiedDateTime(null);
    setDaysOffNotifiedDateTimePickerOpen(false);
    setWorkerHasShiftThatDay(false);
    setLateOnSiteTier('');
    setDrivingInfractionTier('');
    setWriteUpScoreType('');
    setCalledInSickHasDocumentation(false);
    setCalledInSickNotice('');
    setFieldErrors({});
  };

  const createWriteUpCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetcher([endpoints.attendanceConductReport.writeUpCategories, { method: 'POST', data: { name: name.trim() } }]);
      return res?.data?.category ?? res?.category;
    },
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-conduct-report', 'write-up-categories'] });
      if (category?.name) {
        const value = category.name.toLowerCase().replace(/\s+/g, '_');
        setVerbalWarningsCategory(value);
      }
      setNewWriteUpCategoryName('');
      setAddWriteUpCategoryDialogOpen(false);
      toast.success('Category added');
    },
    onError: (err: any) => {
      const msg = err?.error ?? err?.response?.data?.error ?? err?.message ?? 'Failed to add category';
      toast.error(typeof msg === 'string' ? msg : 'Failed to add category');
    },
  });

  const updateWriteUpCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetcher([
        `${endpoints.attendanceConductReport.writeUpCategories}/${id}`,
        { method: 'PATCH', data: { name: name.trim() } },
      ]);
      return res?.data?.category ?? res?.category;
    },
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-conduct-report', 'write-up-categories'] });
      if (category?.name && editingWriteUpCategory && verbalWarningsCategory === editingWriteUpCategory.value) {
        setVerbalWarningsCategory(category.name.toLowerCase().replace(/\s+/g, '_'));
      }
      setEditingWriteUpCategory(null);
      setEditWriteUpCategoryName('');
      setEditWriteUpCategoryDialogOpen(false);
      toast.success('Category updated');
    },
    onError: (err: any) => {
      const msg = err?.error ?? err?.response?.data?.error ?? err?.message ?? 'Failed to update category';
      toast.error(typeof msg === 'string' ? msg : 'Failed to update category');
    },
  });

  const handleAddWriteUpCategory = () => {
    const name = newWriteUpCategoryName.trim();
    if (!name) return;
    if (writeUpCategoryOptions.some((c) => c.label.toLowerCase() === name.toLowerCase())) {
      toast.error('A category with this name already exists');
      return;
    }
    createWriteUpCategoryMutation.mutate(name);
  };

  const handleOpenEditWriteUpCategory = (option: { value: string; label: string; id?: string }) => {
    setEditingWriteUpCategory(option);
    setEditWriteUpCategoryName(option.label);
    setEditWriteUpCategoryDialogOpen(true);
  };

  const handleSaveEditWriteUpCategory = () => {
    const name = editWriteUpCategoryName.trim();
    if (!name || !editingWriteUpCategory) return;
    if (editingWriteUpCategory.id) {
      updateWriteUpCategoryMutation.mutate({ id: editingWriteUpCategory.id, name });
    } else {
      setEditWriteUpCategoryDialogOpen(false);
      setEditingWriteUpCategory(null);
      setEditWriteUpCategoryName('');
    }
  };

  const handleJobChange = (_: any, newValue: any) => {
    if (newValue && (newValue.id || newValue.job_id)) {
      setSelectedJob(newValue);
      setAutocompleteInputValue(`#${newValue.job_number} - ${fDate(newValue.start_time)}`);
      if (searchAllJobs) {
        setJobPosition(newValue.position ?? '');
        const start = newValue.start_time ?? newValue.worker_start_time;
        const end = newValue.end_time ?? newValue.worker_end_time;
        setJobStartTime(start ? dayjs(start) : null);
        setJobEndTime(end ? dayjs(end) : null);
      }
    } else {
      setSelectedJob(null);
      setAutocompleteInputValue('');
      if (searchAllJobs) {
        setJobPosition('');
        setJobStartTime(null);
        setJobEndTime(null);
      }
    }
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const conductScorePolicyFieldProps = {
    categoryValue,
    lateOnSiteTier,
    setLateOnSiteTier,
    drivingInfractionTier,
    setDrivingInfractionTier,
    writeUpScoreType,
    setWriteUpScoreType,
    calledInSickHasDocumentation,
    setCalledInSickHasDocumentation,
    calledInSickNotice,
    setCalledInSickNotice,
    reportScoreError: fieldErrors.reportScore,
    onClearReportScoreError: () => clearFieldError('reportScore'),
  };

  const scoreResolutionOpts = {
    lateOnSiteTier,
    drivingInfractionTier,
    writeUpScoreType,
    calledInSickHasDocumentation,
    calledInSickNotice,
  };

  const handleSubmitReport = async () => {
    const jobId = selectedJob ? String(selectedJob.id ?? selectedJob.job_id) : null;
    const submitEmployeeId = selectedEmployee?.id ?? '';
    const resolvedReportScore = showScoreInStep3
      ? resolveConductReportScore(categoryValue, scoreResolutionOpts)
      : '';
    const payload = {
      employeeId: submitEmployeeId,
      category: categoryValue,
      jobId,
      searchAllJobs,
      jobPosition,
      jobStartTime,
      jobEndTime,
      daysOffNotifiedDateTime: isUnapprovedDaysOff ? daysOffNotifiedDateTime : null,
      arrivedAtSiteTime: isLateOnSite ? arrivedAtSiteTime : null,
      unauthorizedDrivingDateTime: showDateDetailsAttachmentsStep ? unauthorizedDrivingDateTime : null,
      unauthorizedDrivingNotes: showDateDetailsAttachmentsStep ? unauthorizedDrivingNotes : '',
      payoutRequestDateTime: isPayoutWithoutDayOff ? payoutRequestDateTime : null,
      payoutHours: isPayoutWithoutDayOff ? payoutHours : '',
      payoutNotes: isPayoutWithoutDayOff ? (payoutNotes ?? '').trim() || undefined : undefined,
      verbalWarningsDateTime: isVerbalWarningsWriteUp ? verbalWarningsDateTime : null,
      verbalWarningsCategory: isVerbalWarningsWriteUp ? verbalWarningsCategory : '',
      verbalWarningsDetail: isVerbalWarningsWriteUp ? verbalWarningsDetail : '',
      reportScore: resolvedReportScore,
      memo: (memoReason ?? '').trim() || undefined,
    };
    const schema = buildCreateReportSchema(categoryValue, searchAllJobs);
    const result = schema.safeParse(payload);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0];
        if (typeof path === 'string' && err.message) {
          errors[path] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      let attachmentUrls: string[] = [];
      const filesToUpload =
        showDateDetailsAttachmentsStep ? unauthorizedDrivingFiles : isVerbalWarningsWriteUp ? verbalWarningsFiles : [];
      const uploadCategoryMap: Record<string, AttendanceConductUploadCategory> = {
        unauthorizedDriving: 'unauthorized_driving',
        drivingInfractions: 'driving_infractions',
        verbalWarningsWriteUp: 'verbal_warnings_write_up',
      };
      const uploadCategory = uploadCategoryMap[categoryValue];
      if (filesToUpload.length > 0 && employeeId && uploadCategory) {
        const uploads = await Promise.all(
          filesToUpload.map((file) =>
            uploadAttendanceConductReportViaBackend({
              file,
              userId: employeeId,
              category: uploadCategory,
            })
          )
        );
        attachmentUrls = uploads.map((u) => u.url);
      }
      const body = {
        ...payload,
        jobStartTime: payload.jobStartTime ? dayjs(payload.jobStartTime).toISOString() : null,
        jobEndTime: payload.jobEndTime ? dayjs(payload.jobEndTime).toISOString() : null,
        daysOffNotifiedDateTime: payload.daysOffNotifiedDateTime
          ? dayjs(payload.daysOffNotifiedDateTime).toISOString()
          : null,
        arrivedAtSiteTime: payload.arrivedAtSiteTime
          ? dayjs(payload.arrivedAtSiteTime).toISOString()
          : null,
        unauthorizedDrivingDateTime: payload.unauthorizedDrivingDateTime
          ? dayjs(payload.unauthorizedDrivingDateTime).toISOString()
          : null,
        payoutRequestDateTime: payload.payoutRequestDateTime
          ? dayjs(payload.payoutRequestDateTime).toISOString()
          : null,
        verbalWarningsDateTime: payload.verbalWarningsDateTime
          ? dayjs(payload.verbalWarningsDateTime).toISOString()
          : null,
        attachmentUrls,
      };
      await fetcher([endpoints.attendanceConductReport.create, { method: 'post', data: body }]);
      toast.success('Report submitted successfully.');
      router.push(paths.management.user.attendanceConductReport);
    } catch (err: any) {
      const message = err?.message || err?.error || 'Failed to submit report';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: selectedEmployee ? 6 : 12 }}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Step 1
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Select employee
            </Typography>
            <Autocomplete
              value={selectedEmployee}
              onChange={(e, v) => {
                clearFieldError('employeeId');
                handleEmployeeChange(e, v);
              }}
              inputValue={employeeSearchQuery ?? ''}
              onInputChange={(_, newValue) => setEmployeeSearchQuery(newValue ?? '')}
              options={employeeOptions}
              getOptionLabel={(option: any) =>
                [option?.first_name, option?.last_name].filter(Boolean).join(' ').trim() ||
                option?.email ||
                option?.id ||
                ''
              }
              isOptionEqualToValue={(option: any, value: any) => option?.id === value?.id}
              loading={isLoadingEmployees}
              filterOptions={(opts, state) => {
                const q = (state.inputValue ?? '').trim().toLowerCase();
                if (!q) return opts;
                return opts.filter(
                  (o: any) =>
                    [o?.first_name, o?.last_name, o?.email].filter(Boolean).join(' ').toLowerCase().includes(q)
                );
              }}
              renderOption={(props, option: any) => {
                const rest = { ...(props as any) };
                delete rest.key;
                const name = [option?.first_name, option?.last_name].filter(Boolean).join(' ').trim() || option?.email || '';
                const optionKey = option?.id ?? option?.email ?? `emp-${name}`;
                return (
                  <Box component="li" key={optionKey} {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <EmployeeAvatar user={option} />
                    <Typography variant="body2">{name}</Typography>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Employee *"
                  placeholder="Search by name or email..."
                  error={!!fieldErrors.employeeId}
                  helperText={fieldErrors.employeeId}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        {selectedEmployee ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                            <EmployeeAvatar user={selectedEmployee} />
                          </Box>
                        ) : null}
                        {params.InputProps?.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Card>
        </Grid>
        {selectedEmployee && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                Step 2
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Select category
              </Typography>
              <Autocomplete
                value={selectedCategory ?? null}
                inputValue={categoryInputValue ?? ''}
                onInputChange={(_, v) => setCategoryInputValue(v ?? '')}
                onChange={(e, v) => {
                  clearFieldError('category');
                  handleCategoryChange(e, v);
                }}
                options={CREATE_CATEGORIES}
                getOptionLabel={(option) => (typeof option === 'object' && option?.label) || ''}
                isOptionEqualToValue={(option, value) => option?.value === value?.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category *"
                    placeholder="Select category..."
                    error={!!fieldErrors.category}
                    helperText={fieldErrors.category}
                  />
                )}
              />
            </Card>
          </Grid>
        )}
      </Grid>

      {showJobSearch && (
        <Card sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Step 3
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            {isUnapprovedDaysOff ? 'Late/short notice & details' : 'Job & details'}
          </Typography>
          {isUnapprovedDaysOff && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use when a worker gave late or short notice for a day off. If they had an assigned job that day, you can
              link it below.
            </Typography>
          )}
          <Stack spacing={2}>
            {isUnapprovedDaysOff && (
              <DateTimePicker
                label="When did the worker notify?"
                value={daysOffNotifiedDateTime}
                onChange={(newValue) => {
                  clearFieldError('daysOffNotifiedDateTime');
                  setDaysOffNotifiedDateTime(newValue);
                }}
                open={daysOffNotifiedDateTimePickerOpen}
                onOpen={() => setDaysOffNotifiedDateTimePickerOpen(true)}
                onClose={() => setDaysOffNotifiedDateTimePickerOpen(false)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!fieldErrors.daysOffNotifiedDateTime,
                    helperText: fieldErrors.daysOffNotifiedDateTime ?? 'Date and time the worker gave notice',
                    onClick: () => setDaysOffNotifiedDateTimePickerOpen(true),
                    InputProps: { readOnly: true },
                  },
                }}
              />
            )}
            {isUnapprovedDaysOff && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Does the worker have an assigned shift that day?
                </Typography>
                <RadioGroup
                  row
                  value={workerHasShiftThatDay ? 'yes' : 'no'}
                  onChange={(e) => {
                    const yes = e.target.value === 'yes';
                    setWorkerHasShiftThatDay(yes);
                    if (!yes) {
                      setSearchAllJobs(false);
                      setSelectedJob(null);
                      setAutocompleteInputValue('');
                      setJobSearchQuery('');
                      setJobPosition('');
                      setJobStartTime(null);
                      setJobEndTime(null);
                    }
                  }}
                >
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                  <FormControlLabel value="yes" control={<Radio />} label="Yes - link to job (optional)" />
                </RadioGroup>
              </Box>
            )}
            {((isUnapprovedDaysOff && workerHasShiftThatDay) || (showJobSearch && !isUnapprovedDaysOff)) && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={searchAllJobs}
                      onChange={(e) => {
                        setSearchAllJobs(e.target.checked);
                        setJobSearchQuery('');
                        setSelectedJob(null);
                        setAutocompleteInputValue('');
                        if (!e.target.checked) {
                          setJobPosition('');
                          setJobStartTime(null);
                          setJobEndTime(null);
                        }
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Search all jobs
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Enable to search jobs even if worker was removed
                      </Typography>
                    </Box>
                  }
                />

            <Autocomplete
              value={selectedOption ?? null}
              options={
                selectedJob && !options.some((j: any) => (j.id || j.job_id) === (selectedJob?.id || selectedJob?.job_id))
                  ? [selectedJob, ...options]
                  : options
              }
              getOptionLabel={(option: any) =>
                option?.job_number ? `#${option.job_number} - ${fDate(option.start_time)}` : ''
              }
              isOptionEqualToValue={(option: any, value: any) =>
                String(option?.id || option?.job_id) === String(value?.id || value?.job_id)
              }
              inputValue={autocompleteInputValue ?? ''}
              onInputChange={(_, newInputValue) => setAutocompleteInputValue(newInputValue ?? '')}
              onChange={(e, v) => {
                clearFieldError('jobId');
                handleJobChange(e, v);
              }}
              loading={searchAllJobs ? isSearchingJobs : isLoadingAssignedJobs}
              filterOptions={(opts, state) => {
                if (searchAllJobs) return opts;
                const q = (state.inputValue ?? '').trim().toLowerCase();
                if (!q) return opts;
                return opts.filter((option: any) => {
                  const label = option?.job_number
                    ? `#${option.job_number} - ${fDate(option.start_time)}`
                    : '';
                  return label.toLowerCase().includes(q);
                });
              }}
              renderOption={(props, option: any) => {
                const rest = { ...(props as any) };
                delete rest.key;
                const jobKey = option?.id ?? option?.job_id ?? `job-${option?.job_number}-${option?.start_time}`;
                const label = option?.job_number ? `#${option.job_number} - ${fDate(option.start_time)}` : '';
                return (
                  <Box component="li" key={jobKey} {...rest}>
                    {label}
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={
                    isUnapprovedDaysOff && !searchAllJobs
                      ? 'Job Number (optional)'
                      : 'Job Number *'
                  }
                  placeholder={
                    searchAllJobs
                      ? 'Type job number to search... (min 2 characters)'
                      : 'Search job...'
                  }
                  error={!!fieldErrors.jobId}
                  helperText={
                    fieldErrors.jobId ??
                    (isUnapprovedDaysOff && !searchAllJobs
                      ? 'Optional - link the job they had assigned that day'
                      : searchAllJobs
                        ? 'Type at least 2 characters to search all jobs'
                        : 'Select from jobs where this worker is assigned (accepted, completed, or pending)')
                  }
                />
              )}
            />

                {searchAllJobs && (
              <>
                <FormControl fullWidth error={!!fieldErrors.jobPosition}>
                  <InputLabel id="conduct-report-position-label" shrink={!!jobPosition}>
                    Position *
                  </InputLabel>
                  <Select
                    labelId="conduct-report-position-label"
                    value={jobPosition}
                    label="Position *"
                    onChange={(e) => {
                      clearFieldError('jobPosition');
                      setJobPosition(e.target.value);
                    }}
                    displayEmpty
                    notched={!!jobPosition}
                    renderValue={(selected) => {
                      if (!selected) return '';
                      return JOB_POSITION_OPTIONS.find((opt) => opt.value === selected)?.label ?? selected;
                    }}
                  >
                    {JOB_POSITION_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldErrors.jobPosition && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {fieldErrors.jobPosition}
                    </Typography>
                  )}
                </FormControl>
                <Stack direction="row" spacing={2}>
                  <TimePicker
                    label="Start Time"
                    value={jobStartTime}
                    onChange={(newValue) => {
                      clearFieldError('jobStartTime');
                      setJobStartTime(newValue);
                    }}
                    open={jobStartTimePickerOpen}
                    onOpen={() => setJobStartTimePickerOpen(true)}
                    onClose={() => setJobStartTimePickerOpen(false)}
                    format="h:mm a"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!fieldErrors.jobStartTime,
                        helperText: fieldErrors.jobStartTime,
                        placeholder: 'Select time',
                        onClick: () => setJobStartTimePickerOpen(true),
                        InputProps: { readOnly: true },
                      },
                      actionBar: { actions: ['accept', 'cancel', 'clear'] },
                    }}
                  />
                  <TimePicker
                    label="End Time"
                    value={jobEndTime}
                    onChange={(newValue) => {
                      clearFieldError('jobEndTime');
                      setJobEndTime(newValue);
                    }}
                    open={jobEndTimePickerOpen}
                    onOpen={() => setJobEndTimePickerOpen(true)}
                    onClose={() => setJobEndTimePickerOpen(false)}
                    format="h:mm a"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!fieldErrors.jobEndTime,
                        helperText: fieldErrors.jobEndTime,
                        placeholder: 'Select time',
                        onClick: () => setJobEndTimePickerOpen(true),
                        InputProps: { readOnly: true },
                      },
                      actionBar: { actions: ['accept', 'cancel', 'clear'] },
                    }}
                  />
                </Stack>
              </>
                )}

              </>
            )}

            {isLateOnSite && (
              <TimePicker
                label="Arrived at site"
                value={arrivedAtSiteTime}
                onChange={(newValue) => {
                  clearFieldError('arrivedAtSiteTime');
                  setArrivedAtSiteTime(newValue);
                }}
                open={arrivedTimePickerOpen}
                onOpen={() => setArrivedTimePickerOpen(true)}
                onClose={() => setArrivedTimePickerOpen(false)}
                format="h:mm a"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!fieldErrors.arrivedAtSiteTime,
                    helperText: fieldErrors.arrivedAtSiteTime ?? 'Set what time the employee arrived at the site',
                    placeholder: 'Select time',
                    onClick: () => setArrivedTimePickerOpen(true),
                    InputProps: { readOnly: true },
                  },
                  actionBar: { actions: ['accept', 'cancel', 'clear'] },
                }}
              />
            )}

            <TextField
              label="Memo / Reason"
              value={memoReason}
              onChange={(e) => setMemoReason(e.target.value)}
              multiline
              rows={4}
              placeholder="Enter memo or reason..."
              helperText="Add any notes or details"
              fullWidth
            />

            {showScoreInStep3 && <ConductReportScorePolicyFields {...conductScorePolicyFieldProps} />}
          </Stack>
        </Card>
      )}

      {selectedCategory && !showJobSearch && !showDateDetailsAttachmentsStep && !isPayoutWithoutDayOff && !isVerbalWarningsWriteUp && (
        <Card sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Step 3
          </Typography>
          <Typography variant="body2" color="text.secondary">
            For &quot;{selectedCategory.label}&quot;, additional fields can be added here later.
          </Typography>
        </Card>
      )}

      {isPayoutWithoutDayOff && (
        <Card sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Step 3
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Request date, hours & notes
          </Typography>
          <Stack spacing={2.5}>
            <DateTimePicker
              label="Request date and time"
              value={payoutRequestDateTime}
              onChange={(newValue) => {
                clearFieldError('payoutRequestDateTime');
                setPayoutRequestDateTime(newValue);
              }}
              open={payoutRequestDateTimePickerOpen}
              onOpen={() => setPayoutRequestDateTimePickerOpen(true)}
              onClose={() => setPayoutRequestDateTimePickerOpen(false)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!fieldErrors.payoutRequestDateTime,
                  helperText: fieldErrors.payoutRequestDateTime ?? 'When was the payout request?',
                  onClick: () => setPayoutRequestDateTimePickerOpen(true),
                  InputProps: { readOnly: true },
                },
              }}
            />
            <TextField
              label="How many hours *"
              type="number"
              value={payoutHours}
              onChange={(e) => {
                setPayoutHours(e.target.value);
                clearFieldError('payoutHours');
              }}
              placeholder="0"
              helperText={fieldErrors.payoutHours ?? 'Number of hours'}
              fullWidth
              inputProps={{ min: 0, step: 0.5 }}
              error={!!fieldErrors.payoutHours}
            />
            <TextField
              label="Note / Memo"
              value={payoutNotes}
              onChange={(e) => setPayoutNotes(e.target.value)}
              multiline
              rows={4}
              placeholder="Add notes or memo..."
              helperText="Optional details"
              fullWidth
            />
          </Stack>
        </Card>
      )}

      {isVerbalWarningsWriteUp && (
        <Card sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Step 3
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Date, category, detail & attachments
          </Typography>
          <Stack spacing={2.5}>
            <DateTimePicker
              label="Date and time"
              value={verbalWarningsDateTime}
              onChange={(newValue) => {
                clearFieldError('verbalWarningsDateTime');
                setVerbalWarningsDateTime(newValue);
              }}
              open={verbalWarningsDateTimePickerOpen}
              onOpen={() => setVerbalWarningsDateTimePickerOpen(true)}
              onClose={() => setVerbalWarningsDateTimePickerOpen(false)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!fieldErrors.verbalWarningsDateTime,
                  helperText: fieldErrors.verbalWarningsDateTime ?? 'When did the write-up occur?',
                  onClick: () => setVerbalWarningsDateTimePickerOpen(true),
                  InputProps: { readOnly: true },
                },
              }}
            />
            <Autocomplete
              value={
                verbalWarningsCategory && verbalWarningsCategory !== '__add_new__'
                  ? writeUpCategoryOptions.find((c) => c.value === verbalWarningsCategory) ?? null
                  : null
              }
              onChange={(_, newValue: { value: string; label: string } | null) => {
                clearFieldError('verbalWarningsCategory');
                if (!newValue) {
                  setVerbalWarningsCategory('');
                  return;
                }
                if (newValue.value === '__add_new__') {
                  setAddWriteUpCategoryDialogOpen(true);
                  return;
                }
                setVerbalWarningsCategory(newValue.value);
              }}
              options={[...writeUpCategoryOptions, { value: '__add_new__', label: 'Add Category' }]}
              getOptionLabel={(option) => (typeof option === 'object' && option?.label) || ''}
              isOptionEqualToValue={(option, value) => option?.value === value?.value}
              renderOption={(props, option) => {
                const rest = { ...(props as any) };
                delete rest.key;
                if (option.value === '__add_new__') {
                  return (
                    <Box
                      component="li"
                      {...rest}
                      key="__add_new__"
                      sx={{ color: 'primary.main', fontWeight: 500 }}
                    >
                      <Iconify icon="mingcute:add-line" sx={{ mr: 1, fontSize: 16 }} />
                      {option.label}
                    </Box>
                  );
                }
                const isCustom = 'id' in option && option.id;
                return (
                  <Box
                    component="li"
                    {...rest}
                    key={option.value}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <span>{option.label}</span>
                    {isCustom && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditWriteUpCategory(option as { value: string; label: string; id?: string });
                        }}
                        sx={{ color: 'primary.main', ml: 'auto' }}
                      >
                        <Iconify icon="solar:pen-bold" width={18} />
                      </IconButton>
                    )}
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category *"
                  placeholder="Select category..."
                  error={!!fieldErrors.verbalWarningsCategory}
                  helperText={fieldErrors.verbalWarningsCategory}
                />
              )}
            />
            <TextField
              label="Detail *"
              value={verbalWarningsDetail}
              onChange={(e) => {
                setVerbalWarningsDetail(e.target.value);
                clearFieldError('verbalWarningsDetail');
              }}
              multiline
              rows={4}
              placeholder="Describe the incident or write-up..."
              helperText={fieldErrors.verbalWarningsDetail ?? 'Details or notes'}
              fullWidth
              error={!!fieldErrors.verbalWarningsDetail}
            />
            <ConductReportScorePolicyFields {...conductScorePolicyFieldProps} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Attachments
              </Typography>
              <Upload
                multiple
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
                  'application/pdf': ['.pdf'],
                }}
                value={verbalWarningsFiles}
                onDrop={(acceptedFiles) =>
                  setVerbalWarningsFiles((prev) => [...prev, ...acceptedFiles])
                }
                onRemove={(file) =>
                  setVerbalWarningsFiles((prev) => prev.filter((f) => f !== file))
                }
                onRemoveAll={() => setVerbalWarningsFiles([])}
                helperText="Images and PDF only (optional)"
              />
            </Box>
          </Stack>
        </Card>
      )}

      {/* Add Write-Up Category Dialog */}
      <Dialog
        open={addWriteUpCategoryDialogOpen}
        onClose={() => {
          setAddWriteUpCategoryDialogOpen(false);
          setNewWriteUpCategoryName('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Category name"
            value={newWriteUpCategoryName}
            onChange={(e) => setNewWriteUpCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddWriteUpCategory()}
            placeholder="e.g., Site Conduct, Uniform"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddWriteUpCategoryDialogOpen(false);
              setNewWriteUpCategoryName('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddWriteUpCategory}
            disabled={!newWriteUpCategoryName.trim() || createWriteUpCategoryMutation.isPending}
          >
            {createWriteUpCategoryMutation.isPending ? 'Adding…' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Write-Up Category Dialog */}
      <Dialog
        open={editWriteUpCategoryDialogOpen}
        onClose={() => {
          setEditWriteUpCategoryDialogOpen(false);
          setEditingWriteUpCategory(null);
          setEditWriteUpCategoryName('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Category name"
            value={editWriteUpCategoryName}
            onChange={(e) => setEditWriteUpCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditWriteUpCategory()}
            placeholder="e.g., Site Conduct, Uniform"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditWriteUpCategoryDialogOpen(false);
              setEditingWriteUpCategory(null);
              setEditWriteUpCategoryName('');
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveEditWriteUpCategory} disabled={!editWriteUpCategoryName.trim()}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {showDateDetailsAttachmentsStep && (
        <Card sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Step 3
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Date, details & attachments
          </Typography>
          <Stack spacing={2.5}>
            <DateTimePicker
              label="Date and time"
              value={unauthorizedDrivingDateTime}
              onChange={(newValue) => {
                clearFieldError('unauthorizedDrivingDateTime');
                setUnauthorizedDrivingDateTime(newValue);
              }}
              open={unauthorizedDrivingDateTimePickerOpen}
              onOpen={() => setUnauthorizedDrivingDateTimePickerOpen(true)}
              onClose={() => setUnauthorizedDrivingDateTimePickerOpen(false)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!fieldErrors.unauthorizedDrivingDateTime,
                  helperText: fieldErrors.unauthorizedDrivingDateTime ?? 'When did the incident occur?',
                  onClick: () => setUnauthorizedDrivingDateTimePickerOpen(true),
                  InputProps: { readOnly: true },
                },
              }}
            />
            <TextField
              label="Details *"
              value={unauthorizedDrivingNotes}
              onChange={(e) => {
                setUnauthorizedDrivingNotes(e.target.value);
                clearFieldError('unauthorizedDrivingNotes');
              }}
              multiline
              rows={6}
              placeholder="Describe the incident..."
              helperText={fieldErrors.unauthorizedDrivingNotes ?? 'Add any notes or details'}
              fullWidth
              error={!!fieldErrors.unauthorizedDrivingNotes}
            />
            <ConductReportScorePolicyFields {...conductScorePolicyFieldProps} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Attachments
              </Typography>
              <Upload
                multiple
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
                  'application/pdf': ['.pdf'],
                }}
                value={unauthorizedDrivingFiles}
                onDrop={(acceptedFiles) =>
                  setUnauthorizedDrivingFiles((prev) => [...prev, ...acceptedFiles])
                }
                onRemove={(file) =>
                  setUnauthorizedDrivingFiles((prev) => prev.filter((f) => f !== file))
                }
                onRemoveAll={() => setUnauthorizedDrivingFiles([])}
                helperText="Images and PDF only (optional)"
              />
            </Box>
          </Stack>
        </Card>
      )}

      {selectedEmployee && selectedCategory && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmitReport}
            disabled={isSubmitting}
            startIcon={!isSubmitting ? <Iconify icon="solar:check-circle-bold" /> : null}
          >
            {isSubmitting ? 'Submitting…' : 'Submit Report'}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
