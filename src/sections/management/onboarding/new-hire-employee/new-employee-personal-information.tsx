import { useCallback, useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { SignatureDialog } from './signature';

export function NewEmployeePersonalInformation() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    setValue,
  } = useFormContext();

  const [currentEmployeeSignature, setCurrentEmployeeSignature] = useState<string | null>(null);
  const [authorizePersonSignature, setAuthorizePersonSignature] = useState<string | null>(null);
  const signatureDialog = useBoolean();

  // Handle initial signature
  const handleInitialSignature = useCallback(
    (signature: string) => {
      if (signature) {
        signatureDialog.onFalse();
        setCurrentEmployeeSignature(signature);
      }
    },
    [currentEmployeeSignature, signatureDialog]
  );

  const authorized = watch('information_consent');

  return (
    <>
      <Stack>
        <Typography variant="h4">Employee Personal Information</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
        }}
      >
        <Field.Text name="employee.last_name" label="Last Name*" />
        <Field.Text name="employee.first_name" label="First Name*" />
        <Field.Text name="employee.middle_initial" label="Initial*" />
        <Field.Text name="employee.sin" label="SIN*" />
        <Field.DatePicker
          name="employee.date_of_birth"
          label="Date of Birth"
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />
        <Stack
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 1,
            px: 2,
          }}
        >
          <Typography variant="body2">Gender</Typography>
          <Controller
            control={control}
            name="employee.gender"
            render={({ field }) => (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  width: 1,
                }}
              >
                <Field.RadioGroup
                  {...field}
                  row
                  sx={{ width: 1, display: 'flex', justifyContent: 'space-between' }}
                  options={[
                    { label: 'Male', value: 'male' },
                    { label: 'Female', value: 'female' },
                    { label: 'Other', value: 'N/A' },
                  ]}
                />
              </Box>
            )}
          />
        </Stack>
      </Box>
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(1, 1fr)' },
        }}
      >
        <Field.Text name="employee.address" label="Address*" multiline rows={2} fullWidth />
      </Box>
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
        }}
      >
        <Field.Text name="employee.city" label="Town/City*" />
        <Field.Text name="employee.province" label="Province*" />
        <Field.Text name="employee.postal_code" label="Postal Code*" />

        <Field.Text name="employee.home_phone_no" label="Home Phone#*" />
        <Field.Text name="employee.cell_no" label="Cellphone#*" />
        <Field.Text name="employee.email_address" label="Personal Email Address*" />
      </Box>

      <Field.Text
        name="employee.medical_allergies"
        label="Allergies / Medical Allerts"
        multiline
        rows={2}
        fullWidth
      />

      <Stack>
        <Typography variant="h4">Emergency Contact Information </Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
        }}
      >
        <Field.Text name="emergency_contact.last_name" label="Last Name*" />
        <Field.Text name="emergency_contact.first_name" label="First Name*" />
        <Field.Text name="emergency_contact.middle_initial" label="Middle Initial*" />

        <Field.Text name="emergency_contact.address" label="Address*" />
        <Field.Text name="emergency_contact.city" label="City/Province*" />
        <Field.Text name="emergency_contact.postal_code" label="Postal Code*" />

        <Field.Text name="emergency_contact.phone_no" label="Home Phone*" />
        <Field.Text name="emergency_contact.cell_no" label="Cell phone*" />
        <Field.Text name="emergency_contact.relationship" label="Relationship*" />
      </Box>

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
          You must submit one of these two documents in order for your payroll to be processed.
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
            name="information_consent"
            control={control}
            render={({ field }) => (
              <Field.Checkbox
                name="information_consent"
                label="I authorize Eagle Green (EG) to use my personal information including my signature and images in its website, newsletters, social media, and other official materials."
                slotProps={{
                  checkbox: {
                    onChange: async (e, checked) => {
                      field.onChange(checked);
                      setTimeout(async () => {
                        const isValid = await trigger('information_consent');
                        if (isValid) {
                          clearErrors('information_consent');
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

      {!currentEmployeeSignature && (
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr', sm: 'repeat(3, 1fr' },
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              signatureDialog.onTrue();
            }}
            disabled={!authorized}
            fullWidth
            startIcon={
              currentEmployeeSignature ? (
                <Iconify icon="solar:check-circle-bold" color="success.main" />
              ) : (
                <Iconify icon="solar:pen-bold" />
              )
            }
            sx={{
              display: { xs: 'flex', sm: 'inline-flex' },
              width: { xs: '100%', sm: 'auto' },
              py: { xs: 1.5, sm: 0.875 },
              fontSize: { xs: '1rem', sm: '0.875rem' },
            }}
          >
            Add Signature
          </Button>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 5,
          mt: 2,
        }}
      >
        {currentEmployeeSignature && (
          <Box sx={{ textAlign: 'center' }}>
            <Box>
              <img src={currentEmployeeSignature} alt="Employee Signature" />
            </Box>
            <Typography variant="subtitle1">
              EMPLOYEE’S SIGNATURE{' '}
              <IconButton
                onClick={() => {
                  signatureDialog.onTrue();
                }}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              (Signature Over Printed Name)
            </Typography>
          </Box>
        )}

        {authorizePersonSignature && (
          <Box sx={{ textAlign: 'center' }}>
            <Box>Signature Area</Box>
            <Typography variant="subtitle1">AUTHORIZED PERSON’S SIGNATURE</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              (Signature Over Printed Name)
            </Typography>
          </Box>
        )}
      </Box>

      {/* Signature Dialog for Initial */}
      <SignatureDialog
        title="Employee Signature"
        type="employee"
        dialog={signatureDialog}
        onSave={(signature, type) => {
          if (signature) {
            if (signature) {
              handleInitialSignature(signature);
              setValue('employee.signature', signature);
            }
          }
        }}
      />
    </>
  );
}
