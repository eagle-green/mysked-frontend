import type { TableHeadCellProps } from 'src/components/table/table-head-custom';

export enum WorkSchedule {
  WK = 'WK',
  FULL_TIME = 'FT',
  PART_TIME = 'PT',
  CASUAL = 'CASUAL',
  SEASONAL = 'SEASONAL',
}

export enum EmployeeType {
  UNION = 'UNION',
  NON_UNION = 'NON-UNION',
}

/** HRS P (payroll classification) — distinct from employee union status. */
export enum HrspP {
  AREA_OVERHEAD_NON_UNION = 'AREA_OVERHEAD_NON_UNION',
  OPS_SUPPORT_HOME_OFFICE = 'OPS_SUPPORT_HOME_OFFICE',
}

export const HRSP_P_OPTIONS: { value: HrspP; label: string }[] = [
  { value: HrspP.AREA_OVERHEAD_NON_UNION, label: 'AREA OVERHEAD (NON-UNION)' },
  { value: HrspP.OPS_SUPPORT_HOME_OFFICE, label: 'OPS SUPPORT (HOME OFFICE)' },
];

export const EMPLOYEE_TYPE_OPTIONS: { value: EmployeeType; label: string }[] = [
  { label: 'UNION', value: EmployeeType.UNION },
  { label: 'NON-UNION', value: EmployeeType.NON_UNION },
];

export const WORK_SCHEDULE_OPTIONS: { label: string; value: WorkSchedule }[] = [
  { label: 'Weekly', value: WorkSchedule.WK },
  { label: 'Full Time', value: WorkSchedule.FULL_TIME },
  { label: 'Part Time', value: WorkSchedule.PART_TIME },
  { label: 'Casual', value: WorkSchedule.CASUAL },
  { label: 'Seasonal', value: WorkSchedule.SEASONAL },
];

export enum SalaryType {
  WK = 'HR/WK',
  MNTH = 'HR/MONTH',
}

export enum RadioButtonValues {
  YES = 'yes',
  NO = 'no',
}

export interface EmployeeInformation {
  last_name: string;
  first_name: string;
  middle_initial?: string;
  sin: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  home_phone_no?: string;
  cell_no: string;
  email_address: string;
  signature: string;
  /** ISO 8601 — set when the employee saves their personal-information signature (for Date Signed UI). */
  signature_signed_at?: string;
  medical_allergies?: string;
  country?: string;
  employee_number?: string;
}

export interface EmergencyContact {
  last_name?: string;
  first_name?: string;
  middle_initial?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  phone_no?: string;
  cell_no?: string;
  relationship?: string;
}

export interface ContractDetails {
  date?: string;
  hire_date: string;
  start_date: string;
  employee_name?: string;
  position: string;
  /** Empty (null) until the user enters a rate. Required on submit as a number. */
  rate: number | null;
  employee_signature?: string;
  area?: string;
  department?: string;
  home_cost_centre?: string;
  job_number?: string;
  is_union: string;
  work_schedule: string;
  is_refered: string;
  hrsp: string;
  salary_wage: string;
  comments?: string;
  supper_intendent_signature?: string;
  area_manager_signature?: string;
  president_signature?: string;
  refered_by?: string;
}

export interface SocialAgreement {
  is_join_social_committee?: boolean;
  authorize_deduction?: boolean;
  not_agree_deduction?: boolean;
}

export interface EquityQuestion {
  is_aboriginal_person: string;
  is_visible_minority: string;
  is_participation_voluntary?: string;
  participation_voluntary_text?: string;
}

export interface ManagementPersonel {
  id: string;
  display_name: string;
  email: string;
  signed_at: string;
  signature: string;
}

export interface PolicyAgreement {
  safety_company_protocols: boolean;
  company_rules: boolean;
  motive_cameras: boolean;
  company_hr_policies_703: boolean;
  company_hr_policies_704: boolean;
  company_fleet_policies_gen_002: boolean;
  company_fleet_policies_gen_003: boolean;
  company_fleet_policies_ncs_001: boolean;
  company_fleet_policies_ncs_003u: boolean;
  company_fire_extiguisher: boolean;
}

/** Base64 PNG signatures collected when the employee acknowledges each policy (Safety Guidelines step). */
export type PolicyAgreementSignatures = {
  [K in keyof PolicyAgreement]: string;
};

export interface ManagementAgreement {
  safety_company_protocols: boolean;
  company_rules: boolean;
  motive_cameras: boolean;
  company_fire_extiguisher: boolean;
}

/** Display name captured when someone signs a hiring-manager policy row (may differ from supervisor on file). */
export interface ManagementAgreementSignerNames {
  safety_company_protocols?: string;
  company_rules?: string;
  motive_cameras?: string;
  company_fire_extiguisher?: string;
}

/** Base64 / data-URL signatures when the hiring manager signs each policy (Review & Acknowledgement). */
export type ManagementAgreementSignatures = {
  [K in keyof ManagementAgreement]: string;
};

/** ISO 8601 — when the employee signed each policy acknowledgement (Safety Guidelines step). */
export type PolicyAgreementSignedAt = Partial<Record<keyof PolicyAgreement, string>>;

/** ISO 8601 — when the hiring manager signed each policy row. */
export type ManagementAgreementSignedAt = Partial<Record<keyof ManagementAgreement, string>>;

export interface EmployeeTaxCreditReturn {
  basic_claim_amount: number;
  parent_claim_amount: number;
  age_claim_amount: number;
  pension_claim_amount: number;
  tuition_claim_amount: number;
  disability_claim_amount: number;
  spouse_claim_amount: number;
  dependant_claim_amount: number;
  dependent_common_claim_amount: number;
  infirm_dependent_claim_amount: number;
  transfer_common_claim_amount: number;
  transfer_partner_claim_amount: number;
  deduction_living_prescribed_zone: number;
  addition_tax_deducted: number;
  has_two_employeer: boolean;
  not_eligible: boolean;
  is_non_resident: string;
  certified: boolean;
  /** Base64 signature image for federal TD1 certification block */
  td1_form_signature: string;
}

export interface EmployeeTaxCreditReturnBC {
  basic_claim_amount: number;
  age_claim_amount: number;
  pension_claim_amount: number;
  tuition_claim_amount: number;
  disability_claim_amount: number;
  spouse_claim_amount: number;
  dependant_claim_amount: number;
  bc_caregiver_amount: number;
  transfer_common_claim_amount: number;
  transfer_dependant_claim_amount: number;
  has_two_employeer: boolean;
  not_eligible: boolean;
  certified: boolean;
  /** Base64 signature image for BC TD1BC certification block */
  td1bc_form_signature: string;
}

export interface PayrollDeposit {
  bank_name?: string;
  transit_number?: string;
  institution_number?: string;
  account_number?: string;
  payroll_deposit_letter?: string;
}

export interface FuelCard {
  company_name: string;
  card_number: string;
}

export interface AdminChecklist {
  drug_alcohol_test: boolean;
  employment_offer: boolean;
  employment_offer_non_union: boolean;
  new_employee_rehire: boolean;
  consent_information: boolean;
  equipment_form: boolean;
  deposit_authorization: boolean;
  tax_credit_td1: boolean;
  tax_credit_td1_bc: boolean;
  social_fund: boolean;
  health_safety_manual: boolean;
  celebrate_diversity: boolean;
  vacation: boolean;
  handbook: boolean;
  fleet_form: boolean;
}

export interface FleetCheckList {
  current_driver_license: boolean;
  consent_form: boolean;
  commercial_driver_abstract: boolean;
  employee_resume: boolean;
  drug_alcohol_test: boolean;
  trip_policy: boolean;
  identification_policy: boolean;
  company_vehicle_union: boolean;
  company_vehicle_non_union: boolean;
  fuel_cards: boolean;
  usage_policy: boolean;
  behavior_policy: boolean;
  addtional_certification: boolean;
}

export interface NewEmployeeChecklist {
  instructions: boolean;
  safety_environment: boolean;
  contact_info: boolean;
  isolation_policy: boolean;
  risk_management: boolean;
  action_policy: boolean;
  company_rules: boolean;
  hazard_assessment: boolean;
  responsibilities: boolean;
  young_worker: boolean;
  safety_rules: boolean;
  fleet_rules: boolean;
  worker_rights: boolean;
  preventative_measure: boolean;
  abuse_policy: boolean;
  training_communication: boolean;
  personal_protective: boolean;
  inspections: boolean;
  reporting_policy: boolean;
  emergency_preparedness: boolean;
  meeting_policy: boolean;
  records_statistics: boolean;
  safety_committee: boolean;
  legislation: boolean;
  field_level_assessment: boolean;
}

export interface NewHire {
  contract_detail: ContractDetails;
  employee: EmployeeInformation;
  emergency_contact: EmergencyContact;
  equipments: Array<{ equipment_name?: string; quantity?: number }>;
  information_consent: boolean;
  payroll_consent?: boolean;
  return_policy_consent: boolean;
  /** Signature for equipment return / media consent (PNG data URL). */
  return_policy_signature: string;
  socialAgreement: SocialAgreement;
  /** Signature for social committee enrollment (PNG data URL). */
  social_committee_signature: string;
  celebrate_diversity_consent?: boolean;
  equity_question: EquityQuestion;
  hr_manager: ManagementPersonel;
  area_manager: ManagementPersonel;
  president: ManagementPersonel;
  supervisor: ManagementPersonel;
  safety_manager: ManagementPersonel;
  policy_agreement: PolicyAgreement;
  policy_agreement_signatures: PolicyAgreementSignatures;
  /** When each employee policy acknowledgement was signed (for PDF date lines). */
  policy_agreement_signed_at?: PolicyAgreementSignedAt;
  supervisor_agreement: ManagementAgreement;
  /** Who signed each hiring-manager acknowledgement (e.g. admin signing on behalf). */
  supervisor_agreement_signer_names?: ManagementAgreementSignerNames;
  /** Hiring manager / admin signature image per policy row. */
  supervisor_agreement_signatures?: ManagementAgreementSignatures;
  /** When each hiring-manager policy row was signed. */
  supervisor_agreement_signed_at?: ManagementAgreementSignedAt;
  safety_manager_agreement: ManagementAgreement;
  claims: EmployeeTaxCreditReturn;
  payroll_deposit: PayrollDeposit;
  fuel_card: FuelCard;
  claims_bc: EmployeeTaxCreditReturnBC;
  admin_checklist: AdminChecklist;
  fleet_checklist: FleetCheckList;
  employee_checklist: NewEmployeeChecklist;

  /** Hiring-manager attestation for BC admin checklist PDF — cleared when any `admin_checklist` value changes. */
  admin_checklist_hm_signature?: string;
  admin_checklist_hm_signed_at?: string;
  admin_checklist_hm_signer_name?: string;
  /** Hiring-manager attestation for fleet onboarding checklist PDF — cleared when any `fleet_checklist` value changes. */
  fleet_checklist_hm_signature?: string;
  fleet_checklist_hm_signed_at?: string;
  fleet_checklist_hm_signer_name?: string;
}

export const HIRE_TYPES: { value: string; label: string }[] = [
  { value: 'lct', label: 'LCT' },
  { value: 'tcp', label: 'TCP' },
  { value: 'field_supervisor', label: 'Field Supervisor' },
];

/** Position options for Create hiring invite (matches main contract position + API hire_type). */
export const ONBOARDING_INVITE_POSITION_OPTIONS: { value: string; label: string }[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'lct', label: 'LCT' },
  { value: 'field_supervisor', label: 'Field Supervisor' },
];

/** Display label for a stored hire_type value (list, filters, etc.). */
export function getHireTypeLabel(value: string | null | undefined): string {
  if (value == null || value === '') {
    return '—';
  }
  const hit = HIRE_TYPES.find((t) => t.value === value);
  return hit?.label ?? value;
}

export const NEW_EMPLOYEE_TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'displayId', label: 'ID', width: 72 },
  { id: 'candidateEmail', label: 'Candidate email' },
  { id: 'position', label: 'Position' },
  { id: 'hireDate', label: 'Hire Date' },
  { id: 'status', label: 'Status' },
  { id: '', width: 88 },
];

export const NEW_EMPLOYEE_STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: '#FF9800' },
  { value: 'approved', label: 'Approved', color: '#4CAF50' },
  { value: 'rejected', label: 'Rejected', color: '#F44336' },
];
