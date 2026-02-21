import type { IJobTableFilters } from 'src/types/job';
import type { Theme, SxProps } from '@mui/material/styles';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: IJobTableFilters;
  totalResults: number;
  onResetFilters: () => void;
  /** Called when only the keyword/search chip is removed (clears query only) */
  onClearKeyword?: () => void;
  sx?: SxProps<Theme>;
};

export function TmpTableFiltersResult({
  filters,
  totalResults,
  onResetFilters,
  onClearKeyword,
  sx,
}: Props) {
  const handleRemoveKeyword = onClearKeyword ?? onResetFilters;
  return (
    <FiltersResult totalResults={totalResults} onReset={onResetFilters} sx={sx}>
      <FiltersBlock label="Keyword:" isShow={!!filters.query}>
        <Chip {...chipProps} label={filters.query} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
