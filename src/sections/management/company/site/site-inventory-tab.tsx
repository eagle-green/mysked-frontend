import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { fetcher, endpoints } from 'src/lib/axios';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { Label } from 'src/components/label';
import { useTable, TablePaginationCustom } from 'src/components/table';
import { JobDetailsDialog } from 'src/sections/work/calendar/job-details-dialog';

// ----------------------------------------------------------------------

type SiteInventoryTabProps = {
  siteId: string;
};

export function SiteInventoryTab({ siteId }: SiteInventoryTabProps) {
  const table = useTable({ defaultRowsPerPage: 10 });
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [itemHistoryDialogOpen, setItemHistoryDialogOpen] = useState(false);

  // Fetch current inventory
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['site-inventory', siteId],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.management.site}/${siteId}/inventory`);
      return response.data;
    },
    enabled: !!siteId,
  });

  // Fetch inventory history (fetch all for frontend grouping and pagination)
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['site-inventory-history', siteId],
    queryFn: async () => {
      const response = await fetcher(
        `${endpoints.management.site}/${siteId}/inventory/history?limit=10000&offset=0`
      );
      return response.data;
    },
    enabled: !!siteId,
  });

  const inventory = inventoryData?.inventory || [];
  const transactions = historyData?.transactions || [];
  const site = historyData?.site || inventoryData?.site || null;

  const siteAddress = useMemo(() => {
    if (!site) return null;
    const addressParts = [
      site.unit_number,
      site.street_number,
      site.street_name,
      site.city,
      site.province,
      site.postal_code,
    ].filter(Boolean);
    return addressParts.length ? addressParts.join(', ') : null;
  }, [site]);

  const groupedHistory = useMemo(() => {
    type Txn = any;
    type Group = {
      id: string;
      created_at: string;
      transaction_type: string;
      display_name: string;
      items: Txn[];
      job_id: string | null;
      job_number: string | null;
      submitted_by_name: string | null;
    };

    const txns: Txn[] = transactions || [];
    if (txns.length === 0) return [] as Group[];

    const groups = new Map<string, Group>();
    for (const t of txns) {
      // Use submitted_by as the display name (person who created the transaction)
      const displayName =
        t.submitted_by_first_name && t.submitted_by_last_name
          ? `${t.submitted_by_first_name} ${t.submitted_by_last_name}`
          : 'System';

      // Group by timestamp (within 5 seconds), submitted_by, and transaction_type
      // This ensures transactions added at different times by different people are separate
      const timestamp = new Date(t.created_at).getTime();
      const timeWindow = Math.floor(timestamp / 5000); // 5-second windows
      const key = `${t.transaction_type}:${timeWindow}:${displayName}`;

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
          submitted_by_name: displayName,
        });
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [transactions]);

  // Filter grouped history based on selected tab
  const filteredGroupedHistory = useMemo(() => {
    if (historyFilter === 'all') return groupedHistory;
    
    return groupedHistory.filter((group: any) => {
      if (historyFilter === 'drop-off') {
        return group.transaction_type === 'vehicle_to_site';
      }
      if (historyFilter === 'pick-up') {
        return group.transaction_type === 'site_to_vehicle';
      }
      if (historyFilter === 'missing' || historyFilter === 'damaged') {
        // Filter by item_status in the transactions
        return group.items.some((item: any) => item.item_status === historyFilter);
      }
      return true;
    });
  }, [groupedHistory, historyFilter]);

  // Paginate the filtered grouped history on the frontend
  const paginatedGroupedHistory = useMemo(() => {
    const startIndex = table.page * table.rowsPerPage;
    const endIndex = startIndex + table.rowsPerPage;
    return filteredGroupedHistory.slice(startIndex, endIndex);
  }, [filteredGroupedHistory, table.page, table.rowsPerPage]);

  const totalGroupedCount = filteredGroupedHistory.length;

  const selectedItem = useMemo(() => {
    return inventory.find((item: any) => item.inventory_id === selectedInventoryId);
  }, [inventory, selectedInventoryId]);

  const selectedItemHistory = useMemo(() => {
    if (!selectedInventoryId) return [];

    const filtered = transactions.filter((t: any) => t.inventory_id === selectedInventoryId);

    return filtered.sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [selectedInventoryId, transactions]);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatGroupSummary = (group: any) => {
    const count = group.items.length;
    if (group.transaction_type === 'vehicle_to_site') {
      return `Left ${count} item${count === 1 ? '' : 's'} at ${site?.name || historyData?.site_name || ''}`.trim();
    }
    if (group.transaction_type === 'site_to_vehicle') {
      return `Picked up ${count} item${count === 1 ? '' : 's'} from ${site?.name || historyData?.site_name || ''}`.trim();
    }
    return `${count} item${count === 1 ? '' : 's'}`;
  };

  const formatTxnLine = (t: any) => {
    const qty = Number(t.quantity) || 0;
    const itemName = t.inventory_name || 'Unknown Item';
    const siteName = site?.name || historyData?.site_name || '';
    if (t.transaction_type === 'vehicle_to_site')
      return `Left ${qty} ${itemName} at ${siteName}`.trim();
    if (t.transaction_type === 'site_to_vehicle')
      return `Picked up ${qty} ${itemName} from ${siteName}`.trim();
    return `${qty} ${itemName}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'damaged':
        return 'warning';
      case 'missing':
        return 'error';
      case 'stolen':
        return 'error';
      case 'disposed':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'vehicle_to_site':
        return 'Dropped Off';
      case 'site_to_vehicle':
        return 'Picked Up';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  return (
    <Stack spacing={3}>
      {/* Current Inventory Section */}
      <Card>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Current Inventory at Site
          </Typography>

          {isLoadingInventory ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Loading inventory...
              </Typography>
            </Box>
          ) : inventory.length === 0 ? (
            <EmptyContent
              title="No inventory items"
              description="No equipment is currently at this site."
              sx={{ py: 10 }}
            />
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {item.cover_url ? (
                            <Avatar
                              src={item.cover_url}
                              variant="rounded"
                              sx={{ width: 40, height: 40 }}
                            />
                          ) : (
                            <Avatar variant="rounded" sx={{ width: 40, height: 40 }}>
                              <Iconify icon="solar:box-bold" width={24} />
                            </Avatar>
                          )}
                          <Typography variant="subtitle2">{item.inventory_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.inventory_type
                            ? item.inventory_type.charAt(0).toUpperCase() +
                              item.inventory_type.slice(1)
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">{item.quantity}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View History">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedInventoryId(item.inventory_id);
                              setItemHistoryDialogOpen(true);
                            }}
                          >
                            <Iconify icon="solar:history-bold" width={20} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Card>

      {/* History Section */}
      <Card>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Inventory History
          </Typography>

          {/* Filter Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={historyFilter} 
              onChange={(e, newValue) => {
                setHistoryFilter(newValue);
                table.onResetPage();
              }}
            >
              <Tab label="All" value="all" />
              <Tab label="Drop-off" value="drop-off" />
              <Tab label="Pick up" value="pick-up" />
              <Tab label="Missing" value="missing" />
              <Tab label="Damaged" value="damaged" />
            </Tabs>
          </Box>

          {isLoadingHistory ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Loading history...
              </Typography>
            </Box>
          ) : transactions.length === 0 ? (
            <EmptyContent
              title="No history"
              description="No inventory transactions found for this site."
              sx={{ py: 10 }}
            />
          ) : filteredGroupedHistory.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <Iconify icon="solar:box-bold" sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {historyFilter === 'drop-off' && 'No drop-off transactions'}
                {historyFilter === 'pick-up' && 'No pick up transactions'}
                {historyFilter === 'missing' && 'No missing items'}
                {historyFilter === 'damaged' && 'No damaged items'}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {paginatedGroupedHistory.map((group: any) => {
                const nameParts = String(group.display_name || 'U')
                  .split(' ')
                  .filter(Boolean);
                const initial = nameParts[0]?.charAt(0).toUpperCase() || 'U';

                // Use submitted_by photo (transaction initiator)
                const photoUrl = group.items?.[0]?.submitted_by_id 
                  ? group.items?.[0]?.initiated_by_photo_url 
                  : null;

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
                            icon="solar:box-bold"
                            sx={{ fontSize: 18, color: 'text.secondary' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(group.created_at)}
                          </Typography>
                        </Stack>
                      </Stack>

                      {/* For single item, show item image and details in title */}
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
                              <Iconify icon="solar:box-bold" width={20} />
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

                      {/* For single item, show SKU/Type and Vehicle */}
                      {group.items.length === 1 ? (
                        <Box sx={{ pl: 5, pt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {group.items[0].sku && `SKU: ${group.items[0].sku}`}
                            {group.items[0].sku && group.items[0].inventory_type && ' • '}
                            {group.items[0].inventory_type && `Type: ${group.items[0].inventory_type.charAt(0).toUpperCase() + group.items[0].inventory_type.slice(1)}`}
                          </Typography>
                          {(group.items[0].source_vehicle_license || group.items[0].dest_vehicle_license) && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Vehicle:{' '}
                              {group.transaction_type === 'vehicle_to_site'
                                ? `${group.items[0].source_vehicle_license || ''} ${group.items[0].source_vehicle_unit || ''} ${group.items[0].worker_name ? `(${group.items[0].worker_name})` : ''}`.trim()
                                : `${group.items[0].dest_vehicle_license || ''} ${group.items[0].dest_vehicle_unit || ''}`.trim()}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        /* For multiple items, show each item with image */
                        <Box sx={{ pl: 5, pt: 0.5 }}>
                          {group.items.map((t: any) => (
                            <Box key={t.id} sx={{ mb: 1.5 }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                {formatTxnLine(t)}
                              </Typography>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
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
                                        width: 32,
                                        height: 32,
                                        flexShrink: 0,
                                        cursor: 'pointer',
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
                                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                                  >
                                    <Iconify icon="solar:box-bold" width={20} />
                                  </Avatar>
                                )}

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block' }}
                                >
                                  {t.sku && `SKU: ${t.sku}`}
                                  {t.sku && t.inventory_type && ' • '}
                                  {t.inventory_type && `Type: ${t.inventory_type.charAt(0).toUpperCase() + t.inventory_type.slice(1)}`}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}

                      <Box sx={{ pl: 5 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          Job:{' '}
                          {group.job_number && group.job_id ? (
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
                              #{group.job_number}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          {/* Pagination */}
          <TablePaginationCustom
            page={table.page}
            count={totalGroupedCount}
            rowsPerPage={table.rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Box>
      </Card>

      {/* Job Details Dialog */}
      {selectedJobId && (
        <JobDetailsDialog
          open={jobDetailsOpen}
          onClose={() => setJobDetailsOpen(false)}
          jobId={selectedJobId}
        />
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Inventory Item Image</Typography>
            <IconButton
              aria-label="close"
              onClick={() => setImageDialogOpen(false)}
              sx={{ color: (theme) => theme.palette.grey[500] }}
            >
              <Iconify icon="eva:close-fill" />
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
      </Dialog>

      {/* Item History Dialog */}
      <Dialog
        open={itemHistoryDialogOpen}
        onClose={() => setItemHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {selectedItem?.cover_url && (
                <Avatar
                  src={selectedItem.cover_url}
                  variant="rounded"
                  sx={{ width: 48, height: 48 }}
                />
              )}
              <Box>
                <Typography variant="h6">Item History</Typography>
                {selectedItem && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedItem.inventory_name} • {selectedItem.sku}
                  </Typography>
                )}
              </Box>
            </Box>
            <IconButton
              aria-label="close"
              onClick={() => setItemHistoryDialogOpen(false)}
              sx={{ color: (theme) => theme.palette.grey[500] }}
            >
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedItemHistory.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Iconify
                icon="solar:box-bold"
                sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: 'text.secondary' }}
              />
              <Typography variant="body2" color="text.secondary">
                No history available for this item
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {selectedItemHistory.map((txn: any) => {
                const displayName =
                  txn.submitted_by_first_name && txn.submitted_by_last_name
                    ? `${txn.submitted_by_first_name} ${txn.submitted_by_last_name}`
                    : 'System';

                const nameParts = String(displayName || 'U')
                  .split(' ')
                  .filter(Boolean);
                const initial = nameParts[0]?.charAt(0).toUpperCase() || 'U';

                // Use submitted_by photo (transaction initiator)
                const photoUrl = txn.submitted_by_id ? txn.initiated_by_photo_url : null;

                return (
                  <Box
                    key={txn.id}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'background.neutral',
                      borderLeft: '3px solid',
                      borderColor:
                        txn.transaction_type === 'vehicle_to_site'
                          ? 'warning.main'
                          : txn.transaction_type === 'site_to_vehicle'
                            ? 'success.main'
                            : 'divider',
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                          src={photoUrl || undefined}
                          alt={displayName}
                          sx={{ width: 32, height: 32, flexShrink: 0 }}
                        >
                          {initial}
                        </Avatar>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                            {displayName}
                          </Typography>
                          <Iconify
                            icon="solar:box-bold"
                            sx={{ fontSize: 18, color: 'text.secondary' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(txn.created_at)}
                          </Typography>
                        </Stack>
                      </Stack>

                      {/* Show item image and details */}
                      <Box sx={{ pl: 5, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                '&:hover': { opacity: 0.85 },
                              }}
                              onClick={() => {
                                setSelectedImageUrl(txn.cover_url);
                                setImageDialogOpen(true);
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Avatar variant="rounded" sx={{ width: 32, height: 32, flexShrink: 0 }}>
                            <Iconify icon="solar:box-bold" width={20} />
                          </Avatar>
                        )}
                        <Typography variant="body2">
                          {formatTxnLine(txn)}
                        </Typography>
                      </Box>

                      {/* SKU/Type and Vehicle */}
                      <Box sx={{ pl: 5, pt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {txn.sku && `SKU: ${txn.sku}`}
                          {txn.sku && txn.inventory_type && ' • '}
                          {txn.inventory_type && `Type: ${txn.inventory_type.charAt(0).toUpperCase() + txn.inventory_type.slice(1)}`}
                        </Typography>
                        {(txn.source_vehicle_license || txn.dest_vehicle_license) && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Vehicle:{' '}
                            {txn.transaction_type === 'vehicle_to_site'
                              ? `${txn.source_vehicle_license || ''} ${txn.source_vehicle_unit || ''} ${txn.worker_name ? `(${txn.worker_name})` : ''}`.trim()
                              : `${txn.dest_vehicle_license || ''} ${txn.dest_vehicle_unit || ''}`.trim()}
                          </Typography>
                        )}
                      </Box>

                      {/* Job */}
                      <Box sx={{ pl: 5 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          Job:{' '}
                          {txn.job_number && txn.job_id ? (
                            <Link
                              component="button"
                              variant="caption"
                              onClick={() => {
                                setSelectedJobId(txn.job_id);
                                setJobDetailsOpen(true);
                                setItemHistoryDialogOpen(false);
                              }}
                              sx={{
                                color: 'primary.main',
                                cursor: 'pointer',
                                fontWeight: 800,
                              }}
                            >
                              #{txn.job_number}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
