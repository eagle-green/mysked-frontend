import { useCallback } from 'react';

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

export function UpdateTableToolbar({ filters, onResetPage }: Props) {
  const { state: currentFilters } = filters;

  const handleFilters = useCallback(
    (name: string, value: string) => {
      onResetPage();
      filters.setState({ [name]: value });
    },
    [filters, onResetPage]
  );

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
        value={currentFilters.query}
        onChange={(event) => handleFilters('query', event.target.value)}
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
