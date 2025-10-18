import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fetcher, endpoints } from 'src/lib/axios';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';
import { InitialSignatureDialog } from 'src/components/signature/initial-signature-dialog';

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
  name: string;
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
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const { control, watch, setValue, trigger, formState: { errors } } = useFormContext();

  // Signature dialog state
  const [signatureDialog, setSignatureDialog] = useState({
    open: false,
    fieldPath: '',
    currentSignature: null as string | null,
  });

  // Fetch user list for name autocomplete
  const { data: userList } = useQuery({
    queryKey: ['users', 'flra-responsibilities'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.management.user}/job-creation`);
      return response.data.users;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const userOptions = useMemo(() => {
    if (!userList) return [];
    return userList.map((user: any) => ({
      label: `${user.first_name} ${user.last_name}`,
      value: `${user.first_name} ${user.last_name}`,
      photo_url: user.photo_url,
      first_name: user.first_name,
      last_name: user.last_name,
    }));
  }, [userList]);

  // Signature handlers
  const handleOpenSignatureDialog = (fieldPath: string, currentSignature?: string | null) => {
    setSignatureDialog({
      open: true,
      fieldPath,
      currentSignature: currentSignature || null,
    });
  };

  const handleCloseSignatureDialog = () => {
    setSignatureDialog({
      open: false,
      fieldPath: '',
      currentSignature: null,
    });
  };

  const handleSaveSignature = (signature: string) => {
    if (signatureDialog.fieldPath) {
      setValue(signatureDialog.fieldPath, signature);
      // Trigger validation after setting signature
      setTimeout(() => {
        trigger(signatureDialog.fieldPath);
      }, 100);
    }
    handleCloseSignatureDialog();
  };

  const trafficControlPlans = watch('trafficControlPlans') || [];
  const updates = watch('updates') || [];
  const responsibilities = watch('responsibilities') || [];
  const authorizations = watch('authorizations') || [];


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
    name: `responsibilities[${index}].name`,
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
    date_time_updates: '',
    changes: '',
    additional_control: '',
    initial: '',
  };

  const defaultTrafficControlPlanValues: Omit<TrafficControlPlanType, 'id'> = {
    hazard_risk_assessment: '',
    control_measure: '',
  };

  const defaultResponsibilitiesValues: Omit<ResponsibilitiesType, 'id'> = {
    name: '',
    role: '',
    serialNumber: '',
    responsibility: '',
    initial: '',
  };

  const defaultAuthorizationValues: Omit<AuthorizationType, 'id'> = {
    fullName: '',
    company: '',
    date_time: '',
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h4">Traffic Control Plan</Typography>
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
                    onClick={() => {
                      removeTrafficControlFields(index);
                    }}
                    disabled={trafficControlPlans.length <= 1}
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
                size="small"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={() => {
                  removeTrafficControlFields(index);
                }}
                disabled={trafficControlPlans.length <= 1}
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
          disabled={trafficControlPlans.length >= 3}
        >
          Add Field
        </Button>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      </Box>

      <Box>
        <Typography variant="h4">Updates</Typography>
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
                <Field.DateTimePicker
                  name={updatesControlFields(index).date_time_updates}
                  label="Date and Time"
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      onBlur: () => {
                        setTimeout(() => trigger(`updates.${index}`), 100);
                      },
                    },
                  }}
                />

                <Field.Text
                  size="small"
                  name={updatesControlFields(index).changes}
                  label="Changes"
                  onBlur={() => {
                    setTimeout(() => trigger(`updates.${index}`), 100);
                  }}
                />

                <Field.Text
                  size="small"
                  name={updatesControlFields(index).additional_control}
                  label="Additional Control"
                  onBlur={() => {
                    setTimeout(() => trigger(`updates.${index}`), 100);
                  }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1, alignItems: 'stretch' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth={isXsSmMd}
                      onClick={() => {
                        const currentValue = watch(updatesControlFields(index).initial);
                        handleOpenSignatureDialog(updatesControlFields(index).initial, currentValue);
                      }}
                      startIcon={
                        watch(updatesControlFields(index).initial) ? (
                          <Iconify icon="solar:check-circle-bold" color="success.main" />
                        ) : (
                          <Iconify icon="solar:pen-bold" />
                        )
                      }
                      sx={{
                        borderColor: watch(updatesControlFields(index).initial)
                          ? 'success.main'
                          : 'divider',
                        color: watch(updatesControlFields(index).initial)
                          ? 'success.main'
                          : 'text.secondary',
                        minWidth: { xs: 'auto', md: 120 },
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {watch(updatesControlFields(index).initial) ? 'Signed' : 'Add Initial'}
                    </Button>
                    {watch(updatesControlFields(index).initial) && (
                      <Box
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          bgcolor: 'background.neutral',
                          width: { xs: '100%', md: 'auto' },
                          minWidth: { xs: 'auto', md: 60 },
                          maxWidth: { xs: '100%', md: 80 },
                          height: { xs: 'auto', md: '100%' },
                        }}
                      >
                        <img
                          src={watch(updatesControlFields(index).initial)}
                          alt="Initial Signature"
                          style={{ height: 'auto', width: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                    )}
                  </Box>
                  {errors.updates && Array.isArray(errors.updates) && errors.updates[index]?.initial && (
                    <FormHelperText error sx={{ ml: 0 }}>
                      Initial required
                    </FormHelperText>
                  )}
                </Box>

                {!isXsSmMd && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      removeUpdateFields(index);
                    }}
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
                  size="small"
                  color="error"
                  onClick={() => {
                    removeUpdateFields(index);
                  }}
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
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
              ...defaultUpdateValues,
              date_time_updates: dayjs().format('MM/DD/YYYY h:mm A'),
            });
          }}
          disabled={updates.length >= 2}
        >
          Add Field
        </Button>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      </Box>

      <Box>
        <Typography variant="h4">Roles & Responsibilities*</Typography>
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
                <Box sx={{ flex: 2 }}>
                  <Field.AutocompleteWithAvatar
                    size="small"
                    name={responsibilitiesControlFields(index).name}
                    label="Name"
                    options={userOptions}
                    slotProps={{
                      textfield: {
                        size: 'small',
                        onBlur: () => {
                          setTimeout(() => trigger(`responsibilities.${index}`), 100);
                        },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Field.Text
                    size="small"
                    name={responsibilitiesControlFields(index).role}
                    label="Roles"
                    onBlur={() => {
                      setTimeout(() => trigger(`responsibilities.${index}`), 100);
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Field.Text
                    size="small"
                    name={responsibilitiesControlFields(index).serialNumber}
                    label="SN #"
                    onBlur={() => {
                      setTimeout(() => trigger(`responsibilities.${index}`), 100);
                    }}
                  />
                </Box>

                <Box sx={{ flex: 2 }}>
                  <Field.Text
                    size="small"
                    name={responsibilitiesControlFields(index).responsibility}
                    label="Responsibilities"
                    onBlur={() => {
                      setTimeout(() => trigger(`responsibilities.${index}`), 100);
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1, alignItems: 'stretch' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth={isXsSmMd}
                      onClick={() => {
                        const currentValue = watch(responsibilitiesControlFields(index).initial);
                        handleOpenSignatureDialog(responsibilitiesControlFields(index).initial, currentValue);
                      }}
                      startIcon={
                        watch(responsibilitiesControlFields(index).initial) ? (
                          <Iconify icon="solar:check-circle-bold" color="success.main" />
                        ) : (
                          <Iconify icon="solar:pen-bold" />
                        )
                      }
                      sx={{
                        borderColor: watch(responsibilitiesControlFields(index).initial)
                          ? 'success.main'
                          : 'divider',
                        color: watch(responsibilitiesControlFields(index).initial)
                          ? 'success.main'
                          : 'text.secondary',
                        minWidth: { xs: 'auto', md: 120 },
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {watch(responsibilitiesControlFields(index).initial) ? 'Signed' : 'Add Initial'}
                    </Button>
                    {watch(responsibilitiesControlFields(index).initial) && (
                      <Box
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          bgcolor: 'background.neutral',
                          width: { xs: '100%', md: 'auto' },
                          minWidth: { xs: 'auto', md: 60 },
                          maxWidth: { xs: '100%', md: 80 },
                          height: { xs: 'auto', md: '100%' },
                        }}
                      >
                        <img
                          src={watch(responsibilitiesControlFields(index).initial)}
                          alt="Initial Signature"
                          style={{ height: 'auto', width: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                    )}
                  </Box>
                  {errors.responsibilities && Array.isArray(errors.responsibilities) && errors.responsibilities[index]?.initial && (
                    <FormHelperText error sx={{ ml: 0 }}>
                      Initial required
                    </FormHelperText>
                  )}
                </Box>

                {!isXsSmMd && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      removeResponsibilitiesField(index);
                    }}
                    disabled={responsibilities.length <= 1}
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
                  size="small"
                  color="error"
                  onClick={() => {
                    removeResponsibilitiesField(index);
                  }}
                  disabled={responsibilities.length <= 1}
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
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
            appendResponsibilitiesField(defaultResponsibilitiesValues);
          }}
          disabled={responsibilities.length >= 4}
        >
          Add Field
        </Button>
        {errors.responsibilities && responsibilities.length === 0 && (
          <FormHelperText error sx={{ mt: 1 }}>
            At least one role and responsibility must be added
          </FormHelperText>
        )}
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      </Box>

      <Box>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' }, fontWeight: 600, mb: 2 }}>
          Level of Supervision*
        </Typography>
        <FormControl sx={{ width: 1 }}>
          <Controller
            name="supervisionLevel"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <RadioGroup
                {...field}
                value={field.value || ''}
                sx={{ gap: { xs: 2, md: 1 }, mt: 2 }}
              >
            <FormControlLabel
              value="low"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      fontWeight: 600,
                      color: 'primary.main'
                    }}
                  >
                    LOW RISK
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
                      color: 'text.secondary'
                    }}
                  >
                    Text or phone call to supervisor
                  </Typography>
                </Box>
              }
              sx={{
                py: { xs: 2, md: 1 },
                px: { xs: 2, md: 2 },
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                width: 1,
                margin: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                alignItems: { xs: 'flex-start', md: 'center' },
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.main',
                },
                '& .MuiFormControlLabel-label': {
                  marginLeft: { xs: 1, md: 1 },
                },
              }}
            />

            <FormControlLabel
              value="medium"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      fontWeight: 600,
                      color: 'warning.main'
                    }}
                  >
                    MEDIUM RISK
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
                      color: 'text.secondary'
                    }}
                  >
                    Send pictures of set up to supervisor
                  </Typography>
                </Box>
              }
              sx={{
                py: { xs: 2, md: 1 },
                px: { xs: 2, md: 2 },
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                width: 1,
                margin: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                alignItems: { xs: 'flex-start', md: 'center' },
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.main',
                },
                '& .MuiFormControlLabel-label': {
                  marginLeft: { xs: 1, md: 1 },
                },
              }}
            />

            <FormControlLabel
              value="high"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      fontWeight: 600,
                      color: 'error.main'
                    }}
                  >
                    HIGH RISK
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
                      color: 'text.secondary'
                    }}
                  >
                    Supervisor must be present when setting up
                  </Typography>
                </Box>
              }
              sx={{
                py: { xs: 2, md: 1 },
                px: { xs: 2, md: 2 },
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                width: 1,
                margin: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                alignItems: { xs: 'flex-start', md: 'center' },
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.main',
                },
                '& .MuiFormControlLabel-label': {
                  marginLeft: { xs: 1, md: 1 },
                },
              }}
            />
              </RadioGroup>
            )}
          />
        </FormControl>
        {errors.supervisionLevel && (
          <FormHelperText error sx={{ mt: 1 }}>
            Please select a supervision level
          </FormHelperText>
        )}
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      </Box>

      <Box>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' }, fontWeight: 600, mb: 2 }}>
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
                  label="Full Name"
                />

                <Field.Text
                  size="small"
                  name={authorizationControlFields(index).company}
                  label="Company"
                />

                <Field.DateTimePicker
                  name={authorizationControlFields(index).date_time}
                  label="Date and Time"
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />

                {!isXsSmMd && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      removeAuthorizationFields(index);
                    }}
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
                  size="small"
                  color="error"
                  onClick={() => {
                    removeAuthorizationFields(index);
                  }}
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
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
              ...defaultAuthorizationValues,
              date_time: dayjs().format('MM/DD/YYYY h:mm A'),
            });
          }}
          disabled={authorizations.length >= 3}
        >
          Add Field
        </Button>
      </Box>

      {/* Signature Dialog */}
      <InitialSignatureDialog
        open={signatureDialog.open}
        onClose={handleCloseSignatureDialog}
        onSave={handleSaveSignature}
        title="Add your initial signature"
        currentSignature={signatureDialog.currentSignature}
      />
    </Box>
  );
}
