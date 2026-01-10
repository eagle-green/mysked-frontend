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
import { getPositionColor, getWorkerStatusColor, getWorkerStatusLabel } from 'src/utils/format-role';

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
    // Navigate to open job edit page if it's an open job, otherwise to regular job edit page
    if (job?.is_open_job) {
      navigate(paths.work.openJob.edit(jobId));
    } else {
    navigate(paths.work.job.edit(jobId));
    }
  }, [jobId, job?.is_open_job, navigate]);

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
                                    color={getWorkerStatusColor(worker.status)}
                                    sx={{ fontSize: '0.75rem' }}
                                  >
                                    {getWorkerStatusLabel(worker.status)}
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
                    // Parse worker info from metadata for worker_added/worker_removed/worker_accepted/worker_rejected/notification_resent/worker_time_changed/status_changed/timesheet_manager_changed/worker_incident_created/status updates
                    const workerInfo = entry.metadata && (
                      entry.action_type === 'worker_added' || 
                      entry.action_type === 'worker_removed' ||
                      entry.action_type === 'worker_accepted' ||
                      entry.action_type === 'worker_rejected' ||
                      entry.action_type === 'notification_resent' ||
                      entry.action_type === 'worker_time_changed' ||
                      (entry.action_type === 'status_changed' && entry.metadata?.reason === 'time_changed') ||
                      entry.action_type === 'timesheet_manager_changed' ||
                      entry.action_type === 'worker_incident_created' ||
                      entry.action_type === 'worker_status_updated' ||
                      (entry.action_type === 'updated' && (entry.field_name === 'status' || entry.field_name === 'worker_status') && (entry.new_value === 'no_show' || entry.new_value === 'called_in_sick'))
                    )
                      ? entry.metadata
                      : null;
                    
                    // Parse vehicle info from metadata
                    const vehicleInfo = entry.metadata && (
                      entry.action_type === 'vehicle_added' ||
                      entry.action_type === 'vehicle_removed'
                    )
                      ? entry.metadata
                      : null;
                    
                    // Parse equipment info from metadata
                    const equipmentInfo = entry.metadata && (
                      entry.action_type === 'equipment_added' ||
                      entry.action_type === 'equipment_removed' ||
                      entry.action_type === 'equipment_updated'
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
                    
                    // Extract position from description for display as Chip (e.g., "Jason Jung (lct) marked as Called in Sick")
                    let descriptionPosition: string | null = null;
                    let descriptionWithoutPosition = parsedDescription;
                    if (parsedDescription) {
                      // Match pattern like "(lct)", "(tcp)", "(hwy)", "(field_supervisor)", etc.
                      const positionMatch = parsedDescription.match(/\(([^)]+)\)/);
                      if (positionMatch && positionMatch[1]) {
                        descriptionPosition = positionMatch[1].toLowerCase();
                        // Remove the position from the description text
                        descriptionWithoutPosition = parsedDescription.replace(/\([^)]+\)\s*/, '');
                      }
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
                              : entry.action_type === 'worker_incident_created'
                              ? 'error.main'
                              : entry.action_type === 'worker_status_updated'
                              ? 'error.main'
                              : (entry.action_type === 'updated' && (entry.field_name === 'status' || entry.field_name === 'worker_status') && (entry.new_value === 'no_show' || entry.new_value === 'called_in_sick'))
                              ? 'error.main'
                              : entry.action_type === 'vehicle_added'
                              ? 'info.main'
                              : entry.action_type === 'vehicle_removed'
                              ? 'error.main'
                              : entry.action_type === 'equipment_added'
                              ? 'info.main'
                              : entry.action_type === 'equipment_removed'
                              ? 'error.main'
                              : entry.action_type === 'equipment_updated'
                              ? 'warning.main'
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
                                    {entry.action_type === 'worker_accepted' && (
                                      <>
                                        accepted the job
                                        {workerInfo?.via && (
                                          <Chip
                                            label={
                                              workerInfo.via === 'app' ? 'via MySked App' :
                                              workerInfo.via === 'email' ? 'via Email' :
                                              workerInfo.via === 'sms' ? 'via SMS' :
                                              ''
                                            }
                                            size="small"
                                            variant="outlined"
                                            sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                                          />
                                        )}
                                      </>
                                    )}
                                    {entry.action_type === 'worker_rejected' && (
                                      <>
                                        rejected the job
                                        {workerInfo?.via && (
                                          <Chip
                                            label={
                                              workerInfo.via === 'app' ? 'via MySked App' :
                                              workerInfo.via === 'email' ? 'via Email' :
                                              workerInfo.via === 'sms' ? 'via SMS' :
                                              ''
                                            }
                                            size="small"
                                            variant="outlined"
                                            sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                                          />
                                        )}
                                      </>
                                    )}
                                    {entry.action_type === 'worker_incident_created' && (
                                      <>
                                        {entry.metadata?.incident_type === 'no_show' ? 'marked as No Show' : 
                                         entry.metadata?.incident_type === 'called_in_sick' ? 'marked as Called in Sick' : 
                                         'incident created'}
                                      </>
                                    )}
                                    {(entry.action_type === 'updated' && (entry.field_name === 'status' || entry.field_name === 'worker_status') && entry.new_value === 'no_show') && 'marked as No Show'}
                                    {(entry.action_type === 'updated' && (entry.field_name === 'status' || entry.field_name === 'worker_status') && entry.new_value === 'called_in_sick') && 'marked as Called in Sick'}
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
                          ) : vehicleInfo && (
                            entry.action_type === 'vehicle_added' ||
                            entry.action_type === 'vehicle_removed'
                          ) ? (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 5 }}>
                              <Typography variant="body2" color="text.secondary" component="span">
                                {vehicleInfo.license_plate || vehicleInfo.unit_number || 'Vehicle'}
                              </Typography>
                              <Chip
                                label={vehicleInfo.type || 'Unknown Type'}
                                size="small"
                                variant="soft"
                                color="info"
                                sx={{ minWidth: 80, flexShrink: 0 }}
                              />
                              <Typography variant="body2" color="text.secondary" component="span">
                                {entry.action_type === 'vehicle_added' && 'added to job'}
                                {entry.action_type === 'vehicle_removed' && 'removed from job'}
                              </Typography>
                            </Stack>
                          ) : equipmentInfo && (
                            entry.action_type === 'equipment_added' ||
                            entry.action_type === 'equipment_removed' ||
                            entry.action_type === 'equipment_updated'
                          ) ? (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 5 }}>
                              <Typography variant="body2" color="text.secondary" component="span">
                                {(() => {
                                  // Format equipment type from snake_case to Title Case
                                  const formatEquipmentLabel = (value: string) => value
                                      .split('_')
                                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                      .join(' ');
                                  return formatEquipmentLabel(equipmentInfo.type || '');
                                })()}
                              </Typography>
                              {equipmentInfo.quantity && (
                                <Chip
                                  label={`Qty: ${equipmentInfo.quantity}`}
                                  size="small"
                                  variant="soft"
                                  color="info"
                                  sx={{ minWidth: 60, flexShrink: 0 }}
                                />
                              )}
                              <Typography variant="body2" color="text.secondary" component="span">
                                {entry.action_type === 'equipment_added' && 'added to job'}
                                {entry.action_type === 'equipment_removed' && 'removed from job'}
                                {entry.action_type === 'equipment_updated' && `quantity changed from ${equipmentInfo.old_quantity} to ${equipmentInfo.new_quantity}`}
                              </Typography>
                            </Stack>
                          ) : entry.action_type === 'created' ? (
                            <Typography variant="body2" color="text.secondary" sx={{ pl: 5 }}>
                              {entry.changed_by
                                ? `${entry.changed_by.first_name} ${entry.changed_by.last_name} created the job`
                                : entry.description || 'Job created'}
                            </Typography>
                          ) : entry.action_type === 'updated' && entry.field_name === 'notes' ? (
                            <Stack spacing={1} sx={{ pl: 5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {entry.description}
                              </Typography>
                              {entry.new_value && (
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 1,
                                    bgcolor: 'background.neutral',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    {typeof entry.new_value === 'string' ? entry.new_value : String(entry.new_value)}
                                  </Typography>
                                </Box>
                              )}
                              {entry.old_value && !entry.new_value && (
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 1,
                                    bgcolor: 'background.neutral',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    opacity: 0.7,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                      textDecoration: 'line-through',
                                    }}
                                  >
                                    {typeof entry.old_value === 'string' ? entry.old_value : String(entry.old_value)}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          ) : (
                            <Box sx={{ pl: 5 }}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                {descriptionPosition && (
                                  <Chip
                                    label={
                                      JOB_POSITION_OPTIONS.find((opt) => opt.value === descriptionPosition)?.label ||
                                      descriptionPosition.charAt(0).toUpperCase() + descriptionPosition.slice(1)
                                    }
                                    size="small"
                                    variant="soft"
                                    color={getPositionColor(descriptionPosition)}
                                    sx={{ minWidth: 60, flexShrink: 0 }}
                                  />
                                )}
                                <Typography variant="body2" color="text.secondary">
                                  {descriptionWithoutPosition}
                                </Typography>
                              </Stack>
                            </Box>
                          )}
                          {/* Display incident details for worker_incident_created (outside workerInfo block to ensure it always shows) */}
                          {entry.action_type === 'worker_incident_created' && entry.metadata && (
                            <Stack spacing={0.5} sx={{ mt: 1, pl: 5 }}>
                              {entry.metadata.notified_at && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  <strong>When did they notify?:</strong>{' '}
                                  {dayjs(entry.metadata.notified_at).format('MMM D, YYYY h:mm A')}
                                </Typography>
                              )}
                              {entry.metadata.reason && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  <strong>Reason / Memo:</strong>{' '}
                                  {entry.metadata.reason}
                                </Typography>
                              )}
                            </Stack>
                          )}
                          {/* Show From/To only if both values exist and it's not an "added" or "removed" action */}
                          {entry.old_value && entry.new_value && entry.action_type !== 'timesheet_manager_changed' && 
                           !parsedDescription.toLowerCase().includes('added') && 
                           !parsedDescription.toLowerCase().includes('removed') && (
                            <Box sx={{ mt: 1, pl: 5, borderLeft: '2px solid', borderColor: 'divider' }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  <strong>From:</strong>
                                </Typography>
                                {['pending', 'accepted', 'rejected', 'draft', 'confirmed', 'declined', 'cancelled', 'no_show', 'called_in_sick'].includes(String(entry.old_value).toLowerCase()) ? (
                                  <Label variant="soft" color={getWorkerStatusColor(String(entry.old_value))} sx={{ fontSize: '0.7rem' }}>
                                    {getWorkerStatusLabel(String(entry.old_value))}
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
                                {['pending', 'accepted', 'rejected', 'draft', 'confirmed', 'declined', 'cancelled', 'no_show', 'called_in_sick'].includes(String(entry.new_value).toLowerCase()) ? (
                                  <Label variant="soft" color={getWorkerStatusColor(String(entry.new_value))} sx={{ fontSize: '0.7rem' }}>
                                    {getWorkerStatusLabel(String(entry.new_value))}
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
                              {/* Display site address if available in metadata */}
                              {entry.field_name === 'site_id' && entry.metadata && (
                                <Stack spacing={0.5} sx={{ mt: 1 }}>
                                  {entry.metadata.old_site_address && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic' }}>
                                      Old address: {entry.metadata.old_site_address}
                                    </Typography>
                                  )}
                                  {entry.metadata.new_site_address && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic' }}>
                                      New address: {entry.metadata.new_site_address}
                                    </Typography>
                                  )}
                                </Stack>
                              )}
                            </Box>
                          )}
                          {/* Show value for "added" actions */}
                          {!entry.old_value && entry.new_value && 
                           (parsedDescription.toLowerCase().includes('added') || parsedDescription.toLowerCase().includes('removed')) && (
                            <Box sx={{ mt: 1, pl: 5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {entry.field_name === 'site_id' && entry.metadata?.new_site_address ? (
                                  <Stack spacing={0.5}>
                                    <Typography variant="caption" color="text.secondary" component="span">
                                      {entry.new_value}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', display: 'block' }}>
                                      {entry.metadata.new_site_address}
                                    </Typography>
                                  </Stack>
                                ) : (
                                  entry.new_value
                                )}
                              </Typography>
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
