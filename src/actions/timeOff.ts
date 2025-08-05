import type { 
  TimeOffRequestFilters, 
  CreateTimeOffRequestData,
  UpdateTimeOffRequestData 
} from 'src/types/timeOff';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetcher } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const TIME_OFF_ENDPOINT = '/api/time-off';

// ----------------------------------------------------------------------

export function useGetTimeOffRequests(filters?: TimeOffRequestFilters) {
  const query = useQuery({
    queryKey: ['time-off-requests', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.user_id) params.append('user_id', filters.user_id);

      const url = `${TIME_OFF_ENDPOINT}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetcher(url);
      return response.data || [];
    },
  });

  return {
    timeOffRequests: query.data || [],
    timeOffRequestsLoading: query.isLoading,
    timeOffRequestsError: query.error,
    timeOffRequestsEmpty: !query.isLoading && query.data?.length === 0,
  };
}

export function useGetTimeOffRequest(id: string) {
  const query = useQuery({
    queryKey: ['time-off-request', id],
    queryFn: async () => {
      const response = await fetcher(`${TIME_OFF_ENDPOINT}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  return {
    timeOffRequest: query.data,
    timeOffRequestLoading: query.isLoading,
    timeOffRequestError: query.error,
  };
}

export function useGetAllTimeOffRequests(filters?: TimeOffRequestFilters) {
  const query = useQuery({
    queryKey: ['all-time-off-requests', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.user_id) params.append('user_id', filters.user_id);

      const url = `${TIME_OFF_ENDPOINT}/admin/all${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetcher(url);
      return response.data || [];
    },
  });

  return {
    allTimeOffRequests: query.data || [],
    allTimeOffRequestsLoading: query.isLoading,
    allTimeOffRequestsError: query.error,
    allTimeOffRequestsEmpty: !query.isLoading && query.data?.length === 0,
  };
}

export function useCreateTimeOffRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTimeOffRequestData) => {
      const response = await fetcher([TIME_OFF_ENDPOINT, {
        method: 'POST',
        data,
      }]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-time-off-count'] });
      queryClient.invalidateQueries({ queryKey: ['user-time-off-dates'] });
    },
  });
}

export function useUpdateTimeOffRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTimeOffRequestData }) => {
      const response = await fetcher([`${TIME_OFF_ENDPOINT}/${id}`, {
        method: 'PUT',
        data,
      }]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-time-off-count'] });
      queryClient.invalidateQueries({ queryKey: ['user-time-off-dates'] });
    },
  });
}

export function useDeleteTimeOffRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetcher([`${TIME_OFF_ENDPOINT}/${id}`, {
        method: 'DELETE',
      }]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-time-off-count'] });
      queryClient.invalidateQueries({ queryKey: ['user-time-off-dates'] });
    },
  });
}

export function useAdminDeleteTimeOffRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetcher([`${TIME_OFF_ENDPOINT}/admin/${id}`, {
        method: 'DELETE',
      }]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-time-off-count'] });
      queryClient.invalidateQueries({ queryKey: ['user-time-off-dates'] });
    },
  });
}

export function useApproveTimeOffRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, admin_notes }: { id: string; admin_notes?: string }) => {
      const response = await fetcher([`${TIME_OFF_ENDPOINT}/admin/${id}/approve`, {
        method: 'PUT',
        data: { admin_notes },
      }]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-time-off-count'] });
      queryClient.invalidateQueries({ queryKey: ['user-time-off-dates'] });
    },
  });
}

export function useRejectTimeOffRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, admin_notes }: { id: string; admin_notes?: string }) => {
      const response = await fetcher([`${TIME_OFF_ENDPOINT}/admin/${id}/reject`, {
        method: 'PUT',
        data: { admin_notes },
      }]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-time-off-count'] });
      queryClient.invalidateQueries({ queryKey: ['user-time-off-dates'] });
    },
  });
} 

export function useGetPendingTimeOffCount() {
  const { user } = useAuthContext();
  
  const query = useQuery({
    queryKey: ['pending-time-off-count'],
    queryFn: async () => {
      const response = await fetcher(`${TIME_OFF_ENDPOINT}/admin/all?status=pending`);
      return response.data?.length || 0;
    },
    enabled: user?.role === 'admin', // Only run for admin users
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch when component mounts if data is fresh
  });

  return {
    pendingCount: query.data || 0,
    pendingCountLoading: query.isLoading,
    pendingCountError: query.error,
  };
} 

export function useCheckTimeOffConflict() {
  const { user } = useAuthContext();
  
  return useMutation({
    mutationFn: async ({ startDate, endDate, excludeId }: { 
      startDate: string; 
      endDate: string; 
      excludeId?: string;
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      if (excludeId) params.append('exclude_id', excludeId);
      
      const response = await fetcher(`${TIME_OFF_ENDPOINT}/check-conflict?${params.toString()}`);
      return response;
    },
  });
}

export function useGetUserTimeOffDates() {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ['user-time-off-dates'],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetcher(`${TIME_OFF_ENDPOINT}/user-dates`);
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}