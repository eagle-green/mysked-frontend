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

export type HistoryEntry = {
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

export const getActionColor = (actionType: string): string => {
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
    case 'vehicle_to_site':
      return 'warning.main';
    case 'site_to_vehicle':
      return 'success.main';
    default:
      return 'divider';
  }
};

export const getActionIcon = (actionType: string): string => {
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
    case 'vehicle_to_site':
      return 'solar:upload-bold';
    case 'site_to_vehicle':
      return 'solar:download-bold';
    default:
      return 'solar:clock-circle-bold';
  }
};

/** Site transaction row: drop-off vs pick-up (same icons/colors as audit history for those action types). */
export const getTransactionCategoryIcon = (transactionType: string): string => {
  if (transactionType === 'vehicle_to_site' || transactionType === 'site_to_vehicle') {
    return getActionIcon(transactionType);
  }
  return 'solar:box-bold';
};

export const getTransactionCategoryColor = (transactionType: string): string => {
  if (transactionType === 'vehicle_to_site' || transactionType === 'site_to_vehicle') {
    return getActionColor(transactionType);
  }
  return 'text.secondary';
};

export type VehicleInventoryTransactionGroup = {
  id: string;
  created_at: string;
  transaction_type: string;
  display_name: string;
  items: any[];
  job_id: string | null;
  job_number: string | null;
  site_id: string | null;
  site_name: string | null;
  initiated_by_photo_url: string | null;
};

/** Same grouping as Drop-off / Pick-up / All tabs (5s window + user + site). */
export function groupVehicleInventoryTransactions(
  transactions: any[]
): VehicleInventoryTransactionGroup[] {
  if (!transactions.length) return [];

  const groups = new Map<string, VehicleInventoryTransactionGroup>();
  for (const t of transactions) {
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
}

export function formatGroupSummary(group: VehicleInventoryTransactionGroup | any): string {
  const count = group.items.length;
  if (group.transaction_type === 'vehicle_to_site') {
    return `Left ${count} item${count === 1 ? '' : 's'} at ${group.site_name || ''}`.trim();
  }
  if (group.transaction_type === 'site_to_vehicle') {
    return `Picked up ${count} item${count === 1 ? '' : 's'} from ${group.site_name || ''}`.trim();
  }
  return `${count} item${count === 1 ? '' : 's'}`;
}

export function formatTxnLine(t: any): string {
  const qty = Number(t.quantity) || 0;
  const itemName = t.inventory_name || 'Unknown Item';
  const siteName = t.site_name || '';
  if (t.transaction_type === 'vehicle_to_site')
    return `Left ${qty} ${itemName} at ${siteName}`.trim();
  if (t.transaction_type === 'site_to_vehicle')
    return `Picked up ${qty} ${itemName} from ${siteName}`.trim();
  return `${qty} ${itemName}`;
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'vehicle_info', label: 'Vehicle Info' },
  { value: 'picture', label: 'Picture' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'drop-off', label: 'Drop-off' },
  { value: 'pick-up', label: 'Pick-up' },
  { value: 'audit', label: 'Audit' },
];

// ----------------------------------------------------------------------

type DriverSnapshot = {
  user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
  display_name?: string;
};

function formatDriverSnapshotDisplay(s: DriverSnapshot | undefined | null): string {
  if (!s) return '';
  const d = (s.display_name || '').trim();
  if (d) return d;
  return [s.first_name, s.last_name].filter(Boolean).join(' ').trim();
}

/** Stored on the server at log time — current vehicle assignment may differ later. */
function VehicleInventoryDriverLines({ metadata }: { metadata: Record<string, unknown> | null | undefined }) {
  const m = metadata as Record<string, unknown> | undefined;
  if (!m) return null;

  const srcLabel = m.source_vehicle_label as string | undefined;
  const srcDriver = m.source_driver_snapshot as DriverSnapshot | undefined;
  const destLabel = m.destination_vehicle_label as string | undefined;
  const destDriver = m.destination_driver_snapshot as DriverSnapshot | undefined;

  const hasSource = Boolean(srcLabel) || Boolean(formatDriverSnapshotDisplay(srcDriver));
  const hasDest = Boolean(destLabel) || Boolean(formatDriverSnapshotDisplay(destDriver));

  if (hasSource) {
    return (
      <Stack spacing={0.25}>
        {srcLabel ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Source vehicle · {srcLabel}
          </Typography>
        ) : null}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Driver at transfer · {formatDriverSnapshotDisplay(srcDriver) || 'Unassigned'}
        </Typography>
      </Stack>
    );
  }

  if (hasDest) {
    return (
      <Stack spacing={0.25}>
        {destLabel ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Destination vehicle · {destLabel}
          </Typography>
        ) : null}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Driver at transfer · {formatDriverSnapshotDisplay(destDriver) || 'Unassigned'}
        </Typography>
      </Stack>
    );
  }

  return null;
}

type VehicleHistoryAuditEntryContentProps = {
  entry: HistoryEntry;
  setSelectedImageUrl: (url: string) => void;
  setImageDialogOpen: (open: boolean) => void;
};

function InventoryThumbPlaceholder() {
  return (
    <Avatar
      variant="rounded"
      sx={{
        width: 32,
        height: 32,
        flexShrink: 0,
        bgcolor: 'action.hover',
      }}
    >
      <Iconify icon={'solar:box-bold' as any} width={18} />
    </Avatar>
  );
}

function PictureThumbPlaceholder() {
  return (
    <Avatar
      variant="rounded"
      sx={{
        width: 32,
        height: 32,
        flexShrink: 0,
        bgcolor: 'action.hover',
      }}
    >
      <Iconify icon={'solar:camera-bold' as any} width={18} />
    </Avatar>
  );
}

/** Drop-off style: inventory thumbnails left, description + details right. */
export function VehicleHistoryAuditEntryContent({
  entry,
  setSelectedImageUrl,
  setImageDialogOpen,
}: VehicleHistoryAuditEntryContentProps) {
  const meta = (entry.metadata || {}) as Record<string, any>;
  const hasMeta = entry.metadata && Object.keys(entry.metadata).length > 0;

  if (!hasMeta) {
    return (
      <Typography variant="body2" sx={{ pt: 0.5, fontWeight: 500 }}>
        {entry.description}
      </Typography>
    );
  }

  const isPictureAction = entry.action_type === 'picture_added' || entry.action_type === 'picture_deleted';
  const isInventoryThumbAction = [
    'inventory_added',
    'inventory_updated',
    'inventory_removed',
    'inventory_adjustment',
    'inventory_missing',
    'inventory_damaged',
  ].includes(entry.action_type);

  const items = Array.isArray(meta.items) ? meta.items : [];
  /** Audit/adjustment with a changes[] block already shows a thumb per line — skip duplicate left strip/cover. */
  const hasPerLineChangesList =
    (entry.action_type === 'inventory_audit' || entry.action_type === 'inventory_adjustment') &&
    Array.isArray(meta.changes) &&
    (meta.changes as unknown[]).length > 0;

  const coverUrl = meta.cover_url as string | undefined;
  const leftColumnCoverUrl = hasPerLineChangesList ? undefined : coverUrl;
  const showItemsStrip =
    !hasPerLineChangesList &&
    items.length > 0 &&
    (items.length > 1 || !meta.cover_url);
  const hasInventoryVisual = Boolean(showItemsStrip || leftColumnCoverUrl);
  const pictureUrl = meta.picture_url as string | undefined;
  const hasPicture = Boolean(pictureUrl);

  const showInventoryPlaceholderOnly =
    isInventoryThumbAction &&
    !showItemsStrip &&
    !leftColumnCoverUrl &&
    !hasPicture &&
    !hasPerLineChangesList;

  const showPicturePlaceholder =
    isPictureAction && !pictureUrl && Boolean(meta.picture_id);

  const showLeftColumn =
    hasInventoryVisual ||
    hasPicture ||
    showInventoryPlaceholderOnly ||
    showPicturePlaceholder;

  const openInventoryImage = (url: string) => {
    setSelectedImageUrl(url);
    setImageDialogOpen(true);
  };

  return (
    <Box sx={{ pt: 0.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {showLeftColumn && (
          <Stack spacing={1} sx={{ flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
            {showItemsStrip ? (
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ maxWidth: 168, justifyContent: 'flex-start' }}>
                {items.map((item: Record<string, unknown>, itemIdx: number) => {
                  const url = (item.cover_url ?? item.coverUrl) as string | undefined;
                  const name = (item.inventory_name ?? item.inventoryName) as string | undefined;
                  if (!url) {
                    return <InventoryThumbPlaceholder key={itemIdx} />;
                  }
                  return (
                    <Tooltip
                      key={itemIdx}
                      title={
                        <Box
                          component="img"
                          src={url}
                          alt={name || 'Inventory item'}
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
                        src={url}
                        variant="rounded"
                        sx={{
                          width: 32,
                          height: 32,
                          flexShrink: 0,
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.85 },
                        }}
                        onClick={() => openInventoryImage(url)}
                      />
                    </Tooltip>
                  );
                })}
              </Stack>
            ) : leftColumnCoverUrl ? (
              <Tooltip
                title={
                  <Box
                    component="img"
                    src={leftColumnCoverUrl}
                    alt={meta.inventory_name || 'Inventory item'}
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
                  src={leftColumnCoverUrl}
                  variant="rounded"
                  sx={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.85 },
                  }}
                  onClick={() => openInventoryImage(leftColumnCoverUrl)}
                />
              </Tooltip>
            ) : showInventoryPlaceholderOnly ? (
              <InventoryThumbPlaceholder />
            ) : null}

            {isPictureAction ? (
              pictureUrl ? (
                <Tooltip
                  title={
                    <Box
                      component="img"
                      src={pictureUrl}
                      alt={meta.file_name || 'Vehicle picture'}
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
                    src={pictureUrl}
                    variant="rounded"
                    sx={{
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.85 },
                    }}
                    onClick={() => openInventoryImage(pictureUrl)}
                  />
                </Tooltip>
              ) : showPicturePlaceholder ? (
                <PictureThumbPlaceholder />
              ) : null
            ) : null}
          </Stack>
        )}

        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {entry.description}
          </Typography>

          <VehicleInventoryDriverLines metadata={entry.metadata} />

          {meta.driver_name ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Driver: {String(meta.driver_name)}
            </Typography>
          ) : null}

          {meta.inventory_name &&
          !['inventory_added', 'inventory_updated', 'inventory_removed'].includes(entry.action_type) ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Item: {String(meta.inventory_name)}
            </Typography>
          ) : null}

          {(entry.action_type === 'inventory_audit' || entry.action_type === 'inventory_adjustment') &&
          meta.changes ? (
            <Box sx={{ mt: 0.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}
              >
                Changes:
              </Typography>
              {Array.isArray(meta.changes) &&
                (meta.changes as any[]).map((change: any, idx: number) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    {change.cover_url ? (
                      <Tooltip
                        title={
                          <Box
                            component="img"
                            src={change.cover_url}
                            alt={change.inventory_name || 'Inventory item'}
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
                          src={change.cover_url}
                          variant="rounded"
                          sx={{
                            width: 24,
                            height: 24,
                            flexShrink: 0,
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.85 },
                          }}
                          onClick={() => {
                            setSelectedImageUrl(change.cover_url);
                            setImageDialogOpen(true);
                          }}
                        />
                      </Tooltip>
                    ) : (
                      <Avatar variant="rounded" sx={{ width: 24, height: 24, flexShrink: 0 }}>
                        <Iconify icon={'solar:box-bold' as any} width={16} />
                      </Avatar>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      • {change.inventory_name}: {change.old_quantity} → {change.new_quantity}
                    </Typography>
                  </Box>
                ))}
            </Box>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}

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

  // For site inventory transactions (drop-off, pick-up, and all tabs)
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
    enabled: !!vehicleId && (filter === 'all' || filter === 'drop-off' || filter === 'pick-up'),
  });

  const history = useMemo(
    () => (auditHistoryData?.history || []) as HistoryEntry[],
    [auditHistoryData?.history]
  );
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

  // Group transactions for Drop-off, Pick-up, and All tabs (similar to site inventory history)
  const groupedTransactions = useMemo(() => {
    if ((filter !== 'all' && filter !== 'drop-off' && filter !== 'pick-up') || filteredTransactions.length === 0)
      return [];
    return groupVehicleInventoryTransactions(filteredTransactions);
  }, [filteredTransactions, filter]);

  // Merge audit history and grouped transactions into one timeline for "All" tab
  const mergedTimeline = useMemo(() => {
    if (filter !== 'all') return [];
    
    type TimelineItem = {
      id: string;
      timestamp: string;
      type: 'audit' | 'transaction';
      data: HistoryEntry | any;
    };
    
    const items: TimelineItem[] = [];
    
    // Audit rows for site transfers duplicate inventory_transactions (richer). Omit audit-only duplicates.
    history.forEach((entry) => {
      if (
        entry.action_type === 'vehicle_to_site' ||
        entry.action_type === 'site_to_vehicle' ||
        entry.action_type === 'inventory_drop_off'
      ) {
        return;
      }
      items.push({
        id: `audit-${entry.id}`,
        timestamp: entry.changed_at,
        type: 'audit',
        data: entry,
      });
    });
    
    // Add grouped transaction items
    groupedTransactions.forEach((group) => {
      items.push({
        id: `transaction-${group.id}`,
        timestamp: group.created_at,
        type: 'transaction',
        data: group,
      });
    });
    
    // Sort by timestamp (newest first)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [filter, history, groupedTransactions]);

  // Paginate grouped transactions (for drop-off/pick-up tabs)
  const paginatedGroupedTransactions = useMemo(() => {
    if (filter !== 'drop-off' && filter !== 'pick-up') return [];
    const startIndex = table.page * table.rowsPerPage;
    const endIndex = startIndex + table.rowsPerPage;
    return groupedTransactions.slice(startIndex, endIndex);
  }, [groupedTransactions, filter, table.page, table.rowsPerPage]);

  // Paginate merged timeline (for "All" tab)
  const paginatedMergedTimeline = useMemo(() => {
    if (filter !== 'all') return [];
    const startIndex = table.page * table.rowsPerPage;
    const endIndex = startIndex + table.rowsPerPage;
    return mergedTimeline.slice(startIndex, endIndex);
  }, [mergedTimeline, filter, table.page, table.rowsPerPage]);

  const totalGroupedCount = groupedTransactions.length;
  const totalMergedCount = mergedTimeline.length;

  const formatDateTime = (iso: string | undefined | null) => {
    if (iso == null || iso === '') return '—';
    const d = dayjs(iso);
    return d.isValid() ? d.tz('America/Los_Angeles').format('MMM D, YYYY h:mm A') : '—';
  };

  const isLoading = (filter === 'all') 
    ? (isLoadingAuditHistory || isLoadingSiteTransactions)
    : (filter === 'drop-off' || filter === 'pick-up') 
      ? isLoadingSiteTransactions 
      : isLoadingAuditHistory;

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

        {/* All Tab - Merged timeline with pagination */}
        {filter === 'all' ? (
          <>
            {paginatedMergedTimeline.length === 0 ? (
              <EmptyContent
                title="No history"
                description="No history found for this vehicle."
                sx={{ py: 10 }}
              />
            ) : (
              <>
                <Stack spacing={2}>
                  {paginatedMergedTimeline.map((item) => {
                    if (item.type === 'audit') {
                      const entry = item.data as HistoryEntry;
                      const nameParts = entry.changed_by
                        ? `${entry.changed_by.first_name} ${entry.changed_by.last_name}`.split(' ').filter(Boolean)
                        : ['S'];
                      const initial = nameParts[0]?.charAt(0).toUpperCase() || 'S';
                      const photoUrl = entry.changed_by?.photo_url || null;

                      return (
                        <Box
                          key={item.id}
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
                              alt={entry.changed_by ? `${entry.changed_by.first_name} ${entry.changed_by.last_name}` : 'System'}
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
                    } else {
                      // Transaction item
                      const group = item.data;
                      const nameParts = String(group.display_name || 'U').split(' ').filter(Boolean);
                      const initial = nameParts[0]?.charAt(0).toUpperCase() || 'U';
                      const photoUrl = group.initiated_by_photo_url || null;

                      return (
                        <Box
                          key={item.id}
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
                                {group.job_number && group.job_number !== '-' && group.job_number.trim() !== '' && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Job:{' '}
                                    {group.job_id ? (
                                      <Link
                                        component="button"
                                        variant="caption"
                                        onClick={() => {
                                          setSelectedJobId(group.job_id);
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
                          </Stack>
                        </Box>
                      );
                    }
                  })}
                </Stack>

                {/* Pagination for All tab */}
                <TablePaginationCustom
                  page={table.page}
                  count={totalMergedCount}
                  rowsPerPage={table.rowsPerPage}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  onPageChange={table.onChangePage}
                  onRowsPerPageChange={table.onChangeRowsPerPage}
                  sx={{ mt: 2 }}
                />
              </>
            )}
          </>
        ) : (filter === 'drop-off' || filter === 'pick-up') ? (
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
              </Stack>
              <VehicleHistoryAuditEntryContent
                entry={entry}
                setSelectedImageUrl={setSelectedImageUrl}
                setImageDialogOpen={setImageDialogOpen}
              />
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

      {/* Image Dialog — large viewport for photos */}
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
            <Iconify icon={"eva:close-fill" as any} />
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

