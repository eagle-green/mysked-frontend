import type { ICompanyItem } from 'src/types/company';

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

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { CompanyQuickEditForm } from './company-quick-edit-form';

// ----------------------------------------------------------------------

type Props = {
  row: ICompanyItem;
  selected: boolean;
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => Promise<void>;
};

export function CompanyTableRow({ row, selected, editHref, onSelectRow, onDeleteRow }: Props) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteRow();
      confirmDialog.onFalse();
    } finally {
      setIsDeleting(false);
    }
  };

  const renderQuickEditForm = () => (
    <CompanyQuickEditForm
      currentCompany={row}
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
        <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>

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
    <Dialog open={confirmDialog.value} onClose={confirmDialog.onFalse} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Company</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{row.name}</strong>?
      </DialogContent>
      <DialogActions>
        <Button onClick={confirmDialog.onFalse} disabled={isDeleting} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} /> : null}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
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

        <TableCell sx={{ whiteSpace: 'normal' }}>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar src={row?.logo_url ?? undefined} alt={row?.name}>
              {row?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link
                component={RouterLink}
                href={editHref}
                color="inherit"
                sx={{ cursor: 'pointer' }}
              >
                {row.name}
              </Link>
            </Stack>
          </Box>
        </TableCell>
        <TableCell>{row.region}</TableCell>

        {/* <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {[
            row.unit_number,
            row.street_number,
            row.street_name,
            row.city,
            row.province,
            row.country,
            row.postal_code,
          ]
            .filter(Boolean) // removes null/undefined/empty string
            .join(', ')}
        </TableCell> */}

        <TableCell>
          {(() => {
            const hasCompleteAddress =
              !!row.street_number &&
              !!row.street_name &&
              !!row.city &&
              !!row.province &&
              !!row.postal_code &&
              !!row.country;

            if (hasCompleteAddress) {
              return (
                <Link
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    [
                      row.unit_number,
                      row.street_number,
                      row.street_name,
                      row.city,
                      row.province,
                      row.postal_code,
                      row.country,
                    ]
                      .filter(Boolean)
                      .join(', ')
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                >
                  {row.display_address || 'N/A'}
                </Link>
              );
            }
            // Show as plain text if not a complete address
            return <span>{row.display_address || 'N/A'}</span>;
          })()}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Link href={`tel:${row.contact_number}`} rel="noopener noreferrer" underline="hover">
            {formatPhoneNumberSimple(row.contact_number)}
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
              (row.status === 'inactive' && 'warning') ||
              'default'
            }
          >
            {row.status}
          </Label>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
