import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type {
  FiltersResultProps} from 'src/components/filters-result/filters-result';

import dayjs from 'dayjs';
import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { FiltersBlock } from 'src/components/filters-result/filters-block';
import {
  chipProps,
  FiltersResult
} from 'src/components/filters-result/filters-result';

//--------------------------------------------------------------------------

type InvoiceFilterType = {
  service: string[];
  region: string[];
  client: string[];
  startDate: Date | null;
  endDate: Date | null;
};

type Props = FiltersResultProps & {
  filters: UseSetStateReturn<InvoiceFilterType>;
  onResetFilters: () => void;
};

export function InvoiceFilterResult({ filters, onResetFilters, sx, totalResults }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveStartDate = useCallback(() => {
    updateFilters({ startDate: null });
  }, [updateFilters]);

  const handleRemoveClient = useCallback(
    (clientToRemove: string) => {
      const client = currentFilters.client.filter((c: string) => c !== clientToRemove);
      updateFilters({ client });
    },
    [updateFilters, currentFilters.client]
  );

  const handleRemoveService = useCallback(
    (serviceToRemove: string) => {
      const service = currentFilters.service.filter((s: string) => s !== serviceToRemove);
      updateFilters({ service });
    },
    [updateFilters, currentFilters.service]
  );

  const handleRemoveRegion = useCallback(
    (regionToRemove: string) => {
      const region = currentFilters.region.filter((r: string) => r !== regionToRemove);
      updateFilters({ region });
    },
    [updateFilters, currentFilters.region]
  );

  const handleRemoveEndDate = useCallback(() => {
    updateFilters({ endDate: null });
  }, [updateFilters]);

  const handleReset = useCallback(() => {
    onResetFilters();
  }, [onResetFilters]);

  return (
    <FiltersResult
      totalResults={totalResults}
      onReset={handleReset}
      sx={sx}
      showTotalResults={false}
    >
      {/* Services */}
      <FiltersBlock label="Service:" isShow={currentFilters.service.length > 0}>
        {currentFilters.service.map((t: string) => (
          <Chip key={t} {...chipProps} label={t} onDelete={() => handleRemoveService(t)} />
        ))}
      </FiltersBlock>

      {/* Region */}
      <FiltersBlock label="Region:" isShow={currentFilters.region.length > 0}>
        {currentFilters.region.map((t: string) => (
          <Chip key={t} {...chipProps} label={t} onDelete={() => handleRemoveRegion(t)} />
        ))}
      </FiltersBlock>

      {/* Client */}
      <FiltersBlock label="Client:" isShow={currentFilters.client.length > 0}>
        {currentFilters.client.map((t: string) => (
          <Chip key={t} {...chipProps} label={t} onDelete={() => handleRemoveClient(t)} />
        ))}
      </FiltersBlock>

      {/* Dates */}
      <FiltersBlock
        label="Invoice Date:"
        isShow={!!currentFilters.startDate || !!currentFilters.endDate}
      >
        {(() => {
          const startDate = currentFilters.startDate;
          const endDate = currentFilters.endDate;

          if (startDate && endDate) {
            const start = dayjs(startDate);
            const end = dayjs(endDate);

            if (start.isSame(end, 'day')) {
              // Same date: "Date: 07 Aug 2025"
              return (
                <Chip
                  {...chipProps}
                  label={`${start.format('DD MMM YYYY')}`}
                  onDelete={() => {
                    handleRemoveStartDate();
                    handleRemoveEndDate();
                  }}
                />
              );
            } else {
              // Different dates: "Date: 07 - 08 Aug 2025"
              const startDay = start.format('DD');
              const endDay = end.format('DD');
              const monthYear = end.format('MMM YYYY');

              return (
                <Chip
                  {...chipProps}
                  label={`${startDay} - ${endDay} ${monthYear}`}
                  onDelete={() => {
                    handleRemoveStartDate();
                    handleRemoveEndDate();
                  }}
                />
              );
            }
          } else if (startDate) {
            // Only start date
            return (
              <Chip
                {...chipProps}
                label={dayjs(startDate).format('DD MMM YYYY')}
                onDelete={handleRemoveStartDate}
              />
            );
          } else if (endDate) {
            // Only end date
            return (
              <Chip
                {...chipProps}
                label={dayjs(endDate).format('DD MMM YYYY')}
                onDelete={handleRemoveEndDate}
              />
            );
          }
          return null;
        })()}
      </FiltersBlock>
    </FiltersResult>
  );
}
