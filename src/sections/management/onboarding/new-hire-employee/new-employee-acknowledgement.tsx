import type { ManagementAgreement } from 'src/types/new-hire';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { CompanyRulesPolicies } from './company-rules-policies';
import { SafetyProtocolPolicies } from './safety-protocols-policies';
import { CompanyMotiveCameras } from './company-motive-cameras-policies';
import { CompanyFleetPolicyNCS001 } from './company-fleet-policy-ncs-001';
import { CompanyFleetPolicyGen002 } from './company-fleet-policy-gen-002';
import { CompanyFleetPolicyGen003 } from './company-fleet-policy-gen-003';
import { CompanyFleetPolicyNCS003U } from './company-fleet-policy-ncs-003U';
import { CompanyHumanResourcePolicy } from './company-human-resource-policies';
import { CompanyFireExtinguisherGuide } from './company-fire-extinguisher-guide';
import { PolicyAgreementSectionErrors } from './policy-agreement-section-errors';
import { CompanyHumanResourcePolicy704 } from './company-human-resource-policies-704';

/** Maps `setValue` path for supervisor agreement booleans → signer name field. */
const SUPERVISOR_AGREEMENT_PATH_TO_SIGNER_KEY: Record<string, keyof ManagementAgreement> = {
  'supervisor_agreement.safety_company_protocols': 'safety_company_protocols',
  'supervisor_agreement.company_rules': 'company_rules',
  'supervisor_agreement.motive_cameras': 'motive_cameras',
  'supervisor_agreement.company_fire_extiguisher': 'company_fire_extiguisher',
};

const SX_POLICY_REVIEW_SIGN_BTN = {
  minWidth: { xs: 0, md: 168 },
  width: { xs: '100%', md: 'auto' },
  boxSizing: 'border-box' as const,
  whiteSpace: 'nowrap' as const,
};
const SX_POLICY_VIEW_PDF_BTN = {
  whiteSpace: 'nowrap' as const,
  px: { xs: 2, md: 1.5 },
  width: { xs: '100%', md: 'auto' },
  boxSizing: 'border-box' as const,
  minHeight: { xs: 48, md: 36 },
};

function authAccountDisplayName(user: { displayName?: string; name?: string; email?: string } | null) {
  if (!user) return '';
  const name =
    (typeof user.displayName === 'string' && user.displayName.trim()) ||
    (typeof (user as { name?: string }).name === 'string' && (user as { name: string }).name.trim()) ||
    (typeof user.email === 'string' && user.email.trim()) ||
    '';
  return name;
}

export const SetSignature = (signature: string) => {
  localStorage.setItem('current-signature', signature);
};

export const GetCurrentSignature = () => localStorage.getItem('current-signature') || '';

/** Compare form person to logged-in user (ids may be string/number across API vs auth). */
export function managementPersonMatchesUser(
  person: { id?: string; email?: string } | null | undefined,
  currentUser: { id?: string; email?: string } | null | undefined
): boolean {
  if (!currentUser || !person) return false;

  const uid =
    currentUser.id !== undefined && currentUser.id !== null && String(currentUser.id).trim() !== ''
      ? String(currentUser.id).trim().toLowerCase()
      : '';
  const uemail = currentUser.email?.trim().toLowerCase() ?? '';

  const pid =
    person.id !== undefined && person.id !== null && String(person.id).trim() !== ''
      ? String(person.id).trim().toLowerCase()
      : '';
  const pemail = person.email?.trim().toLowerCase() ?? '';

  if (uid && pid && uid === pid) return true;
  if (uemail && pemail && uemail === pemail) return true;
  return false;
}

export function NewEmployeeAcknowledgement() {
  const {
    watch,
    setValue,
    clearErrors,
  } = useFormContext();

  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'));

  const { user } = useAuthContext();

  const SafetyProtocolDialog = useBoolean();
  const CompanyRuleDialog = useBoolean();
  const CompanyMotiveDialog = useBoolean();
  const CompanyFireExtiguisherDialog = useBoolean();
  /** Separate preview mode per policy dialog so closing one does not flash another or share stale state. */
  const safetyPolicyPreview = useBoolean();
  const companyRulesPolicyPreview = useBoolean();
  const motivePolicyPreview = useBoolean();
  const firePolicyPreview = useBoolean();

  const hr703Dialog = useBoolean();
  const hr703Preview = useBoolean();
  const hr704Dialog = useBoolean();
  const hr704Preview = useBoolean();
  const fleetNcs001Dialog = useBoolean();
  const fleetNcs001Preview = useBoolean();
  const fleetNcs003uDialog = useBoolean();
  const fleetNcs003uPreview = useBoolean();
  const fleetGen002Dialog = useBoolean();
  const fleetGen002Preview = useBoolean();
  const fleetGen003Dialog = useBoolean();
  const fleetGen003Preview = useBoolean();

  const policy_agreement = watch('policy_agreement');
  const supervisor_agreement = watch('supervisor_agreement');
  const hr_manager = watch('hr_manager');
  const supervisor = watch('supervisor');

  const [currentPolicy, setCurrentPolicy] = useState<string>('');

  /**
   * Hiring manager column uses `supervisor_agreement.*` booleans.
   * Allow signing if the user is an **admin**, or matches **hiring manager** or **supervisor** on
   * the package (many workflows only fill supervisor).
   */
  const canSignHiringManagerPolicies =
    user?.role === 'admin' ||
    managementPersonMatchesUser(hr_manager, user) ||
    managementPersonMatchesUser(supervisor, user);

  const reviewSignDisabledTooltip =
    'Only an admin, or the assigned hiring manager or supervisor on this package, can sign. Otherwise your account ID or email must match that person.';

    const applySupervisorPolicySignature = (signature: string) => {
    if (!currentPolicy) return;
    SetSignature(signature);
    setValue(currentPolicy as any, true, { shouldDirty: true, shouldValidate: true });
    const signerKey = SUPERVISOR_AGREEMENT_PATH_TO_SIGNER_KEY[currentPolicy];
    if (signerKey) {
      const opts = { shouldDirty: true, shouldValidate: true } as const;
      setValue(
        `supervisor_agreement_signer_names.${signerKey}` as const,
        authAccountDisplayName(user),
        opts
      );
      setValue(`supervisor_agreement_signatures.${signerKey}` as const, signature, opts);
      setValue(
        `supervisor_agreement_signed_at.${signerKey}` as const,
        new Date().toISOString(),
        opts
      );
      // Clear step-validation errors for this row — values are updated but RHF keeps prior setError state.
      clearErrors(`supervisor_agreement.${signerKey}` as const);
    }
  };

  return (
    <>
      <>
        <Stack>
          <Typography variant="h5">Review & Acknowledgement</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />

        <Card
          sx={{
            p: 2,
            mb: 2,
            bgcolor: 'primary.lighter',
            borderLeft: 5,
            borderColor: 'primary.main',
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Hiring manager - how to sign
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
              <li>
                Admins may sign here even when they are not the hiring manager or supervisor on file.
              </li>
              <li>
                Click <strong>Review &amp; sign</strong> on each policy row (EG Safety Protocols,
                Company Rules, Motive Cameras, Fire Extinguisher).
              </li>
              <li>
                In the dialog, review the <strong>PDF preview</strong>, check the acknowledgment
                box, draw your signature below it, then click <strong>Sign and confirm</strong>.
              </li>
              <li>
                After you confirm, the <strong>Hiring manager</strong> chip on that row turns
                green.
              </li>
            </Box>
          </Typography>
        </Card>

        {!canSignHiringManagerPolicies && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" component="span">
              <strong>Signing</strong> for the Hiring manager column is only available when you are
              an <strong>admin</strong>, or the assigned <strong>hiring manager</strong> or{' '}
              <strong>supervisor</strong> on this package (matched by account ID or email).
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Hiring manager on file:{' '}
              {hr_manager?.display_name?.trim() || '-'}{' '}
              {hr_manager?.email ? `(${hr_manager.email})` : ''}
              {' · '}
              Supervisor: {supervisor?.display_name?.trim() || '-'}{' '}
              {supervisor?.email ? `(${supervisor.email})` : ''}
              {' · '}
              You: {user?.displayName || user?.email || '-'}
            </Typography>
          </Alert>
        )}

        {/* EG Safety Protocols */}
        <Box
          id="policy-section-safety_company_protocols"
          sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}
        >
          <PolicyAgreementSectionErrors
            policyKey="safety_company_protocols"
            includeHiringManagerErrors
          />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', md: '.1fr 2fr minmax(0, 1fr)' },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'flex-start', pt: 0.25 }}>
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">EG - Safety Protocols</Typography>
            </Stack>

            <Stack
              direction="row"
              useFlexGap
              flexWrap={{ xs: 'wrap', md: 'nowrap' }}
              alignItems="center"
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              sx={{ width: '100%', gap: 1.5, rowGap: 1.5 }}
            >
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color={policy_agreement?.safety_company_protocols ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      policy_agreement?.safety_company_protocols
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />
              <Chip
                label="HIRING MANAGER"
                size="small"
                variant="soft"
                color={supervisor_agreement?.safety_company_protocols ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      supervisor_agreement?.safety_company_protocols
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />

              {!supervisor_agreement?.safety_company_protocols &&
                (canSignHiringManagerPolicies ? (
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={SX_POLICY_REVIEW_SIGN_BTN}
                    onClick={() => {
                      setCurrentPolicy('supervisor_agreement.safety_company_protocols');
                      safetyPolicyPreview.onFalse();
                      SafetyProtocolDialog.onTrue();
                    }}
                  >
                    Review & sign
                  </Button>
                ) : (
                  <Tooltip title={reviewSignDisabledTooltip}>
                    <Box
                      component="span"
                      sx={{ display: 'block', width: { xs: '100%', md: 'auto' } }}
                    >
                      <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled
                        sx={SX_POLICY_REVIEW_SIGN_BTN}
                      >
                        Review & sign
                      </Button>
                    </Box>
                  </Tooltip>
                ))}

              <Button
                type="button"
                variant="contained"
                color="inherit"
                size={isNarrow ? 'large' : 'small'}
                sx={SX_POLICY_VIEW_PDF_BTN}
                onClick={() => {
                  setCurrentPolicy('supervisor_agreement.safety_company_protocols');
                  if (
                    canSignHiringManagerPolicies &&
                    !supervisor_agreement?.safety_company_protocols
                  ) {
                    safetyPolicyPreview.onFalse();
                  } else {
                    safetyPolicyPreview.onTrue();
                  }
                  SafetyProtocolDialog.onTrue();
                }}
              >
                View
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Company Rules */}
        <Box
          id="policy-section-company_rules"
          sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}
        >
          <PolicyAgreementSectionErrors policyKey="company_rules" includeHiringManagerErrors />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', md: '.1fr 2fr minmax(0, 1fr)' },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'flex-start', pt: 0.25 }}>
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Company Rules</Typography>
            </Stack>

            <Stack
              direction="row"
              useFlexGap
              flexWrap={{ xs: 'wrap', md: 'nowrap' }}
              alignItems="center"
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              sx={{ width: '100%', gap: 1.5, rowGap: 1.5 }}
            >
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color={policy_agreement?.company_rules ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      policy_agreement?.company_rules
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />
              <Chip
                label="HIRING MANAGER"
                size="small"
                variant="soft"
                color={supervisor_agreement?.company_rules ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      supervisor_agreement?.company_rules
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />

              {!supervisor_agreement?.company_rules &&
                (canSignHiringManagerPolicies ? (
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={SX_POLICY_REVIEW_SIGN_BTN}
                    onClick={() => {
                      setCurrentPolicy('supervisor_agreement.company_rules');
                      companyRulesPolicyPreview.onFalse();
                      CompanyRuleDialog.onTrue();
                    }}
                  >
                    Review & sign
                  </Button>
                ) : (
                  <Tooltip title={reviewSignDisabledTooltip}>
                    <Box
                      component="span"
                      sx={{ display: 'block', width: { xs: '100%', md: 'auto' } }}
                    >
                      <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled
                        sx={SX_POLICY_REVIEW_SIGN_BTN}
                      >
                        Review & sign
                      </Button>
                    </Box>
                  </Tooltip>
                ))}

              <Button
                type="button"
                variant="contained"
                color="inherit"
                size={isNarrow ? 'large' : 'small'}
                sx={SX_POLICY_VIEW_PDF_BTN}
                onClick={() => {
                  setCurrentPolicy('supervisor_agreement.company_rules');
                  if (canSignHiringManagerPolicies && !supervisor_agreement?.company_rules) {
                    companyRulesPolicyPreview.onFalse();
                  } else {
                    companyRulesPolicyPreview.onTrue();
                  }
                  CompanyRuleDialog.onTrue();
                }}
              >
                View
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Motive Cameras */}
        <Box id="policy-section-motive_cameras" sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}>
          <PolicyAgreementSectionErrors policyKey="motive_cameras" includeHiringManagerErrors />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', md: '.1fr 2fr minmax(0, 1fr)' },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'flex-start', pt: 0.25 }}>
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Motive Cameras</Typography>
            </Stack>

            <Stack
              direction="row"
              useFlexGap
              flexWrap={{ xs: 'wrap', md: 'nowrap' }}
              alignItems="center"
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              sx={{ width: '100%', gap: 1.5, rowGap: 1.5 }}
            >
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color={policy_agreement?.motive_cameras ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      policy_agreement?.motive_cameras
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />
              <Chip
                label="HIRING MANAGER"
                size="small"
                variant="soft"
                color={supervisor_agreement?.motive_cameras ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      supervisor_agreement?.motive_cameras
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />

              {!supervisor_agreement?.motive_cameras &&
                (canSignHiringManagerPolicies ? (
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={SX_POLICY_REVIEW_SIGN_BTN}
                    onClick={() => {
                      setCurrentPolicy('supervisor_agreement.motive_cameras');
                      motivePolicyPreview.onFalse();
                      CompanyMotiveDialog.onTrue();
                    }}
                  >
                    Review & sign
                  </Button>
                ) : (
                  <Tooltip title={reviewSignDisabledTooltip}>
                    <Box
                      component="span"
                      sx={{ display: 'block', width: { xs: '100%', md: 'auto' } }}
                    >
                      <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled
                        sx={SX_POLICY_REVIEW_SIGN_BTN}
                      >
                        Review & sign
                      </Button>
                    </Box>
                  </Tooltip>
                ))}

              <Button
                type="button"
                variant="contained"
                color="inherit"
                size={isNarrow ? 'large' : 'small'}
                sx={SX_POLICY_VIEW_PDF_BTN}
                onClick={() => {
                  setCurrentPolicy('supervisor_agreement.motive_cameras');
                  if (canSignHiringManagerPolicies && !supervisor_agreement?.motive_cameras) {
                    motivePolicyPreview.onFalse();
                  } else {
                    motivePolicyPreview.onTrue();
                  }
                  CompanyMotiveDialog.onTrue();
                }}
              >
                View
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* FIRE EXTINGUISHER */}
        <Box
          id="policy-section-company_fire_extiguisher"
          sx={{ p: 2, bgcolor: 'divider', borderRadius: 1 }}
        >
          <PolicyAgreementSectionErrors
            policyKey="company_fire_extiguisher"
            includeHiringManagerErrors
          />
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', md: '.1fr 2fr minmax(0, 1fr)' },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'flex-start', pt: 0.25 }}>
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Fire Extinguisher</Typography>
            </Stack>

            <Stack
              direction="row"
              useFlexGap
              flexWrap={{ xs: 'wrap', md: 'nowrap' }}
              alignItems="center"
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              sx={{ width: '100%', gap: 1.5, rowGap: 1.5 }}
            >
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color={policy_agreement?.company_fire_extiguisher ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      policy_agreement?.company_fire_extiguisher
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />
              <Chip
                label="HIRING MANAGER"
                size="small"
                variant="soft"
                color={supervisor_agreement?.company_fire_extiguisher ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      supervisor_agreement?.company_fire_extiguisher
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />

              {!supervisor_agreement?.company_fire_extiguisher &&
                (canSignHiringManagerPolicies ? (
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={SX_POLICY_REVIEW_SIGN_BTN}
                    onClick={() => {
                      setCurrentPolicy('supervisor_agreement.company_fire_extiguisher');
                      firePolicyPreview.onFalse();
                      CompanyFireExtiguisherDialog.onTrue();
                    }}
                  >
                    Review & sign
                  </Button>
                ) : (
                  <Tooltip title={reviewSignDisabledTooltip}>
                    <Box
                      component="span"
                      sx={{ display: 'block', width: { xs: '100%', md: 'auto' } }}
                    >
                      <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled
                        sx={SX_POLICY_REVIEW_SIGN_BTN}
                      >
                        Review & sign
                      </Button>
                    </Box>
                  </Tooltip>
                ))}

              <Button
                type="button"
                variant="contained"
                color="inherit"
                size={isNarrow ? 'large' : 'small'}
                sx={SX_POLICY_VIEW_PDF_BTN}
                onClick={() => {
                  setCurrentPolicy('supervisor_agreement.company_fire_extiguisher');
                  if (
                    canSignHiringManagerPolicies &&
                    !supervisor_agreement?.company_fire_extiguisher
                  ) {
                    firePolicyPreview.onFalse();
                  } else {
                    firePolicyPreview.onTrue();
                  }
                  CompanyFireExtiguisherDialog.onTrue();
                }}
              >
                View
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* HR - 703 */}
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
              gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', md: '.1fr 2fr minmax(0, 1fr)' },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'flex-start', pt: 0.25 }}>
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Human Resource - Drug and Alcohol</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-HR-703
              </Typography>
            </Stack>

            <Stack
              direction="row"
              useFlexGap
              flexWrap={{ xs: 'wrap', md: 'nowrap' }}
              alignItems="center"
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              sx={{ width: '100%', gap: 1.5, rowGap: 1.5 }}
            >
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Button
                type="button"
                variant="contained"
                color="inherit"
                size={isNarrow ? 'large' : 'small'}
                sx={SX_POLICY_VIEW_PDF_BTN}
                onClick={() => {
                  hr703Preview.onTrue();
                  hr703Dialog.onTrue();
                }}
              >
                View
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* HR 704 */}
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
              gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', md: '.1fr 2fr minmax(0, 1fr)' },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'flex-start', pt: 0.25 }}>
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Human Resource - Bullying and Harassment</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-HR-704
              </Typography>
            </Stack>

            <Stack
              direction="row"
              useFlexGap
              flexWrap={{ xs: 'wrap', md: 'nowrap' }}
              alignItems="center"
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              sx={{ width: '100%', gap: 1.5, rowGap: 1.5 }}
            >
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Button
                type="button"
                variant="contained"
                color="inherit"
                size={isNarrow ? 'large' : 'small'}
                sx={SX_POLICY_VIEW_PDF_BTN}
                onClick={() => {
                  hr704Preview.onTrue();
                  hr704Dialog.onTrue();
                }}
              >
                View
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* FLEET - NCS 001 */}
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
              gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', md: '.1fr 2fr minmax(0, 1fr)' },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'flex-start', pt: 0.25 }}>
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Fleet - Pre-trip & Post Trip Policy</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-FL-NCS-001
              </Typography>
            </Stack>

            <Stack
              direction="row"
              useFlexGap
              flexWrap={{ xs: 'wrap', md: 'nowrap' }}
              alignItems="center"
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              sx={{ width: '100%', gap: 1.5, rowGap: 1.5 }}
            >
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Button
                type="button"
                variant="contained"
                color="inherit"
                size={isNarrow ? 'large' : 'small'}
                sx={SX_POLICY_VIEW_PDF_BTN}
                onClick={() => {
                  fleetNcs001Preview.onTrue();
                  fleetNcs001Dialog.onTrue();
                }}
              >
                View
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* FLEET - NCS 003U */}
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
              gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', md: '.1fr 2fr minmax(0, 1fr)' },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'flex-start', pt: 0.25 }}>
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Fleet - Use of Company Vehicles</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-FL-NCS-003U
              </Typography>
            </Stack>

            <Stack
              direction="row"
              useFlexGap
              flexWrap={{ xs: 'wrap', md: 'nowrap' }}
              alignItems="center"
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              sx={{ width: '100%', gap: 1.5, rowGap: 1.5 }}
            >
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Button
                type="button"
                variant="contained"
                color="inherit"
                size={isNarrow ? 'large' : 'small'}
                sx={SX_POLICY_VIEW_PDF_BTN}
                onClick={() => {
                  fleetNcs003uPreview.onTrue();
                  fleetNcs003uDialog.onTrue();
                }}
              >
                View
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* FLEET - GEN 002 */}
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
              gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', md: '.1fr 2fr minmax(0, 1fr)' },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'flex-start', pt: 0.25 }}>
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Fleet - Company Fuel Cards</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-PO-FL-GEN-002
              </Typography>
            </Stack>

            <Stack
              direction="row"
              useFlexGap
              flexWrap={{ xs: 'wrap', md: 'nowrap' }}
              alignItems="center"
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              sx={{ width: '100%', gap: 1.5, rowGap: 1.5 }}
            >
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Button
                type="button"
                variant="contained"
                color="inherit"
                size={isNarrow ? 'large' : 'small'}
                sx={SX_POLICY_VIEW_PDF_BTN}
                onClick={() => {
                  fleetGen002Preview.onTrue();
                  fleetGen002Dialog.onTrue();
                }}
              >
                View
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* FLEET - GEN 003 */}
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
              gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', md: '.1fr 2fr minmax(0, 1fr)' },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'flex-start', pt: 0.25 }}>
              <Iconify icon="solar:file-check-bold-duotone" />
            </Stack>
            <Stack>
              <Typography variant="body1">Fleet - Usage</Typography>
              <Typography variant="body2" color="text.disabled">
                EG-PO-PO-FL-GEN-003 GPS
              </Typography>
            </Stack>

            <Stack
              direction="row"
              useFlexGap
              flexWrap={{ xs: 'wrap', md: 'nowrap' }}
              alignItems="center"
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              sx={{ width: '100%', gap: 1.5, rowGap: 1.5 }}
            >
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
              <Button
                type="button"
                variant="contained"
                color="inherit"
                size={isNarrow ? 'large' : 'small'}
                sx={SX_POLICY_VIEW_PDF_BTN}
                onClick={() => {
                  fleetGen003Preview.onTrue();
                  fleetGen003Dialog.onTrue();
                }}
              >
                View
              </Button>
            </Stack>
          </Box>
        </Box>
      </>

      <CompanyHumanResourcePolicy
        open={hr703Dialog.value}
        onClose={() => {
          hr703Dialog.onFalse();
          hr703Preview.onFalse();
        }}
        onSave={() => {}}
        isPreview={hr703Preview.value}
      />
      <CompanyHumanResourcePolicy704
        open={hr704Dialog.value}
        onClose={() => {
          hr704Dialog.onFalse();
          hr704Preview.onFalse();
        }}
        onSave={() => {}}
        isPreview={hr704Preview.value}
      />
      <CompanyFleetPolicyNCS001
        open={fleetNcs001Dialog.value}
        onClose={() => {
          fleetNcs001Dialog.onFalse();
          fleetNcs001Preview.onFalse();
        }}
        onSave={() => {}}
        isPreview={fleetNcs001Preview.value}
      />
      <CompanyFleetPolicyNCS003U
        open={fleetNcs003uDialog.value}
        onClose={() => {
          fleetNcs003uDialog.onFalse();
          fleetNcs003uPreview.onFalse();
        }}
        onSave={() => {}}
        isPreview={fleetNcs003uPreview.value}
      />
      <CompanyFleetPolicyGen002
        open={fleetGen002Dialog.value}
        onClose={() => {
          fleetGen002Dialog.onFalse();
          fleetGen002Preview.onFalse();
        }}
        onSave={() => {}}
        isPreview={fleetGen002Preview.value}
      />
      <CompanyFleetPolicyGen003
        open={fleetGen003Dialog.value}
        onClose={() => {
          fleetGen003Dialog.onFalse();
          fleetGen003Preview.onFalse();
        }}
        onSave={() => {}}
        isPreview={fleetGen003Preview.value}
      />

      <SafetyProtocolPolicies
        open={SafetyProtocolDialog.value}
        onClose={() => {
          SafetyProtocolDialog.onFalse();
          safetyPolicyPreview.onFalse();
        }}
        onSave={(signature) => {
          SafetyProtocolDialog.onFalse();
          safetyPolicyPreview.onFalse();
          applySupervisorPolicySignature(signature);
        }}
        isPreview={safetyPolicyPreview.value}
      />

      <CompanyRulesPolicies
        open={CompanyRuleDialog.value}
        onClose={() => {
          CompanyRuleDialog.onFalse();
          companyRulesPolicyPreview.onFalse();
        }}
        onSave={(signature) => {
          CompanyRuleDialog.onFalse();
          companyRulesPolicyPreview.onFalse();
          applySupervisorPolicySignature(signature);
        }}
        isPreview={companyRulesPolicyPreview.value}
      />

      <CompanyMotiveCameras
        open={CompanyMotiveDialog.value}
        onClose={() => {
          CompanyMotiveDialog.onFalse();
          motivePolicyPreview.onFalse();
        }}
        onSave={(signature) => {
          CompanyMotiveDialog.onFalse();
          motivePolicyPreview.onFalse();
          applySupervisorPolicySignature(signature);
        }}
        isPreview={motivePolicyPreview.value}
      />

      <CompanyFireExtinguisherGuide
        open={CompanyFireExtiguisherDialog.value}
        onClose={() => {
          CompanyFireExtiguisherDialog.onFalse();
          firePolicyPreview.onFalse();
        }}
        onSave={(signature) => {
          CompanyFireExtiguisherDialog.onFalse();
          firePolicyPreview.onFalse();
          applySupervisorPolicySignature(signature);
        }}
        isPreview={firePolicyPreview.value}
      />
    </>
  );
}
