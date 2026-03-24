import { useCallback, useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { Controller, useFormContext } from 'react-hook-form';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Iconify } from 'src/components/iconify/iconify';

type Props = {
  open: boolean;
  onClose(): void;
  onSave(): void;
};
export function SafetyProtocolPolicies({ open, onClose, onSave }: Props) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    setValue,
    getValues,
  } = useFormContext();

  const { employee } = getValues();

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose} fullScreen={isMobile}>
      <DialogTitle sx={{ pb: 2 }}>Eaglegreen Safety Protocols</DialogTitle>
      <DialogContent
        sx={{
          typography: 'body2',
          height: isMobile ? 'calc(100vh - 200px)' : 'auto',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          px: 3,
          gap: 2,
        }}
      >
        <Card
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'primary.lighter',
            borderLeft: 5,
            borderColor: 'primary.dark',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Typography variant="body1" color="primary.dark">
            I, {`${employee.last_name}, ${employee.first_name}`}, I acknowledge receipt of the
            following package provided by Eagle Green to ensure that safe work practices are
            implemented and adhered to.
          </Typography>
          <Typography variant="body1" color="primary.dark">
            I understand that safe work practices are detailed methods outlining how to perform
            tasks with minimal risk to people, equipment, materials, the environment, and processes.
            I recognize that these protocols are established to ensure my safety and well-being
            while on the job.
          </Typography>

          <Typography variant="body1" color="primary.dark">
            Additionally, I acknowledge that I have received and reviewed a copy of the Eagle Green
            Safety Manual. I understand and agree to abide by the policies and procedures outlined
            therein to maintain a safe working environment.
          </Typography>

          <Typography variant="body1" color="primary.dark">
            I further acknowledge that Eagle Green is officially COR-certified, and it is my
            responsibility to ensure that daily operations comply with COR standards.
          </Typography>
        </Card>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={() => onClose()}>
          Close
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => {
            onSave();
            onClose();
          }}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          Accept Agreement
        </Button>
      </DialogActions>
    </Dialog>
  );
}
