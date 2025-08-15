import type { ISiteItem } from 'src/types/site';

import { useState, useCallback } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { SiteQuickEditForm } from './site-quick-edit-form';

// ----------------------------------------------------------------------

type Props = {
  row: ISiteItem;
  selected: boolean;
  editHref: string;
  onEditRow: VoidFunction;
  onSelectRow: VoidFunction;
  onDeleteRow: VoidFunction;
};

export function SiteTableRow({ row, selected, editHref, onEditRow, onSelectRow, onDeleteRow }: Props) {
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();
  const menuActions = usePopover();
  const [isDeleting, setIsDeleting] = useState(false);



  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDeleteRow();
      confirmDialog.onFalse();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [onDeleteRow, confirmDialog]);

  const renderQuickEditForm = () => (
    <SiteQuickEditForm
      currentSite={row}
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

        {/* Only show delete button if status is inactive */}
        {row.status === 'inactive' && (
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
        )}


      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <Dialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Delete Site</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{row.name}</strong>?
      </DialogContent>
      <DialogActions>
        <Button
          onClick={confirmDialog.onFalse}
          disabled={isDeleting}
          sx={{ mr: 1 }}
        >
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
            disabled={row.status !== 'inactive'}
            sx={{
              opacity: row.status !== 'inactive' ? 0.5 : 1,
              cursor: row.status !== 'inactive' ? 'not-allowed' : 'pointer',
            }}
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

        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar src={row.company_logo_url ?? undefined} alt={row.company_name}>
              {row.company_name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Typography variant="body2">
                {row.company_name || 'N/A'}
              </Typography>
            </Stack>
          </Box>
        </TableCell>

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
                  {row.display_address || `${row.city}, ${row.province}`}
                </Link>
              );
            }
            // Show as plain text if not a complete address
            return <span>{row.display_address || `${row.city}, ${row.province}`}</span>;
          })()}
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

      {renderMenuActions()}
      {renderQuickEditForm()}
      {renderConfirmDialog()}
    </>
  );
} 