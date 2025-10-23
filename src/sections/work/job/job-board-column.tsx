import type { IJob } from 'src/types/job';
import type { Theme, SxProps } from '@mui/material/styles';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
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
};

export function JobBoardColumn({ column, jobs, disabled, fullWidth, viewMode = 'day', sx }: Props) {
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
          flex: '1 1 auto',
          display: fullWidth ? 'grid' : 'flex',
          ...(fullWidth && {
            gridTemplateColumns: 'repeat(auto-fill, 350px)',
            justifyContent: 'start',
            gridAutoFlow: 'row',
          }),
          overflowY: 'auto',
          overflowX: 'auto',
          flexDirection: 'column',
          ...theme.mixins.hideScrollY,
        }}
      >
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
      </Box>
    </Card>
  );
}



