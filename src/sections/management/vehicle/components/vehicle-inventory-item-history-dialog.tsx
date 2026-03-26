import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { useTable, TablePaginationCustom } from 'src/components/table';

import { JobDetailsDialog } from 'src/sections/work/calendar/job-details-dialog';

import {
  formatTxnLine,
  getActionIcon,
  getActionColor,
  type HistoryEntry,
  formatGroupSummary,
  getTransactionCategoryIcon,
  getTransactionCategoryColor,
  VehicleHistoryAuditEntryContent,
  groupVehicleInventoryTransactions,
  type VehicleInventoryTransactionGroup,
} from '../vehicle-history-tab';

dayjs.extend(utc);
dayjs.extend(timezone);

function formatDateTime(iso: string | undefined | null) {
  if (iso == null || iso === '') return '—';
  const d = dayjs(iso);
  return d.isValid() ? d.tz('America/Los_Angeles').format('MMM D, YYYY h:mm A') : '—';
}

type ItemDialogRow =
  | { kind: 'transaction'; id: string; at: string; group: VehicleInventoryTransactionGroup }
  | { kind: 'audit'; id: string; at: string; entry: HistoryEntry };

type Props = {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  inventoryId: string | null;
  inventoryName: string;
};

export function VehicleInventoryItemHistoryDialog({
  open,
  onClose,
  vehicleId,
  inventoryId,
  inventoryName,
}: Props) {
  const router = useRouter();
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const table = useTable({ defaultRowsPerPage: 10 });
  const { onResetPage, page, rowsPerPage, setPage } = table;

  useEffect(() => {
    if (open) {
      onResetPage();
    }
  }, [open, inventoryId, onResetPage]);

  const { data: historyData, isLoading: isLoadingHistory, isError: isHistoryError } = useQuery({
    queryKey: ['vehicle-history', vehicleId, 'inventory-item-full', inventoryId],
    queryFn: async () => {
      if (!vehicleId || !inventoryId) return { history: [], pagination: { total: 0 } };
      const params = new URLSearchParams({
        limit: '5000',
        offset: '0',
        inventory_id: inventoryId,
      });
      const response = await fetcher(
        `${endpoints.management.vehicle}/${vehicleId}/history?${params.toString()}`
      );
      return response.data;
    },
    enabled: open && !!vehicleId && !!inventoryId,
  });

  const { data: transactionsPayload, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['vehicle-inventory-transactions', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return { transactions: [], pagination: { total: 0 } };
      const response = await fetcher(
        `${endpoints.management.vehicle}/${vehicleId}/inventory/transactions?limit=10000&offset=0`
      );
      return response.data;
    },
    enabled: open && !!vehicleId && !!inventoryId,
  });

  const mergedRows = useMemo((): ItemDialogRow[] => {
    if (!inventoryId) return [];

    const transactions = (transactionsPayload?.transactions || []) as any[];
    const forItem = transactions.filter((t) => t.inventory_id === inventoryId);
    const groups = groupVehicleInventoryTransactions(forItem);

    const rawHistory = (historyData?.history || []) as HistoryEntry[];
    const audit = rawHistory.filter(
      (e) =>
        e.action_type !== 'vehicle_to_site' &&
        e.action_type !== 'site_to_vehicle' &&
        e.action_type !== 'inventory_drop_off'
    );

    const rows: ItemDialogRow[] = [];
    groups.forEach((g) => {
      rows.push({ kind: 'transaction', id: `tx-${g.id}`, at: g.created_at, group: g });
    });
    audit.forEach((e) => {
      rows.push({ kind: 'audit', id: `audit-${e.id}`, at: e.changed_at, entry: e });
    });
    rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return rows;
  }, [inventoryId, transactionsPayload?.transactions, historyData?.history]);

  const totalCount = mergedRows.length;

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return mergedRows.slice(start, start + rowsPerPage);
  }, [mergedRows, page, rowsPerPage]);

  useEffect(() => {
    if (!open || totalCount === 0) return;
    const maxPage = Math.max(0, Math.ceil(totalCount / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [open, totalCount, rowsPerPage, page, setPage]);

  const isLoading = isLoadingHistory || isLoadingTransactions;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          <Typography variant="h6" component="span" sx={{ pr: 2 }}>
            History — {inventoryName}
          </Typography>
          <IconButton onClick={onClose} aria-label="Close">
            <Iconify icon={'eva:close-fill' as any} />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            minHeight: 280,
            display: 'flex',
            flexDirection: 'column',
            p: 0,
          }}
        >
          <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}
            {isHistoryError && (
              <Typography color="error" variant="body2">
                Failed to load history.
              </Typography>
            )}
            {!isLoading && !isHistoryError && mergedRows.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No history entries for this item on this vehicle yet.
              </Typography>
            )}
            {!isLoading && paginatedRows.length > 0 && (
              <Stack spacing={2}>
                {paginatedRows.map((row) => {
                  if (row.kind === 'transaction') {
                    const group = row.group;
                    const nameParts = String(group.display_name || 'U').split(' ').filter(Boolean);
                    const initial = nameParts[0]?.charAt(0).toUpperCase() || 'U';
                    const photoUrl = group.initiated_by_photo_url || null;

                    return (
                      <Box
                        key={row.id}
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          bgcolor: 'background.neutral',
                          borderLeft: '3px solid',
                          borderColor:
                            group.transaction_type === 'vehicle_to_site'
                              ? 'warning.main'
                              : group.transaction_type === 'site_to_vehicle'
                                ? 'success.main'
                                : 'divider',
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar
                              src={photoUrl || undefined}
                              alt={group.display_name}
                              sx={{ width: 32, height: 32, flexShrink: 0 }}
                            >
                              {initial}
                            </Avatar>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{
                                flexWrap: 'wrap',
                                columnGap: 1,
                                rowGap: 0.5,
                                justifyContent: 'flex-start',
                                minWidth: 0,
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {group.display_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                {formatDateTime(group.created_at)}
                              </Typography>
                              <Iconify
                                icon={getTransactionCategoryIcon(group.transaction_type) as any}
                                sx={{
                                  fontSize: 18,
                                  color: getTransactionCategoryColor(group.transaction_type),
                                  flexShrink: 0,
                                }}
                              />
                            </Stack>
                          </Stack>

                          {group.items.length === 1 ? (
                            <Box sx={{ pl: 5, display: 'flex', alignItems: 'center', gap: 1 }}>
                              {group.items[0].cover_url ? (
                                <Tooltip
                                  title={
                                    <Box
                                      component="img"
                                      src={group.items[0].cover_url}
                                      alt={group.items[0].inventory_name}
                                      sx={{
                                        width: 200,
                                        height: 200,
                                        objectFit: 'contain',
                                        borderRadius: 1,
                                        display: 'block',
                                      }}
                                    />
                                  }
                                  arrow
                                  placement="right"
                                >
                                  <Avatar
                                    src={group.items[0].cover_url}
                                    variant="rounded"
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      flexShrink: 0,
                                      cursor: 'pointer',
                                      '&:hover': { opacity: 0.85 },
                                    }}
                                    onClick={() => {
                                      setSelectedImageUrl(group.items[0].cover_url);
                                      setImageDialogOpen(true);
                                    }}
                                  />
                                </Tooltip>
                              ) : (
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, flexShrink: 0 }}>
                                  <Iconify icon={'solar:box-bold' as any} width={20} />
                                </Avatar>
                              )}
                              <Typography variant="body2">{formatTxnLine(group.items[0])}</Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ pl: 5 }}>
                              {formatGroupSummary(group)}
                            </Typography>
                          )}

                          {group.items.length === 1 ? (
                            <Box sx={{ pl: 5, pt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {group.items[0].sku && `SKU: ${group.items[0].sku}`}
                                {group.items[0].sku && group.items[0].inventory_type && ' • '}
                                {group.items[0].inventory_type &&
                                  `Type: ${group.items[0].inventory_type.charAt(0).toUpperCase() + group.items[0].inventory_type.slice(1)}`}
                              </Typography>
                              {(group.items[0].source_vehicle_license || group.items[0].dest_vehicle_license) && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Vehicle:{' '}
                                  {group.transaction_type === 'vehicle_to_site'
                                    ? `${group.items[0].source_vehicle_license || ''} ${group.items[0].source_vehicle_unit || ''}`.trim()
                                    : `${group.items[0].dest_vehicle_license || ''} ${group.items[0].dest_vehicle_unit || ''}`.trim()}
                                </Typography>
                              )}
                              {group.job_number && group.job_number !== '-' && group.job_number.trim() !== '' && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Job:{' '}
                                  {group.job_id ? (
                                    <Link
                                      component="button"
                                      variant="caption"
                                      onClick={() => {
                                        setSelectedJobId(group.job_id!);
                                        setJobDetailsOpen(true);
                                      }}
                                      sx={{
                                        color: 'primary.main',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                      }}
                                    >
                                      {group.job_number}
                                    </Link>
                                  ) : (
                                    group.job_number
                                  )}
                                </Typography>
                              )}
                              {group.site_name && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Site:{' '}
                                  {group.site_id ? (
                                    <Link
                                      component="button"
                                      variant="caption"
                                      onClick={() => {
                                        router.push(
                                          `${paths.management.customer.site.edit(group.site_id!)}?tab=inventory`
                                        );
                                      }}
                                      sx={{
                                        color: 'primary.main',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                      }}
                                    >
                                      {group.site_name}
                                    </Link>
                                  ) : (
                                    group.site_name
                                  )}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Box sx={{ pl: 5, pt: 0.5 }}>
                              {group.items.map((t: any) => (
                                <Box key={t.id} sx={{ mb: 1.5 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {t.cover_url ? (
                                      <Tooltip
                                        title={
                                          <Box
                                            component="img"
                                            src={t.cover_url}
                                            alt={t.inventory_name}
                                            sx={{
                                              width: 200,
                                              height: 200,
                                              objectFit: 'contain',
                                              borderRadius: 1,
                                              display: 'block',
                                            }}
                                          />
                                        }
                                        arrow
                                        placement="right"
                                      >
                                        <Avatar
                                          src={t.cover_url}
                                          variant="rounded"
                                          sx={{
                                            width: 24,
                                            height: 24,
                                            flexShrink: 0,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            verticalAlign: 'middle',
                                            mr: 1,
                                            '&:hover': { opacity: 0.85 },
                                          }}
                                          onClick={() => {
                                            setSelectedImageUrl(t.cover_url);
                                            setImageDialogOpen(true);
                                          }}
                                        />
                                      </Tooltip>
                                    ) : (
                                      <Avatar
                                        variant="rounded"
                                        sx={{
                                          width: 24,
                                          height: 24,
                                          flexShrink: 0,
                                          display: 'inline-flex',
                                          verticalAlign: 'middle',
                                          mr: 1,
                                        }}
                                      >
                                        <Iconify icon={'solar:box-bold' as any} width={16} />
                                      </Avatar>
                                    )}
                                    {formatTxnLine(t)}
                                    {t.sku && ` SKU: ${t.sku}`}
                                    {t.inventory_type &&
                                      ` • Type: ${t.inventory_type.charAt(0).toUpperCase() + t.inventory_type.slice(1)}`}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}

                          {group.items.length > 1 && group.job_number && group.job_number !== '-' && group.job_number.trim() !== '' && (
                            <Box sx={{ pl: 5, pt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Job:{' '}
                                {group.job_id ? (
                                  <Link
                                    component="button"
                                    variant="caption"
                                    onClick={() => {
                                      setSelectedJobId(group.job_id!);
                                      setJobDetailsOpen(true);
                                    }}
                                    sx={{
                                      color: 'primary.main',
                                      cursor: 'pointer',
                                      fontWeight: 800,
                                    }}
                                  >
                                    #{group.job_number}
                                  </Link>
                                ) : (
                                  group.job_number
                                )}
                              </Typography>
                            </Box>
                          )}

                          {group.items.length > 1 && group.site_name && group.site_id && (
                            <Box sx={{ pl: 5, pt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Site:{' '}
                                <Link
                                  component="button"
                                  variant="caption"
                                  onClick={() => {
                                    router.push(
                                      `${paths.management.customer.site.edit(group.site_id!)}?tab=inventory`
                                    );
                                  }}
                                  sx={{
                                    color: 'primary.main',
                                    cursor: 'pointer',
                                    fontWeight: 800,
                                  }}
                                >
                                  {group.site_name}
                                </Link>
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    );
                  }

                  const entry = row.entry;
                  const nameParts = entry.changed_by
                    ? `${entry.changed_by.first_name} ${entry.changed_by.last_name}`.split(' ').filter(Boolean)
                    : ['S'];
                  const initial = nameParts[0]?.charAt(0).toUpperCase() || 'S';
                  const photoUrl = entry.changed_by?.photo_url || null;

                  return (
                    <Box
                      key={row.id}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: 'background.neutral',
                        borderLeft: '3px solid',
                        borderColor: getActionColor(entry.action_type),
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Avatar
                          src={photoUrl || undefined}
                          alt={
                            entry.changed_by
                              ? `${entry.changed_by.first_name} ${entry.changed_by.last_name}`
                              : 'System'
                          }
                          sx={{ width: 32, height: 32, flexShrink: 0 }}
                        >
                          {initial}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{
                              mb: 0.5,
                              flexWrap: 'wrap',
                              columnGap: 1,
                              rowGap: 0.5,
                              justifyContent: 'flex-start',
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {entry.changed_by
                                ? `${entry.changed_by.first_name} ${entry.changed_by.last_name}`
                                : 'System'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                              {formatDateTime(entry.changed_at)}
                            </Typography>
                            <Iconify
                              icon={getActionIcon(entry.action_type) as any}
                              sx={{ fontSize: 18, color: getActionColor(entry.action_type), flexShrink: 0 }}
                            />
                          </Stack>
                          <VehicleHistoryAuditEntryContent
                            entry={entry}
                            setSelectedImageUrl={setSelectedImageUrl}
                            setImageDialogOpen={setImageDialogOpen}
                          />
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
          {!isLoading && !isHistoryError && totalCount > 0 && (
            <TablePaginationCustom
              page={table.page}
              count={totalCount}
              rowsPerPage={table.rowsPerPage}
              rowsPerPageOptions={[10, 25, 50]}
              onPageChange={table.onChangePage}
              onRowsPerPageChange={table.onChangeRowsPerPage}
              sx={{ borderTop: 1, borderColor: 'divider', flexShrink: 0 }}
            />
          )}
        </DialogContent>
      </Dialog>

      <JobDetailsDialog
        open={jobDetailsOpen}
        onClose={() => setJobDetailsOpen(false)}
        jobId={selectedJobId}
      />

      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth={false}
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxWidth: 'min(96vw, 1680px)',
            width: '100%',
            maxHeight: '92vh',
            m: 2,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Image preview
          <IconButton onClick={() => setImageDialogOpen(false)}>
            <Iconify icon={'eva:close-fill' as any} />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            p: { xs: 1, sm: 2 },
            minHeight: 0,
          }}
        >
          {selectedImageUrl && (
            <Box
              component="img"
              src={selectedImageUrl}
              alt="Preview"
              sx={{
                maxWidth: '100%',
                maxHeight: 'min(calc(92vh - 120px), 1400px)',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
