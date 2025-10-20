import type { TableHeadCellProps } from 'src/components/table';
import type { IUser, IUserTableFilters } from 'src/types/user';

import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { deleteAllUserAssets } from 'src/utils/cloudinary-upload';

import { roleList } from 'src/assets/data';
import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { USER_STATUS_OPTIONS } from 'src/assets/data/user';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { UserTableRow } from '../user-table-row';
import { UserTableToolbar } from '../user-table-toolbar';
import { UserTableFiltersResult } from '../user-table-filters-result';

// ----------------------------------------------------------------------

// Certification requirements for each role
const CERTIFICATION_REQUIREMENTS: Record<string, string[]> = {
  'tcp': ['tcp_certification'],
  'lct': ['tcp_certification', 'driver_license'],
  'hwy': ['tcp_certification', 'driver_license'],
  'lct/tcp': ['tcp_certification', 'driver_license'],
  'field_supervisor': ['tcp_certification', 'driver_license'],
};

// Function to check if a certification is valid (not expired)
const isCertificationValid = (expiryDate: string | null | undefined): boolean => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  return expiry >= today;
};

// Function to check if a certification expires within 30 days and return days remaining
const getCertificationExpiringSoon = (expiryDate: string | null | undefined): { isExpiringSoon: boolean; daysRemaining: number } => {
  if (!expiryDate) return { isExpiringSoon: false, daysRemaining: 0 };
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  expiry.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const timeDiff = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return {
    isExpiringSoon: daysRemaining >= 0 && daysRemaining <= 30,
    daysRemaining,
  };
};

// Function to check if user meets certification requirements
const checkUserCertifications = (user: IUser): { 
  isValid: boolean; 
  missing: string[]; 
  expired: string[];
  expiringSoon: Array<{ name: string; daysRemaining: number }>;
  hasMissing: boolean;
  hasExpired: boolean;
  hasExpiringSoon: boolean;
  hasCriticalExpiringSoon: boolean;
} => {
  const requirements = CERTIFICATION_REQUIREMENTS[user.role as keyof typeof CERTIFICATION_REQUIREMENTS];
  
  if (!requirements) {
    return { 
      isValid: true, 
      missing: [], 
      expired: [], 
      expiringSoon: [],
      hasMissing: false, 
      hasExpired: false,
      hasExpiringSoon: false,
      hasCriticalExpiringSoon: false,
    };
  }

  const missing: string[] = [];
  const expired: string[] = [];
  const expiringSoon: Array<{ name: string; daysRemaining: number }> = [];
  
  if (requirements.includes('tcp_certification')) {
    if (!user.tcp_certification_expiry) {
      missing.push('TCP Certification');
    } else if (!isCertificationValid(user.tcp_certification_expiry)) {
      expired.push('TCP Certification');
    } else {
      const expiringInfo = getCertificationExpiringSoon(user.tcp_certification_expiry);
      if (expiringInfo.isExpiringSoon) {
        expiringSoon.push({ name: 'TCP Certification', daysRemaining: expiringInfo.daysRemaining });
      }
    }
  }
  
  if (requirements.includes('driver_license')) {
    if (!user.driver_license_expiry) {
      missing.push('Driver License');
    } else if (!isCertificationValid(user.driver_license_expiry)) {
      expired.push('Driver License');
    } else {
      const expiringInfo = getCertificationExpiringSoon(user.driver_license_expiry);
      if (expiringInfo.isExpiringSoon) {
        expiringSoon.push({ name: 'Driver License', daysRemaining: expiringInfo.daysRemaining });
      }
    }
  }

  const hasCriticalExpiringSoon = expiringSoon.some(cert => cert.daysRemaining < 15);

  return {
    isValid: missing.length === 0 && expired.length === 0,
    missing,
    expired,
    expiringSoon,
    hasMissing: missing.length > 0,
    hasExpired: expired.length > 0,
    hasExpiringSoon: expiringSoon.length > 0,
    hasCriticalExpiringSoon,
  };
};

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...USER_STATUS_OPTIONS];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'name', label: 'Name' },
  { id: 'role', label: 'Role' },
  { id: 'phone_number', label: 'Phone Number' },
  { id: 'email', label: 'Email' },
  { id: 'status', label: 'Status' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function UserListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize table state from URL parameters
  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const filters = useSetState<IUserTableFilters>({ 
    query: searchParams.get('search') || '', 
    role: searchParams.get('role') ? searchParams.get('role')!.split(',') : [],
    status: searchParams.get('status') || 'all' 
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Update URL when table state changes
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    
    // Always add pagination and sorting params to make URLs shareable
    params.set('page', (table.page + 1).toString());
    params.set('rowsPerPage', table.rowsPerPage.toString());
    params.set('orderBy', table.orderBy);
    params.set('order', table.order);
    params.set('dense', table.dense.toString());
    
    // Add filter params
    if (currentFilters.query) params.set('search', currentFilters.query);
    if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
    if (currentFilters.role.length > 0) params.set('role', currentFilters.role.join(','));
    
    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [table.page, table.rowsPerPage, table.orderBy, table.order, table.dense, currentFilters, router]);

  // Update URL when relevant state changes
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Reset page when filters change (but not when page itself changes)
  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters.query, currentFilters.status, currentFilters.role]);

  const confirmDialog = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);

  // React Query for fetching user list with server-side pagination
  const { data: userListResponse, refetch } = useQuery({
    queryKey: [
      'users', 
      table.page, 
      table.rowsPerPage, 
      table.orderBy, 
      table.order, 
      currentFilters.query,
      currentFilters.status,
      currentFilters.role.join(',')
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy: table.orderBy,
        order: table.order,
        ...(currentFilters.status !== 'all' && { status: currentFilters.status }),
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.role.length > 0 && { roles: currentFilters.role.join(',') }),
      });
      
      const response = await fetcher(`${endpoints.management.user}?${params.toString()}`);
      return response.data;
    },
  });

  // Fetch status counts for tabs
  const { data: statusCountsResponse } = useQuery({
    queryKey: ['user-status-counts', currentFilters.query, currentFilters.role.join(',')],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(currentFilters.query && { search: currentFilters.query }),
        ...(currentFilters.role.length > 0 && { roles: currentFilters.role.join(',') }),
      });
      
      const response = await fetcher(`${endpoints.management.user}/counts/status?${params.toString()}`);
      return response;
    },
  });

  // Use the fetched data or fallback to empty array
  const tableData = useMemo(() => userListResponse?.users || [], [userListResponse]);
  const totalCount = userListResponse?.pagination?.totalCount || 0;
  const statusCounts = statusCountsResponse?.data || { all: 0, active: 0, inactive: 0 };

  // Server-side pagination means no client-side filtering needed
  const dataFiltered = tableData;

  const canReset = !!currentFilters.query || currentFilters.role.length > 0 || currentFilters.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      const toastId = toast.loading('Deleting user and all assets...');
      try {
        // Delete user from backend (this will also trigger asset cleanup on the backend)
        const res = await fetcher([`${endpoints.management.user}/${id}`, { method: 'DELETE' }]);
        
        // Also clean up assets from frontend as a backup
        try {
          await deleteAllUserAssets(id);

        } catch (assetError) {
          console.warn(`Frontend asset cleanup failed for user ${id}:`, assetError);
          // Don't fail the user deletion if asset cleanup fails
        }

        toast.dismiss(toastId);
        toast.success('Delete success!');

        setTimeout(() => {
          if (res.deletedSelf) {
            window.location.href = '/';
            return;
          }
        }, 1000);

        refetch();
        table.onUpdatePageDeleteRow(dataFiltered.length);
      } catch (error) {
        console.error(error);
        toast.dismiss(toastId);
        toast.error('Failed to delete the user.');
      }
    },
    [dataFiltered.length, table, refetch]
  );

  const handleDeleteRows = useCallback(async () => {
    setIsDeleting(true);
    const toastId = toast.loading('Deleting users and all assets...');
    try {
      // Delete users from backend (this will also trigger asset cleanup on the backend)
      await fetcher([
        endpoints.management.user,
        {
          method: 'DELETE',
          data: { ids: table.selected },
        },
      ]);

      // Also clean up assets from frontend as a backup for each user
      const cleanupPromises = table.selected.map(async (userId) => {
        try {
          await deleteAllUserAssets(userId);

        } catch (assetError) {
          console.warn(`Frontend asset cleanup failed for user ${userId}:`, assetError);
          // Don't fail the user deletion if asset cleanup fails
        }
      });

      await Promise.allSettled(cleanupPromises);

      toast.dismiss(toastId);
      toast.success('Delete success!');
      refetch();
      table.onUpdatePageDeleteRows(dataFiltered.length, totalCount);
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error('Failed to delete some users.');
    } finally {
      setIsDeleting(false);
      confirmDialog.onFalse();
    }
  }, [dataFiltered.length, totalCount, table, refetch, confirmDialog]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const renderConfirmDialog = () => (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
    >
      <DialogTitle sx={{ pb: 2 }}>Delete</DialogTitle>
      
      <DialogContent sx={{ typography: 'body2' }}>
        Are you sure want to delete <strong> {table.selected.length} </strong> users?
      </DialogContent>

      <DialogActions>
        <Button 
          variant="outlined" 
          color="inherit" 
          onClick={confirmDialog.onFalse}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="error" 
          onClick={handleDeleteRows}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Employee List"
          links={[
            { name: 'Management' },
            { name: 'Employee' },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.management.user.create}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Employee
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={currentFilters.status}
            onChange={handleFilterStatus}
            sx={[
              (theme) => ({
                px: 2.5,
                boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }),
            ]}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === currentFilters.status) && 'filled') ||
                      'soft'
                    }
                    color={
                      (tab.value === 'active' && 'success') ||
                      (tab.value === 'inactive' && 'error') ||
                      'default'
                    }
                  >
                    {statusCounts[tab.value as keyof typeof statusCounts] || 0}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <UserTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ roles: roleList }}
          />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              totalResults={totalCount}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.filter((row: IUser) => row.status === 'inactive').length}
              onSelectAllRows={(checked) => {
                // Only select/deselect rows with inactive status
                const selectableRowIds = dataFiltered
                  .filter((row: IUser) => row.status === 'inactive')
                  .map((row: IUser) => row.id);
                
                if (checked) {
                  // Select all inactive rows
                  table.onSelectAllRows(true, selectableRowIds);
                } else {
                  // Deselect all rows
                  table.onSelectAllRows(false, []);
                }
              }}
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirmDialog.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={totalCount}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) => {
                    // Only select/deselect rows with inactive status
                    const selectableRowIds = dataFiltered
                      .filter((row: IUser) => row.status === 'inactive')
                      .map((row: IUser) => row.id);
                    
                    if (checked) {
                      // Select all inactive rows
                      table.onSelectAllRows(true, selectableRowIds);
                    } else {
                      // Deselect all rows
                      table.onSelectAllRows(false, []);
                    }
                  }}
                />

                <TableBody>
                  {dataFiltered.map((row: IUser) => (
                      <UserTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        editHref={paths.management.user.edit(row.id)}
                        certificationStatus={checkUserCertifications(row)}
                      />
                    ))}

                  {/* No empty rows needed for server-side pagination */}

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={totalCount}
            rowsPerPage={table.rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

// Remove the applyFilter function since we're now using server-side filtering
