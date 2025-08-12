import type { IJobTableFilters } from 'src/types/job';
import type { IDatePickerControl } from 'src/types/common';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { formHelperTextClasses } from '@mui/material/FormHelperText';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

type Props = {
  dateError: boolean;
  onResetPage: () => void;
  filters: UseSetStateReturn<IJobTableFilters>;
  onFilters: (name: string, value: any) => void;
  onResetFilters: () => void;
};

export function AdminTimesheetTableToolbar({
  filters,
  onFilters,
  onResetFilters,
  dateError,
  onResetPage,
}: Props) {
  const menuActions = usePopover();
  const { state: currentFilters, setState: updateFilters } = filters;

const API_BASE = "https://mysked-backend-dev.onrender.com"

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<IDatePickerControl>(null);
  const [exportEndDate, setExportEndDate] = useState<IDatePickerControl>(null);

  const handleOpenExportDialog = () => {
    setExportDialogOpen(true);
    menuActions.onClose();
  };
  const handleCloseExportDialog = () => setExportDialogOpen(false);


const handleExport = async () => {
  if (!exportStartDate || !exportEndDate) {
    alert('Please select both start and end dates');
    return;
  }

  const start = dayjs(exportStartDate).format('YYYY-MM-DD');
  const end = dayjs(exportEndDate).format('YYYY-MM-DD');
  const apiUrl = `https://mysked-backend-dev.onrender.com/api/timesheets/export?start_date=${start}&end_date=${end}`;

  try {
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJjNWMxZmYzLTEzNjAtNDdhMy1hMzMyLTJmNDVmY2I4ZjZiMSIsImVtYWlsIjoia2l3b29uQGVhZ2xlZ3JlZW4uY2EiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTUwMDM2MzYsImV4cCI6MTc1NTYwODQzNn0.TUnfo7Qaa21jJ42_4s_Ok_JCR4wfr79qZJq4c55gSWc`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Timesheets');

    // Define headers
    const headers = [
      'Date',
      'Job Number',
      'Site name',
      'Site address',
      'Client',
      'Company',
      'Shift Start',
      'Shift End',
      'Break Start',
      'Break End',
      'Total Work Hours',
      'Travel Distance',
      'Worker Notes',
    ];

    // Add header row with styling
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB0B3B2' }
      };
    });

    // Add data rows
    data.workers.forEach((worker: any) => {
      worker.entries.forEach((entry: any) => {
        const row = worksheet.addRow([
          entry.timesheet_date || '',
          entry.job_number || '',
          entry.site_name || '',
          entry.site_address || '',
          entry.client_name || '',
          entry.company_name || '',
          entry.shift_start ? dayjs(entry.shift_start).format('HH:mm') : '',
          entry.shift_end ? dayjs(entry.shift_end).format('HH:mm') : '',
          entry.break_start ? dayjs(entry.break_start).format('HH:mm') : '',
          entry.break_end ? dayjs(entry.break_end).format('HH:mm') : '',
          entry.shift_total_hours?.toString() || '',
          entry.travel_distance_km?.toString() || '',
          entry.worker_notes || '',
        ]);

        // Style the first column (Date)
        const dateCell = row.getCell(1);
        dateCell.font = { bold: true };
        dateCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFB0B3B2' }
        };
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.width = Math.max(
        10,
        Math.min(
          30,
          (column.header?.length || 0) * 1.2
        )
      );
    });

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `timesheets_${start}_to_${end}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

  } catch (err) {
    console.error(err);
    alert('Failed to export. Check console for details.');
  }
};



  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.client);
      return response.data.clients;
    },
  });

  const clientOptions = clientsData?.map((client: any) => client.name) || [];

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ query: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterStartDate = useCallback(
    (newValue: IDatePickerControl) => {
      onResetPage();
      updateFilters({ startDate: newValue });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterEndDate = useCallback(
    (newValue: IDatePickerControl) => {
      onResetPage();
      updateFilters({ endDate: newValue });
    },
    [onResetPage, updateFilters]
  );

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem onClick={handleOpenExportDialog}>
          <Iconify icon="solar:export-bold" />
          Export work hrs
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <Box
        sx={{
          p: 2.5,
          gap: 2,
          display: 'flex',
          pr: { xs: 2.5, md: 1 },
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-end', md: 'center' },
        }}
      >
        <Autocomplete
          multiple
          options={clientOptions}
          value={currentFilters.client || []}
          onChange={(event, newValue) => {
            onResetPage();
            updateFilters({ client: newValue });
          }}
          renderInput={(params) => (
            <TextField {...params} label="Client" placeholder="Search client..." />
          )}
          renderTags={() => []}
          renderOption={(props, option, { selected }) => {
            const { key, ...otherProps } = props;
            return (
              <Box component="li" key={key} {...otherProps}>
                <Checkbox disableRipple size="small" checked={selected} />
                {option}
              </Box>
            );
          }}
          filterOptions={(options, { inputValue }) => {
            const filtered = options.filter((option) =>
              option.toLowerCase().includes(inputValue.toLowerCase())
            );
            return Array.from(new Set(filtered));
          }}
          sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}
        />

        <DatePicker
          label="Start Date"
          value={currentFilters.startDate}
          onChange={handleFilterStartDate}
          slotProps={{ textField: { fullWidth: true } }}
          sx={{ maxWidth: { md: 180 } }}
        />

        <DatePicker
          label="End Date"
          value={currentFilters.endDate}
          onChange={handleFilterEndDate}
          slotProps={{
            textField: {
              fullWidth: true,
              error: dateError,
              helperText: dateError ? 'End date must be later than start date' : null,
            },
          }}
          sx={{
            maxWidth: { md: 180 },
            [`& .${formHelperTextClasses.root}`]: {
              bottom: { md: -40 },
              position: { md: 'absolute' },
            },
          }}
        />

        <Box
          sx={{
            gap: 2,
            width: 1,
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <TextField
            fullWidth
            value={currentFilters.query}
            onChange={handleFilterName}
            placeholder="Search timesheet..."
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <IconButton onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Box>
      </Box>

      {renderMenuActions()}

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={handleCloseExportDialog}
        PaperProps={{
          sx: { overflow: 'visible' } // let popovers escape the dialog
        }}
      >
        <DialogTitle>Select Date Range for Export</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            mt: 1,
            overflow: 'visible' // avoid clipping popups
          }}
        >
          {[
            { label: "Start Date", value: exportStartDate, setValue: setExportStartDate },
            { label: "End Date", value: exportEndDate, setValue: setExportEndDate }
          ].map((picker, index) => (
            <DatePicker
              key={index}
              label={picker.label}
              value={picker.value}
              onChange={(newValue) => picker.setValue(newValue)}
              slotProps={{
                textField: { fullWidth: true },
                popper: {
                  placement: "bottom-start",
                  modifiers: [
                    {
                      name: "preventOverflow",
                      options: { altAxis: true, tether: false }
                    }
                  ]
                }
              }}
              sx={{
                minWidth: 250,
                [`& .MuiInputBase-root`]: { paddingTop: '8px' },
                [`& .MuiInputLabel-root`]: { top: '4px' }
              }}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExportDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={!exportStartDate || !exportEndDate}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>


    </>
  );
}
