import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';
import type { IAttendanceConductReportTableFilters } from 'src/types/attendance-conduct-report';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

const COLUMN_LABELS: Record<string, string> = {
  score: 'Score',
  noShowUnpaid: 'No Show (Unpaid)',
  refusalOfShifts: 'Refusal of shift',
  sentHomeNoPpe: 'Sent home (No PPE)',
  leftEarlyNoNotice: 'Left Early No Notice',
  lateOnSite: 'Late on Site',
  unapprovedDaysOffShortNotice: 'Unapproved Days Off',
  calledInSick: 'Called in Sick',
  unauthorizedDriving: 'Unauthorized Driving',
  drivingInfractions: 'Driving Infractions',
  verbalWarningsWriteUp: 'Verbal Warnings / Write Up',
  sickLeaveUnpaid: 'Sick Leave (Unpaid)',
  sickLeave5: 'Sick Leave (5)',
  vacationDayUnpaid: 'Vacation Day (Unpaid)',
  vacationDay10: 'Vacation Day (10)',
  personalDayOffUnpaid: 'Personal Day Off (Unpaid)',
  unapprovePayoutWithoutDayOff: 'Unapprove Payout without Day Off',
};

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
  const hasScoreFilter =
    currentFilters.scoreMin != null || currentFilters.scoreMax != null;
  const columnAtLeastOne = currentFilters.columnAtLeastOne ?? [];

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

  const handleRemoveScoreFilter = useCallback(() => {
    onResetPage();
    updateFilters({ scoreMin: undefined, scoreMax: undefined });
  }, [onResetPage, updateFilters]);

  const handleRemoveColumnAtLeastOne = useCallback(
    (colId: string) => {
      onResetPage();
      updateFilters({
        columnAtLeastOne: (currentFilters.columnAtLeastOne ?? []).filter((c) => c !== colId),
      });
    },
    [onResetPage, updateFilters, currentFilters.columnAtLeastOne]
  );

  const handleReset = useCallback(() => {
    onResetPage();
    updateFilters({
      query: '',
      employee: [],
      scoreMin: undefined,
      scoreMax: undefined,
      columnAtLeastOne: [],
      status: 'active',
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

      <FiltersBlock
        label="Score range:"
        isShow={hasScoreFilter}
      >
        <Chip
          {...chipProps}
          label={
            currentFilters.scoreMin != null && currentFilters.scoreMax != null
              ? `${currentFilters.scoreMin}-${currentFilters.scoreMax}`
              : currentFilters.scoreMin != null
                ? `Min ${currentFilters.scoreMin}`
                : `Max ${currentFilters.scoreMax}`
          }
          onDelete={handleRemoveScoreFilter}
        />
      </FiltersBlock>

      <FiltersBlock label="At least 1 in:" isShow={columnAtLeastOne.length > 0}>
        {columnAtLeastOne.map((colId) => (
          <Chip
            key={colId}
            {...chipProps}
            label={COLUMN_LABELS[colId] ?? colId}
            onDelete={() => handleRemoveColumnAtLeastOne(colId)}
          />
        ))}
      </FiltersBlock>
    </FiltersResult>
  );
}
