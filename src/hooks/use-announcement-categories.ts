import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetcher } from 'src/lib/axios';

// ----------------------------------------------------------------------

export interface AnnouncementCategory {
  id: string;
  name: string;
  color: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const queryKey = ['announcement-categories'];

export function useAnnouncementCategories() {
  const queryClient = useQueryClient();

  const { data = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<AnnouncementCategory[]> => {
      const res = await fetcher('/api/announcement-categories');
      return res?.categories ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const res = await fetcher([
        '/api/announcement-categories',
        { method: 'POST', data: { name: name.trim(), color: color || null } },
      ]);
      return res?.category as AnnouncementCategory;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color?: string | null }) => {
      const res = await fetcher([
        `/api/announcement-categories/${id}`,
        { method: 'PUT', data: { name: name.trim(), color: color || null } },
      ]);
      return res?.category as AnnouncementCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // Also invalidate announcements since category names are stored in announcements
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetcher([`/api/announcement-categories/${id}`, { method: 'DELETE' }]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    categories: data,
    loading: isLoading,
    refetch,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
