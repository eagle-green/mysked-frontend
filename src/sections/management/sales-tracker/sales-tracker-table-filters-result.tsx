import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';
import type { ISalesTrackerTableFilters } from 'src/types/sales-tracker';

import dayjs from 'dayjs';
import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

import { SALES_TRACKER_SERVICE_OPTIONS } from 'src/types/sales-tracker';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  onResetPage: () => void;
  filters: UseSetStateReturn<ISalesTrackerTableFilters>;
};

export function SalesTrackerTableFiltersResult({ filters, onResetPage, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveService = useCallback(() => {
    onResetPage();
    updateFilters({ service: 'all' });
  }, [onResetPage, updateFilters]);

  const handleRemoveCustomer = useCallback(
    (id: string) => {
      onResetPage();
      updateFilters({
        customer: currentFilters.customer.filter((c) => c.id !== id),
      });
    },
    [onResetPage, updateFilters, currentFilters.customer]
  );

  const handleRemoveEmployee = useCallback(
    (id: string) => {
      onResetPage();
      updateFilters({
        employee: currentFilters.employee.filter((e) => e.id !== id),
      });
    },
    [onResetPage, updateFilters, currentFilters.employee]
  );

  const handleRemoveStartDate = useCallback(() => {
    onResetPage();
    updateFilters({ startDate: null });
  }, [onResetPage, updateFilters]);

  const handleRemoveEndDate = useCallback(() => {
    onResetPage();
    updateFilters({ endDate: null });
  }, [onResetPage, updateFilters]);

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ query: '' });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    updateFilters({
      query: '',
      service: 'all',
      customer: [],
      employee: [],
      startDate: null,
      endDate: null,
    });
  }, [onResetPage, updateFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock
        label="Service:"
        isShow={currentFilters.service !== 'all'}
      >
        <Chip
          {...chipProps}
          label={
            SALES_TRACKER_SERVICE_OPTIONS.find((o) => o.value === currentFilters.service)?.label ??
            currentFilters.service
          }
          onDelete={handleRemoveService}
        />
      </FiltersBlock>

      <FiltersBlock label="Customer:" isShow={(currentFilters.customer?.length ?? 0) > 0}>
        {(currentFilters.customer ?? []).map((c) => (
          <Chip
            key={c.id}
            {...chipProps}
            label={c.name}
            onDelete={() => handleRemoveCustomer(c.id)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Employee:" isShow={(currentFilters.employee?.length ?? 0) > 0}>
        {(currentFilters.employee ?? []).map((e) => (
          <Chip
            key={e.id}
            {...chipProps}
            label={e.name}
            onDelete={() => handleRemoveEmployee(e.id)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!(currentFilters.query ?? '').trim()}>
        <Chip
          {...chipProps}
          label={currentFilters.query}
          onDelete={handleRemoveKeyword}
        />
      </FiltersBlock>

      <FiltersBlock
        label="Date:"
        isShow={!!currentFilters.startDate || !!currentFilters.endDate}
      >
        {(() => {
          const start = currentFilters.startDate;
          const end = currentFilters.endDate;
          if (start && end && dayjs(start).isSame(dayjs(end), 'day')) {
            return (
              <Chip
                {...chipProps}
                label={dayjs(start).format('DD MMM YYYY')}
                onDelete={() => {
                  handleRemoveStartDate();
                  handleRemoveEndDate();
                }}
              />
            );
          }
          if (start && end) {
            return (
              <Chip
                {...chipProps}
                label={`${dayjs(start).format('DD')} - ${dayjs(end).format('DD MMM YYYY')}`}
                onDelete={() => {
                  handleRemoveStartDate();
                  handleRemoveEndDate();
                }}
              />
            );
          }
          if (start) {
            return (
              <Chip
                {...chipProps}
                label={dayjs(start).format('DD MMM YYYY')}
                onDelete={handleRemoveStartDate}
              />
            );
          }
          if (end) {
            return (
              <Chip
                {...chipProps}
                label={dayjs(end).format('DD MMM YYYY')}
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
