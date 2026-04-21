import dayjs from 'dayjs';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { getRoleLabel } from 'src/utils/format-role';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: any;
  totalResults: number;
  onResetPage: VoidFunction;
  sx?: any;
};

export function NewEmployeeTableToolbarResult({ filters, totalResults, onResetPage, sx }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    updateFilters({ query: '' });
    onResetPage();
  }, [updateFilters, onResetPage]);

  const handleRemovePosition = useCallback(
    (value: string) => {
      const next = currentFilters.position.filter((p: string) => p !== value);
      updateFilters({ position: next });
      onResetPage();
    },
    [currentFilters.position, updateFilters, onResetPage]
  );

  const handleRemoveStartDate = useCallback(() => {
    updateFilters({ startDate: null });
    onResetPage();
  }, [updateFilters, onResetPage]);

  const handleRemoveEndDate = useCallback(() => {
    updateFilters({ endDate: null });
    onResetPage();
  }, [updateFilters, onResetPage]);

  const hasFilters = !!(
    currentFilters.query ||
    currentFilters.position.length > 0 ||
    currentFilters.startDate ||
    currentFilters.endDate
  );

  if (!hasFilters) {
    return null;
  }

  return (
    <Stack spacing={1.5} sx={{ ...sx }}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{totalResults}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          results found
        </Box>
      </Box>

      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {!!currentFilters.query && (
          <Block label="Keyword:">
            <Chip size="small" label={currentFilters.query} onDelete={handleRemoveKeyword} />
          </Block>
        )}

        {!!currentFilters.position.length && (
          <Block label="Position:">
            {currentFilters.position.map((value: string) => (
              <Chip
                key={value}
                label={getRoleLabel(value) || value}
                size="small"
                onDelete={() => handleRemovePosition(value)}
              />
            ))}
          </Block>
        )}

        {currentFilters.startDate && (
          <Block label="Hire date from:">
            <Chip
              size="small"
              label={dayjs(currentFilters.startDate).format('MMM D, YYYY')}
              onDelete={handleRemoveStartDate}
            />
          </Block>
        )}

        {currentFilters.endDate && (
          <Block label="Hire date to:">
            <Chip
              size="small"
              label={dayjs(currentFilters.endDate).format('MMM D, YYYY')}
              onDelete={handleRemoveEndDate}
            />
          </Block>
        )}

        <Button
          color="error"
          onClick={() => {
            updateFilters({
              query: '',
              position: [],
              startDate: null,
              endDate: null,
            });
            onResetPage();
          }}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear
        </Button>
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------

type BlockProps = {
  label: string;
  children: React.ReactNode;
};

function Block({ label, children }: BlockProps) {
  return (
    <Stack
      component={Paper}
      variant="outlined"
      spacing={1}
      direction="row"
      sx={{
        p: 1,
        borderRadius: 1,
        overflow: 'hidden',
        borderStyle: 'dashed',
      }}
    >
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {label}
      </Box>

      <Stack spacing={0.5} direction="row" flexWrap="wrap">
        {children}
      </Stack>
    </Stack>
  );
}
