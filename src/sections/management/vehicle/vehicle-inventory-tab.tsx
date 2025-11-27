import type { IInventoryItem } from 'src/types/inventory';

import { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableSortLabel from '@mui/material/TableSortLabel';

import { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

type VehicleInventoryItem = IInventoryItem & {
  requiredQty: number;
  available: number;
};

// No mock data; load from backend

// ----------------------------------------------------------------------

type InventoryItemImageProps = {
  coverUrl?: string;
  name: string;
  isOutOfStock: boolean;
};

function InventoryItemImage({ coverUrl, name, isOutOfStock }: InventoryItemImageProps) {
  const [imageError, setImageError] = useState(false);
  const hasImage = coverUrl && coverUrl.trim() !== '' && !imageError;

  return hasImage ? (
    <Box
      component="img"
      src={coverUrl}
      alt={name}
      onError={() => setImageError(true)}
      sx={{
        width: 64,
        height: 64,
        flexShrink: 0,
        borderRadius: 1,
        objectFit: 'cover',
        ...(isOutOfStock && { opacity: 0.48, filter: 'grayscale(1)' }),
      }}
    />
  ) : (
    <Box
      sx={{
        width: 64,
        height: 64,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'action.hover',
        borderRadius: 1,
        ...(isOutOfStock && { opacity: 0.48 }),
      }}
    >
      <Box
        component="svg"
        xmlns="http://www.w3.org/2000/svg"
        width={32}
        height={32}
        viewBox="0 0 24 24"
        fill="currentColor"
        sx={{ color: 'text.disabled' }}
      >
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </Box>
    </Box>
  );
}

type Props = {
  vehicleId: string;
  vehicleData?: any;
};

export function VehicleInventoryTab({ vehicleId, vehicleData }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const [query, setQuery] = useState(''); // Local state for input value
  const [searchQuery, setSearchQuery] = useState(''); // Debounced value for filtering
  const [inventoryItems, setInventoryItems] = useState<VehicleInventoryItem[]>([]);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, number | string>>({});
  const [dialogSearchQuery, setDialogSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof VehicleInventoryItem>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingQuantity, setEditingQuantity] = useState<Record<string, number | string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [auditQuantities, setAuditQuantities] = useState<Record<string, number | string>>({});
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);

  // Debounce search query updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== searchQuery) {
        setSearchQuery(query);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, searchQuery]);

  // Fallback: ensure inventory loads on mount even if query isn't triggered
  // This guarantees we populate the table after refresh.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetcher(`/api/vehicles/${vehicleId}/inventory`);
        const rows = (response?.data ?? response) as any[];
        const mapped: VehicleInventoryItem[] = (rows || []).map((r: any) => {
          // Determine which required quantity to use based on vehicle type
          const isLCT =
            vehicleData?.type?.toLowerCase().includes('lane') ||
            vehicleData?.type?.toLowerCase() === 'lct';
          const requiredQty = isLCT
            ? Number(r.lct_required_qty ?? 0)
            : Number(r.hwy_required_qty ?? 0);

          return {
            id: r.id,
            name: r.name,
            sku: r.sku,
            coverUrl: r.cover_url ?? r.coverUrl,
            type: r.type,
            status: r.status,
            typical_application: r.typical_application,
            available: Number(r.vehicle_quantity ?? 0),
            requiredQty: requiredQty || Number(r.required_quantity ?? 0),
            quantity: Number(r.quantity ?? 0),
            category: r.category,
            createdAt: r.created_at ?? r.createdAt,
          } as any;
        });
        if (active) setInventoryItems(mapped);
      } catch (err) {
        console.error('Vehicle inventory fallback fetch error:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, [vehicleId, vehicleData]);

  // Fetch available inventory items for the dialog
  const { data: availableInventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory-list', { page: 1, rowsPerPage: 100 }],
    queryFn: async () => {
      const response = await fetcher(
        `${endpoints.management.inventory || '/api/inventory'}?page=1&rowsPerPage=100`
      );
      return response.data?.inventory || [];
    },
    enabled: addItemDialogOpen,
  });

  // Fetch current vehicle inventory
  const { data: vehicleInventoryData } = useQuery({
    queryKey: ['vehicle-inventory', vehicleId],
    queryFn: async () => {
      const response = await fetcher(`/api/vehicles/${vehicleId}/inventory`);
      const rows = response.data || response.data?.data || [];
      return rows as any[];
    },
  });

  // Process vehicle inventory data when it changes
  useEffect(() => {
    if (vehicleInventoryData) {
      const rows = vehicleInventoryData;
      const mapped: VehicleInventoryItem[] = rows.map((r: any) => {
        const isLCT =
          vehicleData?.type?.toLowerCase().includes('lane') ||
          vehicleData?.type?.toLowerCase() === 'lct';
        const requiredQty = isLCT
          ? Number(r.lct_required_qty ?? 0)
          : Number(r.hwy_required_qty ?? 0);

        return {
          id: r.id,
          name: r.name,
          sku: r.sku,
          coverUrl: r.cover_url ?? r.coverUrl,
          type: r.type,
          status: r.status,
          typical_application: r.typical_application,
          available: Number(r.vehicle_quantity ?? 0),
          requiredQty: requiredQty || Number(r.required_quantity ?? 0),
          quantity: Number(r.quantity ?? 0),
          category: r.category,
          createdAt: r.created_at ?? r.createdAt,
        } as any;
      });
      setInventoryItems(mapped);
    }
  }, [vehicleInventoryData, vehicleData]);

  const getStockStatus = (available: number, required: number) => {
    if (available === 0) return { label: 'Out of Stock', color: 'error' as const };
    if (available < required) return { label: 'Low Stock', color: 'warning' as const };
    if (available >= required) return { label: 'Adequate', color: 'success' as const };
    return { label: 'Unknown', color: 'default' as const };
  };

  const filteredItems = useMemo(
    () =>
      inventoryItems
        .filter(
          (item) =>
            (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.code || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
          let aValue: any = a[sortField];
          let bValue: any = b[sortField];

          // Handle status sorting by using the stock status label
          if (sortField === 'status') {
            const aStockStatus = getStockStatus(a.available, a.requiredQty);
            const bStockStatus = getStockStatus(b.available, b.requiredQty);
            aValue = aStockStatus.label;
            bValue = bStockStatus.label;
          }

          if (aValue === undefined || bValue === undefined) return 0;
          if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        }),
    [inventoryItems, searchQuery, sortField, sortOrder]
  );

  const handleSort = (field: keyof VehicleInventoryItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenAddItemDialog = () => {
    setAddItemDialogOpen(true);
    setSelectedItems({});
    setDialogSearchQuery('');
  };

  const handleCloseAddItemDialog = () => {
    setAddItemDialogOpen(false);
    setSelectedItems({});
    setDialogSearchQuery('');
  };

  const handleToggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      if (prev[itemId]) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: '1' };
    });
  };

  const handleQuantityChange = (itemId: string, quantity: number | string) => {
    if (quantity === '' || quantity === 0) {
      setSelectedItems((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      });
    } else {
      setSelectedItems((prev) => ({
        ...prev,
        [itemId]: quantity,
      }));
    }
  };

  const handleUpdateQuantity = async (inventoryId: string, quantity: number) => {
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    try {
      await fetcher([
        `/api/vehicles/${vehicleId}/inventory`,
        {
          method: 'post',
          data: { items: [{ inventoryId, quantity }] },
        },
      ]);
      // Update local state
      setInventoryItems((prev) =>
        prev.map((item) => (item.id === inventoryId ? { ...item, available: quantity } : item))
      );
      setEditingQuantity((prev) => {
        const next = { ...prev };
        delete next[inventoryId];
        return next;
      });
      toast.success('Quantity updated');
    } catch (err) {
      console.error('Failed to update quantity:', err);
      toast.error('Failed to update quantity');
    }
  };

  const handleOpenDeleteDialog = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await fetcher([
        `/api/vehicles/${vehicleId}/inventory/${itemToDelete.id}`,
        {
          method: 'delete',
        },
      ]);
      // Remove from local state
      setInventoryItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      toast.success('Item removed from vehicle');
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['vehicle-inventory', vehicleId] });
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Failed to delete item:', err);
      toast.error('Failed to remove item');
    }
  };

  const handleAddSelectedItems = async () => {
    try {
      const items = Object.entries(selectedItems)
        .map(([inventoryId, qtyValue]) => {
          const quantity = typeof qtyValue === 'string' ? (qtyValue === '' ? 1 : parseInt(qtyValue, 10)) : qtyValue;
          return { inventoryId, quantity: Number.isNaN(quantity) || quantity <= 0 ? 1 : quantity };
        })
        .filter((item) => item.quantity > 0);
      // Debug: verify payload and click
      const postRes = await fetcher([
        `/api/vehicles/${vehicleId}/inventory`,
        {
          method: 'post',
          data: { items },
        },
      ]);
      toast.success(`Added ${items.length} item${items.length > 1 ? 's' : ''} to vehicle`);
      // Refresh vehicle inventory list
      try {
        const updated = (postRes && (postRes.data || postRes)) as any;
        const rows = updated?.data || updated || [];
        if (Array.isArray(rows)) {
          const mapped: VehicleInventoryItem[] = rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            sku: r.sku,
            coverUrl: r.cover_url ?? r.coverUrl,
            type: r.type,
            status: r.status,
            available: Number(r.vehicle_quantity ?? 0),
            requiredQty: Number(r.required_quantity ?? 0),
            quantity: Number(r.quantity ?? 0),
            category: r.category,
            createdAt: r.created_at ?? r.createdAt,
          }));
          setInventoryItems(mapped);
        } else {
          await queryClient.invalidateQueries({ queryKey: ['vehicle-inventory', vehicleId] });
        }
      } catch {
        await queryClient.invalidateQueries({ queryKey: ['vehicle-inventory', vehicleId] });
      }
      // Clear selection
      setSelectedItems({});
    } catch (err) {
      console.error('Failed to add items to vehicle inventory', err);
      toast.error('Failed to add items. Please try again.');
    } finally {
      handleCloseAddItemDialog();
    }
  };

  // Filter available inventory for dialog - exclude items already assigned to vehicle
  const assignedInventoryIds = new Set(inventoryItems.map((item) => item.id));
  const filteredAvailableInventory = (availableInventory || []).filter(
    (item: IInventoryItem) =>
      !assignedInventoryIds.has(item.id) &&
      (item.name.toLowerCase().includes(dialogSearchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(dialogSearchQuery.toLowerCase()))
  );

  return (
    <Card>
      <Box sx={{ p: { xs: 2, md: 3 }, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', mb: 2, gap: 2 }}>
          <Box>
            <Typography variant="h6">Vehicle Inventory</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {inventoryItems.length} items assigned to this vehicle
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', md: 'row' } }}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon={"solar:clipboard-check-bold" as any} />}
              onClick={() => {
                // Initialize audit quantities with current values
                const initialQuantities: Record<string, number | string> = {};
                inventoryItems.forEach((item) => {
                  initialQuantities[item.id] = String(item.available);
                });
                setAuditQuantities(initialQuantities);
                setAuditDialogOpen(true);
              }}
              sx={{ flexShrink: 0 }}
              fullWidth={isMobile}
            >
              Audit Inventory
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenAddItemDialog}
              sx={{ flexShrink: 0 }}
              fullWidth={isMobile}
            >
              Add Item
            </Button>
          </Box>
        </Box>

        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search inventory..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/* Desktop Table View */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Scrollbar>
          <Table sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'name'}
                  direction={sortField === 'name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Product
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'type'}
                  direction={sortField === 'type' ? sortOrder : 'asc'}
                  onClick={() => handleSort('type')}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'available'}
                  direction={sortField === 'available' ? sortOrder : 'asc'}
                  onClick={() => handleSort('available')}
                >
                  Current Qty
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'requiredQty'}
                  direction={sortField === 'requiredQty' ? sortOrder : 'asc'}
                  onClick={() => handleSort('requiredQty')}
                >
                  Required Qty
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'status'}
                  direction={sortField === 'status' ? sortOrder : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ width: 88 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyContent
                    title={searchQuery ? 'No results found' : 'No inventory items'}
                    description={
                      searchQuery
                        ? 'Try adjusting your search'
                        : 'Add inventory items to this vehicle to get started'
                    }
                    sx={{ py: 10 }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const stockStatus = getStockStatus(item.available, item.requiredQty);

                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <InventoryItemImage
                          coverUrl={item.coverUrl}
                          name={item.name}
                          isOutOfStock={item.available === 0}
                        />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {item.name}
                          </Typography>
                          {(item as any).type === 'sign' && (item as any).typical_application && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {(item as any).typical_application}
                            </Typography>
                          )}
                          {item.sku && (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              SKU: {item.sku}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      {(item as any).type
                        ? (item as any).type
                            .split('_')
                            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                        : '-'}
                    </TableCell>

                    <TableCell align="center">
                      {editingQuantity[item.id] !== undefined ? (
                        <TextField
                          type="number"
                          size="small"
                          value={editingQuantity[item.id]}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Allow empty string for clearing
                            setEditingQuantity((prev) => ({ ...prev, [item.id]: inputValue }));
                          }}
                          onBlur={() => {
                            const qtyValue = editingQuantity[item.id];
                            if (qtyValue === '' || qtyValue === undefined) {
                              // Reset if empty
                              setEditingQuantity((prev) => {
                                const next = { ...prev };
                                delete next[item.id];
                                return next;
                              });
                              return;
                            }
                            const qty = typeof qtyValue === 'string' ? parseInt(qtyValue, 10) : qtyValue;
                            if (!Number.isNaN(qty) && qty > 0 && qty !== item.available) {
                              handleUpdateQuantity(item.id, qty);
                            } else {
                              // Reset to original value if invalid or unchanged
                              setEditingQuantity((prev) => {
                                const next = { ...prev };
                                delete next[item.id];
                                return next;
                              });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const qtyValue = editingQuantity[item.id];
                              if (qtyValue === '' || qtyValue === undefined) {
                                setEditingQuantity((prev) => {
                                  const next = { ...prev };
                                  delete next[item.id];
                                  return next;
                                });
                                e.currentTarget.blur();
                                return;
                              }
                              const qty = typeof qtyValue === 'string' ? parseInt(qtyValue, 10) : qtyValue;
                              if (!Number.isNaN(qty) && qty > 0 && qty !== item.available) {
                                handleUpdateQuantity(item.id, qty);
                              }
                              e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                              setEditingQuantity((prev) => {
                                const next = { ...prev };
                                delete next[item.id];
                                return next;
                              });
                            }
                          }}
                          inputProps={{
                            min: 1,
                            style: { textAlign: 'center', width: 80 },
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                          onClick={() =>
                            setEditingQuantity((prev) => ({ ...prev, [item.id]: String(item.available) }))
                          }
                        >
                          {item.available}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {item.requiredQty}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Label variant="soft" color={stockStatus.color}>
                        {stockStatus.label}
                      </Label>
                    </TableCell>

                    <TableCell align="right">
                      <IconButton
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteDialog(item.id, item.name);
                        }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </Scrollbar>
      </Box>

      {/* Mobile Card View */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
        {filteredItems.length === 0 ? (
          <EmptyContent
            title={searchQuery ? 'No results found' : 'No inventory items'}
            description={
              searchQuery
                ? 'Try adjusting your search'
                : 'Add inventory items to this vehicle to get started'
            }
            sx={{ py: 10 }}
          />
        ) : (
          <Stack spacing={2}>
            {filteredItems.map((item) => {
              const stockStatus = getStockStatus(item.available, item.requiredQty);
              
              return (
                <Card key={item.id} sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <InventoryItemImage
                        coverUrl={item.coverUrl}
                        name={item.name}
                        isOutOfStock={item.available === 0}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {item.name}
                        </Typography>
                        {(item as any).type === 'sign' && (item as any).typical_application && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                            {(item as any).typical_application}
                          </Typography>
                        )}
                        {item.sku && (
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            SKU: {item.sku}
                          </Typography>
                        )}
                        {(item as any).type && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                            Type: {(item as any).type
                              .split('_')
                              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ')}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Current Qty
                        </Typography>
                        {editingQuantity[item.id] !== undefined ? (
                          <TextField
                            type="number"
                            size="small"
                            fullWidth
                            value={editingQuantity[item.id]}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              setEditingQuantity((prev) => ({ ...prev, [item.id]: inputValue }));
                            }}
                            onBlur={() => {
                              const qtyValue = editingQuantity[item.id];
                              if (qtyValue === '' || qtyValue === undefined) {
                                setEditingQuantity((prev) => {
                                  const next = { ...prev };
                                  delete next[item.id];
                                  return next;
                                });
                                return;
                              }
                              const qty = typeof qtyValue === 'string' ? parseInt(qtyValue, 10) : qtyValue;
                              if (!Number.isNaN(qty) && qty > 0 && qty !== item.available) {
                                handleUpdateQuantity(item.id, qty);
                              } else {
                                setEditingQuantity((prev) => {
                                  const next = { ...prev };
                                  delete next[item.id];
                                  return next;
                                });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const qtyValue = editingQuantity[item.id];
                                if (qtyValue === '' || qtyValue === undefined) {
                                  setEditingQuantity((prev) => {
                                    const next = { ...prev };
                                    delete next[item.id];
                                    return next;
                                  });
                                  e.currentTarget.blur();
                                  return;
                                }
                                const qty = typeof qtyValue === 'string' ? parseInt(qtyValue, 10) : qtyValue;
                                if (!Number.isNaN(qty) && qty > 0 && qty !== item.available) {
                                  handleUpdateQuantity(item.id, qty);
                                }
                                e.currentTarget.blur();
                              } else if (e.key === 'Escape') {
                                setEditingQuantity((prev) => {
                                  const next = { ...prev };
                                  delete next[item.id];
                                  return next;
                                });
                              }
                            }}
                            inputProps={{
                              min: 1,
                              style: { textAlign: 'center' },
                            }}
                            autoFocus
                          />
                        ) : (
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 500,
                              cursor: 'pointer',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                            onClick={() =>
                              setEditingQuantity((prev) => ({ ...prev, [item.id]: String(item.available) }))
                            }
                          >
                            {item.available}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Required Qty
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {item.requiredQty}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Status
                        </Typography>
                        <Label variant="soft" color={stockStatus.color}>
                          {stockStatus.label}
                        </Label>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => handleOpenDeleteDialog(item.id, item.name)}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

      <Dialog open={addItemDialogOpen} onClose={handleCloseAddItemDialog} maxWidth="lg" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 1, sm: 0 } }}>
            <Typography variant="h6">Add Inventory Items</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {Object.keys(selectedItems).length} selected
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
          <TextField
            fullWidth
            value={dialogSearchQuery}
            onChange={(e) => setDialogSearchQuery(e.target.value)}
            placeholder="Search inventory items..."
            sx={{ mb: { xs: 2, md: 3 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 2 }, alignItems: 'stretch' }}>
            {/* Left: Available */}
            <Box
              sx={{
                flex: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ p: { xs: 1.5, md: 1.5 }, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2">Available</Typography>
              </Box>
              <Box sx={{ maxHeight: { xs: 'calc(100vh - 400px)', md: 360 }, overflow: 'auto' }}>
                {isLoadingInventory ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <Typography>Loading inventory items...</Typography>
                  </Box>
                ) : filteredAvailableInventory.length === 0 ? (
                  <EmptyContent
                    title="No inventory items found"
                    description="Try adjusting your search or create new inventory items"
                    sx={{ py: 4 }}
                  />
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                      <Table size="small" sx={{ minWidth: 400 }}>
                        <TableBody>
                          {filteredAvailableInventory.map((item: IInventoryItem) => {
                            const isSelected = !!selectedItems[item.id];
                            return (
                              <TableRow
                                key={item.id}
                                hover
                                sx={{ cursor: 'pointer' }}
                                onClick={() => handleToggleItemSelection(item.id)}
                              >
                                <TableCell padding="checkbox" sx={{ width: 48 }}>
                                  <Checkbox
                                    color="primary"
                                    checked={isSelected}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() => handleToggleItemSelection(item.id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <InventoryItemImage
                                      coverUrl={item.cover_url || item.coverUrl}
                                      name={item.name}
                                      isOutOfStock={false}
                                    />
                                    <ListItemText
                                      primary={item.name}
                                      secondary={item.sku ? `SKU: ${item.sku}` : undefined}
                                      slotProps={{
                                        primary: { sx: { typography: 'subtitle2' } },
                                      }}
                                    />
                                  </Box>
                                </TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    In stock: {item.quantity ?? 0}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Box>

                    {/* Mobile Card View */}
                    <Box sx={{ display: { xs: 'block', md: 'none' }, p: 1 }}>
                      <Stack spacing={1.5}>
                        {filteredAvailableInventory.map((item: IInventoryItem) => {
                          const isSelected = !!selectedItems[item.id];
                          return (
                            <Card
                              key={item.id}
                              sx={{
                                p: 1.5,
                                cursor: 'pointer',
                                border: isSelected ? 2 : 1,
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                              }}
                              onClick={() => handleToggleItemSelection(item.id)}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Checkbox
                                  color="primary"
                                  checked={isSelected}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => handleToggleItemSelection(item.id)}
                                  sx={{ p: 0 }}
                                />
                                <InventoryItemImage
                                  coverUrl={item.cover_url || item.coverUrl}
                                  name={item.name}
                                  isOutOfStock={false}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle2" noWrap>
                                    {item.name}
                                  </Typography>
                                  {item.sku && (
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      SKU: {item.sku}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    In stock: {item.quantity ?? 0}
                                  </Typography>
                                </Box>
                              </Box>
                            </Card>
                          );
                        })}
                      </Stack>
                    </Box>
                  </>
                )}
              </Box>
            </Box>

            {/* Right: Selected */}
            <Box
              sx={{
                flex: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  p: { xs: 1.5, md: 1.5 },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="subtitle2">Selected</Typography>
                <Typography variant="caption" color="text.secondary">
                  {Object.keys(selectedItems).length} items
                </Typography>
              </Box>
              <Box sx={{ maxHeight: { xs: 'calc(100vh - 400px)', md: 360 }, overflow: 'auto' }}>
                {Object.keys(selectedItems).length === 0 ? (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No items selected
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Product</TableCell>
                            <TableCell align="center" sx={{ width: 140 }}>
                              Quantity
                            </TableCell>
                            <TableCell align="right" sx={{ width: 56 }} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(selectedItems).map(([id, qty]) => {
                            const item = (availableInventory || []).find((x: any) => x.id === id);
                            if (!item) return null;
                            return (
                              <TableRow key={id} hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <InventoryItemImage
                                      coverUrl={item.cover_url || item.coverUrl}
                                      name={item.name}
                                      isOutOfStock={false}
                                    />
                                    <ListItemText
                                      primary={item.name}
                                      secondary={item.sku ? `SKU: ${item.sku}` : undefined}
                                      slotProps={{ primary: { sx: { typography: 'subtitle2' } } }}
                                    />
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={qty}
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      // Allow empty string for clearing
                                      handleQuantityChange(id, inputValue);
                                    }}
                                    inputProps={{
                                      min: 1,
                                      max: item.quantity || 999,
                                      style: { textAlign: 'center' },
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Button
                                    size="small"
                                    color="error"
                                    onClick={() => handleToggleItemSelection(id)}
                                  >
                                    Remove
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Box>

                    {/* Mobile Card View */}
                    <Box sx={{ display: { xs: 'block', md: 'none' }, p: 1 }}>
                      <Stack spacing={1.5}>
                        {Object.entries(selectedItems).map(([id, qty]) => {
                          const item = (availableInventory || []).find((x: any) => x.id === id);
                          if (!item) return null;
                          return (
                            <Card key={id} sx={{ p: 1.5 }}>
                              <Stack spacing={1.5}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <InventoryItemImage
                                    coverUrl={item.cover_url || item.coverUrl}
                                    name={item.name}
                                    isOutOfStock={false}
                                  />
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" noWrap>
                                      {item.name}
                                    </Typography>
                                    {item.sku && (
                                      <Typography variant="caption" color="text.secondary" noWrap>
                                        SKU: {item.sku}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                      Quantity
                                    </Typography>
                                    <TextField
                                      type="number"
                                      size="small"
                                      fullWidth
                                      value={qty}
                                      onChange={(e) => {
                                        const inputValue = e.target.value;
                                        handleQuantityChange(id, inputValue);
                                      }}
                                      inputProps={{
                                        min: 1,
                                        max: item.quantity || 999,
                                        style: { textAlign: 'center' },
                                      }}
                                    />
                                  </Box>
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                                    onClick={() => handleToggleItemSelection(id)}
                                    sx={{ mt: 2.5 }}
                                  >
                                    Remove
                                  </Button>
                                </Box>
                              </Stack>
                            </Card>
                          );
                        })}
                      </Stack>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 2 }, gap: { xs: 1, md: 0 } }}>
          <Button
            onClick={handleCloseAddItemDialog}
            size={isMobile ? 'large' : 'medium'}
            fullWidth={isMobile}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddSelectedItems}
            disabled={Object.keys(selectedItems).length === 0}
            size={isMobile ? 'large' : 'medium'}
            fullWidth={isMobile}
          >
            Add{' '}
            {Object.keys(selectedItems).length > 0 ? `${Object.keys(selectedItems).length} ` : ''}
            Item{Object.keys(selectedItems).length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Remove Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove <strong>{itemToDelete?.name}</strong> from this vehicle?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Audit Inventory Dialog */}
      <Dialog open={auditDialogOpen} onClose={() => !isSubmittingAudit && setAuditDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ pb: { xs: 1, md: 2 } }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.5, md: 0 } }}>
              <Iconify icon={"solar:clipboard-check-bold" as any} width={24} />
              <Typography variant="h6">Audit Inventory</Typography>
            </Box>
            {vehicleData && (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', mt: { xs: 0.5, md: 0.5 }, pl: { xs: 0, md: 4 } }}
              >
                {vehicleData.license_plate} - {vehicleData.unit_number || 'N/A'}
                {vehicleData.assigned_driver &&
                  ` (${vehicleData.assigned_driver.first_name} ${vehicleData.assigned_driver.last_name})`}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
          {inventoryItems.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <EmptyContent
                title="No inventory items"
                description="Add items to this vehicle first"
                sx={{ py: 4 }}
              />
            </Box>
          ) : (
            <>
              <Typography
                variant="body2"
                sx={{ mb: { xs: 2, md: 3 }, color: 'text.secondary', fontSize: { xs: '0.875rem', md: '0.875rem' } }}
              >
                Update quantities for all inventory items at once. This will be recorded as an audit in the vehicle history.
              </Typography>

              {/* Desktop Table View */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Scrollbar sx={{ maxHeight: 500 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="center" sx={{ width: 120 }}>
                          Current Qty
                        </TableCell>
                        <TableCell align="center" sx={{ width: 140 }}>
                          New Qty
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryItems.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <InventoryItemImage
                                coverUrl={item.coverUrl}
                                name={item.name}
                                isOutOfStock={false}
                              />
                              <Box>
                                <Typography variant="subtitle2">{item.name}</Typography>
                                {item.sku && (
                                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                    SKU: {item.sku}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {item.available}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={auditQuantities[item.id] ?? String(item.available)}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                setAuditQuantities((prev) => ({ ...prev, [item.id]: inputValue }));
                              }}
                              inputProps={{
                                min: 0,
                                style: { textAlign: 'center' },
                              }}
                              disabled={isSubmittingAudit}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </Box>

              {/* Mobile Card View */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Stack spacing={2}>
                  {inventoryItems.map((item) => (
                    <Card key={item.id} sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                          <InventoryItemImage coverUrl={item.coverUrl} name={item.name} isOutOfStock={false} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {item.name}
                            </Typography>
                            {item.sku && (
                              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                SKU: {item.sku}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        <Divider />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                              Current Qty
                            </Typography>
                            <Typography variant="h6">{item.available}</Typography>
                          </Box>
                          <Box sx={{ flex: 1, maxWidth: 120, ml: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                              New Qty
                            </Typography>
                            <TextField
                              type="number"
                              fullWidth
                              size="small"
                              value={auditQuantities[item.id] ?? String(item.available)}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                setAuditQuantities((prev) => ({ ...prev, [item.id]: inputValue }));
                              }}
                              inputProps={{
                                min: 0,
                                style: { textAlign: 'center', fontSize: '1rem', padding: '8px' },
                              }}
                              disabled={isSubmittingAudit}
                            />
                          </Box>
                        </Box>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 2 }, gap: { xs: 1, md: 0 } }}>
          <Button
            onClick={() => setAuditDialogOpen(false)}
            disabled={isSubmittingAudit}
            size={isMobile ? 'large' : 'medium'}
            fullWidth={isMobile}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              setIsSubmittingAudit(true);
              try {
                // Prepare items with changes
                const itemsToUpdate = Object.entries(auditQuantities)
                  .map(([id, qtyValue]) => {
                    const qty = typeof qtyValue === 'string' ? (qtyValue === '' ? 0 : parseInt(qtyValue, 10)) : qtyValue;
                    return { id, qty: Number.isNaN(qty) ? 0 : qty };
                  })
                  .filter(({ id, qty }) => {
                    const item = inventoryItems.find((i) => i.id === id);
                    return item && qty >= 0 && qty !== item.available;
                  })
                  .map(({ id, qty }) => ({
                    inventoryId: id,
                    quantity: qty,
                  }));

                if (itemsToUpdate.length === 0) {
                  toast.info('No changes to save');
                  setAuditDialogOpen(false);
                  setIsSubmittingAudit(false);
                  return;
                }

                // Submit audit update
                await fetcher([
                  `/api/vehicles/${vehicleId}/inventory/audit`,
                  {
                    method: 'post',
                    data: { items: itemsToUpdate },
                  },
                ]);

                toast.success(`Inventory audit completed: ${itemsToUpdate.length} item${itemsToUpdate.length > 1 ? 's' : ''} updated`);
                
                // Refresh inventory
                await queryClient.invalidateQueries({ queryKey: ['vehicle-inventory', vehicleId] });
                await queryClient.invalidateQueries({ queryKey: ['vehicle-history', vehicleId] });
                
                setAuditDialogOpen(false);
                setAuditQuantities({});
              } catch (err) {
                console.error('Failed to submit audit:', err);
                toast.error('Failed to submit inventory audit');
              } finally {
                setIsSubmittingAudit(false);
              }
            }}
            disabled={isSubmittingAudit || inventoryItems.length === 0}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            size={isMobile ? 'large' : 'medium'}
            fullWidth={isMobile}
          >
            {isSubmittingAudit ? 'Saving...' : 'Save Audit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
