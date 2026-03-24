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
export function CompanyFleetPolicyGen003({ open, onClose, onSave }: Props) {
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
        Company Fleet Policies - USAGE (EG-PO-PO-FL-GEN-003 GPS)
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
            The purpose of this policy is to ensure all employees understand the acceptable usage of
            GPS and the information provided by it.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Policy</Typography>
          <Typography variant="subtitle2">
            This policy applies to all employees who operate company-owned equipment.
          </Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">Improve EG`s dispatch function.</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Enhance EG`s approach to safety as it relates to individuals who work alone or in
                remote locations.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Enhance EG`s approach to safety as it relates to speeding and accidents.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Improve EG`s Vehicle Maintenance Scheduling.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Introduce a theft deterrent and improve equipment recovery.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            To ensure all 5 objectives are being met, EG has granted access to GPS information to
            the following employees and management:
          </Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">General Superintendent</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">All area Superintendents</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">All area General Foreman</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">All area Dispatch function staff</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Fleet Manager and Fleet Support Staff</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Controller and support staff</Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            GPS information provided will be used to run reports, review vehicles` status and
            location, enter and record maintenance, dispatch work and general upkeep of the system.
            Any employee information recorded in the system will be governed by EG`s Privacy Policy
            and will be used strictly for business or safety purposes.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            While GPS information will be used on a daily basis and reviewed on a continuous basis
            it will not be used for the following reasons:
          </Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                To track an employee`s movement on an ongoing basis unless related to operational
                requirements.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                To monitor the ongoing usage of our leadership group`s off hours
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                To terminate or discipline an employee due to information obtained solely from GPS.
                GPS informa tion will however be used to document and support flagrant vehicle
                misUse or violations of policy.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Please note all decisions regarding discipline or termination are substantiated via
            other means before a decision of this nature is made.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Scope</Typography>
          <Typography variant="subtitle2">
            This policy applies to all employees who operate company-owned equipment.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Responsibility</Typography>
          <Typography variant="subtitle2">
            Employees - it is the employees` responsibility to Use both vehicles and GPS in the
            manner for which they were intended. Tampering with, deactivating or disciplinary
            action.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Employees are not to cover dual-facing cameras as it poses a security risk in case of an
            emergency
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Managers - it is the Manager`s responsibility to oversee the proper and consistent Use
            of GPS and GPS information
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">Definitions</Typography>
          <Typography variant="subtitle2">None</Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Reference</Typography>
          <Typography variant="subtitle2">EG - Privacy Policy</Typography>
          <Typography variant="subtitle2">EG - Use of Vehicle Policy</Typography>
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
