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

import { useEquipment } from 'src/hooks/use-equipment';

import { toast } from 'src/components/snackbar';

interface AddEquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onEquipmentAdded: (equipment: { id: string; value: string }) => void;
  onCancel: () => void;
}

export function AddEquipmentDialog({ open, onClose, onEquipmentAdded, onCancel }: AddEquipmentDialogProps) {
  const [equipmentName, setEquipmentName] = useState('');
  const [error, setError] = useState('');
  const { addNew, loading } = useEquipment();

  const handleSubmit = async () => {
    if (!equipmentName.trim()) {
      setError('Equipment name is required');
      return;
    }

    setError('');

    try {
      const newEquipment = await addNew(equipmentName.trim());
      onEquipmentAdded({ id: newEquipment.id, value: newEquipment.value });
      setEquipmentName('');
      toast.success('Equipment type added successfully!');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create equipment type');
    }
  };

  const handleClose = () => {
    setEquipmentName('');
    setError('');
    onCancel();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Equipment Type</DialogTitle>
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
            label="Equipment Type"
            value={equipmentName}
            onChange={(e) => setEquipmentName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={loading}
            placeholder="e.g., Arrowboard Trailer, Mobilization"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleSubmit}
          loading={loading}
          variant="contained"
        >
          Add Equipment
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

