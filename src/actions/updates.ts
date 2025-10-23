import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetcher } from 'src/lib/axios';

// ----------------------------------------------------------------------

export const endpoints = {
  updates: {
    list: '/api/updates',
    details: (id: string) => `/api/updates/${id}`,
    create: '/api/updates',
    update: (id: string) => `/api/updates/${id}`,
    delete: (id: string) => `/api/updates/${id}`,
  },
};

// ----------------------------------------------------------------------

export function useGetUpdates() {
  return useQuery({
    queryKey: ['updates'],
    queryFn: async () => {
      const response = await fetcher(endpoints.updates.list);
      return response.data.updates;
    },
  });
}

export function useGetUpdate(id: string) {
  return useQuery({
    queryKey: ['update', id],
    queryFn: async () => {
      const response = await fetcher(endpoints.updates.details(id));
      return response.data.update;
    },
    enabled: !!id,
  });
}

// Alias for consistency
export const useGetUpdateById = useGetUpdate;

export function useCreateUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetcher([endpoints.updates.create, {
        method: 'POST',
        data,
      }]);
      return response.data.update;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates'] });
    },
  });
}

export function useUpdateUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetcher([endpoints.updates.update(id), {
        method: 'PUT',
        data,
      }]);
      return response.data.update;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['updates'] });
      queryClient.invalidateQueries({ queryKey: ['update', id] });
    },
  });
}

export function useDeleteUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await fetcher([endpoints.updates.delete(id), {
        method: 'DELETE',
      }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates'] });
    },
  });
}
