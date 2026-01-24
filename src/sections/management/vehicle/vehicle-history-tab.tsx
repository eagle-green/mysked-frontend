import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useMemo, useState } from 'react';
import timezone from 'dayjs/plugin/timezone';
import { useQuery } from '@tanstack/react-query';

dayjs.extend(utc);
dayjs.extend(timezone);

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { useTable, TablePaginationCustom } from 'src/components/table';

import { JobDetailsDialog } from 'src/sections/work/calendar/job-details-dialog';

// ----------------------------------------------------------------------

type Props = {
  vehicleId: string;
};

type HistoryEntry = {
  id: string;
  action_type: string;
  changed_by: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  changed_at: string;
  field_name?: string | null;
  old_value?: unknown;
  new_value?: unknown;
  description: string;
  metadata?: Record<string, unknown> | null;
};

const getActionColor = (actionType: string): string => {
  switch (actionType) {
    case 'created':
      return 'success.main';
    case 'updated':
      return 'info.main';
    case 'picture_added':
      return 'primary.main';
    case 'picture_deleted':
      return 'error.main';
    case 'inventory_added':
      return 'success.main';
    case 'inventory_updated':
      return 'warning.main';
    case 'inventory_removed':
      return 'error.main';
    case 'inventory_adjustment':
      return 'info.main';
    case 'inventory_audit':
      return 'primary.main';
    case 'driver_assigned':
      return 'info.main';
    case 'driver_unassigned':
      return 'warning.main';
    default:
      return 'divider';
  }
};

const getActionIcon = (actionType: string): string => {
  switch (actionType) {
    case 'created':
    case 'updated':
    case 'driver_assigned':
    case 'driver_unassigned':
      return 'ic:baseline-fire-truck';
    case 'picture_added':
    case 'picture_deleted':
      return 'solar:camera-bold';
    case 'inventory_added':
    case 'inventory_updated':
    case 'inventory_removed':
    case 'inventory_adjustment':
      return 'solar:box-bold';
    case 'inventory_audit':
      return 'solar:clipboard-check-bold';
    default:
      return 'solar:clock-circle-bold';
  }
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'vehicle_info', label: 'Vehicle Info' },
  { value: 'picture', label: 'Picture' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'drop-off', label: 'Drop-off' },
  { value: 'pick-up', label: 'Pick-up' },
  { value: 'audit', label: 'Audit' },
];

export function VehicleHistoryTab({ vehicleId }: Props) {
  const router = useRouter();
  const table = useTable({ 
    defaultRowsPerPage: 10, 
    defaultOrderBy: 'changed_at', 
    defaultOrder: 'desc' 
  });
  const [filter, setFilter] = useState('all');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  // For audit history (all, vehicle_info, picture, inventory, audit tabs)
  const { data: auditHistoryData, isLoading: isLoadingAuditHistory } = useQuery({
    queryKey: ['vehicle-history', vehicleId, filter, table.page, table.rowsPerPage],
    queryFn: async () => {
      if (!vehicleId) return { history: [], pagination: { total: 0 } };
      
      const params = new URLSearchParams({
        limit: table.rowsPerPage.toString(),
        offset: (table.page * table.rowsPerPage).toString(),
      });

      if (filter !== 'all' && filter !== 'drop-off' && filter !== 'pick-up') {
        params.append('action_type', filter);
      }

      const response = await fetcher(
        `${endpoints.management.vehicle}/${vehicleId}/history?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!vehicleId && filter !== 'drop-off' && filter !== 'pick-up',
  });

  // For site inventory transactions (drop-off and pick-up tabs)
  const { data: siteTransactionsData, isLoading: isLoadingSiteTransactions } = useQuery({
    queryKey: ['vehicle-inventory-transactions', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return { transactions: [], pagination: { total: 0 } };
      
      // Fetch all transactions for frontend grouping and pagination
      const response = await fetcher(
        `${endpoints.management.vehicle}/${vehicleId}/inventory/transactions?limit=10000&offset=0`
      );
      return response.data; // Backend returns { data: { transactions, pagination } }
    },
    enabled: !!vehicleId && (filter === 'drop-off' || filter === 'pick-up'),
  });

  const history = (auditHistoryData?.history || []) as HistoryEntry[];
  const totalCount = auditHistoryData?.pagination?.total || 0;
  
  const transactions = useMemo(() => siteTransactionsData?.transactions || [], [siteTransactionsData?.transactions]);

  // Filter transactions based on selected tab
  const filteredTransactions = useMemo(() => {
    if (filter === 'drop-off') {
      return transactions.filter((t: any) => t.transaction_type === 'vehicle_to_site');
    }
    if (filter === 'pick-up') {
      return transactions.filter((t: any) => t.transaction_type === 'site_to_vehicle');
    }
    return transactions;
  }, [transactions, filter]);

  // Group transactions for Drop-off and Pick-up tabs (similar to site inventory history)
  const groupedTransactions = useMemo(() => {
    if ((filter !== 'drop-off' && filter !== 'pick-up') || filteredTransactions.length === 0) return [];
    
    type Txn = any;
    type Group = {
      id: string;
      created_at: string;
      transaction_type: string;
      display_name: string;
      items: Txn[];
      job_id: string | null;
      job_number: string | null;
      site_id: string | null;
      site_name: string | null;
      initiated_by_photo_url: string | null;
    };

    const groups = new Map<string, Group>();
    for (const t of filteredTransactions) {
      const displayName =
        t.submitted_by_first_name && t.submitted_by_last_name
          ? `${t.submitted_by_first_name} ${t.submitted_by_last_name}`
          : 'System';

      const timestamp = new Date(t.created_at).getTime();
      const timeWindow = Math.floor(timestamp / 5000);
      const key = `${t.transaction_type}:${timeWindow}:${displayName}:${t.site_id || ''}`;

      const existing = groups.get(key);
      if (existing) {
        existing.items.push(t);
      } else {
        groups.set(key, {
          id: key,
          created_at: t.created_at,
          transaction_type: t.transaction_type,
          display_name: displayName,
          items: [t],
          job_id: t.job_id || null,
          job_number: t.job_number || null,
          site_id: t.site_id || null,
          site_name: t.site_name || null,
          initiated_by_photo_url: t.initiated_by_photo_url || null,
        });
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredTransactions, filter]);

  // Paginate grouped transactions
  const paginatedGroupedTransactions = useMemo(() => {
    if (filter !== 'drop-off' && filter !== 'pick-up') return [];
    const startIndex = table.page * table.rowsPerPage;
    const endIndex = startIndex + table.rowsPerPage;
    return groupedTransactions.slice(startIndex, endIndex);
  }, [groupedTransactions, filter, table.page, table.rowsPerPage]);

  const totalGroupedCount = groupedTransactions.length;

  const formatDateTime = (iso: string) =>
    dayjs(iso).tz('America/Los_Angeles').format('MMM D, YYYY h:mm A');

  const formatGroupSummary = (group: any) => {
    const count = group.items.length;
    if (group.transaction_type === 'vehicle_to_site') {
      return `Left ${count} item${count === 1 ? '' : 's'} at ${group.site_name || ''}`.trim();
    }
    if (group.transaction_type === 'site_to_vehicle') {
      return `Picked up ${count} item${count === 1 ? '' : 's'} from ${group.site_name || ''}`.trim();
    }
    return `${count} item${count === 1 ? '' : 's'}`;
  };

  const formatTxnLine = (t: any) => {
    const qty = Number(t.quantity) || 0;
    const itemName = t.inventory_name || 'Unknown Item';
    const siteName = t.site_name || '';
    if (t.transaction_type === 'vehicle_to_site')
      return `Left ${qty} ${itemName} at ${siteName}`.trim();
    if (t.transaction_type === 'site_to_vehicle')
      return `Picked up ${qty} ${itemName} from ${siteName}`.trim();
    return `${qty} ${itemName}`;
  };

  const isLoading = (filter === 'drop-off' || filter === 'pick-up') ? isLoadingSiteTransactions : isLoadingAuditHistory;

  if (isLoading) {
    return (
      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={80} />
          <Skeleton variant="rectangular" height={80} />
          <Skeleton variant="rectangular" height={80} />
        </Stack>
      </Card>
    );
  }

  const handleFilterChange = (_event: React.SyntheticEvent, newValue: string) => {
    setFilter(newValue);
    table.onResetPage();
  };

  return (
    <>
      <Card sx={{ p: 3 }}>
        {/* Filter Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={filter} onChange={handleFilterChange}>
            {FILTER_OPTIONS.map((option) => (
              <Tab key={option.value} label={option.label} value={option.value} />
            ))}
          </Tabs>
        </Box>

        {/* Drop-off and Pick-up Tabs - Inventory Transactions Timeline */}
        {(filter === 'drop-off' || filter === 'pick-up') ? (
          filteredTransactions.length === 0 ? (
            <EmptyContent
              title="No history"
              description={`No ${filter === 'drop-off' ? 'drop-off' : 'pick-up'} transactions found for this vehicle.`}
              sx={{ py: 10 }}
            />
          ) : groupedTransactions.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <Iconify icon={"solar:box-bold" as any} sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                No {filter === 'drop-off' ? 'drop-off' : 'pick-up'} transactions
              </Typography>
            </Box>
          ) : (
            <>
              <Stack spacing={2}>
                {paginatedGroupedTransactions.map((group: any) => {
                  const nameParts = String(group.display_name || 'U').split(' ').filter(Boolean);
                  const initial = nameParts[0]?.charAt(0).toUpperCase() || 'U';
                  const photoUrl = group.initiated_by_photo_url || null;

                  return (
                    <Box
                      key={group.id}
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
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                              {group.display_name}
                            </Typography>
                            <Iconify
                              icon={"solar:box-bold" as any}
                              sx={{ fontSize: 18, color: 'text.secondary' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(group.created_at)}
                            </Typography>
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
                                <Iconify icon={"solar:box-bold" as any} width={20} />
                              </Avatar>
                            )}
                            <Typography variant="body2">
                              {formatTxnLine(group.items[0])}
                            </Typography>
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
                                      <Iconify icon={"solar:box-bold" as any} width={16} />
                                    </Avatar>
                                  )}
                                  {formatTxnLine(t)}
                                  {t.sku && ` SKU: ${t.sku}`}
                                  {t.inventory_type && ` • Type: ${t.inventory_type.charAt(0).toUpperCase() + t.inventory_type.slice(1)}`}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}

                        {group.job_number && group.job_number !== '-' && group.job_number.trim() !== '' && (
                          <Box sx={{ pl: 5, pt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Job:{' '}
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
                            </Typography>
                          </Box>
                        )}

                        {group.site_name && group.site_id && (
                          <Box sx={{ pl: 5, pt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Site:{' '}
                              <Link
                                component="button"
                                variant="caption"
                                onClick={() => {
                                  router.push(`${paths.management.customer.site.edit(group.site_id!)}?tab=inventory`);
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
                })}
              </Stack>

              <TablePaginationCustom
                page={table.page}
                count={totalGroupedCount}
                rowsPerPage={table.rowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100]}
                onPageChange={table.onChangePage}
                onRowsPerPageChange={table.onChangeRowsPerPage}
              />
            </>
          )
        ) : (
          /* Other tabs - Audit History List */
          history.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            color: 'text.secondary',
          }}
        >
          <Iconify icon="solar:clock-circle-bold" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body2">
            {filter === 'all' 
              ? 'No history available' 
              : `No ${FILTER_OPTIONS.find(f => f.value === filter)?.label.toLowerCase()} history`}
          </Typography>
        </Box>
      ) : (
        <>
          <Stack spacing={2} sx={{ mb: 3 }}>
            {history.map((entry) => (
          <Box
            key={entry.id}
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.neutral',
              borderLeft: '3px solid',
              borderColor: getActionColor(entry.action_type),
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                {entry.changed_by?.photo_url ? (
                  <Avatar
                    src={entry.changed_by.photo_url}
                    alt={`${entry.changed_by.first_name} ${entry.changed_by.last_name}`}
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                  >
                    {entry.changed_by.first_name?.charAt(0).toUpperCase()}
                  </Avatar>
                ) : entry.changed_by ? (
                  <Avatar
                    alt={`${entry.changed_by.first_name} ${entry.changed_by.last_name}`}
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                  >
                    {entry.changed_by.first_name?.charAt(0).toUpperCase() ||
                      entry.changed_by.last_name?.charAt(0).toUpperCase()}
                  </Avatar>
                ) : (
                  <Avatar sx={{ width: 32, height: 32, flexShrink: 0 }}>
                    <Iconify icon="solar:user-id-bold" width={20} />
                  </Avatar>
                )}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                    {entry.changed_by
                      ? `${entry.changed_by.first_name} ${entry.changed_by.last_name}`
                      : 'System'}
                  </Typography>
                  <Iconify
                    icon={getActionIcon(entry.action_type) as any}
                    sx={{ fontSize: 18, color: getActionColor(entry.action_type) }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(entry.changed_at).tz('America/Los_Angeles').format('MMM D, YYYY h:mm A')}
                  </Typography>
                </Stack>
              </Stack>
              <Typography variant="body2" sx={{ pl: 5 }}>
                {entry.description}
              </Typography>
              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                <Box sx={{ pl: 5, pt: 0.5 }}>
                  {(entry.metadata as any).picture_id && (
                    <Typography variant="caption" color="text.secondary">
                      Picture ID: {String((entry.metadata as any).picture_id)}
                    </Typography>
                  )}
                  {(entry.metadata as any).driver_name && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Driver: {String((entry.metadata as any).driver_name)}
                    </Typography>
                  )}
                  {(entry.metadata as any).inventory_name && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Item: {String((entry.metadata as any).inventory_name)}
                    </Typography>
                  )}
                  {(entry.action_type === 'inventory_audit' || entry.action_type === 'inventory_adjustment') && (entry.metadata as any).changes && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                        Changes:
                      </Typography>
                      {Array.isArray((entry.metadata as any).changes) && ((entry.metadata as any).changes as any[]).map((change: any, idx: number) => (
                        <Typography key={idx} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          • {change.inventory_name}: {change.old_quantity} → {change.new_quantity}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Stack>
          </Box>
        ))}
          </Stack>

            {/* Pagination */}
            <TablePaginationCustom
              page={table.page}
              count={totalCount}
              rowsPerPage={table.rowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onPageChange={table.onChangePage}
              onRowsPerPageChange={table.onChangeRowsPerPage}
            />
          </>
        )
        )}
      </Card>

      {/* Job Details Dialog */}
      <JobDetailsDialog
        open={jobDetailsOpen}
        onClose={() => setJobDetailsOpen(false)}
        jobId={selectedJobId}
      />

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Inventory Item Image
          <IconButton onClick={() => setImageDialogOpen(false)}>
            <Iconify icon={"eva:close-fill" as any} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImageUrl && (
            <Box
              component="img"
              src={selectedImageUrl}
              alt="Inventory item"
              sx={{
                width: '100%',
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

