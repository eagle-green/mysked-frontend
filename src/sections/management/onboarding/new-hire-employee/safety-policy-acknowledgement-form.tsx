import { useBoolean } from 'minimal-shared/hooks';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { CompanyRulesPolicies } from './company-rules-policies';
import { SafetyProtocolPolicies } from './safety-protocols-policies';
import { CompanyMotiveCameras } from './company-motive-cameras-policies';
import { CompanyFleetPolicyGen002 } from './company-fleet-policy-gen-002';
import { CompanyFleetPolicyNCS001 } from './company-fleet-policy-ncs-001';
import { CompanyFleetPolicyGen003 } from './company-fleet-policy-gen-003';
import { CompanyFleetPolicyNCS003U } from './company-fleet-policy-ncs-003U';
import { CompanyHumanResourcePolicy } from './company-human-resource-policies';
import { CompanyFireExtinguisherGuide } from './company-fire-extinguisher-guide';
import { CompanyHumanResourcePolicy704 } from './company-human-resource-policies-704';

export function SafetyPolicyAcknowledgementForm() {
  const { user } = useAuthContext();
  const companyHumanResourcePoliciesDialog = useBoolean();
  const companyHumanResourcePolicies704Dialog = useBoolean();
  const CompanyFleetPolicyNCS001Dialog = useBoolean();
  const CompanyFleetPolicyNCS003UDialog = useBoolean();
  const CompanyFleetPolicyGen002Dialog = useBoolean();
  const CompanyFleetPolicyGen003Dialog = useBoolean();
  const CompanyFireExtiguisherDialog = useBoolean();
  const SafetyProtocolDialog = useBoolean();
  const CompanyRulesDialog = useBoolean();
  const CompanyMotiveCamerasDialog = useBoolean();

  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    getValues,
    setValue,
  } = useFormContext();

  const { employee, policy_agreement } = getValues();

  return (
    <>
      <Stack>
        <Typography variant="h4">Safety Protocols & Company Policies Agreement</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Stack>
        {errors.policy_agreement && (
          <Card
            sx={{
              p: 2,
              mb: 3,
              bgcolor: errors.policy_agreement ? 'error.lighter' : 'primary.lighter',
              borderLeft: 5,
              borderColor: errors.policy_agreement ? 'error.dark' : 'primary.dark',
            }}
          >
            <Typography
              variant="body2"
              color={errors.policy_agreement ? 'error.dark' : 'primary.dark'}
            >
              You must review & accept all policies before proceeding.
            </Typography>
          </Card>
        )}
      </Stack>
      <Stack>
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Safety Protocols</Typography>
              <Typography variant="body2" color="text.disabled">
                EAGLEGREEN
              </Typography>
            </Stack>

            <Stack alignItems="flex-end" justifyContent="center">
              {policy_agreement.safety_company_protocols ? (
                <Chip
                  label="SIGNED"
                  size="small"
                  variant="soft"
                  color="success"
                  sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                  icon={<Iconify icon="solar:check-circle-bold" />}
                />
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={SafetyProtocolDialog.onTrue}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Company Rules</Typography>
              <Typography variant="body2" color="text.disabled">
                EAGLEGREEN
              </Typography>
            </Stack>

            <Stack alignItems="flex-end" justifyContent="center">
              {policy_agreement.company_rules ? (
                <Chip
                  label="SIGNED"
                  size="small"
                  variant="soft"
                  color="success"
                  sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                  icon={<Iconify icon="solar:check-circle-bold" />}
                />
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={CompanyRulesDialog.onTrue}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Motive Cameras</Typography>
              <Typography variant="body2" color="text.disabled">
                EAGLEGREEN
              </Typography>
            </Stack>

            <Stack alignItems="flex-end" justifyContent="center">
              {policy_agreement.motive_cameras ? (
                <Chip
                  label="SIGNED"
                  size="small"
                  variant="soft"
                  color="success"
                  sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                  icon={<Iconify icon="solar:check-circle-bold" />}
                />
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={CompanyMotiveCamerasDialog.onTrue}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Human Resource - Drug and Alcohol</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-HR-703
              </Typography>
            </Stack>

            <Stack alignItems="flex-end" justifyContent="center">
              {policy_agreement.company_hr_policies_703 ? (
                <Chip
                  label="SIGNED"
                  size="small"
                  variant="soft"
                  color="success"
                  sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                  icon={<Iconify icon="solar:check-circle-bold" />}
                />
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={companyHumanResourcePoliciesDialog.onTrue}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>

            <Stack>
              <Typography variant="body1">Human Resource - Bullying and Harassment</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-HR-704
              </Typography>
            </Stack>

            <Stack alignItems="flex-end" justifyContent="center">
              {policy_agreement.company_hr_policies_704 ? (
                <Chip
                  label="SIGNED"
                  size="small"
                  variant="soft"
                  color="success"
                  sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                  icon={<Iconify icon="solar:check-circle-bold" />}
                />
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={companyHumanResourcePolicies704Dialog.onTrue}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>

            <Stack>
              <Typography variant="body1">Fleet - Pre-trip & Post Trip Policy</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-FL-NCS-001
              </Typography>
            </Stack>

            <Stack alignItems="flex-end" justifyContent="center">
              {policy_agreement.company_fleet_policies_ncs_001 ? (
                <Chip
                  label="SIGNED"
                  size="small"
                  variant="soft"
                  color="success"
                  sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                  icon={<Iconify icon="solar:check-circle-bold" />}
                />
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={CompanyFleetPolicyNCS001Dialog.onTrue}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>

            <Stack>
              <Typography variant="body1">Fleet - Use of Company Vehicles</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-FL-NCS-003U
              </Typography>
            </Stack>

            <Stack alignItems="flex-end" justifyContent="center">
              {policy_agreement.company_fleet_policies_ncs_003u ? (
                <Chip
                  label="SIGNED"
                  size="small"
                  variant="soft"
                  color="success"
                  sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                  icon={<Iconify icon="solar:check-circle-bold" />}
                />
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={CompanyFleetPolicyNCS003UDialog.onTrue}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>

            <Stack>
              <Typography variant="body1">Fleet - Company Fuel Cards</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-PO-FL-GEN-002
              </Typography>
            </Stack>

            <Stack alignItems="flex-end" justifyContent="center">
              {policy_agreement.company_fleet_policies_gen_002 ? (
                <Chip
                  label="SIGNED"
                  size="small"
                  variant="soft"
                  color="success"
                  sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                  icon={<Iconify icon="solar:check-circle-bold" />}
                />
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={CompanyFleetPolicyGen002Dialog.onTrue}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>

            <Stack>
              <Typography variant="body1">Fleet - Usage</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-PO-FL-GEN-003 GPS
              </Typography>
            </Stack>

            <Stack alignItems="flex-end" justifyContent="center">
              {policy_agreement.company_fleet_policies_gen_003 ? (
                <Chip
                  label="SIGNED"
                  size="small"
                  variant="soft"
                  color="success"
                  sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                  icon={<Iconify icon="solar:check-circle-bold" />}
                />
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={CompanyFleetPolicyGen003Dialog.onTrue}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack alignItems="center" direction="row">
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>

            <Stack>
              <Typography variant="body1">Fire Extinguisher Guide</Typography>
              <Typography variant="body2" color="text.disabled">
                EAGLEGREEN
              </Typography>
            </Stack>

            <Stack alignItems="flex-end" justifyContent="center">
              {policy_agreement.company_fire_extiguisher ? (
                <Chip
                  label="SIGNED"
                  size="small"
                  variant="soft"
                  color="success"
                  sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                  icon={<Iconify icon="solar:check-circle-bold" />}
                />
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={CompanyFireExtiguisherDialog.onTrue}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <CompanyHumanResourcePolicy
        open={companyHumanResourcePoliciesDialog.value}
        onClose={companyHumanResourcePoliciesDialog.onFalse}
        onSave={() => {
          setValue('policy_agreement.company_hr_policies_703', true);
        }}
      />

      <CompanyHumanResourcePolicy704
        open={companyHumanResourcePolicies704Dialog.value}
        onClose={companyHumanResourcePolicies704Dialog.onFalse}
        onSave={() => {
          setValue('policy_agreement.company_hr_policies_704', true);
        }}
      />

      <CompanyFleetPolicyNCS001
        open={CompanyFleetPolicyNCS001Dialog.value}
        onClose={CompanyFleetPolicyNCS001Dialog.onFalse}
        onSave={() => {
          setValue('policy_agreement.company_fleet_policies_ncs_001', true);
        }}
      />

      <CompanyFleetPolicyNCS003U
        open={CompanyFleetPolicyNCS003UDialog.value}
        onClose={CompanyFleetPolicyNCS003UDialog.onFalse}
        onSave={() => {
          setValue('policy_agreement.company_fleet_policies_ncs_003u', true);
        }}
      />

      <CompanyFleetPolicyGen002
        open={CompanyFleetPolicyGen002Dialog.value}
        onClose={CompanyFleetPolicyGen002Dialog.onFalse}
        onSave={() => {
          setValue('policy_agreement.company_fleet_policies_gen_002', true);
        }}
      />

      <CompanyFleetPolicyGen003
        open={CompanyFleetPolicyGen003Dialog.value}
        onClose={CompanyFleetPolicyGen003Dialog.onFalse}
        onSave={() => {
          setValue('policy_agreement.company_fleet_policies_gen_003', true);
        }}
      />

      <CompanyFireExtinguisherGuide
        open={CompanyFireExtiguisherDialog.value}
        onClose={CompanyFireExtiguisherDialog.onFalse}
        onSave={() => {
          setValue('policy_agreement.company_fire_extiguisher', true);
        }}
      />

      <SafetyProtocolPolicies
        open={SafetyProtocolDialog.value}
        onClose={SafetyProtocolDialog.onFalse}
        onSave={() => {
          setValue('policy_agreement.safety_company_protocols', true);
        }}
      />

      <CompanyRulesPolicies
        open={CompanyRulesDialog.value}
        onClose={CompanyRulesDialog.onFalse}
        onSave={() => {
          setValue('policy_agreement.company_rules', true);
        }}
      />

      <CompanyMotiveCameras
        open={CompanyMotiveCamerasDialog.value}
        onClose={CompanyMotiveCamerasDialog.onFalse}
        onSave={() => {
          setValue('policy_agreement.motive_cameras', true);
        }}
      />
    </>
  );
}
