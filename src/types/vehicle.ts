import type { IUser } from './user';
import type { IVehiclePicture } from './vehicle-picture';

/** Vehicle inventory item status from vehicle list (e.g. adequate, low_stock, out_of_stock, excess). When not 'adequate', row shows warning badge and background. */
export type VehicleInventoryItemStatus = 'adequate' | 'low_stock' | 'out_of_stock' | 'excess';

export type IVehicleItem = {
  id: string;
  type: string;
  license_plate: string;
  unit_number: string;
  region: string;
  assigned_driver?: IUser | null;
  status: string;
  info?: string;
  year?: number;
  location?: string;
  is_spare_key?: boolean;
  is_winter_tire?: boolean;
  is_tow_hitch?: boolean;
  note?: string;
  pictures?: IVehiclePicture[];
  /** When present and not 'adequate', list row shows warning badge and background. */
  inventory_item_status?: VehicleInventoryItemStatus | string;
  /** Counts per status for tooltip: e.g. "2 Out of Stock, 1 Low Stock, 1 Excess". */
  inventory_item_status_summary?: {
    out_of_stock: number;
    low_stock: number;
    excess: number;
  };
};

export type IVehicleTableFilters = {
  query: string;
  region: string[];
  type: string[];
  status: string;
};
