import type { Dayjs } from 'dayjs';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

import { JobDispatchNoteCommentsSection } from './job-dispatch-note-comments-section';

// ----------------------------------------------------------------------

type CommentItem = {
  id: string;
  user: { name: string; photo_url?: string };
  description: string;
  posted_date: string;
  updated_at?: string;
};

type Props = {
  selectedDate: Dayjs;
};

export function JobDispatchNoteCommentsDrawer({ selectedDate }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const effectiveDate = selectedDate.format('YYYY-MM-DD');

  // Fetch comments to get counts
  const { data: commentsData } = useQuery({
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

  // Calculate total comment count
  const totalComments = useMemo(() => {
    if (!commentsData) return 0;
    return (
      (commentsData.mainland?.length || 0) +
      (commentsData.site?.length || 0) +
      (commentsData.island?.length || 0)
    );
  }, [commentsData]);

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <Box
        sx={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: theme.zIndex.drawer - 1,
        }}
      >
        <Tooltip title="Comments" placement="left">
          <IconButton
            onClick={handleToggle}
            sx={{
              width: 48,
              height: 64,
              borderRadius: '8px 0 0 8px',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: theme.shadows[8],
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            <Badge 
              badgeContent={totalComments} 
              color="error" 
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  fontWeight: 600,
                  fontSize: '0.75rem',
                },
              }}
            >
              <Iconify icon="solar:chat-round-dots-bold" width={24} />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: {
              xs: '100%',
              sm: 420,
              md: 480,
            },
            p: 0,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:chat-round-dots-bold" width={24} />
            <Box>
              <Box sx={{ fontWeight: 600, fontSize: '1rem' }}>Comments</Box>
              <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {selectedDate.format('MMMM D, YYYY')}
              </Box>
            </Box>
          </Box>
          <IconButton onClick={handleClose}>
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ height: 'calc(100vh - 73px)', display: 'flex', flexDirection: 'column' }}>
          <JobDispatchNoteCommentsSection selectedDate={selectedDate} />
        </Box>
      </Drawer>
    </>
  );
}
