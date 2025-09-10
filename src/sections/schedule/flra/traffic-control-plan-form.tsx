import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import { useTheme } from '@mui/material/styles';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

type TrafficControlPlanType = {
  hazard_risk_assessment: string;
  control_measure: string;
};

export const defaultTrafficControlPlanValues: Omit<TrafficControlPlanType, 'id'> = {
  hazard_risk_assessment: '',
  control_measure: '',
};
//---------------------------------------------------------------
export function TrafficControlPlanForm() {
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const { control, getValues, setValue, watch } = useFormContext();
  const trafficControlPlans = watch('trafficControlPlans') || [];
  const {
    fields: trafficControlPlanFields,
    append: appendTrafficControlFields,
    remove: removeTrafficControlFields,
  } = useFieldArray({
    control,
    name: 'trafficControlPlans',
  });

  const trafficControlFields = (index: number): Record<string, string> => ({
    hazard_risk_assessment: `trafficControlPlans[${index}].hazard_risk_assessment`,
    control_measure: `trafficControlPlans[${index}].control_measure`,
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box>
        <Typography variant="body1">Traffic Control Plan</Typography>
        {trafficControlPlanFields.map((fields, index) => (
          <Box
            key={`trafficControlPlan-${fields.id}-${index}`}
            sx={{
              gap: 1.5,
              display: 'flex',
              alignItems: 'flex-end',
              flexDirection: 'column',
              mt: 2,
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
              <Field.Text
                size="small"
                name={trafficControlFields(index).hazard_risk_assessment}
                label="Hazard Identified in Risk Assessment*"
              />

              <Field.Text
                size="small"
                name={trafficControlFields(index).control_measure}
                label="Control Measure*"
              />

              {!isXsSmMd && (
                <Button
                  size="small"
                  color="error"
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                  onClick={() => {
                    removeTrafficControlFields(index);
                  }}
                  // disabled={!canRemove}
                  sx={{ px: 4.5, mt: 1 }}
                >
                  Remove
                </Button>
              )}
            </Box>
            {isXsSmMd && (
              <Button
                size="small"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={() => {
                  removeTrafficControlFields(index);
                }}
                // disabled={!canRemove}
              >
                Remove
              </Button>
            )}
          </Box>
        ))}

        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
          onClick={() => {
            appendTrafficControlFields({
              defaultTrafficControlPlanValues,
            });
          }}
        >
          Add Field
        </Button>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      </Box>

      <Box>
        <Typography variant="body1">Updates</Typography>
        <Box
          sx={{
            gap: 1.5,
            display: 'flex',
            alignItems: 'flex-end',
            flexDirection: 'column',
            mt: 2,
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
            <Field.DatePicker
              name="date_time_updates"
              label="Date and Time"
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  size: 'small',
                },
              }}
            />

            <Field.Text size="small" name="changes" label="Changes*" />

            <Field.Text size="small" name="additional_control" label="Additional Control*" />

            <Field.Text size="small" name="initial" label="Initial*" />

            {!isXsSmMd && (
              <Button
                size="small"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                // onClick={onRemoveWorkerItem}
                // disabled={!canRemove}
                sx={{ px: 4.5, mt: 1 }}
              >
                Remove
              </Button>
            )}
          </Box>
          {isXsSmMd && (
            <Button
              size="small"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              // onClick={onRemoveWorkerItem}
              // disabled={!canRemove}
            >
              Remove
            </Button>
          )}
        </Box>
        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
        >
          Add Field
        </Button>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      </Box>

      <Box>
        <Typography variant="body1">Roles & Responsibilities</Typography>
        <Box
          sx={{
            gap: 1.5,
            display: 'flex',
            alignItems: 'flex-end',
            flexDirection: 'column',
            mt: 2,
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
            <Field.Text size="small" name="roles" label="Roles*" />

            <Field.Text size="small" name="serial_number" label="SN #*" />

            <Field.Text size="small" name="responsibilities" label="Responsibilities*" />

            <Field.Text size="small" name="initial" label="Initial" />

            {!isXsSmMd && (
              <Button
                size="small"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                // onClick={onRemoveWorkerItem}
                // disabled={!canRemove}
                sx={{ px: 4.5, mt: 1 }}
              >
                Remove
              </Button>
            )}
          </Box>
          {isXsSmMd && (
            <Button
              size="small"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              // onClick={onRemoveWorkerItem}
              // disabled={!canRemove}
            >
              Remove
            </Button>
          )}
        </Box>
        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
        >
          Add Field
        </Button>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      </Box>

      <Box>
        <FormControl sx={{ width: 1 }}>
          <Typography variant="body1">Level of Supervision</Typography>
          <FormGroup sx={{ gap: 1.5, mt: 2 }}>
            <Box
              sx={{
                p: 1,
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: 1,
              }}
            >
              <FormControlLabel
                value={1}
                control={<Checkbox />}
                label="LOW RISK"
                labelPlacement="end"
              />
              <Typography variant="body2"> Text or phone call to supervisor</Typography>
            </Box>

            <Box
              sx={{
                p: 1,
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: 1,
              }}
            >
              <FormControlLabel
                value={2}
                control={<Checkbox />}
                label="MEDIUM RISK"
                labelPlacement="end"
              />
              <Typography variant="body2"> Send pictures of set up to supervisor</Typography>
            </Box>

            <Box
              sx={{
                p: 1,
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: 1,
              }}
            >
              <FormControlLabel
                value={3}
                control={<Checkbox />}
                label="HIGH RISK"
                labelPlacement="end"
              />
              <Typography variant="body2"> Supervisor must be present when setting up</Typography>
            </Box>
          </FormGroup>
        </FormControl>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      </Box>

      <Box>
        <Typography variant="body1">
          Sign Off By (included project supervisor, TC supervisor)
        </Typography>
        <Box
          sx={{
            gap: 1.5,
            display: 'flex',
            alignItems: 'flex-end',
            flexDirection: 'column',
            mt: 2,
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
            <Field.Text size="small" name="full_name" label="FullName" />

            <Field.Text size="small" name="company" label="Company*" />

            <Field.DatePicker
              name="date_time_sign_off"
              label="Date and Time"
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  size: 'small',
                },
              }}
            />

            {!isXsSmMd && (
              <Button
                size="small"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                // onClick={onRemoveWorkerItem}
                // disabled={!canRemove}
                sx={{ px: 4.5, mt: 1 }}
              >
                Remove
              </Button>
            )}
          </Box>
          {isXsSmMd && (
            <Button
              size="small"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              // onClick={onRemoveWorkerItem}
              // disabled={!canRemove}
            >
              Remove
            </Button>
          )}
        </Box>
        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
        >
          Add Field
        </Button>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      </Box>
    </Box>
  );
}
