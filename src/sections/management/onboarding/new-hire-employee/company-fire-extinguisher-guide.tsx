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
export function CompanyFireExtinguisherGuide({ open, onClose, onSave }: Props) {
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
      <DialogTitle sx={{ pb: 2 }}>Company Fire Extiguisher Guide</DialogTitle>
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
          <Typography variant="subtitle2">
            It is essential to periodically check your fire extinguisher because it is an essential
            item to have in your home. There are numerous things you may do to avoid being reactive
            and instead be proactive.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            You can do the following to make sure your fire extinguisher is still functional:
          </Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">Always verify the expiration date.</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Look at the pressure gauge.</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Call the manufacturer to inquire</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Look for dents or other damage on the fire extinguisher.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Check the rubber fire extinguisher hose for fractures or tears.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Look for any missing pieces.</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Your fire extinguisher`s manufacturing date can be found at the bottom.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Get a professional to inspect the fire extinguisher.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Recharge your fire extinguisher if it is one that can.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Check the expiration date frequently. The simplest thing you can do is to check the
            expiration date. Every fire extinguisher ought to carry an expiration date so that you
            know when to discard it. Like most objects, the chemicals inside have an expi ration
            date.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Along with the usage instructions, the expiration date ought to be printed on the
            bottle`s side. If the item does not have an expiration date, there may be a tag that
            indicates when it was last serviced. You will need to either get a new one or have it
            serviced if it hasn`t been maintained in the last ten years.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            On occasion, the bottom of the bottle will reveal the year it was made. There may even
            be a rec ommendation for when you should replace it in the instructions. For
            instructions, always read the directions.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Manufacturers claim that their extinguishers last anywhere from 5 to 15 years, or on
            average 12 years, if there is no expiration date.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Verify the pressure gauge.</Typography>
          <Typography variant="subtitle2">
            If your fire extinguisher needs servicing, the pressure gauge can let you know. You can
            proceed if the arrow is in green.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            If it is empty, you might wish to have another f ire extinguisher available or get it
            filled. You might not have enough depending on the size to put out a bigger fire. Always
            err on the side of caution.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            It`s time to get the pressure gauge filled with air or to replace it when it reads red
            or zero. No pressure might mean several things:
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            The bottle is empty of any additional dry chemicals.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            If there are any chemicals, they cannot be sprayed. a broken bottle.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Make careful to replace this right away in case of an emergency.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Get the fire extinguisher serviced or replaced if you have any reason to believe the
            pressure gauge is damaged.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Replace the bottle if the meter`s glass is cracked. An inaccurate pressure gauge might
            cause significant problems.
          </Typography>
        </Stack>
        {/* <Box
          sx={{
            bgcolor: 'divider',
            p: 1,
            borderRadius: 1,
            width: '100%',
            mt: 2,
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
