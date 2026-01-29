/**
 * Job Dashboard comment sections: Mainland crews availability, Site notes, Island crew availability.
 * Backend: comments are attached to each day (not the week). In Weekly view with "Full week" we show
 * day tabs (Mon–Sun) so the user can view/edit comments per day.
 */
import type { Dayjs } from 'dayjs';
import { useState, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { useBoolean } from 'minimal-shared/hooks';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type CommentItem = {
  id: string;
  user: { name: string };
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

/** Day index 0 = Mon, 6 = Sun. Comments are attached per day (backend will key by day). */
type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type JobDashboardCommentSectionsProps = {
  /** When Weekly tab + Full week: show day tabs (Mon–Sun) beside comments so user can switch which day's comments to view. */
  viewTab?: string;
  weekStart?: Dayjs;
  /** null = Full week (show day tabs); 0–6 = specific day (show that day's comments only, no tabs). */
  selectedDay?: number | null;
};

// ----------------------------------------------------------------------

export function JobDashboardCommentSections({
  viewTab,
  weekStart,
  selectedDay = null,
}: JobDashboardCommentSectionsProps = {}) {
  const { user } = useAuthContext();
  const userName = user?.displayName ?? user?.email ?? 'Current User';

  const isWeeklyFullWeek = viewTab === 'weekly' && selectedDay === null && weekStart != null;
  const isWeeklySingleDay = viewTab === 'weekly' && selectedDay !== null && weekStart != null;
  /** When Weekly + Full week we use day tabs; when Weekly + single day we use selectedDay as the only day. */
  const effectiveDay: DayIndex = isWeeklySingleDay ? (selectedDay as DayIndex) : 0;

  const [selectedDayTab, setSelectedDayTab] = useState<DayIndex>(0);
  const currentDay: DayIndex = isWeeklyFullWeek ? selectedDayTab : effectiveDay;

  const [commentsBySection, setCommentsBySection] = useState<Record<SectionKey, CommentItem[]>>({
    mainland: [],
    site: [],
    island: [],
  });
  /** When Weekly: comments are keyed by day (0–6). Backend will attach comments to each day. */
  const [commentsByDayBySection, setCommentsByDayBySection] = useState<
    Record<DayIndex, Record<SectionKey, CommentItem[]>>
  >(() => {
    const empty = { mainland: [], site: [], island: [] } as Record<SectionKey, CommentItem[]>;
    return { 0: { ...empty }, 1: { ...empty }, 2: { ...empty }, 3: { ...empty }, 4: { ...empty }, 5: { ...empty }, 6: { ...empty } };
  });
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
  const [updating, setUpdating] = useState(false);
  const deleteCommentDialog = useBoolean();
  const [commentToDelete, setCommentToDelete] = useState<{
    sectionId: SectionKey;
    commentId: string;
    dayIndex?: DayIndex;
  } | null>(null);

  const showDayTabs = isWeeklyFullWeek;
  const dayTabLabels = useMemo(() => {
    if (!weekStart) return DAY_LABELS.map((label, i) => ({ value: i as DayIndex, label }));
    return DAY_LABELS.map((label, i) => ({
      value: i as DayIndex,
      label: `${label} ${weekStart.add(i, 'day').format('MMM D')}`,
    }));
  }, [weekStart]);

  const getCommentsForCurrentContext = useCallback(
    (sectionId: SectionKey): CommentItem[] => {
      if (viewTab === 'weekly' && weekStart != null) {
        return commentsByDayBySection[currentDay][sectionId] ?? [];
      }
      return commentsBySection[sectionId] ?? [];
    },
    [viewTab, weekStart, currentDay, commentsByDayBySection, commentsBySection]
  );

  const setCommentsForCurrentContext = useCallback(
    (sectionId: SectionKey, updater: (prev: CommentItem[]) => CommentItem[]) => {
      if (viewTab === 'weekly' && weekStart != null) {
        setCommentsByDayBySection((prev) => ({
          ...prev,
          [currentDay]: {
            ...prev[currentDay],
            [sectionId]: updater(prev[currentDay][sectionId] ?? []),
          },
        }));
      } else {
        setCommentsBySection((prev) => ({ ...prev, [sectionId]: updater(prev[sectionId] ?? []) }));
      }
    },
    [viewTab, weekStart, currentDay]
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
        const comment: CommentItem = {
          id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          user: { name: userName },
          description: text,
          posted_date: new Date().toISOString(),
        };
        setCommentsForCurrentContext(sectionId, (prev) => [comment, ...prev]);
        setNewCommentForCurrentContext(sectionId, '');
      } finally {
        setPostingSection(null);
      }
    },
    [getNewCommentForCurrentContext, setCommentsForCurrentContext, setNewCommentForCurrentContext, userName]
  );

  const handleStartEdit = useCallback((comment: CommentItem) => {
    setEditingCommentId(comment.id);
    setEditCommentInput(comment.description);
  }, []);

  const handleSaveEdit = useCallback(
    (sectionId: SectionKey, commentId: string) => {
      const text = editCommentInput.trim();
      if (!text) return;

      setUpdating(true);
      setCommentsForCurrentContext(sectionId, (prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, description: text, updated_at: new Date().toISOString() } : c
        )
      );
      setEditingCommentId(null);
      setEditCommentInput('');
      setUpdating(false);
    },
    [editCommentInput, setCommentsForCurrentContext]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditCommentInput('');
  }, []);

  const handleRequestDeleteComment = useCallback(
    (sectionId: SectionKey, commentId: string) => {
      setCommentToDelete(
        viewTab === 'weekly' && weekStart != null ? { sectionId, commentId, dayIndex: currentDay } : { sectionId, commentId }
      );
      deleteCommentDialog.onTrue();
    },
    [deleteCommentDialog, viewTab, weekStart, currentDay]
  );

  const handleConfirmDeleteComment = useCallback(() => {
    if (!commentToDelete) return;
    const { sectionId, commentId, dayIndex } = commentToDelete;
    if (viewTab === 'weekly' && weekStart != null && dayIndex != null) {
      setCommentsByDayBySection((prev) => ({
        ...prev,
        [dayIndex]: {
          ...prev[dayIndex],
          [sectionId]: (prev[dayIndex][sectionId] || []).filter((c) => c.id !== commentId),
        },
      }));
    } else {
      setCommentsBySection((prev) => ({
        ...prev,
        [sectionId]: (prev[sectionId] || []).filter((c) => c.id !== commentId),
      }));
    }
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
      setEditCommentInput('');
    }
    setCommentToDelete(null);
    deleteCommentDialog.onFalse();
  }, [commentToDelete, editingCommentId, deleteCommentDialog, viewTab, weekStart]);

  const getAvatarLetter = (name: string) => name?.trim().charAt(0).toUpperCase() || '?';

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
      {SECTIONS.map(({ id, title }) => (
        <Card key={id}>
          <Accordion
            disableGutters
            elevation={0}
            sx={{
              '&:before': { display: 'none' },
              '&.Mui-expanded': { mt: 0 },
            }}
          >
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={20} />}
              sx={{
                px: 2.5,
                '& .MuiAccordionSummary-content': { my: 2 },
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pt: 0, pb: 3 }}>
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
                            loading={updating}
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
            </AccordionDetails>
          </Accordion>
        </Card>
      ))}

      <ConfirmDialog
        open={deleteCommentDialog.value}
        onClose={() => {
          setCommentToDelete(null);
          deleteCommentDialog.onFalse();
        }}
        title="Delete comment"
        content="Are you sure you want to delete this comment? This cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDeleteComment}>
            Delete
          </Button>
        }
      />
    </Stack>
  );
}
