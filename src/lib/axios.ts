import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
);

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for token
    // localStorage is checked first if "keep signed in" was selected
    const keepSignedIn = localStorage.getItem('jwt_keep_signed_in') === 'true';
    const token = keepSignedIn 
      ? localStorage.getItem('jwt_access_token')
      : sessionStorage.getItem('jwt_access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    // Check the HTTP method and use the appropriate Axios method
    const method = config?.method?.toLowerCase() || 'get'; // Default to GET if no method is provided

    let res;
    if (method === 'post') {
      res = await axiosInstance.post(url, config?.data, { ...config });
    } else if (method === 'put') {
      res = await axiosInstance.put(url, config?.data, { ...config });
    } else if (method === 'patch') {
      res = await axiosInstance.patch(url, config?.data, { ...config });
    } else if (method === 'delete') {
      res = await axiosInstance.delete(url, { ...config });
    } else {
      res = await axiosInstance.get(url, { ...config });
    }

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/auth/me',
    signIn: '/api/auth/sign-in',
    signUp: '/api/auth/sign-up',
    googleLogin: '/api/auth/google-login',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
  work: {
    job: '/api/works/jobs',
    openJob: '/api/works/open-jobs',
    workers: '/api/works/workers',
    missingTimecards: '/api/work/missing-timecards',
    telusReports: {
      list: '/api/telus-reports',
      detail: (id: string) => `/api/telus-reports/${id}`,
      create: '/api/telus-reports',
      update: (id: string) => `/api/telus-reports/${id}`,
      delete: (id: string) => `/api/telus-reports/${id}`,
      export: (id: string) => `/api/telus-reports/${id}/export`,
      sendEmail: (id: string) => `/api/telus-reports/${id}/send-email`,
      review: (id: string) => `/api/telus-reports/${id}/review`,
      generateDaily: '/api/telus-reports/generate/daily',
      generateWeekly: '/api/telus-reports/generate/weekly',
      getEmail: '/api/telus-reports/email',
    },
  },
  timesheet: {
    list: '/api/timesheets',
    admin: '/api/timesheets/admin',
    submit: '/api/timesheets/:id/submit',
    sendEmail: '/api/timesheets/:id/send-email',
    approve: '/api/timesheets/:id/approve',
    reject: '/api/timesheets/:id/reject',
    transfer: '/api/timesheets/:id/transfer-manager',
    entries: '/api/timesheets/entries',
    exportPDF: '/api/timesheets/:id/export-pdf',
    jobVehiclesInventory: (timesheetId: string) => `/api/timesheets/${timesheetId}/job-vehicles-inventory`,
    equipmentLeft: (timesheetId: string) => `/api/timesheets/${timesheetId}/equipment-left`,
  },
  flra: {
    list: '/api/flra',
    detail: '/api/flra/:id',
    create: '/api/flra',
    update: '/api/flra/:id',
    submit: '/api/flra/:id/submit',
  },
      tmp: {
        list: '/api/tmp',
        detail: '/api/tmp/:id',
        byJob: '/api/tmp/job/:jobId',
        create: '/api/tmp',
        update: '/api/tmp/:id',
        submit: '/api/tmp/:id/submit',
        confirm: '/api/tmp/:id/confirm',
        addPdf: '/api/tmp/:id/pdfs',
        updatePdf: '/api/tmp/:id/pdfs/:pdfId',
        deletePdf: '/api/tmp/:id/pdfs/:pdfId',
      },
  invoice: {
    list: '/api/invoice',
    detail: (id: string) => `/api/invoice/${id}`,
    timesheets: (id: string) => `/api/invoice/${id}/timesheets`,
    create: '/api/invoice',
    update: (id: string) => `/api/invoice/${id}`,
    delete: (id: string) => `/api/invoice/${id}`,
    qboStatus: '/api/invoice/qbo-status',
    qboConnect: '/api/invoice/qbo/connect',
    services: '/api/invoice/services',
    servicesLastSync: '/api/invoice/services/last-sync',
    servicesImportQBO: '/api/invoice/services/import/qbo',
    customers: '/api/invoice/customers',
    customersLastSync: '/api/invoice/customers/last-sync',
    customersImportQBO: '/api/invoice/customers/import/qbo',
    customerDetails: (id: string) => `/api/invoice/customers/${id}`,
    customerRates: (customerId: string) => `/api/invoice/customers/${customerId}/rates`,
    customerInventoryRates: (customerId: string) => `/api/invoice/customers/${customerId}/inventory-rates`,
    taxCodes: '/api/invoice/tax-codes',
    taxCodesLastSync: '/api/invoice/tax-codes/last-sync',
    taxCodesImportQBO: '/api/invoice/tax-codes/import/qbo',
    terms: '/api/invoice/terms',
    termsLastSync: '/api/invoice/terms/last-sync',
    userAccess: {
      list: '/api/user-access',
      detail: (id: string) => `/api/user-access/${id}`,
      update: (id: string) => `/api/user-access/${id}`,
    },
    termsImportQBO: '/api/invoice/terms/import/qbo',
    stores: '/api/invoice/stores',
    storesImportQBO: '/api/invoice/stores/import/qbo',
    generateSearchJobs: '/api/invoice/generate/search-jobs',
    generateJobDetails: '/api/invoice/generate/job-details',
    generateCustomers: '/api/invoice/generate/customers',
  },
  management: {
    company: '/api/companies',
    site: '/api/sites',
    client: '/api/clients',
    user: '/api/users',
    vehicle: '/api/vehicles',
    vehiclePictures: '/api/vehicle-pictures',
    equipment: '/api/equipment',
    equipmentTypes: '/api/equipment-types',
    inventory: '/api/inventory',
    companyPreferences: '/api/company-preferences',
    clientPreferences: '/api/client-preferences',
    userPreferences: '/api/user-preferences',
    sitePreference: '/api/site-preferences',
    companyAll: '/api/companies/all',
    siteAll: '/api/sites/all',
    clientAll: '/api/clients/all',
    orientations: '/api/orientations',
    orientationTypes: '/api/orientation-types',
    otherDocuments: '/api/other-documents',
  },
  cloudinary: {
    upload: '/api/cloudinary',
    userAssets: '/api/cloudinary/user-assets',
    createUserFolder: '/api/cloudinary/create-user-folder',
    deleteUserAssets: '/api/cloudinary/delete-user-assets',
    cleanupPlaceholder: '/api/cloudinary/cleanup-placeholder',
    proxyPdf: '/api/cloudinary/proxy-pdf',
  },
  documentTypes: {
    list: '/api/document-types',
    create: '/api/document-types',
    update: (id: string) => `/api/document-types/${id}`,
    delete: (id: string) => `/api/document-types/${id}`,
  },
  short: {
    resolve: '/api/short',
  },
  unavailability: {
    create: '/api/unavailability',
    createBatch: '/api/unavailability/batch',
    deleteBatch: '/api/unavailability/batch/delete',
    user: (userId: string) => `/api/unavailability/user/${userId}`,
    admin: '/api/unavailability/admin/all',
    delete: (id: string) => `/api/unavailability/${id}`,
  },
  incidentReport: {
    list: '/api/incident-report',
    admin: '/api/incident-report/admin',
    detail: (id: string) => `/api/incident-report/${id}`,
    adminDetail: (id: string) => `/api/incident-report/admin/${id}`,
    create: '/api/incident-report',
    update: (id: string) => `/api/incident-report/${id}`,
    delete: (id: string) => `/api/incident-report/${id}`,
  },
};
