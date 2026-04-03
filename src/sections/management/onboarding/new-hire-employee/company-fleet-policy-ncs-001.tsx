import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

type Props = {
  open: boolean;
  onClose(): void;
  onSave(): void;
};
export function CompanyFleetPolicyNCS001({ open, onClose, onSave }: Props) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [acknowledge, SetAcknowledge] = useState<boolean>(false);

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose} fullScreen={isMobile}>
      <DialogTitle sx={{ pb: 2 }}>
        Company Fleet Policies - PRE TRIP & POST TRIP (EG-PO-FL-NCS-001)
      </DialogTitle>
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
        <Stack>
          <Typography variant="subtitle1">Pre-trip Policy</Typography>
          <Typography variant="subtitle2">
            It is a requirement of all Eagle Green LLP (EG) field employees who operate vehicles to
            complete a full written pre-trip report and post-trip report daily on all motorized
            vehicles and trailers. These reports meet the standards of your Provincial Motor Vehicle
            Act and National Safety Code, which states pre and post-trip reports are a legal
            requirement when operating commercially registered vehicles.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Employees changing vehicles or trailers throughout the day must complete a new pre-trip
            report for each unit.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Pre-trip reports are to be submitted at the end of every day to the designated In Box
            location. Superin tendents will ensure all employees operating vehicles are trained to
            competently carry out pre & post-trip inspections. Thorough inspections can be completed
            in less than 15 minutes by an individual.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            The employee acknowledges that he/she has been advised of this policy, has had an
            interactive pre-trip & post-trip inspection demonstrated to them, acknowledges this is a
            legal requirement to operate any vehicle, and is solely responsible for the vehicle
            being operated while performing their daily duties. The employee accepts all legal fines
            incurred due to vehicle deficiencies not reported on a pre-trip or post trip report will
            be the sole responsibility of the driver and will not be reimbursed by the Company.
          </Typography>
        </Stack>

        <Box
          sx={{
            bgcolor: 'divider',
            p: 1,
            borderRadius: 1,
            width: '100%',
          }}
        >
          <Field.Checkbox
            name="NCS_001"
            label="I have reviewed, understood, and agree to comply with all company policies and procedures as applicable."
            slotProps={{
              checkbox: {
                onChange: async (e, checked) => {
                  SetAcknowledge(checked);
                },
              },
            }}
          />
        </Box>
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
          disabled={!acknowledge}
        >
          Accept Agreement
        </Button>
      </DialogActions>
    </Dialog>
  );
}
