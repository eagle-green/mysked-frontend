import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { fDate, formatPatterns } from 'src/utils/format-time';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

import { SignatureDialog } from './signature';

export function EmployeeSocialCommitteeForm() {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
    trigger,
    clearErrors,
  } = useFormContext();
  const socialSigDialog = useBoolean();
  const [socialSigKey, setSocialSigKey] = useState(0);
  const socialCommitteeSignature = watch('social_committee_signature');
  const socialAgreement = watch('socialAgreement');
  const authorizeDeduction = Boolean(socialAgreement?.authorize_deduction);
  const notAgreeDeduction = Boolean(socialAgreement?.not_agree_deduction);
  const hasSelectedSocialOption = Boolean(
    socialAgreement?.is_join_social_committee || authorizeDeduction || notAgreeDeduction
  );

  const AGREEMENT = [
    {
      value: 'is_join_social_committee',
      label: `I would like to join the (EG) Employee Social Committee.`,
    },
    {
      value: 'authorize_deduction',
      label:
        'I authorize a deduction of $1.00 per pay period to go towards the Social Fund and become a member of the Social Club.',
    },
    {
      value: 'not_agree_deduction',
      label:
        'I do not agree to have money deducted from my paycheque and do not want to become a member of the Social Club.',
    },
  ];

  return (
    <>
      <Stack>
        <Typography variant="h4">Employee Social Committee Enrollment Form</Typography>
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
          <Typography variant="subtitle1">Re: Employee Social Committee</Typography>
        </Stack>
        <Stack>
          <Typography variant="body1">
            Welcome to Eagle Green LLP The Company has formed a committee of employees to manage
            social events that employees can enjoy throughout the year. This committee arranges and
            pays for all kinds of functions and fundraisers, such as barbeques, picnics, adopting a
            family at Christmas and the annual Christmas Party. This committee operates separately
            from the Company.
          </Typography>
        </Stack>
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
        <Stack>
          <Typography variant="subtitle1">How does it works ?</Typography>
        </Stack>
        <Card
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'primary.lighter',
            borderLeft: 5,
            borderColor: 'primary.dark',
          }}
        >
          <Typography variant="body1" color="primary.dark">
            Employees contribute <strong>$1.00 per pay period</strong>, which is deducted from their
            weekly paycheque. The Company then matches that dollar amount each pay period. The
            committee meets and decides what functions will be organized and how the money in the
            social fund will be spent.
          </Typography>
        </Card>
      </Box>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {AGREEMENT.filter((opt) => opt.value).map((option) => {
            const isAuthorize = option.value === 'authorize_deduction';
            const isNotAgree = option.value === 'not_agree_deduction';
            const mutuallyExclusiveDisabled =
              (isAuthorize && notAgreeDeduction) || (isNotAgree && authorizeDeduction);

            return (
              <Box
                key={option.value}
                sx={{
                  bgcolor: 'divider',
                  py: 2,
                  px: 1,
                  borderRadius: 1,
                }}
              >
                <Controller
                  name={`socialAgreement.${option.value}`}
                  control={control}
                  render={({ field }) => (
                    <Field.Checkbox
                      name={`socialAgreement.${option.value}`}
                      label={option.label}
                      slotProps={{
                        checkbox: {
                          disabled: mutuallyExclusiveDisabled,
                          onChange: async (e, checked) => {
                            field.onChange(checked);
                            if (isAuthorize && checked) {
                              setValue('socialAgreement.not_agree_deduction', false, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }
                            if (isNotAgree && checked) {
                              setValue('socialAgreement.authorize_deduction', false, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }
                            setTimeout(async () => {
                              const isValid = await trigger('socialAgreement');
                              if (isValid) {
                                clearErrors('socialAgreement');
                              }
                            }, 50);
                          },
                        },
                      }}
                    />
                  )}
                />
              </Box>
            );
          })}
        </Box>
      </Box>

      {!socialCommitteeSignature && (
        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
            mt: 1,
          }}
        >
          <Button
            type="button"
            variant="contained"
            size="large"
            disabled={!hasSelectedSocialOption}
            onClick={() => {
              setSocialSigKey((k) => k + 1);
              socialSigDialog.onTrue();
            }}
            fullWidth
            startIcon={<Iconify icon="solar:pen-bold" />}
            sx={{
              display: { xs: 'flex', sm: 'inline-flex' },
              width: { xs: '100%', sm: 'auto' },
              py: { xs: 1.5, sm: 0.875 },
              fontSize: { xs: '1rem', sm: '0.875rem' },
            }}
          >
            Add Signature
          </Button>
        </Box>
      )}
      {errors.social_committee_signature && (
        <FormHelperText error sx={{ ml: 0, pl: 1 }}>
          {errors.social_committee_signature.message as string}
        </FormHelperText>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 5,
          mt: 2,
        }}
      >
        {socialCommitteeSignature && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: { xs: 'center', md: 'flex-end' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 5,
              width: '100%',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  maxHeight: 120,
                  '& img': { maxWidth: '100%', maxHeight: 120, objectFit: 'contain' },
                }}
              >
                <img src={socialCommitteeSignature} alt="Social committee enrollment signature" />
              </Box>
              <Typography variant="subtitle1">
                EMPLOYEE&apos;S SIGNATURE
                <IconButton
                  type="button"
                  onClick={() => {
                    setSocialSigKey((k) => k + 1);
                    socialSigDialog.onTrue();
                  }}
                  aria-label="Edit signature"
                >
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                (Signature Over Printed Name)
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1">
                {fDate(new Date(), formatPatterns.split.date)}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                (Date Signed)
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Stack>
        <Typography variant="h4">Celebrate Diversity at Eagle Green LLP</Typography>
      </Stack>
      <Stack>
        <Typography variant="body1">
          Eagle Green hires on the basis of merit and is committed to diversity and employment
          equity within the community.
        </Typography>
      </Stack>
      <Stack>
        <Typography variant="body1">
          To ensure that we are doing our part, we collect information in accordance with the
          Employment Equity Act and the Freedom of Information and Protection ofPrivacy Act,
          regarding the employment equity status of employees.
        </Typography>
      </Stack>

      <Stack>
        <Typography variant="h4">Confidentiality</Typography>
      </Stack>

      <Card
        sx={{
          px: 4,
          py: 2,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <li>
          <Typography variant="body1">
            Informationyou provide is collected in accordance with the Employment Equity Act and the
            Freedom of Information and Protection of Privacy Act, and will betreated with the
            strictest confidence
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Surveys will not be shared with supervisors or managers.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Paper surveys are returned in a sealed envelopetoEmployee Services for entry.
          </Typography>
        </li>
        <li>
          <Typography variant="body1">
            Responses to this survey will be analyzed only in summary form and will be kept
            separately fiom employee files
          </Typography>
        </li>
      </Card>

      <Stack>
        <Typography variant="body1">
          If you do not wish to participate in the survey, please check the box below:
        </Typography>
      </Stack>

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
            bgcolor: 'divider',
            py: 2,
            px: 1,
            borderRadius: 1,
          }}
        >
          <Controller
            name="celebrate_diversity_consent"
            control={control}
            render={({ field }) => (
              <Field.Checkbox
                name="celebrate_diversity_consent"
                label="I have reviewed the content of the Employment Equity Survey and do not wish to participate."
                slotProps={{
                  checkbox: {
                    onChange: async (e, checked) => {
                      field.onChange(checked);
                      setTimeout(async () => {
                        const isValid = await trigger('celebrate_diversity_consent');
                        if (isValid) {
                          clearErrors('celebrate_diversity_consent');
                        }
                      }, 50);
                    },
                  },
                }}
              />
            )}
          />
        </Box>
      </Box>

      <SignatureDialog
        key={socialSigKey}
        title="Employee Social Committee enrollment form"
        type="social_committee"
        dialog={socialSigDialog}
        freshSignatureOnOpen
        onSave={(signature) => {
          socialSigDialog.onFalse();
          if (signature) {
            setValue('social_committee_signature', signature, {
              shouldValidate: true,
              shouldDirty: true,
            });
            trigger(['social_committee_signature']);
          }
        }}
        onCancel={() => socialSigDialog.onFalse()}
      />
    </>
  );
}
