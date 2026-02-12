import type { TableHeadCellProps } from 'src/components/table';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { UserAccessTableRow } from '../user-access-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'user', label: 'User', width: '30%' },
  { id: 'email', label: 'Email', width: '25%' },
  { id: 'role', label: 'Role', width: '20%' },
  { id: 'invoice_access', label: 'Invoice Access', width: '20%' },
  { id: 'actions', label: 'Actions', width: '5%', align: 'right' },
];

// ----------------------------------------------------------------------

interface UserAccess {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  photo_url?: string;
  invoice_access?: boolean;
  access_id?: string;
}

// Authorized users who can always see Invoice section and manage User Access
const AUTHORIZED_INVOICE_ADMINS = [
  'kiwoon@eaglegreen.ca',
  'kesia@eaglegreen.ca',
  'matth@eaglegreen.ca',
  'joec@eaglegreen.ca',
];

export function UserAccessListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthContext();

  // Check if user is authorized
  const isAuthorized = user?.email && AUTHORIZED_INVOICE_ADMINS.includes(user.email.toLowerCase());

  // Initialize table state from URL parameters
  const table = useTable({
    defaultDense: searchParams.get('dense') === 'false' ? false : true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
    defaultOrderBy: searchParams.get('orderBy') || 'email',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  // Update URL when table state changes
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    
    // Always add pagination and sorting params to make URLs shareable
    params.set('page', (table.page + 1).toString());
    params.set('rowsPerPage', table.rowsPerPage.toString());
    params.set('orderBy', table.orderBy);
    params.set('order', table.order);
    params.set('dense', table.dense.toString());
    
    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [table.page, table.rowsPerPage, table.orderBy, table.order, table.dense, router]);

  // Update URL when relevant state changes
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Fetch users with pagination - only admin role users
  // Note: We filter authorized admins on frontend, so pagination count may be slightly off
  // but this is acceptable since there are typically few admin users
  const { data: usersResponse, isLoading, error: usersError } = useQuery({
    queryKey: [
      'users',
      'admin-only',
      'user-access',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy: table.orderBy,
        order: table.order,
        roles: 'admin', // Filter to only admin role users
      });

      const response = await fetcher(`${endpoints.management.user}?${params.toString()}`);
      return response.data || response; // Handle both response.data and direct response
    },
  });

  // Fetch user access data
  const { data: userAccessResponse, isLoading: isLoadingAccess } = useQuery({
    queryKey: ['user-access'],
    queryFn: async () => {
      try {
        const response = await fetcher(endpoints.invoice.userAccess.list);
        return response.data || [];
      } catch {
        // If endpoint doesn't exist yet, return empty array
        return [];
      }
    },
  });

  // Combine user data with access data - filter out authorized admins
  const tableData = useMemo(() => {
    const users = usersResponse?.users || [];
    if (!users.length) return [];
    
    // Filter out authorized admins (they can't be managed)
    const manageableUsers = users.filter((userItem: any) => {
      const isAuthorizedAdmin = userItem.email && AUTHORIZED_INVOICE_ADMINS.includes(userItem.email.toLowerCase());
      return !isAuthorizedAdmin;
    });
    if (!manageableUsers.length) return [];
    
    interface UserAccessRecord {
      id: string;
      user_id: string;
      invoice_access: boolean;
    }

    const accessMap = new Map<string, UserAccessRecord>(
      (userAccessResponse || []).map((access: any) => [
        access.user_id || access.id,
        access as UserAccessRecord,
      ])
    );

    // Add access data to manageable users
    return manageableUsers.map((userItem: any) => {
      const access = accessMap.get(userItem.id);
      
      return {
        ...userItem,
        invoice_access: access?.invoice_access ?? false,
        access_id: access?.id,
      };
    });
  }, [usersResponse, userAccessResponse]);

  const dataFiltered = tableData;
  // Total count: Use backend count but note it includes authorized admins
  // Since we filter them out, the actual displayed count may be less
  // For accurate pagination, we'd need backend support, but this works for typical use cases
  const totalCount = usersResponse?.pagination?.totalCount || tableData.length;
  const notFound = !dataFiltered.length;

  const handleEdit = useCallback(
    (userId: string) => {
      router.push(paths.management.invoice.userAccess.edit(userId));
    },
    [router]
  );

  // Redirect if not authorized
  if (!isAuthorized) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="User Access"
          links={[{ name: 'Management' }, { name: 'Invoice' }, { name: 'User Access' }]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="error">
            You do not have permission to access this page.
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  if (isLoading || isLoadingAccess) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="User Access"
          links={[{ name: 'Management' }, { name: 'Invoice' }, { name: 'User Access' }]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <Typography>Loading users...</Typography>
        </Box>
      </DashboardContent>
    );
  }

  if (usersError) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="User Access"
          links={[{ name: 'Management' }, { name: 'Invoice' }, { name: 'User Access' }]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            Error loading users
          </Typography>
          <Typography variant="body1" color="error">
            {usersError?.message || 'Failed to load users'}
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="User Access"
        links={[
          { name: 'Management' },
          { name: 'Invoice', href: paths.management.invoice.list },
          { name: 'User Access' },
        ]}
        sx={{ mb: 3 }}
      />

      <Card>
        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ tableLayout: 'auto' }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={dataFiltered.length}
                numSelected={0}
                onSort={table.onSort}
              />

              <TableBody>
                {isLoading || isLoadingAccess ? (
                  Array.from({ length: table.rowsPerPage }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton variant="circular" width={40} height={40} sx={{ display: 'inline-block' }} /><Skeleton variant="text" width="60%" sx={{ ml: 1, display: 'inline-block', verticalAlign: 'middle' }} /></TableCell>
                      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={24} height={24} sx={{ borderRadius: 0.5 }} /></TableCell>
                      <TableCell align="right"><Skeleton variant="circular" width={32} height={32} sx={{ ml: 'auto' }} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {dataFiltered.map((row: UserAccess) => (
                      <UserAccessTableRow
                        key={row.id}
                        row={row}
                        onEdit={() => handleEdit(row.id)}
                      />
                    ))}
                    <TableEmptyRows
                      height={0}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, totalCount)}
                    />
                    <TableNoData notFound={!!notFound} />
                  </>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          count={totalCount}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>
    </DashboardContent>
  );
}

