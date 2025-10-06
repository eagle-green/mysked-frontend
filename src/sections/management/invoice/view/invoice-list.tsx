import dayjs from 'dayjs';
import { useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useSetState } from 'minimal-shared/hooks';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';

import { paths } from 'src/routes/paths';
import { useSearchParams } from 'src/routes/hooks/use-search-params';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label/label';
import { useTable } from 'src/components/table/use-table';
import { Scrollbar } from 'src/components/scrollbar/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TableHeadCustom } from 'src/components/table/table-head-custom';

import { InvoiceToolbar } from '../invoice-table-toolbar';
import { InvoiceTableFilterResult } from '../invoice-table-filter-result';

export type IInvoiceFilterType = {
  query: string;
  type: string[];
  service: string[];
  region: string[];
  client: string[];
  status: string;
  startDate: Date | null;
  endDate: Date | null;
};

//-------------------------------------------------------------------------------------------------------
export const INVOICE_TABLE_HEADER = [
  { id: 'invoiceId', label: 'Invoice #', width: 100 },
  { id: 'clientName', label: 'Client' },
  { id: 'companyName', label: 'Customer' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'unitPrice', label: 'Unit Price' },
  { id: 'date', label: 'Date' },
  { id: 'status', label: 'Status' },
  { id: '', width: 50 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'billed', label: 'Billed' },
  { value: 'sent', label: 'Sent' },
];

const SERVICES: { value: string; label: string }[] = [
  { value: 'TCP', label: 'TCP' },
  { value: 'LCT', label: 'LCT' },
  { value: 'HWY', label: 'HWY' },
];

const TYPES: { value: string; label: string }[] = [
  { value: 'digital', label: 'Digital' },
  { value: 'paper', label: 'Paper' },
];

const REGION = [
  { value: 'Metro Vancouver', label: 'Metro Vancouver' },
  { value: 'Vancouver Island', label: 'Vancouver Island' },
];

const CLIENT = [{ value: 'Eagle Green', label: 'Eagle Green' }];

export function InvoiceList() {
  const searchParams = useSearchParams();

  const filters = useSetState<IInvoiceFilterType>({
    query: searchParams.get('search') || '',
    type: searchParams.get('type') ? searchParams.get('type')!.split(',') : [],
    service: searchParams.get('service') ? searchParams.get('service')!.split(',') : [],
    region: searchParams.get('region') ? searchParams.get('region')!.split(',') : [],
    client: searchParams.get('client') ? searchParams.get('client')!.split(',') : [],
    status: searchParams.get('status') || 'all',
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null,
  });

  const table = useTable({
    defaultDense: true,
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: parseInt(searchParams.get('page') || '1', 10) - 1,
  });

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      filters.setState({ status: newValue });
      // table.onResetPage();
    },
    [filters]
  );

  const { state: currentFilters, setState: updateFilters } = filters;
  const defaultValues = {
    query: '',
    type: [],
    service: [],
    region: [],
    client: [],
    status: 'all',
    startDate: null,
    endDate: null,
  };
  const handleResetFilters = useCallback(() => {
    updateFilters(defaultValues);
  }, [updateFilters]);

  const statusCounts = { all: 0, pending: 0, billed: 0, sent: 0 };

  const dateError = !!(
    currentFilters.startDate &&
    currentFilters.endDate &&
    dayjs(currentFilters.startDate).isAfter(currentFilters.endDate)
  );

  const showFilterResult = JSON.stringify(currentFilters) !== JSON.stringify(defaultValues);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Invoice List"
        links={[{ name: 'Management', href: paths.management.root }, { name: 'Invoice List' }]}
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
                    (tab.value === 'pending' && 'warning') ||
                    (tab.value === 'billed' && 'info') ||
                    (tab.value === 'sent' && 'success') ||
                    'default'
                  }
                >
                  {statusCounts[tab.value as keyof typeof statusCounts] || 0}
                </Label>
              }
            />
          ))}
        </Tabs>

        {/* Toolbar  */}
        <InvoiceToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          options={{ types: TYPES, services: SERVICES, region: REGION, client: CLIENT }}
          dateError={!!dateError}
        />

        {/* Filter Result */}
        {showFilterResult && (
          <InvoiceTableFilterResult
            filters={filters}
            onResetFilters={handleResetFilters}
            totalResults={[].length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        {/* Invoice Table Row */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              {/* Table header */}
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={INVOICE_TABLE_HEADER}
                rowCount={0}
                onSort={table.onSort}
              />

              {/* Table Body */}
              <TableBody>
                {Array.from({ length: table.rowsPerPage }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="60%" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="text" width="70%" />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="90%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton
                        variant="rectangular"
                        width={60}
                        height={24}
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="50%" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>
      </Card>
    </DashboardContent>
  );
}
