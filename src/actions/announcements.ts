import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetcher } from 'src/lib/axios';

const USERS_NOTIFICATIONS = '/api/users/notifications';

export const endpoints = {
  announcements: {
    list: '/api/announcements',
    details: (id: string) => `/api/announcements/${id}`,
    create: '/api/announcements',
    update: (id: string) => `/api/announcements/${id}`,
    delete: (id: string) => `/api/announcements/${id}`,
    tracking: (id: string) => `/api/announcements/tracking/${id}`,
    recipients: (id: string) => `/api/announcements/${id}/recipients`,
    status: (id: string) => `/api/announcements/${id}/status`,
    statusHistory: (id: string) => `/api/announcements/${id}/status-history`,
  },
};

export type UserForAnnouncement = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  photo_url?: string | null;
  role?: string;
};

export function useGetUsersForAnnouncements() {
  return useQuery({
    queryKey: ['users-for-announcements'],
    queryFn: async () => {
      const response = await fetcher(USERS_NOTIFICATIONS);
      return (response.data?.users ?? []) as UserForAnnouncement[];
    },
    retry: false,
  });
}

export type AnnouncementsScope = 'all' | 'recipient';

export function useGetAnnouncements(options?: { scope?: AnnouncementsScope }) {
  const scope = options?.scope ?? 'all';
  return useQuery({
    queryKey: ['announcements', scope],
    queryFn: async () => {
      const config = scope === 'recipient' ? { params: { scope: 'recipient' } } : undefined;
      const response = await fetcher(
        config ? [endpoints.announcements.list, config] : endpoints.announcements.list
      );
      return response.data.announcements;
    },
    retry: false,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes to avoid refetching on every layout render
  });
}

/** Unread count for current user (announcements they are recipient of and have not read). Used for nav badge. */
export function useUnreadAnnouncementsCount(): number {
  const { data: announcements = [] } = useGetAnnouncements({ scope: 'recipient' });
  return (announcements as { recipientStatus?: { readAt?: string | null } }[]).filter(
    (a) => a.recipientStatus != null && !a.recipientStatus.readAt
  ).length;
}

export function useGetAnnouncement(id: string) {
  return useQuery({
    queryKey: ['announcement', id],
    queryFn: async () => {
      const response = await fetcher(endpoints.announcements.details(id));
      return response.data.announcement;
    },
    enabled: !!id,
  });
}

export const useGetAnnouncementById = useGetAnnouncement;

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetcher([endpoints.announcements.create, { method: 'POST', data }]);
      return response.data.announcement;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetcher([endpoints.announcements.update(id), { method: 'PUT', data }]);
      return response.data.announcement;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetcher([endpoints.announcements.delete(id), { method: 'DELETE' }]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export type AnnouncementTrackingItem = {
  userId: string;
  userName: string;
  userEmail: string | null;
  userAvatar: string | null;
  userRole: string | null;
  sentAt: string | null;
  readAt: string | null;
  signedAt: string | null;
  signatureData: unknown;
};

export function useGetAnnouncementTracking(announcementId: string, enabled = true) {
  return useQuery({
    queryKey: ['announcement-tracking', announcementId],
    queryFn: async () => {
      const response = await fetcher(endpoints.announcements.tracking(announcementId));
      return (response.data?.tracking ?? []) as AnnouncementTrackingItem[];
    },
    enabled: !!announcementId && enabled,
    retry: false,
  });
}

export function useMarkAnnouncementAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (announcementId: string) => {
      await fetcher([`/api/announcements/${announcementId}/read`, { method: 'POST' }]);
    },
    onSuccess: (_, announcementId) => {
      queryClient.invalidateQueries({ queryKey: ['announcement', announcementId] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useSignAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, signatureData }: { id: string; signatureData?: unknown }) => {
      await fetcher([`/api/announcements/${id}/sign`, { method: 'POST', data: { signatureData: signatureData ?? null } }]);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
      queryClient.invalidateQueries({ queryKey: ['announcement-tracking', id] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useResendOrAddRecipients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, recipientUserIds }: { id: string; recipientUserIds: string[] }) => {
      const data = await fetcher([
        endpoints.announcements.recipients(id),
        { method: 'POST', data: { recipientUserIds } },
      ]);
      // fetcher returns the parsed response body directly: { message, results }
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['announcement-tracking', id] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useChangeAnnouncementStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const data = await fetcher([
        endpoints.announcements.status(id),
        { method: 'PATCH', data: { status, reason } },
      ]);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-status-history', id] });
    },
  });
}

export function useGetAnnouncementStatusHistory(id: string) {
  return useQuery({
    queryKey: ['announcement-status-history', id],
    queryFn: async () => {
      const response = await fetcher(endpoints.announcements.statusHistory(id));
      return response.data.history;
    },
    enabled: !!id,
  });
}
