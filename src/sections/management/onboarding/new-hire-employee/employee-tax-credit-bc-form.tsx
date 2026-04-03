import { useBoolean } from 'minimal-shared/hooks';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

export const TotalClaimAmount = ({ control }: { control: any }) => {
  const formatNumber = (value: string | number) => {
    if (value === null || value === undefined || value === '') return '';

    const num = Number(value);
    if (Number.isNaN(num)) return '';

    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const values = useWatch({
    control,
    name: [
      'claims_bc.basic_claim_amount',
      'claims_bc.age_claim_amount',
      'claims_bc.pension_claim_amount',
      'claims_bc.tuition_claim_amount',
      'claims_bc.disability_claim_amount',
      'claims_bc.spouse_claim_amount',
      'claims_bc.dependant_claim_amount',
      'claims_bc.bc_caregiver_amount',
      'claims_bc.transfer_common_claim_amount',
      'claims_bc.transfer_partner_claim_amount',
    ],
  });

  const total: number = values.reduce((sum, val) => sum + (Number(val) || 0), 0);

  return (
    <Box sx={{ py: 2, px: 3, bgcolor: 'success.dark', borderRadius: 1 }}>
      <Typography variant="body2">
        <strong>{`$ ${formatNumber(total)}`}</strong>
      </Typography>
    </Box>
  );
};

export function EmployeeTaxCreditReturnBcForm() {
  const { control, getValues, setValue, reset } = useFormContext();
  const values = getValues();
  const IsNotEligible = useBoolean();

  return (
    <>
      <Stack>
        <Typography variant="h4">2026 British Columbia Personal Tax Credit Return</Typography>
      </Stack>
      <Stack>
        <Typography variant="body1" color="text.disabled">
          Read Filling out Form TD1BC Section before filling out this form. Your employer or payer
          will use this form to determine the amount of your tax deductions. Fill out this form
          based on the best estimate of your circumstances.
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
        <Field.Text name="employee.last_name" label="Last Name*" disabled />
        <Field.Text name="employee.first_name" label="First Name*" disabled />
        <Field.DatePicker
          name="employee.date_of_birth"
          label="Birthday"
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
            },
          }}
          disabled
        />
        <Field.Text name="employee.sin" label="Social Insurance Number*" disabled />

        <Field.Text name="employee.employee_number" label="Employee Number*" disabled />
        <Field.Text name="employee.country" label="Country Of Residence*" disabled />

        <Field.Text name="employee.address" label="Address*" disabled />
        <Field.Text name="employee.postal_code" label="Postal Code*" disabled />
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
            Every person employed in British Columbia and every pensioner residing in British
            Columbia can claim this amount. If you will have more than one employer or payer at the
            same time in 2026, see “More than one employer or payer at the same time” on Filling out
            Form TD1BC Section.
          </Typography>
        </Stack>
        <Field.Text type="number" name="claims_bc.basic_claim_amount" label="Enter Amount" />

        <Stack>
          <Typography variant="subtitle2">2. Age amount</Typography>
          <Typography variant="body2">
            If you will be 65 or older on December 31, 2026, and your net income will be $43,169 or
            less, enter $5,799. You may enter a partial amount if your net income for the year will
            be between $43,169 and $81,829. To calculate a partial amount, fill out the line 2
            section of Form TD1BC-WS, Worksheet for the 2026 British Columbia Personal Tax Credits
            Return.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims_bc.age_claim_amount"
          label="Enter Amount"
          inputMode="decimal"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">3. Pension income amount</Typography>
          <Typography variant="body2">
            If you will receive regular pension payments from a pension plan or fund (not including
            Canada Pension Plan, Quebec Pension Plan, old age security, or guaranteed income
            supplement payments), enter whichever is less: $1,000 or your estimated annual pension.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims_bc.pension_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">4. Tuition (full-time and part-time)</Typography>
          <Typography variant="body2">
            Fill out this section if you are a student at a university, college, or educational
            institution certified by Employment and Social Development Canada, and you will pay more
            than $100 per institution in tuition fees. Enter your total tuition fees that you will
            pay less your Canada Training Credit if you are a full-time or part-time student.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims_bc.tuition_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">5. Disability amount</Typography>
          <Typography variant="body2">
            If you will claim the disability amount on your income tax and benefit return by using
            Form T2201, Disability Tax Credit Certificate, enter $9,699.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims_bc.disability_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">6. Spouse or common-law partner amount</Typography>
          <Typography variant="body2">
            Enter $11,073 if you are supporting your spouse or common-law partner and both of the
            following conditions apply:
          </Typography>
          <Typography variant="body2" sx={{ px: 2 }}>
            • You are supporting your spouse or common-law partner who lives with you
          </Typography>
          <Typography variant="body2" sx={{ px: 2 }}>
            • Your spouse or common-law partner has a net income of $1,108 or less for the year
          </Typography>
          <Typography variant="body2">
            You may enter a partial amount if your spouse`s or common-law partner`s net income for
            the year will be between $1,108 and $12,181. To calculate a partial amount, fill out the
            line 6 section of Form TD1BC-WS.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims_bc.spouse_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">7. Amount for an eligible dependant–</Typography>
          <Typography variant="body2">
            Enter $11,073 if you are supporting an eligible dependant and all of the following
            conditions apply:
          </Typography>
          <Typography variant="body2" sx={{ px: 2 }}>
            • You do not have a spouse or common-law partner, or you have a spouse or common-law
            partner who does not live with you and who you are not supporting or being supported by
          </Typography>
          <Typography variant="body2" sx={{ px: 2 }}>
            • The dependant is related to you and lives with you
          </Typography>
          <Typography variant="body2" sx={{ px: 2 }}>
            • The dependant has a net income of $1,108 or less for the year
          </Typography>
          <Typography variant="body2">
            You may enter a partial amount if the eligible dependant’s net income for the year will
            be between $1,108 and $12,181. To calculate a partial amount, fill out the line 7
            section of Form TD1BC-WS.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims_bc.dependant_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">8. British Columbia caregiver amount</Typography>
          <Typography variant="body2">
            You may claim this amount if you are supporting your infirm spouse or common-law
            partner, or an infirm eligible dependant (age 18 or older) who is your or your spouse`s
            or common-law partner`s:
          </Typography>
          <Typography variant="body2" sx={{ px: 2 }}>
            • child or grandchild (including those of your spouse or common-law partner)
          </Typography>
          <Typography variant="body2" sx={{ px: 2 }}>
            • parent, grandparent, brother, sister, uncle, aunt, niece, or nephew who resides in
            Canada at any time in the year (including those of your spouse or common-law partner)
          </Typography>
          <Typography variant="body2">
            The infirm person`s net income for the year must be less than $24,810. To calculate this
            amount, fill out the line 8 section of Form TD1BC-WS.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims_bc.bc_caregiver_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">
            9. Amounts transferred from your spouse or common-law partner
          </Typography>
          <Typography variant="body2">
            If your spouse or common-law partner will not use all of their age amount, pension
            income amount, tuition amount, or disability amount on their income tax and benefit
            return, enter the unused amount.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims_bc.transfer_common_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">10. Amounts transferred from a dependant</Typography>
          <Typography variant="body2">
            If your dependant will not use all of their disability amount on their income tax and
            benefit return, enter the unused amount. If your spouse’s or common-law partner’s
            dependent child or grandchild will not use all of their tuition amount on their income
            tax and benefit return, enter the unused amount.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims_bc.transfer_partner_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Box
          sx={{
            py: 3,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            justifyContent="space-between"
            sx={{ px: 2 }}
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Stack>
              <Typography variant="subtitle2">TOTAL CLAIM AMOUNT</Typography>
              <Typography variant="body2">
                Add lines 1 to 10. Your employer or payer will use this amount to determine the
                amount of your provincial tax deductions.
              </Typography>
            </Stack>
            <TotalClaimAmount control={control} />
          </Stack>
        </Box>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack>
        <Typography variant="h4">Filling out Form TD1BC</Typography>
        <Typography variant="body1" color="text.disabled">
          Fill out this form only if any of the following apply:
        </Typography>
        <Box sx={{ px: 3 }}>
          <li>
            <Typography variant="body1" color="text.disabled">
              you have a new employer or payer, and you will receive salary, wages, commissions,
              pensions, employment insurance benefits, or any other remuneration
            </Typography>
          </li>
          <li>
            <Typography variant="body1" color="text.disabled">
              you want to change the amounts you previously claimed (for example, the number of your
              eligible dependants has changed)
            </Typography>
          </li>
          <li>
            <Typography variant="body1" color="text.disabled">
              you want to increase the amount of tax deducted at source
            </Typography>
          </li>
        </Box>
        <Typography variant="body1" color="text.disabled">
          Sign and date it, and give it to your employer or payer. If you do not fill out Form
          TD1BC, your employer or payer will deduct taxes after allowing the basic personal amount
          only.
        </Typography>
      </Stack>

      <Stack>
        <Box
          sx={{
            rowGap: 2,
            columnGap: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            bgcolor: 'warning.lighter',
            borderColor: 'warning.dark',
            borderRadius: 1,
            p: 2,
          }}
        >
          <Controller
            name="claims_bc.has_two_employeer"
            control={control}
            render={({ field }) => (
              <>
                <Typography variant="subtitle2" color="warning.dark">
                  More than one employer or payer at the same time
                </Typography>
                <Field.Checkbox
                  name="claims_bc.has_two_employeer"
                  label="If you have more than one employer or payer at the same time and you have already claimed personal tax credit amounts on 
another Form TD1BC for 2026, you cannot claim them again. If your total income from all sources will be more than the personal 
tax credits you claimed on another Form TD1BC, check this box, enter “0” on line 11 and do not fill in lines 2 to 10."
                  sx={{
                    color: 'warning.dark',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                  }}
                  slotProps={{
                    checkbox: {
                      onChange: async (e, checked) => {
                        field.onChange(checked);
                        setValue('claims.has_two_employeer', checked);
                        if (checked) {
                          reset({
                            ...values,
                            claims_bc: {
                              basic_claim_amount: 0,
                              age_claim_amount: 0,
                              pension_claim_amount: 0,
                              tuition_claim_amount: 0,
                              disability_claim_amount: 0,
                              spouse_claim_amount: 0,
                              dependant_claim_amount: 0,
                              bc_caregiver_amount: 0,
                              transfer_common_claim_amount: 0,
                              transfer_dependant_claim_amount: 0,
                            },
                          });
                          IsNotEligible.onTrue();
                        } else {
                          IsNotEligible.onFalse();
                        }
                      },
                    },
                  }}
                />
              </>
            )}
          />

          <Controller
            name="claims_bc.not_eligible"
            control={control}
            render={({ field }) => (
              <>
                <Typography variant="subtitle2" color="warning.dark">
                  Total income is less than the total claim amount
                </Typography>
                <Field.Checkbox
                  name="claims_bc.not_eligible"
                  label="Tick this box if your total income for the year from all employers and payers will be less than your total claim amount on line 11. Your employer 
or payer will not deduct tax from your earnings."
                  sx={{
                    color: 'warning.dark',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                  }}
                  slotProps={{
                    checkbox: {
                      onChange: async (e, checked) => {
                        field.onChange(checked);
                        setValue('claims.not_eligible', checked);
                      },
                    },
                  }}
                />
              </>
            )}
          />
        </Box>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="h4">Additional tax to be deducted</Typography>
        <Typography variant="body2" color="text.disabled">
          If you want to have more tax deducted at source, fill out section “Additional tax to be
          deducted” on the federal Form TD1.
        </Typography>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="h4">Reduction in tax deductions</Typography>
        <Typography variant="body2" color="text.disabled">
          You may ask to have less tax deducted at source if you are eligible for deductions or
          non-refundable tax credits that are not listed on this form (for example, periodic
          contributions to a registered retirement savings plan (RRSP), child care or employment
          expenses, charitable donations, and tuition and education amounts carried forward from the
          previous year). To make this request, fill out Form T1213, Request to Reduce Tax
          Deductions at Source, to get a letter of authority from your tax services office. Give the
          letter of authority to your employer or payer. You do not need a letter of authority if
          your employer deducts RRSP contributions from your salary.
        </Typography>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="h4">Forms and publications</Typography>
        <Typography variant="body2" color="text.disabled">
          To get our forms and publications, go tocanada.ca/cra-forms-publicationsor call
          1-800-959-5525
        </Typography>
      </Stack>

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
        <Typography variant="body1" color="primary.dark">
          Personal information (including the SIN) is collected and used to administer or enforce
          the Income Tax Act and related programs and activities including administering tax,
          benefits, audit, compliance, and collection. The information collected may be disclosed to
          other federal, provincial, territorial, aboriginal or foreign government institutions to
          the extent authorized by law. Failure to provide this information may result in paying
          interest or penalties, or in other actions. Under the Privacy Act, individuals have a
          right of protection, access to and correction of their personal information, and to file a
          complaint with the Privacy Commissioner of Canada regarding the handling of their personal
          information. Refer to Personal Information Bank CRA PPU 120 on Info Source
          atcanada.ca/cra-info-source.
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
          name="claims_bc.certified"
          control={control}
          render={({ field }) => (
            <>
              <Field.Checkbox
                name="claims_bc.certified"
                label="I certify that the information given on this form is correct and complete."
                sx={{
                  fontStyle: 'italic',
                  color: 'text.disabled',
                }}
                slotProps={{
                  checkbox: {
                    onChange: async (e, checked) => {
                      field.onChange(checked);
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
