import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fDate, fTime } from 'src/utils/format-time';

import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Iconify } from 'src/components/iconify';

import type { MissingTimecard } from './view/missing-timecards-list-view';

// ----------------------------------------------------------------------

interface Props {
  row: MissingTimecard;
}

export function MissingTimecardsTableRow({ row }: Props) {
  const collapseRow = useBoolean();

  const missingWorkersCount = row.missing_field_team_members.length;
  const missingWorkersText = missingWorkersCount > 0 ? `${missingWorkersCount} worker${missingWorkersCount !== 1 ? 's' : ''}` : 'None';

  // Get first letter for client avatar
  const clientInitial = row.client_name?.charAt(0)?.toUpperCase() || 'C';

  // Get first letter for company/customer avatar
  const companyInitial = row.company_name?.charAt(0)?.toUpperCase() || 'C';

  // Get first letter of first name for manager avatar
  const managerNameParts = row.timesheet_manager_name.split(' ');
  const managerInitial = managerNameParts[0]?.charAt(0)?.toUpperCase() || row.timesheet_manager_name.charAt(0).toUpperCase();

  // Build Google Maps URL for site address
  const buildMapsUrl = () => {
    const addressParts = [
      row.site_address,
    ].filter(Boolean);
    
    if (addressParts.length === 0) return null;
    
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressParts.join(', '))}`;
  };

  const mapsUrl = buildMapsUrl();
  const hasAddress = !!row.site_address && row.site_address.trim() !== '';

  function renderPrimaryRow() {
    return (
      <TableRow hover>
        <TableCell>
          <Typography variant="subtitle2" noWrap>
            {row.job_number}
          </Typography>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="subtitle2" noWrap>
              {row.site_name || 'N/A'}
            </Typography>
            {hasAddress && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
                {mapsUrl ? (
                  <Link
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{ color: 'text.disabled' }}
                  >
                    {row.site_address}
                  </Link>
                ) : (
                  <span>{row.site_address}</span>
                )}
              </Typography>
            )}
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={row.client_logo_url || undefined}
              alt={row.client_name || 'Client'}
              sx={{ width: 32, height: 32 }}
            >
              {clientInitial}
            </Avatar>
            <Typography variant="subtitle2" noWrap>
              {row.client_name || 'N/A'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={row.company_logo_url || undefined}
              alt={row.company_name || 'Customer'}
              sx={{ width: 32, height: 32 }}
            >
              {companyInitial}
            </Avatar>
            <Typography variant="subtitle2" noWrap>
              {row.company_name || 'N/A'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Typography variant="subtitle2" noWrap>
            {fDate(row.shift_date)}
          </Typography>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={row.timesheet_manager_photo_url || undefined}
              alt={row.timesheet_manager_name}
              sx={{ width: 32, height: 32 }}
            >
              {managerInitial}
            </Avatar>
            <Typography variant="subtitle2" noWrap>
              {row.timesheet_manager_name}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {missingWorkersText}
          </Typography>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          {missingWorkersCount > 0 && (
            <IconButton
              color={collapseRow.value ? 'inherit' : 'default'}
              onClick={collapseRow.onToggle}
              sx={{ ...(collapseRow.value && { bgcolor: 'action.hover' }) }}
            >
              <Iconify icon="eva:arrow-ios-downward-fill" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
    );
  }

  function renderSecondaryRow() {
    if (missingWorkersCount === 0) return null;

    return (
      <TableRow>
        <TableCell sx={{ p: 0, border: 'none' }} colSpan={8}>
          <Collapse
            in={collapseRow.value}
            timeout="auto"
            unmountOnExit
            sx={{ bgcolor: 'background.neutral' }}
          >
            <Paper
              sx={{
                m: 1.5,
                mb: 0.1,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              <Box
                sx={(theme) => ({
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: theme.spacing(1.5, 2, 1.5, 1.5),
                  borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                  '& .MuiListItemText-root': {
                    textAlign: 'center',
                  },
                })}
              >
                <ListItemText primary="Position" />
                <ListItemText primary="Employee" />
                <ListItemText primary="Start Time" />
                <ListItemText primary="End Time" />
              </Box>
            </Paper>
            <Paper sx={{ m: 1.5, mt: 0, mb: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              {row.missing_field_team_members.map((worker: MissingTimecard['missing_field_team_members'][0]) => {
                // Get first letter of first name for worker avatar
                const workerNameParts = worker.worker_name.split(' ');
                const workerInitial = workerNameParts[0]?.charAt(0)?.toUpperCase() || worker.worker_name.charAt(0)?.toUpperCase() || 'W';

                return (
                  <Box
                    key={worker.worker_id || worker.job_worker_id}
                    sx={(theme) => ({
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      alignItems: 'center',
                      p: theme.spacing(1.5, 2, 1.5, 1.5),
                      borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                      '& .MuiListItemText-root': {
                        textAlign: 'center',
                      },
                    })}
                  >
                    <ListItemText
                      primary={
                        JOB_POSITION_OPTIONS.find((option) => option.value === worker.position)?.label ||
                        worker.position ||
                        'N/A'
                      }
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        overflow: 'hidden',
                      }}
                    >
                      <Avatar
                        src={worker.worker_photo_url || undefined}
                        alt={worker.worker_name || 'Worker'}
                        sx={{ width: 32, height: 32, flexShrink: 0 }}
                      >
                        {workerInitial}
                      </Avatar>
                      <Typography variant="body2" noWrap>
                        {worker.worker_name || 'Unknown Worker'}
                      </Typography>
                      {worker.worker_id === row.timesheet_manager_id && (
                        <Chip
                          label="TM"
                          size="small"
                          color="info"
                          variant="soft"
                          sx={{ 
                            height: 18,
                            fontSize: '0.65rem',
                            px: 0.5,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Box>
                    <ListItemText
                      primary={worker.start_time ? fTime(worker.start_time) : 'N/A'}
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                    <ListItemText
                      primary={worker.end_time ? fTime(worker.end_time) : 'N/A'}
                      slotProps={{
                        primary: { sx: { typography: 'body2' } },
                      }}
                    />
                  </Box>
                );
              })}
            </Paper>
          </Collapse>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {renderPrimaryRow()}
      {renderSecondaryRow()}
    </>
  );
}
