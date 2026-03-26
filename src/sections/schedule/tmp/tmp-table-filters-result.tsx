import type { IJobTableFilters } from 'src/types/job';
import type { Theme, SxProps } from '@mui/material/styles';

import dayjs from 'dayjs';

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
      <FiltersBlock label="Customer:" isShow={filters.company.length > 0}>
        {filters.company.map((company) => (
          <Chip key={company.id} {...chipProps} label={company.name || company.id} />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Site:" isShow={filters.site.length > 0}>
        {filters.site.map((site) => (
          <Chip key={site.id} {...chipProps} label={site.name || site.id} />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Client:" isShow={filters.client.length > 0}>
        {filters.client.map((client) => (
          <Chip key={client.id} {...chipProps} label={client.name || client.id} />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Date:" isShow={!!filters.startDate || !!filters.endDate}>
        {filters.startDate && filters.endDate ? (
          <Chip
            {...chipProps}
            label={`${dayjs(filters.startDate).format('DD MMM YYYY')} - ${dayjs(filters.endDate).format('DD MMM YYYY')}`}
          />
        ) : filters.startDate ? (
          <Chip {...chipProps} label={dayjs(filters.startDate).format('DD MMM YYYY')} />
        ) : filters.endDate ? (
          <Chip {...chipProps} label={dayjs(filters.endDate).format('DD MMM YYYY')} />
        ) : null}
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!filters.query}>
        <Chip {...chipProps} label={filters.query} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
