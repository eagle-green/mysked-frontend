import type { TimesheetEntry } from 'src/types/job';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover/custom-popover';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { TimeSheetStatus } from 'src/types/timecard';

// ----------------------------------------------------------------------

type Props = {
  row: TimesheetEntry;
  selected: boolean;
  recordingLink: string;
  //   onDeleteRow: () => void;
};

export function TimeSheetTableRow(props: Props) {
  const { row, selected, recordingLink } = props;
  const menuActions = usePopover();
  const { user } = useAuthContext();
  const { job, client } = row;

  if (!row) return null;

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem
            component={RouterLink}
            href={recordingLink}
            onClick={() => menuActions.onClose()}
          >
            <Iconify icon="solar:pen-bold" />
            View/Edit
          </MenuItem>
        </li>
      </MenuList>
    </CustomPopover>
  );

  function renderPrimaryRow() {
    return (
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell>
          {row.timesheet_manager_id === user?.id ? (
            <Link
              component={RouterLink}
              href={recordingLink}
              color="inherit"
              sx={{ cursor: 'pointer' }}
            >
              {job.job_number}
            </Link>
          ) : (
            <Typography variant="body2" noWrap sx={{ color: 'text.disabled' }}>
              {job.job_number}
            </Typography>
          )}
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" noWrap>
              {row.site.name || 'N/A'}
            </Typography>
            {row.site.display_address && (
              <Box
                component="span"
                sx={{
                  color: 'text.disabled',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
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
                            row.site.unit_number,
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
                      >
                        {row.site.display_address}
                      </Link>
                    );
                  }
                  return <span>{row.site.display_address}</span>;
                })()}
              </Box>
            )}
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar src={client.logo_url ?? undefined} alt={client.name}>
              {client.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" noWrap>
              {client.name || 'N/A'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar src={row.company.logo_url ?? undefined} alt={row.company.name}>
              {row.company.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" noWrap>
              {row.company.name || 'N/A'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(job.start_time)}
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
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar alt={`${row.timesheet_manager.first_name} ${row.timesheet_manager.last_name}`}>
              {row.timesheet_manager.first_name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" noWrap>
              {`${row.timesheet_manager.first_name} ${row.timesheet_manager.last_name}`}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row?.status === TimeSheetStatus.DRAFT && 'info') ||
              (row?.status === TimeSheetStatus.SUBMITTED && 'secondary') ||
              (row?.status === TimeSheetStatus.APPROVED && 'success') ||
              (row?.status === TimeSheetStatus.REJECTED && 'error') ||
              'default'
            }
          >
            {row?.status}
          </Label>
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            {row?.confirmed_by ? (
              <>
                <Avatar alt={`${row.confirmed_by.first_name} ${row.confirmed_by.last_name}`}>
                  {row.confirmed_by.first_name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="body2" noWrap>
                  {`${row.confirmed_by.first_name} ${row.confirmed_by.last_name}`}
                </Typography>
              </>
            ) : null}
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {renderPrimaryRow()}
      {renderMenuActions()}
    </>
  );
}
