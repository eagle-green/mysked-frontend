import type { TimesheetEntry } from 'src/types/job';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: TimesheetEntry;
  onExportPDf: (data: any) => Promise<void>;
  // Removed selection and delete props since timesheets can only be deleted by deleting the job
};

// Add a mapping for status display labels
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  holding: 'Holding',
};

const STATUS_COLORS: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
  draft: 'info',
  submitted: 'secondary',
  approved: 'success',
  holding: 'warning',
};

export function AdminTimesheetTableRow(props: Props) {
  const { row, onExportPDf } = props;

  const menuPopover = usePopover();

  // Removed delete functionality since timesheets can only be deleted by deleting the job

  function renderPrimaryRow() {
    return (
      <TableRow hover>
        {/* Removed checkbox since timesheets can only be deleted by deleting the job */}

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.job.job_number || null}
          </Typography>
        </TableCell>

        <TableCell>
          <Box sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Typography variant="body2" noWrap>
              {row.site.name || null}
            </Typography>
            {row.site.display_address && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
                {(() => {
                  const hasCompleteAddress =
                    !!row.site.street_number &&
                    !!row.site.street_name &&
                    !!row.site.city &&
                    !!row.site.province &&
                    !!row.site.postal_code &&
                    !!row.site.country;

                  if (hasCompleteAddress) {
                    return (
                      <Link
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          [
                            row.site.street_number,
                            row.site.street_name,
                            row.site.city,
                            row.site.province,
                            row.site.postal_code,
                            row.site.country,
                          ]
                            .filter(Boolean)
                            .join(', ')
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {row.site.display_address}
                      </Link>
                    );
                  }
                  // Show as plain text if not a complete address
                  return row.site.display_address;
                })()}
              </Typography>
            )}
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar src={row.client.logo_url ?? undefined} alt={row.client.name}>
              {row.client.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" noWrap>
              {row.client.name || null}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ gap:2, display: 'flex', alignItems: 'center' }}>
            <Avatar src={row.company.logo_url ?? undefined} alt={row.company.name}>
              {row.company.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" noWrap>
              {row.company.name || null}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5}>
            <Typography variant="body2" noWrap>
              {row.job.start_time ? fDate(row.job.start_time) : null}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
              {row.job.start_time ? fTime(row.job.start_time) : ''}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5}>
            <Typography variant="body2" noWrap>
              {row.job.end_time ? fDate(row.job.end_time) : null}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
              {row.job.end_time ? fTime(row.job.end_time) : ''}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>
          {row.status === 'draft' ? null : (
            <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
              <Avatar alt={`${row.timesheet_manager?.first_name} ${row.timesheet_manager?.last_name}`}>
                {row.timesheet_manager?.first_name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography variant="body2" noWrap>
                {row.timesheet_manager?.first_name && row.timesheet_manager?.last_name 
                  ? `${row.timesheet_manager.first_name} ${row.timesheet_manager.last_name}` 
                  : null}
              </Typography>
            </Box>
          )}
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={STATUS_COLORS[row.status || 'draft']}
            sx={{ textTransform: 'capitalize' }}
          >
            {STATUS_LABELS[row.status || 'draft']}
          </Label>
        </TableCell>

        <TableCell>
          {row.status === 'confirmed' && row.confirmed_by ? (
            <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
              <Avatar alt={`${row.confirmed_by?.first_name} ${row.confirmed_by?.last_name}`}>
                {row.confirmed_by?.first_name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography variant="body2" noWrap>
                {row.confirmed_by?.first_name && row.confirmed_by?.last_name 
                  ? `${row.confirmed_by.first_name} ${row.confirmed_by.last_name}` 
                  : null}
              </Typography>
            </Box>
          ) : null}
        </TableCell>

        <TableCell align="right">
          <IconButton 
            color={menuPopover.open ? 'inherit' : 'default'} 
            onClick={menuPopover.onOpen}
            // disabled={row.status !== 'approved'} // Only enable for approved timesheets
            title={row.status !== 'approved' ? 'Export only available for approved timesheets' : 'More options'}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }

  const renderMenuActions = () => (
    <CustomPopover
      open={menuPopover.open}
      anchorEl={menuPopover.anchorEl}
      onClose={menuPopover.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem
          onClick={async () => {
            // TODO: Implement export timesheet functionality
            await onExportPDf(row);
            menuPopover.onClose();
          }}
          disabled={row.status !== 'approved'} // Only enable for approved timesheets
        >
          <Iconify icon="solar:export-bold" />
          Export timesheet
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  // Removed confirm dialog since timesheets can only be deleted by deleting the job

  return (
    <>
      {renderPrimaryRow()}
      {renderMenuActions()}
      {/* Removed confirm dialog since timesheets can only be deleted by deleting the job */}
    </>
  );
}
