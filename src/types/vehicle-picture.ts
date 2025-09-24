import type { VehicleSection } from 'src/sections/management/vehicle/components/vehicle-diagram';

export type IVehiclePicture = {
  id: string;
  vehicle_id: string;
  section: VehicleSection;
  url: string;
  note?: string;
  uploaded_at: string;
  uploaded_by?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
};

export type IVehiclePictureUpload = {
  section: VehicleSection;
  file: File;
  note?: string;
};

export type IVehiclePictureGroup = {
  section: VehicleSection;
  pictures: IVehiclePicture[];
  count: number;
};

export type IVehiclePicturesData = {
  vehicle_id: string;
  pictures: IVehiclePicture[];
  groups: Record<VehicleSection, IVehiclePicture[]>;
  total_count: number;
};
