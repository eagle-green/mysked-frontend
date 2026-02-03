import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { roleList } from 'src/assets/data';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

import type { VehicleUserAccessFilters } from './vehicle-user-access-table-toolbar';

const VEHICLE_ROLE_OPTIONS = roleList.filter((r) =>
  ['lct', 'lct/tcp', 'field_supervisor', 'hwy', 'manager'].includes(r.value)
);

type Props = FiltersResultProps & {
  onResetPage: () => void;
  filters: UseSetStateReturn<VehicleUserAccessFilters>;
};

export function VehicleUserAccessTableFiltersResult({
  filters,
  onResetPage,
  totalResults,
  sx,
}: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ query: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveRole = useCallback(
    (inputValue: string) => {
      const newValue = currentFilters.role.filter((item) => item !== inputValue);
      onResetPage();
      updateFilters({ role: newValue });
    },
    [onResetPage, updateFilters, currentFilters.role]
  );

  const handleRemoveVehicleAccess = useCallback(() => {
    onResetPage();
    updateFilters({ vehicle_access: 'all' });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    updateFilters({
      query: '',
      role: [],
      vehicle_access: 'all',
    });
  }, [onResetPage, updateFilters]);

  const vehicleAccessLabel =
    currentFilters.vehicle_access === 'all'
      ? ''
      : currentFilters.vehicle_access.charAt(0).toUpperCase() +
        currentFilters.vehicle_access.slice(1);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Vehicle Access:" isShow={currentFilters.vehicle_access !== 'all'}>
        <Chip
          {...chipProps}
          label={vehicleAccessLabel}
          onDelete={handleRemoveVehicleAccess}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock label="Role:" isShow={!!currentFilters.role.length}>
        {currentFilters.role.map((item) => {
          const label = VEHICLE_ROLE_OPTIONS.find((o) => o.value === item)?.label || item;
          return (
            <Chip {...chipProps} key={item} label={label} onDelete={() => handleRemoveRole(item)} />
          );
        })}
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!currentFilters.query}>
        <Chip {...chipProps} label={currentFilters.query} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
