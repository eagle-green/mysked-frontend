import type { TimesheetEntry } from 'src/types/job';

import { useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fDate, fTime } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { TimesheetManagerChangeDialog, TimesheetManagerSelectionDialog } from './template';

// ----------------------------------------------------------------------

type Props = {
  row: TimesheetEntry;
  onExportPDf: (data: any) => Promise<void>;
};

// Add a mapping for status display labels
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<string, 'info' | 'warning' | 'success' | 'error' | 'secondary'> = {
  draft: 'info',
  submitted: 'secondary',
  approved: 'success',
  rejected: 'error',
};

export function AdminTimesheetTableRow(props: Props) {
  const { row, onExportPDf } = props;
  const menuPopover = usePopover();

  // State for change manager functionality
  const [changeManagerDialog, setChangeManagerDialog] = useState({
    open: false,
    newManager: null as any,
  });
  const [managerSelectionDialog, setManagerSelectionDialog] = useState({
    open: false,
  });

  // Fetch job workers for manager selection
  const [jobWorkers, setJobWorkers] = useState<
    Array<{
      user_id: string;
      first_name: string;
      last_name: string;
      photo_url?: string;
      position: string;
    }>
  >([]);

  const fetchJobWorkers = useCallback(async () => {
    try {
      const response = await fetcher(`${endpoints.work.job}/${row.job.id}/workers`);
      if (response.success && response.data?.workers) {
        setJobWorkers(response.data.workers);
      } else {
        setJobWorkers([]);
      }
    } catch (error) {
      console.error('Error fetching job workers:', error);
      setJobWorkers([]);
    }
  }, [row.job.id]);

  const handleChangeManager = useCallback(() => {
    fetchJobWorkers();
    setManagerSelectionDialog({ open: true });
  }, [fetchJobWorkers]);

  const handleSelectNewManager = useCallback(
    (newManagerId: string) => {
      const newManager = jobWorkers.find((w) => w.user_id === newManagerId);
      if (newManager) {
        setChangeManagerDialog({
          open: true,
          newManager,
        });
        setManagerSelectionDialog({ open: false });
      }
    },
    [jobWorkers]
  );

  const handleConfirmChangeManager = useCallback(async () => {
    if (!changeManagerDialog.newManager) return;

    try {
      await fetcher([
        `${endpoints.timesheet.transfer.replace(':id', row.id)}`,
        {
          method: 'PUT',
          data: {
            timesheet_manager_id: changeManagerDialog.newManager.user_id,
          },
        },
      ]);

      toast.success('Timesheet manager changed successfully!');
      setChangeManagerDialog({ open: false, newManager: null });

      // Invalidate queries to refresh data instead of page reload
      // Note: This will refresh the table data without losing user's place
    } catch (error) {
      console.error('Error changing timesheet manager:', error);
      toast.error('Failed to change timesheet manager');
    }
  }, [changeManagerDialog.newManager, row.id]);

  const handleCloseChangeManager = useCallback(() => {
    setChangeManagerDialog({ open: false, newManager: null });
  }, []);

  function renderPrimaryRow() {
    return (
      <TableRow hover>
        {/* Removed checkbox since timesheets can only be deleted by deleting the job */}

        <TableCell>
          {row.id &&
          (row.status === 'submitted' || row.status === 'approved' || row.status === 'rejected') ? (
            <Link
              component={RouterLink}
              to={paths.work.job.timesheet.edit(row.id)}
              variant="subtitle2"
              sx={{
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              #{row.job.job_number}
            </Link>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              #{row.job.job_number}
            </Typography>
          )}
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
          <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={row.client.logo_url ?? undefined}
              alt={row.client.name}
              sx={{ width: 32, height: 32 }}
            >
              {row.client.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" noWrap>
              {row.client.name || null}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={row.company.logo_url ?? undefined}
              alt={row.company.name}
              sx={{ width: 32, height: 32 }}
            >
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
              <Avatar
                alt={`${row.timesheet_manager?.first_name} ${row.timesheet_manager?.last_name}`}
                sx={{ width: 32, height: 32 }}
              >
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Label
              variant="soft"
              color={STATUS_COLORS[row.status || 'draft']}
              sx={{ textTransform: 'capitalize' }}
            >
              {STATUS_LABELS[row.status || 'draft']}
            </Label>
          </Box>
        </TableCell>

        <TableCell align="right">
          <IconButton
            color={menuPopover.open ? 'inherit' : 'default'}
            onClick={menuPopover.onOpen}
            title="More options"
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
        {/* Change Manager - Only show tooltip when disabled */}
        {row.status !== 'draft' ? (
          <Tooltip
            title={
              row.status === 'submitted'
                ? 'Cannot change manager after timesheet is submitted'
                : row.status === 'approved'
                  ? 'Cannot change manager after timesheet is approved'
                  : 'Cannot change manager on rejected timesheets'
            }
            placement="left"
          >
            <span>
              {' '}
              {/* Wrapper to ensure tooltip works on disabled MenuItem */}
              <MenuItem
                onClick={() => {
                  menuPopover.onClose();
                }}
                disabled
              >
                <Iconify icon="solar:pen-bold" />
                Change Manager
              </MenuItem>
            </span>
          </Tooltip>
        ) : (
          <MenuItem
            onClick={() => {
              handleChangeManager();
              menuPopover.onClose();
            }}
            disabled={false}
          >
            <Iconify icon="solar:pen-bold" />
            Change Manager
          </MenuItem>
        )}

        {/* Export timesheet - Available for all statuses */}
        <MenuItem
          onClick={async () => {
            await onExportPDf(row);
            menuPopover.onClose();
          }}
          disabled={false}
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

      {/* Change Manager Selection Dialog */}
      <TimesheetManagerSelectionDialog
        open={managerSelectionDialog.open}
        onClose={() => setManagerSelectionDialog({ open: false })}
        onConfirm={handleSelectNewManager}
        currentManager={{
          id: row.timesheet_manager_id || '',
          name: row.timesheet_manager
            ? `${row.timesheet_manager.first_name} ${row.timesheet_manager.last_name}`
            : 'Unknown Manager',
          photo_url: null, // TimesheetManager doesn't have photo_url
        }}
        workerOptions={jobWorkers.map((worker) => ({
          value: worker.user_id,
          label: `${worker.first_name} ${worker.last_name}`,
          photo_url: worker.photo_url || '',
          first_name: worker.first_name,
          last_name: worker.last_name,
          position: worker.position,
        }))}
      />

      {/* Change Manager Confirmation Dialog */}
      <TimesheetManagerChangeDialog
        open={changeManagerDialog.open}
        onClose={handleCloseChangeManager}
        onConfirm={handleConfirmChangeManager}
        currentManager={{
          id: row.timesheet_manager_id || '',
          name: row.timesheet_manager
            ? `${row.timesheet_manager.first_name} ${row.timesheet_manager.last_name}`
            : 'Unknown Manager',
          photo_url: null, // TimesheetManager doesn't have photo_url
        }}
        newManager={
          changeManagerDialog.newManager
            ? {
                id: changeManagerDialog.newManager.user_id,
                name: `${changeManagerDialog.newManager.first_name} ${changeManagerDialog.newManager.last_name}`,
                photo_url: changeManagerDialog.newManager.photo_url || null,
              }
            : {
                id: '',
                name: '',
                photo_url: null,
              }
        }
      />
    </>
  );
}
