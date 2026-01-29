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
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { fTime, fDateTime } from 'src/utils/format-time';

import axiosInstance, { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

dayjs.extend(utc);
dayjs.extend(timezone);

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  report: any;
};

const TELUS_EDITABLE_FIELDS = [
  'build_partner',
  'additional_build_partner',
  'region',
  'po_number',
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

export function TelusReportDetailDialog({ open, onClose, report }: Props) {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localJobs, setLocalJobs] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initialJobsRef = useRef<any[]>([]);

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

  // Sync local jobs when API data loads or refetches (skip while in edit mode to avoid overwriting edits)
  useEffect(() => {
    if (isEditMode) return;
    if (exportData?.jobs?.length) {
      setLocalJobs(exportData.jobs.map((j: any) => ({ ...j })));
    } else {
      setLocalJobs([]);
    }
  }, [exportData, isEditMode]);

  const jobs = localJobs.length > 0 ? localJobs : jobsFromApi;
  const isDraft = report?.status === 'draft';

  const handleJobFieldChange = useCallback(
    (jobId: string, field: string, value: any) => {
      setLocalJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, [field]: value } : j))
      );
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
    if (!report?.id || !isDraft) return;
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
      toast.success(`Saved ${changed.length} job${changed.length !== 1 ? 's' : ''}`);
      setIsEditMode(false);
    } catch (err: any) {
      console.error('Failed to save report jobs:', err);
      toast.error(err?.error || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [report?.id, isDraft, localJobs, queryClient]);

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

  // Helper function to get value or empty string
  const getValue = useCallback((value: any) => value || '', []);

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

  const formatReportPeriod = () => {
    // Parse dates as UTC to prevent timezone conversion (dates are stored as YYYY-MM-DD)
    const start = dayjs.utc(report?.report_start_date).format('MMM D, YYYY');
    const end = dayjs.utc(report?.report_end_date).format('MMM D, YYYY');
    return start === end ? start : `${start} - ${end}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'info';
      case 'reviewed':
        return 'primary';
      case 'sent':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">TELUS Report #{report?.display_id}</Typography>
          <IconButton onClick={onClose} size="small">
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          {/* Report Summary */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.neutral',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Report Summary
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                  Report Type:
                </Typography>
                <Label color={report?.report_type === 'daily' ? 'primary' : 'secondary'}>
                  {report?.report_type === 'daily' ? 'Daily' : 'Weekly'}
                </Label>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                  Period:
                </Typography>
                <Typography variant="body2" fontWeight="600">
                  {formatReportPeriod()}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                  Total Jobs:
                </Typography>
                <Typography variant="body2" fontWeight="600">
                  {report?.job_count}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                  Status:
                </Typography>
                <Label color={getStatusColor(report?.status || '')}>
                  {report?.status?.charAt(0).toUpperCase() + report?.status?.slice(1)}
                </Label>
              </Stack>
              {report?.recipient_email && (
                <Stack direction="row" spacing={2}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                    Recipient Email:
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {report.recipient_email}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Created By / Reviewed By / Sent By */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            {report?.created_by_user && (
              <Box sx={{ flex: 1, p: 2, borderRadius: 1, bgcolor: 'background.neutral' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Created By
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {report.created_by_user.photo_url && (
                    <Box
                      component="img"
                      src={report.created_by_user.photo_url}
                      alt={`${report.created_by_user.first_name} ${report.created_by_user.last_name}`}
                      sx={{ width: 32, height: 32, borderRadius: '50%' }}
                    />
                  )}
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      {report.created_by_user.first_name} {report.created_by_user.last_name}
                    </Typography>
                    {report.created_at && (
                      <Typography variant="caption" color="text.secondary">
                        {fDateTime(report.created_at)}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            )}
            {!report?.created_by_user && report?.created_at && (
              <Box sx={{ flex: 1, p: 2, borderRadius: 1, bgcolor: 'background.neutral' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Created By
                </Typography>
                <Typography variant="body2" fontWeight="500">
                  System
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fDateTime(report.created_at)}
                </Typography>
              </Box>
            )}
            {report?.reviewed_by_user && (
              <Box sx={{ flex: 1, p: 2, borderRadius: 1, bgcolor: 'background.neutral' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Reviewed By
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {report.reviewed_by_user.photo_url && (
                    <Box
                      component="img"
                      src={report.reviewed_by_user.photo_url}
                      alt={`${report.reviewed_by_user.first_name} ${report.reviewed_by_user.last_name}`}
                      sx={{ width: 32, height: 32, borderRadius: '50%' }}
                    />
                  )}
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      {report.reviewed_by_user.first_name} {report.reviewed_by_user.last_name}
                    </Typography>
                    {report.reviewed_at && (
                      <Typography variant="caption" color="text.secondary">
                        {fDateTime(report.reviewed_at)}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            )}
            {report?.sent_by_user && (
              <Box sx={{ flex: 1, p: 2, borderRadius: 1, bgcolor: 'background.neutral' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Sent By
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {report.sent_by_user.photo_url && (
                    <Box
                      component="img"
                      src={report.sent_by_user.photo_url}
                      alt={`${report.sent_by_user.first_name} ${report.sent_by_user.last_name}`}
                      sx={{ width: 32, height: 32, borderRadius: '50%' }}
                    />
                  )}
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      {report.sent_by_user.first_name} {report.sent_by_user.last_name}
                    </Typography>
                    {report.sent_at && (
                      <Typography variant="caption" color="text.secondary">
                        {fDateTime(report.sent_at)}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            )}
          </Stack>

          {/* Review Notes */}
          {report?.review_notes && (
            <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.neutral' }}>
              <Typography variant="subtitle2" gutterBottom>
                Review Notes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {report.review_notes}
              </Typography>
            </Box>
          )}

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
                        <TableCell align="center">Quantity of LCT</TableCell>
                        <TableCell align="center">Quantity of additional TCP</TableCell>
                        <TableCell align="center">Quantity of Highway Truck</TableCell>
                        <TableCell align="center">Quantity of Crash/Barrel Truck</TableCell>
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
                          {/* Build Partner - editable when draft + edit mode */}
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
                              <Select
                                size="small"
                                fullWidth
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
                            ) : (
                              formatRegion(job.region)
                            )}
                          </TableCell>
                          <TableCell sx={{ p: isDraft && isEditMode ? 0.5 : 1 }}>
                            {isDraft && isEditMode ? (
                              <TextField
                                size="small"
                                fullWidth
                                value={job.po_number ?? ''}
                                onChange={(e) =>
                                  handleJobFieldChange(job.id, 'po_number', e.target.value)
                                }
                                placeholder="Network or PMOR Code"
                                slotProps={{ input: { sx: { fontSize: '0.8125rem' } } }}
                              />
                            ) : (
                              getValue(job.po_number)
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
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
