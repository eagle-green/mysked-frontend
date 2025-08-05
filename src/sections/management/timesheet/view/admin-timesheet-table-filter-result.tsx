import React from 'react';
import { Stack, Typography, Chip, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { StatusType, statusColors } from './types';

interface TimesheetTableFilterResultProps {
  filteredCount: number;
  statusTab: 'All' | StatusType;
  onClearFilters: () => void;
}

export function TimesheetTableFilterResult({
  filteredCount,
  statusTab,
  onClearFilters,
}: TimesheetTableFilterResultProps) {
  return (
    <Stack direction="row" justifyContent="flex-start" alignItems="center" mb={2} spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {filteredCount} results found
      </Typography>
      {statusTab !== 'All' && (
        <Chip
          label={`Status: ${statusTab}`}
          size="small"
          sx={{
            fontWeight: 600,
            background: statusColors[statusTab].background,
            color: statusColors[statusTab].color,
          }}
        />
      )}
      <Button
        size="small"
        color="error"
        variant="text"
        startIcon={<DeleteIcon />}
        onClick={onClearFilters}
      >
        Clear
      </Button>
    </Stack>
  );
}