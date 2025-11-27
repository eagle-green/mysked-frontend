import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import dayjs from 'dayjs';
import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

import type { MissingTimecardsFilters } from './view/missing-timecards-list-view';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  onResetPage: () => void;
  filters: UseSetStateReturn<MissingTimecardsFilters>;
  onFilters: (name: string, value: any) => void;
  onResetFilters?: () => void;
};

export function MissingTimecardsTableFiltersResult({
  filters,
  onFilters,
  onResetPage,
  onResetFilters,
  totalResults,
  sx,
}: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    updateFilters({ status: 'all' });
  }, [onResetPage, updateFilters]);

  const handleRemoveClient = useCallback(
    (inputValue: string) => {
      const newValue = currentFilters.client.filter((item) => item.id !== inputValue);
      onResetPage();
      updateFilters({ client: newValue });
    },
    [currentFilters.client, onResetPage, updateFilters]
  );

  const handleRemoveTimesheetManager = useCallback(
    (inputValue: string) => {
      const newValue = currentFilters.timesheet_manager.filter((item) => item.id !== inputValue);
      onResetPage();
      updateFilters({ timesheet_manager: newValue });
    },
    [currentFilters.timesheet_manager, onResetPage, updateFilters]
  );

  const handleRemoveStartDate = useCallback(() => {
    onResetPage();
    updateFilters({ startDate: null });
  }, [onResetPage, updateFilters]);

  const handleRemoveEndDate = useCallback(() => {
    onResetPage();
    updateFilters({ endDate: null });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    if (onResetFilters) {
      onResetFilters();
    } else {
      updateFilters({
        query: '',
        status: 'all',
        client: [],
        timesheet_manager: [],
        startDate: null,
        endDate: null,
      });
    }
  }, [onResetPage, onResetFilters, updateFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Status:" isShow={currentFilters.status !== 'all'}>
        <Chip
          {...chipProps}
          label={currentFilters.status === 'overdue' ? 'Overdue' : currentFilters.status}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock label="Date:" isShow={!!currentFilters.startDate || !!currentFilters.endDate}>
        {(() => {
          const startDate = currentFilters.startDate;
          const endDate = currentFilters.endDate;
          
          if (startDate && endDate) {
            const start = dayjs(startDate);
            const end = dayjs(endDate);
            
            if (start.isSame(end, 'day')) {
              // Same date: "07 Aug 2025"
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
              // Different dates: "07 - 08 Aug 2025"
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

      <FiltersBlock label="Client:" isShow={currentFilters.client.length > 0}>
        {currentFilters.client.map((client) => (
          <Chip
            key={client.id}
            {...chipProps}
            label={client.name}
            onDelete={() => handleRemoveClient(client.id)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Timesheet Manager:" isShow={currentFilters.timesheet_manager.length > 0}>
        {currentFilters.timesheet_manager.map((manager) => (
          <Chip
            key={manager.id}
            {...chipProps}
            label={manager.name || manager.id}
            onDelete={() => handleRemoveTimesheetManager(manager.id)}
          />
        ))}
      </FiltersBlock>
    </FiltersResult>
  );
}

