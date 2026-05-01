import dayjs from 'dayjs';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';
import { FiltersBlock } from 'src/components/filters-result/filters-block';
import { chipProps, FiltersResult } from 'src/components/filters-result/filters-result';
// ----------------------------------------------------------------------

type Props = {
  filters: any;
  totalResults: number;
  onResetPage: VoidFunction;
  options: any[];
  sx?: any;
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
];

export function AdminPreTripVehicleFilterResult({
  filters,
  totalResults,
  onResetPage,
  sx,
  options,
}: Props) {
  // const theme = useTheme();
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    updateFilters({ status: 'all' });
  }, [onResetPage, updateFilters]);

  const handleRemoveKeyword = useCallback(() => {
    updateFilters({ query: '' });
    onResetPage();
  }, [updateFilters, onResetPage]);

  const handleRemoveDriver = useCallback(
    (driver: string) => {
      const newDriver = currentFilters.drivers.filter((t: any) => t.value !== driver);
      updateFilters({ drivers: newDriver });
      onResetPage();
    },
    [currentFilters.drivers, updateFilters, onResetPage]
  );

  const handleRemoveVehicle = useCallback(
    (vehicle: string) => {
      const newVehicle = currentFilters.vehicles.filter((t: any) => t.value !== vehicle);
      updateFilters({ vehicles: newVehicle });
      onResetPage();
    },
    [currentFilters.vehicles, updateFilters, onResetPage]
  );

  const handleReset = useCallback(() => {
    onResetPage();
    updateFilters({
      query: '',
      status: 'all',
      drivers: [],
      vehicles: [],
      startDate: null,
      endDate: null,
    });
  }, [onResetPage, updateFilters]);

  const handleRemoveStartDate = useCallback(() => {
    onResetPage();
    updateFilters({ startDate: null });
  }, [onResetPage, updateFilters]);

  const handleRemoveEndDate = useCallback(() => {
    onResetPage();
    updateFilters({ endDate: null });
  }, [onResetPage, updateFilters]);
  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Status:" isShow={currentFilters.status !== 'all'}>
        <Chip
          {...chipProps}
          label={
            STATUS_OPTIONS.find((opt) => opt.value === currentFilters.status)?.label ||
            currentFilters.status
          }
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock label="Drvier:" isShow={!!currentFilters.drivers.length}>
        {currentFilters.drivers.map((driver: any) => (
          <Chip
            key={driver.value}
            {...chipProps}
            label={driver.name}
            onDelete={() => handleRemoveDriver(driver.value)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Vehicle:" isShow={!!currentFilters.vehicles.length}>
        {currentFilters.vehicles.map((driver: any) => (
          <Chip
            key={driver.value}
            {...chipProps}
            label={driver.name}
            onDelete={() => handleRemoveVehicle(driver.value)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Date:" isShow={!!currentFilters.startDate || !!currentFilters.endDate}>
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

      <FiltersBlock label="Keyword:" isShow={!!currentFilters.query}>
        <Chip {...chipProps} label={currentFilters.query} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
