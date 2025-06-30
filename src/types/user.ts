export type IUser = {
  id: string;
  role: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  email: string;
  phone_number: string;
  address: IUserAddress;
  status: string;
};

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
