import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

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
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    getValues,
  } = useFormContext();
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

  const defaultEquipment: Omit<{ equipment_name: string; quantity: number }, 'id'> = {
    equipment_name: '',
    quantity: 0,
  };

  return (
    <>
      <Stack>
        <Typography variant="h4">Equipment Return Policy Form</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box>
        {equipmentFields.map((fields, index) => (
          <Box
            key={`equipments-${fields.id}-${index}`}
            sx={{
              gap: 1.5,
              display: 'flex',
              alignItems: 'flex-end',
              flexDirection: 'column',
              mt: 2,
              w: 1,
            }}
          >
            <Box
              sx={{
                gap: 2,
                width: 1,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
              }}
            >
              {/* <Field.Text name={equipmentControlFields(index).equipment_name} label="Equipment*" /> */}

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

              <Field.Text
                type="number"
                name={equipmentControlFields(index).quantity}
                label="Quantity*"
              />

              {!isXsSmMd && (
                <Button
                  color="error"
                  onClick={() => {
                    removeEquipmentsFields(index);
                  }}
                  disabled={equipements.length <= 1}
                  sx={{
                    px: 1,
                    minWidth: 'auto',
                    width: '40px',
                    height: '40px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    alignSelf: 'flex-start',
                  }}
                >
                  ×
                </Button>
              )}
            </Box>
            {isXsSmMd && (
              <Button
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={() => {
                  removeEquipmentsFields(index);
                }}
                disabled={equipements.length <= 1}
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

      <Stack>
        <Box
          sx={{
            bgcolor: 'divider',
            py: 2,
            px: 1,
            borderRadius: 1,
          }}
        >
          <Controller
            name="return_policy_consent"
            control={control}
            render={({ field }) => (
              <Field.Checkbox
                name="return_policy_consent"
                label="I authorize Eagle Green (EG) to use my personal information including my signature and images in its website, newsletters, social media, and other official materials."
                slotProps={{
                  checkbox: {
                    onChange: async (e, checked) => {
                      field.onChange(checked);
                      setTimeout(async () => {
                        const isValid = await trigger('return_policy_consent');
                        if (isValid) {
                          clearErrors('return_policy_consent');
                        }
                      }, 50);
                    },
                  },
                }}
              />
            )}
          />
        </Box>
        {errors.return_policy_consent && (
          <FormHelperText error sx={{ ml: 0, pl: 1 }}>
            Required to acknowledged before proceeding
          </FormHelperText>
        )}
      </Stack>
    </>
  );
}
