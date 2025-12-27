import { useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Alert,
  Dialog,
  Button,
  Divider,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useEquipment } from 'src/hooks/use-equipment';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

interface EditEquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  equipment: { id: string; value: string } | null;
  onEquipmentUpdated: (equipment: { id: string; value: string }) => void;
  onEquipmentDeleted: () => void;
}

export function EditEquipmentDialog({ 
  open, 
  onClose, 
  equipment, 
  onEquipmentUpdated,
  onEquipmentDeleted 
}: EditEquipmentDialogProps) {
  const [equipmentName, setEquipmentName] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { updateEquipment, deleteEquipment } = useEquipment();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!open && equipment) {
      setEquipmentName('');
      setError('');
      setIsDeleting(false);
      setIsUpdating(false);
    }
  }, [open, equipment]);

  // Initialize form when equipment changes
  useEffect(() => {
    if (equipment) {
      // Format the value back to readable format (convert snake_case to Title Case)
      const formattedName = equipment.value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setEquipmentName(formattedName);
      setError('');
    }
  }, [equipment]);

  const handleUpdate = async () => {
    if (!equipment) return;
    
    if (!equipmentName.trim()) {
      setError('Equipment name is required');
      return;
    }

    setError('');
    setIsUpdating(true);

    try {
      const updatedEquipment = await updateEquipment(equipment.id, equipmentName.trim());
      onEquipmentUpdated({ id: updatedEquipment.id, value: updatedEquipment.value });
      toast.success('Equipment type updated successfully!');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update equipment type');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!equipment) return;

    setIsDeleting(true);
    try {
      await deleteEquipment(equipment.id);
      toast.success('Equipment type deleted successfully!');
      onEquipmentDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete equipment type');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setEquipmentName('');
    setError('');
    setIsDeleting(false);
    setIsUpdating(false);
    onClose();
  };

  if (!equipment) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Equipment Type</DialogTitle>
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
            onKeyPress={(e) => e.key === 'Enter' && handleUpdate()}
            disabled={isUpdating || isDeleting}
            placeholder="e.g., Arrowboard Trailer, Mobilization"
            sx={{ mb: 3 }}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mt: 3 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Deleting this equipment type will remove it from the list. If it&apos;s being used in existing jobs, it will be deactivated instead.
            </Alert>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              disabled={isUpdating || isDeleting}
              fullWidth
              startIcon={isDeleting ? null : <Iconify icon="solar:trash-bin-trash-bold" width={18} />}
            >
              {isDeleting ? 'Deleting...' : 'Delete Equipment Type'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isUpdating || isDeleting}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleUpdate}
          loading={isUpdating}
          variant="contained"
          disabled={isDeleting}
        >
          Save Changes
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

