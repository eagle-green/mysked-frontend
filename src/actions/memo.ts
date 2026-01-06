import type { IWideMemo } from 'src/types/memo';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { fetcher } from 'src/lib/axios';

const WIDE_MEMO_ENDPOINT = '/api/wide-memo';

export function useCreateWideMemoRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: IWideMemo) => {
      const response = await fetcher([
        WIDE_MEMO_ENDPOINT,
        {
          method: 'POST',
          data,
        },
      ]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wide-memo'] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'all-wide-memo-requests' || key === 'wide-memo-status-counts';
        },
      });
    },
  });
}

export function useUpdateWideMemoRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: IWideMemo }) => {
      const response = await fetcher([
        `${WIDE_MEMO_ENDPOINT}/${id}`,
        {
          method: 'PUT',
          data,
        },
      ]);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all incident report queries to refresh the list and detail pages
      queryClient.invalidateQueries({ queryKey: ['wide-memo'] });
      queryClient.invalidateQueries({ queryKey: ['wide-memo', variables.id] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'all-wide-memo-requests' || key === 'wide-memo-status-counts';
        },
      });
    },
  });
}

export function useCreateWideMemoComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      description,
      parent_id,
    }: {
      id: string;
      description: string;
      parent_id?: string;
    }) => {
      const response = await fetcher([
        `${WIDE_MEMO_ENDPOINT}/${id}/comments`,
        {
          method: 'POST',
          data: { description, parent_id },
        },
      ]);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wide-memo', variables.id] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'wide-memo' || key === 'all-wide-memo-requests';
        },
      });
    },
  });
}

export function useDeleteWideMemoRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetcher([
        `${WIDE_MEMO_ENDPOINT}/${id}`,
        {
          method: 'DELETE',
        },
      ]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wide-memo'] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'all-wide-memo-requests' || key === 'wide-memo-status-counts';
        },
      });
    },
  });
}
