import { useMutation, useQueryClient } from '@tanstack/react-query';

import { fetcher } from 'src/lib/axios';

import { IIncidentReport } from 'src/types/incident-report';

const INCIDENT_REPORT_ENDPOINT = '/api/incident-report';

export function useCreateIncidentReportRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: IIncidentReport) => {
      const response = await fetcher([
        INCIDENT_REPORT_ENDPOINT,
        {
          method: 'POST',
          data,
        },
      ]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-report'] });
    },
  });
}

export function useUpdateIncidentReportRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: IIncidentReport }) => {
      const response = await fetcher([
        `${INCIDENT_REPORT_ENDPOINT}/${id}`,
        {
          method: 'PUT',
          data,
        },
      ]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-report'] });
    },
  });
}

export function useDeleteIncidentReportRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetcher([
        `${INCIDENT_REPORT_ENDPOINT}/${id}`,
        {
          method: 'DELETE',
        },
      ]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-report'] });
    },
  });
}
