// timesheet-edit-view.tsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { Timesheet } from './types';

interface TimesheetEditViewProps {
  open: boolean;
  onClose: () => void;
  selectedItem: Timesheet | null;
}

export function TimesheetEditView({ open, onClose, selectedItem }: TimesheetEditViewProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Edit Timesheet</DialogTitle>
      <DialogContent dividers>
        {selectedItem ? <pre>{JSON.stringify(selectedItem, null, 2)}</pre> : <Typography>Loading...</Typography>}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="error">Reject</Button>
        <Button variant="outlined" color="success">Approve</Button>
        <Button onClick={onClose}>Back</Button>
      </DialogActions>
    </Dialog>
  );
}