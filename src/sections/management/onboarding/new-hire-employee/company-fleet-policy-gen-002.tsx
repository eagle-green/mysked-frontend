import { useCallback, useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { EmployeeType, RadioButtonValues, SalaryType, WorkSchedule } from 'src/types/new-hire';

import { SignatureDialog } from './signature';

type Props = {
  open: boolean;
  onClose(): void;
  onSave(): void;
};
export function CompanyFleetPolicyGen002({ open, onClose, onSave }: Props) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    setValue,
  } = useFormContext();

  // const isAgree = watch('company_hr_policy_eg_704');

  // console.log(isAgree);

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose} fullScreen={isMobile}>
      <DialogTitle sx={{ pb: 2 }}>
        Company Fleet Policies - Company Fuel Cards (EG-PO-PO-FL-GEN-002)
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
          <Typography variant="subtitle1">Purpose</Typography>
          <Typography variant="subtitle2">
            The purpose of this policy is to prevent and eliminate abusive company fuel card
            charges.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Policy</Typography>
          <Typography variant="subtitle2">
            This policy applies to all employees who have been issued company fuel cards from any of
            our suppliers to assist in the fulfilment of their respective duties and
            responsibilities. The following must be observed:
          </Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                Company fuel cards must be used for business purposes only. Under no circumstances
                should Company fuel cards be used for personal use. Personal use of fuel cards is
                considered theft and will result in immediate disciplinary action (which may include
                termination), along with the personal charges being rebilled to the employee plus a
                $10 administration fee.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Purchases on fuel cards should be limited to: Regular Gasoline, Low Sulphur Diesel,
                Car Wash, Motor Oil, Grease and other lubricants. Unless given specific written
                approval or direction only regular grade gasoline should be used. Individuals who
                purchase a higher-grade fuel without said approval or instruction will be personally
                responsible for the difference in fuel charges.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Fuel cards should not be transferred between employees unless specifically directed
                by a Superinten dent or equivalent. The transfer of fuel cards must then be
                communicated to the Fuel Card Administrator.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Upon change in employment responsibility or status (including termination) if you no
                longer require a fuel card you must return your fuel card to the local field support
                staff who will then notify the Fuel Card Administrator of the change in status.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                If a fuel card is lost or stolen it is the sole responsibility of the employee to
                contact the Fuel Card Administrator to advise them of the situation.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                All fuel card activations and deactivations will be done by the Fuel Card
                Administrator or Controller in his/her absence.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                All changes in fuel card limits should be made by the Superintendent or above on
                behalf of the employee, under no circumstances will a change in fuel card limits be
                processed upon request of the employee.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">Reference None</Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Please acknowledge below that you have received and read the above policy and understand
            that abuse or failure to follow the above policy may result in one or all of the
            following:
          </Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                An employee having to forfeit the company fuel card
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Have fuel charges rebilled to you and</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Pay a $10 administration fee for card replacement.
              </Typography>
            </li>
          </Stack>
        </Stack>

        {/* <Box
          sx={{
            bgcolor: 'divider',
            p: 1,
            borderRadius: 1,
            width: '100%',
          }}
        >
          <Controller
            name="company_hr_policy_eg_704"
            control={control}
            render={({ field }) => (
              <Field.Checkbox
                name="company_hr_policy_eg_704"
                label="By signing this policy, I confirm that I have read, understood and agree to abide by the information contained within."
                slotProps={{
                  checkbox: {
                    onChange: async (e, checked) => {
                      field.onChange(checked);
                      setTimeout(async () => {
                        const isValid = await trigger('company_hr_policy_eg_704');
                        if (isValid) {
                          clearErrors('company_hr_policy_eg_704');
                        }
                      }, 50);
                    },
                  },
                }}
              />
            )}
          />
        </Box> */}
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
