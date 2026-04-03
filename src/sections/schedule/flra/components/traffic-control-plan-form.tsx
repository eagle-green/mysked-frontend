import type { AutocompleteWithAvatarOption } from 'src/components/hook-form/rhf-autocomplete-with-avatar';

import dayjs from 'dayjs';
import { useMemo, useState, useEffect } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
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

import { getRoleSoftChipSx, getRoleDisplayInfo } from 'src/utils/format-role';

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

function formatJobPosition(position?: string | null) {
  if (!position) return '';
  const p = String(position).toLowerCase().trim();
  const map: Record<string, string> = {
    lct: 'LCT',
    tcp: 'TCP',
    hwy: 'HWY',
    'lct/tcp': 'LCT/TCP',
    field_supervisor: 'Field Supervisor',
    timesheet_manager: 'Timesheet Manager',
  };
  if (map[p]) return map[p];
  return String(position)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type TrafficControlPlanFormProps = {
  jobData?: { workers?: any[] };
};

//---------------------------------------------------------------
export function TrafficControlPlanForm({ jobData }: TrafficControlPlanFormProps) {
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const { control, watch, setValue, getValues, trigger, formState: { errors } } = useFormContext();

  const inputFieldSize = isXsSmMd ? 'medium' : 'small';
  const sectionButtonSize = isXsSmMd ? 'large' : 'small';

  // Signature dialog state
  const [signatureDialog, setSignatureDialog] = useState({
    open: false,
    fieldPath: '',
    currentSignature: null as string | null,
  });

  const jobWorkerOptions: AutocompleteWithAvatarOption[] = useMemo(() => {
    const workers = jobData?.workers;
    if (!workers?.length) return [];

    return workers
      .filter((w: any) => {
        const uid = w?.user_id ?? w?.id;
        if (!uid) return false;
        const fn = w?.first_name ?? '';
        const ln = w?.last_name ?? '';
        return `${fn} ${ln}`.trim().length > 0;
      })
      .map((w: any) => {
        const first = w.first_name ?? '';
        const last = w.last_name ?? '';
        const label = `${first} ${last}`.trim();
        const assignedRole = formatJobPosition(w.position);
        return {
          label,
          value: label,
          photo_url: w.photo_url,
          first_name: first,
          last_name: last,
          assignedRole,
          jobPosition: w.position,
        };
      });
  }, [jobData?.workers]);

  // Keep Roles read-only field in sync with job assignment when names are loaded (e.g. edit draft)
  useEffect(() => {
    if (!jobWorkerOptions.length) return;
    const rows = (getValues('responsibilities') || []) as ResponsibilitiesType[];
    rows.forEach((row, index) => {
      const name = String(row?.name ?? '').trim();
      if (!name) return;
      const opt = jobWorkerOptions.find((o) => o.value === name);
      if (opt?.assignedRole) {
        const current = getValues(`responsibilities.${index}.role`);
        if (current !== opt.assignedRole) {
          setValue(`responsibilities.${index}.role`, opt.assignedRole, { shouldValidate: true });
        }
      }
    });
  }, [jobWorkerOptions, getValues, setValue]);

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
  const responsibilities = watch('responsibilities') || [];


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
                size={inputFieldSize}
                name={trafficControlFields(index).hazard_risk_assessment}
                label="Hazard Identified in Risk Assessment*"
              />

              <Field.Text
                size={inputFieldSize}
                name={trafficControlFields(index).control_measure}
                label="Control Measure*"
              />

                {!isXsSmMd && (
                  <Button
                    size={sectionButtonSize}
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
                size={sectionButtonSize}
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', width: 1, mt: 2 }}>
          <Button
            size={sectionButtonSize}
            color="primary"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => {
              appendTrafficControlFields({
                ...defaultTrafficControlPlanValues,
              });
            }}
          >
            Add Field
          </Button>
        </Box>
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
                      size: inputFieldSize,
                      fullWidth: true,
                      onBlur: () => {
                        setTimeout(() => trigger(`updates.${index}`), 100);
                      },
                    },
                  }}
                />

                <Field.Text
                  size={inputFieldSize}
                  name={updatesControlFields(index).changes}
                  label="Changes"
                  onBlur={() => {
                    setTimeout(() => trigger(`updates.${index}`), 100);
                  }}
                />

                <Field.Text
                  size={inputFieldSize}
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
                      size={sectionButtonSize}
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
                    size={sectionButtonSize}
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
                  size={sectionButtonSize}
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', width: 1, mt: 2 }}>
          <Button
            size={sectionButtonSize}
            color="primary"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => {
              appendUpdateFields({
                ...defaultUpdateValues,
                date_time_updates: dayjs().format('MM/DD/YYYY h:mm A'),
              });
            }}
          >
            Add Field
          </Button>
        </Box>
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
          {responsibilityFields.map((field, index) => {
            const currentRowName = String(responsibilities[index]?.name ?? '').trim();
            const namesUsedOnOtherRows = new Set(
              responsibilities
                .map((row: ResponsibilitiesType, i: number) =>
                  i !== index && row?.name ? String(row.name).trim() : ''
                )
                .filter(Boolean)
            );
            const rowWorkerOptions = jobWorkerOptions.filter(
              (opt) => !namesUsedOnOtherRows.has(opt.value) || opt.value === currentRowName
            );

            const roleSaved = String(responsibilities[index]?.role ?? '').trim();
            const workerForRow = rowWorkerOptions.find((o) => o.value === currentRowName);
            const roleDisplay = roleSaved
              ? getRoleDisplayInfo(workerForRow?.jobPosition ?? roleSaved)
              : { label: '', color: 'default' as const };

            return (
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
                <Box
                  sx={{
                    flex: { xs: 1, md: '1 1 10%' },
                    width: { xs: 1, md: 'auto' },
                    minWidth: { md: 200 },
                    minHeight: 0,
                    maxWidth: { md: '100%' },
                    alignSelf: { md: 'stretch' },
                  }}
                >
                  <Field.AutocompleteWithAvatar
                    size={inputFieldSize}
                    name={responsibilitiesControlFields(index).name}
                    label="Name"
                    options={rowWorkerOptions}
                    inputEndSlot={
                      roleDisplay.label ? (
                        <Chip
                          label={roleDisplay.label}
                          size="small"
                          variant="soft"
                          color={roleDisplay.color}
                          sx={getRoleSoftChipSx(theme, roleDisplay.color)}
                        />
                      ) : null
                    }
                    noOptionsText={
                      jobWorkerOptions.length === 0
                        ? 'No workers assigned to this job'
                        : rowWorkerOptions.length === 0
                          ? 'All assigned workers are already added'
                          : 'No matching worker'
                    }
                    onAfterSelect={(opt) => {
                      const roleField = responsibilitiesControlFields(index).role;
                      if (opt?.assignedRole) {
                        setValue(roleField, opt.assignedRole, { shouldValidate: true });
                      } else {
                        setValue(roleField, '', { shouldValidate: true });
                      }
                    }}
                    slotProps={{
                      textfield: {
                        size: inputFieldSize,
                        onBlur: () => {
                          setTimeout(() => trigger(`responsibilities.${index}`), 100);
                        },
                        sx: {
                          width: '100%',
                          maxWidth: 'none',
                          '& .MuiOutlinedInput-root': {
                            flexWrap: 'nowrap',
                            width: '100%',
                            alignItems: 'center',
                          },
                          /* Full name visible; input grows with the field (no width:auto / maxWidth cap that caused …) */
                          '& .MuiAutocomplete-input': {
                            flexGrow: 1,
                            flexShrink: 1,
                            minWidth: { xs: '12ch', sm: '16ch' },
                          },
                        },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Field.Text
                    size={inputFieldSize}
                    name={responsibilitiesControlFields(index).serialNumber}
                    label="SN #"
                    onBlur={() => {
                      setTimeout(() => trigger(`responsibilities.${index}`), 100);
                    }}
                  />
                </Box>

                <Box sx={{ flex: 2 }}>
                  <Field.Text
                    size={inputFieldSize}
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
                      size="medium"
                      variant="contained"
                      color={watch(responsibilitiesControlFields(index).initial) ? 'success' : 'inherit'}
                      fullWidth={isXsSmMd}
                      onClick={() => {
                        const currentValue = watch(responsibilitiesControlFields(index).initial);
                        handleOpenSignatureDialog(responsibilitiesControlFields(index).initial, currentValue);
                      }}
                      startIcon={
                        watch(responsibilitiesControlFields(index).initial) ? (
                          <Iconify icon="solar:check-circle-bold" />
                        ) : (
                          <Iconify icon="solar:pen-bold" />
                        )
                      }
                      sx={{
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
                    size={sectionButtonSize}
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
                  size={sectionButtonSize}
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
          );
          })}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', width: 1, mt: 2 }}>
          <Button
            size={sectionButtonSize}
            color="primary"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => {
              appendResponsibilitiesField(defaultResponsibilitiesValues);
            }}
          >
            Add Field
          </Button>
        </Box>
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
                  size={inputFieldSize}
                  name={authorizationControlFields(index).fullName}
                  label="Full Name"
                />

                <Field.Text
                  size={inputFieldSize}
                  name={authorizationControlFields(index).company}
                  label="Company"
                />

                <Field.DateTimePicker
                  name={authorizationControlFields(index).date_time}
                  label="Date and Time"
                  slotProps={{
                    textField: {
                      size: inputFieldSize,
                      fullWidth: true,
                    },
                  }}
                />

                {!isXsSmMd && (
                  <Button
                    size={sectionButtonSize}
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
                  size={sectionButtonSize}
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', width: 1, mt: 2 }}>
          <Button
            size={sectionButtonSize}
            color="primary"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => {
              appendAuthorizationFields({
                ...defaultAuthorizationValues,
                date_time: dayjs().format('MM/DD/YYYY h:mm A'),
              });
            }}
          >
            Add Field
          </Button>
        </Box>
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
