import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';

export interface UserAccess {
  id: string;
  user_id: string;
  invoice_access: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Authorized users who can always see Invoice section and manage User Access
const AUTHORIZED_INVOICE_ADMINS = [
  'kiwoon@eaglegreen.ca',
  'kesia@eaglegreen.ca',
  'matth@eaglegreen.ca',
  'joec@eaglegreen.ca',
];

export function useUserAccess() {
  const { user } = useAuthContext();

  // Check if user is authorized admin (always has invoice access)
  const isAuthorizedAdmin = user?.email && AUTHORIZED_INVOICE_ADMINS.includes(user.email.toLowerCase());

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await fetcher(endpoints.invoice.userAccess.detail(user.id));
        // If response.data exists, return it
        if (response.data) {
          return response.data as UserAccess;
        }
        // If no data, return null (no access record)
        return null;
      } catch (err: any) {
        // If no access record exists (404), return null to indicate no access
        // For other errors, also return null (deny access on error)
        if (err?.response?.status === 404 || err?.response?.status === 400) {
          return null;
        }
        // For other errors, log and return null (deny access)
        console.error('Error fetching user access:', err);
        return null;
      }
    },
    enabled: !!user?.id && !isAuthorizedAdmin, // Skip query for authorized admins
    retry: false, // Don't retry on 404
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  return {
    userAccess: data,
    isLoading,
    error,
    hasInvoiceAccess: isAuthorizedAdmin || (data?.invoice_access ?? false),
    isAuthorizedAdmin, // Export this for use in components
  };
}

