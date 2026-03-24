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
export function CompanyHumanResourcePolicy704({ open, onClose, onSave }: Props) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    setValue,
  } = useFormContext();

  // const isAgree = watch('policy_agreement.company_hr_policies_704');

  // console.log(isAgree);

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose} fullScreen={isMobile}>
      <DialogTitle sx={{ pb: 2 }}>
        Company Human Resource Policies - Bullying and Harassment (EG-PO-HR-704)
      </DialogTitle>
      <DialogContent
        sx={{
          typography: 'body2',
          height: isMobile ? 'calc(100vh - 200px)' : '80vh',
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
            Eaglegreen is committed to maintaining a safe and respectful workplace for all employees
            and contrac tors. Bullying and harassment of any kind, including verbal, physical, and
            electronic, will not be tolerated.
          </Typography>
        </Stack>
        <Stack>
          <Typography variant="subtitle1">Scope</Typography>
          <Typography variant="subtitle2">
            This policy applies to all employees, contractors, and subcontractors working for
            Eaglegreen, both on site and off-site, including in traffic management areas,
            construction zones, and offices.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Definition of Bullying and Harassment</Typography>
          <Typography variant="subtitle2">
            Bullying and Harassment include any unwanted behavior that creates an intimidating,
            hostile, or offensive work environment. Examples include:
          </Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                Verbal abuse (e.g., aggressive behavior, unwanted contact)
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Physical intimidation (e.g., aggressive behavior, unwanted contact)
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Exclusion or social isolation</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Bullying via electronic communication</Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            A single severe incident may also be considered harassment.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Employee Responsibilities</Typography>
          <Typography variant="subtitle2">All employees are expected to:</Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">Treat others with respect and courtesy</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Report any incidents of bullying or harassment immediately
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                {' '}
                Cooperate with investigations and support a respectful workplace{' '}
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Reporting and Investigation</Typography>
          <Typography variant="subtitle2">
            Employees should report any bullying or harassment to their supervisor, manager, or HR
            representative. All complaints will be investigated promptly, with confidentiality
            maintained. Employees will be informed of the outcome.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Consequences</Typography>
          <Typography variant="subtitle2">
            Employees found to have engaged in bullying or harassment may face:
          </Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2"> Warnings or counselling</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Suspension or demotion</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Termination in severe cases In cases of criminal behavior (e.g., assault), legal
                action may be pursued.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Confidentiality and Anti-Retaliation</Typography>
          <Typography variant="subtitle2">
            Reports and investigations will be handled confidentially. Retaliation against anyone
            who reports bullying or participates in an investigation is prohibited and will lead to
            disciplinary action.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Training and Support</Typography>
          <Typography variant="subtitle2">
            Eaglegreen will provide training to help employees understand bullying and harassment,
            and how to report it. Support is available through HR and your respective managers.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Policy Review </Typography>
          <Typography variant="subtitle2">
            This policy will be reviewed regularly for effectiveness and legal compliance.
          </Typography>
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
            name="policy_agreement.company_hr_policies_704"
            control={control}
            render={({ field }) => (
              <Field.Checkbox
                name="policy_agreement.company_hr_policies_704"
                label="By signing this policy, I confirm that I have read, understood and agree to abide by the information contained within."
                slotProps={{
                  checkbox: {
                    onChange: async (e, checked) => {
                      field.onChange(checked);
                      setTimeout(async () => {
                        const isValid = await trigger('policy_agreement.company_hr_policies_704');
                        if (isValid) {
                          clearErrors('policy_agreement.company_hr_policies_704');
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
