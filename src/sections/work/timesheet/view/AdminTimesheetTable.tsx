import React, { useState } from 'react';
import {
  Box,
  Card,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Typography,
  TextField,
  Avatar,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Pagination,
  InputAdornment,
  Menu,
  MenuItem,
  FormControl,
  Select,
  MenuItem as MuiMenuItem,
  Switch,
  FormControlLabel,
  PaginationItem,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';


import { Scrollbar } from 'src/components/scrollbar';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { Iconify } from 'src/components/iconify';

type StatusType = 'Submitted' | 'Approved' | 'Rejected' | 'Draft';

const MOCK_TIMESHEETS = [
  {
    id: 'JO-101',
    clientName: 'BrightSoft Technologies',
    startTime: '2025-07-15T09:00:00',
    endTime: '2025-07-15T17:00:00',
    status: 'Submitted',
    submittedBy: { name: 'Hassan Iqbal', avatar: '', role: 'Engineer' },
    approvedBy: 'Usman Tariq',
  },
  {
    id: 'JO-102',
    clientName: 'Vertex Builders',
    startTime: '2025-07-14T08:30:00',
    endTime: '2025-07-14T16:30:00',
    status: 'Approved',
    submittedBy: { name: 'Fatima Noor', avatar: '', role: 'Supervisor' },
    approvedBy: 'Ali Hussain',
  },
  {
    id: 'JO-103',
    clientName: 'NextGen Innovations',
    startTime: '2025-07-13T10:00:00',
    endTime: '2025-07-13T18:00:00',
    status: 'Rejected',
    submittedBy: { name: 'Zain Raza', avatar: '', role: 'Field Agent' },
    approvedBy: 'N/A',
  },
  {
    id: 'JO-104',
    clientName: 'Greenline Projects',
    startTime: '2025-07-12T09:15:00',
    endTime: '2025-07-12T17:15:00',
    status: 'Draft',
    submittedBy: { name: 'Mehwish Shah', avatar: '', role: 'Analyst' },
    approvedBy: 'Pending',
  },
  {
    id: 'JO-105',
    clientName: 'Technovate Pvt Ltd',
    startTime: '2025-07-11T07:00:00',
    endTime: '2025-07-11T15:00:00',
    status: 'Approved',
    submittedBy: { name: 'Ahmed Junaid', avatar: '', role: 'Technician' },
    approvedBy: 'Ayesha Babar',
  },
  {
    id: 'JO-106',
    clientName: 'SkyCore Solutions',
    startTime: '2025-07-10T11:00:00',
    endTime: '2025-07-10T19:00:00',
    status: 'Submitted',
    submittedBy: { name: 'Rubina Tariq', avatar: '', role: 'Coordinator' },
    approvedBy: 'Bilal Nasir',
  },
  {
    id: 'JO-107',
    clientName: 'CloudFront Co.',
    startTime: '2025-07-09T08:45:00',
    endTime: '2025-07-09T16:45:00',
    status: 'Rejected',
    submittedBy: { name: 'Zeeshan Waqar', avatar: '', role: 'Admin' },
    approvedBy: 'N/A',
  },
];

const statusColors: Record<StatusType, { color: string; background: string }> = {
  Submitted: { color: '#0F172A', background: '#A5F3FC' },
  Approved: { color: '#065F46', background: '#BBF7D0' },
  Rejected: { color: '#991B1B', background: '#FECACA' },
  Draft: { color: '#6B21A8', background: '#E9D5FF' },
};

export function AdminTimesheetTable() {
  const [dateInputType, setDateInputType] = useState<'text' | 'date'>('text');
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'All' | StatusType>('All');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(4);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState('');
  const [dialogType, setDialogType] = useState<'view' | 'edit' | 'delete' | null>(null);
  const [dense, setDense] = useState(false);

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

  const hasActiveFilters = (search: string, dateRange: [string, string], statusTab: string) => {
    return search !== '' || dateRange[0] !== '' || dateRange[1] !== '' || statusTab !== 'All';
  };

  const filtered = MOCK_TIMESHEETS.filter((item) => {
    const matchSearch =
      item.clientName.toLowerCase().includes(search.toLowerCase()) ||
      item.submittedBy.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusTab === 'All' ? true : item.status === statusTab;
    const [start, end] = dateRange;
    const inRange =
      !start || !end || (new Date(item.startTime) >= new Date(start) && new Date(item.endTime) <= new Date(end));
    return matchSearch && matchStatus && inRange;
  });

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
        <Tabs
          value={statusTab}
          onChange={(e, val) => { setStatusTab(val); setPage(1); }}
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker
                label="Start Date"
                value={dateRange[0] ? dayjs(dateRange[0]) : null}
                onChange={(newValue) => {
                  setDateRange([newValue ? newValue.format('YYYY-MM-DD') : '', dateRange[1]]);
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    required: true,
                  },
                }}
              />

              <DatePicker
                label="End Date"
                value={dateRange[1] ? dayjs(dateRange[1]) : null}
                onChange={(newValue) => {
                  setDateRange([dateRange[0], newValue ? newValue.format('YYYY-MM-DD') : '']);
                }}
                minDate={dateRange[0] ? dayjs(dateRange[0]) : dayjs()}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Box>


            <TextField
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 200 }}
            />
          </Stack>

          {hasActiveFilters(search, dateRange, statusTab) && (
            <Stack direction="row" justifyContent="flex-start" alignItems="center" mb={2} spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {filtered.length} results found
              </Typography>
              {statusTab !== 'All' && (
                <Chip
                  label={`Status: ${statusTab}`}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    background: statusColors[statusTab as StatusType].background,
                    color: statusColors[statusTab as StatusType].color,
                  }}
                />
              )}
              <Button
                size="small"
                color="error"
                variant="text"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  setSearch('');
                  setStatusTab('All');
                  setDateRange(['', '']);
                }}
              >
                Clear
              </Button>
            </Stack>
          )}

          <Box sx={{ position: 'relative' }}>
            <Scrollbar>
              <Table size={dense ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
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
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.clientName}</TableCell>
                      <TableCell>
                        <ListItemText
                          primary={new Date(row.startTime).toLocaleDateString()}
                          secondary={`${new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(row.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar src={row.submittedBy.avatar} />
                          <ListItemText primary={row.submittedBy.name} secondary={row.submittedBy.role} />
                        </Stack>
                      </TableCell>
                      <TableCell>{row.approvedBy}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          sx={{
                            background: statusColors[row.status as StatusType].background,
                            color: statusColors[row.status as StatusType].color,
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={(e) => handleOpenMenu(e, row.id)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
            <MenuItem onClick={() => handleDialog('edit', selectedId)}>Edit</MenuItem>
            <MenuItem onClick={() => handleDialog('delete', selectedId)}>
             
              Delete
            </MenuItem>
          </Menu>

          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 3,
            px: 1
          }}>
            {/* Left side - Only Dense toggle */}
            <FormControlLabel
              control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} size="small" />}
              label="Dense"
              sx={{ m: 0 }}
            />

            {/* Right side - Rows per page, page info, and Pagination arrows */}
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
                    return null; // Don't render page numbers
                  }
                  return (
                    <PaginationItem
                      {...(item as any)}

                      sx={{
                        '&.Mui-selected': {
                          display: 'none' // Hide selected page number
                        }
                      }}
                    />
                  );
                }}
              />
            </Box>
          </Box>
        </Box>
      </Card>

      <Dialog open={dialogType === 'view'} onClose={handleCloseDialog} fullWidth>
        <DialogTitle>View Timesheet</DialogTitle>
        <DialogContent dividers>
          {selectedItem ? <pre>{JSON.stringify(selectedItem, null, 2)}</pre> : <Typography>Loading...</Typography>}
        </DialogContent>
        <DialogActions><Button onClick={handleCloseDialog}>Back</Button></DialogActions>
      </Dialog>

      <Dialog open={dialogType === 'edit'} onClose={handleCloseDialog} fullWidth>
        <DialogTitle>Edit Timesheet</DialogTitle>
        <DialogContent dividers>
          {selectedItem ? <pre>{JSON.stringify(selectedItem, null, 2)}</pre> : <Typography>Loading...</Typography>}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="error">Reject</Button>
          <Button variant="outlined" color="success">Approve</Button>
          <Button onClick={handleCloseDialog}>Back</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogType === 'delete'} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          Are you sure you want to delete <strong>{selectedItem?.id || '...'}</strong>?
        </DialogContent>
        <DialogActions>
          <Button color="error" variant="contained" onClick={handleCloseDialog}>Delete</Button>
          <Button onClick={handleCloseDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}