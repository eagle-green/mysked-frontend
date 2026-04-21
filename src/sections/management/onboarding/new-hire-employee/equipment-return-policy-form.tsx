import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormHelperText from '@mui/material/FormHelperText';

import { fDate, formatPatterns } from 'src/utils/format-time';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

import { SignatureDialog } from './signature';

const EQUIPMENT_OPTIONS = [
  {
    label: 'Hard Hat',
    value: 'hard hat',
  },
  {
    label: 'Safety Vest',
    value: 'safety vest',
  },
  {
    label: 'Ankle & Wrist Bands',
    value: 'ankle & wrist bands',
  },
  {
    label: 'Safety Paddle',
    value: 'safety paddle',
  },
  {
    label: 'Light Wand',
    value: 'light wand',
  },
];

export function EquipmentReturnPolicyForm() {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useFormContext();
  const returnSigDialog = useBoolean();
  const [returnSigKey, setReturnSigKey] = useState(0);
  const returnPolicySignature = watch('return_policy_signature');
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));

  const equipements = watch('equipments') || [];

  const {
    fields: equipmentFields,
    append: appendEquipmentstFields,
    remove: removeEquipmentsFields,
  } = useFieldArray({
    control,
    name: 'equipments',
  });

  const equipmentControlFields = (index: number): Record<string, string> => ({
    equipment_name: `equipments[${index}].equipment_name`,
    quantity: `equipments[${index}].quantity`,
  });

  const defaultEquipment: { equipment_name: string; quantity?: number } = {
    equipment_name: '',
  };

  return (
    <>
      <Stack>
        <Typography variant="h4">Equipment Return Policy Form</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box>
        {equipmentFields.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No equipment rows yet. Click &quot;Add Field&quot; to add a row. All rows can be removed.
          </Typography>
        )}
        {equipmentFields.map((fields, index) => (
          <Box
            key={`equipments-${fields.id}-${index}`}
            sx={{
              gap: 1.5,
              display: 'flex',
              alignItems: 'stretch',
              flexDirection: 'column',
              mt: 2,
              width: 1,
            }}
          >
            <Box
              sx={{
                gap: 2,
                width: 1,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'stretch' },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Field.Select name={equipmentControlFields(index).equipment_name} label="Equipment*">
                  {EQUIPMENT_OPTIONS.map((option) => {
                    const current = equipements.map((item: any) => item?.equipment_name || '');
                    return (
                      <MenuItem
                        key={option.value}
                        value={option.value}
                        sx={{
                          display: current.includes(option.value) ? 'none' : 'block',
                        }}
                      >
                        <Typography>{option.label}</Typography>
                      </MenuItem>
                    );
                  })}
                </Field.Select>
              </Box>

              <Box sx={{ width: { md: 160 }, flexShrink: 0 }}>
                <Field.Text
                  type="number"
                  name={equipmentControlFields(index).quantity}
                  label="Quantity*"
                />
              </Box>

              {!isXsSmMd && (
                <Box
                  sx={{
                    display: 'flex',
                    width: 48,
                    flexShrink: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'stretch',
                  }}
                >
                  <IconButton
                    color="error"
                    aria-label="Remove row"
                    onClick={() => {
                      removeEquipmentsFields(index);
                    }}
                  >
                    <Iconify icon="mingcute:close-line" width={22} />
                  </IconButton>
                </Box>
              )}
            </Box>
            {isXsSmMd && (
              <Button
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={() => {
                  removeEquipmentsFields(index);
                }}
              >
                Remove
              </Button>
            )}
          </Box>
        ))}

        <Button
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
          onClick={() => {
            appendEquipmentstFields(defaultEquipment);
          }}
        >
          Add Field
        </Button>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      </Box>

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
            <Typography variant="subtitle1" sx={{ px: 2 }}>
              Once probation period is passed this will be refunded.
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

      <Stack sx={{ mt: 1 }}>
        {!returnPolicySignature && (
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
            }}
          >
            <Button
              type="button"
              variant="contained"
              size="large"
              onClick={() => {
                setReturnSigKey((k) => k + 1);
                returnSigDialog.onTrue();
              }}
              fullWidth
              startIcon={<Iconify icon="solar:pen-bold" />}
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
        {errors.return_policy_signature && (
          <FormHelperText error sx={{ ml: 0, pl: 1 }}>
            {errors.return_policy_signature.message as string}
          </FormHelperText>
        )}
      </Stack>

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
        {returnPolicySignature && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: { xs: 'center', md: 'flex-end' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 5,
              width: '100%',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  maxHeight: 120,
                  '& img': { maxWidth: '100%', maxHeight: 120, objectFit: 'contain' },
                }}
              >
                <img src={returnPolicySignature} alt="Equipment return policy signature" />
              </Box>
              <Typography variant="subtitle1">
                EMPLOYEE&apos;S SIGNATURE
                <IconButton
                  type="button"
                  onClick={() => {
                    setReturnSigKey((k) => k + 1);
                    returnSigDialog.onTrue();
                  }}
                  aria-label="Edit signature"
                >
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                (Signature Over Printed Name)
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1">
                {fDate(new Date(), formatPatterns.split.date)}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                (Date Signed)
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <SignatureDialog
        key={returnSigKey}
        title="Equipment return policy"
        type="return_policy"
        dialog={returnSigDialog}
        freshSignatureOnOpen
        onSave={(signature) => {
          returnSigDialog.onFalse();
          if (signature) {
            setValue('return_policy_signature', signature, {
              shouldValidate: true,
              shouldDirty: true,
            });
            setValue('return_policy_consent', true, { shouldDirty: true });
            trigger(['return_policy_signature']);
          }
        }}
        onCancel={() => returnSigDialog.onFalse()}
      />
    </>
  );
}
