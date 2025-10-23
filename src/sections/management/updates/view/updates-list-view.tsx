import type { TableHeadCellProps } from 'src/components/table';

import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useGetUpdates , useDeleteUpdate } from 'src/actions/updates';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
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

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { UpdateTableRow } from '../update-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'title', label: 'Title', width: '50%' },
  { id: 'category', label: 'Category', width: '30%' },
  { id: 'createdAt', label: 'Created', width: '20%' },
];


// ----------------------------------------------------------------------


// ----------------------------------------------------------------------

export function UpdatesListView() {
  const router = useRouter();
  const { user } = useAuthContext();

  // Initialize table state
  const table = useTable({
    defaultDense: true,
    defaultOrder: 'desc',
    defaultOrderBy: 'created_at',
    defaultRowsPerPage: 25,
    defaultCurrentPage: 0,
  });


  const deleteRowsDialog = useBoolean();
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);

  // React Query for fetching updates with server-side pagination
  const { data: updatesResponse, isLoading, error: updatesError } = useGetUpdates();

  // Use the fetched data or fallback to empty array
  const tableData = useMemo(() => updatesResponse || [], [updatesResponse]);
  
  // No filtering for now
  const dataFiltered = tableData;
  const notFound = !dataFiltered.length;

  const deleteUpdate = useDeleteUpdate();

  const handleView = useCallback(
    (update: any) => {
      router.push(paths.management.updates.details(update.id));
    },
    [router]
  );

  const handleDelete = useCallback((updateId: string) => {
    setSelectedUpdate({ id: updateId });
    deleteRowsDialog.onTrue();
  }, [deleteRowsDialog]);

  const handleDeleteRows = useCallback(async () => {
    if (!selectedUpdate) return;

    try {
      await deleteUpdate.mutateAsync(selectedUpdate.id);
      toast.success('Update deleted successfully!');
      deleteRowsDialog.onFalse();
      setSelectedUpdate(null);
    } catch (error) {
      console.error('Error deleting update:', error);
      toast.error('Failed to delete update. Please try again.');
    }
  }, [deleteUpdate, selectedUpdate, deleteRowsDialog]);


  const denseHeight = table.dense ? 52 : 72;

  // Only show create button for kiwoon@eaglegreen.ca
  const canCreateUpdate = user?.email === 'kiwoon@eaglegreen.ca';

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <CustomBreadcrumbs
          heading="Updates"
          links={[{ name: 'Management', href: paths.management.root }, { name: 'Updates' }]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <Typography>Loading updates...</Typography>
        </Box>
      </Container>
    );
  }

  if (updatesError) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <CustomBreadcrumbs
          heading="Updates"
          links={[{ name: 'Management', href: paths.management.root }, { name: 'Updates' }]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            Error loading updates
          </Typography>
          <Typography variant="body1" color="error">
            {updatesError?.message || 'Failed to load updates'}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="Updates"
        links={[{ name: 'Management', href: paths.management.root }, { name: 'Updates' }]}
        sx={{ mb: 3 }}
        action={
          canCreateUpdate && (
            <Button
              component={RouterLink}
              href={paths.management.updates.create}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Create Update
            </Button>
          )
        }
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
                {dataFiltered.map((row: any) => (
                  <UpdateTableRow
                    key={row.id}
                    row={row}
                    selected={false}
                    onSelectRow={() => {}}
                    onView={handleView}
                    onDelete={handleDelete}
                  />
                ))}

                <TableEmptyRows
                  height={denseHeight}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />

                <TableNoData notFound={!!notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          count={dataFiltered.length}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>

      {/* Bulk Delete Confirmation Dialog */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: deleteRowsDialog.value ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        onClick={deleteRowsDialog.onFalse}
      >
        <Card
          sx={{
            p: 3,
            maxWidth: 400,
            width: '100%',
            mx: 2,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">
              Delete Update
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Are you sure you want to delete this update? This action cannot be undone.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={deleteRowsDialog.onFalse} disabled={deleteUpdate.isPending}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteRows}
              disabled={deleteUpdate.isPending}
            >
              {deleteUpdate.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </Box>
        </Card>
      </Box>
    </Container>
  );
}
