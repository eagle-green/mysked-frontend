import React, { useState } from 'react';
import {
  Box,
  Card,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  FormControlLabel,
  Switch,
  FormControl,
  Select,
  MenuItem as MuiMenuItem,
  Pagination,
  PaginationItem,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Checkbox
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, FormProvider } from 'react-hook-form';
import { Scrollbar } from 'src/components/scrollbar';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { Iconify } from 'src/components/iconify';
import { Timesheet, MOCK_TIMESHEETS, StatusType, statusColors } from './types';
import { TimesheetTableToolbar } from './admin-timesheet-table-toolbar';
import { TimesheetTableRow } from './admin-timesheet-table-row';
import { TimesheetTableFilterResult } from './admin-timesheet-table-filter-result';
import { TimesheetEditView } from './admin-timesheet-edit-view';

export function TimesheetListView() {
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'All' | StatusType>('All');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(4);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState('');
  const [dialogType, setDialogType] = useState<'view' | 'edit' | 'delete' | null>(null);
  const [dense, setDense] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const methods = useForm({
    defaultValues: {
      startDate: '',
      endDate: '',
    },
  });

  const { watch } = methods;
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const selectedItem = MOCK_TIMESHEETS.find((item) => item.id === selectedId);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedId(id);
  };

  const handleCloseMenu = () => setMenuAnchor(null);

  const handleDialog = (type: typeof dialogType, id: string) => {
    setSelectedId(id);
    setDialogType(type);
    handleCloseMenu();
  };

  const handleCloseDialog = () => setDialogType(null);

  const hasActiveFilters = search !== '' || statusTab !== 'All' || startDate !== '' || endDate !== '';

  const filtered = MOCK_TIMESHEETS.filter((item) => {
    const matchSearch =
      item.clientName.toLowerCase().includes(search.toLowerCase()) ||
      item.submittedBy.name.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusTab === 'All' || item.status === statusTab;

    const inRange =
      (!startDate || new Date(item.startTime) >= new Date(startDate)) &&
      (!endDate || new Date(item.endTime) <= new Date(endDate));

    return matchSearch && matchStatus && inRange;
  });

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleClearFilters = () => {
    setSearch('');
    setStatusTab('All');
    methods.reset({
      startDate: '',
      endDate: ''
    });
  };

  // Selection handlers
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginated.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelected(prev => 
      checked 
        ? [...prev, id] 
        : prev.filter(item => item !== id)
    );
  };

  const handleDeleteSelected = () => {
    // Implement your delete logic here
    console.log('Deleting selected:', selected);
    setSelected([]);
  };

  const handleExportSelected = () => {
    // Implement your export logic here
    console.log('Exporting selected:', selected);
  };

  const handlePrintSelected = () => {
    // Implement your print logic here
    console.log('Printing selected:', selected);
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Admin Timesheets"
        links={[{ name: 'Management', href: paths.dashboard.root }, { name: 'Timesheet' }]}
        action={
          <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>
            New Timesheet
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <TimesheetTableToolbar
          search={search}
          onSearchChange={setSearch}
          statusTab={statusTab}
          onStatusTabChange={setStatusTab}
          methods={methods}
          selectedCount={selected.length}
          onSelectAllClick={handleSelectAllClick}
          onDeleteSelected={handleDeleteSelected}
          onExportSelected={handleExportSelected}
          onPrintSelected={handlePrintSelected}
        />

        {hasActiveFilters && (
          <TimesheetTableFilterResult
            filteredCount={filtered.length}
            statusTab={statusTab}
            onClearFilters={handleClearFilters}
          />
        )}

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < paginated.length}
                      checked={selected.length > 0 && selected.length === paginated.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  <TableCell>Job #</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Submitted By</TableCell>
                  <TableCell>Approved By</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">More</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((row) => (
                  <TimesheetTableRow
                    key={row.id}
                    row={row}
                    selected={selected.includes(row.id)}
                    onSelectRow={handleSelectRow}
                    onOpenMenu={handleOpenMenu}
                  />
                ))}
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 3,
          px: 1
        }}>
          <FormControlLabel
            control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} size="small" />}
            label="Dense"
            sx={{ m: 0 }}
          />

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">Rows per page:</Typography>
              <FormControl size="small" variant="standard">
                <Select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  disableUnderline
                  sx={{
                    '& .MuiSelect-select': {
                      paddingRight: '24px',
                      paddingLeft: '8px',
                      minHeight: 'auto'
                    }
                  }}
                >
                  {[4, 10, 20].map((val) => (
                    <MuiMenuItem key={val} value={val}>{val}</MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Typography variant="body2">
              {`${(page - 1) * rowsPerPage + 1}-${Math.min(page * rowsPerPage, filtered.length)} of ${filtered.length}`}
            </Typography>

            <Pagination
              count={Math.ceil(filtered.length / rowsPerPage)}
              page={page}
              onChange={(e, val) => setPage(val)}
              color="primary"
              size="small"
              shape="rounded"
              showFirstButton={false}
              showLastButton={false}
              hideNextButton={false}
              hidePrevButton={false}
              siblingCount={0}
              boundaryCount={0}
              renderItem={(item) => {
                if (item.type === 'page') {
                  return null;
                }
                return (
                  <PaginationItem
                    {...(item as any)}
                    sx={{
                      '&.Mui-selected': {
                        display: 'none'
                      }
                    }}
                  />
                );
              }}
            />
          </Box>
        </Box>
      </Card>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 140,
            borderRadius: 1,
            py: 0.5,
            mt: 1,
          }
        }}
      >
        <MenuItem 
          onClick={() => handleDialog('edit', selectedId)}
          sx={{ py: 1 }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => handleDialog('delete', selectedId)}
          sx={{ 
            py: 1,
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.lighter'
            }
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
          Delete
        </MenuItem>
      </Menu>

      <TimesheetEditView
        open={dialogType === 'edit'}
        onClose={handleCloseDialog}
        selectedItem={selectedItem || null}
      />

      <Dialog 
        open={dialogType === 'delete'} 
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this timesheet?
          </Typography>
          {selectedItem && (
            <Box sx={{ 
              p: 1.5,
              mt: 1,
              backgroundColor: 'action.hover',
              borderRadius: 1
            }}>
              <Typography variant="subtitle2">
                <strong>Job #:</strong> {selectedItem.id}
              </Typography>
              <Typography variant="subtitle2">
                <strong>Client:</strong> {selectedItem.clientName}
              </Typography>
              <Typography variant="subtitle2">
                <strong>Date:</strong> {new Date(selectedItem.startTime).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCloseDialog}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            sx={{ minWidth: 100 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}