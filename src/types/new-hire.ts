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
  employee_name: string;
  position: string;
  rate: number;
  employee_signature: string;
}

export interface SocialAgreement {
  is_join_social_committee: boolean;
  authorize_deduction: boolean;
  not_agree_deduction: boolean;
}

export interface NewHire {
  employee: EmployeeInformation;
  emergency_contact: EmergencyContact;
  equipments: Array<{ equipment_name: string; quantity: number }>;
  information_consent?: boolean;
  payroll_consent?: boolean;
  return_policy_consent?: boolean;
  hr_manager_id?: string;
  socialAgreement: SocialAgreement;
}
