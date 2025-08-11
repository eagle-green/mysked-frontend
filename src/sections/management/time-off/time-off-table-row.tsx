import dayjs from 'dayjs';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { TIME_OFF_TYPES, TIME_OFF_STATUSES } from 'src/types/timeOff';

// ----------------------------------------------------------------------

// Function to check if time-off request needs urgent confirmation
const checkTimeOffConfirmationUrgency = (startDate: string) => {
  const start = dayjs(startDate);
  const today = dayjs();
  const daysUntilStart = start.diff(today, 'day');
  
  // If the request has already started (negative days), it should have been auto-rejected
  // Don't show urgency for these - they should be rejected already
  if (daysUntilStart < 0) {
    return {
      isUrgent: false,
      isCritical: false,
      daysRemaining: daysUntilStart,
      color: 'default' as const,
      message: ''
    };
  } else if (daysUntilStart <= 7) {
    return {
      isUrgent: true,
      isCritical: true,
      daysRemaining: daysUntilStart,
      color: 'error' as const,
      message: `Time-off starts in ${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'}. Please confirm soon. If no action is taken within ${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'}, this request will be automatically rejected.`
    };
  } else if (daysUntilStart <= 14) {
    return {
      isUrgent: true,
      isCritical: false,
      daysRemaining: daysUntilStart,
      color: 'warning' as const,
      message: `Time-off starts in ${daysUntilStart} days. Please confirm soon. If no action is taken within ${daysUntilStart} days, this request will be automatically rejected.`
    };
  }
  
  return {
    isUrgent: false,
    isCritical: false,
    daysRemaining: daysUntilStart,
    color: 'default' as const,
    message: ''
  };
};

type Props = {
  row: any;
  selected: boolean;
  onSelectRow: VoidFunction;
  onView: (row: any) => void;
  onDelete: (timeOffId: string) => void;
};

export function TimeOffTableRow({ row, selected, onSelectRow, onView, onDelete }: Props) {
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
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  // Check if this time-off request needs urgent confirmation (only for pending requests)
  const confirmationUrgency = row.status === 'pending' 
    ? checkTimeOffConfirmationUrgency(row.start_date)
    : { isUrgent: false, isCritical: false, daysRemaining: 0, color: 'default' as const, message: '' };

  // const getTypeColor = (type: string) => {
  //   const timeOffType = TIME_OFF_TYPES.find((t) => t.value === type);
  //   return timeOffType?.color || '#9E9E9E';
  // };

  return (
    <TableRow 
      hover 
      selected={selected}
      sx={(theme) => ({
        ...(confirmationUrgency.isUrgent && {
          // Use CSS custom properties for dark mode aware colors
          backgroundColor: confirmationUrgency.isCritical 
            ? 'rgba(var(--palette-error-mainChannel) / 0.12)'
            : 'rgba(var(--palette-warning-mainChannel) / 0.12)',
          // Force appropriate text color for better contrast
          color: 'var(--palette-text-primary)',
          '& .MuiTableCell-root': {
            color: 'var(--palette-text-primary)',
          },
          '&:hover': {
            backgroundColor: confirmationUrgency.isCritical 
              ? 'rgba(var(--palette-error-mainChannel) / 0.16)'
              : 'rgba(var(--palette-warning-mainChannel) / 0.16)',
          },
          '&.Mui-selected': {
            backgroundColor: confirmationUrgency.isCritical 
              ? 'rgba(var(--palette-error-mainChannel) / 0.24)'
              : 'rgba(var(--palette-warning-mainChannel) / 0.24)',
            // Keep text color readable when selected
            color: 'var(--palette-text-primary)',
            '& .MuiTableCell-root': {
              color: 'var(--palette-text-primary)',
            },
            '&:hover': {
              backgroundColor: confirmationUrgency.isCritical 
                ? 'rgba(var(--palette-error-mainChannel) / 0.32)'
                : 'rgba(var(--palette-warning-mainChannel) / 0.32)',
            },
          },
        }),
      })}
    >
      <TableCell padding="checkbox">
        <Checkbox 
          checked={selected} 
          onClick={onSelectRow}
          disabled={row.status !== 'rejected'}
          sx={{
            opacity: row.status !== 'rejected' ? 0.5 : 1,
            cursor: row.status !== 'rejected' ? 'not-allowed' : 'pointer',
          }}
        />
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={row?.photo_url ?? undefined} alt={row?.first_name}>
            {row?.first_name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2">
              {row.first_name} {row.last_name}
            </Typography>
            {/* <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography> */}
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {TIME_OFF_TYPES.find((t) => t.value === row.type)?.label || row.type}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {dayjs(row.start_date).isSame(dayjs(row.end_date), 'day')
            ? dayjs(row.start_date).format('MMM DD, YYYY')
            : `${dayjs(row.start_date).format('MMM DD, YYYY')} - ${dayjs(row.end_date).format('MMM DD, YYYY')}`}
        </Typography>
      </TableCell>

      <TableCell>
        <Label variant="soft" color={getStatusColor(row.status)}>
          {TIME_OFF_STATUSES.find((s) => s.value === row.status)?.label || row.status}
        </Label>
      </TableCell>

      <TableCell>
        {row.confirmed_by && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={row.confirmed_by_photo_url ?? undefined} alt={row.confirmed_by_first_name}>
              {row.confirmed_by_first_name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2">
              {row.confirmed_by_first_name} {row.confirmed_by_last_name}
            </Typography>
          </Box>
        )}
      </TableCell>

      <TableCell align="right">
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Confirmation urgency badge - always reserve space */}
          <Box sx={{ width: 32, display: 'flex', justifyContent: 'center' }}>
            {confirmationUrgency.isUrgent && (
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
                      confirmationUrgency.isCritical
                        ? 'solar:danger-bold'
                        : 'solar:clock-circle-bold'
                    }
                    width={20}
                  />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Button size="small" variant="contained" onClick={() => onView(row)}>
            View
          </Button>
          
          {/* Show more button for all statuses but disable for non-rejected */}
          <IconButton 
            onClick={handleOpenMenu}
            disabled={row.status !== 'rejected'}
            sx={{
              opacity: row.status !== 'rejected' ? 0.5 : 1,
              cursor: row.status !== 'rejected' ? 'not-allowed' : 'pointer',
            }}
          >
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
            onClick={handleDelete} 
            sx={{ color: 'error.main' }}
            disabled={row.status !== 'rejected'}
          >
            <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
            Delete {row.status !== 'rejected' && '(Rejected only)'}
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}
