export type UserRole = 'admin' | 'employee' | 'manager';

export type UserStatus = 'active' | 'inactive' | 'pending';

export interface IUserPerformance {
  punctuality?: number | null;
  attitude?: number | null;
  attendance?: number | null;
  communication?: number | null;
  teamwork?: number | null;
  problem_solving?: number | null;
  reliability?: number | null;
  quality_of_work?: number | null;
}

export interface IUser {
  id: string;
  photo_url?: string | null;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  address: IUserAddress;
  performance: IUserPerformance;
  status: UserStatus;
  preferred?: boolean;
  preferred_reason?: string;
  not_preferred?: boolean;
  not_preferred_reason?: string;
  preferred_employee_id?: string | null;
  not_preferred_employee_id?: string | null;
  preferred_employee?: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string | null;
    display_name: string;
  } | null;
  not_preferred_employee?: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string | null;
    display_name: string;
  } | null;
  tcp_certification_expiry?: string | null;
  driver_license_expiry?: string | null;
  birth_date?: string | null;
  hire_date?: string | null;
  created_at: string;
  updated_at: string;
  display_name?: string;
}

export type IUserTableFilters = {
  query: string;
  role: string[];
  status: string;
};

export type IUserAddress = {
  unit_number: string;
  street_number: string;
  street_name: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
};
