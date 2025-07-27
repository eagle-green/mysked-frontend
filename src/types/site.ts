export type ISiteItem = {
  id: string;
  company_id: string;
  company_name?: string;
  region: string;
  name: string;
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

export type ISiteTableFilters = {
  query: string;
  region: string[];
  status: string;
};
