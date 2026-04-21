import type { PolicyAgreement } from 'src/types/new-hire';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Iconify } from 'src/components/iconify/iconify';

import { CompanyRulesPolicies } from './company-rules-policies';
import { SafetyProtocolPolicies } from './safety-protocols-policies';
import { CompanyMotiveCameras } from './company-motive-cameras-policies';
import { CompanyFleetPolicyGen002 } from './company-fleet-policy-gen-002';
import { CompanyFleetPolicyNCS001 } from './company-fleet-policy-ncs-001';
import { CompanyFleetPolicyGen003 } from './company-fleet-policy-gen-003';
import { CompanyFleetPolicyNCS003U } from './company-fleet-policy-ncs-003U';
import { CompanyHumanResourcePolicy } from './company-human-resource-policies';
import { CompanyFireExtinguisherGuide } from './company-fire-extinguisher-guide';
import { PolicyAgreementSectionErrors } from './policy-agreement-section-errors';
import { CompanyHumanResourcePolicy704 } from './company-human-resource-policies-704';

/** Larger touch targets on narrow viewports next to “View”. */
const SX_POLICY_SIGNED_CHIP = {
  width: 'fit-content' as const,
  height: { xs: 40, md: 25 },
  fontSize: { xs: '0.875rem', md: '.75rem' },
  '& .MuiChip-icon': { fontSize: { xs: '1.125rem', md: '1rem' } },
};

const SX_VIEW_SIGNED_POLICY_BASE = {
  bgcolor: 'grey.900',
  color: 'common.white',
  '&:hover': { bgcolor: 'grey.800' },
};

export function SafetyPolicyAcknowledgementForm() {
  const isMobile = useMediaQuery('(max-width:768px)');
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

  const [policyPreviewKey, setPolicyPreviewKey] = useState<keyof PolicyAgreement | null>(null);

  const { watch, setValue, clearErrors } = useFormContext();

  const policy_agreement = watch('policy_agreement');

  const savePolicySignature = (key: keyof PolicyAgreement, signature: string) => {
    setValue(`policy_agreement.${key}`, true, { shouldValidate: true, shouldDirty: true });
    setValue(`policy_agreement_signatures.${key}`, signature, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`policy_agreement_signed_at.${key}`, new Date().toISOString(), {
      shouldValidate: true,
      shouldDirty: true,
    });
    clearErrors(`policy_agreement.${key}`);
    clearErrors(`policy_agreement_signatures.${key}`);
  };

  return (
    <>
      <Stack>
        <Typography variant="h4">Safety Protocols & Company Policies Agreement</Typography>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Stack>
        <Box
          id="policy-section-safety_company_protocols"
          sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}
        >
          <PolicyAgreementSectionErrors policyKey="safety_company_protocols" />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack
              direction="row"
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'flex-start', pt: 0.25 }}
            >
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Safety Protocols</Typography>
              <Typography variant="body2" color="text.disabled">
                EAGLEGREEN
              </Typography>
            </Stack>

            <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} justifyContent="center">
              {policy_agreement.safety_company_protocols ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                  <Chip
                    label="SIGNED"
                    size="small"
                    variant="soft"
                    color="success"
                    sx={SX_POLICY_SIGNED_CHIP}
                    icon={<Iconify icon="solar:check-circle-bold" />}
                  />
                  <Button
                    type="button"
                    variant="contained"
                    size={isMobile ? 'large' : 'small'}
                    sx={{
                      ...SX_VIEW_SIGNED_POLICY_BASE,
                      ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                    }}
                    onClick={() => setPolicyPreviewKey('safety_company_protocols')}
                  >
                    View
                  </Button>
                </Stack>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size={isMobile ? 'large' : 'small'}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    minWidth: { md: '100px' },
                    ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                  }}
                  onClick={() => {
                    setPolicyPreviewKey(null);
                    SafetyProtocolDialog.onTrue();
                  }}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box
          id="policy-section-company_rules"
          sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}
        >
          <PolicyAgreementSectionErrors policyKey="company_rules" />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack
              direction="row"
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'flex-start', pt: 0.25 }}
            >
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Company Rules</Typography>
              <Typography variant="body2" color="text.disabled">
                EAGLEGREEN
              </Typography>
            </Stack>

            <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} justifyContent="center">
              {policy_agreement.company_rules ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                  <Chip
                    label="SIGNED"
                    size="small"
                    variant="soft"
                    color="success"
                    sx={SX_POLICY_SIGNED_CHIP}
                    icon={<Iconify icon="solar:check-circle-bold" />}
                  />
                  <Button
                    type="button"
                    variant="contained"
                    size={isMobile ? 'large' : 'small'}
                    sx={{
                      ...SX_VIEW_SIGNED_POLICY_BASE,
                      ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                    }}
                    onClick={() => setPolicyPreviewKey('company_rules')}
                  >
                    View
                  </Button>
                </Stack>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size={isMobile ? 'large' : 'small'}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    minWidth: { md: '100px' },
                    ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                  }}
                  onClick={() => {
                    setPolicyPreviewKey(null);
                    CompanyRulesDialog.onTrue();
                  }}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box id="policy-section-motive_cameras" sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <PolicyAgreementSectionErrors policyKey="motive_cameras" />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack
              direction="row"
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'flex-start', pt: 0.25 }}
            >
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Motive Cameras</Typography>
              <Typography variant="body2" color="text.disabled">
                EAGLEGREEN
              </Typography>
            </Stack>

            <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} justifyContent="center">
              {policy_agreement.motive_cameras ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                  <Chip
                    label="SIGNED"
                    size="small"
                    variant="soft"
                    color="success"
                    sx={SX_POLICY_SIGNED_CHIP}
                    icon={<Iconify icon="solar:check-circle-bold" />}
                  />
                  <Button
                    type="button"
                    variant="contained"
                    size={isMobile ? 'large' : 'small'}
                    sx={{
                      ...SX_VIEW_SIGNED_POLICY_BASE,
                      ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                    }}
                    onClick={() => setPolicyPreviewKey('motive_cameras')}
                  >
                    View
                  </Button>
                </Stack>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size={isMobile ? 'large' : 'small'}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    minWidth: { md: '100px' },
                    ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                  }}
                  onClick={() => {
                    setPolicyPreviewKey(null);
                    CompanyMotiveCamerasDialog.onTrue();
                  }}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box
          id="policy-section-company_hr_policies_703"
          sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}
        >
          <PolicyAgreementSectionErrors policyKey="company_hr_policies_703" />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack
              direction="row"
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'flex-start', pt: 0.25 }}
            >
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Human Resource - Drug and Alcohol</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-HR-703
              </Typography>
            </Stack>

            <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} justifyContent="center">
              {policy_agreement.company_hr_policies_703 ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                  <Chip
                    label="SIGNED"
                    size="small"
                    variant="soft"
                    color="success"
                    sx={SX_POLICY_SIGNED_CHIP}
                    icon={<Iconify icon="solar:check-circle-bold" />}
                  />
                  <Button
                    type="button"
                    variant="contained"
                    size={isMobile ? 'large' : 'small'}
                    sx={{
                      ...SX_VIEW_SIGNED_POLICY_BASE,
                      ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                    }}
                    onClick={() => setPolicyPreviewKey('company_hr_policies_703')}
                  >
                    View
                  </Button>
                </Stack>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size={isMobile ? 'large' : 'small'}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    minWidth: { md: '100px' },
                    ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                  }}
                  onClick={() => {
                    setPolicyPreviewKey(null);
                    companyHumanResourcePoliciesDialog.onTrue();
                  }}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box
          id="policy-section-company_hr_policies_704"
          sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}
        >
          <PolicyAgreementSectionErrors policyKey="company_hr_policies_704" />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack
              direction="row"
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'flex-start', pt: 0.25 }}
            >
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>

            <Stack>
              <Typography variant="body1">Human Resource - Bullying and Harassment</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-HR-704
              </Typography>
            </Stack>

            <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} justifyContent="center">
              {policy_agreement.company_hr_policies_704 ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                  <Chip
                    label="SIGNED"
                    size="small"
                    variant="soft"
                    color="success"
                    sx={SX_POLICY_SIGNED_CHIP}
                    icon={<Iconify icon="solar:check-circle-bold" />}
                  />
                  <Button
                    type="button"
                    variant="contained"
                    size={isMobile ? 'large' : 'small'}
                    sx={{
                      ...SX_VIEW_SIGNED_POLICY_BASE,
                      ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                    }}
                    onClick={() => setPolicyPreviewKey('company_hr_policies_704')}
                  >
                    View
                  </Button>
                </Stack>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size={isMobile ? 'large' : 'small'}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    minWidth: { md: '100px' },
                    ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                  }}
                  onClick={() => {
                    setPolicyPreviewKey(null);
                    companyHumanResourcePolicies704Dialog.onTrue();
                  }}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box
          id="policy-section-company_fleet_policies_ncs_001"
          sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}
        >
          <PolicyAgreementSectionErrors policyKey="company_fleet_policies_ncs_001" />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack
              direction="row"
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'flex-start', pt: 0.25 }}
            >
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>

            <Stack>
              <Typography variant="body1">Fleet - Pre-trip & Post Trip Policy</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-FL-NCS-001
              </Typography>
            </Stack>

            <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} justifyContent="center">
              {policy_agreement.company_fleet_policies_ncs_001 ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                  <Chip
                    label="SIGNED"
                    size="small"
                    variant="soft"
                    color="success"
                    sx={SX_POLICY_SIGNED_CHIP}
                    icon={<Iconify icon="solar:check-circle-bold" />}
                  />
                  <Button
                    type="button"
                    variant="contained"
                    size={isMobile ? 'large' : 'small'}
                    sx={{
                      ...SX_VIEW_SIGNED_POLICY_BASE,
                      ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                    }}
                    onClick={() => setPolicyPreviewKey('company_fleet_policies_ncs_001')}
                  >
                    View
                  </Button>
                </Stack>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size={isMobile ? 'large' : 'small'}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    minWidth: { md: '100px' },
                    ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                  }}
                  onClick={() => {
                    setPolicyPreviewKey(null);
                    CompanyFleetPolicyNCS001Dialog.onTrue();
                  }}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box
          id="policy-section-company_fleet_policies_ncs_003u"
          sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}
        >
          <PolicyAgreementSectionErrors policyKey="company_fleet_policies_ncs_003u" />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack
              direction="row"
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'flex-start', pt: 0.25 }}
            >
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>

            <Stack>
              <Typography variant="body1">Fleet - Use of Company Vehicles</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-FL-NCS-003U
              </Typography>
            </Stack>

            <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} justifyContent="center">
              {policy_agreement.company_fleet_policies_ncs_003u ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                  <Chip
                    label="SIGNED"
                    size="small"
                    variant="soft"
                    color="success"
                    sx={SX_POLICY_SIGNED_CHIP}
                    icon={<Iconify icon="solar:check-circle-bold" />}
                  />
                  <Button
                    type="button"
                    variant="contained"
                    size={isMobile ? 'large' : 'small'}
                    sx={{
                      ...SX_VIEW_SIGNED_POLICY_BASE,
                      ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                    }}
                    onClick={() => setPolicyPreviewKey('company_fleet_policies_ncs_003u')}
                  >
                    View
                  </Button>
                </Stack>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size={isMobile ? 'large' : 'small'}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    minWidth: { md: '100px' },
                    ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                  }}
                  onClick={() => {
                    setPolicyPreviewKey(null);
                    CompanyFleetPolicyNCS003UDialog.onTrue();
                  }}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box
          id="policy-section-company_fleet_policies_gen_002"
          sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}
        >
          <PolicyAgreementSectionErrors policyKey="company_fleet_policies_gen_002" />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack
              direction="row"
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'flex-start', pt: 0.25 }}
            >
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>

            <Stack>
              <Typography variant="body1">Fleet - Company Fuel Cards</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-PO-FL-GEN-002
              </Typography>
            </Stack>

            <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} justifyContent="center">
              {policy_agreement.company_fleet_policies_gen_002 ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                  <Chip
                    label="SIGNED"
                    size="small"
                    variant="soft"
                    color="success"
                    sx={SX_POLICY_SIGNED_CHIP}
                    icon={<Iconify icon="solar:check-circle-bold" />}
                  />
                  <Button
                    type="button"
                    variant="contained"
                    size={isMobile ? 'large' : 'small'}
                    sx={{
                      ...SX_VIEW_SIGNED_POLICY_BASE,
                      ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                    }}
                    onClick={() => setPolicyPreviewKey('company_fleet_policies_gen_002')}
                  >
                    View
                  </Button>
                </Stack>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size={isMobile ? 'large' : 'small'}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    minWidth: { md: '100px' },
                    ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                  }}
                  onClick={() => {
                    setPolicyPreviewKey(null);
                    CompanyFleetPolicyGen002Dialog.onTrue();
                  }}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box
          id="policy-section-company_fleet_policies_gen_003"
          sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}
        >
          <PolicyAgreementSectionErrors policyKey="company_fleet_policies_gen_003" />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack
              direction="row"
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'flex-start', pt: 0.25 }}
            >
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>

            <Stack>
              <Typography variant="body1">Fleet - Usage</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-PO-FL-GEN-003 GPS
              </Typography>
            </Stack>

            <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} justifyContent="center">
              {policy_agreement.company_fleet_policies_gen_003 ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                  <Chip
                    label="SIGNED"
                    size="small"
                    variant="soft"
                    color="success"
                    sx={SX_POLICY_SIGNED_CHIP}
                    icon={<Iconify icon="solar:check-circle-bold" />}
                  />
                  <Button
                    type="button"
                    variant="contained"
                    size={isMobile ? 'large' : 'small'}
                    sx={{
                      ...SX_VIEW_SIGNED_POLICY_BASE,
                      ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                    }}
                    onClick={() => setPolicyPreviewKey('company_fleet_policies_gen_003')}
                  >
                    View
                  </Button>
                </Stack>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size={isMobile ? 'large' : 'small'}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    minWidth: { md: '100px' },
                    ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                  }}
                  onClick={() => {
                    setPolicyPreviewKey(null);
                    CompanyFleetPolicyGen003Dialog.onTrue();
                  }}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <Stack>
        <Box
          id="policy-section-company_fire_extiguisher"
          sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}
        >
          <PolicyAgreementSectionErrors policyKey="company_fire_extiguisher" />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: '.1fr 2fr 1fr' },
            }}
          >
            <Stack
              direction="row"
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'flex-start', pt: 0.25 }}
            >
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>

            <Stack>
              <Typography variant="body1">Fire Extinguisher Guide</Typography>
              <Typography variant="body2" color="text.disabled">
                EAGLEGREEN
              </Typography>
            </Stack>

            <Stack alignItems={{ xs: 'stretch', md: 'flex-end' }} justifyContent="center">
              {policy_agreement.company_fire_extiguisher ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                  <Chip
                    label="SIGNED"
                    size="small"
                    variant="soft"
                    color="success"
                    sx={SX_POLICY_SIGNED_CHIP}
                    icon={<Iconify icon="solar:check-circle-bold" />}
                  />
                  <Button
                    type="button"
                    variant="contained"
                    size={isMobile ? 'large' : 'small'}
                    sx={{
                      ...SX_VIEW_SIGNED_POLICY_BASE,
                      ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                    }}
                    onClick={() => setPolicyPreviewKey('company_fire_extiguisher')}
                  >
                    View
                  </Button>
                </Stack>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size={isMobile ? 'large' : 'small'}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    minWidth: { md: '100px' },
                    ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
                  }}
                  onClick={() => {
                    setPolicyPreviewKey(null);
                    CompanyFireExtiguisherDialog.onTrue();
                  }}
                >
                  Review Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>

      <CompanyHumanResourcePolicy
        open={
          companyHumanResourcePoliciesDialog.value ||
          policyPreviewKey === 'company_hr_policies_703'
        }
        isPreview={
          policyPreviewKey === 'company_hr_policies_703' &&
          !companyHumanResourcePoliciesDialog.value
        }
        onClose={() => {
          companyHumanResourcePoliciesDialog.onFalse();
          setPolicyPreviewKey((k) => (k === 'company_hr_policies_703' ? null : k));
        }}
        onSave={(signature) => {
          savePolicySignature('company_hr_policies_703', signature);
        }}
      />

      <CompanyHumanResourcePolicy704
        open={
          companyHumanResourcePolicies704Dialog.value ||
          policyPreviewKey === 'company_hr_policies_704'
        }
        isPreview={
          policyPreviewKey === 'company_hr_policies_704' &&
          !companyHumanResourcePolicies704Dialog.value
        }
        onClose={() => {
          companyHumanResourcePolicies704Dialog.onFalse();
          setPolicyPreviewKey((k) => (k === 'company_hr_policies_704' ? null : k));
        }}
        onSave={(signature) => {
          savePolicySignature('company_hr_policies_704', signature);
        }}
      />

      <CompanyFleetPolicyNCS001
        open={
          CompanyFleetPolicyNCS001Dialog.value ||
          policyPreviewKey === 'company_fleet_policies_ncs_001'
        }
        isPreview={
          policyPreviewKey === 'company_fleet_policies_ncs_001' &&
          !CompanyFleetPolicyNCS001Dialog.value
        }
        onClose={() => {
          CompanyFleetPolicyNCS001Dialog.onFalse();
          setPolicyPreviewKey((k) => (k === 'company_fleet_policies_ncs_001' ? null : k));
        }}
        onSave={(signature) => {
          savePolicySignature('company_fleet_policies_ncs_001', signature);
        }}
      />

      <CompanyFleetPolicyNCS003U
        open={
          CompanyFleetPolicyNCS003UDialog.value ||
          policyPreviewKey === 'company_fleet_policies_ncs_003u'
        }
        isPreview={
          policyPreviewKey === 'company_fleet_policies_ncs_003u' &&
          !CompanyFleetPolicyNCS003UDialog.value
        }
        onClose={() => {
          CompanyFleetPolicyNCS003UDialog.onFalse();
          setPolicyPreviewKey((k) => (k === 'company_fleet_policies_ncs_003u' ? null : k));
        }}
        onSave={(signature) => {
          savePolicySignature('company_fleet_policies_ncs_003u', signature);
        }}
      />

      <CompanyFleetPolicyGen002
        open={
          CompanyFleetPolicyGen002Dialog.value ||
          policyPreviewKey === 'company_fleet_policies_gen_002'
        }
        isPreview={
          policyPreviewKey === 'company_fleet_policies_gen_002' &&
          !CompanyFleetPolicyGen002Dialog.value
        }
        onClose={() => {
          CompanyFleetPolicyGen002Dialog.onFalse();
          setPolicyPreviewKey((k) => (k === 'company_fleet_policies_gen_002' ? null : k));
        }}
        onSave={(signature) => {
          savePolicySignature('company_fleet_policies_gen_002', signature);
        }}
      />

      <CompanyFleetPolicyGen003
        open={
          CompanyFleetPolicyGen003Dialog.value ||
          policyPreviewKey === 'company_fleet_policies_gen_003'
        }
        isPreview={
          policyPreviewKey === 'company_fleet_policies_gen_003' &&
          !CompanyFleetPolicyGen003Dialog.value
        }
        onClose={() => {
          CompanyFleetPolicyGen003Dialog.onFalse();
          setPolicyPreviewKey((k) => (k === 'company_fleet_policies_gen_003' ? null : k));
        }}
        onSave={(signature) => {
          savePolicySignature('company_fleet_policies_gen_003', signature);
        }}
      />

      <CompanyFireExtinguisherGuide
        open={
          CompanyFireExtiguisherDialog.value ||
          policyPreviewKey === 'company_fire_extiguisher'
        }
        isPreview={
          policyPreviewKey === 'company_fire_extiguisher' &&
          !CompanyFireExtiguisherDialog.value
        }
        onClose={() => {
          CompanyFireExtiguisherDialog.onFalse();
          setPolicyPreviewKey((k) => (k === 'company_fire_extiguisher' ? null : k));
        }}
        onSave={(signature) => {
          savePolicySignature('company_fire_extiguisher', signature);
        }}
      />

      <SafetyProtocolPolicies
        open={
          SafetyProtocolDialog.value || policyPreviewKey === 'safety_company_protocols'
        }
        isPreview={
          policyPreviewKey === 'safety_company_protocols' && !SafetyProtocolDialog.value
        }
        onClose={() => {
          SafetyProtocolDialog.onFalse();
          setPolicyPreviewKey((k) => (k === 'safety_company_protocols' ? null : k));
        }}
        onSave={(signature) => {
          savePolicySignature('safety_company_protocols', signature);
        }}
      />

      <CompanyRulesPolicies
        open={CompanyRulesDialog.value || policyPreviewKey === 'company_rules'}
        isPreview={policyPreviewKey === 'company_rules' && !CompanyRulesDialog.value}
        onClose={() => {
          CompanyRulesDialog.onFalse();
          setPolicyPreviewKey((k) => (k === 'company_rules' ? null : k));
        }}
        onSave={(signature) => {
          savePolicySignature('company_rules', signature);
        }}
      />

      <CompanyMotiveCameras
        open={CompanyMotiveCamerasDialog.value || policyPreviewKey === 'motive_cameras'}
        isPreview={policyPreviewKey === 'motive_cameras' && !CompanyMotiveCamerasDialog.value}
        onClose={() => {
          CompanyMotiveCamerasDialog.onFalse();
          setPolicyPreviewKey((k) => (k === 'motive_cameras' ? null : k));
        }}
        onSave={(signature) => {
          savePolicySignature('motive_cameras', signature);
        }}
      />
    </>
  );
}
