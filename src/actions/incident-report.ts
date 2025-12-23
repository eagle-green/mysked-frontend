import type { IIncidentReport } from 'src/types/incident-report';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { fetcher } from 'src/lib/axios';

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
      // Invalidate all incident report queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['incident-report'] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'all-incident-report-requests' || key === 'incident-report-status-counts';
        }
      });
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
    onSuccess: (_, variables) => {
      // Invalidate all incident report queries to refresh the list and detail pages
      queryClient.invalidateQueries({ queryKey: ['incident-report'] });
      queryClient.invalidateQueries({ queryKey: ['incident-report', variables.id] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'all-incident-report-requests' || key === 'incident-report-status-counts';
        }
      });
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
      // Invalidate all incident report queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['incident-report'] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'all-incident-report-requests' || key === 'incident-report-status-counts';
        }
      });
    },
  });
}

export function useCreateIncidentReportComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, description, parent_id }: { id: string; description: string; parent_id?: string }) => {
      const response = await fetcher([
        `${INCIDENT_REPORT_ENDPOINT}/${id}/comments`,
        {
          method: 'POST',
          data: { description, parent_id },
        },
      ]);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate incident report queries to refresh comments
      queryClient.invalidateQueries({ queryKey: ['incident-report', variables.id] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'incident-report' || key === 'all-incident-report-requests';
        }
      });
    },
  });
}
