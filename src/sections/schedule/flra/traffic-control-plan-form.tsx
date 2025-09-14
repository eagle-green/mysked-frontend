import dayjs from 'dayjs';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

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

type UpdateType = {
  date_time_updates: string;
  changes: string;
  additional_control: string;
  initial: string;
};

type ResponsibilitiesType = {
  role: string;
  serialNumber: string;
  responsibility: string;
  initial: string;
};

type AuthorizationType = {
  fullName: string;
  company: string;
  date_time: string;
};

//---------------------------------------------------------------
export function TrafficControlPlanForm() {
  const currentDate = dayjs().format('YYYY-MM-DD');
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const { control, getValues, setValue, watch } = useFormContext();
  const trafficControlPlans = watch('trafficControlPlans') || [];
  const updates = watch('updates') || [];
  const responsibilities = watch('updates') || [];
  const authorizations = watch('updates') || [];
  const {
    fields: trafficControlPlanFields,
    append: appendTrafficControlFields,
    remove: removeTrafficControlFields,
  } = useFieldArray({
    control,
    name: 'trafficControlPlans',
  });

  const {
    fields: updateFields,
    append: appendUpdateFields,
    remove: removeUpdateFields,
  } = useFieldArray({
    control,
    name: 'updates',
  });

  const {
    fields: responsibilityFields,
    append: appendResponsibilitiesField,
    remove: removeResponsibilitiesField,
  } = useFieldArray({
    control,
    name: 'responsibilities',
  });

  const {
    fields: authorizationFields,
    append: appendAuthorizationFields,
    remove: removeAuthorizationFields,
  } = useFieldArray({
    control,
    name: 'authorizations',
  });

  const trafficControlFields = (index: number): Record<string, string> => ({
    hazard_risk_assessment: `trafficControlPlans[${index}].hazard_risk_assessment`,
    control_measure: `trafficControlPlans[${index}].control_measure`,
  });

  const updatesControlFields = (index: number): Record<string, string> => ({
    date_time_updates: `updates[${index}].date_time_updates`,
    changes: `updates[${index}].changes`,
    additional_control: `updates[${index}].additional_control`,
    initial: `updates[${index}].initial`,
  });

  const responsibilitiesControlFields = (index: number): Record<string, string> => ({
    role: `responsibilities[${index}].role`,
    serialNumber: `responsibilities[${index}].serialNumber`,
    responsibility: `responsibilities[${index}].responsibility`,
    initial: `responsibilities[${index}].initial`,
  });

  const authorizationControlFields = (index: number): Record<string, string> => ({
    fullName: `authorizations[${index}].fullName`,
    company: `authorizations[${index}].company`,
    date_time: `authorizations[${index}].date_time`,
  });

  const defaultUpdateValues: Omit<UpdateType, 'id'> = {
    date_time_updates: currentDate,
    changes: '',
    additional_control: '',
    initial: '',
  };

  const defaultTrafficControlPlanValues: Omit<TrafficControlPlanType, 'id'> = {
    hazard_risk_assessment: '',
    control_measure: '',
  };

  const defaultResponsibilitiesValues: Omit<ResponsibilitiesType, 'id'> = {
    role: '',
    serialNumber: '',
    responsibility: '',
    initial: '',
  };

  const defaultAuthorizationValues: Omit<AuthorizationType, 'id'> = {
    fullName: '',
    company: '',
    date_time: currentDate,
  };

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
          {updateFields.map((field, index) => (
            <Box
              key={`updates-${field.id}-${index}`}
              sx={{
                gap: 1.5,
                display: 'flex',
                alignItems: 'flex-end',
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
                }}
              >
                <Field.DatePicker
                  name={updatesControlFields(index).date_time_updates}
                  label="Date and Time"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      size: 'small',
                    },
                  }}
                />

                <Field.Text
                  size="small"
                  name={updatesControlFields(index).changes}
                  label="Changes"
                />

                <Field.Text
                  size="small"
                  name={updatesControlFields(index).additional_control}
                  label="Additional Control"
                />

                <Field.Text
                  size="small"
                  name={updatesControlFields(index).initial}
                  label="Initial"
                />

                {!isXsSmMd && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                    onClick={() => {
                      removeUpdateFields(index);
                    }}
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
                    removeUpdateFields(index);
                  }}
                >
                  Remove
                </Button>
              )}
            </Box>
          ))}
        </Box>
        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
          onClick={() => {
            appendUpdateFields({
              defaultUpdateValues,
            });
          }}
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
          {responsibilityFields.map((field, index) => (
            <Box
              key={`responsibilities-${field.id}-${index}`}
              sx={{
                gap: 1.5,
                display: 'flex',
                alignItems: 'flex-end',
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
                }}
              >
                <Field.Text
                  size="small"
                  name={responsibilitiesControlFields(index).role}
                  label="Roles"
                />

                <Field.Text
                  size="small"
                  name={responsibilitiesControlFields(index).serialNumber}
                  label="SN #"
                />

                <Field.Text
                  size="small"
                  name={responsibilitiesControlFields(index).responsibility}
                  label="Responsibilities"
                />

                <Field.Text
                  size="small"
                  name={responsibilitiesControlFields(index).initial}
                  label="Initial"
                />

                {!isXsSmMd && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                    onClick={() => {
                      removeResponsibilitiesField(index);
                    }}
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
                    removeResponsibilitiesField(index);
                  }}
                >
                  Remove
                </Button>
              )}
            </Box>
          ))}
        </Box>
        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
          onClick={() => {
            appendResponsibilitiesField({
              defaultResponsibilitiesValues,
            });
          }}
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
              <Controller
                name="supervisionLevels.communicationMode"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} value="low" />}
                    label="LOW RISK"
                    labelPlacement="end"
                  />
                )}
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
                justifyContent: 'flex-start',
                width: 1,
              }}
            >
              <Controller
                name="supervisionLevels.pictureSubmission"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} value="low" />}
                    label="MEDIUM RISK"
                    labelPlacement="end"
                  />
                )}
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
                justifyContent: 'flex-start',
                width: 1,
              }}
            >
              <Controller
                name="supervisionLevels.supervisorPresence"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} value="low" />}
                    label="HIGH RISK"
                    labelPlacement="end"
                  />
                )}
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
          {authorizationFields.map((field, index) => (
            <Box
              key={`authorizations-${field.id}-${index}`}
              sx={{
                gap: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
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
                }}
              >
                <Field.Text
                  size="small"
                  name={authorizationControlFields(index).fullName}
                  label="FullName"
                />

                <Field.Text
                  size="small"
                  name={authorizationControlFields(index).company}
                  label="Company"
                />

                <Field.DatePicker
                  name={authorizationControlFields(index).date_time}
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
                    onClick={() => {
                      removeAuthorizationFields(index);
                    }}
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
                    removeAuthorizationFields(index);
                  }}
                >
                  Remove
                </Button>
              )}
            </Box>
          ))}
        </Box>
        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start' }}
          onClick={() => {
            appendAuthorizationFields({
              defaultAuthorizationValues,
            });
          }}
        >
          Add Field
        </Button>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      </Box>
    </Box>
  );
}
