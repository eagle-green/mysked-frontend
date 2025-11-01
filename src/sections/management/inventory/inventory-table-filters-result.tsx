import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IInventoryTableFilters } from 'src/types/inventory';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: UseSetStateReturn<IInventoryTableFilters>;
  totalResults: number;
  onResetPage: () => void;
  sx?: object;
};

export function InventoryTableFiltersResult({ filters, totalResults, onResetPage, sx }: Props) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ query: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveCategory = useCallback(
    (inputValue: string) => {
      const newValue = currentFilters.category.filter((item: string) => item !== inputValue);
      onResetPage();
      updateFilters({ category: newValue });
    },
    [onResetPage, updateFilters, currentFilters.category]
  );

  const handleReset = useCallback(() => {
    onResetPage();
    resetFilters();
  }, [onResetPage, resetFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Keyword:" isShow={!!currentFilters.query}>
        <Chip {...chipProps} label={currentFilters.query} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label="Type:" isShow={!!currentFilters.category.length}>
        {currentFilters.category.map((item: string) => (
          <Chip
            {...chipProps}
            key={item}
            label={item}
            onDelete={() => handleRemoveCategory(item)}
          />
        ))}
      </FiltersBlock>
    </FiltersResult>
  );
}

