import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { SignatureDialog } from './signature';
import { CompanyRulesPolicies } from './company-rules-policies';
import { SafetyProtocolPolicies } from './safety-protocols-policies';
import { CompanyMotiveCameras } from './company-motive-cameras-policies';
import { CompanyFireExtinguisherGuide } from './company-fire-extinguisher-guide';

export const SetSignature = (signature: string) => {
  localStorage.setItem('current-signature', signature);
};

export const GetCurrentSignature = () => localStorage.getItem('current-signature') || '';

export function NewEmployeeAcknowledgement() {
  const {
    control,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
    setValue,
    getValues,
  } = useFormContext();

  const { user } = useAuthContext();

  const SafetyProtocolDialog = useBoolean();
  const CompanyRuleDialog = useBoolean();
  const CompanyMotiveDialog = useBoolean();
  const CompanyFireExtiguisherDialog = useBoolean();
  const signatureDialog = useBoolean();
  const isPreview = useBoolean();
  const {
    policy_agreement,
    supervisor_agreement,
    safety_manager_agreement,
    supervisor,
    safety_manager,
  } = getValues();
  const [currentPolicy, setCurrentPolicy] = useState<string>('');

  const isSupervisor = supervisor.id === user?.id;
  const isSafetyManger = safety_manager.id === user?.id;

  const renderSignature = () => (
    <SignatureDialog
      title=""
      type=""
      dialog={signatureDialog}
      onSave={(signature, type) => {
        if (signature) {
          SetSignature(signature);
          setValue(currentPolicy, true);
        }
      }}
      onCancel={() => {
        setValue(currentPolicy, false);
      }}
    />
  );

  return (
    <>
      <>
        <Stack>
          <Typography variant="h5">Review & Acknowledgement</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack>
          {(errors.supervisor_agreement || errors.safety_manager_agreement) && (
            <Card
              sx={{
                p: 2,
                mb: 3,
                bgcolor:
                  errors.supervisor_agreement || errors.safety_manager_agreementt
                    ? 'error.lighter'
                    : 'primary.lighter',
                borderLeft: 5,
                borderColor:
                  errors.supervisor_agreement || errors.safety_manager_agreement
                    ? 'error.dark'
                    : 'primary.dark',
              }}
            >
              <Typography
                variant="body2"
                color={
                  errors.supervisor_agreement || errors.safety_manager_agreement
                    ? 'error.dark'
                    : 'primary.dark'
                }
              >
                You must review & accept all policies before proceeding.
              </Typography>
            </Card>
          )}
        </Stack>

        {/* EG Safety Protocols */}
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
              <Typography variant="body1">EG - Safety Protocols</Typography>
            </Stack>

            <Stack alignItems="center" justifyContent="flex-end" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color={policy_agreement.safety_company_protocols ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      policy_agreement.safety_company_protocols
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />
              <Chip
                label="SUPERVISOR"
                size="small"
                variant="soft"
                color={supervisor_agreement.safety_company_protocols ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      supervisor_agreement.safety_company_protocols
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />

              <Chip
                label="SAFETY MANAGER"
                size="small"
                variant="soft"
                color={safety_manager_agreement.safety_company_protocols ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      safety_manager_agreement.safety_company_protocols
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />

              {isSupervisor && !supervisor_agreement.safety_company_protocols && (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={() => {
                    setCurrentPolicy('supervisor_agreement.safety_company_protocols');
                    SafetyProtocolDialog.onTrue();
                  }}
                >
                  Sign Now
                </Button>
              )}

              {isSafetyManger && !safety_manager_agreement.safety_company_protocols && (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={() => {
                    setCurrentPolicy('safety_manager_agreement.safety_company_protocols');
                    SafetyProtocolDialog.onTrue();
                  }}
                >
                  Sign Now
                </Button>
              )}

              {((isSupervisor && supervisor_agreement.safety_company_protocols) ||
                (isSafetyManger && safety_manager_agreement.safety_company_protocols) ||
                (!isSafetyManger && !isSupervisor)) && (
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={() => {
                    SafetyProtocolDialog.onTrue();
                    isPreview.onTrue();
                  }}
                >
                  View Policy
                </Button>
              )}
            </Stack>
          </Box>
        </Box>

        {/* Company Rules */}
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
            </Stack>

            <Stack alignItems="center" justifyContent="flex-end" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color={policy_agreement.company_rules ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      policy_agreement.company_rules
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />
              <Chip
                label="SUPERVISOR"
                size="small"
                variant="soft"
                color={supervisor_agreement.company_rules ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      supervisor_agreement.company_rules
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />

              <Chip
                label="SAFETY MANAGER"
                size="small"
                variant="soft"
                color={safety_manager_agreement.company_rules ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      safety_manager_agreement.company_rules
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />

              {isSupervisor && !supervisor_agreement.company_rules && (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={() => {
                    setCurrentPolicy('supervisor_agreement.company_rules');
                    CompanyRuleDialog.onTrue();
                  }}
                >
                  Sign Now
                </Button>
              )}

              {isSafetyManger && !safety_manager_agreement.company_rules && (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={() => {
                    setCurrentPolicy('safety_manager_agreement.company_rules');
                    CompanyRuleDialog.onTrue();
                  }}
                >
                  Sign Now
                </Button>
              )}

              {((isSupervisor && supervisor_agreement.company_rules) ||
                (isSafetyManger && safety_manager_agreement.company_rules) ||
                (!isSafetyManger && !isSupervisor)) && (
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={() => {
                    CompanyRuleDialog.onTrue();
                    isPreview.onTrue();
                  }}
                >
                  View Policy
                </Button>
              )}
            </Stack>
          </Box>
        </Box>

        {/* Motive Cameras */}
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
            </Stack>

            <Stack alignItems="center" justifyContent="flex-end" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color={policy_agreement.motive_cameras ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      policy_agreement.motive_cameras
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />
              <Chip
                label="SUPERVISOR"
                size="small"
                variant="soft"
                color={supervisor_agreement.motive_cameras ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      supervisor_agreement.motive_cameras
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />

              <Chip
                label="SAFETY MANAGER"
                size="small"
                variant="soft"
                color={safety_manager_agreement.motive_cameras ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      safety_manager_agreement.motive_cameras
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />

              {isSupervisor && !supervisor_agreement.motive_cameras && (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={() => {
                    setCurrentPolicy('supervisor_agreement.motive_cameras');
                    CompanyMotiveDialog.onTrue();
                  }}
                >
                  Sign Now
                </Button>
              )}

              {isSafetyManger && !safety_manager_agreement.motive_cameras && (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={() => {
                    setCurrentPolicy('safety_manager_agreement.motive_cameras');
                    CompanyMotiveDialog.onTrue();
                  }}
                >
                  Sign Now
                </Button>
              )}

              {((isSupervisor && supervisor_agreement.motive_cameras) ||
                (isSafetyManger && safety_manager_agreement.motive_cameras) ||
                (!isSafetyManger && !isSupervisor)) && (
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={() => {
                    CompanyMotiveDialog.onTrue();
                    isPreview.onTrue();
                  }}
                >
                  View Policy
                </Button>
              )}
            </Stack>
          </Box>
        </Box>

        {/* FIRE EXTINGUISHER */}
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
              <Typography variant="body1">Fire Extinguisher</Typography>
            </Stack>

            <Stack alignItems="center" justifyContent="flex-end" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color={policy_agreement.company_fire_extiguisher ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      policy_agreement.company_fire_extiguisher
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />
              <Chip
                label="SUPERVISOR"
                size="small"
                variant="soft"
                color={supervisor_agreement.company_fire_extiguisher ? 'success' : 'error'}
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={
                  <Iconify
                    icon={
                      supervisor_agreement.company_fire_extiguisher
                        ? 'solar:check-circle-bold'
                        : 'solar:danger-bold'
                    }
                  />
                }
              />

              {isSupervisor && !supervisor_agreement.company_fire_extiguisher && (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ minWidth: { xs: '120px', md: '100px' } }}
                  onClick={() => {
                    setCurrentPolicy('supervisor_agreement.company_fire_extiguisher');
                    CompanyFireExtiguisherDialog.onTrue();
                  }}
                >
                  Sign Now
                </Button>
              )}
            </Stack>
          </Box>
        </Box>

        {/* HR - 703 */}
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

            <Stack alignItems="center" justifyContent="flex-end" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
            </Stack>
          </Box>
        </Box>

        {/* HR 704 */}
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

            <Stack alignItems="center" justifyContent="flex-end" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
            </Stack>
          </Box>
        </Box>

        {/* FLEET - NCS 001 */}
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

            <Stack alignItems="center" justifyContent="flex-end" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
            </Stack>
          </Box>
        </Box>

        {/* FLEET - NCS 003U */}
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

            <Stack alignItems="center" justifyContent="flex-end" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
            </Stack>
          </Box>
        </Box>

        {/* FLEET - NCS 003U */}
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

            <Stack alignItems="center" justifyContent="flex-end" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
            </Stack>
          </Box>
        </Box>

        {/* FLEET - NCS 003U */}
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

            <Stack alignItems="center" justifyContent="flex-end" direction="row" spacing={2}>
              <Chip
                label="EMPLOYEE"
                size="small"
                variant="soft"
                color="success"
                sx={{ height: 25, fontSize: '.75rem', width: 'fit-content' }}
                icon={<Iconify icon="solar:check-circle-bold" />}
              />
            </Stack>
          </Box>
        </Box>
      </>

      {/* Signature Dialog for Initial */}
      {renderSignature()}

      <SafetyProtocolPolicies
        open={SafetyProtocolDialog.value}
        onClose={SafetyProtocolDialog.onFalse}
        onSave={() => {
          signatureDialog.onTrue();
        }}
        isPreview={isPreview.value}
      />

      <CompanyRulesPolicies
        open={CompanyRuleDialog.value}
        onClose={() => {
          CompanyRuleDialog.onFalse();
          isPreview.onFalse();
        }}
        onSave={() => {
          signatureDialog.onTrue();
        }}
        isPreview={isPreview.value}
      />

      <CompanyMotiveCameras
        open={CompanyMotiveDialog.value}
        onClose={() => {
          CompanyMotiveDialog.onFalse();
          isPreview.onFalse();
        }}
        onSave={() => {
          signatureDialog.onTrue();
        }}
        isPreview={isPreview.value}
      />

      <CompanyFireExtinguisherGuide
        open={CompanyFireExtiguisherDialog.value}
        onClose={CompanyFireExtiguisherDialog.onFalse}
        onSave={() => {
          // setValue(currentPolicy, true);
          signatureDialog.onTrue();
        }}
      />
    </>
  );
}
