import { useState } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Alert,
  Dialog,
  Button,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useInventoryTypes } from 'src/hooks/use-inventory-types';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

interface DeleteInventoryTypeDialogProps {
  open: boolean;
  onClose: () => void;
  inventoryType: { id: string; value: string } | null;
  onInventoryTypeDeleted: () => void;
}

export function DeleteInventoryTypeDialog({
  open,
  onClose,
  inventoryType,
  onInventoryTypeDeleted,
}: DeleteInventoryTypeDialogProps) {
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteInventoryType } = useInventoryTypes();

  const formatTypeLabel = (value: string) =>
    value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const handleDelete = async () => {
    if (!inventoryType) return;

    setIsDeleting(true);
    setError('');

    try {
      await deleteInventoryType(inventoryType.id);
      toast.success('Inventory type deleted successfully!');
      onInventoryTypeDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete inventory type');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setError('');
    setIsDeleting(false);
    onClose();
  };

  if (!inventoryType) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Inventory Type</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Alert severity="warning" sx={{ mb: 2 }}>
            Deleting this inventory type will remove it from the list. If it&apos;s being used in existing inventory items, it will be deactivated instead.
          </Alert>
          <Typography>
            Are you sure you want to delete <strong>{formatTypeLabel(inventoryType.value)}</strong>?
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isDeleting}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleDelete}
          loading={isDeleting}
          variant="contained"
          color="error"
          startIcon={!isDeleting ? <Iconify icon="solar:trash-bin-trash-bold" width={18} /> : null}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
