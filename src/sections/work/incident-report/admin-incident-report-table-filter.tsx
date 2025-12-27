import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify/iconify';
import { chipProps } from 'src/components/filters-result/filters-result';

//-------------------------------------------------------------------------
type Props = {
  filters: any;
  totalResults: number;
  onResetPage: VoidFunction;
  sx?: any;
};
export function AdminIncidentReportTableFilterResult({
  filters,
  totalResults,
  onResetPage,
  sx,
}: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    updateFilters({ query: '' });
    onResetPage();
  }, [updateFilters, onResetPage]);

  const handleRemoveType = useCallback(
    (type: string) => {
      const newTypes = currentFilters.type.filter((t: string) => t !== type);
      updateFilters({ type: newTypes });
      onResetPage();
    },
    [currentFilters.type, updateFilters, onResetPage]
  );

  const hasFilters = !!currentFilters.query || currentFilters.type.length > 0;

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
            <Chip {...chipProps} label={currentFilters.query} onDelete={handleRemoveKeyword} />
          </Block>
        )}

        {!!currentFilters.type.length && (
          <Block label="Type:">
            {currentFilters.type.map((type: string) => (
              <Chip key={type} {...chipProps} label={type} onDelete={() => handleRemoveType(type)} />
            ))}
          </Block>
        )}

        <Button
          color="error"
          onClick={() => {
            updateFilters({ query: '', type: [] });
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
