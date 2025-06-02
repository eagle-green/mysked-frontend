import type { IUser } from './user';

export type IVehicleItem = {
  id: string;
  type: string;
  license_plate: string;
  unit_number: string;
  region: string;
  assigned_driver: IUser;
  status: string;
};

export type IVehicleTableFilters = {
  query: string;
  region: string[];
  type: string[];
  status: string;
};
