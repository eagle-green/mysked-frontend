import React from 'react';
import { Box, Tabs, Tab, Stack, Typography, TextField, InputAdornment, IconButton, Menu, MenuItem, Checkbox, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PrintIcon from '@mui/icons-material/Print';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import { FormProvider } from 'react-hook-form';
import { RHFDatePicker } from 'src/components/hook-form/rhf-date-picker';
import { Timesheet, MOCK_TIMESHEETS, StatusType, statusColors } from './types';

interface TimesheetTableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusTab: 'All' | StatusType;
  onStatusTabChange: (value: 'All' | StatusType) => void;
  methods: any;
  selectedCount: number;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteSelected: () => void;
  onExportSelected: () => void;
  onPrintSelected: () => void;
}

export function TimesheetTableToolbar({
  search,
  onSearchChange,
  statusTab,
  onStatusTabChange,
  methods,
  selectedCount,
  onSelectAllClick,
  onDeleteSelected,
  onExportSelected,
  onPrintSelected,
}: TimesheetTableToolbarProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {/* Added selection bar - appears only when items are selected */}
      {selectedCount > 0 && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{
            px: 2,
            py: 1,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Checkbox
            checked={selectedCount === MOCK_TIMESHEETS.length}
            indeterminate={selectedCount > 0 && selectedCount < MOCK_TIMESHEETS.length}
            onChange={onSelectAllClick}
          />
          <Typography variant="subtitle1">
            {selectedCount} selected
          </Typography>
          
          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<ImportExportIcon />}
              onClick={onExportSelected}
            >
              Export
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<PrintIcon />}
              onClick={onPrintSelected}
            >
              Print
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              color="error"
              onClick={onDeleteSelected}
            >
              Delete
            </Button>
          </Stack>
        </Stack>
      )}

      {/* Your existing code below - completely unchanged */}
      <Tabs
        value={statusTab}
        onChange={(e, val) => onStatusTabChange(val)}
        sx={(theme) => ({
          px: 2.5,
          boxShadow: `inset 0 -2px 0 0 ${theme.palette.grey[300]}`,
        })}
      >
        {['All', 'Draft', 'Submitted', 'Approved', 'Rejected'].map((status) => {
          const count = status === 'All'
            ? MOCK_TIMESHEETS.length
            : MOCK_TIMESHEETS.filter((item) => item.status === status).length;
          return (
            <Tab
              key={status}
              value={status}
              iconPosition="end"
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography fontWeight={600} color="text.primary">{status}</Typography>
                  <Box
                    sx={{
                      px: 1,
                      borderRadius: 1,
                      fontSize: 12,
                      fontWeight: 600,
                      background: status !== 'All'
                        ? statusColors[status as StatusType].background
                        : '#E2E8F0',
                      color: status !== 'All'
                        ? statusColors[status as StatusType].color
                        : '#000',
                    }}
                  >
                    {count}
                  </Box>
                </Stack>
              }
            />
          );
        })}
      </Tabs>

      <Box sx={{ px: 3, pt: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2} flexWrap="wrap">
          <FormProvider {...methods}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <RHFDatePicker
                name="startDate"
                label="Start Date"
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    placeholder: 'dd/mm/yyyy',
                    size: 'small',
                    fullWidth: true,
                    InputLabelProps: {
                      shrink: true,
                    },
                    inputProps: {
                      inputMode: 'numeric',
                    },
                  },
                }}
              />

              <RHFDatePicker
                name="endDate"
                label="End Date"
                slotProps={{
                  textField: {
                    placeholder: 'dd/mm/yyyy',
                    size: 'small',
                    fullWidth: true,
                    InputLabelProps: {
                      shrink: true
                    }
                  }
                }}
              />
            </Box>
          </FormProvider>

          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 200, position: 'relative' }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <IconButton
              aria-label="more"
              aria-controls="long-menu"
              aria-haspopup="true"
              onClick={handleMenuClick}
              sx={{ ml: 1 }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              id="long-menu"
              anchorEl={anchorEl}
              keepMounted
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                style: {
                  width: '20ch',
                },
              }}
            >
              <MenuItem onClick={handleMenuClose}>
                <PrintIcon sx={{ mr: 1 }} /> Print
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <ImportExportIcon sx={{ mr: 1 }} /> Import
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <ImportExportIcon sx={{ mr: 1 }} /> Export
              </MenuItem>
            </Menu>
          </Box>
        </Stack>
      </Box>
    </>
  );
}