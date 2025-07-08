import type { IDateValue, IDatePickerControl } from './common';

// ----------------------------------------------------------------------

export type IJobTableFilters = {
  query: string;
  region: string[];
  name: string;
  status: string;
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
  // shipping: number;
  // discount: number;
  // subtotal: number;
  site: IJobSite;
  // totalAmount: number;
  // totalQuantity: number;
  start_time: IDateValue;
  end_time: IDateValue;
  // history: IOrderHistory;
  // payment: IOrderPayment;
  client: IJobClient;
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

export type IJobSite = {
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
