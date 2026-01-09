import dayjs from 'dayjs';
import { useState, useMemo } from 'react';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useQuery } from '@tanstack/react-query';
import { useBoolean } from 'minimal-shared/hooks';

dayjs.extend(utc);
dayjs.extend(timezone);

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fetcher, endpoints } from 'src/lib/axios';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
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

type InventoryTransaction = {
  id: string;
  transaction_type: string;
  inventory_id: string;
  quantity: number;
  item_status: string | null;
  notes: string | null;
  created_at: string;
  timesheet_id: string | null;
  job_id: string | null;
  job_number: string | null;
  submitted_by_id: string | null;
  submitted_by_first_name: string | null;
  submitted_by_last_name: string | null;
  inventory_name: string;
  sku: string;
  inventory_type: string;
  cover_url: string | null;
  site_id: string | null;
  site_name: string | null;
  site_unit_number: string | null;
  site_street_number: string | null;
  site_street_name: string | null;
  site_city: string | null;
  site_province: string | null;
  site_postal_code: string | null;
  source_vehicle_id: string | null;
  source_vehicle_type: string | null;
  source_vehicle_license: string | null;
  source_vehicle_unit: string | null;
  dest_vehicle_id: string | null;
  dest_vehicle_type: string | null;
  dest_vehicle_license: string | null;
  dest_vehicle_unit: string | null;
  initiated_by_id: string | null;
  initiated_by_first_name: string | null;
  initiated_by_last_name: string | null;
  initiated_by_photo_url: string | null;
  worker_name: string | null;
  driver_name: string | null;
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
  { value: 'site', label: 'Site' },
  { value: 'audit', label: 'Audit' },
];

// Helper function to format site address
type SiteAddressFields = {
  site_unit_number: string | null;
  site_street_number: string | null;
  site_street_name: string | null;
  site_city: string | null;
  site_province: string | null;
  site_postal_code: string | null;
};

const getSiteAddress = (transaction: SiteAddressFields): string | null => {
  // Build address from fields
  const addressParts = [
    transaction.site_unit_number,
    transaction.site_street_number,
    transaction.site_street_name,
    transaction.site_city,
    transaction.site_province,
    transaction.site_postal_code,
  ].filter(Boolean);
  
  return addressParts.length > 0 ? addressParts.join(', ') : null;
};

export function VehicleHistoryTab({ vehicleId }: Props) {
  const router = useRouter();
  const table = useTable({ 
    defaultRowsPerPage: 25, 
    defaultOrderBy: 'changed_at', 
    defaultOrder: 'desc' 
  });
  const [filter, setFilter] = useState('all');
  const jobDetailsDialog = useBoolean();
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const imageDialog = useBoolean();
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

  // Query for regular vehicle history
  const { data, isLoading } = useQuery({
    queryKey: ['vehicle-history', vehicleId, filter, table.page, table.rowsPerPage],
    queryFn: async () => {
      if (!vehicleId) return { history: [], pagination: { total: 0 } };
      
      const params = new URLSearchParams({
        limit: table.rowsPerPage.toString(),
        offset: (table.page * table.rowsPerPage).toString(),
      });

      if (filter !== 'all' && filter !== 'site') {
        params.append('action_type', filter);
      }

      const response = await fetcher(
        `${endpoints.management.vehicle}/${vehicleId}/history?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!vehicleId && filter !== 'site',
  });

  // Query for inventory transactions (site-related) - fetch all for frontend grouping and pagination
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['vehicle-inventory-transactions', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return { transactions: [], pagination: { total: 0 } };
      
      const params = new URLSearchParams({
        limit: '10000',
        offset: '0',
      });

      const response = await fetcher(
        `${endpoints.management.vehicle}/${vehicleId}/inventory/transactions?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!vehicleId && (filter === 'site' || filter === 'all'),
  });

  const history = (data?.history || []) as HistoryEntry[];
  const transactions = (transactionsData?.transactions || []) as InventoryTransaction[];
  
  // Group transactions that occurred at the same time (same timestamp, driver, site, submitted_by, job)
  type GroupedTransaction = {
    id: string; // Use first transaction's ID
    transactions: InventoryTransaction[];
    created_at: string;
    driver_name: string | null;
    site_id: string | null;
    site_name: string | null;
    submitted_by_id: string | null;
    submitted_by_first_name: string | null;
    submitted_by_last_name: string | null;
    job_id: string | null;
    job_number: string | null;
    transaction_type: string;
    initiated_by_id: string | null;
    initiated_by_first_name: string | null;
    initiated_by_last_name: string | null;
    initiated_by_photo_url: string | null;
    worker_name: string | null;
    site_unit_number: string | null;
    site_street_number: string | null;
    site_street_name: string | null;
    site_city: string | null;
    site_province: string | null;
    site_postal_code: string | null;
  };
  
  const groupTransactions = (txns: InventoryTransaction[]): (GroupedTransaction | InventoryTransaction)[] => {
    if (txns.length === 0) return [];
    
    const grouped: GroupedTransaction[] = [];
    const processed = new Set<string>();
    
    for (let i = 0; i < txns.length; i++) {
      if (processed.has(txns[i].id)) continue;
      
      const txn = txns[i];
      const txnTime = new Date(txn.created_at).getTime();
      
      // Find all transactions that should be grouped with this one
      // Same timestamp (within 5 seconds), driver, site, submitted_by, job, and transaction_type
      const group: InventoryTransaction[] = [txn];
      processed.add(txn.id);
      
      for (let j = i + 1; j < txns.length; j++) {
        if (processed.has(txns[j].id)) continue;
        
        const otherTxn = txns[j];
        const otherTime = new Date(otherTxn.created_at).getTime();
        const timeDiff = Math.abs(txnTime - otherTime);
        
        // Check if transactions should be grouped (within 5 seconds and same metadata)
        if (
          timeDiff <= 5000 && // Within 5 seconds
          txn.driver_name === otherTxn.driver_name &&
          txn.site_id === otherTxn.site_id &&
          txn.submitted_by_id === otherTxn.submitted_by_id &&
          txn.job_id === otherTxn.job_id &&
          txn.transaction_type === otherTxn.transaction_type
        ) {
          group.push(otherTxn);
          processed.add(otherTxn.id);
        }
      }
      
      // If only one transaction, don't group it (it will be included in ungrouped)
      // Otherwise create a grouped transaction
      if (group.length > 1) {
        // Create grouped transaction using first transaction's metadata
        const first = group[0];
        grouped.push({
          id: `grouped-${first.id}`,
          transactions: group,
          created_at: first.created_at,
          driver_name: first.driver_name,
          site_id: first.site_id,
          site_name: first.site_name,
          submitted_by_id: first.submitted_by_id,
          submitted_by_first_name: first.submitted_by_first_name,
          submitted_by_last_name: first.submitted_by_last_name,
          job_id: first.job_id,
          job_number: first.job_number,
          transaction_type: first.transaction_type,
          initiated_by_id: first.initiated_by_id,
          initiated_by_first_name: first.initiated_by_first_name,
          initiated_by_last_name: first.initiated_by_last_name,
          initiated_by_photo_url: first.initiated_by_photo_url,
          worker_name: first.worker_name,
          site_unit_number: first.site_unit_number,
          site_street_number: first.site_street_number,
          site_street_name: first.site_street_name,
          site_city: first.site_city,
          site_province: first.site_province,
          site_postal_code: first.site_postal_code,
        });
      } else {
        // Single transaction - remove from processed so it's included in ungrouped
        processed.delete(txn.id);
      }
    }
    
    // Combine grouped transactions with ungrouped ones
    const ungrouped = txns.filter(t => !processed.has(t.id));
    const result: (GroupedTransaction | InventoryTransaction)[] = [...grouped, ...ungrouped];
    
    // Sort by created_at descending
    result.sort((a, b) => {
      const dateA = new Date('transactions' in a ? a.created_at : a.created_at).getTime();
      const dateB = new Date('transactions' in b ? b.created_at : b.created_at).getTime();
      return dateB - dateA;
    });
    
    return result;
  };
  
  const groupedTransactions = groupTransactions(transactions);
  
  // Paginate grouped transactions for 'site' tab
  const paginatedGroupedTransactions = useMemo(() => {
    if (filter !== 'site') return groupedTransactions;
    const startIndex = table.page * table.rowsPerPage;
    const endIndex = startIndex + table.rowsPerPage;
    return groupedTransactions.slice(startIndex, endIndex);
  }, [groupedTransactions, table.page, table.rowsPerPage, filter]);
  
  // Combine history and transactions for 'all' tab, sorted by date
  type CombinedHistoryItem = 
    | (HistoryEntry & { type: 'history'; sortDate: string })
    | (InventoryTransaction & { type: 'transaction'; sortDate: string })
    | (GroupedTransaction & { type: 'grouped_transaction'; sortDate: string });
  
  const allHistoryUnpaginated: CombinedHistoryItem[] = filter === 'all' 
    ? [
        ...history.map((h) => ({ ...h, type: 'history' as const, sortDate: h.changed_at })),
        ...groupedTransactions.map((item) => {
          if ('transactions' in item) {
            return { ...item, type: 'grouped_transaction' as const, sortDate: item.created_at };
          } else {
            return { ...item, type: 'transaction' as const, sortDate: item.created_at };
          }
        }),
      ].sort((a, b) => {
        const dateA = new Date(a.sortDate).getTime();
        const dateB = new Date(b.sortDate).getTime();
        return dateB - dateA; // Descending order (newest first)
      })
    : [];
  
  // Paginate 'all' tab
  const allHistory = useMemo(() => {
    if (filter !== 'all') return allHistoryUnpaginated;
    const startIndex = table.page * table.rowsPerPage;
    const endIndex = startIndex + table.rowsPerPage;
    return allHistoryUnpaginated.slice(startIndex, endIndex);
  }, [allHistoryUnpaginated, table.page, table.rowsPerPage, filter]);
  
  const totalCount = filter === 'site' 
    ? groupedTransactions.length
    : filter === 'all'
    ? allHistoryUnpaginated.length
    : (data?.pagination?.total || 0);
  const isLoadingData = filter === 'site' 
    ? isLoadingTransactions 
    : filter === 'all'
    ? isLoading || isLoadingTransactions
    : isLoading;

  const getTransactionDescription = (transaction: InventoryTransaction): string => {
    const itemName = transaction.inventory_name || 'Unknown Item';
    const quantity = transaction.quantity;
    const siteName = transaction.site_name || 'Unknown Site';
    
    if (transaction.transaction_type === 'vehicle_to_site') {
      return `Left ${quantity} ${itemName} at ${siteName}`;
    } else if (transaction.transaction_type === 'site_to_vehicle') {
      return `Picked up ${quantity} ${itemName} from ${siteName}`;
    }
    return `Transaction: ${quantity} ${itemName}`;
  };

  const getTransactionColor = (transactionType: string): string => {
    if (transactionType === 'vehicle_to_site') {
      return 'warning.main'; // Orange/yellow for drop-off
    } else if (transactionType === 'site_to_vehicle') {
      return 'success.main'; // Green for pickup
    }
    return 'divider';
  };

  if (isLoadingData) {
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
    <Card sx={{ p: 3 }}>
      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={filter} onChange={handleFilterChange}>
          {FILTER_OPTIONS.map((option) => (
            <Tab key={option.value} label={option.label} value={option.value} />
          ))}
        </Tabs>
      </Box>

      {/* History List */}
      {filter === 'site' || filter === 'all' ? (
        // Display inventory transactions (for 'site' tab) or combined (for 'all' tab)
        (filter === 'site' && groupedTransactions.length === 0) || (filter === 'all' && allHistoryUnpaginated.length === 0) ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: 'text.secondary',
            }}
          >
            <Iconify icon="solar:box-bold" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">
              {filter === 'site' 
                ? 'No site-related inventory transactions'
                : 'No history available'}
            </Typography>
          </Box>
        ) : (
          <>
            <Stack spacing={2} sx={{ mb: 3 }}>
              {(filter === 'all' ? allHistory : paginatedGroupedTransactions).map((item) => {
                // Handle grouped transactions (for 'site' tab)
                if (filter === 'site' && 'transactions' in item) {
                  const grouped = item as GroupedTransaction;
                  const displayName = grouped.submitted_by_first_name && grouped.submitted_by_last_name
                    ? `${grouped.submitted_by_first_name} ${grouped.submitted_by_last_name}`
                    : 'System';
                  
                  const siteName = grouped.site_name || 'Unknown Site';
                  const totalQuantity = grouped.transactions.reduce((sum, t) => sum + t.quantity, 0);
                  
                  // Avatar initial from displayName
                  const avatarInitial = displayName?.charAt(0)?.toUpperCase() || 'U';
                  
                  // Use submitted_by photo (transaction initiator)
                  const photoUrl = grouped.initiated_by_photo_url || null;
                  
                  return (
                    <Box
                      key={grouped.id}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: 'background.neutral',
                        borderLeft: '3px solid',
                        borderColor: getTransactionColor(grouped.transaction_type),
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            src={photoUrl || undefined}
                            alt={displayName}
                            sx={{ width: 32, height: 32, flexShrink: 0 }}
                          >
                            {avatarInitial}
                          </Avatar>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                              {displayName}
                            </Typography>
                            <Iconify
                              icon="solar:box-bold"
                              sx={{ fontSize: 18, color: getTransactionColor(grouped.transaction_type) }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {dayjs(grouped.created_at).tz('America/Los_Angeles').format('MMM D, YYYY h:mm A')}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Typography variant="body2" sx={{ pl: 5 }}>
                          {grouped.transaction_type === 'vehicle_to_site'
                            ? `Left ${totalQuantity} item${totalQuantity !== 1 ? 's' : ''} at ${siteName}`
                            : `Picked up ${totalQuantity} item${totalQuantity !== 1 ? 's' : ''} from ${siteName}`}
                        </Typography>
                        <Box sx={{ pl: 5, pt: 0.5 }}>
                          {/* List all items in the group */}
                          {grouped.transactions.map((txn, idx) => (
                            <Box key={txn.id} sx={{ mb: idx < grouped.transactions.length - 1 ? 1.5 : 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                {txn.cover_url ? (
                                  <Tooltip
                                    title={
                                      <Box
                                        component="img"
                                        src={txn.cover_url}
                                        alt={txn.inventory_name}
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
                                      src={txn.cover_url}
                                      variant="rounded"
                                      sx={{
                                        width: 32,
                                        height: 32,
                                        flexShrink: 0,
                                        cursor: 'pointer',
                                        '&:hover': {
                                          opacity: 0.8,
                                        },
                                      }}
                                      onClick={() => {
                                        setSelectedImageUrl(txn.cover_url!);
                                        imageDialog.onTrue();
                                      }}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Avatar variant="rounded" sx={{ width: 32, height: 32, flexShrink: 0 }}>
                                    <Iconify icon="solar:box-bold" width={20} />
                                  </Avatar>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {getTransactionDescription(txn)}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 5 }}>
                                {txn.sku && `SKU: ${txn.sku}`}
                                {txn.sku && txn.inventory_type && ' • '}
                                {txn.inventory_type && `Type: ${txn.inventory_type.charAt(0).toUpperCase() + txn.inventory_type.slice(1)}`}
                              </Typography>
                            </Box>
                          ))}
                          {grouped.job_number && grouped.job_id && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              Job:{' '}
                              <Link
                                component="button"
                                variant="caption"
                                onClick={() => {
                                  setSelectedJobId(grouped.job_id!);
                                  jobDetailsDialog.onTrue();
                                }}
                                sx={{
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  fontWeight: 800,
                                }}
                              >
                                #{grouped.job_number}
                              </Link>
                            </Typography>
                          )}
                          {grouped.driver_name && 
                           grouped.submitted_by_first_name && 
                           grouped.submitted_by_last_name &&
                           grouped.driver_name !== `${grouped.submitted_by_first_name} ${grouped.submitted_by_last_name}` && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Driver: {grouped.driver_name}
                            </Typography>
                          )}
                          {grouped.driver_name && 
                           (!grouped.submitted_by_first_name || !grouped.submitted_by_last_name) && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Driver: {grouped.driver_name}
                            </Typography>
                          )}
                          {grouped.site_name && grouped.site_id && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Site:{' '}
                              <Link
                                component="button"
                                variant="caption"
                                onClick={() => {
                                  router.push(`${paths.management.customer.site.edit(grouped.site_id!)}?tab=inventory`);
                                }}
                                sx={{
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  fontWeight: 800,
                                }}
                              >
                                {grouped.site_name}
                              </Link>
                            </Typography>
                          )}
                          {getSiteAddress(grouped) && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {getSiteAddress(grouped)}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  );
                }
                
                // Handle both transaction and history types
                if (filter === 'all' && 'type' in item && item.type === 'history') {
                  const entry = item as HistoryEntry & { type: 'history' };
                  return (
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
                            {(entry.metadata as any).changes && Array.isArray((entry.metadata as any).changes) && (
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
                  );
                }
                
                // Handle grouped transactions in 'all' tab
                if (filter === 'all' && 'type' in item && item.type === 'grouped_transaction') {
                  const grouped = item as GroupedTransaction & { type: 'grouped_transaction' };
                  const displayName = grouped.submitted_by_first_name && grouped.submitted_by_last_name
                    ? `${grouped.submitted_by_first_name} ${grouped.submitted_by_last_name}`
                    : 'System';
                  
                  const siteName = grouped.site_name || 'Unknown Site';
                  const totalQuantity = grouped.transactions.reduce((sum, t) => sum + t.quantity, 0);
                  
                  // Avatar initial from displayName
                  const avatarInitial = displayName?.charAt(0)?.toUpperCase() || 'U';
                  
                  // Use submitted_by photo (transaction initiator)
                  const photoUrl = grouped.initiated_by_photo_url || null;
                  
                  return (
                    <Box
                      key={grouped.id}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: 'background.neutral',
                        borderLeft: '3px solid',
                        borderColor: getTransactionColor(grouped.transaction_type),
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            src={photoUrl || undefined}
                            alt={displayName}
                            sx={{ width: 32, height: 32, flexShrink: 0 }}
                          >
                            {avatarInitial}
                          </Avatar>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                              {displayName}
                            </Typography>
                            <Iconify
                              icon="solar:box-bold"
                              sx={{ fontSize: 18, color: getTransactionColor(grouped.transaction_type) }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {dayjs(grouped.created_at).tz('America/Los_Angeles').format('MMM D, YYYY h:mm A')}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Typography variant="body2" sx={{ pl: 5 }}>
                          {grouped.transaction_type === 'vehicle_to_site'
                            ? `Left ${totalQuantity} item${totalQuantity !== 1 ? 's' : ''} at ${siteName}`
                            : `Picked up ${totalQuantity} item${totalQuantity !== 1 ? 's' : ''} from ${siteName}`}
                        </Typography>
                        <Box sx={{ pl: 5, pt: 0.5 }}>
                          {/* List all items in the group */}
                          {grouped.transactions.map((txn, idx) => (
                            <Box key={txn.id} sx={{ mb: idx < grouped.transactions.length - 1 ? 1.5 : 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                {txn.cover_url ? (
                                  <Tooltip
                                    title={
                                      <Box
                                        component="img"
                                        src={txn.cover_url}
                                        alt={txn.inventory_name}
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
                                      src={txn.cover_url}
                                      variant="rounded"
                                      sx={{
                                        width: 32,
                                        height: 32,
                                        flexShrink: 0,
                                        cursor: 'pointer',
                                        '&:hover': {
                                          opacity: 0.8,
                                        },
                                      }}
                                      onClick={() => {
                                        setSelectedImageUrl(txn.cover_url!);
                                        imageDialog.onTrue();
                                      }}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Avatar variant="rounded" sx={{ width: 32, height: 32, flexShrink: 0 }}>
                                    <Iconify icon="solar:box-bold" width={20} />
                                  </Avatar>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {getTransactionDescription(txn)}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 5 }}>
                                {txn.sku && `SKU: ${txn.sku}`}
                                {txn.sku && txn.inventory_type && ' • '}
                                {txn.inventory_type && `Type: ${txn.inventory_type.charAt(0).toUpperCase() + txn.inventory_type.slice(1)}`}
                              </Typography>
                            </Box>
                          ))}
                          {grouped.job_number && grouped.job_id && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              Job:{' '}
                              <Link
                                component="button"
                                variant="caption"
                                onClick={() => {
                                  setSelectedJobId(grouped.job_id!);
                                  jobDetailsDialog.onTrue();
                                }}
                                sx={{
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  fontWeight: 800,
                                }}
                              >
                                #{grouped.job_number}
                              </Link>
                            </Typography>
                          )}
                          {grouped.driver_name && 
                           grouped.submitted_by_first_name && 
                           grouped.submitted_by_last_name &&
                           grouped.driver_name !== `${grouped.submitted_by_first_name} ${grouped.submitted_by_last_name}` && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Driver: {grouped.driver_name}
                            </Typography>
                          )}
                          {grouped.driver_name && 
                           (!grouped.submitted_by_first_name || !grouped.submitted_by_last_name) && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Driver: {grouped.driver_name}
                            </Typography>
                          )}
                          {grouped.site_name && grouped.site_id && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Site:{' '}
                              <Link
                                component="button"
                                variant="caption"
                                onClick={() => {
                                  router.push(`${paths.management.customer.site.edit(grouped.site_id!)}?tab=inventory`);
                                }}
                                sx={{
                                  color: 'primary.main',
                                  cursor: 'pointer',
                                  fontWeight: 800,
                                }}
                              >
                                {grouped.site_name}
                              </Link>
                            </Typography>
                          )}
                          {getSiteAddress(grouped) && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {getSiteAddress(grouped)}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  );
                }
                
                // Handle transaction type
                const transaction = filter === 'all' 
                  ? (item as InventoryTransaction & { type: 'transaction' })
                  : (item as InventoryTransaction);
                // Determine who performed the action (prioritize worker_name for vehicle_to_site, otherwise initiated_by)
                const displayName = transaction.submitted_by_first_name && transaction.submitted_by_last_name
                  ? `${transaction.submitted_by_first_name} ${transaction.submitted_by_last_name}`
                  : 'System';
                
                // Avatar initial from displayName
                const avatarInitial = displayName?.charAt(0)?.toUpperCase() || 'U';
                
                // Use submitted_by photo (transaction initiator)
                const photoUrl = transaction.initiated_by_photo_url || null;
                
                return (
                  <Box
                    key={transaction.id}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'background.neutral',
                      borderLeft: '3px solid',
                      borderColor: getTransactionColor(transaction.transaction_type),
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                          src={photoUrl || undefined}
                          alt={displayName}
                          sx={{ width: 32, height: 32, flexShrink: 0 }}
                        >
                          {avatarInitial}
                        </Avatar>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                            {displayName}
                          </Typography>
                          <Iconify
                            icon="solar:box-bold"
                            sx={{ fontSize: 18, color: getTransactionColor(transaction.transaction_type) }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(transaction.created_at).tz('America/Los_Angeles').format('MMM D, YYYY h:mm A')}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Typography variant="body2" sx={{ pl: 5 }}>
                        {getTransactionDescription(transaction)}
                      </Typography>
                      <Box sx={{ pl: 5, pt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {transaction.cover_url ? (
                            <Tooltip
                              title={
                                <Box
                                  component="img"
                                  src={transaction.cover_url}
                                  alt={transaction.inventory_name}
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
                                src={transaction.cover_url}
                                variant="rounded"
                                sx={{
                                  width: 32,
                                  height: 32,
                                  flexShrink: 0,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    opacity: 0.8,
                                  },
                                }}
                                onClick={() => {
                                  setSelectedImageUrl(transaction.cover_url!);
                                  imageDialog.onTrue();
                                }}
                              />
                            </Tooltip>
                          ) : (
                            <Avatar variant="rounded" sx={{ width: 32, height: 32, flexShrink: 0 }}>
                              <Iconify icon="solar:box-bold" width={20} />
                            </Avatar>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            SKU: {transaction.sku} • Type: {transaction.inventory_type?.charAt(0).toUpperCase() + transaction.inventory_type?.slice(1)}
                          </Typography>
                        </Box>
                        {transaction.job_number && transaction.job_id && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Job:{' '}
                            <Link
                              component="button"
                              variant="caption"
                              onClick={() => {
                                setSelectedJobId(transaction.job_id!);
                                jobDetailsDialog.onTrue();
                              }}
                              sx={{
                                color: 'primary.main',
                                
                                cursor: 'pointer',
                                fontWeight: 800,
                         
                              }}
                            >
                              #{transaction.job_number}
                            </Link>
                          </Typography>
                        )}
                        {transaction.driver_name && 
                         transaction.submitted_by_first_name && 
                         transaction.submitted_by_last_name &&
                         transaction.driver_name !== `${transaction.submitted_by_first_name} ${transaction.submitted_by_last_name}` && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Driver: {transaction.driver_name}
                          </Typography>
                        )}
                        {transaction.driver_name && 
                         (!transaction.submitted_by_first_name || !transaction.submitted_by_last_name) && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Driver: {transaction.driver_name}
                          </Typography>
                        )}
                        {transaction.site_name && transaction.site_id && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Site:{' '}
                            <Link
                              component="button"
                              variant="caption"
                              onClick={() => {
                                router.push(`${paths.management.customer.site.edit(transaction.site_id!)}?tab=inventory`);
                              }}
                              sx={{
                                color: 'primary.main',
                                cursor: 'pointer',
                                fontWeight: 800,
                              }}
                            >
                              {transaction.site_name}
                            </Link>
                          </Typography>
                        )}
                        {getSiteAddress(transaction) && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {getSiteAddress(transaction)}
                          </Typography>
                        )}
                        {transaction.item_status && transaction.item_status !== 'active' && (
                          <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                            Status: {transaction.item_status}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
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
      ) : (
        // Display regular vehicle history
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
                  {entry.action_type === 'inventory_audit' && (entry.metadata as any).changes && (
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

      {/* Job Details Dialog */}
      {selectedJobId && (
        <JobDetailsDialog
          open={jobDetailsDialog.value}
          onClose={jobDetailsDialog.onFalse}
          jobId={selectedJobId}
        />
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={imageDialog.value}
        onClose={imageDialog.onFalse}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Inventory Item Image</Typography>
            <IconButton
              aria-label="close"
              onClick={imageDialog.onFalse}
              sx={{
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <Iconify icon="solar:close-circle-bold" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
          }}
        >
          {selectedImageUrl && (
            <Box
              component="img"
              src={selectedImageUrl}
              alt="Inventory Item"
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={imageDialog.onFalse}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

