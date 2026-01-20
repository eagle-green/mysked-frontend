import dayjs from 'dayjs';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean, usePopover } from 'minimal-shared/hooks';
import { CustomPopover } from 'src/components/custom-popover';

import { TelusReportReviewDialog } from './telus-report-review-dialog';
import { TelusReportSendDialog } from './telus-report-send-dialog';
import { TelusReportDetailDialog } from './telus-report-detail-dialog';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  reportNumber: number | string;
  onDeleteRow: () => void;
};

export function TelusReportTableRow({ row, reportNumber, onDeleteRow }: Props) {
  const confirm = useBoolean();
  const reviewDialog = useBoolean();
  const sendDialog = useBoolean();
  const detailDialog = useBoolean();
  const popover = usePopover();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await onDeleteRow();
      confirm.onFalse();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [onDeleteRow, confirm]);

  const formatReportPeriod = () => {
    const start = dayjs(row.report_start_date).format('MMM D, YYYY');
    const end = dayjs(row.report_end_date).format('MMM D, YYYY');
    return start === end ? start : `${start} - ${end}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'info';
      case 'reviewed':
        return 'primary';
      case 'sent':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              cursor: 'pointer',
              color: 'primary.main',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
            onClick={() => detailDialog.onTrue()}
          >
            {reportNumber}
          </Typography>
        </TableCell>

        <TableCell>
          <Label color={row.report_type === 'daily' ? 'primary' : 'secondary'}>
            {row.report_type === 'daily' ? 'Daily' : 'Weekly'}
          </Label>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{formatReportPeriod()}</Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" fontWeight="600">
            {row.job_count}
          </Typography>
        </TableCell>

        <TableCell>
          <Label color={getStatusColor(row.status)}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </Label>
        </TableCell>

        <TableCell>
          {row.reviewed_by_user ? (
            <Stack spacing={0.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  src={row.reviewed_by_user.photo_url || undefined}
                  alt={`${row.reviewed_by_user.first_name} ${row.reviewed_by_user.last_name}`}
                  sx={{ width: 32, height: 32 }}
                >
                  {row.reviewed_by_user.first_name?.[0]}
                </Avatar>
                <Typography variant="body2" noWrap>
                  {row.reviewed_by_user.first_name} {row.reviewed_by_user.last_name}
                </Typography>
              </Stack>
              {row.reviewed_at && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {fDateTime(row.reviewed_at)}
                </Typography>
              )}
            </Stack>
          ) : null}
        </TableCell>

        <TableCell>
          {row.sent_by_user ? (
            <Stack spacing={0.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  src={row.sent_by_user.photo_url || undefined}
                  alt={`${row.sent_by_user.first_name} ${row.sent_by_user.last_name}`}
                  sx={{ width: 32, height: 32 }}
                >
                  {row.sent_by_user.first_name?.[0]}
                </Avatar>
                <Typography variant="body2" noWrap>
                  {row.sent_by_user.first_name} {row.sent_by_user.last_name}
                </Typography>
              </Stack>
              {row.sent_at && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {fDateTime(row.sent_at)}
                </Typography>
              )}
            </Stack>
          ) : null}
        </TableCell>

        <TableCell>
          {row.created_by_user ? (
            <Stack spacing={0.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  src={row.created_by_user.photo_url || undefined}
                  alt={`${row.created_by_user.first_name} ${row.created_by_user.last_name}`}
                  sx={{ width: 32, height: 32 }}
                >
                  {row.created_by_user.first_name?.[0]}
                </Avatar>
                <Typography variant="body2" noWrap>
                  {row.created_by_user.first_name} {row.created_by_user.last_name}
                </Typography>
              </Stack>
              {row.created_at && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {fDateTime(row.created_at)}
                </Typography>
              )}
            </Stack>
          ) : row.created_by === null ? (
            <Stack spacing={0.5}>
              <Typography variant="body2" fontWeight={600}>
                System
              </Typography>
              {row.created_at && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {fDateTime(row.created_at)}
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          )}
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          {row.status === 'draft' && (
            <MenuItem
              onClick={() => {
                reviewDialog.onTrue();
                popover.onClose();
              }}
            >
              <Iconify icon="solar:eye-bold" />
              Review Report
            </MenuItem>
          )}

          {row.status === 'reviewed' && (
            <MenuItem
              onClick={() => {
                sendDialog.onTrue();
                popover.onClose();
              }}
            >
              <Iconify icon="solar:letter-bold" />
              Send Report
            </MenuItem>
          )}

          {row.status === 'sent' && (
            <MenuItem
              onClick={() => {
                sendDialog.onTrue();
                popover.onClose();
              }}
            >
              <Iconify icon="solar:letter-bold" />
              Resend Report
            </MenuItem>
          )}

          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Report"
        content="Are you sure you want to delete this report? This action cannot be undone."
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />

      <TelusReportReviewDialog
        open={reviewDialog.value}
        onClose={reviewDialog.onFalse}
        report={row}
      />

      <TelusReportSendDialog
        open={sendDialog.value}
        onClose={sendDialog.onFalse}
        report={row}
      />

      <TelusReportDetailDialog
        open={detailDialog.value}
        onClose={detailDialog.onFalse}
        report={row}
      />
    </>
  );
}
