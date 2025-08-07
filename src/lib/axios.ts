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
    const token = sessionStorage.getItem('jwt_access_token');
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
  auth: {
    me: '/api/auth/me',
    signIn: '/api/auth/sign-in',
    signUp: '/api/auth/sign-up',

  },
  work: {
    job: '/api/works/jobs',
    calendar: '/api/calendar',
  },
  timesheet: '/api/timesheets',
  management: {
    company: '/api/companies',
    site: '/api/sites',
    sitePreference: '/api/site-preferences',
    client: '/api/clients',
    user: '/api/users',
    vehicle: '/api/vehicles',
    equipment: '/api/equipment',
    companyPreferences: '/api/company-preferences',
    clientPreferences: '/api/client-preferences',
    userPreferences: '/api/user-preferences',
  },
  cloudinary: {
    upload: '/api/cloudinary',
    createUserFolder: '/api/cloudinary/create-user-folder',
    deleteUserAssets: '/api/cloudinary/delete-user-assets',
    cleanupPlaceholder: '/api/cloudinary/cleanup-placeholder',
    userAssets: '/api/cloudinary/user-assets',
  },
};
