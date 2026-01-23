import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetcher } from 'src/lib/axios';

// ----------------------------------------------------------------------

export interface InventoryType {
  id: string;
  value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UseInventoryTypesOptions {
  activeOnly?: boolean;
}

export interface UseInventoryTypesReturn {
  data: InventoryType[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addNew: (value: string) => Promise<InventoryType>;
  updateInventoryType: (id: string, value: string) => Promise<InventoryType>;
  deleteInventoryType: (id: string) => Promise<void>;
}

export function useInventoryTypes(
  options: UseInventoryTypesOptions = {}
): UseInventoryTypesReturn {
  const { activeOnly = true } = options;
  const queryClient = useQueryClient();

  const queryParams = activeOnly ? '?active_only=true' : '';
  const queryKey = ['inventory-types', activeOnly];

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetcher(`/api/inventory-types${queryParams}`);
      if (response && Array.isArray(response.inventoryTypes)) return response.inventoryTypes;
      if (Array.isArray(response)) return response;
      return [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
  });

  const addMutation = useMutation({
    mutationFn: async (value: string): Promise<InventoryType> => {
      const response = await fetcher([
        '/api/inventory-types',
        {
          method: 'POST',
          data: { value },
        },
      ]);
      // backend returns { inventoryType }, but keep compatibility if it returns direct object
      return response?.inventoryType ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }): Promise<InventoryType> => {
      const response = await fetcher([
        `/api/inventory-types/${id}`,
        {
          method: 'PUT',
          data: { value },
        },
      ]);
      return response?.inventoryType ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await fetcher([
        `/api/inventory-types/${id}`,
        {
          method: 'DELETE',
        },
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    data,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch inventory types') : null,
    refresh: () => refetch(),
    addNew: async (value: string) => addMutation.mutateAsync(value),
    updateInventoryType: async (id: string, value: string) => updateMutation.mutateAsync({ id, value }),
    deleteInventoryType: async (id: string) => deleteMutation.mutateAsync(id),
  };
}

