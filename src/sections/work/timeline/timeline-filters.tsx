import type { IDatePickerControl } from 'src/types/common';
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { ICalendarJob, ICalendarFilters } from 'src/types/calendar';

import { useCallback } from 'react';
import { orderBy } from 'es-toolkit';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { fDate, fDateTime } from 'src/utils/format-time';

import { roleList } from 'src/assets/data';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ColorPicker } from 'src/components/color-utils';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  canReset: boolean;
  dateError: boolean;
  onClose: () => void;
  colorOptions: string[];
  jobs: ICalendarJob[];
  onClickJob: (jobId: string) => void;
  filters: UseSetStateReturn<ICalendarFilters>;
};

export function TimelineFilters({
  open,
  jobs,
  onClose,
  filters,
  canReset,
  dateError,
  colorOptions,
  onClickJob,
}: Props) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleFilterColors = useCallback(
    (newValue: string | string[]) => {
      updateFilters({ colors: newValue as string[] });
    },
    [updateFilters]
  );

  const handleFilterStartDate = useCallback(
    (newValue: IDatePickerControl) => {
      updateFilters({ startDate: newValue });
    },
    [updateFilters]
  );

  const handleFilterEndDate = useCallback(
    (newValue: IDatePickerControl) => {
      updateFilters({ endDate: newValue });
    },
    [updateFilters]
  );

  const handleFilterSearch = useCallback(
    (newValue: string) => {
      updateFilters({ searchQuery: newValue });
    },
    [updateFilters]
  );

  const getRoleLabel = (roleValue: string) => {
    const role = roleList.find((r) => r.value === roleValue);
    return role?.label || roleValue;
  };

  const renderHead = () => (
    <>
      <Box
        sx={{
          py: 2,
          pr: 1,
          pl: 2.5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Timeline Filters
        </Typography>

        <Tooltip title="Reset">
          <IconButton onClick={() => resetFilters()}>
            <Badge color="error" variant="dot" invisible={!canReset}>
              <Iconify icon="solar:restart-bold" />
            </Badge>
          </IconButton>
        </Tooltip>

        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />
    </>
  );

  const renderSearch = () => (
    <Box
      sx={{
        my: 3,
        px: 2.5,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Search
      </Typography>
      <TextField
        size="small"
        placeholder="Search customers, sites, workers..."
        value={currentFilters.searchQuery}
        onChange={(e) => handleFilterSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );

  const renderColors = () => (
    <Box
      sx={{
        my: 3,
        px: 2.5,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Job Status
      </Typography>
      <ColorPicker
        options={colorOptions}
        value={currentFilters.colors}
        onChange={handleFilterColors}
      />
    </Box>
  );

  const renderDateRange = () => (
    <Box
      sx={{
        mb: 3,
        px: 2.5,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Date Range
      </Typography>

      <DatePicker
        label="Start date"
        value={currentFilters.startDate}
        onChange={handleFilterStartDate}
        sx={{ mb: 2.5 }}
      />

      <DatePicker
        label="End date"
        value={currentFilters.endDate}
        onChange={handleFilterEndDate}
        slotProps={{
          textField: {
            error: dateError,
            helperText: dateError ? 'End date must be later than start date' : null,
          },
        }}
      />
    </Box>
  );

  const renderJobs = () => (
    <>
      <Typography variant="subtitle2" sx={{ px: 2.5, mb: 1 }}>
        Jobs ({jobs.length})
      </Typography>

      <Box component="ul">
        {orderBy(jobs, ['end'], ['desc']).map((job) => (
          <li key={job.id}>
            <ListItemButton
              onClick={() => onClickJob(job.id)}
              sx={[
                (theme) => ({ py: 1.5, borderBottom: `dashed 1px ${theme.vars.palette.divider}` }),
              ]}
            >
              <Box
                sx={{
                  top: 16,
                  left: 0,
                  width: 0,
                  height: 0,
                  position: 'absolute',
                  borderRight: '10px solid transparent',
                  borderTop: `10px solid ${job.color}`,
                }}
              />

              <ListItemText
                primary={
                  job.allDay ? fDate(job.start) : `${fDateTime(job.start)} - ${fDateTime(job.end)}`
                }
                secondary={`#${job.title} - ${job.worker_name || 'Unknown Worker'} (${getRoleLabel(job.position || '')})`}
                slotProps={{
                  primary: {
                    sx: { typography: 'caption', color: 'text.disabled' },
                  },
                  secondary: {
                    sx: { mt: 0.5, color: 'text.primary', typography: 'subtitle2' },
                  },
                }}
              />
            </ListItemButton>
          </li>
        ))}
      </Box>
    </>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: { invisible: true },
      }}
      PaperProps={{
        sx: { width: 1, maxWidth: 320 },
      }}
    >
      {renderHead()}

      <Scrollbar sx={{ height: 1 }}>
        {renderSearch()}

        {renderColors()}

        {renderDateRange()}

        {renderJobs()}
      </Scrollbar>
    </Drawer>
  );
}
