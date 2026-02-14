import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fTime } from 'src/utils/format-time';
import { getRoleDisplayInfo } from 'src/utils/format-role';
import { formatPhoneNumberSimple } from 'src/utils/format-number';

import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Worker = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  photo_url?: string | null;
  phone_number?: string | null;
  position: string;
  start_time: string;
  end_time: string;
  status: string;
  is_timesheet_manager: boolean;
  vehicle?: {
    type: string;
    license_plate: string;
    unit_number: string;
  } | null;
};

type Props = {
  workers: Worker[];
};

// Format vehicle type (e.g., "highway_truck" -> "Highway Truck")
const formatVehicleType = (type: string) => {
  const option = VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

export function JobDispatchNoteExpandedRow({ workers }: Props) {
  if (workers.length === 0) {
    return (
      <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
        <Typography variant="body2" color="text.secondary">
          No workers assigned
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.neutral', p: 1.5 }}>
      {/* Header */}
      <Paper
        sx={{
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <Box
          sx={(theme) => ({
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            alignItems: 'center',
            justifyContent: 'center',
            p: theme.spacing(1.5, 2, 1.5, 1.5),
            borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
            width: '100%',
            '& .MuiListItemText-root': {
              textAlign: 'center',
            },
          })}
        >
          <ListItemText primary="Worker" />
          <ListItemText primary="Vehicle Type" />
          <ListItemText primary="Vehicle" />
          <ListItemText primary="Schedule" />
          <ListItemText primary="Status" />
        </Box>
      </Paper>

      {/* Workers */}
      <Paper
        sx={{
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
        }}
      >
        {workers.map((worker, index) => {
          const roleInfo = getRoleDisplayInfo(worker.position);
          const startTime = fTime(worker.start_time);
          const endTime = fTime(worker.end_time);

          return (
            <Box
              key={worker.id}
              sx={(theme) => ({
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                alignItems: 'center',
                p: theme.spacing(1.5, 2, 1.5, 1.5),
                borderBottom:
                  index < workers.length - 1
                    ? `solid 1px ${theme.vars.palette.divider}`
                    : 'none',
                '& > div': {
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              })}
            >
              {/* Worker */}
              <Box sx={{ justifyContent: 'flex-start !important', gap: 1, flexDirection: 'column', alignItems: 'flex-start !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={worker.photo_url || undefined}
                    alt={`${worker.first_name} ${worker.last_name}`}
                    sx={{ width: 32, height: 32 }}
                  >
                    {worker.first_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="body2" noWrap>
                      {worker.first_name} {worker.last_name}
                    </Typography>
                    <Label
                      variant="soft"
                      color={roleInfo.color}
                      sx={{ fontSize: '0.625rem', px: 0.5, py: 0, height: 16 }}
                    >
                      {roleInfo.label}
                    </Label>
                    {worker.is_timesheet_manager && (
                      <Label
                        variant="soft"
                        color="info"
                        sx={{ fontSize: '0.625rem', px: 0.5, py: 0, height: 16 }}
                      >
                        TM
                      </Label>
                    )}
                  </Box>
                </Box>
                {worker.phone_number && (
                  <Link
                    href={`tel:${worker.phone_number.replace(/\D/g, '')}`}
                    variant="caption"
                    color="primary"
                    underline="hover"
                    sx={{ ml: 5 }}
                  >
                    {formatPhoneNumberSimple(worker.phone_number)}
                  </Link>
                )}
              </Box>

              {/* Vehicle Type */}
              <Box>
                <Typography variant="body2">
                  {worker.vehicle?.type ? formatVehicleType(worker.vehicle.type) : ''}
                </Typography>
              </Box>

              {/* Vehicle */}
              <Box>
                <Typography variant="body2">
                  {worker.vehicle
                    ? [worker.vehicle.license_plate, worker.vehicle.unit_number]
                        .filter(Boolean)
                        .join(' - ')
                    : ''}
                </Typography>
              </Box>

              {/* Schedule */}
              <Box>
                <Typography variant="body2">
                  {startTime} - {endTime}
                </Typography>
              </Box>

              {/* Status */}
              <Box>
                <Label
                  variant="soft"
                  color={
                    worker.status === 'accepted'
                      ? 'success'
                      : worker.status === 'pending'
                        ? 'warning'
                        : worker.status === 'declined'
                          ? 'error'
                          : 'default'
                  }
                >
                  {worker.status}
                </Label>
              </Box>
            </Box>
          );
        })}
      </Paper>
    </Box>
  );
}
