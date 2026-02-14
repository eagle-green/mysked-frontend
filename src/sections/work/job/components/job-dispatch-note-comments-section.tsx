import type { Dayjs } from 'dayjs';

import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
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

const SECTIONS: { id: SectionKey; title: string; icon: 'solar:home-bold' | 'solar:notes-bold' | 'solar:flag-bold'; color: string }[] = [
  { id: 'mainland', title: 'Mainland', icon: 'solar:home-bold', color: 'primary' },
  { id: 'site', title: 'Site Notes', icon: 'solar:notes-bold', color: 'warning' },
  { id: 'island', title: 'Island', icon: 'solar:flag-bold', color: 'success' },
];

type Props = {
  selectedDate: Dayjs;
};

export function JobDispatchNoteCommentsSection({ selectedDate }: Props) {
  const queryClient = useQueryClient();

  const [selectedSection, setSelectedSection] = useState<SectionKey>('site');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentInput, setEditCommentInput] = useState('');
  const deleteDialog = useBoolean();
  const [commentToDelete, setCommentToDelete] = useState<{
    sectionId: SectionKey;
    commentId: string;
  } | null>(null);

  const effectiveDate = selectedDate.format('YYYY-MM-DD');

  // Fetch comments
  const { data: commentsData, isLoading } = useQuery({
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

  const commentsBySection: Record<SectionKey, CommentItem[]> = useMemo(() => {
    if (!commentsData) {
      return {
        mainland: [],
        site: [],
        island: [],
      };
    }
    
    // Sort comments by posted_date descending (newest first)
    return {
      mainland: [...commentsData.mainland].sort((a, b) => 
        new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
      ),
      site: [...commentsData.site].sort((a, b) => 
        new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
      ),
      island: [...commentsData.island].sort((a, b) => 
        new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
      ),
    };
  }, [commentsData]);

  // Create comment mutation
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
      setNewComment('');
      toast.success('Comment posted');
    },
    onError: (err: Error) => {
      toast.error(err?.message ?? 'Failed to post comment');
    },
  });

  // Update comment mutation
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
      setEditingCommentId(null);
      setEditCommentInput('');
      toast.success('Comment updated');
    },
    onError: (err: Error) => {
      toast.error(err?.message ?? 'Failed to update comment');
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await fetcher([
        `${endpoints.work.jobDashboard}/comments/${commentId}`,
        { method: 'DELETE' },
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-dashboard-comments', effectiveDate] });
      toast.success('Comment deleted');
    },
    onError: (err: Error) => {
      toast.error(err?.message ?? 'Failed to delete comment');
    },
  });

  const handlePostComment = useCallback(async () => {
    const text = newComment.trim();
    if (!text) return;

    try {
      await createCommentMutation.mutateAsync({ section: selectedSection, description: text });
    } catch {
      // Error handled in mutation
    }
  }, [newComment, selectedSection, createCommentMutation]);

  const handleStartEdit = useCallback((comment: CommentItem) => {
    setEditingCommentId(comment.id);
    setEditCommentInput(comment.description);
  }, []);

  const handleSaveEdit = useCallback(
    async (commentId: string) => {
      const text = editCommentInput.trim();
      if (!text) return;

      try {
        await updateCommentMutation.mutateAsync({ commentId, description: text });
      } catch {
        // Error handled in mutation
      }
    },
    [editCommentInput, updateCommentMutation]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditCommentInput('');
  }, []);

  const handleRequestDelete = useCallback(
    (sectionId: SectionKey, commentId: string) => {
      setCommentToDelete({ sectionId, commentId });
      deleteDialog.onTrue();
    },
    [deleteDialog]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!commentToDelete) return;
    try {
      await deleteCommentMutation.mutateAsync(commentToDelete.commentId);
      if (editingCommentId === commentToDelete.commentId) {
        setEditingCommentId(null);
        setEditCommentInput('');
      }
    } catch {
      // Error handled
    }
    setCommentToDelete(null);
    deleteDialog.onFalse();
  }, [commentToDelete, editingCommentId, deleteCommentMutation, deleteDialog]);

  const getAvatarLetter = (name: string) => name?.trim().charAt(0).toUpperCase() || '?';

  const currentComments = commentsBySection[selectedSection] || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Section Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={selectedSection}
          onChange={(_, v: SectionKey) => setSelectedSection(v)}
          variant="fullWidth"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: '0.875rem',
              fontWeight: 600,
            },
          }}
        >
          {SECTIONS.map(({ id, title, icon, color }) => (
            <Tab
              key={id}
              value={id}
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify icon={icon as any} width={18} />
                  <span>{title}</span>
                  {commentsBySection[id]?.length > 0 && (
                    <Chip
                      label={commentsBySection[id].length}
                      size="small"
                      color={color as any}
                      sx={{ height: 18, minWidth: 18, fontSize: '0.625rem' }}
                    />
                  )}
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* New Comment Input */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack spacing={1}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder={`Add a ${SECTIONS.find((s) => s.id === selectedSection)?.title.toLowerCase()} note...`}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <LoadingButton
              variant="contained"
              size="small"
              disabled={!newComment.trim()}
              loading={createCommentMutation.isPending}
              onClick={handlePostComment}
              startIcon={<Iconify icon="solar:add-circle-bold" />}
            >
              Post
            </LoadingButton>
          </Box>
        </Stack>
      </Box>

      {/* Comments List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {isLoading ? (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Loading comments...
          </Typography>
        ) : currentComments.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              color: 'text.secondary',
            }}
          >
            <Iconify
              icon="solar:chat-round-dots-bold"
              width={64}
              sx={{ opacity: 0.3, mb: 2 }}
            />
            <Typography variant="body2">No comments yet</Typography>
            <Typography variant="caption">Be the first to add a note</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {currentComments.map((comment) => (
              <Box
                key={comment.id}
                sx={{
                  position: 'relative',
                  borderRadius: 1.5,
                  bgcolor: 'background.neutral',
                  p: 1.5,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    boxShadow: 1,
                  },
                }}
              >
                <Stack direction="row" spacing={1.5}>
                  <Avatar
                    src={comment.user?.photo_url ?? undefined}
                    alt={comment.user?.name}
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                  >
                    {getAvatarLetter(comment.user?.name ?? '')}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="subtitle2" noWrap>
                        {comment.user?.name}
                      </Typography>
                      {editingCommentId !== comment.id && (
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => handleStartEdit(comment)}
                            sx={{ width: 28, height: 28 }}
                          >
                            <Iconify icon="solar:pen-bold" width={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRequestDelete(selectedSection, comment.id)}
                            sx={{ width: 28, height: 28 }}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                          </IconButton>
                        </Stack>
                      )}
                    </Stack>

                    <Typography
                      variant="caption"
                      sx={{ color: 'text.disabled', display: 'block', mb: 1 }}
                    >
                      {fDateTime(comment.posted_date)}
                      {comment.updated_at && comment.updated_at !== comment.posted_date && (
                        <> • Edited</>
                      )}
                    </Typography>

                    {editingCommentId === comment.id ? (
                      <Stack spacing={1}>
                        <TextField
                          multiline
                          minRows={2}
                          value={editCommentInput}
                          onChange={(e) => setEditCommentInput(e.target.value)}
                          fullWidth
                          size="small"
                          autoFocus
                          slotProps={{
                            input: {
                              onFocus: (e) => {
                                // Move cursor to end of text
                                const length = e.target.value.length;
                                e.target.setSelectionRange(length, length);
                              },
                            },
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontSize: '0.875rem',
                            },
                          }}
                        />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="outlined" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                          <LoadingButton
                            size="small"
                            variant="contained"
                            loading={updateCommentMutation.isPending}
                            disabled={!editCommentInput.trim()}
                            onClick={() => handleSaveEdit(comment.id)}
                          >
                            Save
                          </LoadingButton>
                        </Stack>
                      </Stack>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {comment.description}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.value}
        onClose={() => {
          setCommentToDelete(null);
          deleteDialog.onFalse();
        }}
        title="Delete comment"
        content="Are you sure you want to delete this comment? This action cannot be undone."
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteCommentMutation.isPending}
          >
            Delete
          </Button>
        }
      />
    </Box>
  );
}
