import type { IDateValue, IDatePickerControl } from './common';

// ----------------------------------------------------------------------

export type IInvoiceTableFilters = {
  name: string;
  status: string;
  customer: string[];
  store: string[];
  endDate: IDatePickerControl;
  startDate: IDatePickerControl;
};

export type IInvoiceItem = {
  id: string;
  title: string;
  price: number;
  total: number;
  service: string;
  quantity: number;
  serviceDate?: IDateValue | null;
  jobDate?: string | null; // Job's actual date (from jobs.start_time), doesn't change when service date is edited
  tax?: string | number;
  taxName?: string;
  taxRate?: number;
  description?: string;
  // Worker/Position info (stored separately, not in description)
  workerName?: string;
  position?: string;
  shiftTimes?: string;
  vehicleType?: string; // For mobilization items
  breakMinutes?: number | null; // Break time in minutes
  travelMinutes?: number | null; // Travel time in minutes
};

export type IInvoice = {
  id: string;
  displayId?: number; // Display ID for sequential numbering (1, 2, 3, ...)
  sent: number;
  taxes: number;
  status: string;
  subtotal: number;
  discount: number;
  shipping: number;
  totalAmount: number;
  dueDate: IDateValue;
  invoiceNumber?: string; // QBO-generated invoice number (auto-populated)
  poNumber?: string | null; // Purchase Order number (user input)
  networkNumber?: string | null;
  terms?: string | null; // Terms ID (for form select)
  termsName?: string | null; // Terms display name (e.g. "Net 30") for PDF and UI
  store?: string | null;
  approver?: string | null;
  notes?: string | null;
  customerMemo?: string | null; // Message on invoice
  privateNote?: string | null; // Message on statement
  items: IInvoiceItem[];
  createDate: IDateValue;
  qbo_invoice_id?: string; // QuickBooks transaction ID
  qbo_doc_number?: string; // QuickBooks document number for display
  invoiceTo: {
    id?: string;
    name: string;
    company?: string;
    phoneNumber?: string;
    email?: string;
    fullAddress?: string;
    primary?: boolean;
  } | null;
  invoiceFrom: {
    id?: string;
    name: string;
    company?: string;
    phoneNumber?: string;
    email?: string;
    fullAddress?: string;
    primary?: boolean;
  } | null;
  created_by?: {
    first_name: string;
    last_name: string;
    photo_url?: string;
  };
  updated_by?: {
    first_name: string;
    last_name: string;
    photo_url?: string;
  };
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
};

