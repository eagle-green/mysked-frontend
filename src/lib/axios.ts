import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
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
  // site: {
  //   list: '/api/sites',
  //   create: '/api/sites',
  // },
  work: { job: '/api/works/jobs' },
  site: '/api/sites',
  client: '/api/clients',
  user: '/api/users',
  cloudinary: '/api/cloudinary',
};
