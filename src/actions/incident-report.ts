import type { IIncidentReport } from 'src/types/incident-report';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetcher } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';

const INCIDENT_REPORT_ENDPOINT = '/api/incident-report';

// ----------------------------------------------------------------------

export type IncidentReportStatusCounts = {
  all: number;
  pending: number;
  in_review: number;
  resolved: number;
};

export function useGetIncidentReportStatusCounts() {
  const { user } = useAuthContext();

  const query = useQuery({
    queryKey: ['incident-report-status-counts'],
    queryFn: async () => {
      const response = await fetcher(`${INCIDENT_REPORT_ENDPOINT}/admin/counts/status`);
      return (response.data || { all: 0, pending: 0, in_review: 0, resolved: 0 }) as IncidentReportStatusCounts;
    },
    enabled: user?.role === 'admin',
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });

  return {
    statusCounts: query.data ?? { all: 0, pending: 0, in_review: 0, resolved: 0 },
    statusCountsLoading: query.isLoading,
    statusCountsError: query.error,
  };
}

/** Status counts for current user's incident reports (My Schedule list). */
export function useGetMyIncidentReportStatusCounts() {
  const { user } = useAuthContext();

  const query = useQuery({
    queryKey: ['my-incident-report-status-counts'],
    queryFn: async () => {
      const response = await fetcher(`${INCIDENT_REPORT_ENDPOINT}/counts/status`);
      return (response.data || { all: 0, pending: 0, in_review: 0, resolved: 0 }) as IncidentReportStatusCounts;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    statusCounts: query.data ?? { all: 0, pending: 0, in_review: 0, resolved: 0 },
    statusCountsLoading: query.isLoading,
    statusCountsError: query.error,
  };
}

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
      queryClient.invalidateQueries({ queryKey: ['incident-report-status-counts'] });
      queryClient.invalidateQueries({ queryKey: ['my-incident-report-status-counts'] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'all-incident-report-requests' || key === 'incident-report-severity-counts';
        },
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
      queryClient.invalidateQueries({ queryKey: ['incident-report'] });
      queryClient.invalidateQueries({ queryKey: ['incident-report', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['incident-report-status-counts'] });
      queryClient.invalidateQueries({ queryKey: ['my-incident-report-status-counts'] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'all-incident-report-requests' || key === 'incident-report-severity-counts';
        },
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
      queryClient.invalidateQueries({ queryKey: ['incident-report'] });
      queryClient.invalidateQueries({ queryKey: ['incident-report-status-counts'] });
      queryClient.invalidateQueries({ queryKey: ['my-incident-report-status-counts'] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'all-incident-report-requests' || key === 'incident-report-severity-counts';
        },
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
