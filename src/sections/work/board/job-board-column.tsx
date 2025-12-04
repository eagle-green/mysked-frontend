import type { IJob } from 'src/types/job';
import type { Theme, SxProps } from '@mui/material/styles';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Label } from 'src/components/label';

import { JobBoardCard } from './job-board-card';

// ----------------------------------------------------------------------

type BoardColumn = {
  id: string;
  name: string;
  date: Date;
};

type Props = {
  sx?: SxProps<Theme>;
  column: BoardColumn;
  jobs: IJob[];
  disabled?: boolean;
  fullWidth?: boolean;
  viewMode?: 'day' | 'week';
  isLoading?: boolean;
};

export function JobBoardColumn({ column, jobs, disabled, fullWidth, viewMode = 'day', isLoading = false, sx }: Props) {
  const theme = useTheme();

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'container', children: jobs },
  });

  // Parse the column name to extract day name, date and label
  const parseColumnName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 3) {
      const dayName = parts[0]; // "Monday"
      const datePart = parts.slice(1, 3).join(' '); // "Oct 22"
      const labelPart = parts.slice(3).join(' '); // "Today" or "Tomorrow"
      return { dayName, date: datePart, label: labelPart };
    } else if (parts.length >= 2) {
      const dayName = parts[0]; // "Monday"
      const datePart = parts.slice(1).join(' '); // "Oct 22"
      return { dayName, date: datePart, label: '' };
    }
    return { dayName: name, date: '', label: '' };
  };

  return (
    <Card
      ref={setNodeRef}
      sx={{
        ...(fullWidth ? {
          flex: '0 0 auto',
          width: '100%',
          minWidth: '100%',
        } : {
          minWidth: 320,
          width: 320,
          flexShrink: 0,
        }),
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.neutral',
        transition: theme.transitions.create(['box-shadow', 'bgcolor']),
        ...(isOver && {
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          boxShadow: theme.customShadows.z8,
        }),
        ...sx,
      }}
    >
      <Stack
        spacing={1}
        sx={{
          p: 2,
          borderBottom: `1px dashed ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h6">{parseColumnName(column.name).dayName}</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {parseColumnName(column.name).date}
              </Typography>
              {parseColumnName(column.name).label && (
                <Label 
                  variant="soft" 
                  color={parseColumnName(column.name).label === 'Today' ? 'success' : 'warning'}
                  sx={{ fontSize: '0.75rem', px: 1, py: 0.25 }}
                >
                  {parseColumnName(column.name).label}
                </Label>
              )}
            </Stack>
          </Stack>
          <Badge badgeContent={jobs.length} color="primary" />
        </Stack>
      </Stack>

      <Box
        sx={{
          p: 2,
          gap: 2,
          ...(fullWidth ? {
            // Day view: Allow natural expansion, no scrolling
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 350px)',
            justifyContent: 'start',
            gridAutoFlow: 'row',
          } : {
            // Week view: Enable scrolling with flex
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'auto',
            ...theme.mixins.hideScrollY,
          }),
        }}
      >
        {isLoading ? (
          // Skeleton loading cards
          Array.from({ length: 3 }).map((_, index) => (
            <Card
              key={`skeleton-${index}`}
              sx={{
                p: 2,
                width: viewMode === 'day' ? 350 : 290,
                minWidth: viewMode === 'day' ? 350 : 290,
                maxWidth: viewMode === 'day' ? 350 : 290,
                flexShrink: 0,
                ...(fullWidth ? {} : { mb: 2 }),
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton variant="text" width="30%" height={24} />
                  <Skeleton variant="circular" width={20} height={20} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                </Box>
                <Box>
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="90%" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Skeleton variant="text" width="20%" />
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width="40%" />
                </Box>
              </Stack>
            </Card>
          ))
        ) : (
          <>
            <SortableContext items={jobs.map((job) => job.id)} strategy={verticalListSortingStrategy}>
              {jobs.map((job) => (
                <JobBoardCard key={job.id} job={job} disabled={disabled} viewMode={viewMode} />
              ))}
            </SortableContext>

            {jobs.length === 0 && (
              <Box
                sx={{
                  py: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.disabled',
                }}
              >
                <Typography variant="body2">No jobs scheduled</Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Card>
  );
}



