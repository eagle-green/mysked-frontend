import type { TableHeadCellProps } from 'src/components/table';
import type { IInvoice, IInvoiceTableFilters } from 'src/types/invoice';

import dayjs from 'dayjs';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useUserAccess } from 'src/hooks/use-user-access';

import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { type ProgressStep } from 'src/components/progress-dialog/types';
import { InvoiceDeletionProgressDialog } from 'src/components/progress-dialog/invoice-deletion-progress-dialog';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { InvoiceTableRow } from '../invoice-table-row';
import { InvoiceTableToolbar } from '../invoice-table-toolbar';
import { InvoiceTableFiltersResult } from '../invoice-table-filters-result';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'displayId', label: 'ID' },
  { id: 'createDate', label: 'Date' },
  { id: 'invoiceNumber', label: 'Invoice #' },
  { id: 'customer', label: 'Customer' },
  { id: 'poNumber', label: 'PO #' },
  { id: 'networkNumber', label: 'NW #' },
  { id: 'approver', label: 'Approver' },
  { id: 'store', label: 'Store' },
  { id: 'totalAmount', label: 'Amount' },
  { id: 'created_by', label: 'Created By', width: 150 },
  { id: 'updated_by', label: 'Updated By', width: 150 },
  { id: '' },
];

// ----------------------------------------------------------------------

// Authorized users who can always see Invoice section
const AUTHORIZED_INVOICE_ADMINS = [
  'kiwoon@eaglegreen.ca',
  'kesia@eaglegreen.ca',
  'matth@eaglegreen.ca',
  'joec@eaglegreen.ca',
];

export function InvoiceListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { hasInvoiceAccess, isLoading: isLoadingAccess } = useUserAccess();

  // Check if user has access
  const isAuthorized = useMemo(() => {
    if (!user || user.role !== 'admin') return false;
    const isUserAuthorizedAdmin = user.email && AUTHORIZED_INVOICE_ADMINS.includes(user.email.toLowerCase());
    return isUserAuthorizedAdmin || hasInvoiceAccess;
  }, [user, hasInvoiceAccess]);

  const table = useTable({
    defaultDense: searchParams.get('dense') === 'false' ? false : true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'displayId',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const confirmDialog = useBoolean();
  
  // Delete progress dialog state
  const deleteProgressDialog = useBoolean();
  const [deleteCurrentStep, setDeleteCurrentStep] = useState(0);
  const [deleteProgressSteps, setDeleteProgressSteps] = useState<ProgressStep[]>([]);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);

  const filters = useSetState<IInvoiceTableFilters>({
    name: searchParams.get('search') || '',
    customer: searchParams.get('customer') ? searchParams.get('customer')!.split(',') : [],
    store: searchParams.get('store') ? searchParams.get('store')!.split(',') : [],
    status: searchParams.get('status') || 'all',
    startDate: searchParams.get('startDate') ? dayjs(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? dayjs(searchParams.get('endDate')!) : null,
  });
  const { state: currentFilters } = filters;

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

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
    if (currentFilters.name) params.set('search', currentFilters.name);
    if (currentFilters.status !== 'all') params.set('status', currentFilters.status);
    if (currentFilters.customer.length > 0) params.set('customer', currentFilters.customer.join(','));
    if (currentFilters.store.length > 0) params.set('store', currentFilters.store.join(','));
    if (currentFilters.startDate) params.set('startDate', dayjs(currentFilters.startDate).format('YYYY-MM-DD'));
    if (currentFilters.endDate) params.set('endDate', dayjs(currentFilters.endDate).format('YYYY-MM-DD'));
    
    const url = `?${params.toString()}`;
    router.replace(`${window.location.pathname}${url}`);
  }, [table.page, table.rowsPerPage, table.orderBy, table.order, table.dense, currentFilters, router]);

  // Update URL when relevant state changes
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Reset page when filters change (but not when table state changes)
  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentFilters.name,
    currentFilters.customer,
    currentFilters.store,
    currentFilters.status,
    currentFilters.startDate,
    currentFilters.endDate,
  ]);

  // Map frontend field names (camelCase) to backend field names (snake_case)
  const orderByMap: Record<string, string> = {
    id: 'display_id',
    displayId: 'display_id',
    createDate: 'create_date',
    invoiceNumber: 'invoice_number',
    totalAmount: 'total_amount',
    dueDate: 'due_date',
    status: 'status',
  };

  // React Query for fetching invoices list
  const { data: invoiceListResponse, refetch } = useQuery({
    queryKey: ['invoices', table.page, table.rowsPerPage, table.orderBy, table.order, currentFilters],
    queryFn: async () => {
      const backendOrderBy = orderByMap[table.orderBy] || table.orderBy;
      
      const params = new URLSearchParams({
        page: (table.page + 1).toString(),
        rowsPerPage: table.rowsPerPage.toString(),
        orderBy: backendOrderBy,
        order: table.order,
        ...(currentFilters.name && { search: currentFilters.name }),
        ...(currentFilters.status !== 'all' && { status: currentFilters.status }),
        ...(currentFilters.customer.length > 0 && { customer: currentFilters.customer.join(',') }),
        ...(currentFilters.store.length > 0 && { store: currentFilters.store.join(',') }),
        ...(currentFilters.startDate && { startDate: dayjs(currentFilters.startDate).format('YYYY-MM-DD') }),
        ...(currentFilters.endDate && { endDate: dayjs(currentFilters.endDate).format('YYYY-MM-DD') }),
      });

      const response = await fetcher(`${endpoints.invoice.list}?${params.toString()}`);

      return response;
    },
  });

  // Use server-side pagination data
  const tableData = useMemo(() => (invoiceListResponse?.data || []) as IInvoice[], [invoiceListResponse?.data]);
  const totalCount = invoiceListResponse?.pagination?.totalCount || 0;

  // Server-side pagination means no client-side filtering needed
  const dataFiltered = tableData;

  const canReset =
    !!currentFilters.name ||
    currentFilters.customer.length > 0 ||
    currentFilters.store.length > 0 ||
    currentFilters.status !== 'all' ||
    (!!currentFilters.startDate && !!currentFilters.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  // Fetch customers from API for filter dropdown
  const { data: customersResponse } = useQuery({
    queryKey: ['invoice-customers-for-filter'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '10000',
        orderBy: 'name',
        order: 'asc',
      });
      const response = await fetcher(`${endpoints.invoice.customers}?${params.toString()}`);
      return response;
    },
  });

  const customerOptions = useMemo(() => (customersResponse?.data || []) as Array<{
    id: string;
    name: string;
    company_name?: string;
  }>, [customersResponse?.data]);

  // Fetch stores from API for filter dropdown
  const { data: storesResponse } = useQuery({
    queryKey: ['invoice-stores-for-filter'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '100',
        active: 'true',
      });
      const response = await fetcher(`${endpoints.invoice.stores}?${params.toString()}`);
      return response;
    },
  });

  const storeOptions = useMemo(() => (storesResponse?.data || []) as Array<{
    id: string;
    name: string;
  }>, [storesResponse?.data]);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      setDeletingInvoiceId(id);

      // Initialize progress steps
      const steps: ProgressStep[] = [
        {
          label: 'Validating Invoice',
          description: 'Checking if invoice can be deleted...',
          status: 'active',
        },
        {
          label: 'Deleting QuickBooks Invoice',
          description: 'Voiding invoice in QuickBooks...',
          status: 'pending',
        },
        {
          label: 'Removing Invoice Items',
          description: 'Deleting invoice items from database...',
          status: 'pending',
        },
        {
          label: 'Removing Invoice Record',
          description: 'Deleting invoice from database...',
          status: 'pending',
        },
        {
          label: 'Finalizing',
          description: 'Completing deletion process...',
          status: 'pending',
        },
      ];

      setDeleteProgressSteps(steps);
      setDeleteCurrentStep(0);
      deleteProgressDialog.onTrue();

      let currentStep = 0;

      try {
        // Step 1: Validation (simulate delay)
        await new Promise((resolve) => setTimeout(resolve, 500));
        const updatedSteps1 = [...steps];
        updatedSteps1[0].status = 'completed';
        updatedSteps1[0].description = 'Validation completed - invoice can be deleted';
        updatedSteps1[1].status = 'active';
        setDeleteProgressSteps(updatedSteps1);
        setDeleteCurrentStep(1);
        currentStep = 1;

        // Step 2: API call to delete invoice
        const response = await fetcher([
          `${endpoints.invoice.delete(id)}`,
          {
            method: 'DELETE',
          },
        ]);

        // Step 2: QBO Invoice deletion
        const updatedSteps2 = [...updatedSteps1];
        if (response.qbo_status === 'completed') {
          updatedSteps2[1].status = 'completed';
          updatedSteps2[1].description = 'QuickBooks invoice deleted successfully';
        } else if (response.qbo_status === 'failed') {
          updatedSteps2[1].status = 'error';
          updatedSteps2[1].description = 'Failed to delete QuickBooks invoice';
          updatedSteps2[1].error = response.qbo_message || 'Unknown error (will continue with local deletion)';
        } else {
          updatedSteps2[1].status = 'completed';
          updatedSteps2[1].description = 'No QuickBooks invoice to delete';
        }
        updatedSteps2[2].status = 'active';
        setDeleteProgressSteps(updatedSteps2);
        setDeleteCurrentStep(2);
        currentStep = 2;

        // Step 3: Invoice items deletion (simulate delay)
        await new Promise((resolve) => setTimeout(resolve, 400));
        const updatedSteps3 = [...updatedSteps2];
        updatedSteps3[2].status = 'completed';
        updatedSteps3[2].description = 'Invoice items removed successfully';
        updatedSteps3[3].status = 'active';
        setDeleteProgressSteps(updatedSteps3);
        setDeleteCurrentStep(3);
        currentStep = 3;

        // Step 4: Database deletion (simulate delay)
        await new Promise((resolve) => setTimeout(resolve, 300));
        const updatedSteps4 = [...updatedSteps3];
        updatedSteps4[3].status = 'completed';
        updatedSteps4[3].description = 'Invoice removed from database';
        updatedSteps4[4].status = 'active';
        setDeleteProgressSteps(updatedSteps4);
        setDeleteCurrentStep(4);
        currentStep = 4;

        // Step 5: Finalizing (simulate delay)
        await new Promise((resolve) => setTimeout(resolve, 300));
        const updatedSteps5 = [...updatedSteps4];
        updatedSteps5[4].status = 'completed';
        if (response.qbo_status === 'failed') {
          updatedSteps5[4].description = 'Deletion completed (QBO deletion failed - see step 2)';
        } else {
          updatedSteps5[4].description = 'Deletion completed successfully';
        }
        setDeleteProgressSteps(updatedSteps5);

        // Immediately invalidate and refetch the invoice list
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        refetch();

        // Show success message (dialog stays open for user to read and close manually)
        if (response.qbo_status === 'completed') {
          toast.success('Invoice deleted successfully from both system and QuickBooks!');
        } else if (response.qbo_status === 'failed') {
          toast.warning('Invoice deleted from system, but failed to delete in QuickBooks. Please delete it manually in QuickBooks.');
        } else {
          toast.success('Invoice deleted successfully!');
        }
      } catch (error) {
        // Update current step with error
        const errorSteps = [...deleteProgressSteps];
        errorSteps[currentStep].status = 'error';
        errorSteps[currentStep].error =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setDeleteProgressSteps(errorSteps);

        // Show error message (dialog stays open for user to read and close manually)
        console.error(error);
        toast.error('Failed to delete the invoice.');
      } finally {
        setDeletingInvoiceId(null);
      }
    },
    [queryClient, refetch, deleteProgressDialog, deleteProgressSteps]
  );

  const handleDeleteRows = useCallback(() => {
    // TODO: Implement bulk delete API call
    toast.success('Delete success!');
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    table.onUpdatePageDeleteRows(dataFiltered.length, dataFiltered.length);
  }, [dataFiltered.length, table, queryClient]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete"
      content={
        <>
          Are you sure want to delete <strong> {table.selected.length} </strong> items?
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          Delete
        </Button>
      }
    />
  );

  // Show loading while checking access
  if (isLoadingAccess) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <Typography>Loading...</Typography>
        </Box>
      </DashboardContent>
    );
  }

  // Show access denied if user doesn't have access
  if (!isAuthorized) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Invoice List"
          links={[
            { name: 'Management', href: paths.management.root },
            { name: 'Invoice' },
            { name: 'List' },
          ]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="error">
            You do not have permission to access the Invoice module.
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Invoice List"
          links={[
            { name: 'Management', href: paths.management.root },
            { name: 'Invoice', href: paths.management.invoice.root },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.management.invoice.generate}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Generate Invoice
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />


        <Card>
          <InvoiceTableToolbar
            filters={filters}
            dateError={dateError}
            onResetPage={table.onResetPage}
            options={{ customers: customerOptions, stores: storeOptions }}
          />

          {canReset && (
            <InvoiceTableFiltersResult
              filters={filters}
              onResetPage={table.onResetPage}
              totalResults={dataFiltered.length}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headCells={TABLE_HEAD}
              rowCount={dataFiltered.length}
              numSelected={0}
              onSort={table.onSort}
            />

                <TableBody>
                  {dataFiltered.map((row) => (
                    <InvoiceTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      editHref={paths.management.invoice.edit?.(row.id) || '#'}
                      detailsHref={paths.management.invoice.details?.(row.id) || '#'}
                      isDeleting={deleteProgressDialog.value && deletingInvoiceId === row.id}
                    />
                  ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
                    emptyRows={emptyRows(0, table.rowsPerPage, dataFiltered.length)}
                  />

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
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}

      <InvoiceDeletionProgressDialog
        open={deleteProgressDialog.value}
        steps={deleteProgressSteps}
        currentStep={deleteCurrentStep}
        onClose={deleteProgressDialog.onFalse}
        title="Deleting Invoice"
        subtitle="Please wait while we safely remove the invoice and clean up QuickBooks. Do not close this window or navigate away."
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  dateError: boolean;
  inputData: IInvoice[];
  filters: IInvoiceTableFilters;
  comparator: (a: any, b: any) => number;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _applyFilter({ inputData, comparator, filters, dateError }: ApplyFilterProps) {
  const { name, status, customer, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(({ invoiceNumber, invoiceTo, networkNumber }) =>
      [invoiceNumber, invoiceTo?.name, invoiceTo?.company, invoiceTo?.phoneNumber, networkNumber].some((field) =>
        field?.toLowerCase().includes(name.toLowerCase())
      )
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((invoice) => invoice.status === status);
  }

  if (customer && customer.length > 0) {
    inputData = inputData.filter((invoice) =>
      invoice.invoiceTo?.name && customer.includes(invoice.invoiceTo.name)
    );
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((invoice) => fIsBetween(invoice.createDate, startDate, endDate));
    }
  }

  return inputData;
}

