import type { IDateValue, IDatePickerControl } from './common';

// ----------------------------------------------------------------------

export type IJobTableFilters = {
  query: string;
  region: string[];
  name?: string;
  status: string;
  client: string[];
  company: string[];
  site: string[];
  endDate: IDatePickerControl;
  startDate: IDatePickerControl;
};

export type IOrderHistory = {
  orderTime: IDateValue;
  paymentTime: IDateValue;
  deliveryTime: IDateValue;
  completionTime: IDateValue;
  timeline: { title: string; time: IDateValue }[];
};

export type IOrderShippingAddress = {
  fullAddress: string;
  phoneNumber: string;
};

export type IOrderPayment = {
  cardType: string;
  cardNumber: string;
};

export type IOrderDelivery = {
  shipBy: string;
  speedy: string;
  trackingNumber: string;
};

export type IJobClient = {
  id: string;
  name: string;
  logo_url: string;
};

export type IOrderProductItem = {
  id: string;
  sku: string;
  name: string;
  price: number;
  coverUrl: string;
  quantity: number;
};

export type IJob = {
  id: string;
  job_number: string;
  region: string;
  // taxes: number;
  status: string;
  po_number?: string;
  // shipping: number;
  // discount: number;
  // subtotal: number;
  company: IJobCompany;
  // totalAmount: number;
  // totalQuantity: number;
  start_time: IDateValue;
  end_time: IDateValue;
  // history: IOrderHistory;
  // payment: IOrderPayment;
  client: IJobClient;
  site: IJobSite;
  // delivery: IOrderDelivery;
  items: IOrderProductItem[];
  // shippingAddress: IOrderShippingAddress;
  workers: IJobWorker[];
  vehicles: IJobVehicle[];
  equipments: IJobEquipment[];
  notes?: string;
  note?: string;
  isOverdue?: boolean; // Flag to indicate if job is overdue and needs attention
};

export type IJobCompany = {
  id: string;
  name: string;
  region: string;
  display_address?: string;
  unit_number?: string;
  street_number?: string;
  street_name?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
};

export type IJobSite = {
  id: string;
  name: string;
  region: string;
  email?: string;
  contact_number?: string;
  unit_number?: string;
  street_number?: string;
  street_name?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  status?: string;
  display_address?: string;
  phoneNumber?: string;
};

export type IJobWorker = {
  id: string;
  position: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  start_time: IDateValue;
  end_time: IDateValue;
  photo_url?: string;
  status?: string;
};

export interface IJobVehicle {
  id: string;
  type: string;
  license_plate: string;
  unit_number: string;
  quantity?: number; // Added for open jobs to specify how many vehicles of this type
  operator: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url: string;
    worker_index: number | null;
    position?: string;
  };
}

export type IJobEquipment = {
  id: string;
  type: string;
  quantity: number;
};

// Timesheet types
export interface TimesheetJob {
  id: string;
  job_number: string;
  po_number?: string | null;
  start_time: string | Date;
  end_time: string | Date;
  status: string;
  notes?: string;
}

export interface TimesheetCompany {
  name: string;
  logo_url?: string;
}

export interface TimesheetClient {
  name: string;
  logo_url?: string;
}

export interface TimesheetSite {
  name: string;
  unit_number?: string;
  street_number?: string;
  street_name?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  display_address?: string;
}

export interface TimesheetManager {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface TimesheetConfirmedBy {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface TimesheetEntry {
  id: string;
  timesheet_id?: string;
  worker_id?: string;
  job_worker_id?: string;
  job_id: string;
  original_start_time?: string | Date;
  original_end_time?: string | Date;
  travel_start?: string | Date;
  shift_start?: string | Date;
  break_start?: string | Date;
  break_end?: string | Date;
  shift_end?: string | Date;
  travel_end?: string | Date;
  shift_total_minutes?: number;
  break_total_minutes?: number;
  travel_to_minutes?: number;
  travel_during_minutes?: number;
  travel_from_minutes?: number;
  total_work_minutes?: number;
  travel_to_km?: number;
  travel_during_km?: number;
  travel_from_km?: number;
  total_travel_km?: number;
  worker_notes?: string;
  admin_notes?: string;
  status?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  timesheet_date?: string | Date;
  timesheet_manager_id?: string;
  confirmed_at?: string | Date;
  
  // Nested objects
  job: TimesheetJob;
  company: TimesheetCompany;
  client: TimesheetClient;
  site: TimesheetSite;
  timesheet_manager: TimesheetManager;
  confirmed_by: TimesheetConfirmedBy | null;
}
