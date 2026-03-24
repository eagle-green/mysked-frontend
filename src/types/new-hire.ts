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
  middle_initial: string;
  sin: string;
  date_of_birth?: string | null;
  gender: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  home_phone_no: string;
  cell_no: string;
  email_address: string;
  signature?: string | null;
  medical_allergies?: string | null;
  country?: string | null;
}

export interface EmergencyContact {
  last_name: string;
  first_name: string;
  middle_initial: string;
  address: string;
  city: string;
  postal_code: string;
  phone_no: string;
  cell_no: string;
  relationship: string;
}

export interface ContractDetails {
  date?: string | null;
  hire_date?: string | null;
  start_date?: string | null;
  employee_name?: string | null;
  position: string;
  rate: number;
  employee_signature: string;
  area: string;
  department: string;
  home_cost_centre: string;
  job_number: string;
  is_union: string;
  work_schedule: string;
  is_refered: string;
  hrsp: string;
  salary_wage: string;
  comments: string;
  supper_intendent_signature: string;
  area_manager_signature: string;
  president_signature: string;
  refered_by?: string | null;
  employee_number?: string | null;
  social_insurance_number?: string | null;
}

export interface SocialAgreement {
  is_join_social_committee: boolean;
  authorize_deduction: boolean;
  not_agree_deduction: boolean;
}

export interface EquityQuestion {
  is_aboriginal_person: string;
  is_visible_minority: string;
  is_participation_voluntary: string;
  participation_voluntary_text?: string | null;
}

export interface ImportantPersonel {
  id: string;
  display_name: string;
  email: string;
  signed_at: string | null;
  signature: string | null;
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

export interface EmployeeTaxCreditReturn {
  basic_claim_amount: number;
  parent_claim_amount: number;
  age_claim_amount: number;
  pension_claim_amount: number;
  tuition_claim_amount: number;
  disability_claim_amount: number;
  spouse_claim_amount: number;
  dependant_claim_amount: number;
  infirm_dependent_claim_amount: number;
  transfer_common_claim_amount: number;
  transfer_partner_claim_amount: number;
  total_claim_amount: number;
}

export interface NewHire {
  contract_detail: ContractDetails;
  employee: EmployeeInformation;
  emergency_contact: EmergencyContact;
  equipments: Array<{ equipment_name: string; quantity: number }>;
  information_consent?: boolean;
  payroll_consent?: boolean;
  return_policy_consent?: boolean;
  socialAgreement: SocialAgreement;
  celebrate_diversity_consent: boolean;
  equity_question: EquityQuestion;
  hr_manager: ImportantPersonel;
  area_manager: ImportantPersonel;
  president: ImportantPersonel;
  policy_agreement: PolicyAgreement;
  claims: EmployeeTaxCreditReturn;
}
