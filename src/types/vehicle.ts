import type { IUser } from './user';

export type IVehicleItem = {
  id: string;
  type: string;
  license_plate: string;
  unit_number: string;
  region: string;
  assigned_driver: IUser;
  status: string;
  info?: string;
  year?: number;
  location?: string;
  is_spare_key?: boolean;
  is_winter_tire?: boolean;
  is_tow_hitch?: boolean;
  note?: string;
};

export type IVehicleTableFilters = {
  query: string;
  region: string[];
  type: string[];
  status: string;
};
