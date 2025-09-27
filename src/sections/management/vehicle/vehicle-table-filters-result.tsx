import type { IVehicleTableFilters } from 'src/types/vehicle';
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  onResetPage: () => void;
  filters: UseSetStateReturn<IVehicleTableFilters>;
};

export function VehicleTableFiltersResult({ filters, onResetPage, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ query: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    updateFilters({ status: 'all' });
  }, [onResetPage, updateFilters]);

  const handleRemoveRegion = useCallback(
    (inputValue: string) => {
      const newValue = currentFilters.region.filter((item) => item !== inputValue);

      onResetPage();
      updateFilters({ region: newValue });
    },
    [onResetPage, updateFilters, currentFilters.region]
  );

  const handleRemoveType = useCallback(
    (inputValue: string) => {
      const newValue = currentFilters.type.filter((item) => item !== inputValue);

      onResetPage();
      updateFilters({ type: newValue });
    },
    [onResetPage, updateFilters, currentFilters.type]
  );

  const handleReset = useCallback(() => {
    onResetPage();
    updateFilters({
      query: '',
      type: [],
      status: 'all',
    });
  }, [onResetPage, updateFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Status:" isShow={currentFilters.status !== 'all'}>
        <Chip
          {...chipProps}
          label={currentFilters.status}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock label="Region:" isShow={!!currentFilters.region.length}>
        {currentFilters.region.map((item) => (
          <Chip {...chipProps} key={item} label={item} onDelete={() => handleRemoveRegion(item)} />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Type:" isShow={!!currentFilters.type.length}>
        {currentFilters.type.map((item) => {
          const typeOption = VEHICLE_TYPE_OPTIONS.find((option) => option.value === item);
          return (
            <Chip
              {...chipProps}
              key={item}
              label={typeOption?.label || item}
              onDelete={() => handleRemoveType(item)}
            />
          );
        })}
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!currentFilters.query}>
        <Chip {...chipProps} label={currentFilters.query} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
