import type { TableHeadCellProps } from 'src/components/table';

import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha , useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, usePathname, useSearchParams } from 'src/routes/hooks';

import { fDate, fTime } from 'src/utils/format-time';
import { getCategoryColor } from 'src/utils/category-colors';

import { useGetAnnouncements, useDeleteAnnouncement } from 'src/actions/announcements';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

/** Treat empty or placeholder "sub title optional" as no description. */
function hasDescription(description: string | null | undefined): boolean {
  const t = description?.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  if (lower === 'sub title optional' || lower === 'sub title (optional)') return false;
  return true;
}

import { AnnouncementTableRow } from '../announcement-table-row';

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'id', label: 'ID', width: 64, align: 'center' },
  { id: 'title', label: 'Title', width: '45%' },
  { id: 'category', label: 'Category', width: '25%' },
  { id: 'created_by', label: 'Created at', width: 180 },
];

/** Worker view (company announcements): adds Opened at and Signature columns */
const TABLE_HEAD_WORKER: TableHeadCellProps[] = [
  ...TABLE_HEAD,
  { id: 'read_at', label: 'Opened at', width: 140, align: 'left' },
  { id: 'signature', label: 'Signature', width: 120, align: 'left' },
];

/** Management list (admin): adds Status, Recipients (read/signed counts) and actions */
const TABLE_HEAD_WITH_ACTIONS: TableHeadCellProps[] = [
  ...TABLE_HEAD,
  { id: 'status', label: 'Status', width: 100, align: 'center' },
  { id: 'recipients', label: 'Recipients', width: 100, align: 'center' },
  { id: 'actions', label: '', width: 48, align: 'right' },
];

export function AnnouncementsListView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const isCompanyPath = pathname?.startsWith('/company/announcements') ?? false;
  const listPath = isCompanyPath ? paths.company.announcements.list : paths.management.announcements.list;
  const getDetailsHref = isCompanyPath ? paths.company.announcements.details : paths.management.announcements.details;
  const table = useTable({
    defaultDense: searchParams.get('dense') !== 'false',
    defaultOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    defaultOrderBy: searchParams.get('orderBy') || 'created_at',
    defaultRowsPerPage: parseInt(searchParams.get('rowsPerPage') || '25', 10),
    defaultCurrentPage: Math.max(0, parseInt(searchParams.get('page') || '1', 10) - 1),
  });
  const deleteRowsDialog = useBoolean();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', String(table.page + 1));
    params.set('rowsPerPage', String(table.rowsPerPage));
    params.set('orderBy', table.orderBy);
    params.set('order', table.order);
    params.set('dense', table.dense ? 'true' : 'false');
    const newURL = `${window.location.pathname}?${params.toString()}`;
    if (window.location.search !== `?${params.toString()}`) {
      router.replace(newURL);
    }
  }, [router, table.page, table.rowsPerPage, table.orderBy, table.order, table.dense]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<{ id: string } | null>(null);

  const { data: announcementsResponse, isLoading, error: announcementsError } = useGetAnnouncements({
    scope: isCompanyPath ? 'recipient' : 'all',
  });
  const tableData = useMemo(() => announcementsResponse || [], [announcementsResponse]);
  const dataFiltered = tableData;
  const dataInPage = useMemo(
    () => rowInPage(dataFiltered, table.page, table.rowsPerPage),
    [dataFiltered, table.page, table.rowsPerPage]
  );
  const notFound = !dataFiltered.length;
  const deleteAnnouncement = useDeleteAnnouncement();

  const handleView = useCallback((announcement: any) => router.push(getDetailsHref(announcement.id)), [router, getDetailsHref]);
  const handleDelete = useCallback((id: string) => {
    setSelectedAnnouncement({ id });
    deleteRowsDialog.onTrue();
  }, [deleteRowsDialog]);

  const handleDeleteRows = useCallback(async () => {
    if (!selectedAnnouncement) return;
    try {
      await deleteAnnouncement.mutateAsync(selectedAnnouncement.id);
      toast.success('Announcement deleted successfully!');
      deleteRowsDialog.onFalse();
      setSelectedAnnouncement(null);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement. Please try again.');
    }
  }, [deleteAnnouncement, selectedAnnouncement, deleteRowsDialog]);

  const canCreate = user?.role === 'admin';
  const breadcrumbLinks = isCompanyPath
    ? [{ name: 'Company', href: listPath }, { name: 'Announcements', href: listPath }, { name: 'List' }]
    : [{ name: 'Management', href: paths.management.root }, { name: 'Announcements', href: paths.management.announcements.list }, { name: 'List' }];
  const tableHead = isCompanyPath ? TABLE_HEAD_WORKER : (canCreate ? TABLE_HEAD_WITH_ACTIONS : TABLE_HEAD);
  const showRowActions = canCreate && !isCompanyPath;
  const showRecipientColumns = isCompanyPath;

  const errorMessage = announcementsError?.message || String(announcementsError || '');
  const is404 = errorMessage.includes('404') || errorMessage.includes('Cannot GET') || errorMessage.includes('Not Found');

  if (announcementsError) {
    return (
      <Container maxWidth={false} sx={{ py: 3 }}>
        <CustomBreadcrumbs heading="Announcements" links={breadcrumbLinks} sx={{ mb: 3 }} />
        <Box sx={{ py: 3 }}>
          {is404 ? (
            <>
              <Typography variant="h4" gutterBottom>Announcements Feature</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                The announcements API is not yet available. Please ensure the backend is running and migrations have been applied.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h4" gutterBottom>Error loading announcements</Typography>
              <Typography variant="body1" color="error">{errorMessage}</Typography>
            </>
          )}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="Announcements"
        links={breadcrumbLinks}
        sx={{ mb: 3 }}
        action={
          canCreate && !isCompanyPath && (
            <Button component={RouterLink} href={paths.management.announcements.create} variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>
              Create Announcement
            </Button>
          )
        }
      />
      <Card>
        {/* Desktop: table */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ tableLayout: 'auto' }}>
              <TableHeadCustom order={table.order} orderBy={table.orderBy} headCells={tableHead} rowCount={dataFiltered.length} numSelected={0} onSort={table.onSort} />
              <TableBody>
                {isLoading ? (
                  Array.from({ length: table.rowsPerPage }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell align="center"><Skeleton variant="text" width={32} sx={{ mx: 'auto' }} /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell align="right"><Skeleton variant="circular" width={32} height={32} sx={{ ml: 'auto' }} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {dataInPage.map((row: any, index: number) => (
                      <AnnouncementTableRow
                        key={row.id}
                        row={row}
                        indexNumber={table.page * table.rowsPerPage + index + 1}
                        selected={false}
                        onSelectRow={() => {}}
                        onView={handleView}
                        onDelete={handleDelete}
                        canDelete={showRowActions}
                        showRecipientColumns={showRecipientColumns}
                        getDetailsHref={getDetailsHref}
                      />
                    ))}
                    <TableEmptyRows height={0} emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)} />
                    <TableNoData notFound={!!notFound} />
                  </>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        {/* Mobile: card view */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Stack spacing={2} sx={{ p: 2 }}>
            {notFound ? (
              <EmptyContent
                filled
                title="No announcements"
                sx={{
                  width: '100%',
                  maxWidth: 'none',
                  py: 4,
                }}
              />
            ) : (
              dataInPage.map((row: any) => (
                <AnnouncementMobileCard
                  key={row.id}
                  row={row}
                  onView={handleView}
                  isWorker={showRecipientColumns}
                />
              ))
            )}
          </Stack>
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
      <Box
        sx={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: deleteRowsDialog.value ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}
        onClick={deleteRowsDialog.onFalse}
      >
        <Card sx={{ p: 3, maxWidth: 400, width: '100%', mx: 2 }} onClick={(e) => e.stopPropagation()}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Delete Announcement</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Are you sure? This action cannot be undone.</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={deleteRowsDialog.onFalse} disabled={deleteAnnouncement.isPending}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDeleteRows} disabled={deleteAnnouncement.isPending}>
              {deleteAnnouncement.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </Box>
        </Card>
      </Box>
    </Container>
  );
}

// ----------------------------------------------------------------------
// Mobile card (announcements list on small screens)
// ----------------------------------------------------------------------

type AnnouncementMobileCardProps = {
  row: any;
  onView: (announcement: any) => void;
  isWorker: boolean;
};

function AnnouncementMobileCard({ row, onView, isWorker }: AnnouncementMobileCardProps) {
  const theme = useTheme();
  return (
    <Card
      onClick={() => onView(row)}
      variant="outlined"
      sx={{
        p: 0,
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: 2,
        borderLeftWidth: 4,
        borderLeftStyle: 'solid',
        borderLeftColor: 'primary.main',
        boxShadow: (t) => t.shadows[2],
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: (t) => t.shadows[8],
          borderLeftColor: 'primary.dark',
        },
      }}
    >
      <Stack spacing={0} sx={{ p: 2 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify
              icon={isWorker && row.recipientStatus?.readAt ? 'solar:letter-bold' : 'solar:letter-unread-bold'}
              width={22}
              sx={{
                color: isWorker && row.recipientStatus?.readAt ? 'text.secondary' : 'primary.main',
              }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {row.displayId != null && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                #{row.displayId}
              </Typography>
            )}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.3 }}>
              {row.title}
            </Typography>
            {hasDescription(row.description) ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {row.description}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        {(row.category?.split(', ').map((c: string) => c.trim()).filter(Boolean) ?? []).length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            {(row.category?.split(', ').map((c: string) => c.trim()).filter(Boolean) ?? []).map((trimmed: string, index: number) => {
              const hex = row.categoryColors?.[trimmed];
              return (
                <Label
                  key={index}
                  variant="soft"
                  color={hex ? undefined : getCategoryColor(trimmed)}
                  sx={
                    hex
                      ? { fontSize: '0.75rem', bgcolor: hex, color: theme.palette.getContrastText(hex) }
                      : { fontSize: '0.75rem' }
                  }
                >
                  {trimmed}
                </Label>
              );
            })}
          </Stack>
        ) : null}

        <Divider sx={{ my: 1.5 }} />

        <Stack spacing={0.5}>
          {row.createdAt ? (
            <Typography variant="caption" color="text.secondary">
              Created at {fDate(row.createdAt, 'MMM DD YYYY')} {fTime(row.createdAt)}
            </Typography>
          ) : null}
          {isWorker && row.recipientStatus !== undefined && (
            <>
              {row.recipientStatus?.readAt ? (
                <Typography variant="caption" color="text.secondary">
                  Opened at {fDate(row.recipientStatus.readAt, 'MMM DD YYYY')} {fTime(row.recipientStatus.readAt)}
                </Typography>
              ) : null}
              {row.requiresSignature ? (
                row.recipientStatus?.signedAt ? (
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
                    Signed {fDate(row.recipientStatus.signedAt, 'MMM DD YYYY')} {fTime(row.recipientStatus.signedAt)}
                  </Typography>
                ) : (
                  <Label variant="soft" color="warning" sx={{ fontSize: '0.7rem', alignSelf: 'flex-start' }}>
                    Signature required
                  </Label>
                )
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Signature not required
                </Typography>
              )}
            </>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
