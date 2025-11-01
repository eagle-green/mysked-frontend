import { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: any;
  onResetPage: () => void;
};

function UpdateTableToolbarComponent({ filters, onResetPage }: Props) {
  const { state: currentFilters } = filters;
  const [query, setQuery] = useState<string>(currentFilters.query || '');

  // Sync local query with filters when filters change externally (e.g., reset)
  useEffect(() => {
    setQuery(currentFilters.query || '');
  }, [currentFilters.query]);

  // Debounce parent filter updates to prevent re-renders on every keystroke
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== currentFilters.query) {
        onResetPage();
        filters.setState({ query });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, currentFilters.query, filters, onResetPage]);

  const handleResetFilters = useCallback(() => {
    filters.setState({ query: '', category: 'all' });
    onResetPage();
  }, [filters, onResetPage]);

  const canReset = !!currentFilters.query || currentFilters.category !== 'all';

  return (
    <Box
      sx={{
        py: 2.5,
        px: 3,
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <TextField
        size="small"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search updates..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
        sx={{ width: { xs: 1, sm: 'auto' } }}
      />

      <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
        {canReset && (
          <Button
            color="error"
            onClick={handleResetFilters}
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          >
            Clear
          </Button>
        )}
      </Stack>
    </Box>
  );
}

export const UpdateTableToolbar = memo(UpdateTableToolbarComponent);
