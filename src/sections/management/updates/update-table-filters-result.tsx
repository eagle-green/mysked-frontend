import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: any;
  totalResults: number;
  onResetPage: () => void;
  sx?: any;
};

export function UpdateTableFiltersResult({ filters, totalResults, onResetPage, sx }: Props) {
  const { state: currentFilters } = filters;

  const handleFilters = useCallback(
    (name: string, value: string) => {
      onResetPage();
      filters.setState({ [name]: value });
    },
    [filters, onResetPage]
  );

  const handleRemoveQuery = useCallback(() => {
    handleFilters('query', '');
  }, [handleFilters]);

  const handleRemoveCategory = useCallback(() => {
    handleFilters('category', 'all');
  }, [handleFilters]);

  const canReset = !!currentFilters.query || currentFilters.category !== 'all';

  if (!canReset) {
    return null;
  }

  return (
    <Box sx={{ ...sx }}>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Found {totalResults} update{totalResults > 1 ? 's' : ''}
        </Typography>

        {!!currentFilters.query && (
          <Chip
            size="small"
            label={`Search: ${currentFilters.query}`}
            onDelete={handleRemoveQuery}
            deleteIcon={<Iconify icon="solar:close-circle-bold" />}
          />
        )}

        {currentFilters.category !== 'all' && (
          <Chip
            size="small"
            label={`Category: ${currentFilters.category}`}
            onDelete={handleRemoveCategory}
            deleteIcon={<Iconify icon="solar:close-circle-bold" />}
          />
        )}

        <Button
          color="error"
          size="small"
          onClick={() => {
            handleFilters('query', '');
            handleFilters('category', 'all');
          }}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear All
        </Button>
      </Stack>
    </Box>
  );
}
