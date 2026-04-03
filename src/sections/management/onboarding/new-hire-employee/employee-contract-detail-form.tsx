import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form/fields';

import { EmployeeType, RadioButtonValues, SalaryType, WorkSchedule } from 'src/types/new-hire';

export function EmployeeContractDetailForm() {
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    setValue,
  } = useFormContext();

  const WORK_SCHEDULE_OPTION = [
    { label: 'Weekly', value: WorkSchedule.WK },
    { label: 'Full Time', value: WorkSchedule.FULL_TIME },
    { label: 'Part Time', value: WorkSchedule.PART_TIME },
    { label: 'Casual', value: WorkSchedule.CASUAL },
    { label: 'Seasonal', value: WorkSchedule.SEASONAL },
  ];
  const isReferedBy = watch('contract_detail.is_refered');

  return (
    <>
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

          <Field.Text name="contract_detail.position" label="Position*" />
          <Field.Text name="contract_detail.rate" label="Hourly Rate*" type="number" />
          <Field.Text name="contract_detail.area" label="Area*" />
          <Field.Text name="contract_detail.department" label="Department*" />
          <Field.Text name="contract_detail.job_number" label="Job Number*" />
          <Field.Text name="contract_detail.home_cost_centre" label="Home Cost Centre*" />
        </Box>

        <Field.Text
          name="contract_detail.comments"
          label="HR Comment*"
          multiline
          rows={2}
          fullWidth
        />

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
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
            <Typography variant="body2">Employee Type*</Typography>
            <Controller
              control={control}
              name="contract_detail.is_union"
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
                      { label: 'UNION', value: EmployeeType.UNION },
                      { label: 'NON-UNION', value: EmployeeType.NON_UNION },
                    ]}
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
            <Typography variant="body2"> Work Schedule*</Typography>
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
                    options={WORK_SCHEDULE_OPTION}
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
                    options={[
                      { label: 'UNION', value: EmployeeType.UNION },
                      { label: 'NON-UNION', value: EmployeeType.NON_UNION },
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
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
          }}
        >
          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: 1,
              px: 2,
            }}
          >
            <Typography variant="body2">Salary/Wage Type*</Typography>
            <Controller
              control={control}
              name="contract_detail.salary_wage"
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
                      { label: 'HR/WK', value: SalaryType.WK },
                      { label: 'HR/MONTH', value: SalaryType.MNTH },
                    ]}
                  />
                </Box>
              )}
            />
          </Stack>

          <Stack
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: 1,
              px: 2,
            }}
          >
            <Typography variant="body2">Was new hire refered ?</Typography>
            <Controller
              control={control}
              name="contract_detail.is_refered"
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
                      { label: 'Yes', value: RadioButtonValues.YES },
                      { label: 'No', value: RadioButtonValues.NO },
                    ]}
                  />
                </Box>
              )}
            />
          </Stack>
          {isReferedBy == 'yes' && (
            <Field.Text name="contract_detail.refered_by" label="Refered By" />
          )}
        </Box>
      </>
    </>
  );
}
