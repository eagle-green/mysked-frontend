import type { ISiteTableFilters } from 'src/types/site';
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  onResetPage: () => void;
  filters: UseSetStateReturn<ISiteTableFilters>;
};

export function SiteTableFiltersResult({ filters, onResetPage, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

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
    resetFilters();
  }, [onResetPage, resetFilters]);

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
          <Chip
            key={item}
            {...chipProps}
            label={item}
            onDelete={() => handleRemoveRegion(item)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!currentFilters.query}>
        <Chip
          {...chipProps}
          label={currentFilters.query}
          onDelete={handleRemoveKeyword}
        />
      </FiltersBlock>
    </FiltersResult>
  );
} 