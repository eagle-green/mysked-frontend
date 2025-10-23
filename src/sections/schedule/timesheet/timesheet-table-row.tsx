import type { TimesheetEntry } from 'src/types/job';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { TimeSheetStatus } from 'src/types/timecard';

// ----------------------------------------------------------------------

type Props = {
  row: TimesheetEntry;
  selected: boolean;
  recordingLink: string;
  onJobNumberClick?: (e: React.MouseEvent) => void;
  //   onDeleteRow: () => void;
};

export function TimeSheetTableRow(props: Props) {
  const { row, selected, recordingLink, onJobNumberClick } = props;
  const { user } = useAuthContext();
  const { job, client } = row;

  if (!row) return null;

  function renderPrimaryRow() {
    return (
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell>
          {row.timesheet_manager_id === user?.id ? (
            onJobNumberClick ? (
              <Link
                component="button"
                variant="subtitle2"
                onClick={onJobNumberClick}
                sx={{
                  textDecoration: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                #{job.job_number}
              </Link>
            ) : (
              <Link
                component={RouterLink}
                href={recordingLink}
                variant="subtitle2"
                sx={{
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                #{job.job_number}
              </Link>
            )
          ) : (
            <Typography variant="body2" noWrap sx={{ color: 'text.disabled' }}>
              #{job.job_number}
            </Typography>
          )}
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" noWrap>
              {row.site.name}
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
          <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={client.logo_url ?? undefined}
              alt={client.name}
              sx={{ width: 32, height: 32 }}
            >
              {client.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" noWrap>
              {client.name}
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
          {row.timesheet_manager ? (
            <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
              <Avatar
                alt={`${row.timesheet_manager.first_name} ${row.timesheet_manager.last_name}`}
                sx={{ width: 32, height: 32 }}
              >
                {row.timesheet_manager.first_name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography variant="body2" noWrap>
                {`${row.timesheet_manager.first_name} ${row.timesheet_manager.last_name}`}
              </Typography>
            </Box>
          ) : null}
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row?.status === TimeSheetStatus.DRAFT && 'info') ||
              (row?.status === TimeSheetStatus.SUBMITTED && 'success') ||
              (row?.status === TimeSheetStatus.APPROVED && 'success') ||
              (row?.status === TimeSheetStatus.REJECTED && 'error') ||
              'default'
            }
          >
            {row?.status}
          </Label>
        </TableCell>
      </TableRow>
    );
  }

  return <>{renderPrimaryRow()}</>;
}
