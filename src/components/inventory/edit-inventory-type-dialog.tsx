import { useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Alert,
  Dialog,
  Button,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useInventoryTypes } from 'src/hooks/use-inventory-types';

import { toast } from 'src/components/snackbar';

interface EditInventoryTypeDialogProps {
  open: boolean;
  onClose: () => void;
  inventoryType: { id: string; value: string } | null;
  onInventoryTypeUpdated: (type: { id: string; value: string }) => void;
}

export function EditInventoryTypeDialog({
  open,
  onClose,
  inventoryType,
  onInventoryTypeUpdated,
}: EditInventoryTypeDialogProps) {
  const [typeName, setTypeName] = useState('');
  const [error, setError] = useState('');
  const { updateInventoryType } = useInventoryTypes();
  const [isUpdating, setIsUpdating] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open && inventoryType) {
      setTypeName('');
      setError('');
      setIsUpdating(false);
    }
  }, [open, inventoryType]);

  // Initialize form when inventory type changes
  useEffect(() => {
    if (inventoryType) {
      // Format the value back to readable format (convert snake_case to Title Case)
      const formattedName = inventoryType.value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setTypeName(formattedName);
      setError('');
    }
  }, [inventoryType]);

  const handleUpdate = async () => {
    if (!inventoryType) return;

    if (!typeName.trim()) {
      setError('Type name is required');
      return;
    }

    setError('');
    setIsUpdating(true);

    try {
      const updatedType = await updateInventoryType(inventoryType.id, typeName.trim());
      onInventoryTypeUpdated({ id: updatedType.id, value: updatedType.value });
      toast.success('Inventory type updated successfully!');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update inventory type');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setTypeName('');
    setError('');
    setIsUpdating(false);
    onClose();
  };

  if (!inventoryType) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Inventory Type</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Inventory Type"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUpdate()}
            disabled={isUpdating}
            placeholder="e.g., Channelizer, Sandbag, Trailer"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isUpdating}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleUpdate}
          loading={isUpdating}
          variant="contained"
        >
          Save Changes
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
