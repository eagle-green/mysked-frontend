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
      'claims.basic_claim_amount',
      'claims.parent_claim_amount',
      'claims.age_claim_amount',
      'claims.pension_claim_amount',
      'claims.tuition_claim_amount',
      'claims.disability_claim_amount',
      'claims.spouse_claim_amount',
      'claims.dependant_claim_amount',
      'claims.infirm_dependent_claim_amount',
      'claims.transfer_common_claim_amount',
      'claims.transfer_partner_claim_amount',
      'claims.dependent_common_claim_amount',
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

export function EmployeeTaxCreditReturnForm() {
  const { user } = useAuthContext();
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    getValues,
    setValue,
    reset,
  } = useFormContext();

  const values = getValues();

  const IsNotEligible = useBoolean();

  const resetAmountFields = () => {
    const claims = getValues('claims');
    setValue('claims', {
      ...claims,
      basic_claim_amount: 0,
      parent_claim_amount: 0,
      age_claim_amount: 0,
      pension_claim_amount: 0,
      tuition_claim_amount: 0,
      disability_claim_amount: 0,
      spouse_claim_amount: 0,
      dependant_claim_amount: 0,
      dependent_common_claim_amount: 0,
      infirm_dependent_claim_amount: 0,
      transfer_common_claim_amount: 0,
      transfer_partner_claim_amount: 0,
    });
  };

  return (
    <>
      <Stack>
        <Typography variant="h4">2026 Personal Tax Credit Return</Typography>
      </Stack>
      <Stack>
        <Typography variant="body1" color="text.disabled">
          Read Filling out Form TD1 section before filling out this form. Your employer or payer
          will use this form to determine the amount of your tax deductions. Fill out this form
          based on the best estimate of your circumstances. If you do not fill out this form, your
          tax deductions will only include the basic personal amount, estimated by your employer or
          payer based on the income they pay you.
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
            Every resident of Canada can enter a basic personal amount of $16,129. However, if your
            net income from all sources will be greater than $177,882 and you enter $16,129, you may
            have an amount owing on your income tax and benefit return at the end of the tax year.
            If your income from all sources will be greater than $177,882 you have the option to
            calculate a partial claim. To do so, fill in the appropriate section of Form TD1-WS,
            Worksheet for the 2026 Personal Tax Credits Return, and enter the calculated amount
            here.
          </Typography>
        </Stack>
        <Field.Text type="number" name="claims.basic_claim_amount" label="Enter Amount" />

        <Stack>
          <Typography variant="subtitle2">
            2. Canada caregiver amount for infirm children under age 18
          </Typography>
          <Typography variant="body2">
            Only one parent may claim $2,687 for each infirm child born in 2008 or later who lives
            with both parents throughout the year. If the child does not live with both parents
            throughout the year, the parent who has the right to claim the “Amount for an eligible
            dependant” on line 8 may also claim the Canada caregiver amount for the child.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims.parent_claim_amount"
          label="Enter Amount"
          inputMode="decimal"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">3. Age amount</Typography>
          <Typography variant="body2">
            If you will be 65 or older on December 31, 2026, and your net income for the year from
            all sources will be $45,522 or less, enter $9,028. You may enter a partial amount if
            your net income for the year will be between $45,522 and $105,709. To calculate a
            partial amount, fill out the line 3 section of Form TD1-WS.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims.age_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">4. Pension income amount</Typography>
          <Typography variant="body2">
            If you will receive regular pension payments from a pension plan or fund (not including
            Canada Pension Plan, Quebec Pension Plan, old age security, or guaranteed income
            supplement payments), enter whichever is less: $2,000 or your estimated annual pension
            income.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims.pension_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">5. Tuition (full-time and part-time)</Typography>
          <Typography variant="body2">
            Fill in this section if you are a student at a university or college, or an educational
            institution certified by Employment and Social Development Canada, and you will pay more
            than $100 per institution in tuition fees. Enter the total tuition fees that you will
            pay if you are a full-time or part-time student.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims.tuition_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">6. Disability amount</Typography>
          <Typography variant="body2">
            If you will claim the disability amount on your income tax and benefit return by using
            Form T2201, Disability Tax Credit Certificate, enter $10,138.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims.disability_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">7. Spouse or common-law partner amount</Typography>
          <Typography variant="body2">
            Enter the difference between the amount on line 1 (line 1 plus $2,687 if your spouse or
            common-law partner is infirm) and your spouse`s or common-law partner`s estimated net
            income for the year if two of the following conditions apply:
          </Typography>
          <Typography variant="body2" sx={{ px: 2 }}>
            • You are supporting your spouse or common-law partner who lives with you
          </Typography>
          <Typography variant="body2" sx={{ px: 2 }}>
            • Your spouse or common-law partner`s net income for the year will be less than the
            amount on line 1 (line 1 plus $2,687 if your spouse or common-law partner is infirm)
          </Typography>
          <Typography variant="body2">
            In all cases, go to line 9 if your spouse or common-law partner is infirm and has a net
            income for the year of $28,798 or less.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims.spouse_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">8. Amount for an eligible dependant</Typography>
          <Typography variant="body2">
            Enter the difference between the amount on line 1 (line 1 plus $2,687 if your eligible
            dependant is infirm) and your eligible dependant’s estimated net income for the year if
            all of the following conditions apply:
          </Typography>
          <Typography variant="body2" sx={{ px: 2 }}>
            • You do not have a spouse or common-law partner, or you have a spouse or common-law
            partner who does not live with you and who you are not supporting or being supported by
          </Typography>
          <Typography variant="body2" sx={{ px: 2 }}>
            • You are supporting the dependant who is related to you and lives with you
          </Typography>
          <Typography variant="body2" sx={{ px: 2 }}>
            • The dependant’s net income for the year will be less than the amount on line 1 (line 1
            plus $2,687 if your dependant is infirm)
          </Typography>
          <Typography variant="body2">
            In all cases, go to line 9 if your dependant is 18 years or older, infirm, and has a net
            income for the year of $28,798 or less.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims.dependant_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">
            9. Canada caregiver amount for eligible dependant or spouse or common-law partner
          </Typography>
          <Typography variant="body2">
            Fill out this section if, at any time in the year, you support an infirm eligible
            dependant (aged 18 or older) or an infirm spouse or common-law partner whose net income
            for the year will be $28,798 or less. To calculate this amount you may enter here, fill
            out the line 9 section of Form TD1-WS.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims.dependent_common_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">
            10. Canada caregiver amount for dependant(s) age 18 or older
          </Typography>
          <Typography variant="body2">
            If, at any time in the year, you support an infirm dependant age 18 or older (other than
            the spouse or common-law partner or eligible dependant you claimed an amount on line 9
            or could have claimed an amount for if their net income were under $18,816) whose net
            income for the year is $8,601, or may enter a partial amount if their net income for the
            year is between $20,197 and $28,798. To calculate a partial amount, fill out the line 10
            section of Form TD1-WS. This worksheet may also be used to calculate your part of the
            amount if you are sharing it with another caregiver who supports the same dependant. You
            may claim this amount for more than one infirm dependant age 18 or older.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims.transfer_common_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">
            11. Amounts transferred from your spouse or common-law partner
          </Typography>
          <Typography variant="body2">
            If your spouse or common-law partner will not use all of their age amount, pension
            income amount, tuition amount, or disability amount on their income tax and benefit
            return, enter the unused amount.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims.transfer_partner_claim_amount"
          label="Enter Amount"
          disabled={IsNotEligible.value}
        />

        <Stack>
          <Typography variant="subtitle2">12. Amounts transferred from a dependant</Typography>
          <Typography variant="body2">
            If your dependant will not use all of their disability amount on their income tax and
            benefit return, enter the unused amount. If your or your spouse’s or common-law
            partner’s dependant child or grandchild will not use all of their tuition amount on
            their income tax and benefit return, enter the unused amount.
          </Typography>
        </Stack>
        <Field.Text
          type="number"
          name="claims.infirm_dependent_claim_amount"
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
                Add lines 1 to 12. Your employer or payer will use this amount to determine the
                amount of your tax deductions.
              </Typography>
            </Stack>
            <TotalClaimAmount control={control} />
          </Stack>
        </Box>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack>
        <Typography variant="h4">Filling out Form TD1</Typography>
        <Typography variant="body1" color="text.disabled">
          Fill out this form only if any of the following apply:
        </Typography>
        <Box sx={{ px: 3 }}>
          <li>
            <Typography variant="body1" color="text.disabled">
              You have a new employer or payer, and you will receive salary, wages, commissions,
              pensions, employment insurance benefits, or any other remuneration
            </Typography>
          </li>
          <li>
            <Typography variant="body1" color="text.disabled">
              You want to change the amounts you previously claimed (for example, the number of your
              eligible dependants has changed)
            </Typography>
          </li>
          <li>
            <Typography variant="body1" color="text.disabled">
              You want to claim the deduction for living in a prescribed zone
            </Typography>
          </li>
          <li>
            <Typography variant="body1" color="text.disabled">
              You want to increase the amount of tax deducted at source
            </Typography>
          </li>
        </Box>
        <Typography variant="body1" color="text.disabled">
          Sign and date it, and give it to your employer or payer.
        </Typography>
      </Stack>

      <Stack>
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
            name="claims.has_two_employeer"
            control={control}
            render={({ field }) => (
              <>
                <Typography variant="subtitle2" color="warning.dark">
                  More than one employer or payer at the same time
                </Typography>
                <Field.Checkbox
                  name="claims.has_two_employeer"
                  label="If you have more than one employer or payer at the same time and you have already claimed personal tax credit amounts on another Form TD1 
for 2026, you cannot claim them again. If your total income from all sources will be more than the personal tax credits you claimed on another 
Form TD1, check this box, enter “0” on Line 13 and do not fill in Lines 2 to 12."
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
                        if (checked) {
                          resetAmountFields();
                          IsNotEligible.onTrue();
                        } else {
                          const { claims } = values;
                          if (!claims.is_non_resident || claims.is_non_resident == 'yes') {
                            IsNotEligible.onFalse();
                          }
                        }
                      },
                    },
                  }}
                />
              </>
            )}
          />

          <Controller
            name="claims.not_eligible"
            control={control}
            render={({ field }) => (
              <>
                <Typography variant="subtitle2" color="warning.dark">
                  Total income is less than the total claim amount
                </Typography>
                <Field.Checkbox
                  name="claims.not_eligible"
                  label="Tick this box if your total income for the year from all employers and payers will be less than your total claim amount on line 13. Your employer 
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
                      },
                    },
                  }}
                />
              </>
            )}
          />
        </Box>
      </Stack>

      <Stack>
        <Typography variant="h4">For Non-Resident only</Typography>
        <Typography variant="body1" color="text.disabled">
          As a non-resident, will 90% or more of your world income be included in determining your
          taxable income earned in Canada in 2026?
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
          name="claims.is_non_resident"
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
                      'No (Enter “0” on line 13, and do not fill in lines 2 to 12 as you are not entitled to the personal tax credits.)',
                    value: 'no',
                  },
                ]}
                onChange={(element) => {
                  field.onChange(element);
                  const { has_two_employeer } = getValues('claims');
                  if (element.target.value == 'no') {
                    resetAmountFields();
                    IsNotEligible.onTrue();
                  } else {
                    if (!has_two_employeer) {
                      IsNotEligible.onFalse();
                    }
                  }
                }}
              />
            </Box>
          )}
        />
        <Typography variant="body2" color="text.disabled">
          Call the international tax and non-resident enquiries line at 1-800-959-8281 if you are
          unsure of your residency status.
        </Typography>
      </Box>

      <Stack spacing={2}>
        <Typography variant="h4">Provincial or territorial personal tax credits return</Typography>
        <Typography variant="body2" color="text.disabled">
          You also have to fill out a provincial or territorial TD1 form if your claim amount on
          line 13 is more than $16,129. Use the Form TD1 for your province or territory of
          employment if you are an employee. Use the Form TD1 for your province or territory of
          residence if you are a pensioner. Your employer or payer will use both this federal form
          and your most recent provincial or territorial Form TD1 to determine the amount of your
          tax deductions.
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Your employer or payer will deduct provincial or territorial taxes after allowing the
          provincial or territorial basic personal amount if you are claiming the basic personal
          amount only.
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Note: You may be able to claim the child amount on Form TD1SK, 2026 Saskatchewan Personal
          Tax Credits Return if you are a Saskatchewan resident supporting children under 18 at any
          time during 2026. Therefore, you may want to fill out Form TD1SK even if you are only
          claiming the basic personal amount on this form.
        </Typography>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="h4">Deduction for living in a prescribed zone</Typography>
        <Typography variant="body2" color="text.disabled">
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
        <Typography variant="body2" color="text.disabled">
          Employees living in a prescribed **intermediate zone** may claim 50% of the total of the
          above amounts. For more information, go to canada.ca/taxes-northern-residents
        </Typography>
      </Stack>
      <Field.Text name="claims.deduction_living_prescribed_zone" label="Enter Amount" />

      {/* <Card
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
      </Card> */}

      <Stack spacing={1}>
        <Typography variant="h4">Additional tax to be deducted</Typography>
        <Typography variant="body2" color="text.disabled">
          You may want to have more tax deducted from each payment if you receive other income such
          as non-employment income from CPP or QPP benefits, or old age security pension. You may
          have less tax to pay when you file your income tax and benefit return by doing this. Enter
          the additional tax amount you want deducted from each payment to choose this option. You
          may fill out a new Form TD1 to change this deduction later.
        </Typography>
      </Stack>
      <Field.Text name="claims.addition_tax_deducted" label="Enter Amount" />

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
          To get our forms and publications, go to canada.ca/cra-forms-publications or call
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
          information. Refer to Personal Information Bank CRA PPU 120 on Info Source at
          canada.ca/cra-info-source.
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
          name="claims.certified"
          control={control}
          render={({ field }) => (
            <>
              <Field.Checkbox
                name="claims.certified"
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
