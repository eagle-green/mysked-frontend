import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';
import type { IAttendanceConductReportTableFilters } from 'src/types/attendance-conduct-report';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
  onResetPage: () => void;
  filters: UseSetStateReturn<IAttendanceConductReportTableFilters>;
};

export function AttendanceConductReportTableFiltersResult({
  filters,
  onResetPage,
  totalResults,
  sx,
}: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveEmployee = useCallback(
    (id: string) => {
      onResetPage();
      updateFilters({
        employee: (currentFilters.employee ?? []).filter((e) => e.id !== id),
      });
    },
    [onResetPage, updateFilters, currentFilters.employee]
  );

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ query: '' });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    updateFilters({
      query: '',
      employee: [],
    });
  }, [onResetPage, updateFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
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
    </FiltersResult>
  );
}
