import type { UseSetStateReturn } from 'minimal-shared/hooks';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

interface ServiceTableFilters {
  query: string;
  status: string;
  category: string[];
  type: string[];
}

type Props = {
  filters: UseSetStateReturn<ServiceTableFilters>;
  totalResults: number;
  onResetPage: () => void;
  sx?: object;
};

export function ServiceTableFiltersResult({ filters, totalResults, onResetPage, sx }: Props) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ query: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    updateFilters({ status: 'all' });
  }, [onResetPage, updateFilters]);

  const handleRemoveCategory = useCallback(
    (value: string) => {
      onResetPage();
      updateFilters({
        category: currentFilters.category.filter((cat) => cat !== value),
      });
    },
    [onResetPage, updateFilters, currentFilters.category]
  );

  const handleRemoveType = useCallback(
    (value: string) => {
      onResetPage();
      updateFilters({
        type: currentFilters.type.filter((t) => t !== value),
      });
    },
    [onResetPage, updateFilters, currentFilters.type]
  );

  const handleReset = useCallback(() => {
    onResetPage();
    resetFilters({
      query: '',
      status: 'all',
      category: [],
      type: [],
    });
  }, [onResetPage, resetFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Keyword:" isShow={!!currentFilters.query}>
        <Chip {...chipProps} label={currentFilters.query} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label="Status:" isShow={currentFilters.status !== 'all'}>
        <Chip
          {...chipProps}
          label={currentFilters.status === 'active' ? 'Active' : currentFilters.status === 'inactive' ? 'Inactive' : currentFilters.status}
          onDelete={handleRemoveStatus}
        />
      </FiltersBlock>

      <FiltersBlock label="Category:" isShow={currentFilters.category.length > 0}>
        {currentFilters.category.map((cat) => (
          <Chip
            key={cat}
            {...chipProps}
            label={cat}
            onDelete={() => handleRemoveCategory(cat)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Type:" isShow={currentFilters.type.length > 0}>
        {currentFilters.type.map((type) => (
          <Chip
            key={type}
            {...chipProps}
            label={type}
            onDelete={() => handleRemoveType(type)}
          />
        ))}
      </FiltersBlock>
    </FiltersResult>
  );
}
