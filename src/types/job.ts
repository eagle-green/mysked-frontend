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
  vehicle: IJobVehicle[];
  equipment: IJobEquipment[];
};

export type IJobSite = {
  id: string;
  name: string;
  region: string;
  full_address: string;
};

export type IJobWorker = {
  id: string;
  position: string;
  employee: string;
  first_name: string;
  last_name: string;
  start_time: IDateValue;
  end_time: IDateValue;
  photo_url?: string;
};

export type IJobVehicle = {
  id: string;
  type: string;
  number: string;
  operator: string;
};

export type IJobEquipment = {
  id: string;
  type: string;
  name: string;
  operator: string;
  quantity: number;
};
