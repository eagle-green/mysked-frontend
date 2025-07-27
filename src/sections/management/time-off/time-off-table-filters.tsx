import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: any;
  onFilters: (name: string, value: string) => void;
  onResetFilters: VoidFunction;
  canReset: boolean;
  options: {
    types: any[];
  };
};

export function TimeOffTableFilters({ filters, onFilters, onResetFilters, canReset, options }: Props) {
  const { state: currentFilters } = filters;

  const handleTypeChange = useCallback(
    (type: string) => {
      const checked = currentFilters.type.includes(type);
      const newTypes = checked
        ? currentFilters.type.filter((t: string) => t !== type)
        : [...currentFilters.type, type];
      onFilters('type', newTypes);
    },
    [currentFilters.type, onFilters]
  );

  return (
    <Stack spacing={3} sx={{ p: 2.5 }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle2">Type</Typography>
        {options.types.map((type) => (
          <FormControlLabel
            key={type.value}
            control={
              <Checkbox
                checked={currentFilters.type.includes(type.value)}
                onChange={() => handleTypeChange(type.value)}
              />
            }
            label={type.label}
          />
        ))}
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack spacing={1.5}>
        <Typography variant="subtitle2">Actions</Typography>
        <Button
          fullWidth
          color="error"
          onClick={onResetFilters}
          disabled={!canReset}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear
        </Button>
      </Stack>
    </Stack>
  );
} 