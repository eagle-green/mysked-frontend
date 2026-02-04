import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { IInventoryTableFilters } from 'src/types/inventory';

import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import { usePopover } from 'minimal-shared/hooks';
import { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useInventoryTypes } from 'src/hooks/use-inventory-types';

import { fetcher } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';


// ----------------------------------------------------------------------

type FilterOption = {
  value: string;
  label: string;
};

type Props = {
  onResetPage: () => void;
  filters: UseSetStateReturn<IInventoryTableFilters>;
  options: {
    status: FilterOption[];
  };
};

type ExportRow = {
  item_name: string;
  item_type: string;
  total_qty: number;
  available_qty: number;
  deployed_qty: number;
  damaged_qty: number;
  missing_qty: number;
};

function InventoryTableToolbarComponent({
  options,
  filters,
  onResetPage,
}: Props) {
  const menuActions = usePopover();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const { state: currentFilters, setState: updateFilters } = filters;
  const { data: inventoryTypesData = [] } = useInventoryTypes();
  const inventoryTypes = Array.isArray(inventoryTypesData) ? inventoryTypesData : [];
  
  // Format inventory types for the filter dropdown
  const formatTypeLabel = (value: string) =>
    value
      .split('_')
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(' ');

  const typeOptions = inventoryTypes.map((t) => ({
    value: t.value,
    label: formatTypeLabel(t.value),
  }));

  const [category, setCategory] = useState<string[]>(currentFilters.category || []);
  const [query, setQuery] = useState<string>(currentFilters.query || '');

  // Export query
  const { refetch: refetchExport, isFetching: isExporting } = useQuery({
    queryKey: ['inventory-export', currentFilters.query, currentFilters.category],
    queryFn: async () => {
      const params = new URLSearchParams();
      const trimmedQuery = (currentFilters.query || '').trim();
      if (trimmedQuery) params.set('search', trimmedQuery);
      if (currentFilters.category.length > 0) params.set('category', currentFilters.category.join(','));
      const response = await fetcher(`/api/inventory/export?${params.toString()}`);
      return response;
    },
    enabled: false,
  });

  const generateWorksheetData = useCallback((rows: ExportRow[]) => {
    const headers = [
      'Item Name',
      'Item Type',
      'Total Qty',
      'Available Qty',
      'Deployed Qty',
      'Damaged Qty',
      'Missing Qty',
      'Condition',
      'Notes',
    ];
    const dataRows = rows.map((row) => [
      row.item_name || '',
      row.item_type ? row.item_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '',
      row.total_qty ?? 0,
      row.available_qty ?? 0,
      row.deployed_qty ?? 0,
      row.damaged_qty ?? 0,
      row.missing_qty ?? 0,
      '', // Condition - empty
      '', // Notes - empty
    ]);
    return [headers, ...dataRows];
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const response = await refetchExport();
      const data = response.data;

      if (!data || !data.data?.inventory) {
        toast.error('No inventory data found for export');
        return;
      }

      const rows = data.data.inventory as ExportRow[];
      if (rows.length === 0) {
        toast.error('No inventory data found for export');
        return;
      }

      const workbook = XLSX.utils.book_new();
      const worksheetData = generateWorksheetData(rows);
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const columnWidths = [
        { wch: 24 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 24 },
      ];
      worksheet['!cols'] = columnWidths;
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

      const date = new Date().toISOString().split('T')[0];
      const filename = `inventory_export_${date}.xlsx`;
      XLSX.writeFile(workbook, filename);

      setExportDialogOpen(false);
      toast.success(`Excel file exported successfully with ${rows.length} items!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export inventory data');
    }
  }, [refetchExport, generateWorksheetData]);

  // Sync local state with filters when filters change externally (e.g., reset or chip removal)
  useEffect(() => {
    setQuery(currentFilters.query || '');
  }, [currentFilters.query]);

  // Sync local category state with filters when filters change externally
  useEffect(() => {
    setCategory(currentFilters.category || []);
  }, [currentFilters.category]);

  // Debounce parent filter updates to prevent re-renders on every keystroke
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== currentFilters.query) {
        onResetPage();
        updateFilters({ query });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, currentFilters.query, updateFilters, onResetPage]);

  const handleFilterQuery = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setQuery(newValue); // Update local state immediately
      // Parent update is debounced via useEffect above
    },
    []
  );

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem
          onClick={() => {
            setExportDialogOpen(true);
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:export-bold" />
          Export Inventory
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
        <FilterSelect
          label="Type"
          value={category}
          options={typeOptions}
          onChange={(event) => {
            const value = event.target.value;
            const parsedValue = typeof value === 'string' ? value.split(',') : value;
            setCategory(parsedValue);
            onResetPage();
            updateFilters({ category: parsedValue });
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
            value={query}
            onChange={handleFilterQuery}
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
            sx={{ width: { xs: 1, md: '100%' }, maxWidth: { xs: '100%' } }}
          />

          <IconButton onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Box>
      </Box>

      {renderMenuActions()}

      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Inventory</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Export inventory data based on current filters:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Search: {currentFilters.query || 'All items'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Type: {currentFilters.category.length > 0 ? currentFilters.category.join(', ') : 'All types'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            • Format: Excel (.xlsx)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Columns: Item Name, Item Type, Total Qty, Available Qty, Deployed Qty, Damaged Qty,
            Missing Qty, Condition, Notes
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={isExporting}
            startIcon={
              isExporting ? <CircularProgress size={20} /> : <Iconify icon="solar:export-bold" />
            }
          >
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export const InventoryTableToolbar = memo(InventoryTableToolbarComponent);

// ----------------------------------------------------------------------

type FilterSelectProps = {
  label: string;
  value: string[];
  options: FilterOption[];
  onChange: (event: SelectChangeEvent<string[]>) => void;
};

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  const id = `filter-${label.toLowerCase()}-select`;

  return (
    <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}>
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <Select
        multiple
        label={label}
        value={value}
        onChange={onChange}
        renderValue={(selected) => {
          // Maintain selection order when displaying in the select field
          const output = selected
            .map((val) => {
              const option = options.find((opt) => opt.value === val);
              return option?.label || val;
            })
            .filter(Boolean);

          return output.join(', ');
        }}
        inputProps={{ id }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300,
              width: 250,
            },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Checkbox
              disableRipple
              size="small"
              checked={value.includes(option.value)}
              slotProps={{ input: { id: `${option.value}-checkbox` } }}
            />
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
