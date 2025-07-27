import type { StackProps } from '@mui/material/Stack';
import type { ISiteTableFilters } from 'src/types/site';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = StackProps & {
  filters: UseSetStateReturn<ISiteTableFilters>;
  totalResults: number;
  onResetPage: VoidFunction;
};

export function SiteTableFiltersResult({ filters, totalResults, onResetPage, sx, ...other }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ query: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveRegion = useCallback(
    (inputValue: string) => {
      const newValue = currentFilters.region.filter((item) => item !== inputValue);

      onResetPage();
      updateFilters({ region: newValue });
    },
    [currentFilters.region, onResetPage, updateFilters]
  );

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    updateFilters({ status: 'all' });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    updateFilters({
      query: '',
      region: [],
      status: 'all',
    });
  }, [onResetPage, updateFilters]);

  return (
    <Stack spacing={1.5} sx={sx} {...other}>
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

        {!!currentFilters.region.length && (
          <Block label="Region:">
            {currentFilters.region.map((item) => (
              <Chip
                key={item}
                label={item}
                size="small"
                onDelete={() => handleRemoveRegion(item)}
              />
            ))}
          </Block>
        )}

        {currentFilters.status !== 'all' && (
          <Block label="Status:">
            <Chip size="small" label={currentFilters.status} onDelete={handleRemoveStatus} />
          </Block>
        )}

        <Button
          color="error"
          onClick={handleReset}
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
      sx={{ p: 1, borderRadius: 1, bgcolor: 'unset' }}
    >
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {label}
      </Box>

      <Stack spacing={1} direction="row" flexWrap="wrap">
        {children}
      </Stack>
    </Stack>
  );
} 