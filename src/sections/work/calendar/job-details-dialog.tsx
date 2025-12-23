import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useNavigate } from 'react-router';
import timezone from 'dayjs/plugin/timezone';
import { useQuery } from '@tanstack/react-query';
import { useBoolean } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fDate, fTime } from 'src/utils/format-time';
import { getPositionColor, getWorkerStatusColor } from 'src/utils/format-role';

import { provinceList } from 'src/assets/data';
import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { JobNotifyDialog } from 'src/sections/work/job/job-notify-dialog';

import { useAuthContext } from 'src/auth/hooks';

dayjs.extend(utc);
dayjs.extend(timezone);

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  jobId: string;
};

// ----------------------------------------------------------------------

// Helper function to get full address
const getFullAddress = (site: any) => {
  if (!site) return '';

  // Use display_address from backend if available
  if (site.display_address) return site.display_address;

  // Fallback: Build the address string from fields
  let addr = [
    site.unit_number,
    site.street_number,
    site.street_name,
    site.city,
    site.province,
    site.postal_code,
  ]
    .filter(Boolean)
    .join(', ');

  provinceList.forEach(({ value, code }) => {
    addr = addr.replace(value, code);
  });

  return addr;
};

// Helper function to check if address is complete enough for Google Maps
const hasCompleteAddress = (site: any) => !!(site?.street_name && site?.city && site?.province);

// Helper function to format vehicle type
const formatVehicleType = (type: string) => {
  const option = VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

// Helper function to format phone number
const formatPhoneNumber = (phoneNumber: string) => {
  if (!phoneNumber) return '';

  // Remove country code and any non-digit characters
  const cleaned = phoneNumber.replace(/^\+1/, '').replace(/\D/g, '');

  // Format as XXX XXX XXXX
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  // Return original if not 10 digits
  return phoneNumber.replace(/^\+1/, '');
};

export function JobDetailsDialog({ open, onClose, jobId }: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const resendDialog = useBoolean();

  // Fetch detailed job information
  const {
    data: job,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['job-details-dialog', jobId, refreshKey], // Include refreshKey to force fresh data
    queryFn: async () => {
      const response = await fetcher(`${endpoints.work.job}/${jobId}`);
      return response.data.job;
    },
    enabled: !!jobId && open, // Only fetch when dialog is open
    staleTime: 0, // Always refetch when dialog opens to get latest data
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Fetch job history
  const {
    data: historyData,
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ['job-history', jobId, refreshKey], // Include refreshKey to force fresh data
    queryFn: async () => {
      const response = await fetcher(`${endpoints.work.job}/${jobId}/history`);
      return response.data.history || [];
    },
    enabled: !!jobId && open, // Only fetch when dialog is open
    staleTime: 0, // Always refetch when dialog opens to get latest data
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const handleClose = useCallback(() => {
    setIsClosing(true);
    onClose();
  }, [onClose]);

  // Reset closing state and refresh data when dialog opens
  useEffect(() => {
    if (open && jobId) {
      setIsClosing(false);
      // Increment refresh key to force fresh data fetch
      setRefreshKey((prev) => prev + 1);
    }
  }, [open, jobId]);

  const handleEdit = useCallback(() => {
    // Navigate to edit page
    navigate(paths.work.job.edit(jobId));
  }, [jobId, navigate]);

  const renderJobDetails = () => {
    if (isLoading) {
      return (
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={80} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={60} />
        </Box>
      );
    }

    if (queryError) {
      return (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          Error loading job details. Please try again.
        </Typography>
      );
    }

    if (!job && !isClosing) {
      return (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          Job details not found.
        </Typography>
      );
    }

    // Don't render anything if we're closing and don't have data
    if (isClosing && !job) {
      return null;
    }

    // Format address
    const siteAddress = getFullAddress(job.site);
    const hasCompleteAddr = hasCompleteAddress(job.site);
    const googleMapsUrl = hasCompleteAddr
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteAddress)}`
      : null;

    return (
      <Box sx={{ mt: 2 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            spacing={{ xs: 1, sm: 2 }} 
            sx={{ mb: 3 }}
          >
            <Typography variant="h6">Job #{job.job_number}</Typography>
            {job.po_number && (
              <Label variant="soft" color="primary">
                PO: {job.po_number}
              </Label>
            )}
          </Stack>

          <Stack spacing={2}>
            {/* Client & Site Info */}
            <Stack
              spacing={1.5}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 1.5, md: 3 },
              }}
            >
              <Box sx={{ flex: { xs: 'none', md: 1 } }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Customer
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Avatar
                    src={job.company?.logo_url ?? undefined}
                    alt={job.company?.name}
                    sx={{
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                    }}
                  >
                    {job.company?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
                    {job.company?.name}
                  </Typography>
                </Box>
                {/* Show contact number only to timesheet manager */}
                {(job.company?.phoneNumber || job.company?.contact_number) && job.timesheet_manager_id === user?.id && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <Iconify icon="solar:phone-bold" width={16} />
                    <Link
                      href={`tel:${job.company?.phoneNumber || job.company?.contact_number}`}
                      variant="body2"
                      color="primary"
                      sx={{ textDecoration: 'none' }}
                    >
                      {formatPhoneNumber(job.company?.phoneNumber || job.company?.contact_number)}
                    </Link>
                  </Box>
                )}
              </Box>

              <Box sx={{ flex: { xs: 'none', md: 1 } }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Client
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Avatar
                    src={job.client?.logo_url ?? undefined}
                    alt={job.client?.name}
                    sx={{
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                    }}
                  >
                    {job.client?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
                    {job.client?.name}
                  </Typography>
                </Box>
                {/* Show contact number only to timesheet manager */}
                {(job.client?.phoneNumber || job.client?.contact_number) && job.timesheet_manager_id === user?.id && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <Iconify icon="solar:phone-bold" width={16} />
                    <Link
                      href={`tel:${job.client?.phoneNumber || job.client?.contact_number}`}
                      variant="body2"
                      color="primary"
                      sx={{ textDecoration: 'none' }}
                    >
                      {formatPhoneNumber(job.client?.phoneNumber || job.client?.contact_number)}
                    </Link>
                  </Box>
                )}
              </Box>

              <Box sx={{ flex: { xs: 'none', md: 1 } }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Site
                </Typography>
                <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
                  {job.site?.name}
                </Typography>
                {siteAddress && (
                  <Box sx={{ mt: 0.5 }}>
                    {googleMapsUrl ? (
                      <Link
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="body1"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Iconify icon="custom:location-fill" width={18} />
                        {siteAddress}
                      </Link>
                    ) : (
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Iconify icon="custom:location-fill" width={18} />
                        {siteAddress}
                      </Typography>
                    )}
                  </Box>
                )}
                {job.site?.phoneNumber && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Iconify icon="solar:phone-bold" width={18} />
                    <Link
                      href={`tel:${job.site.phoneNumber}`}
                      variant="body1"
                      color="primary"
                      sx={{ textDecoration: 'none' }}
                    >
                      {formatPhoneNumber(job.site.phoneNumber)}
                    </Link>
                  </Box>
                )}
              </Box>
            </Stack>

            <Divider />

            {/* Schedule */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Job Date
              </Typography>

              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {job.start_time ? fDate(job.start_time) : ''}
              </Typography>
            </Box>

            {/* Workers */}
            {job.workers && job.workers.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Workers ({job.workers.length})
                  </Typography>

                  <Stack spacing={1}>
                    {job.workers.map((worker: any, index: number) => {
                      const positionLabel =
                        JOB_POSITION_OPTIONS.find((option) => option.value === worker.position)
                          ?.label ||
                        worker.position ||
                        'Unknown Position';

                      return (
                        <Box
                          key={worker.id || index}
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            gap: 1,
                            p: { xs: 1.5, md: 1 },
                            border: { xs: '1px solid', md: 'none' },
                            borderColor: { xs: 'divider', md: 'transparent' },
                            borderRadius: 1,
                            bgcolor: { xs: 'background.neutral', md: 'transparent' },
                            alignItems: { xs: 'flex-start', md: 'center' },
                          }}
                        >
                          {/* Timesheet Manager Label (Mobile Only) */}
                          {worker.id === job?.timesheet_manager_id && (
                            <Chip
                              label="Timesheet Manager"
                              size="small"
                              color="info"
                              variant="soft"
                              sx={{ 
                                display: { xs: 'inline-flex', md: 'none' },
                                height: 18,
                                fontSize: '0.625rem',
                                alignSelf: 'flex-start',
                              }}
                            />
                          )}

                          {/* Position and Worker Info */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              minWidth: 0,
                              flexWrap: 'wrap',
                              flex: { md: 1 },
                            }}
                          >
                            <Chip
                              label={positionLabel}
                              size="small"
                              variant="soft"
                              color={getPositionColor(worker.position)}
                              sx={{ minWidth: 60, flexShrink: 0 }}
                            />
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <Avatar
                                src={worker?.photo_url ?? undefined}
                                alt={worker?.first_name}
                                sx={{
                                  width: { xs: 28, md: 32 },
                                  height: { xs: 28, md: 32 },
                                  flexShrink: 0,
                                }}
                              >
                                {worker?.first_name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    minWidth: 0,
                                  }}
                                >
                                  {worker.first_name} {worker.last_name}
                                </Typography>
                                {/* Timesheet Manager Label (Desktop Only) */}
                                {worker.id === job?.timesheet_manager_id && (
                                  <Chip
                                    label="Timesheet Manager"
                                    size="small"
                                    color="info"
                                    variant="soft"
                                    sx={{ 
                                      display: { xs: 'none', md: 'inline-flex' },
                                      height: 18,
                                      fontSize: '0.625rem',
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </Box>

                          {/* Contact and Time Info */}
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              gap: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            {worker.phone_number && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <Iconify icon="solar:phone-bold" width={16} />
                                <Link
                                  href={`tel:${worker.phone_number}`}
                                  variant="body2"
                                  color="primary"
                                  sx={{ textDecoration: 'none' }}
                                >
                                  {formatPhoneNumber(worker.phone_number)}
                                </Link>
                              </Box>
                            )}

                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                flexWrap: 'wrap',
                              }}
                            >
                              <Iconify icon="solar:clock-circle-bold" width={16} />
                              <Typography variant="body2">
                                {worker.start_time ? fTime(worker.start_time) : ''} -{' '}
                                {worker.end_time ? fTime(worker.end_time) : ''}
                              </Typography>
                              {worker.status && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Label
                                    variant="soft"
                                    color={
                                      (worker.status === 'accepted' && 'success') ||
                                      (worker.status === 'rejected' && 'error') ||
                                      (worker.status === 'pending' && 'warning') ||
                                      'default'
                                    }
                                    sx={{ fontSize: '0.75rem' }}
                                  >
                                    {worker.status}
                                  </Label>
                                  {worker.status === 'rejected' && job.status !== 'cancelled' && (
                                    <Button
                                      variant="contained"
                                      color="warning"
                                      size="small"
                                      onClick={() => {
                                        setSelectedWorkerId(worker.id);
                                        resendDialog.onTrue();
                                      }}
                                      startIcon={<Iconify icon={"solar:refresh-bold" as any} />}
                                      sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.8rem' }}
                                    >
                                      Resend
                                    </Button>
                                  )}
                                </Stack>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              </>
            )}

            {/* Vehicles */}
            {job.vehicles && job.vehicles.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Vehicles ({job.vehicles.length})
                  </Typography>

                  <Stack spacing={1.5}>
                    {job.vehicles.map((vehicle: any, index: number) => (
                      <Box
                        key={vehicle.id || index}
                        sx={{
                          // Responsive layout
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'stretch', sm: 'center' },
                          justifyContent: { xs: 'flex-start', sm: 'space-between' },
                          gap: { xs: 1, sm: 2 },
                          p: { xs: 1.5, md: 0 },
                          border: { xs: '1px solid', md: 'none' },
                          borderColor: { xs: 'divider', md: 'transparent' },
                          borderRadius: 1,
                          // '&:hover': {
                          //   bgcolor: 'background.neutral',
                          // },
                        }}
                      >
                        {/* Vehicle Info */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            minWidth: 0,
                            flex: { xs: 'none', sm: 1 },
                            mb: { xs: vehicle.operator ? 1 : 0, sm: 0 },
                          }}
                        >
                          <Chip
                            label={formatVehicleType(vehicle.type)}
                            size="medium"
                            variant="outlined"
                            sx={{ minWidth: 80, flexShrink: 0 }}
                          />
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 500,
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            {vehicle.license_plate} - {vehicle.unit_number}
                          </Typography>
                        </Box>

                        {/* Operator Info */}
                        {vehicle.operator && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              flexShrink: 0,
                              ml: { xs: 1, sm: 0 },
                            }}
                          >
                            <Avatar
                              src={vehicle.operator?.photo_url ?? undefined}
                              alt={vehicle.operator?.first_name}
                              sx={{
                                width: { xs: 28, sm: 32 },
                                height: { xs: 28, sm: 32 },
                                flexShrink: 0,
                              }}
                            >
                              {vehicle.operator?.first_name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 500,
                              }}
                            >
                              {vehicle.operator.first_name} {vehicle.operator.last_name}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </>
            )}

            {/* Equipment */}
            {job.equipments && job.equipments.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Equipment ({job.equipments.length})
                  </Typography>

                  <Stack spacing={1}>
                    {job.equipments.map((equipment: any, index: number) => (
                      <Box
                        key={equipment.id || index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Chip
                          label={equipment.type
                            ?.replace(/_/g, ' ')
                            .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          size="medium"
                          variant="outlined"
                          sx={{ minWidth: 80 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: 'text.secondary' }}
                        >
                          QTY: {equipment.quantity || 1}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </>
            )}

            {/* Notes */}
            {(job.notes || job.note) && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {job.notes || job.note}
                  </Typography>
                </Box>
              </>
            )}

            {/* History */}
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                History
              </Typography>
              {historyLoading ? (
                <Stack spacing={1}>
                  <Skeleton variant="rectangular" height={60} />
                  <Skeleton variant="rectangular" height={60} />
                  <Skeleton variant="rectangular" height={60} />
                </Stack>
              ) : historyData && historyData.length > 0 ? (
                <Stack spacing={2}>
                  {historyData.map((entry: any) => {
                    // Parse worker info from metadata for worker_added/worker_removed/worker_accepted/worker_rejected/notification_resent/worker_time_changed/status_changed/timesheet_manager_changed
                    const workerInfo = entry.metadata && (
                      entry.action_type === 'worker_added' || 
                      entry.action_type === 'worker_removed' ||
                      entry.action_type === 'worker_accepted' ||
                      entry.action_type === 'worker_rejected' ||
                      entry.action_type === 'notification_resent' ||
                      entry.action_type === 'worker_time_changed' ||
                      (entry.action_type === 'status_changed' && entry.metadata?.reason === 'time_changed') ||
                      entry.action_type === 'timesheet_manager_changed'
                    )
                      ? entry.metadata
                      : null;
                    const positionLabel = workerInfo?.position
                      ? JOB_POSITION_OPTIONS.find((opt) => opt.value === workerInfo.position)?.label || workerInfo.position
                      : null;
                    
                    // Parse description to extract name and position for worker_accepted/worker_rejected
                    // Format: "Jason Jung (tcp) accepted the job" or "Jason Jung (tcp) rejected the job"
                    let parsedDescription = entry.description;
                    if ((entry.action_type === 'worker_accepted' || entry.action_type === 'worker_rejected') && entry.description) {
                      // Remove "Worker " prefix if it exists
                      parsedDescription = entry.description.replace(/^Worker\s+/i, '');
                    }

                    return (
                      <Box
                        key={entry.id}
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          bgcolor: 'background.neutral',
                          borderLeft: '3px solid',
                          borderColor:
                            entry.action_type === 'created'
                              ? 'success.main'
                              : entry.action_type === 'worker_added'
                              ? 'info.main'
                              : entry.action_type === 'worker_removed'
                              ? 'error.main'
                              : entry.action_type === 'worker_accepted'
                              ? 'success.main'
                              : entry.action_type === 'worker_rejected'
                              ? 'error.main'
                              : entry.action_type === 'notification_resent'
                              ? 'warning.main'
                              : entry.action_type === 'status_changed'
                              ? 'warning.main'
                              : entry.action_type === 'timesheet_manager_changed'
                              ? 'info.main'
                              : 'divider',
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {entry.changed_by?.photo_url ? (
                              <Avatar
                                src={entry.changed_by.photo_url}
                                alt={`${entry.changed_by.first_name} ${entry.changed_by.last_name}`}
                                sx={{ width: 32, height: 32, flexShrink: 0 }}
                              >
                                {entry.changed_by.first_name?.charAt(0).toUpperCase()}
                              </Avatar>
                            ) : entry.changed_by ? (
                              <Avatar 
                                alt={`${entry.changed_by.first_name} ${entry.changed_by.last_name}`}
                                sx={{ width: 32, height: 32, flexShrink: 0 }}
                              >
                                {entry.changed_by.first_name?.charAt(0).toUpperCase() ||
                                  entry.changed_by.last_name?.charAt(0).toUpperCase()}
                              </Avatar>
                            ) : null}
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {entry.changed_by
                                  ? `${entry.changed_by.first_name} ${entry.changed_by.last_name}`
                                  : 'System'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {dayjs(entry.changed_at).format('MMM D, YYYY h:mm A')}
                              </Typography>
                            </Stack>
                          </Stack>
                          {workerInfo && (
                            entry.action_type === 'worker_added' || 
                            entry.action_type === 'worker_removed' ||
                            entry.action_type === 'worker_accepted' ||
                            entry.action_type === 'worker_rejected' ||
                            entry.action_type === 'notification_resent' ||
                            entry.action_type === 'worker_time_changed' ||
                            (entry.action_type === 'status_changed' && entry.metadata?.reason === 'time_changed') ||
                            entry.action_type === 'timesheet_manager_changed'
                          ) ? (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 5 }}>
                              {entry.action_type === 'timesheet_manager_changed' ? (
                                <>
                                  <Typography variant="body2" color="text.secondary" component="span">
                                    Timesheet manager changed from
                                  </Typography>
                                  {workerInfo.old_manager_name && (
                                    <>
                                      <Avatar
                                        src={workerInfo.old_manager_photo_url || undefined}
                                        alt={workerInfo.old_manager_name}
                                        sx={{
                                          width: { xs: 28, md: 32 },
                                          height: { xs: 28, md: 32 },
                                          flexShrink: 0,
                                        }}
                                      >
                                        {workerInfo.old_manager_name?.split(' ')[0]?.charAt(0).toUpperCase() || 'M'}
                                      </Avatar>
                                      <Typography variant="body2" color="text.secondary" component="span" sx={{ fontWeight: 600 }}>
                                        {workerInfo.old_manager_name}
                                      </Typography>
                                    </>
                                  )}
                                  <Typography variant="body2" color="text.secondary" component="span">
                                    to
                                  </Typography>
                                  {workerInfo.new_manager_name && (
                                    <>
                                      <Avatar
                                        src={workerInfo.new_manager_photo_url || undefined}
                                        alt={workerInfo.new_manager_name}
                                        sx={{
                                          width: { xs: 28, md: 32 },
                                          height: { xs: 28, md: 32 },
                                          flexShrink: 0,
                                        }}
                                      >
                                        {workerInfo.new_manager_name?.split(' ')[0]?.charAt(0).toUpperCase() || 'M'}
                                      </Avatar>
                                      <Typography variant="body2" color="text.secondary" component="span" sx={{ fontWeight: 600 }}>
                                        {workerInfo.new_manager_name}
                                      </Typography>
                                    </>
                                  )}
                                </>
                              ) : workerInfo.name ? (
                                <>
                                  <Avatar
                                    src={workerInfo.photo_url || undefined}
                                    alt={workerInfo.name || 'Worker'}
                                    sx={{
                                      width: { xs: 28, md: 32 },
                                      height: { xs: 28, md: 32 },
                                      flexShrink: 0,
                                    }}
                                  >
                                    {workerInfo.name?.split(' ')[0]?.charAt(0).toUpperCase() || 'W'}
                                  </Avatar>
                                  <Typography variant="body2" color="text.secondary" component="span">
                                    {workerInfo.name}
                                  </Typography>
                                  {positionLabel && workerInfo.position && (
                                    <Chip
                                      label={positionLabel}
                                      size="small"
                                      variant="soft"
                                      color={getPositionColor(workerInfo.position)}
                                      sx={{ minWidth: 60, flexShrink: 0 }}
                                    />
                                  )}
                                  <Typography variant="body2" color="text.secondary" component="span">
                                    {entry.action_type === 'worker_added' && 'added to job'}
                                    {entry.action_type === 'worker_removed' && 'removed from job'}
                                    {entry.action_type === 'worker_accepted' && 'accepted the job'}
                                    {entry.action_type === 'worker_rejected' && 'rejected the job'}
                                    {entry.action_type === 'notification_resent' && 'notification resent'}
                                    {entry.action_type === 'worker_time_changed' && entry.field_name === 'worker_start_time' && 'start time changed'}
                                    {entry.action_type === 'worker_time_changed' && entry.field_name === 'worker_end_time' && 'end time changed'}
                                    {entry.action_type === 'status_changed' && entry.metadata?.reason === 'time_changed' && 'status changed to pending due to time change'}
                                  </Typography>
                                </>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  {parsedDescription}
                                </Typography>
                              )}
                            </Stack>
                          ) : entry.action_type === 'created' ? (
                            <Typography variant="body2" color="text.secondary" sx={{ pl: 5 }}>
                              {entry.changed_by
                                ? `${entry.changed_by.first_name} ${entry.changed_by.last_name} created the job`
                                : entry.description || 'Job created'}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ pl: 5 }}>
                              {parsedDescription}
                            </Typography>
                          )}
                          {entry.old_value && entry.new_value && entry.action_type !== 'timesheet_manager_changed' && (
                            <Box sx={{ mt: 1, pl: 5, borderLeft: '2px solid', borderColor: 'divider' }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  <strong>From:</strong>
                                </Typography>
                                {['pending', 'accepted', 'rejected', 'draft', 'confirmed', 'declined', 'cancelled'].includes(String(entry.old_value).toLowerCase()) ? (
                                  <Label variant="soft" color={getWorkerStatusColor(String(entry.old_value))} sx={{ fontSize: '0.7rem' }}>
                                    {String(entry.old_value).charAt(0).toUpperCase() + String(entry.old_value).slice(1)}
                                  </Label>
                                ) : (entry.field_name === 'start_time' || entry.field_name === 'end_time') ? (
                                  <Typography variant="caption" color="text.secondary">
                                    {(() => {
                                      try {
                                        // Try to parse as date and format consistently
                                        const dateValue = typeof entry.old_value === 'string' 
                                          ? entry.old_value.includes('T') || entry.old_value.includes('GMT')
                                            ? dayjs(entry.old_value).tz('America/Vancouver').format('MMM D, YYYY h:mm A')
                                            : entry.old_value
                                          : entry.old_value instanceof Date
                                            ? dayjs(entry.old_value).tz('America/Vancouver').format('MMM D, YYYY h:mm A')
                                            : String(entry.old_value);
                                        return dateValue;
                                      } catch {
                                        return String(entry.old_value);
                                      }
                                    })()}
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    {typeof entry.old_value === 'object' ? JSON.stringify(entry.old_value) : String(entry.old_value)}
                                  </Typography>
                                )}
                              </Stack>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                  <strong>To:</strong>
                                </Typography>
                                {['pending', 'accepted', 'rejected', 'draft', 'confirmed', 'declined', 'cancelled'].includes(String(entry.new_value).toLowerCase()) ? (
                                  <Label variant="soft" color={getWorkerStatusColor(String(entry.new_value))} sx={{ fontSize: '0.7rem' }}>
                                    {String(entry.new_value).charAt(0).toUpperCase() + String(entry.new_value).slice(1)}
                                  </Label>
                                ) : (entry.field_name === 'start_time' || entry.field_name === 'end_time') ? (
                                  <Typography variant="caption" color="text.secondary">
                                    {(() => {
                                      try {
                                        // Try to parse as date and format consistently
                                        const dateValue = typeof entry.new_value === 'string' 
                                          ? entry.new_value.includes('T') || entry.new_value.includes('GMT')
                                            ? dayjs(entry.new_value).tz('America/Vancouver').format('MMM D, YYYY h:mm A')
                                            : entry.new_value
                                          : entry.new_value instanceof Date
                                            ? dayjs(entry.new_value).tz('America/Vancouver').format('MMM D, YYYY h:mm A')
                                            : String(entry.new_value);
                                        return dateValue;
                                      } catch {
                                        return String(entry.new_value);
                                      }
                                    })()}
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    {typeof entry.new_value === 'object' ? JSON.stringify(entry.new_value) : String(entry.new_value)}
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No history available
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Box>
    );
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      {open && jobId && (
        <>
          <DialogTitle
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Typography variant="h6" component="div">
              Job Details
            </Typography>
            {isLoading && <CircularProgress size={20} />}
          </DialogTitle>

          <DialogContent>{renderJobDetails()}</DialogContent>

          <DialogActions>
            <Button onClick={handleClose} color="inherit">
              Close
            </Button>
            {job && (
              <Button
                onClick={handleEdit}
                variant="contained"
                startIcon={<Iconify icon="solar:pen-bold" />}
              >
                Edit Job
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>

    {/* Resend Notification Dialog */}
    {job && selectedWorkerId && (
      <JobNotifyDialog
        open={resendDialog.value}
        onClose={() => {
          resendDialog.onFalse();
          // Refresh the dialog data after resending
          setRefreshKey((prev) => prev + 1);
        }}
        jobId={jobId}
        workerId={selectedWorkerId}
        data={job}
      />
    )}
  </>
  );
}
