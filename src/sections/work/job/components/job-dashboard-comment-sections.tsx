/**
 * Job Dashboard comment sections: Mainland crews availability, Site notes, Island crew availability.
 * Comments are attached to each day. In Weekly view with "Full week" we show day tabs (Mon–Sun).
 */
import type { Dayjs } from 'dayjs';

import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';

import { fDateTime } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

type CommentItem = {
  id: string;
  user: { name: string; photo_url?: string };
  description: string;
  posted_date: string;
  updated_at?: string;
};

type SectionKey = 'mainland' | 'site' | 'island';

const SECTIONS: { id: SectionKey; title: string }[] = [
  { id: 'mainland', title: 'Mainland crews availability' },
  { id: 'site', title: 'Site notes' },
  { id: 'island', title: 'Island crew availability' },
];

type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type JobDashboardCommentSectionsProps = {
  viewTab?: string;
  dashboardDate?: Dayjs;
  weekStart?: Dayjs;
  selectedDay?: number | null;
};

// ----------------------------------------------------------------------

export function JobDashboardCommentSections({
  viewTab,
  dashboardDate,
  weekStart,
  selectedDay = null,
}: JobDashboardCommentSectionsProps = {}) {
  const queryClient = useQueryClient();

  const isWeeklyFullWeek = viewTab === 'weekly' && selectedDay === null && weekStart != null;
  const isWeeklySingleDay = viewTab === 'weekly' && selectedDay !== null && weekStart != null;
  const effectiveDay: DayIndex = isWeeklySingleDay ? (selectedDay as DayIndex) : 0;

  const [selectedDayTab, setSelectedDayTab] = useState<DayIndex>(0);
  const currentDay: DayIndex = isWeeklyFullWeek ? selectedDayTab : effectiveDay;

  const effectiveDate = useMemo(() => {
    if (viewTab === 'weekly' && weekStart) {
      const dayIdx = selectedDay ?? selectedDayTab;
      return weekStart.add(dayIdx, 'day').format('YYYY-MM-DD');
    }
    return dashboardDate?.format('YYYY-MM-DD') ?? '';
  }, [viewTab, weekStart, selectedDay, selectedDayTab, dashboardDate]);

  const [newCommentBySection, setNewCommentBySection] = useState<Record<SectionKey, string>>({
    mainland: '',
    site: '',
    island: '',
  });
  const [newCommentByDayBySection, setNewCommentByDayBySection] = useState<
    Record<DayIndex, Record<SectionKey, string>>
  >(() => {
    const empty = { mainland: '', site: '', island: '' };
    return { 0: { ...empty }, 1: { ...empty }, 2: { ...empty }, 3: { ...empty }, 4: { ...empty }, 5: { ...empty }, 6: { ...empty } };
  });
  const [postingSection, setPostingSection] = useState<SectionKey | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentInput, setEditCommentInput] = useState('');
  const deleteCommentDialog = useBoolean();
  const [commentToDelete, setCommentToDelete] = useState<{
    sectionId: SectionKey;
    commentId: string;
  } | null>(null);

  const showDayTabs = isWeeklyFullWeek;
  const [selectedSectionTab, setSelectedSectionTab] = useState<SectionKey>('mainland');
  const dayTabLabels = useMemo(() => {
    if (!weekStart) return DAY_LABELS.map((label, i) => ({ value: i as DayIndex, label }));
    return DAY_LABELS.map((label, i) => ({
      value: i as DayIndex,
      label: `${label} ${weekStart.add(i, 'day').format('MMM D')}`,
    }));
  }, [weekStart]);

  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ['job-dashboard-comments', effectiveDate],
    queryFn: async () => {
      const res = await fetcher(
        `${endpoints.work.jobDashboard}/comments?date=${encodeURIComponent(effectiveDate)}`
      );
      return (res as { data: { mainland: CommentItem[]; site: CommentItem[]; island: CommentItem[] } }).data;
    },
    enabled: !!effectiveDate,
    staleTime: 60 * 1000,
  });

  const commentsBySection: Record<SectionKey, CommentItem[]> = useMemo(
    () =>
      commentsData ?? {
        mainland: [],
        site: [],
        island: [],
      },
    [commentsData]
  );

  const createCommentMutation = useMutation({
    mutationFn: async ({ section, description }: { section: SectionKey; description: string }) => {
      const res = await fetcher([
        `${endpoints.work.jobDashboard}/comments`,
        { method: 'POST', data: { date: effectiveDate, section, description } },
      ]);
      return (res as { data: CommentItem }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-dashboard-comments', effectiveDate] });
    },
    onError: (err: Error) => {
      toast.error(err?.message ?? 'Failed to post comment');
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, description }: { commentId: string; description: string }) => {
      const res = await fetcher([
        `${endpoints.work.jobDashboard}/comments/${commentId}`,
        { method: 'PUT', data: { description } },
      ]);
      return (res as { data: { comment: CommentItem } }).data.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-dashboard-comments', effectiveDate] });
    },
    onError: (err: Error) => {
      toast.error(err?.message ?? 'Failed to update comment');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await fetcher([
        `${endpoints.work.jobDashboard}/comments/${commentId}`,
        { method: 'DELETE' },
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-dashboard-comments', effectiveDate] });
    },
    onError: (err: Error) => {
      toast.error(err?.message ?? 'Failed to delete comment');
    },
  });

  const getCommentsForCurrentContext = useCallback(
    (sectionId: SectionKey): CommentItem[] => commentsBySection[sectionId] ?? [],
    [commentsBySection]
  );

  const getNewCommentForCurrentContext = useCallback(
    (sectionId: SectionKey): string => {
      if (viewTab === 'weekly' && weekStart != null) return newCommentByDayBySection[currentDay][sectionId] ?? '';
      return newCommentBySection[sectionId] ?? '';
    },
    [viewTab, weekStart, currentDay, newCommentByDayBySection, newCommentBySection]
  );

  const setNewCommentForCurrentContext = useCallback(
    (sectionId: SectionKey, value: string) => {
      if (viewTab === 'weekly' && weekStart != null) {
        setNewCommentByDayBySection((prev) => ({
          ...prev,
          [currentDay]: { ...prev[currentDay], [sectionId]: value },
        }));
      } else {
        setNewCommentBySection((prev) => ({ ...prev, [sectionId]: value }));
      }
    },
    [viewTab, weekStart, currentDay]
  );

  const handlePostComment = useCallback(
    async (sectionId: SectionKey) => {
      const text = getNewCommentForCurrentContext(sectionId)?.trim();
      if (!text) return;

      setPostingSection(sectionId);
      try {
        await createCommentMutation.mutateAsync({ section: sectionId, description: text });
        setNewCommentForCurrentContext(sectionId, '');
        toast.success('Comment posted');
      } finally {
        setPostingSection(null);
      }
    },
    [getNewCommentForCurrentContext, setNewCommentForCurrentContext, createCommentMutation]
  );

  const handleStartEdit = useCallback((comment: CommentItem) => {
    setEditingCommentId(comment.id);
    setEditCommentInput(comment.description);
  }, []);

  const handleSaveEdit = useCallback(
    async (sectionId: SectionKey, commentId: string) => {
      const text = editCommentInput.trim();
      if (!text) return;

      try {
        await updateCommentMutation.mutateAsync({ commentId, description: text });
        setEditingCommentId(null);
        setEditCommentInput('');
        toast.success('Comment updated');
      } catch {
        // Error already handled in mutation
      }
    },
    [editCommentInput, updateCommentMutation]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditCommentInput('');
  }, []);

  const handleRequestDeleteComment = useCallback(
    (sectionId: SectionKey, commentId: string) => {
      setCommentToDelete({ sectionId, commentId });
      deleteCommentDialog.onTrue();
    },
    [deleteCommentDialog]
  );

  const handleConfirmDeleteComment = useCallback(async () => {
    if (!commentToDelete) return;
    try {
      await deleteCommentMutation.mutateAsync(commentToDelete.commentId);
      if (editingCommentId === commentToDelete.commentId) {
        setEditingCommentId(null);
        setEditCommentInput('');
      }
      toast.success('Comment deleted');
    } catch {
      // Error already handled
    }
    setCommentToDelete(null);
    deleteCommentDialog.onFalse();
  }, [commentToDelete, editingCommentId, deleteCommentMutation, deleteCommentDialog]);

  const getAvatarLetter = (name: string) => name?.trim().charAt(0).toUpperCase() || '?';

  if (!effectiveDate) return null;

  return (
    <Stack spacing={3} sx={{ mt: 3 }}>
      {showDayTabs && (
        <Card sx={{ overflow: 'visible' }}>
          <Tabs
            value={selectedDayTab}
            onChange={(_, v: DayIndex) => setSelectedDayTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              pl: 2.5,
              pr: 1,
              minHeight: 48,
              '& .MuiTab-root': { minHeight: 48 },
            }}
          >
            {dayTabLabels.map(({ value, label }) => (
              <Tab key={value} value={value} label={label} />
            ))}
          </Tabs>
        </Card>
      )}

      <Card sx={{ mt: 3 }}>
        <Tabs
          value={selectedSectionTab}
          onChange={(_, v: SectionKey) => setSelectedSectionTab(v)}
          variant="fullWidth"
          sx={{
            borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
            px: 2,
            '& .MuiTab-root': { minHeight: 48 },
          }}
        >
          {SECTIONS.map(({ id, title }) => {
            const count = getCommentsForCurrentContext(id).length;
            return (
              <Tab
                key={id}
                value={id}
                label={
                  <Badge
                    badgeContent={count}
                    color="primary"
                    showZero={false}
                    sx={{ '& .MuiBadge-badge': { fontWeight: 600 } }}
                  >
                    <Box component="span" sx={{ pr: count > 0 ? 1.5 : 0 }}>
                      {title}
                    </Box>
                  </Badge>
                }
              />
            );
          })}
        </Tabs>
        <Box sx={{ px: 2.5, py: 3 }}>
          {isLoadingComments ? (
            <Typography variant="body2" color="text.secondary">
              Loading comments...
            </Typography>
          ) : (
            SECTIONS.map(({ id }) =>
              selectedSectionTab === id ? (
                <Box key={id}>
                  <Box
                    sx={{
                      borderBottom: (theme) => `solid 1px ${theme.vars.palette.divider}`,
                      pb: 3,
                      mb: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={getNewCommentForCurrentContext(id)}
                      onChange={(e) => setNewCommentForCurrentContext(id, e.target.value)}
                      placeholder="Write some of your comments..."
                      slotProps={{ input: { name: `comment-${id}` } }}
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <LoadingButton
                        variant="contained"
                        disabled={!getNewCommentForCurrentContext(id)?.trim()}
                        loading={postingSection === id}
                        onClick={() => handlePostComment(id)}
                      >
                        Post comment
                      </LoadingButton>
                    </Box>
                  </Box>

                  {getCommentsForCurrentContext(id).map((comment) => (
                    <Box
                      key={comment.id}
                      sx={{
                        pt: 2,
                        gap: 2,
                        display: 'flex',
                        position: 'relative',
                        pb: 2,
                        borderBottom: (theme) => `solid 1px ${theme.vars.palette.divider}`,
                      }}
                    >
                      <Avatar
                        src={comment.user?.photo_url ?? undefined}
                        alt={comment.user?.name}
                        sx={{ width: 48, height: 48, flexShrink: 0 }}
                      >
                        {getAvatarLetter(comment.user?.name ?? '')}
                      </Avatar>
                      <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                          {comment.user?.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                          {fDateTime(comment.posted_date)}
                        </Typography>
                        {comment.updated_at && comment.updated_at !== comment.posted_date && (
                          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                            Edited {fDateTime(comment.updated_at)}
                          </Typography>
                        )}
                        {editingCommentId === comment.id ? (
                          <Stack spacing={1.5} sx={{ mt: 1 }}>
                            <TextField
                              multiline
                              minRows={2}
                              value={editCommentInput}
                              onChange={(e) => setEditCommentInput(e.target.value)}
                              fullWidth
                              variant="outlined"
                              size="small"
                            />
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="outlined" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                              <LoadingButton
                                size="small"
                                variant="contained"
                                loading={updateCommentMutation.isPending}
                                disabled={!editCommentInput.trim()}
                                onClick={() => handleSaveEdit(id, comment.id)}
                              >
                                Save
                              </LoadingButton>
                            </Stack>
                          </Stack>
                        ) : (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {comment.description}
                          </Typography>
                        )}
                      </Box>
                      {editingCommentId !== comment.id && (
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleStartEdit(comment)}
                            aria-label="Edit comment"
                          >
                            <Iconify icon="solar:pen-bold" width={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRequestDeleteComment(id, comment.id)}
                            aria-label="Delete comment"
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : null
            )
          )}
        </Box>
      </Card>

      <ConfirmDialog
        open={deleteCommentDialog.value}
        onClose={() => {
          setCommentToDelete(null);
          deleteCommentDialog.onFalse();
        }}
        title="Delete comment"
        content="Are you sure you want to delete this comment? This cannot be undone."
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteComment}
            disabled={deleteCommentMutation.isPending}
          >
            Delete
          </Button>
        }
      />
    </Stack>
  );
}
