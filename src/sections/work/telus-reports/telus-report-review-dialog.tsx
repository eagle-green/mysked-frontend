import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormHelperText from '@mui/material/FormHelperText';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { fTime } from 'src/utils/format-time';

import axiosInstance, { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

dayjs.extend(utc);
dayjs.extend(timezone);

// ----------------------------------------------------------------------
// Required fields validation (Region, Network or PMOR Code, Approver, Quantity of LCT, Quantity of additional TCP)
const telusReportJobRequiredSchema = z.object({
  region: z
    .string()
    .transform((s) => (s ?? '').trim())
    .pipe(z.string().min(1, 'Region is required')),
  network_number: z
    .string()
    .transform((s) => (s ?? '').trim())
    .pipe(z.string().min(1, 'Network or PMOR Code is required')),
  approver: z
    .string()
    .transform((s) => (s ?? '').trim())
    .pipe(z.string().min(1, 'Approver is required')),
  quantity_lct: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number({ required_error: 'Quantity of LCT is required' }).min(0, 'Quantity of LCT must be 0 or greater')
  ),
  quantity_tcp: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number({ required_error: 'Quantity of additional TCP is required' }).min(0, 'Quantity of additional TCP must be 0 or greater')
  ),
});

/** Per-job, per-field validation errors for inline display (jobId -> { fieldName -> message }) */
export type TelusReportFieldErrors = Record<string, Record<string, string>>;

function validateJobsRequiredFieldsPerField(jobs: any[]): {
  valid: boolean;
  fieldErrors: TelusReportFieldErrors;
} {
  const fieldErrors: TelusReportFieldErrors = {};
  jobs.forEach((job) => {
    const result = telusReportJobRequiredSchema.safeParse({
      region: job.region ?? '',
      network_number: job.network_number ?? '',
      approver: job.approver ?? '',
      quantity_lct: job.quantity_lct,
      quantity_tcp: job.quantity_tcp,
    });
    if (!result.success) {
      const jobErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        const path = e.path[0];
        if (typeof path === 'string' && e.message) {
          jobErrors[path] = e.message;
        }
      });
      if (Object.keys(jobErrors).length > 0) {
        fieldErrors[job.id] = jobErrors;
      }
    }
  });
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

// ----------------------------------------------------------------------

const TELUS_EDITABLE_FIELDS = [
  'build_partner',
  'additional_build_partner',
  'region',
  'po_number',
  'network_number',
  'approver',
  'coid_fas_feeder',
  'quantity_lct',
  'quantity_tcp',
  'quantity_highway_truck',
  'quantity_crash_barrel_truck',
  'afad',
] as const;

function jobEditablePayload(job: any) {
  const payload: Record<string, any> = { id: job.id };
  TELUS_EDITABLE_FIELDS.forEach((key) => {
    payload[key] = job[key] ?? '';
  });
  if (payload.quantity_lct === '') payload.quantity_lct = null;
  if (payload.quantity_tcp === '') payload.quantity_tcp = null;
  if (payload.quantity_highway_truck === '') payload.quantity_highway_truck = null;
  if (payload.quantity_crash_barrel_truck === '') payload.quantity_crash_barrel_truck = null;
  return payload;
}

function jobsEqual(a: any, b: any) {
  return TELUS_EDITABLE_FIELDS.every((key) => {
    const va = a[key];
    const vb = b[key];
    if (va === vb) return true;
    if (va == null && vb == null) return true;
    if (Number.isFinite(va) && Number.isFinite(vb)) return va === vb;
    return String(va ?? '') === String(vb ?? '');
  });
}

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  report: any;
};

export function TelusReportReviewDialog({ open, onClose, report }: Props) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localJobs, setLocalJobs] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<TelusReportFieldErrors>({});
  const initialJobsRef = useRef<any[]>([]);
  const queryClient = useQueryClient();

  // Fetch jobs data for preview
  const { data: exportData, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['telus-report-export', report?.id],
    queryFn: async () => {
      if (!report?.id) return null;
      return fetcher(`${endpoints.work.telusReports.export(report.id)}?format=json`);
    },
    enabled: open && !!report?.id,
  });

  const jobsFromApi = exportData?.jobs || [];

  useEffect(() => {
    if (isEditMode) return;
    if (exportData?.jobs?.length) {
      setLocalJobs(exportData.jobs.map((j: any) => ({ ...j })));
    } else {
      setLocalJobs([]);
    }
  }, [exportData, isEditMode]);

  const jobs = localJobs.length > 0 ? localJobs : jobsFromApi;

  const handleClose = useCallback(() => {
    if (!isReviewing) {
      setShowPreview(false);
      setIsEditMode(false);
      setFieldErrors({});
      onClose();
    }
  }, [isReviewing, onClose]);

  const handleJobFieldChange = useCallback(
    (jobId: string, field: string, value: any) => {
      setLocalJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, [field]: value } : j))
      );
      setFieldErrors((prev) => {
        const jobErrs = prev[jobId];
        if (!jobErrs?.[field]) return prev;
        const restJob = Object.fromEntries(
          Object.entries(jobErrs).filter(([k]) => k !== field)
        ) as Record<string, string>;
        if (Object.keys(restJob).length === 0) {
          return Object.fromEntries(
            Object.entries(prev).filter(([k]) => k !== jobId)
          ) as TelusReportFieldErrors;
        }
        return { ...prev, [jobId]: restJob };
      });
    },
    []
  );

  const handleStartEdit = useCallback(() => {
    initialJobsRef.current = localJobs.map((j: any) => ({ ...j }));
    setIsEditMode(true);
  }, [localJobs]);

  const handleCancelEdit = useCallback(() => {
    setLocalJobs(initialJobsRef.current.map((j: any) => ({ ...j })));
    setIsEditMode(false);
  }, []);

  const handleSaveJobs = useCallback(async () => {
    if (!report?.id || report?.status !== 'draft') return;
    // Validate required fields (Region, Network or PMOR Code, Approver, Quantity of LCT, Quantity of additional TCP)
    const validation = validateJobsRequiredFieldsPerField(localJobs);
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors);
      return; // Block save and show inline errors
    }
    setFieldErrors({});
    const initial = initialJobsRef.current;
    const changed = localJobs.filter((j) => {
      const orig = initial.find((o: any) => o.id === j.id);
      return orig && !jobsEqual(orig, j);
    });
    if (changed.length === 0) {
      setIsEditMode(false);
      return;
    }
    setIsSaving(true);
    try {
      await fetcher([
        endpoints.work.telusReports.updateJobs(report.id),
        { method: 'PUT', data: { jobs: changed.map(jobEditablePayload) } },
      ]);
      await queryClient.invalidateQueries({ queryKey: ['telus-report-export', report.id] });
      await queryClient.invalidateQueries({ queryKey: ['telus-reports'] });
      toast.success(`Saved ${changed.length} job${changed.length !== 1 ? 's' : ''}`);
      setIsEditMode(false);
    } catch (err: any) {
      console.error('Failed to save report jobs:', err);
      toast.error(err?.error || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [report?.id, report?.status, localJobs, queryClient]);

  const handleReview = useCallback(
    async () => {
      const validation = validateJobsRequiredFieldsPerField(jobs);
      if (!validation.valid) {
        setFieldErrors(validation.fieldErrors);
        setIsEditMode(true);
        setShowPreview(true);
        return;
      }
      setFieldErrors({});
      setIsReviewing(true);
      const toastId = toast.loading('Confirming report...');

      try {
        await fetcher([
          endpoints.work.telusReports.review(report.id),
          {
            method: 'PUT',
            data: {
              review_notes: '',
              is_confirmed: true,
            },
          },
        ]);

        toast.dismiss(toastId);
        toast.success('Report confirmed successfully! Ready to send.');
        
        queryClient.invalidateQueries({ queryKey: ['telus-reports'] });
        handleClose();
      } catch (error: any) {
        toast.dismiss(toastId);
        console.error('Review error:', error);
        toast.error(error?.error || 'Failed to review report');
      } finally {
        setIsReviewing(false);
      }
    },
    [report, jobs, queryClient, handleClose]
  );

  const getFieldError = useCallback(
    (jobId: string, field: string) => fieldErrors[jobId]?.[field] ?? '',
    [fieldErrors]
  );

  const handleDownloadExcel = useCallback(async () => {
    if (!report?.id) return;

    setIsDownloading(true);
    try {
      const response = await axiosInstance.get(
        `${endpoints.work.telusReports.export(report.id)}?format=excel`,
        {
          responseType: 'blob',
        }
      );

      // Generate filename
      const startDateStr = dayjs(report.report_start_date).format('YYYY-MM-DD');
      const endDateStr = dayjs(report.report_end_date).format('YYYY-MM-DD');
      const filename = report.report_type === 'daily'
        ? `telus-daily-report-${startDateStr}.xlsx`
        : `telus-weekly-report-${startDateStr}-${endDateStr}.xlsx`;

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Excel file downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error?.error || 'Failed to download Excel file');
    } finally {
      setIsDownloading(false);
    }
  }, [report]);

  // Helper: empty for 0, '0', null, undefined, '-', '.', 'NA', 'N/A' etc. (display nothing)
  const getValue = useCallback((value: any) => {
    if (value === 0 || value === null || value === undefined) return '';
    if (typeof value === 'string') {
      const t = value.trim();
      if (t === '0' || ['-', '.', 'NA', 'na', 'N/A', 'n/a'].includes(t)) return '';
    }
    return value;
  }, []);

  // Helper function to format date as "August 15th, 2025"
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return '';
    const date = dayjs(dateString).tz('America/Los_Angeles');
    const day = date.date();
    const suffix =
      day === 1 || day === 21 || day === 31
        ? 'st'
        : day === 2 || day === 22
          ? 'nd'
          : day === 3 || day === 23
            ? 'rd'
            : 'th';
    return `${date.format('MMMM')} ${day}${suffix}, ${date.format('YYYY')}`;
  }, []);

  // Helper function to format cancelled date as "August 11, 2025"
  const formatCancelledDate = useCallback((dateString: string | null) => {
    if (!dateString) return '';
    return dayjs(dateString).tz('America/Los_Angeles').format('MMMM D, YYYY');
  }, []);

  // Helper function to format phone number (matches Excel format)
  const formatPhoneNumber = useCallback((phoneNumber: string | null | undefined) => {
    if (!phoneNumber) return '';
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      const withoutCountryCode = digits.slice(1);
      return `${withoutCountryCode.slice(0, 3)}-${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
    } else if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phoneNumber;
  }, []);

  // Helper function to format address
  const formatAddress = useCallback((job: any) => {
    const addressParts = [];
    if (job.site_unit_number) addressParts.push(job.site_unit_number);
    if (job.site_street_number) addressParts.push(job.site_street_number);
    if (job.site_street_name) addressParts.push(job.site_street_name);
    return addressParts.join(' ').trim() || '';
  }, []);

  // Helper function to format region
  const formatRegion = useCallback((region: string | null | undefined) => {
    if (!region) return '';
    return region
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

  const isDraft = report?.status === 'draft';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Review TELUS Report{report?.display_id != null ? ` #${report.display_id}` : ''}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            {isDraft && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:pen-bold" />}
                onClick={handleStartEdit}
              >
                Edit
              </Button>
            )}
            <IconButton onClick={handleClose} size="small">
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.neutral',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Report Details
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Type: <strong>{report?.report_type === 'daily' ? 'Daily' : 'Weekly'}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Period: <strong>
                  {dayjs.utc(report?.report_start_date).format('MMM D, YYYY')} -{' '}
                  {dayjs.utc(report?.report_end_date).format('MMM D, YYYY')}
                </strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Jobs: <strong>{report?.job_count}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recipient: <strong>{report?.recipient_email}</strong>
              </Typography>
            </Stack>
          </Box>

          {/* Preview Section */}
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">Report Preview</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:download-bold" />}
                  onClick={handleDownloadExcel}
                  disabled={isDownloading || isLoadingJobs || jobs.length === 0}
                >
                  {isDownloading ? 'Downloading...' : 'Download Excel'}
                </Button>
                {isDraft && jobs.length > 0 && !isEditMode && (
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="solar:pen-bold" />}
                    onClick={handleStartEdit}
                  >
                    Edit
                  </Button>
                )}
                {isDraft && isEditMode && (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={isSaving ? <CircularProgress size={18} /> : <Iconify icon="solar:check-circle-bold" />}
                      onClick={handleSaveJobs}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                <IconButton
                  size="small"
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={isLoadingJobs || jobs.length === 0}
                >
                  <Iconify
                    icon={(showPreview ? 'eva:arrow-up-fill' : 'eva:arrow-down-fill') as any}
                  />
                </IconButton>
              </Stack>
            </Stack>

            {isLoadingJobs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : jobs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No jobs found in this report.
              </Typography>
            ) : (
              <Collapse in={showPreview}>
                <TableContainer
                  sx={{
                    maxHeight: 400,
                    overflow: 'auto',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date of Work</TableCell>
                        <TableCell>Company Invoiced</TableCell>
                        <TableCell>Build Partner</TableCell>
                        <TableCell>Additional Build Partner</TableCell>
                        <TableCell>Onsite Contact Name</TableCell>
                        <TableCell>Phone Number</TableCell>
                        <TableCell>Physical work location</TableCell>
                        <TableCell>City</TableCell>
                        <TableCell>Region</TableCell>
                        <TableCell>Network or PMOR Code</TableCell>
                        <TableCell>Approver</TableCell>
                        <TableCell>COID/FAS or Feeder</TableCell>
                        <TableCell>Quantity of LCT</TableCell>
                        <TableCell>Quantity of additional TCP</TableCell>
                        <TableCell>Quantity of Highway Truck</TableCell>
                        <TableCell>Quantity of Crash/Barrel Truck</TableCell>
                        <TableCell>AFAD&apos;s</TableCell>
                        <TableCell>Start Time</TableCell>
                        <TableCell>Request Cancelled</TableCell>
                        <TableCell>Date Cancelled</TableCell>
                        <TableCell>Time Cancelled</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {jobs.map((job: any) => (
                        <TableRow key={job.id} hover>
                          <TableCell>
                            {job.start_time ? formatDate(job.start_time) : ''}
                          </TableCell>
                          <TableCell>Telus</TableCell>
                          <TableCell sx={{ p: isDraft && isEditMode ? 0.5 : 1 }}>
                            {isDraft && isEditMode ? (
                              <TextField
                                size="small"
                                fullWidth
                                value={job.build_partner ?? ''}
                                onChange={(e) =>
                                  handleJobFieldChange(job.id, 'build_partner', e.target.value)
                                }
                                placeholder="Build Partner"
                                slotProps={{ input: { sx: { fontSize: '0.8125rem' } } }}
                              />
                            ) : (
                              getValue(job.build_partner)
                            )}
                          </TableCell>
                          <TableCell sx={{ p: isDraft && isEditMode ? 0.5 : 1 }}>
                            {isDraft && isEditMode ? (
                              <TextField
                                size="small"
                                fullWidth
                                value={job.additional_build_partner ?? ''}
                                onChange={(e) =>
                                  handleJobFieldChange(
                                    job.id,
                                    'additional_build_partner',
                                    e.target.value
                                  )
                                }
                                placeholder="Additional Build Partner"
                                slotProps={{ input: { sx: { fontSize: '0.8125rem' } } }}
                              />
                            ) : (
                              getValue(job.additional_build_partner)
                            )}
                          </TableCell>
                          <TableCell>{getValue(job.client_name)}</TableCell>
                          <TableCell>{formatPhoneNumber(job.client_contact_number)}</TableCell>
                          <TableCell>{formatAddress(job)}</TableCell>
                          <TableCell>{getValue(job.site_city)}</TableCell>
                          <TableCell sx={{ p: isDraft && isEditMode ? 0.5 : 1 }}>
                            {isDraft && isEditMode ? (
                              <FormControl
                                fullWidth
                                size="small"
                                error={!!getFieldError(job.id, 'region')}
                              >
                                <Select
                                  value={job.region ?? ''}
                                  onChange={(e) =>
                                    handleJobFieldChange(job.id, 'region', e.target.value)
                                  }
                                  displayEmpty
                                  sx={{ fontSize: '0.8125rem', minWidth: 120 }}
                                >
                                  <MenuItem value="">
                                    <em>Select region</em>
                                  </MenuItem>
                                  <MenuItem value="lower_mainland">Lower Mainland</MenuItem>
                                  <MenuItem value="island">Island</MenuItem>
                                </Select>
                                {getFieldError(job.id, 'region') && (
                                  <FormHelperText>{getFieldError(job.id, 'region')}</FormHelperText>
                                )}
                              </FormControl>
                            ) : (
                              formatRegion(job.region)
                            )}
                          </TableCell>
                          <TableCell sx={{ p: isDraft && isEditMode ? 0.5 : 1 }}>
                            {isDraft && isEditMode ? (
                              <TextField
                                size="small"
                                fullWidth
                                value={job.network_number ?? ''}
                                onChange={(e) =>
                                  handleJobFieldChange(job.id, 'network_number', e.target.value)
                                }
                                placeholder="Network or PMOR Code"
                                error={!!getFieldError(job.id, 'network_number')}
                                helperText={getFieldError(job.id, 'network_number')}
                                slotProps={{ input: { sx: { fontSize: '0.8125rem' } } }}
                              />
                            ) : (
                              getValue(job.network_number)
                            )}
                          </TableCell>
                          <TableCell
                            sx={{
                              p: isDraft && isEditMode ? 0.5 : 1,
                              ...(isDraft && isEditMode && { minWidth: 180 }),
                            }}
                          >
                            {isDraft && isEditMode ? (
                              <TextField
                                size="small"
                                fullWidth
                                value={job.approver ?? ''}
                                onChange={(e) =>
                                  handleJobFieldChange(job.id, 'approver', e.target.value)
                                }
                                placeholder="Approver"
                                error={!!getFieldError(job.id, 'approver')}
                                helperText={getFieldError(job.id, 'approver')}
                                slotProps={{
                                  input: {
                                    sx: { fontSize: '0.8125rem', minWidth: 160 },
                                  },
                                }}
                              />
                            ) : (
                              getValue(job.approver)
                            )}
                          </TableCell>
                          <TableCell sx={{ p: isDraft && isEditMode ? 0.5 : 1 }}>
                            {isDraft && isEditMode ? (
                              <TextField
                                size="small"
                                fullWidth
                                value={job.coid_fas_feeder ?? ''}
                                onChange={(e) =>
                                  handleJobFieldChange(job.id, 'coid_fas_feeder', e.target.value)
                                }
                                placeholder="COID/FAS or Feeder"
                                slotProps={{ input: { sx: { fontSize: '0.8125rem' } } }}
                              />
                            ) : (
                              getValue(job.coid_fas_feeder)
                            )}
                          </TableCell>
                          <TableCell sx={{ p: isDraft && isEditMode ? 0.5 : 1, textAlign: 'center' }}>
                            {isDraft && isEditMode ? (
                              <TextField
                                size="small"
                                fullWidth
                                type="number"
                                value={job.quantity_lct ?? ''}
                                onChange={(e) =>
                                  handleJobFieldChange(
                                    job.id,
                                    'quantity_lct',
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )
                                }
                                error={!!getFieldError(job.id, 'quantity_lct')}
                                helperText={getFieldError(job.id, 'quantity_lct')}
                                slotProps={{ input: { sx: { fontSize: '0.8125rem', textAlign: 'center' } } }}
                              />
                            ) : (
                              getValue(job.quantity_lct)
                            )}
                          </TableCell>
                          <TableCell sx={{ p: isDraft && isEditMode ? 0.5 : 1, textAlign: 'center' }}>
                            {isDraft && isEditMode ? (
                              <TextField
                                size="small"
                                fullWidth
                                type="number"
                                value={job.quantity_tcp ?? ''}
                                onChange={(e) =>
                                  handleJobFieldChange(
                                    job.id,
                                    'quantity_tcp',
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )
                                }
                                error={!!getFieldError(job.id, 'quantity_tcp')}
                                helperText={getFieldError(job.id, 'quantity_tcp')}
                                slotProps={{ input: { sx: { fontSize: '0.8125rem', textAlign: 'center' } } }}
                              />
                            ) : (
                              getValue(job.quantity_tcp)
                            )}
                          </TableCell>
                          <TableCell sx={{ p: isDraft && isEditMode ? 0.5 : 1, textAlign: 'center' }}>
                            {isDraft && isEditMode ? (
                              <TextField
                                size="small"
                                fullWidth
                                type="number"
                                value={job.quantity_highway_truck ?? ''}
                                onChange={(e) =>
                                  handleJobFieldChange(
                                    job.id,
                                    'quantity_highway_truck',
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )
                                }
                                slotProps={{ input: { sx: { fontSize: '0.8125rem', textAlign: 'center' } } }}
                              />
                            ) : (
                              getValue(job.quantity_highway_truck)
                            )}
                          </TableCell>
                          <TableCell sx={{ p: isDraft && isEditMode ? 0.5 : 1, textAlign: 'center' }}>
                            {isDraft && isEditMode ? (
                              <TextField
                                size="small"
                                fullWidth
                                type="number"
                                value={job.quantity_crash_barrel_truck ?? ''}
                                onChange={(e) =>
                                  handleJobFieldChange(
                                    job.id,
                                    'quantity_crash_barrel_truck',
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )
                                }
                                slotProps={{ input: { sx: { fontSize: '0.8125rem', textAlign: 'center' } } }}
                              />
                            ) : (
                              getValue(job.quantity_crash_barrel_truck)
                            )}
                          </TableCell>
                          <TableCell
                            sx={{
                              p: isDraft && isEditMode ? 0.5 : 1,
                              ...(isDraft && isEditMode && { minWidth: 180 }),
                            }}
                          >
                            {isDraft && isEditMode ? (
                              <TextField
                                size="small"
                                fullWidth
                                value={job.afad ?? ''}
                                onChange={(e) =>
                                  handleJobFieldChange(job.id, 'afad', e.target.value)
                                }
                                placeholder="AFAD"
                                slotProps={{
                                  input: {
                                    sx: { fontSize: '0.8125rem', minWidth: 160 },
                                  },
                                }}
                              />
                            ) : (
                              getValue(job.afad)
                            )}
                          </TableCell>
                          <TableCell>
                            {job.start_time ? fTime(job.start_time) : ''}
                          </TableCell>
                          <TableCell>
                            {job.status === 'cancelled' ? 'Yes' : ''}
                          </TableCell>
                          <TableCell>
                            {job.status === 'cancelled' && job.cancelled_at
                              ? formatCancelledDate(job.cancelled_at)
                              : ''}
                          </TableCell>
                          <TableCell>
                            {job.status === 'cancelled' && job.cancelled_at
                              ? fTime(job.cancelled_at)
                              : ''}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, mb: 2, display: 'block' }}>
                  Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}
                  {isDraft && jobs.length > 0 && !isEditMode && (
                    <> · Click Edit to modify Build Partner, Region, and other fields</>
                  )}
                  {isDraft && isEditMode && (
                    <> · Edit the rows above, then click Save</>
                  )}
                </Typography>
              </Collapse>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'info.lighter',
              border: (theme) => `1px solid ${theme.palette.info.light}`,
            }}
          >
            <Typography variant="body2" color="info.darker">
              <strong>Review Instructions:</strong>
              <br />
              • Preview the report data above or download the Excel file
              <br />
              • Verify the report period and job count
              <br />
              • Check the recipient email address
              <br />
              • <strong>Required for every job:</strong> Region, Network or PMOR Code, Approver, Quantity of LCT, Quantity of additional TCP (fill missing values in Edit view before saving or confirming)
              <br />
              • Click &quot;Confirm &amp; Mark Reviewed&quot; to mark the report as ready to send
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={isReviewing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleReview}
          disabled={isReviewing}
          startIcon={isReviewing ? <CircularProgress size={20} /> : null}
        >
          {isReviewing ? 'Confirming...' : 'Confirm & Mark Reviewed'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
