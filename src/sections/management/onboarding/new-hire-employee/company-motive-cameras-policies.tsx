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
export function CompanyMotiveCameras({ open, onClose, onSave }: Props) {
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
      <DialogTitle sx={{ pb: 2 }}>Eaglegreen Motive Cameras</DialogTitle>
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
        <Stack spacing={2} direction="column">
          <Typography variant="body1">
            Eaglegreen has installed new MotiveCameras to ensure the safety of all of our staff.
          </Typography>
          <Typography variant="body1">
            Motivecameras is to protect our business with accurate, real-time driver coaching and
            accident detection, on-the-spot exoneration evidence, and privacy protection.
          </Typography>

          <Typography variant="body1">
            Motive’s AI detects unsafe behaviors like cell phone use and close following with fewer
            false positives, alerting drivers in real-time. That means fewer accidents for the
            safety of our staff.
          </Typography>

          <Typography variant="body1">
            Advanced collision detection alerts managers of accidents with leading accuracy and
            speed. Motive’s latest model excels at catching severe collisions, such as jack-knifes
            and rollovers, enabling managers to quickly help drivers and kick off the insurance
            process.
          </Typography>

          <Typography variant="body1">
            As stated in the hiring package, the purpose of this policy is to ensure all employees
            understand the acceptable usage of GPS and the information provided by it.
          </Typography>

          <Typography variant="body1">
            While GPS information will be used on a daily basis and reviewed on a continuous basis
            it will not be used for the following reasons:
          </Typography>
        </Stack>

        <Card
          sx={{
            px: 4,
            py: 2,
            mb: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <li>
            <Typography variant="body1">
              Employees working on the road must ensure PPE (personal protective equipment) is worn
              at all times. Failure to do so will result in a verbal written warning.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Bullying and Harassment are strongly prohibited at Eaglegreen.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Employees are not permitted to use any electronic devices or headsets while working on
              the road. In cases of emergency, speak to LCT & Foremen and step aside, where you or
              others are not in danger.
            </Typography>
          </li>
        </Card>

        <Card
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'warning.lighter',
            borderLeft: 5,
            borderColor: 'warning.dark',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Typography variant="body1" color="warning.dark">
            As per new company rules, Motive cameras are not to be covered for any reason. HD video
            footage may be your only eyewitness when in an accident. Eaglegreen will use dashcam
            video to prove innocence and defend against litigation. Eaglegreen only has access to
            video footage when requested for safety purposes.
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
