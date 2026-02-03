import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';

export interface UserAccess {
  id: string;
  user_id: string;
  invoice_access: boolean;
  vehicle_access?: boolean;
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

  const userId = user?.id != null ? String(user.id).trim() : undefined;
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['user-access', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const response = await fetcher(endpoints.invoice.userAccess.detail(userId));
        // Backend returns { success, data: { id, user_id, invoice_access, vehicle_access, ... } }
        // Handle both { data: record } and { data: { data: record } } shapes
        const raw = response?.data ?? response;
        const record = (typeof raw?.data === 'object' ? raw.data : raw) as UserAccess | null;
        if (record && typeof record === 'object') {
          return record;
        }
        return null;
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 400 || err?.response?.status === 403) {
          return null;
        }
        console.error('Error fetching user access:', err);
        return null;
      }
    },
    enabled: !!userId && !isAuthorizedAdmin, // Skip query for authorized admins only
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 min - cache for longer to avoid refetch causing access denial
    refetchOnMount: false, // Don't refetch on mount - use cached data
    refetchOnWindowFocus: false, // Don't refetch on window focus
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Consider both isLoading (initial) and isFetching (refetch) as loading state
  const isLoadingState = isLoading || isFetching;
  // If admin, always true. If loading and no data yet, return true (optimistic - let guard handle it)
  // If data loaded, check vehicle_access
  const hasVehicleAccess = user?.role === 'admin' || (isLoadingState && data === undefined) || (data?.vehicle_access === true);

  return {
    userAccess: data,
    isLoading: isLoadingState, // Return true if either loading or fetching
    error,
    hasInvoiceAccess: isAuthorizedAdmin || (data?.invoice_access ?? false),
    hasVehicleAccess, // Explicit true; admins always
    isAuthorizedAdmin,
  };
}

