import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form/fields';

import {
  EmployeeType,
  HRSP_P_OPTIONS,
  RadioButtonValues,
  WORK_SCHEDULE_OPTIONS,
} from 'src/types/new-hire';

/** Contract positions shown in hiring package (non-union workflow). */
const CONTRACT_POSITION_OPTIONS = [
  { value: 'tcp', label: 'TCP' },
  { value: 'lct', label: 'LCT' },
  { value: 'field_supervisor', label: 'Field Supervisor' },
] as const;

export function EmployeeContractDetailForm() {
  const { control, watch, setValue } = useFormContext();
  const isReferedBy = watch('contract_detail.is_refered');

  useEffect(() => {
    setValue('contract_detail.is_union', EmployeeType.NON_UNION, { shouldDirty: false });
  }, [setValue]);

  useEffect(() => {
    if (isReferedBy !== RadioButtonValues.YES) {
      setValue('contract_detail.refered_by', '');
    }
  }, [isReferedBy, setValue]);

  return (
    <>
        <Stack>
          <Typography variant="h5">Employee Contract Details</Typography>
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
          <Field.DatePicker
            name="contract_detail.date"
            label="Date"
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />

          <Field.DatePicker
            name="contract_detail.hire_date"
            label="Hire Date"
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
          <Field.DatePicker
            name="contract_detail.start_date"
            label="Start Date"
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />

          <Field.Select name="contract_detail.position" label="Position*">
            <MenuItem value="">Select...</MenuItem>
            {CONTRACT_POSITION_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text
            name="contract_detail.rate"
            label="Hourly Rate*"
            hourlyDecimal
            placeholder="e.g. 21.5"
            slotProps={{
              htmlInput: {
                inputMode: 'decimal',
              },
            }}
          />
          <Field.Text name="contract_detail.area" label="Area" />
          <Field.Text name="contract_detail.department" label="Department" />
          <Field.Text name="contract_detail.job_number" label="Job Number" />
          <Field.Text name="contract_detail.home_cost_centre" label="Home Cost Centre" />
        </Box>

        <Field.Text
          name="contract_detail.comments"
          label="HR Comment"
          multiline
          rows={2}
          fullWidth
        />

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              width: 1,
              px: 2,
            }}
          >
            <Typography variant="body2">Work Schedule*</Typography>
            <Controller
              control={control}
              name="contract_detail.work_schedule"
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
                    sx={{ width: 1, display: 'flex', justifyContent: 'flex-start' }}
                    options={WORK_SCHEDULE_OPTIONS}
                  />
                </Box>
              )}
            />
          </Stack>

          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              width: 1,
              px: 2,
            }}
          >
            <Typography variant="body2">HRS P*</Typography>
            <Controller
              control={control}
              name="contract_detail.hrsp"
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
                    options={HRSP_P_OPTIONS}
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
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
          }}
        >
          <Box
            sx={{
              gridColumn: { xs: 'span 1', sm: 'span 2' },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 2,
              flexWrap: 'wrap',
              width: 1,
              px: 2,
            }}
          >
            <Field.RadioGroup
              name="contract_detail.is_refered"
              label="Was new hire referred?*"
              row
              options={[
                { label: 'Yes', value: RadioButtonValues.YES },
                { label: 'No', value: RadioButtonValues.NO },
              ]}
              sx={{ flex: { sm: '0 0 auto' } }}
            />
            {isReferedBy === RadioButtonValues.YES && (
              <Field.Text
                name="contract_detail.refered_by"
                label="Referred By*"
                sx={{ flex: { sm: '1 1 220px' }, minWidth: { sm: 220 }, maxWidth: { sm: 400 } }}
              />
            )}
          </Box>
        </Box>
      </>
  );
}
