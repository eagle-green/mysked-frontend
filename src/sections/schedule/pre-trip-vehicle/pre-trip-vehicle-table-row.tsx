import dayjs from 'dayjs';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { TIME_OFF_TYPES, TIME_OFF_STATUSES } from 'src/types/timeOff';

// ----------------------------------------------------------------------

// Function to check if time-off request needs urgent confirmation
const checkInspectionUrgency = (startDate: string) => {
  const start = dayjs(startDate);
  const today = dayjs();
  const daysUntilStart = start.diff(today, 'day');

  if (daysUntilStart == 1) {
    return {
      isUrgentAction: true,
      isLateSubmission: false,
      daysRemaining: daysUntilStart,
      color: 'warning' as const,
      message: `The scheduled job will begin in ${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'}. Please ensure that the vehicle is inspected prior to starting the job. Failure to complete the inspection may impact the job schedule.`,
    };
  } else if (daysUntilStart <= 0) {
    return {
      isUrgentAction: true,
      isLateSubmission: true,
      daysRemaining: daysUntilStart,
      color: 'error' as const,
      message: `The vehicle inspection is now past due and has not been submitted on time`,
    };
  }

  return {
    isUrgentAction: false,
    isLateSubmission: false,
    daysRemaining: daysUntilStart,
    color: 'default' as const,
    message: '',
  };
};

type Props = {
  row: any;
  onDelete: (id: string) => void;
};

export function PreTripVehicleTableView({ row, onDelete }: Props) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleDelete = () => {
    onDelete(row.id);
    handleCloseMenu();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'submitted':
        return 'success';
      default:
        return 'default';
    }
  };

  const confirmationUrgency =
    row.status === 'pending'
      ? checkInspectionUrgency(row?.job?.job_start)
      : {
          isUrgentAction: false,
          isLateSubmission: false,
          daysUntilStart: 0,
          color: 'default' as const,
          message: '',
        };

  // const getTypeColor = (type: string) => {
  //   const timeOffType = TIME_OFF_TYPES.find((t) => t.value === type);
  //   return timeOffType?.color || '#9E9E9E';
  // };

  return (
    <TableRow
      hover
      sx={(theme) => ({
        ...(confirmationUrgency.isUrgentAction && {
          // Use CSS custom properties for dark mode aware colors
          backgroundColor: confirmationUrgency.isLateSubmission
            ? 'rgba(var(--palette-error-mainChannel) / 0.12)'
            : 'rgba(var(--palette-warning-mainChannel) / 0.12)',
          // Force appropriate text color for better contrast
          color: 'var(--palette-text-primary)',
          '& .MuiTableCell-root': {
            color: 'var(--palette-text-primary)',
          },
          '&:hover': {
            backgroundColor: confirmationUrgency.isLateSubmission
              ? 'rgba(var(--palette-error-mainChannel) / 0.16)'
              : 'rgba(var(--palette-warning-mainChannel) / 0.16)',
          },
          '&.Mui-selected': {
            backgroundColor: confirmationUrgency.isLateSubmission
              ? 'rgba(var(--palette-error-mainChannel) / 0.24)'
              : 'rgba(var(--palette-warning-mainChannel) / 0.24)',
            // Keep text color readable when selected
            color: 'var(--palette-text-primary)',
            '& .MuiTableCell-root': {
              color: 'var(--palette-text-primary)',
            },
            '&:hover': {
              backgroundColor: confirmationUrgency.isLateSubmission
                ? 'rgba(var(--palette-error-mainChannel) / 0.32)'
                : 'rgba(var(--palette-warning-mainChannel) / 0.32)',
            },
          },
        }),
      })}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Link
            component={RouterLink}
            href={paths.schedule.work.pre_trip_vehicle.edit(row.id)}
            color="primary"
            sx={{ cursor: 'pointer', fontWeight: 'bold' }}
          >
            {row?.job?.job_number}
          </Link>
        </Box>
      </TableCell>

      <TableCell>
        <ListItemText
          primary={fDate(row.job.job_start, 'MMM DD YYYY')}
          secondary={fTime(row.job.job_start)}
          slotProps={{
            primary: {
              noWrap: true,
              sx: { typography: 'body2' },
            },
            secondary: {
              sx: { mt: 0.5, typography: 'caption' },
            },
          }}
        />
      </TableCell>

      <TableCell>
        <ListItemText
          primary={fDate(row.job.job_end, 'MMM DD YYYY')}
          secondary={fTime(row.job.job_end)}
          slotProps={{
            primary: {
              noWrap: true,
              sx: { typography: 'body2' },
            },
            secondary: {
              sx: { mt: 0.5, typography: 'caption' },
            },
          }}
        />
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={row?.driver?.photo_url ?? undefined}
            alt={row?.driver?.displayName}
            sx={{ width: 32, height: 32 }}
          >
            {row?.driver?.displayName?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2">{row?.driver?.displayName}</Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Link
              component={RouterLink}
              href={paths.schedule.work.pre_trip_vehicle.edit(row.id)}
              color="primary"
              sx={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              {row?.vehicle?.license_plate}
            </Link>
            <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
              {row?.vehicle?.info} {row?.vehicle?.year && `(${row?.vehicle?.year})`}
            </Box>
          </Stack>
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {TIME_OFF_TYPES.find((t) => t.value === row.type)?.label || row.type}
        </Typography>
      </TableCell>

      <TableCell>
        <Label variant="soft" color={getStatusColor(row.status)}>
          {TIME_OFF_STATUSES.find((s) => s.value === row.status)?.label || row.status}
        </Label>
      </TableCell>

      <TableCell>
        {row.submitted_by && (
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  src={row.submitted_by.photo_url ?? undefined}
                  alt={`${row.submitted_by.first_name} ${row.submitted_by.last_name}`}
                  sx={{ width: 32, height: 32 }}
                >
                  {row.submitted_by.first_name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="body2" noWrap>
                  {`${row.submitted_by.first_name} ${row.submitted_by.last_name}`}
                </Typography>
              </Stack>
            }
            secondary={
              row.submitted_by?.submitted_at
                ? `${fDate(row.submitted_by?.submitted_at, 'MMM DD YYYY')} ${fTime(row.submitted_by?.submitted_at)}`
                : undefined
            }
            slotProps={{
              primary: {
                sx: { typography: 'body2' },
              },
              secondary: {
                sx: { mt: 0.5, typography: 'caption' },
              },
            }}
          />
        )}
      </TableCell>

      {/* <TableCell>
        {row.submitted_at ? (
          <Box>
            <Typography variant="body2">{fDate(row.submitted_at)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {fTime(row.submitted_at)}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
        )}
      </TableCell> */}

      <TableCell align="right">
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Confirmation urgency badge - always reserve space */}
          <Box sx={{ width: 32, display: 'flex', justifyContent: 'center' }}>
            {confirmationUrgency.isUrgentAction && (
              <Tooltip
                title={confirmationUrgency.message}
                placement="left"
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      fontSize: '14px',
                      maxWidth: 300,
                      '& .MuiTooltip-arrow': {
                        color: 'grey.800',
                      },
                    },
                  },
                }}
              >
                <IconButton
                  size="small"
                  sx={{
                    color: `${confirmationUrgency.color}.main`,
                    '&:hover': {
                      backgroundColor: `${confirmationUrgency.color}.lighter`,
                    },
                  }}
                >
                  <Iconify
                    icon={
                      confirmationUrgency.isLateSubmission
                        ? 'solar:danger-bold'
                        : 'solar:clock-circle-bold'
                    }
                    width={20}
                  />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* <Button size="small" variant="contained" onClick={() => onView(row)}>
            View
          </Button> */}

          {/* Show more button - enable for rejected and approved */}
          <IconButton onClick={handleOpenMenu}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Box>

        {/* Menu is always available but actions depend on status */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem
            component={RouterLink}
            href={`${paths.schedule.work.pre_trip_vehicle.edit(row.id)}`}
          >
            <Iconify icon="solar:pen-bold" sx={{ mr: 1 }} />
            Start Inspection
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}
