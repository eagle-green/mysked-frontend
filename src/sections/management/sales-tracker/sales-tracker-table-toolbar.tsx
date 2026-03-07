import type { Dayjs } from 'dayjs';
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { ISalesTrackerTableFilters } from 'src/types/sales-tracker';

import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import { usePopover } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import OutlinedInput from '@mui/material/OutlinedInput';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';
import { formHelperTextClasses } from '@mui/material/FormHelperText';

import { fDateTime } from 'src/utils/format-time';
import { formatPositionDisplay } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { SALES_TRACKER_SERVICE_OPTIONS } from 'src/types/sales-tracker';

// ----------------------------------------------------------------------

type Props = {
  dateError: boolean;
  onResetPage: () => void;
  filters: UseSetStateReturn<ISalesTrackerTableFilters>;
};

// 2-week payroll periods: 8th and 22nd of each month (e.g. Feb 22–Mar 7, Mar 8–Mar 21)
export function getDefaultTwoWeekRange(): { start: Dayjs; end: Dayjs } {
  const today = dayjs().startOf('day');
  const dayOfMonth = today.date();
  let start: Dayjs;
  if (dayOfMonth >= 22) {
    start = today.date(22).startOf('day');
  } else if (dayOfMonth >= 8) {
    start = today.date(8).startOf('day');
  } else {
    start = today.subtract(1, 'month').date(22).startOf('day');
  }
  const end = start.add(13, 'day');
  return { start, end };
}

export function SalesTrackerTableToolbar({ filters, dateError, onResetPage }: Props) {
  const menuActions = usePopover();
  const { state: currentFilters, setState: updateFilters } = filters;
  const [query, setQuery] = useState<string>(currentFilters.query ?? '');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStart, setExportStart] = useState<Dayjs | null>(null);
  const [exportEnd, setExportEnd] = useState<Dayjs | null>(null);
  const [exportDateError, setExportDateError] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setQuery(currentFilters.query ?? '');
  }, [currentFilters.query]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== (currentFilters.query ?? '')) {
        onResetPage();
        updateFilters({ query });
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, currentFilters.query, onResetPage, updateFilters]);

  const { data: companiesData } = useQuery({
    queryKey: ['companies-all'],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.companyAll);
      return response.companies ?? [];
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-all-sales-tracker'],
    queryFn: async () => {
      const response = await fetcher(
        `${endpoints.management.user}?page=1&rowsPerPage=500&orderBy=first_name&order=asc`
      );
      const data = response?.data ?? response;
      return Array.isArray(data) ? data : (data?.users ?? []);
    },
  });

  const customerOptions = useMemo(() => {
    if (!companiesData) return [];
    return (companiesData as any[]).map((c: any) => ({ id: c.id, name: c.name ?? '' }));
  }, [companiesData]);

  const employeeOptions = useMemo(() => {
    if (!usersData) return [];
    const list = Array.isArray(usersData) ? usersData : [];
    return list.map((u: any) => ({
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email || u.id,
    }));
  }, [usersData]);

  const handleServiceChange = (event: any) => {
    onResetPage();
    updateFilters({ service: event.target.value as ISalesTrackerTableFilters['service'] });
  };

  const handleFilterStartDate = (newValue: any) => {
    onResetPage();
    updateFilters({ startDate: newValue });
  };

  const handleFilterEndDate = (newValue: any) => {
    onResetPage();
    updateFilters({ endDate: newValue });
  };

  const handleOpenExportDialog = () => {
    const { start, end } = getDefaultTwoWeekRange();
    setExportStart(start);
    setExportEnd(end);
    setExportDateError(false);
    setExportDialogOpen(true);
    menuActions.onClose();
  };

  const handleExportSalesTracker = useCallback(async () => {
    if (!exportStart || !exportEnd) {
      setExportDateError(true);
      toast.error('Start date and end date are required');
      return;
    }
    if (exportStart.isAfter(exportEnd)) {
      setExportDateError(true);
      toast.error('Start date must be on or before end date');
      return;
    }
    setExportDateError(false);
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '10000',
        orderBy: 'date',
        order: 'desc',
        startDate: exportStart.format('YYYY-MM-DD'),
        endDate: exportEnd.format('YYYY-MM-DD'),
      });
      const res = await fetcher(`${endpoints.management.salesTracker}?${params.toString()}`);
      const rows = (res?.data ?? []) as any[];
      const formatHoursForExport = (v: number | null | undefined) => {
        if (v == null || Number(v) === 0) return '';
        return Number(v).toFixed(2);
      };
      const travelForExport = (row: any) => {
        const hours = row.travelTime != null && Number(row.travelTime) > 0
          ? Number(row.travelTime).toFixed(2)
          : '';
        if (!hours) return '';
        if (row.travelTimePendingApproval) return `${hours} (Pending Approval)`;
        if (row.travelTimeApprovedMinutes != null || row.travelApprovedAt) return `${hours} (Approved)`;
        return hours;
      };
      const timesheetStatusDisplay = (status: string | null | undefined) => {
        if (!status) return '';
        const s = status.toLowerCase();
        if (s === 'draft') return 'Draft';
        if (s === 'submitted') return 'Submitted';
        if (s === 'approved') return 'Approved';
        if (s === 'rejected') return 'Rejected';
        if (s === 'confirmed') return 'Confirmed';
        return status.charAt(0).toUpperCase() + status.slice(1);
      };
      const submittedByWithDate = (row: any) => {
        if (row.timesheetStatus?.toLowerCase() === 'draft') return '';
        const name =
          row.submittedBy?.first_name && row.submittedBy?.last_name
            ? `${row.submittedBy.first_name} ${row.submittedBy.last_name}`
            : '';
        const dateTime = row.timesheetUpdatedAt ? fDateTime(row.timesheetUpdatedAt) : '';
        if (!name && !dateTime) return '';
        return dateTime ? `${name} ${dateTime}` : name;
      };

      const rowToExportObj = (row: any) => ({
        Service: (formatPositionDisplay(row.service) || row.service) ?? '',
        Customer: row.customer ?? '',
        Date: row.date ? dayjs(row.date).format('MMM DD, YYYY') : '',
        'Network / PO #': row.networkPoNumber ?? '',
        'Timesheet #': row.timeCardNumber ?? '',
        'Timesheet Status': timesheetStatusDisplay(row.timesheetStatus),
        'Submitted By': submittedByWithDate(row),
        Employee: row.employee ?? '',
        Travel: travelForExport(row),
        'Reg (hrs)': formatHoursForExport(row.regularHours),
        'OT 8–11': formatHoursForExport(row.overtime8To11),
        'DT 11+': formatHoursForExport(row.doubleTime11Plus),
        'NS1 Reg': formatHoursForExport(row.ns1Regular),
        'NS1 OT': formatHoursForExport(row.ns1Overtime),
        'NS1 DT': formatHoursForExport(row.ns1DoubleTime),
        'NS2 Reg': formatHoursForExport(row.ns2Regular),
        'NS2 OT': formatHoursForExport(row.ns2Overtime),
        'NS2 DT': formatHoursForExport(row.ns2DoubleTime),
        MOB: row.mob != null && Number(row.mob) > 0 ? 'Yes' : '',
        SUB: row.sub === true ? 'Yes' : '',
        LOA: row.loa === true ? 'Yes' : '',
        EOC: row.emergencyCallout === true ? 'Yes' : '',
      });

      const exportData = rows.map((row) => rowToExportObj(row));

      // Second sheet: by employee (grouped, with total row and empty row between employees)
      const EMPTY_ROW = {
        Service: '',
        Customer: '',
        Date: '',
        'Network / PO #': '',
        'Timesheet #': '',
        'Timesheet Status': '',
        'Submitted By': '',
        Employee: '',
        Travel: '',
        'Reg (hrs)': '',
        'OT 8–11': '',
        'DT 11+': '',
        'NS1 Reg': '',
        'NS1 OT': '',
        'NS1 DT': '',
        'NS2 Reg': '',
        'NS2 OT': '',
        'NS2 DT': '',
        MOB: '',
        SUB: '',
        LOA: '',
        EOC: '',
      };

      const byEmployeeData: any[] = [];
      const sortedByEmployee = [...rows].sort((a, b) =>
        (a.employee || '').trim().localeCompare((b.employee || '').trim(), undefined, { sensitivity: 'base' })
      );
      const employeeGroups = new Map<string, any[]>();
      sortedByEmployee.forEach((row) => {
        const key = (row.employee || '').trim() || '\u200b'; // empty name group
        if (!employeeGroups.has(key)) employeeGroups.set(key, []);
        employeeGroups.get(key)!.push(row);
      });

      Array.from(employeeGroups.entries()).forEach(([, groupRows]) => {
        groupRows.forEach((row) => byEmployeeData.push(rowToExportObj(row)));

        const totalShift = groupRows.length;
        const totalTravel = groupRows.reduce((s, r) => s + (Number(r.travelTime) || 0), 0);
        const totalReg = groupRows.reduce((s, r) => s + (Number(r.regularHours) || 0), 0);
        const totalOT811 = groupRows.reduce((s, r) => s + (Number(r.overtime8To11) || 0), 0);
        const totalDT11 = groupRows.reduce((s, r) => s + (Number(r.doubleTime11Plus) || 0), 0);
        const totalNS1Reg = groupRows.reduce((s, r) => s + (Number(r.ns1Regular) || 0), 0);
        const totalNS1OT = groupRows.reduce((s, r) => s + (Number(r.ns1Overtime) || 0), 0);
        const totalNS1DT = groupRows.reduce((s, r) => s + (Number(r.ns1DoubleTime) || 0), 0);
        const totalNS2Reg = groupRows.reduce((s, r) => s + (Number(r.ns2Regular) || 0), 0);
        const totalNS2OT = groupRows.reduce((s, r) => s + (Number(r.ns2Overtime) || 0), 0);
        const totalNS2DT = groupRows.reduce((s, r) => s + (Number(r.ns2DoubleTime) || 0), 0);

        byEmployeeData.push({
          ...EMPTY_ROW,
          Employee: `Total (${totalShift} shift${totalShift !== 1 ? 's' : ''})`,
          Travel: totalTravel > 0 ? totalTravel.toFixed(2) : '',
          'Reg (hrs)': totalReg > 0 ? totalReg.toFixed(2) : '',
          'OT 8–11': totalOT811 > 0 ? totalOT811.toFixed(2) : '',
          'DT 11+': totalDT11 > 0 ? totalDT11.toFixed(2) : '',
          'NS1 Reg': totalNS1Reg > 0 ? totalNS1Reg.toFixed(2) : '',
          'NS1 OT': totalNS1OT > 0 ? totalNS1OT.toFixed(2) : '',
          'NS1 DT': totalNS1DT > 0 ? totalNS1DT.toFixed(2) : '',
          'NS2 Reg': totalNS2Reg > 0 ? totalNS2Reg.toFixed(2) : '',
          'NS2 OT': totalNS2OT > 0 ? totalNS2OT.toFixed(2) : '',
          'NS2 DT': totalNS2DT > 0 ? totalNS2DT.toFixed(2) : '',
        });
        byEmployeeData.push(EMPTY_ROW);
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Tracker');
      const worksheetByEmployee = XLSX.utils.json_to_sheet(byEmployeeData);
      XLSX.utils.book_append_sheet(workbook, worksheetByEmployee, 'By Employee');
      const startStr = exportStart.format('YYYY-MM-DD');
      const endStr = exportEnd.format('YYYY-MM-DD');
      const filename = `Sales_Tracker_${startStr}_${endStr}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`Exported ${rows.length} rows to ${filename} (2 sheets)`);
      setExportDialogOpen(false);
    } catch (err) {
      console.error('Export Sales Tracker error:', err);
      toast.error('Failed to export sales tracker');
    } finally {
      setIsExporting(false);
    }
  }, [exportStart, exportEnd]);

  return (
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
      <FormControl sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 200 } }}>
        <InputLabel id="sales-tracker-service-label">Service</InputLabel>
        <Select
          labelId="sales-tracker-service-label"
          value={currentFilters.service}
          onChange={handleServiceChange}
          label="Service"
          input={<OutlinedInput label="Service" />}
        >
          {SALES_TRACKER_SERVICE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Autocomplete
        multiple
        options={customerOptions}
        value={currentFilters.customer ?? []}
        onChange={(event, newValue) => {
          onResetPage();
          updateFilters({ customer: newValue });
        }}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name ?? '')}
        isOptionEqualToValue={(option, value) => option?.id === value?.id}
        renderInput={(params) => (
          <TextField {...params} label="Customer" placeholder="Search customer..." />
        )}
        renderTags={() => []}
        renderOption={(props, option, { selected }) => {
          // key omitted so we use option.id for list key
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { key, ...otherProps } = props as any;
          return (
            <Box component="li" key={option.id} {...otherProps}>
              <Checkbox disableRipple size="small" checked={selected} />
              {option.name}
            </Box>
          );
        }}
        filterOptions={(options, { inputValue }) => {
          if (!inputValue) return options;
          return options.filter((opt) =>
            (opt.name ?? '').toLowerCase().includes(inputValue.toLowerCase())
          );
        }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}
      />

      <Autocomplete
        multiple
        options={employeeOptions}
        value={currentFilters.employee ?? []}
        onChange={(event, newValue) => {
          onResetPage();
          updateFilters({ employee: newValue });
        }}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name ?? '')}
        isOptionEqualToValue={(option, value) => option?.id === value?.id}
        renderInput={(params) => (
          <TextField {...params} label="Employee" placeholder="Search employee..." />
        )}
        renderTags={() => []}
        renderOption={(props, option, { selected }) => {
          // key omitted so we use option.id for list key
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { key, ...otherProps } = props as any;
          return (
            <Box component="li" key={option.id} {...otherProps}>
              <Checkbox disableRipple size="small" checked={selected} />
              {option.name}
            </Box>
          );
        }}
        filterOptions={(options, { inputValue }) => {
          if (!inputValue) return options;
          return options.filter((opt) =>
            (opt.name ?? '').toLowerCase().includes(inputValue.toLowerCase())
          );
        }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 300 } }}
      />

      <DatePicker
        label="Start date"
        value={currentFilters.startDate}
        onChange={handleFilterStartDate}
        slotProps={{ textField: { fullWidth: true } }}
        sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%', md: 180 } }}
      />

      <DatePicker
        label="End date"
        value={currentFilters.endDate}
        onChange={handleFilterEndDate}
        minDate={currentFilters.startDate || undefined}
        slotProps={{
          textField: {
            fullWidth: true,
            error: dateError,
            helperText: dateError ? 'End date must be later than start date' : null,
          },
        }}
        sx={{
          width: { xs: 1, md: '100%' },
          maxWidth: { xs: '100%', md: 180 },
          [`& .${formHelperTextClasses.root}`]: {
            bottom: { md: -40 },
            position: { md: 'absolute' },
          },
        }}
      />

      <Box
        sx={{
          flexGrow: 1,
          minWidth: { xs: 0, md: 280 },
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: '100%', minWidth: 0 }}
        />
        <IconButton onClick={menuActions.onOpen} aria-label="More actions">
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </Box>

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={handleOpenExportDialog}
          >
            <Iconify icon="solar:export-bold" />
            Export Sales Tracker
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <Dialog
        open={exportDialogOpen}
        onClose={() => {
          setExportDialogOpen(false);
          setExportDateError(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Sales Tracker</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select date range to export sales tracker data:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row' }}>
              <DatePicker
                label="Start Date"
                value={exportStart}
                onChange={(newValue) => {
                  setExportStart(newValue);
                  setExportDateError(false);
                }}
                slotProps={{
                  textField: {
                    sx: { width: '50%' },
                    error: exportDateError && !exportStart,
                    helperText: exportDateError && !exportStart ? 'Required' : '',
                  },
                }}
              />
              <DatePicker
                label="End Date"
                value={exportEnd}
                onChange={(newValue) => {
                  setExportEnd(newValue);
                  setExportDateError(false);
                }}
                slotProps={{
                  textField: {
                    sx: { width: '50%' },
                    error: exportDateError && !exportEnd,
                    helperText: exportDateError && !exportEnd ? 'Required' : '',
                  },
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Default range is the current 2-week period. Export includes all columns shown in the sales tracker table.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleExportSalesTracker}
            variant="contained"
            disabled={isExporting}
            startIcon={
              isExporting ? (
                <CircularProgress size={20} />
              ) : (
                <Iconify icon="solar:export-bold" />
              )
            }
            sx={{ width: '100%' }}
          >
            {isExporting ? 'Exporting...' : 'Export Sales Tracker'}
          </Button>
          <Button
            onClick={() => setExportDialogOpen(false)}
            variant="outlined"
            disabled={isExporting}
            sx={{ width: '100%' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
