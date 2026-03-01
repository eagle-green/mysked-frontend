import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

export function PayrollDirectDepositForm() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    setValue,
  } = useFormContext();

  const currentEmployeeSignature = watch('employee.signature');
  const authorized = watch('payroll_consent');
  return (
    <>
      <Stack>
        <Typography variant="h4">Payroll Direct Deposit</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />

      <Card
        sx={{
          p: 2,
          mb: 3,
          bgcolor: 'primary.lighter',
          borderLeft: 5,
          borderColor: 'primary.dark',
        }}
      >
        <Typography variant="body2" color="primary.dark">
          You must submit one of these documents in order for your payroll to be processed.
        </Typography>
      </Card>

      <Box
        sx={{
          backgroundColor: 'divider',
          p: 1,
          borderRadius: 1,
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
        <Box
          sx={{
            border: 2,
            borderColor: 'divider',
            borderStyle: 'dashed',
            borderRadius: 1,
            p: 4,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <Iconify
            icon="solar:gallery-add-bold"
            width={48}
            height={48}
            sx={{ mb: 2, opacity: 0.5 }}
          />
          <Typography variant="body2">
            PLEASE ATTACH A VOID CHEQUE OR A DIRECT DEPOSIT LETTER FROM YOUR BANK
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr',
        }}
      >
        <Box
          sx={{
            bgcolor: 'divider',
            py: 2,
            px: 1,
            borderRadius: 1,
          }}
        >
          <Controller
            name="payroll_consent"
            control={control}
            render={({ field }) => (
              <Field.Checkbox
                name="payroll_consent"
                label="I confirm that the direct deposit details provided above are correct."
                slotProps={{
                  checkbox: {
                    onChange: async (e, checked) => {
                      field.onChange(checked);
                      setTimeout(async () => {
                        const isValid = await trigger('payroll_consent');
                        if (isValid) {
                          clearErrors('payroll_consent');
                        }
                      }, 50);
                    },
                  },
                }}
              />
            )}
          />
        </Box>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      {currentEmployeeSignature && authorized && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: { xs: 'center', md: 'flex-end' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 5,
            mt: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Box>
              <img src={currentEmployeeSignature} alt="Employee Signature" />
            </Box>
            <Typography variant="subtitle1">EMPLOYEE’S SIGNATURE</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              (Signature Over Printed Name)
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle1">09/20/2023</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              (Date Signed)
            </Typography>
          </Box>
        </Box>
      )}
    </>
  );
}
