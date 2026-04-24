import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetcher } from 'src/lib/axios';

import {
  IPreTripVehicleInspection,
  IPreTripVehicleInspectionFilter,
} from 'src/types/vehicle-inspection';

//------------------------------------------------

const API_ENDPOINT = {
  ROOT: '/api/vehicle-inspection',
  UPDATE: (id: string) => `/api/vehicle-inspection/${id}`,
};

const QUERY_KEY = {
  ROOT: 'vehicle-inspection',
  UPDATE: (id: string) => `vehicle-inspection/${id}`,
};

// CREATE API ENDPOINT
export function useCreateVehicleInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: IPreTripVehicleInspection) => {
      const response = await fetcher([
        API_ENDPOINT.ROOT,
        {
          method: 'POST',
          data,
        },
      ]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.ROOT] });
    },
  });
}

// UPDATE API ENDPOINT
export function useUpdateVehicleInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: IPreTripVehicleInspection }) => {
      const response = await fetcher([
        API_ENDPOINT.UPDATE(id),
        {
          method: 'PUT',
          data,
        },
      ]);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.ROOT] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.UPDATE(variables.id)] });
    },
  });
}

// DELETE API ENDPOINT
export function useDeleteVehicleInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetcher([
        API_ENDPOINT.UPDATE(id),
        {
          method: 'DELETE',
        },
      ]);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.ROOT] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.UPDATE(variables)] });
    },
  });
}

export function useGetWorkerVehicleInspectionList(filters?: IPreTripVehicleInspectionFilter) {
  const query = useQuery({
    queryKey: ['all-time-off-requests', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.query) params.append('query', filters.query);
      if (filters?.type?.length) params.append('types', JSON.stringify(filters.type));
      if (filters?.vehicles?.length) params.append('vehicles', JSON.stringify(filters.vehicles));
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const url = `${API_ENDPOINT.ROOT}/worker${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetcher(url);
      return response.data || [];
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    empty: !query.isLoading && query.data?.length === 0,
  };
}
