import type { Dayjs } from 'dayjs';
import type { SelectChangeEvent } from '@mui/material/Select';

import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// ----------------------------------------------------------------------

export type VehicleWeeklyTableMode = 'available' | 'active';

/** null = full week; 0 = Mon, 1 = Tue, ... 6 = Sun */
export type VehicleWeeklySelectedDay = number | null;

export type VehicleActiveViewMode = 'by_vehicle' | 'by_job';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const toggleButtonSx = {
  '& .MuiToggleButtonGroup-grouped': { px: 1.5, py: 0.5 },
  '& .MuiToggleButtonGroup-grouped.Mui-selected': {
    backgroundColor: 'primary.main',
    color: 'primary.contrastText',
    '&:hover': {
      backgroundColor: 'primary.dark',
      color: 'primary.contrastText',
    },
  },
};

type VehicleDashboardWeeklyViewDayToolbarProps = {
  weekStart: Dayjs;
  mode: VehicleWeeklyTableMode;
  onModeChange?: (mode: VehicleWeeklyTableMode) => void;
  activeViewMode?: VehicleActiveViewMode;
  onActiveViewModeChange?: (v: VehicleActiveViewMode) => void;
  selectedDay: VehicleWeeklySelectedDay;
  onDayChange?: (day: VehicleWeeklySelectedDay) => void;
};

export function VehicleDashboardWeeklyViewDayToolbar({
  weekStart,
  mode,
  onModeChange,
  activeViewMode,
  onActiveViewModeChange,
  selectedDay,
  onDayChange,
}: VehicleDashboardWeeklyViewDayToolbarProps) {
  const dayOptions = useMemo(() => {
    const base = weekStart.startOf('day');
    return [
      { value: 'full' as const, label: 'Full week' },
      ...DAY_LABELS.map((label, i) => ({
        value: i as number,
        label: `${label} ${base.add(i, 'day').format('MMM D')}`,
      })),
    ];
  }, [weekStart]);

  const handleDayChange = useCallback(
    (event: SelectChangeEvent<number | 'full'>) => {
      const v = event.target.value;
      onDayChange?.(v === 'full' ? null : (v as number));
    },
    [onDayChange]
  );

  const handleModeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, value: VehicleWeeklyTableMode | null) => {
      if (value !== null && onModeChange) onModeChange(value);
    },
    [onModeChange]
  );

  const handleGroupByChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, value: VehicleActiveViewMode | null) => {
      if (value !== null && onActiveViewModeChange) onActiveViewModeChange(value);
    },
    [onActiveViewModeChange]
  );

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      divider={
        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: 'divider', display: { xs: 'none', sm: 'block' } }}
        />
      }
      spacing={2.5}
      sx={{
        px: 2.5,
        py: 2,
        borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
          Vehicles
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={handleModeChange}
          aria-label="Vehicles: available or active"
          sx={toggleButtonSx}
        >
          <ToggleButton value="available">Available</ToggleButton>
          <ToggleButton value="active">Active</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {mode === 'active' && activeViewMode != null && onActiveViewModeChange && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
            View
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={activeViewMode}
            onChange={handleGroupByChange}
            aria-label="View by vehicle or job"
            sx={toggleButtonSx}
          >
            <ToggleButton value="by_vehicle">By Vehicle</ToggleButton>
            <ToggleButton value="by_job">By Job</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
          Day
        </Typography>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="vehicle-weekly-day-label">Day</InputLabel>
          <Select
            labelId="vehicle-weekly-day-label"
            value={selectedDay === null ? 'full' : selectedDay}
            onChange={handleDayChange}
            label="Day"
          >
            {dayOptions.map((opt) => (
              <MenuItem key={String(opt.value)} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Stack>
  );
}
