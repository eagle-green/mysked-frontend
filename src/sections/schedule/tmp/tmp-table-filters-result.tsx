import type { IJobTableFilters } from 'src/types/job';
import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IJobTableFilters;
  totalResults: number;
  onResetFilters: () => void;
  sx?: SxProps<Theme>;
};

export function TmpTableFiltersResult({ filters, totalResults, onResetFilters, sx }: Props) {
  return (
    <Box sx={sx}>
      <Box sx={{ mb: 1.5, typography: 'body2' }}>
        <strong>{totalResults}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          results found
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {filters.query && (
          <Chip
            size="small"
            label={`Search: ${filters.query}`}
            onDelete={() => onResetFilters()}
          />
        )}

        <Button
          color="error"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear All
        </Button>
      </Box>
    </Box>
  );
}


