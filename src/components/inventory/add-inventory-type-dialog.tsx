import { useState } from 'react';

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

interface AddInventoryTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onInventoryTypeAdded: (type: { id: string; value: string }) => void;
  onCancel: () => void;
}

export function AddInventoryTypeDialog({
  open,
  onClose,
  onInventoryTypeAdded,
  onCancel,
}: AddInventoryTypeDialogProps) {
  const [typeName, setTypeName] = useState('');
  const [error, setError] = useState('');
  const { addNew, loading } = useInventoryTypes();

  const handleSubmit = async () => {
    if (!typeName.trim()) {
      setError('Type name is required');
      return;
    }

    setError('');

    try {
      const newType = await addNew(typeName.trim());
      onInventoryTypeAdded({ id: newType.id, value: newType.value });
      setTypeName('');
      toast.success('Inventory type added successfully!');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inventory type');
    }
  };

  const handleClose = () => {
    setTypeName('');
    setError('');
    onCancel();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Inventory Type</DialogTitle>
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
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={loading}
            placeholder="e.g., Channelizer, Sandbag, Trailer"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <LoadingButton onClick={handleSubmit} loading={loading} variant="contained">
          Add Type
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

