import type { IInventoryItem } from 'src/types/inventory';

import { useState } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IInventoryItem;
  editHref: string;
  detailHref: string;
  onDeleteRow: () => Promise<void>;
};

export function InventoryTableRow({ row, editHref, detailHref, onDeleteRow }: Props) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const imageUrl = row.cover_url || row.coverUrl;
  const hasImage = imageUrl && imageUrl.trim() !== '' && !imageError;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteRow();
      confirmDialog.onFalse();
    } finally {
      setIsDeleting(false);
    }
  };

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
    <Dialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Delete Inventory Item</DialogTitle>
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
      <TableRow hover tabIndex={-1}>
        {/* Product Name */}
        <TableCell>
          <Box
            sx={{
              gap: 2,
              width: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {hasImage ? (
              <Box
                component="img"
                src={imageUrl}
                alt={row.name}
                onError={() => setImageError(true)}
                sx={{
                  width: 64,
                  height: 64,
                  flexShrink: 0,
                  borderRadius: 1,
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                }}
              >
                <Box
                  component="svg"
                  xmlns="http://www.w3.org/2000/svg"
                  width={32}
                  height={32}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  sx={{ color: 'text.disabled' }}
                >
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </Box>
              </Box>
            )}

            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Link component={RouterLink} href={detailHref} color="inherit">
                    {row.name}
                  </Link>
                  {row.lct && (
                    <Label variant="soft" color="primary" sx={{ flexShrink: 0 }}>
                      LCT
                    </Label>
                  )}
                  {row.hwy && (
                    <Label variant="soft" color="error" sx={{ flexShrink: 0 }}>
                      HWY
                    </Label>
                  )}
                  {row.billable && (
                    <Tooltip title="Billable Item" arrow placement="top">
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: 'success.lighter',
                          color: 'success.main',
                          flexShrink: 0,
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                        }}
                      >
                        $
                      </Box>
                    </Tooltip>
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                  {row.typical_application && (
                    <Box component="span" sx={{ typography: 'caption', color: 'text.disabled' }}>
                      {row.typical_application}
                    </Box>
                  )}
                  {row.sku && (
                    <Box component="span" sx={{ typography: 'caption', color: 'text.disabled' }}>
                      SKU: {row.sku}
                    </Box>
                  )}
                </Box>
              }
              slotProps={{
                primary: { noWrap: false },
              }}
            />
          </Box>
        </TableCell>

        {/* Type */}
        <TableCell>
          <Box sx={{ typography: 'body2' }}>
            {row.type 
              ? row.type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
              : '-'
            }
          </Box>
        </TableCell>

        {/* Quantity */}
        <TableCell>
          <Box sx={{ typography: 'body2', fontWeight: 500 }}>
            {row.quantity || 0}
          </Box>
        </TableCell>

        {/* Actions */}
        <TableCell>
          <IconButton
            color={menuActions.open ? 'inherit' : 'default'}
            onClick={menuActions.onOpen}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}

