import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

export function EmployeeReturnTaxForm() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
  } = useFormContext();

  const NEW_HIRE_FORMS = [
    { value: 'employment_offer', label: 'Offer of Employment – Hiring Manager to complete' },
    { value: 'offer_letter', label: 'Offer Letter – Non Union' },
    { value: 'rehire_form', label: 'New Hire – Rehire Employee Form' },
    { value: 'emergency_consent', label: 'Employee Emergency/Consent Information Sheet' },
    { value: 'equipement_form', label: 'Equipment Form' },
    { value: 'direct_deposit', label: 'Direct Deposit Authorization' },
    { value: 'federal_td1', label: 'Federal TD1' },
    { value: 'provincial_td1', label: 'Provincial TD1 ' },
    { value: 'safety_manual', label: 'EG Health and Safety Manual' },
    { value: 'diversity_eg', label: 'Celebrate Diversity at - EG' },
    { value: 'vacation_non_union', label: 'Vacation – Non-Union – Employee to Keep' },
    { value: 'handbook', label: 'Handbook – Acknowledgment of Receipt ' },
    { value: 'fleet_form', label: 'Fleet Forms – See requiredfleet documentation checklist' },
  ];
  return (
    <>
      <Stack>
        <Typography variant="h4">2026 Personal Tax Credit Return</Typography>
      </Stack>
      <Stack>
        <Typography variant="body1" color="text.disabled">
          Complete this form and give it to your employeer or payer so they can determine how much
          income tax to deduct from your pay.
        </Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack>
        <Typography variant="h4">Personal Information</Typography>
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
        <Field.Text name="last_name" label="Last Name*" />
        <Field.Text name="first_name" label="First Name*" />
        <Field.Text name="social_insurance_number" label="Social Insurance Number*" />

        <Field.DatePicker
          name="birth_date"
          label="Birthday"
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
        />

        <Field.Text name="employee_number" label="Employee Number*" />
        <Field.Text name="country_residence" label="Country Of Residence*" />

        <Field.Text name="address" label="Address*" />
        <Field.Text name="postal_code" label="Postal Code*" />
      </Box>

      <Stack>
        <Typography variant="h4">Claim Amounts</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
        <Stack>
          <Typography variant="subtitle2">1. Basic personal amount</Typography>
          <Typography variant="body2">
            Every resident of Canada can enter a basic personal amount of $16,129.00. If your net
            income from all sources will be greater than $173,205.00, you may need to use the
            worksheet for the 2025 Personal Tax Credit Return.
          </Typography>
        </Stack>
        <Field.Text name="personal_amount" label="Enter Amount" />

        <Stack>
          <Typography variant="subtitle2">
            2. Canada caregiver amount for infirm children under age 18
          </Typography>
          <Typography variant="body2">
            Either parent may claim $2,654.00 for each infirm child born in 2008 or later, that
            lives with both parents throughout the year.
          </Typography>
        </Stack>
        <Field.Text name="infirm_children_amount" label="Enter Amount" />

        <Stack>
          <Typography variant="subtitle2">3. Age amount</Typography>
          <Typography variant="body2">
            If you will be 65 or older on December 31, 2025, and yout net income for the year from
            all sources will $44,815.00 or less, enter $8,995.00
          </Typography>
        </Stack>
        <Field.Text name="age_amount" label="Enter Amount" />

        <Stack>
          <Typography variant="subtitle2">4. Pension income amount</Typography>
          <Typography variant="body2">
            Enter the amount you will receive during the year (up to $2,000) from a pension plan or
            annuity.
          </Typography>
        </Stack>
        <Field.Text name="pension_income_amount" label="Enter Amount" />

        <Stack>
          <Typography variant="subtitle2">5. Tuition (full-time and part-time)</Typography>
          <Typography variant="body2">
            If you are a student, enter the total tuition fees you will pay for 2025, This should be
            over $100.00 per institution.
          </Typography>
        </Stack>
        <Field.Text name="tuition_amount" label="Enter Amount" />

        <Stack>
          <Typography variant="subtitle2">6. Disability Amount</Typography>
          <Typography variant="body2">
            If you are eligible for the disability tax credit, enter $10,149.00. Use Form T2201
          </Typography>
        </Stack>
        <Field.Text name="disability_amount" label="Enter Amount" />

        <Stack>
          <Typography variant="subtitle2">7. Spouse or Common-law partner amount</Typography>
          <Typography variant="body2">
            If you support your spouse or common-law partner and their net income will be less than
            $16,129.00 ($18,783.00 if infirm).
          </Typography>
        </Stack>
        <Field.Text name="partner_amount" label="Enter Amount" />

        <Stack>
          <Typography variant="subtitle2">8. Amount for an eligible dependent</Typography>
          <Typography variant="body2">
            If you do not have a spouse/partner and you support a dependant relative who live with
            you.
          </Typography>
        </Stack>
        <Field.Text name="eligible_dependent_amount" label="Enter Amount" />

        <Stack>
          <Typography variant="subtitle2">
            9. Canada caregiver amount for other infirm dependents
          </Typography>
          <Typography variant="body2">
            If you support an infirm dependent age 18 or older whose net income will be $8,421.00 or
            less.
          </Typography>
        </Stack>
        <Field.Text name="infirm_dependent_amount" label="Enter Amount" />

        <Stack>
          <Typography variant="subtitle2">
            10. Amount transferred from your spouse or partner
          </Typography>
          <Typography variant="body2">
            Amounts your spouse/partner cannot use on their return (age, pension. disability,
            tuition)
          </Typography>
        </Stack>
        <Field.Text name="partner_transferred_amount" label="Enter Amount" />

        <Stack>
          <Typography variant="subtitle2">
            11. Amount transferred from your spouse or partner
          </Typography>
          <Typography variant="body2">
            Amounts that a dependent cannot use on their return (disability, tuition)
          </Typography>
        </Stack>
        <Field.Text name="dependent_transferred_amount" label="Enter Amount" />

        <Box
          sx={{
            py: 3,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ px: 2 }}>
            <Typography variant="subtitle2">TOTAL CLAIM AMOUNT</Typography>
            <Typography variant="body2">$0.00</Typography>
          </Stack>
        </Box>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            bgcolor: 'warning.lighter',
            borderColor: 'warning.dark',
            borderRadius: 1,
            p: 2,
          }}
        >
          <Controller
            name="taxCredit.number_of_employeer"
            control={control}
            render={({ field }) => (
              <>
                <Typography variant="subtitle2" color="warning.dark">
                  More than one employer or payer at the same time
                </Typography>
                <Field.Checkbox
                  name="taxCredit.number_of_employeer"
                  label={`If you have more than one employer or payer at the same time and you have already claimed personal tax credit amounts on another Form TD1 for 2026,
                            you cannot claim them again. If your total income from all sources will be more than the personal tax credits you claimed on another Form TD1, check
                            this box, enter "0" on Line 13 and do not fill in Lines 2 to 12.`}
                  sx={{
                    color: 'warning.dark',
                  }}
                  slotProps={{
                    checkbox: {
                      onChange: async (e, checked) => {
                        field.onChange(checked);
                        setTimeout(async () => {
                          const isValid = await trigger('taxCredit.number_of_employeer');
                          if (isValid) {
                            clearErrors('taxCredit.number_of_employeer');
                          }
                        }, 50);
                      },
                    },
                  }}
                />
              </>
            )}
          />

          <Controller
            name="taxCredit.is_total_income_amount"
            control={control}
            render={({ field }) => (
              <>
                <Typography variant="subtitle2" color="warning.dark">
                  Total income is less than the total claim amount
                </Typography>
                <Field.Checkbox
                  name="taxCredit.is_total_income_amount"
                  label={`Tick this box if your total income for the year from all employers and payers will be less than your total claim amount on line 13. Your employer or payer
                          will not deduct tax from your earnings.`}
                  sx={{
                    color: 'warning.dark',
                  }}
                  slotProps={{
                    checkbox: {
                      onChange: async (e, checked) => {
                        field.onChange(checked);
                        setTimeout(async () => {
                          const isValid = await trigger('taxCredit.is_total_income_amount');
                          if (isValid) {
                            clearErrors('taxCredit.is_total_income_amount');
                          }
                        }, 50);
                      },
                    },
                  }}
                />
              </>
            )}
          />
        </Box>
      </Box>

      <Stack>
        <Typography variant="h4">For Non-Resident only</Typography>
        <Typography variant="body1" color="text.disabled">
          As a non-resident, will 90% or more of your world income be included in determining your
          taxable income earned in Canada 2026 ?
        </Typography>
      </Stack>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          width: 1,
        }}
      >
        <Controller
          control={control}
          name="taxReturn.isNonResident"
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
                  { label: 'Yes (Fill out the previous page)', value: 'yes' },
                  {
                    label:
                      'No (Enter "0" on line 13, and do not fill in lines 2 to 12 as you are not entitled to the personal tax credits)',
                    value: 'no',
                  },
                ]}
              />
            </Box>
          )}
        />
      </Box>

      <Stack>
        <Typography variant="body2" color="text.disabled">
          Call the international tax and non-resident enquiries line at 1-800-959-8281 if you are
          unsure of your residency status.
        </Typography>
        <Typography variant="h4">Provincial or territorial personal tax credits return</Typography>
      </Stack>

      <Card
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'primary.lighter',
          color: 'primary.dark',
          borderRadius: 1,
        }}
      >
        <Typography variant="body1" color="primary.dark">
          You also have to fill out a provincial or territorial TD1 form if your claim amount on
          line 13 is more than $16,452. Use the Form TD1 for your province or territory of
          employment if you are an employee. Use the Form TD1 for your province or territory of
          residence if you are a pensioner. Your employer or payer will use both this federal form
          and your most recent provincial or territorial Form TD1 to determine the amount of your
          tax deductions.
        </Typography>

        <Typography sx={{ px: 2 }}>
          <strong>Note:</strong> You may be able to claim the child amount on Form TD1SK, 2026
          Saskatchewan Personal Tax Credits Return if you are a Saskatchewan resident supporting
          children under 18 at any time during 2026. Therefore, you may want to fill out Form TD1SK
          even if you are only claiming the basic personal amount on this form.
        </Typography>
      </Card>

      <Stack>
        <Typography variant="subtitle2">Deduction for living in a prescribed zone</Typography>
        <Typography variant="body2">
          You may claim any of the following amounts if you live in the Northwest Territories,
          Nunavut, Yukon, or another prescribed northern zone for more than six months in a row
          beginning or ending in 2026:
        </Typography>

        <Typography variant="body2" sx={{ px: 2 }}>
          • $11.00 for each day that you live in the prescribed northern zone
        </Typography>

        <Typography variant="body2" sx={{ px: 2 }}>
          • $22.00 for each day that you live in the prescribed northern zone if, during that time,
          you live in a dwelling that you maintain, and you are the only person living in that
          dwelling who is claiming this deduction
        </Typography>

        <Typography variant="body2">
          Employees living in a prescribed intermediate zone may claim 50% of the total of the above
          amounts.
        </Typography>
      </Stack>
      <Field.Text name="deduction_living_prescribed_zone" label="Enter Amount" />

      <Stack>
        <Typography variant="subtitle2">Additional tax to be deducted</Typography>
        <Typography variant="body2">
          You may want to have more tax deducted from each payment if you receive other income such
          as non-employment income from CPP or QPP benefits, or old age security pension. You may
          have less tax to pay when you file your income tax and benefit return by doing this. Enter
          the additional tax amount you want deducted from each payment to choose this option. You
          may fill out a new Form TD1 to change this deduction later.
        </Typography>
      </Stack>
      <Field.Text name="addition_tax_deducted" label="Enter Amount" />

      <Card
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'primary.lighter',
          color: 'primary.dark',
          borderRadius: 1,
        }}
      >
        <Typography variant="subtitle2">Reduction in tax deductions</Typography>

        <Typography variant="body1" color="primary.dark">
          You may ask to have less tax deducted at source if you are eligible for deductions or
          non-refundable tax credits that are not listed on this form (for example, periodic
          contributions to a registered retirement savings plan (RRSP), child care or employment
          expenses, charitable donations, and tuition and education amounts carried forward from the
          previous year). To make this request, fill out Form T1213, Request to Reduce Tax
          Deductions at Source, to get a letter of authority from your tax services office. Give the
          letter of authority to your employer or payer. You do not need a letter of authority if
          your employer deducts RRSP contributions from your salary.
        </Typography>
      </Card>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          width: 1,
        }}
      >
        <Controller
          name="taxCredit.acknowledged"
          control={control}
          render={({ field }) => (
            <>
              <Field.Checkbox
                name="taxCredit.acknowledged"
                label="I certify that the information given on this form is correct and complete."
                sx={{
                  fontStyle: 'italic',
                  color: 'text.disabled',
                }}
                slotProps={{
                  checkbox: {
                    onChange: async (e, checked) => {
                      field.onChange(checked);
                      setTimeout(async () => {
                        const isValid = await trigger(
                          'taxCredit.is_total_inacknowledgedcome_amount'
                        );
                        if (isValid) {
                          clearErrors('taxCredit.acknowledged');
                        }
                      }, 50);
                    },
                  },
                }}
              />
            </>
          )}
        />
      </Box>
    </>
  );
}
