import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetcher } from 'src/lib/axios';

// ----------------------------------------------------------------------

export interface EquipmentType {
  id: string;
  value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UseEquipmentOptions {
  activeOnly?: boolean;
}

export interface UseEquipmentReturn {
  data: EquipmentType[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addNew: (value: string) => Promise<EquipmentType>;
  updateEquipment: (id: string, value: string) => Promise<EquipmentType>;
  deleteEquipment: (id: string) => Promise<void>;
}

export function useEquipment(options: UseEquipmentOptions = {}): UseEquipmentReturn {
  const { activeOnly = true } = options;
  const queryClient = useQueryClient();
  
  const queryParams = activeOnly ? '?active_only=true' : '';
  const queryKey = ['equipment-types', activeOnly];

  // Use React Query for data fetching with proper caching
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetcher(`/api/equipment-types${queryParams}`);
      // Backend returns { equipmentTypes: [...] }, extract the array
      if (response && Array.isArray(response.equipmentTypes)) {
        return response.equipmentTypes;
      }
      // Fallback: if response is already an array, return it
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
  });

  // Add new equipment type mutation
  const addMutation = useMutation({
    mutationFn: async (value: string): Promise<EquipmentType> => {
      const response = await fetcher([
        '/api/equipment-types',
        {
          method: 'POST',
          data: { value },
        },
      ]);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch the equipment types query
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Update equipment type mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }): Promise<EquipmentType> => {
      const response = await fetcher([
        `/api/equipment-types/${id}`,
        {
          method: 'PUT',
          data: { value },
        },
      ]);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch the equipment types query
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete equipment type mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await fetcher([
        `/api/equipment-types/${id}`,
        {
          method: 'DELETE',
        },
      ]);
    },
    onSuccess: () => {
      // Invalidate and refetch the equipment types query
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const refresh = () => {
    refetch();
  };

  const addNew = async (value: string): Promise<EquipmentType> => addMutation.mutateAsync(value);

  const updateEquipment = async (id: string, value: string): Promise<EquipmentType> => updateMutation.mutateAsync({ id, value });

  const deleteEquipment = async (id: string): Promise<void> => {
    await deleteMutation.mutateAsync(id);
  };

  return {
    data,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch equipment types') : null,
    refresh,
    addNew,
    updateEquipment,
    deleteEquipment,
  };
}

