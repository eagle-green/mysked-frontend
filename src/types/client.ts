export interface IClient {
  id: string;
  logo_url?: string | null;
  region: string;
  name: string;
  email: string | null;
  /** Multiple timesheet email addresses to receive timesheet submissions */
  timesheet_emails: string[];
  contact_number: string | null;
  unit_number: string | null;
  street_number: string | null;
  street_name: string | null;
  city: string;
  province: string;
  postal_code: string | null;
  country: string;
  status: string;
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
  created_at: string;
  updated_at: string;
  display_address?: string;
}

export type IClientTableFilters = {
  query: string;
  region: string[];
  status: string;
};
