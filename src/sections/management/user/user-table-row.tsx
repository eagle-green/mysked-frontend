import type { IUser } from 'src/types/user';

import { useState } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { RouterLink } from 'src/routes/components';

import { formatPhoneNumberSimple } from 'src/utils/format-number';

import { roleList } from 'src/assets/data';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { UserQuickEditForm } from './user-quick-edit-form';
// ----------------------------------------------------------------------

type Props = {
  row: IUser;
  selected: boolean;
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  certificationStatus?: {
    isValid: boolean;
    missing: string[];
    expired: string[];
    hasMissing: boolean;
    hasExpired: boolean;
  };
};

export function UserTableRow({
  row,
  selected,
  editHref,
  onSelectRow,
  onDeleteRow,
  certificationStatus,
}: Props) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteRow();
    } finally {
      setIsDeleting(false);
      confirmDialog.onFalse();
    }
  };

  const renderQuickEditForm = () => (
    <UserQuickEditForm
      currentUser={row}
      open={quickEditForm.value}
      onClose={quickEditForm.onFalse}
      onUpdateSuccess={quickEditForm.onFalse}
    />
  );

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
        </li>

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <Dialog fullWidth maxWidth="xs" open={confirmDialog.value} onClose={confirmDialog.onFalse}>
      <DialogTitle sx={{ pb: 2 }}>Delete</DialogTitle>

      <DialogContent sx={{ typography: 'body2' }}>
        Are you sure want to delete{' '}
        <strong>
          {row.first_name} {row.last_name}
        </strong>
        ?
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          color="inherit"
          onClick={confirmDialog.onFalse}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <TableRow
        hover
        selected={selected}
        aria-checked={selected}
        tabIndex={-1}
        sx={(theme) => ({
          ...(certificationStatus &&
            !certificationStatus.isValid && {
              // Use CSS custom properties for dark mode aware colors
              backgroundColor: certificationStatus.hasExpired 
                ? 'rgba(var(--palette-error-mainChannel) / 0.12)'
                : 'rgba(var(--palette-warning-mainChannel) / 0.12)',
              // Force appropriate text color for better contrast
              color: 'var(--palette-text-primary)',
              '& .MuiTableCell-root': {
                color: 'var(--palette-text-primary)',
              },
              // Override name link colors for better contrast (but preserve email/phone links)
              '& .MuiTableCell-root:nth-of-type(2) a': {
                color: 'var(--palette-text-primary) !important',
                '&:hover': {
                  color: 'var(--palette-primary-main) !important',
                },
              },
              '&:hover': {
                backgroundColor: certificationStatus.hasExpired 
                  ? 'rgba(var(--palette-error-mainChannel) / 0.16)'
                  : 'rgba(var(--palette-warning-mainChannel) / 0.16)',
              },
              '&.Mui-selected': {
                backgroundColor: certificationStatus.hasExpired 
                  ? 'rgba(var(--palette-error-mainChannel) / 0.24)'
                  : 'rgba(var(--palette-warning-mainChannel) / 0.24)',
                color: 'var(--palette-common-white)',
                '& .MuiTableCell-root': {
                  color: 'var(--palette-common-white)',
                },
                '& .MuiTableCell-root:nth-of-type(2) a': {
                  color: 'var(--palette-common-white) !important',
                  '&:hover': {
                    color: 'var(--palette-grey-200) !important',
                  },
                },
                '&:hover': {
                  backgroundColor: certificationStatus.hasExpired 
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
            slotProps={{
              input: {
                id: `${row.id}-checkbox`,
                'aria-label': `${row.id} checkbox`,
              },
            }}
          />
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar src={row?.photo_url ?? undefined} alt={row?.first_name}>
              {row?.first_name?.charAt(0).toUpperCase()}
            </Avatar>

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link
                component={RouterLink}
                href={editHref}
                color="inherit"
                sx={{ cursor: 'pointer' }}
              >
                {`${row.first_name} ${row.last_name}`}
              </Link>
            </Stack>
          </Box>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {roleList.find((r) => r.value === row.role)?.label ?? row.role}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Link href={`tel:${row.phone_number}`} rel="noopener noreferrer" underline="hover">
            {formatPhoneNumberSimple(row.phone_number)}
          </Link>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Link href={`mailto:${row.email}`} rel="noopener noreferrer" underline="hover">
            {row.email}
          </Link>
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'active' && 'success') ||
              (row.status === 'inactive' && 'error') ||
              'default'
            }
          >
            {row.status}
          </Label>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Reserved space for certification status icon to maintain alignment */}
            <Box sx={{ width: 32, display: 'flex', justifyContent: 'center' }}>
              {certificationStatus && !certificationStatus.isValid && (
                <Tooltip
                  title={
                    <Box sx={{ fontSize: '14px', lineHeight: 1.4 }}>
                      <strong>
                        Certification {certificationStatus.hasExpired ? 'Expired' : 'Missing'}
                      </strong>
                      <br />
                      {[
                        ...(certificationStatus.missing.length > 0
                          ? [`Missing: ${certificationStatus.missing.join(', ')}`]
                          : []),
                        ...(certificationStatus.expired.length > 0
                          ? [`Expired: ${certificationStatus.expired.join(', ')}`]
                          : []),
                      ].join(' | ')}
                    </Box>
                  }
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
                      color: certificationStatus.hasExpired ? 'error.main' : 'warning.main',
                      '&:hover': {
                        backgroundColor: certificationStatus.hasExpired
                          ? 'error.lighter'
                          : 'warning.lighter',
                      },
                    }}
                  >
                    <Iconify
                      icon={
                        certificationStatus.hasExpired
                          ? 'solar:danger-bold'
                          : 'solar:info-circle-bold'
                      }
                      width={20}
                    />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Tooltip title="Quick Edit" placement="top" arrow>
              <IconButton
                color={quickEditForm.value ? 'inherit' : 'default'}
                onClick={quickEditForm.onTrue}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      {renderQuickEditForm()}
      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
