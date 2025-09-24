import { useQuery } from '@tanstack/react-query';
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

import { fDate, fTime } from 'src/utils/format-time';

import { provinceList } from 'src/assets/data';
import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

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

// Helper function to get position color
const getPositionColor = (position: string) => {
  switch (position) {
    case 'lct':
      return 'primary';
    case 'tcp':
      return 'secondary';
    case 'field_supervisor':
      return 'warning';
    default:
      return 'default';
  }
};

export function JobDetailsDialog({ open, onClose, jobId }: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const { user } = useAuthContext();

  // Fetch detailed job information
  const {
    data: job,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.work.job}/${jobId}`);
      return response.data.job;
    },
    enabled: !!jobId, // Keep query enabled as long as we have jobId
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
  });

  const handleClose = useCallback(() => {
    setIsClosing(true);
    onClose();
  }, [onClose]);

  // Reset closing state when dialog opens
  useEffect(() => {
    if (open) {
      setIsClosing(false);
    }
  }, [open]);

  // Filter workers based on the same logic as work-table-row
  const filteredWorkers =
    job?.workers?.filter((worker: any) => {
      // If current worker has rejected, only show them
      if (worker.id === user?.id) {
        return true;
      }
      // Otherwise show current worker and other accepted workers
      return worker.status === 'accepted';
    }) || [];

  // Filter vehicles based on the same logic - only show vehicles where operator has accepted
  const filteredVehicles =
    job?.vehicles?.filter((vehicle: any) => {
      if (!vehicle.operator?.id) return false;

      const operator = job.workers?.find((w: any) => w.id === vehicle.operator.id);
      return operator && operator.status === 'accepted';
    }) || [];

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
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
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
                  Client
                </Typography>
                <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
                  {job.client?.name}
                </Typography>
                {/* {job.client?.phoneNumber && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Iconify icon="solar:phone-bold" width={18} />
                    <Link
                      href={`tel:${job.client.phoneNumber}`}
                      variant="body1"
                      color="primary"
                      sx={{ textDecoration: 'none' }}
                    >
                      {formatPhoneNumber(job.client.phoneNumber)}
                    </Link>
                  </Box>
                )} */}
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
                {/* {job.site?.phoneNumber && (
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
                )} */}
              </Box>
            </Stack>

            <Divider />

            {/* Schedule */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Schedule
              </Typography>

              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Date:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {job.start_time ? fDate(job.start_time) : ''}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Start Time:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {job.start_time ? fTime(job.start_time) : ''}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">End Time:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {job.end_time ? fTime(job.end_time) : ''}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Workers - Filtered based on acceptance status */}
            {filteredWorkers.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Workers ({filteredWorkers.length})
                  </Typography>

                  <Stack spacing={1}>
                    {filteredWorkers.map((worker: any, index: number) => {
                      const positionLabel =
                        JOB_POSITION_OPTIONS.find((option) => option.value === worker.position)
                          ?.label ||
                        worker.position ||
                        'Unknown Position';

                      return (
                        <Box
                          key={worker.id || index}
                          sx={{
                            // Responsive layout
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            alignItems: { xs: 'stretch', md: 'center' },
                            justifyContent: { xs: 'flex-start', md: 'space-between' },
                            gap: { xs: 1, md: 1 },
                            p: { xs: 1.5, md: 1 },
                            border: { xs: '1px solid', md: 'none' },
                            borderColor: { xs: 'divider', md: 'transparent' },
                            borderRadius: 1,
                            mb: { xs: 1, md: 0 },
                          }}
                        >
                          {/* Position and Worker Info */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              minWidth: 0,
                              flex: { xs: 'none', md: 1 },
                              mb: { xs: 1, md: 0 },
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
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 500,
                                  minWidth: 0,
                                  flex: 1,
                                }}
                              >
                                {worker.first_name} {worker.last_name}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Contact and Time Info */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: { xs: 1, md: 2 },
                              flexShrink: 0,
                              flexDirection: { xs: 'column', md: 'row' },
                              alignSelf: { xs: 'stretch', md: 'center' },
                            }}
                          >
                            {worker.phone_number && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: { xs: 1, md: 0.5 },
                                  width: { xs: '100%', md: 'auto' },
                                }}
                              >
                                <Iconify icon="solar:phone-bold" width={18} />
                                <Link
                                  href={`tel:${worker.phone_number}`}
                                  variant="body1"
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
                                gap: { xs: 1, md: 1 },
                                width: { xs: '100%', md: 'auto' },
                              }}
                            >
                              <Iconify icon="solar:clock-circle-bold" width={18} />
                              <Typography variant="body1">
                                {worker.start_time ? fTime(worker.start_time) : ''} -{' '}
                                {worker.end_time ? fTime(worker.end_time) : ''}
                              </Typography>
                              {worker.status && (
                                <Label
                                  variant="soft"
                                  color={
                                    (worker.status === 'accepted' && 'success') ||
                                    (worker.status === 'rejected' && 'error') ||
                                    (worker.status === 'pending' && 'warning') ||
                                    'default'
                                  }
                                >
                                  {worker.status}
                                </Label>
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

            {/* Vehicles - Only show vehicles where operator has accepted */}
            {filteredVehicles.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Vehicles ({filteredVehicles.length})
                  </Typography>

                  <Stack spacing={1.5}>
                    {filteredVehicles.map((vehicle: any, index: number) => (
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

            {/* Equipment - Always display */}
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

            {/* Notes - Always display */}
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
          </Stack>
        </CardContent>
      </Box>
    );
  };

  return (
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
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
