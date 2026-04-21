import type { NewHire } from 'src/types/new-hire';

import { useRef, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Document, BlobProvider } from '@react-pdf/renderer';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';

import {
  formatDateUsSlash,
  formatPolicyAcknowledgementEmployeeName,
} from 'src/utils/format-pdf-display';

import { MobileBlobPdfPages } from 'src/components/pdf/mobile-blob-pdf-pages';

import { MotiveCameraPage } from '../../hiring-package/template/camera-motive-page';
import { CompanyRulesPage } from '../../hiring-package/template/company-rules-page';
import { SafetyProtocolPage } from '../../hiring-package/template/safety-protocol-page';
import { CompanyPolicy703Page } from '../../hiring-package/template/company-policy-703-page';
import { CompanyPolicy704Page } from '../../hiring-package/template/company-policy-704-page';
import { CompanyPolicyNCS001Page } from '../../hiring-package/template/company-policy-ncs-001-page';
import { CompanyPolicyGen002Page } from '../../hiring-package/template/company-policy-gen-002-page';
import { CompanyPolicyGen003Page } from '../../hiring-package/template/company-policy-gen-003-page';
import { CompanyPolicyNCS003UPage } from '../../hiring-package/template/company-policy-ncs-003U-page';
import { CompanyPolicyFireExtinguisherPage } from '../../hiring-package/template/company-policy-fire-extinguisher-page';

// ----------------------------------------------------------------------

export type PolicyPdfKind =
  | 'safety_protocols'
  | 'company_rules'
  | 'motive_cameras'
  | 'fire_extinguisher'
  | 'hr_policies_703'
  | 'hr_policies_704'
  | 'fleet_ncs_001'
  | 'fleet_ncs_003u'
  | 'fleet_gen_002'
  | 'fleet_gen_003';

/** Match `HiringPackagePdfTemplate` contract/employee prep so single-page PDFs match the full package. */
export function prepareNewHireForPolicyPdf(data: NewHire): NewHire {
  const next: NewHire = {
    ...data,
    contract_detail: { ...data.contract_detail },
    employee: { ...data.employee },
    fuel_card: {
      company_name: String(data.fuel_card?.company_name ?? ''),
      card_number: String(data.fuel_card?.card_number ?? ''),
    },
  };
  if (data.policy_agreement) next.policy_agreement = { ...data.policy_agreement };
  if (data.policy_agreement_signatures)
    next.policy_agreement_signatures = { ...data.policy_agreement_signatures };
  if (data.policy_agreement_signed_at)
    next.policy_agreement_signed_at = { ...data.policy_agreement_signed_at };
  if (data.supervisor_agreement) next.supervisor_agreement = { ...data.supervisor_agreement };
  if (data.supervisor_agreement_signatures)
    next.supervisor_agreement_signatures = { ...data.supervisor_agreement_signatures };
  if (data.supervisor_agreement_signer_names)
    next.supervisor_agreement_signer_names = { ...data.supervisor_agreement_signer_names };
  if (data.supervisor_agreement_signed_at)
    next.supervisor_agreement_signed_at = { ...data.supervisor_agreement_signed_at };

  const dateNow = formatDateUsSlash();
  next.contract_detail.employee_name = formatPolicyAcknowledgementEmployeeName(
    next.employee.first_name,
    next.employee.last_name
  );
  next.contract_detail.employee_signature = next.employee.signature || '';
  next.contract_detail.date = dateNow;
  return next;
}

function SinglePolicyPdfDocument({
  policy,
  data,
}: {
  policy: PolicyPdfKind;
  data: NewHire;
}) {
  return (
    <Document>
      {policy === 'safety_protocols' && <SafetyProtocolPage data={data} />}
      {policy === 'company_rules' && <CompanyRulesPage data={data} />}
      {policy === 'motive_cameras' && <MotiveCameraPage data={data} />}
      {policy === 'fire_extinguisher' && <CompanyPolicyFireExtinguisherPage data={data} />}
      {policy === 'hr_policies_703' && <CompanyPolicy703Page data={data} />}
      {policy === 'hr_policies_704' && <CompanyPolicy704Page data={data} />}
      {policy === 'fleet_ncs_001' && <CompanyPolicyNCS001Page data={data} />}
      {policy === 'fleet_ncs_003u' && <CompanyPolicyNCS003UPage data={data} />}
      {policy === 'fleet_gen_002' && <CompanyPolicyGen002Page data={data} />}
      {policy === 'fleet_gen_003' && <CompanyPolicyGen003Page data={data} />}
    </Document>
  );
}

type PolicyPdfPreviewProps = {
  policy: PolicyPdfKind;
  /**
   * `fill` — after signing, “View” only shows the PDF; use more viewport height for the iframe.
   * `default` — review + sign flow with checkbox/pad below the preview.
   */
  previewVariant?: 'default' | 'fill';
  /**
   * When set (fuel card policy dialog), PDF uses this for `fuel_card` instead of live form values
   * so typing company name / card number does not regenerate the PDF on every keystroke.
   * Parent updates this when the user confirms (e.g. Sign and confirm).
   */
  frozenFuelCardForPdf?: { company_name: string; card_number: string };
};

/**
 * Renders the same @react-pdf page used in the hiring package for this policy (iframe preview).
 */
export function PolicyPdfPreview({
  policy,
  previewVariant = 'default',
  frozenFuelCardForPdf,
}: PolicyPdfPreviewProps) {
  /** Same breakpoint as FLRA PDF preview (`max-width:768px`). */
  const isMobile = useMediaQuery('(max-width:768px)');
  const { watch } = useFormContext();
  const all = watch() as NewHire;
  const allRef = useRef(all);
  allRef.current = all;

  /** Form JSON without fuel_card — changes only when non–fuel-card fields change. */
  const restFingerprint = useMemo(() => {
    const { fuel_card, ...rest } = all;
    void fuel_card;
    return JSON.stringify(rest);
  }, [all]);

  const fuelFingerprint = frozenFuelCardForPdf
    ? `${frozenFuelCardForPdf.company_name}\u001e${frozenFuelCardForPdf.card_number}`
    : JSON.stringify(all.fuel_card ?? { company_name: '', card_number: '' });

  const prepared = useMemo(() => {
    const latest = allRef.current;
    const fc = frozenFuelCardForPdf ?? latest.fuel_card;
    return prepareNewHireForPolicyPdf({
      ...latest,
      fuel_card: {
        company_name: String(fc?.company_name ?? ''),
        card_number: String(fc?.card_number ?? ''),
      },
    });
  }, [restFingerprint, fuelFingerprint]); // eslint-disable-line react-hooks/exhaustive-deps -- fingerprints gate regen; body uses allRef + frozenFuelCardForPdf

  const pdfDocument = useMemo(
    () => <SinglePolicyPdfDocument policy={policy} data={prepared} />,
    [policy, prepared]
  );

  const fill = previewVariant === 'fill';

  /** Match FLRA mobile: page-by-page react-pdf viewer; iframe stays on desktop. */
  const mobileScrollMax = fill
    ? { xs: 'min(78vh, 900px)', sm: 'min(80vh, 920px)' }
    : { xs: 'min(52vh, 520px)', sm: 'min(58vh, 560px)' };

  return (
    <Box
      sx={{
        width: '100%',
        flexShrink: 0,
        minHeight: fill ? { xs: 280, sm: 400 } : { xs: 320, sm: 520 },
        bgcolor: 'grey.100',
        borderRadius: 1,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <BlobProvider document={pdfDocument}>
        {({ url, loading, error }) => (
          <>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : null}
            {error ? (
              <Typography color="error" variant="body2" sx={{ p: 2 }}>
                Could not render PDF preview.
              </Typography>
            ) : null}
            {url && !isMobile ? (
              <Box
                component="iframe"
                title="Policy PDF preview"
                src={url}
                sx={{
                  width: '100%',
                  height: fill
                    ? { xs: 'min(88vh, 880px)', sm: 'min(84vh, 920px)' }
                    : { xs: 'min(85vh, 780px)', sm: 720 },
                  border: 'none',
                  display: 'block',
                  bgcolor: 'grey.100',
                }}
              />
            ) : null}
            {url && isMobile ? (
              <MobileBlobPdfPages fileUrl={url} scrollAreaMaxHeight={mobileScrollMax} />
            ) : null}
          </>
        )}
      </BlobProvider>
    </Box>
  );
}
