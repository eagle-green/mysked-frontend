import { z } from 'zod';
import { merge } from 'es-toolkit';
import { useBoolean } from 'minimal-shared/hooks';
import { BlobProvider } from '@react-pdf/renderer';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
} from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';

import { useMultiStepForm } from 'src/hooks/use-multistep-form';

import { normalizeCanadianSin } from 'src/utils/format-canadian-sin';
import { CANADIAN_POSTAL_CODE_FULL, formatCanadianPostalCodeInput } from 'src/utils/format-canadian-postal-code';

import { endpoints } from 'src/lib/axios';
import { CONFIG } from 'src/global-config';

import { Form } from 'src/components/hook-form';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify/iconify';
import { MobileBlobPdfPages } from 'src/components/pdf/mobile-blob-pdf-pages';

import {
  SalaryType,
  type NewHire,
  type PolicyAgreement,
  type ManagementAgreement,
} from 'src/types/new-hire';

import { EquipmentReturnPolicyForm } from './equipment-return-policy-form';
import { EmployeeTaxCreditReturnBcForm } from './employee-tax-credit-bc-form';
import { EmployeeSocialCommitteeForm } from './social-committee-diversity-form';
import { EmployeeTaxCreditReturnForm } from './employee-tax-credit-return-form';
import { NewEmployeePersonalInformation } from './new-employee-personal-information';
import { SafetyPolicyAcknowledgementForm } from './safety-policy-acknowledgement-form';
import HiringPackagePdfTemplate from '../../hiring-package/template/hiring-package-template';

/** Avoid `/api/api/...` when `VITE_SERVER_URL` already ends with `/api`. */
function hiringPackageCandidateRequestUrl(): string {
  const base = (CONFIG.serverUrl || '').replace(/\/$/, '');
  const path = endpoints.hiringPackages.candidatePackage;
  if (/\/api$/i.test(base) && path.startsWith('/api/')) {
    return `${base}${path.replace(/^\/api/, '')}`;
  }
  return `${base}${path}`;
}

// Common validators
const requiredString = z.string().min(1, 'This field is required.');
const optionalString = z.string().optional();
const optionalBolean = z.boolean().optional();

/** Parse TD1 amount fields; empty input stays undefined (not 0). */
function parseTd1Amount(val: unknown): number | undefined {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'number') return Number.isFinite(val) ? val : undefined;
  const n = parseFloat(String(val).replace(/,/g, '').trim());
  return Number.isNaN(n) ? undefined : n;
}

const td1OptionalClaimAmount = z.preprocess(
  (val) => parseTd1Amount(val),
  z.number().optional()
);

const td1BasicClaimAmount = z.preprocess(
  (val) => parseTd1Amount(val),
  z.number({
    required_error: 'Line 1 basic personal amount is required.',
    invalid_type_error: 'Line 1 basic personal amount is required.',
  })
);

/** BC Form TD1BC line 1 — full basic personal amount for 2026 (CRA / Gov BC indexed credit). */
export const TD1BC_2026_BASIC_PERSONAL_AMOUNT = 13_216;

const td1BcBasicClaimAmount = z.preprocess(
  (val) => parseTd1Amount(val),
  z
    .number({ invalid_type_error: 'Invalid BC basic amount' })
    .refine((n) => n === 0 || n === TD1BC_2026_BASIC_PERSONAL_AMOUNT, {
      message: `BC line 1 must be $0 (multiple employers) or $${TD1BC_2026_BASIC_PERSONAL_AMOUNT.toLocaleString('en-CA')} for 2026.`,
    })
);

// Employee Information
export const EmployeeInformationSchema = z.object({
  last_name: requiredString,
  first_name: requiredString,
  middle_initial: optionalString,
  sin: z
    .string()
    .min(1, 'This field is required.')
    .transform((s) => normalizeCanadianSin(s))
    .refine((s) => s.length === 9, { message: 'SIN must be exactly 9 digits' }),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  gender: requiredString,
  address: requiredString,
  city: requiredString,
  province: requiredString,
  postal_code: z
    .string()
    .min(1, 'This field is required.')
    .refine(
      (val) => CANADIAN_POSTAL_CODE_FULL.test(formatCanadianPostalCodeInput(val)),
      'Invalid postal code. Format: A1A 1B1'
    ),
  home_phone_no: optionalString,
  cell_no: requiredString,
  email_address: z.string().email('Invalid email address'),
  signature: requiredString,
  signature_signed_at: optionalString,
  medical_allergies: optionalString,
  employee_number: optionalString,
});

// Emergency Contact — last name, first name, cellphone required; address & city optional
export const EmergencyContactSchema = z.object({
  last_name: requiredString,
  first_name: requiredString,
  middle_initial: optionalString,
  address: optionalString,
  city: optionalString,
  province: optionalString,
  postal_code: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val?.trim() ||
        CANADIAN_POSTAL_CODE_FULL.test(formatCanadianPostalCodeInput(val)),
      'Invalid postal code. Format: A1A 1B1'
    ),
  phone_no: optionalString,
  cell_no: requiredString,
  relationship: optionalString,
});

// Contract Details
export const ContractDetailsSchema = z.object({
  date: optionalString,
  hire_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  employee_name: optionalString,
  position: requiredString,
  rate: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'number') return Number.isNaN(val) ? undefined : val;
      const n = Number(val);
      return Number.isNaN(n) ? undefined : n;
    },
    z.number({ invalid_type_error: 'This field is required.' }).min(0, 'Must be 0 or greater')
  ),
  employee_signature: optionalString,
  area: optionalString,
  department: optionalString,
  home_cost_centre: optionalString,
  job_number: optionalString,
  is_union: requiredString,
  work_schedule: requiredString,
  is_refered: requiredString,
  hrsp: requiredString,
  salary_wage: requiredString,
  comments: optionalString,
  supper_intendent_signature: optionalString,
  area_manager_signature: optionalString,
  president_signature: optionalString,
  refered_by: optionalString,
  employee_number: optionalString,
  social_insurance_number: optionalString,
}).superRefine((data, ctx) => {
  if (data.is_refered === 'yes' && !String(data.refered_by ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Referred by is required when the new hire was referred.',
      path: ['refered_by'],
    });
  }
});

// Social Agreement
export const SocialAgreementSchema = z
  .object({
    is_join_social_committee: optionalBolean,
    authorize_deduction: optionalBolean,
    not_agree_deduction: optionalBolean,
  })
  .superRefine((data, ctx) => {
    if (data.authorize_deduction && data.not_agree_deduction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot select both',
        path: ['authorize_deduction'],
      });

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot select both',
        path: ['not_agree_deduction'],
      });
    }
  });

// Equity Question — allow '' so users can clear a mistaken Yes/No before saving.
const equityYesNo = z.union([z.literal(''), z.literal('yes'), z.literal('no')]);

export const EquityQuestionSchema = z
  .object({
    is_aboriginal_person: equityYesNo,
    is_visible_minority: equityYesNo,
    is_participation_voluntary: equityYesNo,
    participation_voluntary_text: optionalString,
  })
  .superRefine((data, ctx) => {
    if (data.is_participation_voluntary === 'yes' && !data.participation_voluntary_text) {
      ctx.addIssue({
        path: ['participation_voluntary_text'],
        code: z.ZodIssueCode.custom,
        message: 'Required',
      });
    }
  });

// Important Personnel
export const ImportantPersonnelSchema = z.object({
  id: requiredString,
  display_name: requiredString,
  email: z.string().email(),
  signed_at: requiredString,
  signature: requiredString,
});

// Policy Agreement
export const PolicyAgreementSchema = z
  .object({
    safety_company_protocols: z.boolean(),
    company_rules: z.boolean(),
    motive_cameras: z.boolean(),
    company_hr_policies_703: z.boolean(),
    company_hr_policies_704: z.boolean(),
    company_fleet_policies_gen_002: z.boolean(),
    company_fleet_policies_gen_003: z.boolean(),
    company_fleet_policies_ncs_001: z.boolean(),
    company_fleet_policies_ncs_003u: z.boolean(),
    company_fire_extiguisher: z.boolean(),
  })
  .superRefine((data, ctx) => {
    for (const key of POLICY_AGREEMENT_KEYS) {
      if (!data[key]) {
        ctx.addIssue({
          path: [key],
          code: z.ZodIssueCode.custom,
          message: 'Please review and accept this policy before proceeding.',
        });
      }
    }
  });

export const PolicyAgreementSignaturesSchema = z.object({
  safety_company_protocols: z.string(),
  company_rules: z.string(),
  motive_cameras: z.string(),
  company_hr_policies_703: z.string(),
  company_hr_policies_704: z.string(),
  company_fleet_policies_gen_002: z.string(),
  company_fleet_policies_gen_003: z.string(),
  company_fleet_policies_ncs_001: z.string(),
  company_fleet_policies_ncs_003u: z.string(),
  company_fire_extiguisher: z.string(),
});

export const POLICY_AGREEMENT_KEYS = [
  'safety_company_protocols',
  'company_rules',
  'motive_cameras',
  'company_hr_policies_703',
  'company_hr_policies_704',
  'company_fleet_policies_gen_002',
  'company_fleet_policies_gen_003',
  'company_fleet_policies_ncs_001',
  'company_fleet_policies_ncs_003u',
  'company_fire_extiguisher',
] as const satisfies readonly (keyof PolicyAgreement)[];

const MANAGEMENT_AGREEMENT_KEYS = [
  'safety_company_protocols',
  'company_rules',
  'motive_cameras',
  'company_fire_extiguisher',
] as const satisfies readonly (keyof ManagementAgreement)[];

export const ManagementAgreementSchema = z
  .object({
    safety_company_protocols: z.boolean(),
    company_rules: z.boolean(),
    motive_cameras: z.boolean(),
    company_fire_extiguisher: z.boolean(),
  })
  .superRefine((data, ctx) => {
    for (const key of MANAGEMENT_AGREEMENT_KEYS) {
      if (!data[key]) {
        ctx.addIssue({
          path: [key],
          code: z.ZodIssueCode.custom,
          message: 'Please review and accept this policy (hiring manager) before proceeding.',
        });
      }
    }
  });

export const ManagementAgreementSignerNamesSchema = z.object({
  safety_company_protocols: z.string().optional(),
  company_rules: z.string().optional(),
  motive_cameras: z.string().optional(),
  company_fire_extiguisher: z.string().optional(),
});

export const PolicyAgreementSignedAtSchema = z
  .object({
    safety_company_protocols: z.string().optional(),
    company_rules: z.string().optional(),
    motive_cameras: z.string().optional(),
    company_hr_policies_703: z.string().optional(),
    company_hr_policies_704: z.string().optional(),
    company_fleet_policies_gen_002: z.string().optional(),
    company_fleet_policies_gen_003: z.string().optional(),
    company_fleet_policies_ncs_001: z.string().optional(),
    company_fleet_policies_ncs_003u: z.string().optional(),
    company_fire_extiguisher: z.string().optional(),
  })
  .optional();

export const ManagementAgreementSignaturesSchema = z.object({
  safety_company_protocols: z.string().optional(),
  company_rules: z.string().optional(),
  motive_cameras: z.string().optional(),
  company_fire_extiguisher: z.string().optional(),
});

export const ManagementAgreementSignedAtSchema = z
  .object({
    safety_company_protocols: z.string().optional(),
    company_rules: z.string().optional(),
    motive_cameras: z.string().optional(),
    company_fire_extiguisher: z.string().optional(),
  })
  .optional();

// Tax Credit Return (amounts match CRA Form TD1 for 2026 — td1-26e.pdf)
export const EmployeeTaxCreditReturnSchema = z.object({
  basic_claim_amount: td1BasicClaimAmount,
  parent_claim_amount: td1OptionalClaimAmount,
  age_claim_amount: td1OptionalClaimAmount,
  pension_claim_amount: td1OptionalClaimAmount,
  tuition_claim_amount: td1OptionalClaimAmount,
  disability_claim_amount: td1OptionalClaimAmount,
  spouse_claim_amount: td1OptionalClaimAmount,
  dependant_claim_amount: td1OptionalClaimAmount,
  dependent_common_claim_amount: td1OptionalClaimAmount,
  infirm_dependent_claim_amount: td1OptionalClaimAmount,
  transfer_common_claim_amount: td1OptionalClaimAmount,
  transfer_partner_claim_amount: td1OptionalClaimAmount,
  deduction_living_prescribed_zone: td1OptionalClaimAmount,
  addition_tax_deducted: td1OptionalClaimAmount,
  has_two_employeer: z.boolean(),
  not_eligible: z.boolean(),
  is_non_resident: z.string(),
  certified: z.boolean().refine((value) => !!value, {
    message: 'Please confirm or ceritify before proceeding.',
  }),
  td1_form_signature: z.string().min(1, 'Please sign the federal TD1 form.'),
});

// Tax Credit Return BC
export const EmployeeTaxCreditReturnBcSchema = z.object({
  basic_claim_amount: td1BcBasicClaimAmount,
  age_claim_amount: td1OptionalClaimAmount,
  pension_claim_amount: td1OptionalClaimAmount,
  tuition_claim_amount: td1OptionalClaimAmount,
  disability_claim_amount: td1OptionalClaimAmount,
  spouse_claim_amount: td1OptionalClaimAmount,
  dependant_claim_amount: td1OptionalClaimAmount,
  bc_caregiver_amount: td1OptionalClaimAmount,
  transfer_common_claim_amount: td1OptionalClaimAmount,
  transfer_dependant_claim_amount: td1OptionalClaimAmount,
  has_two_employeer: z.boolean(),
  not_eligible: z.boolean(),
  certified: z.boolean().refine((value) => !!value, {
    message: 'Please confirm or ceritify before proceeding.',
  }),
  td1bc_form_signature: z.string().min(1, 'Please sign the BC TD1BC form.'),
});

// Equipment — quantity comes from `<input type="number">` as string unless coerced
const equipmentQuantity = z.preprocess((val) => {
  if (val === '' || val === undefined || val === null) return undefined;
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  const n = parseFloat(String(val));
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const EquipmentSchema = z.object({
  equipment_name: optionalString,
  quantity: equipmentQuantity,
});

const equipmentsFieldSchema = z.array(EquipmentSchema).superRefine((items, ctx) => {
  items.forEach((item, index) => {
    const name = item?.equipment_name?.trim?.() ?? '';
    const qty = item.quantity;

    if (!name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select equipment',
        path: [index, 'equipment_name'],
      });
      return;
    }

    if (qty == null || (typeof qty === 'number' && Number.isNaN(qty))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Quantity is required when equipment is selected',
        path: [index, 'quantity'],
      });
    } else if (typeof qty === 'number' && qty < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Quantity must be at least 1',
        path: [index, 'quantity'],
      });
    }
  });
});


export const PayrollDepositSchema = z
  .object({
    bank_name: z.string().optional(),
    transit_number: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{5}$/.test(val), 'Must be exactly 5 digits'),
    institution_number: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{3}$/.test(val), 'Must be exactly 3 digits'),
    account_number: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{7,12}$/.test(val), 'Account number must be 7–12 digits'),
    payroll_deposit_letter: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const transit = data.transit_number?.trim() ?? '';
    const institution = data.institution_number?.trim() ?? '';
    const account = data.account_number?.trim() ?? '';

    if (transit && !/^\d{5}$/.test(transit)) {
      ctx.addIssue({
        path: ['transit_number'],
        code: z.ZodIssueCode.custom,
        message: 'Must be exactly 5 digits',
      });
    }

    if (institution && !/^\d{3}$/.test(institution)) {
      ctx.addIssue({
        path: ['institution_number'],
        code: z.ZodIssueCode.custom,
        message: 'Must be exactly 3 digits',
      });
    }

    if (account && !/^\d{7,12}$/.test(account)) {
      ctx.addIssue({
        path: ['account_number'],
        code: z.ZodIssueCode.custom,
        message: 'Account number must be 7–12 digits',
      });
    }
  });

export const FuelCardSchema = z.object({
  company_name: requiredString,
  card_number: requiredString,
});

export const AdminCheckListSchema = z.object({
  drug_alcohol_test: z.boolean(),
  employment_offer: z.boolean(),
  employment_offer_non_union: z.boolean(),
  new_employee_rehire: z.boolean(),
  consent_information: z.boolean(),
  equipment_form: z.boolean(),
  deposit_authorization: z.boolean(),
  tax_credit_td1: z.boolean(),
  tax_credit_td1_bc: z.boolean(),
  social_fund: z.boolean(),
  health_safety_manual: z.boolean(),
  celebrate_diversity: z.boolean(),
  vacation: z.boolean(),
  handbook: z.boolean(),
  fleet_form: z.boolean(),
});

export const FleetCheckListSchema = z.object({
  current_driver_license: z.boolean(),
  consent_form: z.boolean(),
  commercial_driver_abstract: z.boolean(),
  employee_resume: z.boolean(),
  drug_alcohol_test: z.boolean(),
  trip_policy: z.boolean(),
  identification_policy: z.boolean(),
  company_vehicle_union: z.boolean(),
  company_vehicle_non_union: z.boolean(),
  fuel_cards: z.boolean(),
  usage_policy: z.boolean(),
  behavior_policy: z.boolean(),
  addtional_certification: z.boolean(),
});

export const EmployeeCheckListSchema = z.object({
  instructions: z.boolean(),
  safety_environment: z.boolean(),
  contact_info: z.boolean(),
  isolation_policy: z.boolean(),
  risk_management: z.boolean(),
  action_policy: z.boolean(),
  company_rules: z.boolean(),
  hazard_assessment: z.boolean(),
  responsibilities: z.boolean(),
  young_worker: z.boolean(),
  safety_rules: z.boolean(),
  fleet_rules: z.boolean(),
  worker_rights: z.boolean(),
  preventative_measure: z.boolean(),
  abuse_policy: z.boolean(),
  training_communication: z.boolean(),
  personal_protective: z.boolean(),
  inspections: z.boolean(),
  reporting_policy: z.boolean(),
  emergency_preparedness: z.boolean(),
  meeting_policy: z.boolean(),
  records_statistics: z.boolean(),
  safety_committee: z.boolean(),
  legislation: z.boolean(),
  field_level_assessment: z.boolean(),
});

// Main Schema
export const NewHireSchema = z.object({
  contract_detail: ContractDetailsSchema,
  employee: EmployeeInformationSchema,
  emergency_contact: EmergencyContactSchema,
  equipments: equipmentsFieldSchema,
  /** Optional: media name/picture + birth-date notices (checkboxes on personal info step). */
  information_consent: optionalBolean,
  birth_date_recognition_consent: optionalBolean,
  payroll_consent: optionalBolean,
  return_policy_consent: optionalBolean,
  return_policy_signature: z.string(),
  socialAgreement: SocialAgreementSchema,
  social_committee_signature: z
    .string()
    .min(1, 'Please sign the Employee Social Committee enrollment form.'),
  celebrate_diversity_consent: optionalBolean,
  equity_question: EquityQuestionSchema,
  hr_manager: ImportantPersonnelSchema,
  area_manager: ImportantPersonnelSchema,
  president: ImportantPersonnelSchema,
  supervisor: ImportantPersonnelSchema,
  safety_manager: ImportantPersonnelSchema,
  policy_agreement: PolicyAgreementSchema,
  policy_agreement_signatures: PolicyAgreementSignaturesSchema,
  policy_agreement_signed_at: PolicyAgreementSignedAtSchema,
  supervisor_agreement: ManagementAgreementSchema,
  supervisor_agreement_signer_names: ManagementAgreementSignerNamesSchema.optional(),
  supervisor_agreement_signatures: ManagementAgreementSignaturesSchema.optional(),
  supervisor_agreement_signed_at: ManagementAgreementSignedAtSchema,
  safety_manager_agreement: ManagementAgreementSchema,
  claims: EmployeeTaxCreditReturnSchema,
  payroll_deposit: PayrollDepositSchema,
  fuel_card: FuelCardSchema,
  claims_bc: EmployeeTaxCreditReturnBcSchema,
  admin_checklist: AdminCheckListSchema,
  fleet_checklist: FleetCheckListSchema,
  employee_checklist: EmployeeCheckListSchema,
  admin_checklist_hm_signature: optionalString,
  admin_checklist_hm_signed_at: optionalString,
  admin_checklist_hm_signer_name: optionalString,
  fleet_checklist_hm_signature: optionalString,
  fleet_checklist_hm_signed_at: optionalString,
  fleet_checklist_hm_signer_name: optionalString,
})
  .superRefine((data, ctx) => {
    for (const key of POLICY_AGREEMENT_KEYS) {
      if (!data.policy_agreement[key]) continue;
      const sig = data.policy_agreement_signatures[key]?.trim();
      if (!sig) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please sign to acknowledge this policy.',
          path: ['policy_agreement_signatures', key],
        });
      }
    }
    if (!data.return_policy_signature?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please sign to acknowledge the equipment return policy.',
        path: ['return_policy_signature'],
      });
    }
  });

/** Step 1 (equipment return) — use with `safeParse` on Next; `trigger(['equipments'])` can skip array superRefine. */
export const NewHireEquipmentStepSchema = z
  .object({
    return_policy_consent: optionalBolean,
    return_policy_signature: z.string(),
    equipments: equipmentsFieldSchema,
  })
  .superRefine((data, ctx) => {
    const sig = data.return_policy_signature;
    if (typeof sig === 'string' && !sig.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please sign to acknowledge the equipment return policy.',
        path: ['return_policy_signature'],
      });
    }
  });

/** Edit wizard step 0 — employee + emergency contact only (no signature required on this screen). */
export const NewHireEditStep0Schema = z.object({
  employee: EmployeeInformationSchema.omit({ signature: true }).extend({
    signature: z.string().optional(),
  }),
  emergency_contact: EmergencyContactSchema,
});

/** Edit wizard step 1 — contract details only. */
export const NewHireEditStep1Schema = z.object({
  contract_detail: ContractDetailsSchema,
});

/** Edit wizard step 2 — Review & Acknowledgement. Validates regardless of viewer role so admins cannot skip incomplete HM/employee policy data. */
export const NewHireEditStep2Schema = z
  .object({
    policy_agreement: PolicyAgreementSchema,
    policy_agreement_signatures: PolicyAgreementSignaturesSchema,
    supervisor_agreement: ManagementAgreementSchema,
  })
  .superRefine((data, ctx) => {
    for (const key of POLICY_AGREEMENT_KEYS) {
      if (!data.policy_agreement[key]) continue;
      const sig = data.policy_agreement_signatures[key]?.trim();
      if (!sig) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please sign to acknowledge this policy.',
          path: ['policy_agreement_signatures', key],
        });
      }
    }
  });

export type NewHireEmployeeInformationFormProps = {
  /** JWT from email OTP — loads/saves via hiring package API (candidate flow). */
  hiringPackageAccessToken?: string | null;
};

export function NewHireEmployeeInformationForm({
  hiringPackageAccessToken,
}: NewHireEmployeeInformationFormProps = {}) {
  const previewDialog = useBoolean();
  const [previewPayload, setPreviewPayload] = useState<NewHire | null>(null);
  const formSections = [
    'Personal Information',
    'Equipment Return',
    'Social & EG Diversity',
    'Safety Guidelines & Rules',
    'Personal Tax Credit Return (TD1)',
    'British Columbia Personal Tax Credit Return (TD1 BC)',
  ];
  const steps = useMemo(
    () => [
      <NewEmployeePersonalInformation key="personal-information" />,
      <EquipmentReturnPolicyForm key="equipment-return-policy" />,
      <EmployeeSocialCommitteeForm key="social-committee" />,
      <SafetyPolicyAcknowledgementForm key="safety-protocls-company-rules" />,
      <EmployeeTaxCreditReturnForm key="employee-tax-credit-return" />,
      <EmployeeTaxCreditReturnBcForm key="employee-tax-credit-return-bc" />,
    ],
    []
  );
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  /** Main form body for the active step — scroll this to top after Next/Previous. */
  const formStepContentRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width:768px)');

  const { currentStepIndex, step, prev, next } = useMultiStepForm(steps);

  const scrollToFormStepTop = useCallback(() => {
    formStepContentRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
  }, []);

  const skipStepChangeScrollRef = useRef(true);
  useLayoutEffect(() => {
    if (skipStepChangeScrollRef.current) {
      skipStepChangeScrollRef.current = false;
      return;
    }
    requestAnimationFrame(() => {
      scrollToFormStepTop();
    });
  }, [currentStepIndex, scrollToFormStepTop]);

  const formDefaulvalues: NewHire = {
    contract_detail: {
      date: new Date().toISOString(),
      start_date: new Date().toISOString(),
      hire_date: new Date().toISOString(),
      employee_name: '',
      position: '',
      rate: null,
      employee_signature: '',
      area: '',
      department: '',
      home_cost_centre: '',
      job_number: '',
      is_union: '',
      is_refered: '',
      hrsp: '',
      comments: '',
      supper_intendent_signature: '',
      area_manager_signature: '',
      president_signature: '',
      salary_wage: SalaryType.WK,
      work_schedule: '',
    },
    employee: {
      last_name: '',
      first_name: '',
      middle_initial: '',
      sin: '',
      gender: '',
      date_of_birth: '',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      home_phone_no: '',
      cell_no: '',
      email_address: '',
      signature: '',
      signature_signed_at: '',
      medical_allergies: '',
      employee_number: '',
    },
    emergency_contact: {
      last_name: '',
      first_name: '',
      middle_initial: '',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      phone_no: '',
      cell_no: '',
      relationship: '',
    },
    equipments: [],
    information_consent: false,
    birth_date_recognition_consent: false,
    payroll_consent: false,
    return_policy_consent: false,
    return_policy_signature: '',
    socialAgreement: {
      is_join_social_committee: false,
      authorize_deduction: false,
      not_agree_deduction: false,
    },
    social_committee_signature: '',
    celebrate_diversity_consent: false,
    equity_question: {
      is_aboriginal_person: '',
      is_visible_minority: '',
      is_participation_voluntary: '',
    },
    hr_manager: {
      id: '',
      display_name: '',
      email: '',
      signed_at: '',
      signature: '',
    },
    area_manager: {
      id: '',
      display_name: '',
      email: '',
      signed_at: '',
      signature: '',
    },
    president: {
      id: '',
      display_name: '',
      email: '',
      signed_at: '',
      signature: '',
    },
    policy_agreement: {
      safety_company_protocols: false,
      company_hr_policies_703: false,
      company_hr_policies_704: false,
      company_fleet_policies_gen_002: false,
      company_fleet_policies_gen_003: false,
      company_fleet_policies_ncs_001: false,
      company_fleet_policies_ncs_003u: false,
      company_fire_extiguisher: false,
      company_rules: false,
      motive_cameras: false,
    },
    policy_agreement_signatures: {
      safety_company_protocols: '',
      company_rules: '',
      motive_cameras: '',
      company_hr_policies_703: '',
      company_hr_policies_704: '',
      company_fleet_policies_gen_002: '',
      company_fleet_policies_gen_003: '',
      company_fleet_policies_ncs_001: '',
      company_fleet_policies_ncs_003u: '',
      company_fire_extiguisher: '',
    },
    policy_agreement_signed_at: {
      safety_company_protocols: '',
      company_rules: '',
      motive_cameras: '',
      company_hr_policies_703: '',
      company_hr_policies_704: '',
      company_fleet_policies_gen_002: '',
      company_fleet_policies_gen_003: '',
      company_fleet_policies_ncs_001: '',
      company_fleet_policies_ncs_003u: '',
      company_fire_extiguisher: '',
    },
    claims: {
      basic_claim_amount: '' as any,
      parent_claim_amount: '' as any,
      age_claim_amount: '' as any,
      pension_claim_amount: '' as any,
      tuition_claim_amount: '' as any,
      disability_claim_amount: '' as any,
      spouse_claim_amount: '' as any,
      dependant_claim_amount: '' as any,
      dependent_common_claim_amount: '' as any,
      infirm_dependent_claim_amount: '' as any,
      transfer_common_claim_amount: '' as any,
      transfer_partner_claim_amount: '' as any,
      deduction_living_prescribed_zone: '' as any,
      addition_tax_deducted: '' as any,
      has_two_employeer: false,
      not_eligible: false,
      is_non_resident: '',
      certified: false,
      td1_form_signature: '',
    },
    supervisor_agreement: {
      safety_company_protocols: false,
      company_rules: false,
      motive_cameras: false,
      company_fire_extiguisher: false,
    },
    supervisor_agreement_signer_names: {
      safety_company_protocols: '',
      company_rules: '',
      motive_cameras: '',
      company_fire_extiguisher: '',
    },
    supervisor_agreement_signatures: {
      safety_company_protocols: '',
      company_rules: '',
      motive_cameras: '',
      company_fire_extiguisher: '',
    },
    supervisor_agreement_signed_at: {
      safety_company_protocols: '',
      company_rules: '',
      motive_cameras: '',
      company_fire_extiguisher: '',
    },
    safety_manager_agreement: {
      safety_company_protocols: false,
      company_rules: false,
      motive_cameras: false,
      company_fire_extiguisher: false,
    },
    supervisor: {
      id: '',
      display_name: '',
      email: '',
      signed_at: '',
      signature: '',
    },
    safety_manager: {
      id: '',
      display_name: '',
      email: '',
      signed_at: '',
      signature: '',
    },
    payroll_deposit: {
      bank_name: '',
      transit_number: '',
      institution_number: '',
      account_number: '',
      payroll_deposit_letter: '',
    },
    fuel_card: {
      company_name: '',
      card_number: '',
    },
    claims_bc: {
      basic_claim_amount: TD1BC_2026_BASIC_PERSONAL_AMOUNT,
      age_claim_amount: '' as any,
      pension_claim_amount: '' as any,
      tuition_claim_amount: '' as any,
      disability_claim_amount: '' as any,
      spouse_claim_amount: '' as any,
      dependant_claim_amount: '' as any,
      bc_caregiver_amount: '' as any,
      transfer_common_claim_amount: '' as any,
      transfer_dependant_claim_amount: '' as any,
      has_two_employeer: false,
      not_eligible: false,
      certified: false,
      td1bc_form_signature: '',
    },
    admin_checklist: {
      drug_alcohol_test: false,
      employment_offer: false,
      employment_offer_non_union: false,
      new_employee_rehire: false,
      consent_information: false,
      equipment_form: false,
      deposit_authorization: false,
      tax_credit_td1: false,
      tax_credit_td1_bc: false,
      social_fund: false,
      health_safety_manual: false,
      celebrate_diversity: false,
      vacation: false,
      handbook: false,
      fleet_form: false,
    },
    fleet_checklist: {
      current_driver_license: false,
      consent_form: false,
      commercial_driver_abstract: false,
      employee_resume: false,
      drug_alcohol_test: false,
      trip_policy: false,
      identification_policy: false,
      company_vehicle_union: false,
      company_vehicle_non_union: false,
      fuel_cards: false,
      usage_policy: false,
      behavior_policy: false,
      addtional_certification: false,
    },
    employee_checklist: {
      instructions: false,
      safety_environment: false,
      contact_info: false,
      isolation_policy: false,
      risk_management: false,
      action_policy: false,
      company_rules: false,
      hazard_assessment: false,
      responsibilities: false,
      young_worker: false,
      safety_rules: false,
      fleet_rules: false,
      worker_rights: false,
      preventative_measure: false,
      abuse_policy: false,
      training_communication: false,
      personal_protective: false,
      inspections: false,
      reporting_policy: false,
      emergency_preparedness: false,
      meeting_policy: false,
      records_statistics: false,
      safety_committee: false,
      legislation: false,
      field_level_assessment: false,
    },
    admin_checklist_hm_signature: '',
    admin_checklist_hm_signed_at: '',
    admin_checklist_hm_signer_name: '',
    fleet_checklist_hm_signature: '',
    fleet_checklist_hm_signed_at: '',
    fleet_checklist_hm_signer_name: '',
  };

  const methods = useForm<NewHire>({
    /**
     * `onSubmit` skips validation on change until `isSubmitted` is true — but `trigger()` on Next
     * does not set `isSubmitted`, so errors never clear while typing. `all` revalidates on
     * change/blur so fixes apply immediately after a failed step validation.
     */
    mode: 'all',
    reValidateMode: 'onChange',
    resolver: zodResolver(NewHireSchema, undefined, { raw: true }) as Resolver<NewHire>,
    defaultValues: formDefaulvalues,
  });

  const { getValues, trigger, setError, reset } = methods;

  const [hpLoaded, setHpLoaded] = useState(!hiringPackageAccessToken);
  /** After submit to HR, or when reloading an already-submitted package. */
  const [candidatePackageComplete, setCandidatePackageComplete] = useState(false);

  const saveHiringPackageToServer = useCallback(
    async (opts?: { mark_submitted?: boolean; silent?: boolean }) => {
      if (!hiringPackageAccessToken) return false;
      try {
        const body: Record<string, unknown> = { form_data: getValues() };
        if (opts?.mark_submitted) body.mark_submitted = true;
        const res = await fetch(hiringPackageCandidateRequestUrl(), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hiringPackageAccessToken}`,
          },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(typeof json.error === 'string' ? json.error : 'Save failed');
          return false;
        }
        if (opts?.mark_submitted) {
          setCandidatePackageComplete(true);
        }
        if (!opts?.silent) {
          toast.success(opts?.mark_submitted ? 'Package submitted' : 'Progress saved');
        }
        return true;
      } catch {
        toast.error('Save failed');
        return false;
      }
    },
    [getValues, hiringPackageAccessToken]
  );

  useEffect(() => {
    if (!hiringPackageAccessToken) {
      setHpLoaded(true);
      return () => {};
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(hiringPackageCandidateRequestUrl(), {
          headers: { Authorization: `Bearer ${hiringPackageAccessToken}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(typeof json.error === 'string' ? json.error : 'Could not load package');
          if (!cancelled) setHpLoaded(true);
          return;
        }
        const serverForm = json.data?.form_data as Record<string, unknown> | undefined;
        const submittedAt = (json.data as { submitted_at?: string | null })?.submitted_at;
        const invitedEmail = (
          json.data as { invited_email?: string | null } | undefined
        )?.invited_email?.trim();
        const merged = merge(structuredClone(formDefaulvalues), serverForm ?? {}) as NewHire;
        merged.contract_detail.salary_wage = SalaryType.WK;
        if (invitedEmail) {
          merged.employee.email_address = invitedEmail;
        }
        if (!cancelled) {
          reset(merged);
          if (submittedAt) {
            setCandidatePackageComplete(true);
          }
          setHpLoaded(true);
        }
      } catch {
        toast.error('Could not load package');
        if (!cancelled) setHpLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // formDefaulvalues is the wizard baseline for merge; token drives reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only when access token changes
  }, [hiringPackageAccessToken, reset]);

  const onSubmit = async () => {};

  if (hiringPackageAccessToken && !hpLoaded) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (hiringPackageAccessToken && candidatePackageComplete) {
    return (
      <Card
        sx={{
          p: { xs: 3, md: 5 },
          maxWidth: 560,
          mx: 'auto',
          mt: { xs: 2, md: 4 },
          textAlign: 'center',
        }}
      >
        <Iconify
          icon="solar:check-circle-bold"
          width={56}
          sx={{ color: 'success.main', mb: 2 }}
        />
        <Typography variant="h5" sx={{ mb: 2 }}>
          Thank you - your package was sent to HR
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Please let your hiring manager know you have finished your hiring package so they can
          review it.
        </Typography>
        <Typography variant="body2" color="text.disabled">
          You can close this window. If you need to make changes, contact your hiring manager.
        </Typography>
      </Card>
    );
  }

  const renderPreviewDialog = () => (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={previewDialog.value}
      onClose={() => {
        previewDialog.onFalse();
        setPreviewPayload(null);
      }}
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ pb: 2 }}>Hiring Package Preview</DialogTitle>
      {previewPayload ? (
        <BlobProvider document={<HiringPackagePdfTemplate data={previewPayload} />}>
          {({ url, loading, error }) => (
            <DialogContent
              sx={{
                typography: 'body2',
                position: 'relative',
                flex: 1,
                minHeight: isMobile ? 'calc(100vh - 200px)' : '80vh',
                p: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                bgcolor: 'grey.100',
              }}
            >
              {loading && (
                <Box
                  sx={{
                    display: 'flex',
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: isMobile ? 360 : 480,
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
              {error ? (
                <Box sx={{ p: 2 }}>
                  <Typography color="error">
                    {error.message ||
                      'Could not generate the PDF preview. Try again or check the console for details.'}
                  </Typography>
                </Box>
              ) : null}
              {url && !loading ? (
                isMobile ? (
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: 'grey.100',
                    }}
                  >
                    <MobileBlobPdfPages
                      fileUrl={url}
                      scrollAreaMaxHeight="min(68vh, 760px)"
                    />
                  </Box>
                ) : (
                  <Box
                    component="iframe"
                    title="Hiring package preview"
                    src={url}
                    sx={{
                      width: '100%',
                      flex: 1,
                      minHeight: '80vh',
                      border: 'none',
                      bgcolor: 'grey.100',
                    }}
                  />
                )
              ) : null}
            </DialogContent>
          )}
        </BlobProvider>
      ) : (
        <DialogContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
          }}
        >
          <CircularProgress />
        </DialogContent>
      )}
      <DialogActions
        sx={{
          px: 2,
          pb: 2,
          pt: 1,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: 1,
          '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' } },
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          size={isMobile ? 'large' : 'medium'}
          sx={isMobile ? { minHeight: 48, py: 1.25 } : undefined}
          onClick={() => {
            previewDialog.onFalse();
            setPreviewPayload(null);
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          size={isMobile ? 'large' : 'medium'}
          sx={isMobile ? { minHeight: 48, py: 1.25 } : undefined}
          onClick={async () => {
            if (hiringPackageAccessToken) {
              const ok = await saveHiringPackageToServer({ mark_submitted: true });
              if (ok) {
                previewDialog.onFalse();
                setPreviewPayload(null);
              }
            }
          }}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          {hiringPackageAccessToken ? 'Submit to HR' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Card sx={{ p: { xs: 1, md: 2 }, mb: 2 }}>
        {isMobile ? (
          // Mobile: Vertical stepper with compact design
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
              Step {currentStepIndex + 1} of {formSections.length}
            </Typography>
            <Stepper
              activeStep={currentStepIndex}
              orientation="vertical"
              sx={{ '& .MuiStepLabel-label': { fontSize: '0.875rem' } }}
            >
              {formSections.map((label, index) => (
                <Step key={index}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '0.875rem',
                        fontWeight: index === currentStepIndex ? 600 : 400,
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Stack>
        ) : (
          // Desktop: Horizontal stepper with alternative label
          <Box
            ref={scrollSectionRef}
            sx={{
              overflowX: 'auto',
              flex: 1,
              scrollBehavior: 'smooth',
              /* Hide scrollbar */
              scrollbarWidth: 'none', // Firefox
              '&::-webkit-scrollbar': {
                display: 'none', // Chrome, Safari
              },
            }}
          >
            <Stepper
              sx={{
                minWidth: 'max-content',
              }}
              activeStep={currentStepIndex}
              alternativeLabel
            >
              {formSections.map((label, index) => (
                <Step key={index} sx={{ flexShrink: 0, width: '150px' }}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}
      </Card>
      <Form methods={methods} onSubmit={onSubmit}>
        <Card
          ref={formStepContentRef}
          sx={{
            py: { xs: 2, md: 3 },
            px: { xs: 2, md: 5 },
            scrollMarginTop: { xs: 2, md: 3 },
          }}
        >
          <Stack spacing={3}>{step}</Stack>
          <Stack spacing={2} sx={{ mt: { xs: 3, md: 5 }, width: 1 }}>
            {currentStepIndex < steps.length - 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: 1 }}>
                <Button
                  type="button"
                  variant="contained"
                  color='success'
                  size="large"
                  sx={{
                    minHeight: 48,
                    py: 1.25,
                    boxSizing: 'border-box',
                  }}
                  disabled={!!hiringPackageAccessToken && !hpLoaded}
                  onClick={() => {
                    if (hiringPackageAccessToken) {
                      saveHiringPackageToServer();
                    }
                  }}
                >
                  {hiringPackageAccessToken ? 'Save progress' : 'Update'}
                </Button>
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: 1,
                gap: 1,
                flexWrap: 'nowrap',
              }}
            >
              <Box
                sx={{
                  flex: '0 0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  minWidth: { xs: 88, md: 100 },
                }}
              >
                {currentStepIndex !== 0 ? (
                  <Button
                    type="button"
                    variant="contained"
                    size="large"
                    sx={{
                      minWidth: { xs: 88, md: '100px' },
                      minHeight: 48,
                      py: 1.25,
                      boxSizing: 'border-box',
                    }}
                    onClick={() => {
                      prev();
                    }}
                  >
                    {isMobile ? 'Back' : 'Previous'}
                  </Button>
                ) : (
                  <Box
                    aria-hidden
                    sx={{ minWidth: { xs: 88, md: '100px' }, height: 1, flexShrink: 0 }}
                  />
                )}
              </Box>
              {!isMobile && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.disabled',
                    flex: '1 1 auto',
                    textAlign: 'center',
                    px: 1,
                    minWidth: 0,
                  }}
                >
                  Page {`${currentStepIndex + 1} of ${steps.length}`}
                </Typography>
              )}
              <Box
                sx={{
                  flex: '0 0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  minWidth: { xs: 88, md: 100 },
                }}
              >
                {currentStepIndex < steps.length - 1 ? (
                  <Button
                    type="button"
                    variant="contained"
                    size="large"
                    sx={{
                      minWidth: { xs: 88, md: '100px' },
                      minHeight: 48,
                      py: 1.25,
                      boxSizing: 'border-box',
                    }}
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      if (currentStepIndex === 1) {
                        const v = getValues();
                        const parsed = NewHireEquipmentStepSchema.safeParse({
                          return_policy_consent: v.return_policy_consent,
                          return_policy_signature: v.return_policy_signature,
                          equipments: v.equipments ?? [],
                        });
                        if (!parsed.success) {
                          parsed.error.issues.forEach((issue) => {
                            if (issue.path.length === 0) return;
                            const path = issue.path.map(String).join('.');
                            setError(path as any, {
                              type: 'manual',
                              message: issue.message,
                            });
                          });
                          setTimeout(() => {
                            const firstErrorElement =
                              document.querySelector('[aria-invalid="true"]') ||
                              document.querySelector('.Mui-error') ||
                              document.querySelector('[role="alert"]');
                            if (firstErrorElement) {
                              firstErrorElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                              });
                            } else {
                              scrollToFormStepTop();
                            }
                          }, 100);
                          return;
                        }
                        if (hiringPackageAccessToken) {
                          const saved = await saveHiringPackageToServer({ silent: true });
                          if (!saved) return;
                        }
                        next();
                        return;
                      }

                      // Validate current step fields based on step index
                      let fieldsToValidate: string[] = [];

                      switch (currentStepIndex) {
                        case 0: // Employee Personal Information
                          fieldsToValidate = [
                            'employee',
                            'emergency_contact',
                            'equity_question',
                            'payroll_deposit',
                          ];
                          break;
                        case 2: // Social Committee (optional)
                          fieldsToValidate = ['socialAgreement', 'social_committee_signature'];
                          break;
                        case 3: // Review Policies (booleans + per-policy signature rules on parent schema)
                          fieldsToValidate = ['policy_agreement', 'policy_agreement_signatures'];
                          break;
                        case 4:
                          fieldsToValidate = ['claims'];
                          break;
                        default:
                          break;
                      }

                      const isValid =
                        fieldsToValidate.length > 0 ? await trigger(fieldsToValidate as any) : true;

                      if (!isValid) {
                        setTimeout(() => {
                          if (currentStepIndex === 3) {
                            for (const key of POLICY_AGREEMENT_KEYS) {
                              const el = document.getElementById(`policy-section-${key}`);
                              if (el?.querySelector('[role="alert"]')) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                return;
                              }
                            }
                          }
                          const firstErrorElement =
                            document.querySelector('[aria-invalid="true"]') ||
                            document.querySelector('.Mui-error') ||
                            document.querySelector('[role="alert"]');

                          if (firstErrorElement) {
                            firstErrorElement.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center',
                            });
                          } else {
                            scrollToFormStepTop();
                          }
                        }, 150);
                        return;
                      }

                      if (hiringPackageAccessToken) {
                        const saved = await saveHiringPackageToServer({ silent: true });
                        if (!saved) return;
                      }
                      next();
                    }}
                  >
                    {isMobile ? 'Next' : 'Next'}
                  </Button>
                ) : (
                <Button
                  type="button"
                  variant="contained"
                  color="success"
                  size="large"
                  sx={{
                    minWidth: { xs: 120, md: '140px' },
                    minHeight: 48,
                    py: 1.25,
                    boxSizing: 'border-box',
                  }}
                  onClick={async () => {
                    const isValid = await trigger(['claims_bc']);

                    if (!isValid) {
                      setTimeout(() => {
                        const firstErrorElement =
                          document.querySelector('[aria-invalid="true"]') ||
                          document.querySelector('.Mui-error') ||
                          document.querySelector('[role="alert"]');

                        if (firstErrorElement) {
                          firstErrorElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                          });
                        } else {
                          scrollToFormStepTop();
                        }
                      }, 100);

                      return;
                    }

                    if (hiringPackageAccessToken) {
                      const saved = await saveHiringPackageToServer({ silent: true });
                      if (!saved) return;
                    }
                    setPreviewPayload(
                      merge(structuredClone(formDefaulvalues), getValues()) as NewHire
                    );
                    previewDialog.onTrue();
                  }}
                  startIcon={<Iconify icon="solar:eye-bold" />}
                >
                  Preview & Submit
                </Button>
                )}
              </Box>
            </Box>
          </Stack>
        </Card>
      </Form>
      {renderPreviewDialog()}
    </>
  );
}
