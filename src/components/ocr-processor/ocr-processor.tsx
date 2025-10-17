import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { isOCRSupported } from 'src/utils/ocr-utils';

import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { RHFDatePicker } from 'src/components/hook-form/rhf-date-picker';

// ----------------------------------------------------------------------

interface OCRProcessorProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (expirationDate: string) => void;
  file: File | null;
  documentType: string;
  ocrText?: string;
  extractedDate?: string;
}

export function OCRProcessor({
  open,
  onClose,
  onConfirm,
  file,
  documentType,
  ocrText = '',
  extractedDate = '',
}: OCRProcessorProps) {
  const [manualDate, setManualDate] = useState<string>(extractedDate);
  const [preservedDate, setPreservedDate] = useState<string>(extractedDate);

  const methods = useForm({
    defaultValues: {
      expiration_date: extractedDate,
    },
  });

  // Update manualDate when extractedDate prop changes OR when dialog opens with preserved date
  React.useEffect(() => {
    if (extractedDate) {
      setManualDate(extractedDate);
      methods.setValue('expiration_date', extractedDate);
      setPreservedDate(extractedDate);
    } else if (open && preservedDate) {
      // Restore preserved date when dialog reopens
      setManualDate(preservedDate);
      methods.setValue('expiration_date', preservedDate);
    }
  }, [extractedDate, open, preservedDate, methods]);

  const handleConfirm = () => {
    const formData = methods.getValues();
    const finalDate = formData.expiration_date || manualDate;
    if (finalDate) {
      onConfirm(finalDate);
      // Clear preserved date after successful confirmation
      setPreservedDate('');
      setManualDate('');
      methods.reset();
      onClose();
    }
  };

  const handleClose = () => {
    // Preserve the current date before closing
    const currentDate = methods.getValues().expiration_date || manualDate;
    if (currentDate) {
      setPreservedDate(currentDate);
    }
    onClose();
  };



  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:file-text-bold" />
          <Typography variant="h6">Confirm Expiration Date from {documentType}</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {!isOCRSupported() && (
            <Alert severity="warning">
              OCR is not supported in this browser. Please enter the expiration date manually.
            </Alert>
          )}

          {extractedDate && (
            <Alert severity="success">
              <Typography variant="body2">
                Expiration date found: <strong>{(() => {
                  // Parse YYYY-MM-DD format directly to avoid timezone issues
                  const [year, month, day] = extractedDate.split('-');
                  return `${month}/${day}/${year}`;
                })()}</strong>
              </Typography>
            </Alert>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Expiration Date
            </Typography>
            <Form methods={methods}>
              <RHFDatePicker
                name="expiration_date"
                label="Expiration Date"
                disablePast
                slotProps={{
                  textField: {
                    placeholder: 'Enter or confirm expiration date',
                  },
                }}
                value={manualDate ? dayjs(manualDate) : null}
                onChange={(date: Dayjs | null) =>
                  setManualDate(date ? date.format('YYYY-MM-DD') : '')
                }
              />
            </Form>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              You can edit the extracted date or enter it manually if needed.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!manualDate}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          Confirm Date
        </Button>
      </DialogActions>
    </Dialog>
  );
}
