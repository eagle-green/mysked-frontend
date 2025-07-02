export type IClient = {
  id: string;
  region: string;
  name: string;
  logo_url: string | null;
  email: string;
  contact_number: string;
  unit_number: string;
  street_number: string;
  street_name: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  status: string;
  display_address?: string;
};

export type IClientTableFilters = {
  query: string;
  region: string[];
  status: string;
};
