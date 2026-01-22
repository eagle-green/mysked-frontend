import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import dayjs from 'dayjs';
import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

import type { ITelusReportFilters } from './types';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  onResetPage: () => void;
  filters: UseSetStateReturn<ITelusReportFilters>;
};

const REPORT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

export function TelusReportTableFiltersResult({ filters, onResetPage, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ query: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveType = useCallback(() => {
    onResetPage();
    updateFilters({ reportType: 'all' });
  }, [onResetPage, updateFilters]);

  const handleRemoveStartDate = useCallback(() => {
    onResetPage();
    updateFilters({ startDate: null, endDate: null });
  }, [onResetPage, updateFilters]);

  const handleRemoveEndDate = useCallback(() => {
    onResetPage();
    updateFilters({ endDate: null });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    updateFilters({
      reportType: 'all',
      startDate: null,
      endDate: null,
      query: '',
    });
  }, [onResetPage, updateFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Type:" isShow={currentFilters.reportType !== 'all'}>
        <Chip
          {...chipProps}
          label={
            REPORT_TYPE_OPTIONS.find(opt => opt.value === currentFilters.reportType)?.label || currentFilters.reportType
          }
          onDelete={handleRemoveType}
        />
      </FiltersBlock>

      <FiltersBlock label="Period:" isShow={!!currentFilters.startDate || !!currentFilters.endDate}>
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
                  label={start.format('DD MMM YYYY')} 
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

      <FiltersBlock label="Search:" isShow={!!currentFilters.query}>
        <Chip {...chipProps} label={currentFilters.query} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
