import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

export function EquipmentReturnPolicyForm() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
  } = useFormContext();

  const SHIFT_TYPE = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'casual', label: 'Casual' },
    { value: 'seasonal', label: 'Seasonal' },
  ];

  const HRS_P = [
    { value: 'non_union', label: 'Area Overhead (Non-Union)' },
    { value: 'home_office', label: 'part of OPS Support (Home Office)' },
  ];

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
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: '1fr 2fr' },
        }}
      >
        <Field.DatePicker
          name="file_date"
          label="Date"
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />
        <Field.Text name="full_name" label="Full Legal Name" />
      </Box>
      <Field.Text name="address" label="Complete Address*" multiline rows={2} fullWidth />
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
        }}
      >
        <Field.Text name="city" label="City*" />
        <Field.Text name="province" label="First Province*" />
        <Field.Text name="country" label="Country" />

        <Field.Text name="postal_code" label="Postal Code*" />
        <Field.Text name="phone_no" label="Contact #*" />
        <Field.Text name="email_address" label="Personal Email Address*" />
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

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
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
          }}
        >
          <Stack sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ p: 2 }}>
              By signing this form, you acknowledge agree to the following terms. Price to be
              deducted off the first pay period as follows.
            </Typography>
          </Stack>

          <Box
            sx={{
              p: 1,
              rowGap: 3,
              columnGap: 5,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
            }}
          >
            <Box sx={{ p: 1, borderBottom: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" sx={{ p: 1 }}>
                Hard Hat
              </Typography>
              <Typography variant="body1" sx={{ p: 1 }}>
                $45.00
              </Typography>
            </Box>

            <Box sx={{ p: 1, borderBottom: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" sx={{ p: 1 }}>
                Safety Vest
              </Typography>
              <Typography variant="body1" sx={{ p: 1 }}>
                $35.00
              </Typography>
            </Box>

            <Box sx={{ p: 1, borderBottom: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" sx={{ p: 1 }}>
                Ankle & Wrist Bands
              </Typography>
              <Typography variant="body1" sx={{ p: 1 }}>
                $15.00
              </Typography>
            </Box>

            <Box sx={{ p: 1, borderBottom: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" sx={{ p: 1 }}>
                Safety Paddle
              </Typography>
              <Typography variant="body1" sx={{ p: 1 }}>
                $60.00
              </Typography>
            </Box>

            <Box sx={{ p: 1, borderBottom: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" sx={{ p: 1 }}>
                Light Wand
              </Typography>
              <Typography variant="body1" sx={{ p: 1 }}>
                $20.00
              </Typography>
            </Box>
          </Box>

          <Stack sx={{ flex: 1, mt: 2 }}>
            <Typography variant="subtitle2" sx={{ p: 2 }} color="text.disabled">
              If you have any question regarding this, please contact us at info@eaglegreen.ca.
            </Typography>
          </Stack>
        </Box>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

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
        <Box sx={{ textAlign: 'center' }}>
          <Box>Signature Area</Box>
          <Typography variant="subtitle1">EMPLOYEE’S SIGNATURE</Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            (Signature Over Printed Name)
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Box>Signature Area</Box>
          <Typography variant="subtitle1">AUTHORIZED PERSON’S SIGNATURE</Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            (Signature Over Printed Name)
          </Typography>
        </Box>
      </Box>
    </>
  );
}
