import type { IInventoryItem } from 'src/types/inventory';

import { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import RadioGroup from '@mui/material/RadioGroup';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableSortLabel from '@mui/material/TableSortLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { useTable, TablePaginationCustom } from 'src/components/table';

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
  isWorkerView?: boolean; // True when accessed from worker's "My Vehicle" page
};

export function VehicleInventoryTab({ vehicleId, vehicleData, isWorkerView = false }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const table = useTable({ 
    defaultRowsPerPage: 10, 
    defaultOrderBy: 'name', 
    defaultOrder: 'asc' 
  });
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
  const [itemSource, setItemSource] = useState<'office' | 'site' | null>(null);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<Record<string, HTMLElement | null>>({});
  const [siteMenuAnchorEl, setSiteMenuAnchorEl] = useState<Record<string, HTMLElement | null>>({});
  const [reportStatusDialogOpen, setReportStatusDialogOpen] = useState(false);
  const [reportStatusItem, setReportStatusItem] = useState<{ id: string; name: string; maxQuantity: number; isSite: boolean } | null>(null);
  const [reportStatusType, setReportStatusType] = useState<'missing' | 'damaged' | null>(null);
  const [reportStatusQuantity, setReportStatusQuantity] = useState<string>('1');
  const [dropOffDialogOpen, setDropOffDialogOpen] = useState(false);
  const [dropOffSelectedItems, setDropOffSelectedItems] = useState<Record<string, number | string>>({});
  const [dropOffDestination, setDropOffDestination] = useState<'office' | 'site' | null>(null);
  const [dropOffSite, setDropOffSite] = useState<any>(null);
  const [dropOffDialogSearchQuery, setDropOffDialogSearchQuery] = useState('');

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

  // Check if we can proceed to item selection
  const canSelectItems = itemSource === 'office' || (itemSource === 'site' && selectedSite !== null);

  // Fetch available inventory items for the dialog (office or site based on selection)
  // Only fetch when source is properly selected
  const { data: availableInventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory-list', itemSource, selectedSite?.id],
    queryFn: async () => {
      if (itemSource === 'site' && selectedSite) {
        // Fetch site inventory
        const response = await fetcher(`${endpoints.management.site}/${selectedSite.id}/inventory`);
        const siteInventory = response.data?.inventory || [];
        // Transform site inventory data to match IInventoryItem structure
        // Filter out items with quantity 0 or status 'missing'/'damaged' (these shouldn't be available to add)
        return siteInventory
          .filter((item: any) => {
            const quantity = item.quantity || 0;
            const status = item.status || 'active';
            // Only include items that have quantity > 0 and are not missing/damaged
            return quantity > 0 && status !== 'missing' && status !== 'damaged';
          })
          .map((item: any) => ({
            id: item.inventory_id,
            name: item.inventory_name,
            sku: item.sku,
            type: item.inventory_type,
            coverUrl: item.cover_url,
            cover_url: item.cover_url,
            quantity: item.quantity || 0,
            typical_application: item.typical_application,
            status: item.status || 'active',
          }));
      } else {
        // Fetch office inventory
        const params = new URLSearchParams({
          page: '1',
          rowsPerPage: '10000',
        });
        const url = `${endpoints.management.inventory || '/api/inventory'}?${params.toString()}`;
        const response = await fetcher([url, { method: 'GET' }]);
        // Backend returns: { data: { inventory: [...], pagination: {...} } }
        // fetcher returns res.data, so response = { data: { inventory: [...], pagination: {...} } }
        return response?.data?.inventory || [];
      }
    },
    enabled: addItemDialogOpen && canSelectItems,
  });

  // Fetch all sites for site picker (use job-creation endpoint which includes address fields)
  const { data: sitesData, isLoading: isLoadingSites } = useQuery({
    queryKey: ['sites-job-creation'],
    queryFn: async () => {
      const response = await fetcher('/api/sites/job-creation');
      return response.sites || [];
    },
    enabled: addItemDialogOpen && itemSource === 'site',
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
    if (available === required) return { label: 'Adequate', color: 'success' as const };
    if (available > required) return { label: 'Excess', color: 'secondary' as const };
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

  // Paginate filtered items
  const paginatedItems = useMemo(() => {
    const startIndex = table.page * table.rowsPerPage;
    const endIndex = startIndex + table.rowsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, table.page, table.rowsPerPage]);

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
    setItemSource(null);
    setSelectedSite(null);
  };

  const handleCloseAddItemDialog = () => {
    setAddItemDialogOpen(false);
    setSelectedItems({});
    setDialogSearchQuery('');
    setItemSource(null);
    setSelectedSite(null);
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
    // Allow empty string for temporary clearing while typing
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: quantity,
    }));
  };

  const handleQuantityBlur = (itemId: string, quantity: number | string) => {
    const item = (availableInventory || []).find((x: any) => x.id === itemId);
    const maxQuantity = item?.quantity ?? 0;
    
    if (quantity === '' || quantity === 0) {
      // If empty, set to 1 (minimum quantity)
      setSelectedItems((prev) => ({
        ...prev,
        [itemId]: '1',
      }));
    } else {
      const numQuantity = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;
      
      if (Number.isNaN(numQuantity)) {
        // If invalid, set to 1
        setSelectedItems((prev) => ({
          ...prev,
          [itemId]: '1',
        }));
      } else {
        // Cap the quantity to the maximum available stock
        const cappedQuantity = Math.min(Math.max(1, numQuantity), maxQuantity);
        setSelectedItems((prev) => ({
          ...prev,
          [itemId]: String(cappedQuantity),
        }));
      }
    }
  };

  const handleUpdateQuantity = async (inventoryId: string, quantity: number) => {
    if (quantity < 0) {
      toast.error('Quantity cannot be negative');
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

  const handleOpenMenu = (itemId: string, event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl((prev) => ({ ...prev, [itemId]: event.currentTarget }));
  };

  const handleCloseMenu = (itemId: string) => {
    setMenuAnchorEl((prev) => ({ ...prev, [itemId]: null }));
  };


  const handleOpenSiteMenu = (itemId: string, event: React.MouseEvent<HTMLElement>) => {
    setSiteMenuAnchorEl((prev) => ({ ...prev, [itemId]: event.currentTarget }));
  };

  const handleCloseSiteMenu = (itemId: string) => {
    setSiteMenuAnchorEl((prev) => ({ ...prev, [itemId]: null }));
  };

  const handleOpenReportStatusDialog = (itemId: string, status: 'missing' | 'damaged', item: VehicleInventoryItem | IInventoryItem, isSite: boolean = false) => {
    const maxQty = isSite ? ((item as IInventoryItem).quantity || 0) : ((item as VehicleInventoryItem).available || 0);
    const itemName = item.name;
    setReportStatusItem({ id: itemId, name: itemName, maxQuantity: maxQty, isSite });
    setReportStatusType(status);
    setReportStatusQuantity('1');
    setReportStatusDialogOpen(true);
    if (isSite) {
      handleCloseSiteMenu(itemId);
    } else {
      handleCloseMenu(itemId);
    }
  };

  const handleCloseReportStatusDialog = () => {
    setReportStatusDialogOpen(false);
    setReportStatusItem(null);
    setReportStatusType(null);
    setReportStatusQuantity('1');
  };

  const handleConfirmReportStatus = async () => {
    if (!reportStatusItem || !reportStatusType) return;
    
    const quantity = parseInt(reportStatusQuantity, 10);
    if (Number.isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (quantity > reportStatusItem.maxQuantity) {
      toast.error(`Quantity cannot exceed ${reportStatusItem.maxQuantity} (in stock)`);
      return;
    }

    try {
      const endpoint = reportStatusItem.isSite
        ? `/api/sites/${selectedSite?.id}/inventory/${reportStatusItem.id}/report-status`
        : `/api/vehicles/${vehicleId}/inventory/${reportStatusItem.id}/report-status`;
      
      await fetcher([
        endpoint,
        {
          method: 'post',
          data: { status: reportStatusType, quantity },
        },
      ]);

      toast.success(`${quantity} item${quantity > 1 ? 's' : ''} reported as ${reportStatusType}`);
      handleCloseReportStatusDialog();
      
      // Refresh inventory list
      if (reportStatusItem.isSite && selectedSite) {
        queryClient.invalidateQueries({ queryKey: ['inventory-list', itemSource, selectedSite.id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['vehicle-inventory', vehicleId] });
        queryClient.invalidateQueries({ queryKey: ['vehicle-history', vehicleId] });
      }
    } catch (err) {
      console.error('Failed to report item status:', err);
      toast.error(`Failed to report item as ${reportStatusType}`);
    }
  };

  const handleCloseDropOffDialog = () => {
    setDropOffDialogOpen(false);
    setDropOffSelectedItems({});
    setDropOffDestination(null);
    setDropOffSite(null);
    setDropOffDialogSearchQuery('');
  };

  const handleConfirmDropOff = async () => {
    if (!dropOffDestination) {
      toast.error('Please select a destination');
      return;
    }
    if (dropOffDestination === 'site' && !dropOffSite) {
      toast.error('Please select a site');
      return;
    }
    
    const items = Object.entries(dropOffSelectedItems)
      .map(([inventoryId, qtyValue]) => {
        const quantity = typeof qtyValue === 'string' ? (qtyValue === '' ? 1 : parseInt(qtyValue, 10)) : qtyValue;
        return { inventoryId, quantity: Number.isNaN(quantity) || quantity <= 0 ? 1 : quantity };
      })
      .filter((item) => item.quantity > 0);
    
    if (items.length === 0) {
      toast.error('Please select at least one item to drop off');
      return;
    }

    // Validate quantities don't exceed available
    for (const item of items) {
      const vehicleItem = inventoryItems.find((vi) => vi.id === item.inventoryId);
      if (vehicleItem && item.quantity > vehicleItem.available) {
        toast.error(`Quantity for ${vehicleItem.name} cannot exceed ${vehicleItem.available} (available in vehicle)`);
        return;
      }
    }

    try {
      await fetcher([
        `/api/vehicles/${vehicleId}/inventory/drop-off`,
        {
          method: 'post',
          data: {
            items,
            destination: dropOffDestination,
            destinationSiteId: dropOffDestination === 'site' ? dropOffSite.id : undefined,
          },
        },
      ]);

      const destinationText = dropOffDestination === 'office' ? 'Eagle Green Office' : dropOffSite?.name || 'site';
      toast.success(`Successfully dropped off ${items.length} item${items.length > 1 ? 's' : ''} to ${destinationText}`);
      handleCloseDropOffDialog();
      
      // Refresh inventory list
      queryClient.invalidateQueries({ queryKey: ['vehicle-inventory', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-history', vehicleId] });
    } catch (err: any) {
      console.error('Failed to drop off items:', err);
      toast.error(err?.response?.data?.error || 'Failed to drop off items');
    }
  };

  // Check if we can proceed to item selection for drop-off
  const canSelectDropOffItems = dropOffDestination === 'office' || (dropOffDestination === 'site' && dropOffSite !== null);

  // Fetch sites for drop-off dialog
  const { data: dropOffSitesData, isLoading: isLoadingDropOffSites } = useQuery({
    queryKey: ['sites-job-creation-dropoff'],
    queryFn: async () => {
      const response = await fetcher('/api/sites/job-creation');
      return response.sites || [];
    },
    enabled: dropOffDialogOpen && dropOffDestination === 'site',
  });

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
      
      // Prepare payload with source information
      const payload: any = { items };
      
      if (itemSource === 'office') {
        payload.source = 'office';
      } else if (itemSource === 'site' && selectedSite) {
        payload.source = 'site';
        payload.sourceSiteId = selectedSite.id;
      }
      
      // Debug: verify payload and click
      const postRes = await fetcher([
        `/api/vehicles/${vehicleId}/inventory`,
        {
          method: 'post',
          data: payload,
        },
      ]);
      
      const sourceText = itemSource === 'office' 
        ? 'from Eagle Green Office' 
        : `from ${selectedSite?.name || 'site'}`;
      toast.success(`Added ${items.length} item${items.length > 1 ? 's' : ''} to vehicle ${sourceText}`);
      
      // Refresh vehicle inventory list (use same requiredQty logic as initial load)
      try {
        const updated = (postRes && (postRes.data || postRes)) as any;
        const rows = updated?.data || updated || [];
        if (Array.isArray(rows)) {
          const isLCT =
            vehicleData?.type?.toLowerCase().includes('lane') ||
            vehicleData?.type?.toLowerCase() === 'lct';
          const mapped: VehicleInventoryItem[] = rows.map((r: any) => {
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
            } as VehicleInventoryItem;
          });
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

  // Filter available inventory for dialog - exclude items with 0 stock and filter by search query
  const filteredAvailableInventory = (availableInventory || []).filter(
    (item: IInventoryItem) => {
      // Exclude items with 0 stock
      if ((item.quantity ?? 0) === 0) {
        return false;
      }
      // Only filter by search query if there is one
      if (dialogSearchQuery) {
        return (
          item.name.toLowerCase().includes(dialogSearchQuery.toLowerCase()) ||
          item.sku?.toLowerCase().includes(dialogSearchQuery.toLowerCase())
        );
      }
      return true;
    }
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
              sx={{ 
                flexShrink: 0,
                minHeight: { xs: 48, md: 'auto' },
                py: { xs: 1.5, md: 1 },
                fontSize: { xs: '1rem', md: '0.875rem' }
              }}
              fullWidth={isMobile}
            >
              Bulk Adjust Inventory
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenAddItemDialog}
              sx={{ 
                flexShrink: 0,
                minHeight: { xs: 48, md: 'auto' },
                py: { xs: 1.5, md: 1 },
                fontSize: { xs: '1rem', md: '0.875rem' }
              }}
              fullWidth={isMobile}
            >
              Add Item
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:box-minimalistic-bold" />}
              onClick={() => {
                setDropOffSelectedItems({});
                setDropOffDestination(null);
                setDropOffSite(null);
                setDropOffDialogSearchQuery('');
                setDropOffDialogOpen(true);
              }}
              sx={{ 
                flexShrink: 0,
                minHeight: { xs: 48, md: 'auto' },
                py: { xs: 1.5, md: 1 },
                fontSize: { xs: '1rem', md: '0.875rem' }
              }}
              fullWidth={isMobile}
            >
              Drop-off
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
              paginatedItems.map((item) => {
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
                            if (!Number.isNaN(qty) && qty >= 0 && qty !== item.available) {
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
                              if (!Number.isNaN(qty) && qty >= 0 && qty !== item.available) {
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
                            min: 0,
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMenu(item.id, e);
                        }}
                      >
                        <Iconify icon="eva:more-vertical-fill" />
                      </IconButton>
                      <Menu
                        anchorEl={menuAnchorEl[item.id]}
                        open={Boolean(menuAnchorEl[item.id])}
                        onClose={() => handleCloseMenu(item.id)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      >
                        <MenuList>
                          <MenuItem
                            onClick={() => {
                              handleOpenReportStatusDialog(item.id, 'missing', item, false);
                            }}
                          >
                            <Iconify icon="solar:danger-bold" sx={{ mr: 1 }} />
                            Report Missing
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              handleOpenReportStatusDialog(item.id, 'damaged', item, false);
                            }}
                          >
                            <Iconify icon="solar:danger-triangle-bold" sx={{ mr: 1 }} />
                            Report Damaged
                          </MenuItem>
                          <Divider sx={{ borderStyle: 'dashed' }} />
                          <MenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseMenu(item.id);
                              handleOpenDeleteDialog(item.id, item.name);
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
                            Remove
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </Scrollbar>
        {filteredItems.length > 0 && (
          <TablePaginationCustom
            page={table.page}
            count={filteredItems.length}
            rowsPerPage={table.rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              table.onChangeRowsPerPage(event);
            }}
          />
        )}
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
            {paginatedItems.map((item) => {
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
                              if (!Number.isNaN(qty) && qty >= 0 && qty !== item.available) {
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
                                if (!Number.isNaN(qty) && qty >= 0 && qty !== item.available) {
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
                              min: 0,
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
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMenu(item.id, e);
                        }}
                      >
                        <Iconify icon="eva:more-vertical-fill" />
                      </IconButton>
                      <Menu
                        anchorEl={menuAnchorEl[item.id]}
                        open={Boolean(menuAnchorEl[item.id])}
                        onClose={() => handleCloseMenu(item.id)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      >
                        <MenuList>
                          <MenuItem
                            onClick={() => {
                              handleOpenReportStatusDialog(item.id, 'missing', item, false);
                            }}
                          >
                            <Iconify icon="solar:danger-bold" sx={{ mr: 1 }} />
                            Report Missing
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              handleOpenReportStatusDialog(item.id, 'damaged', item, false);
                            }}
                          >
                            <Iconify icon="solar:danger-triangle-bold" sx={{ mr: 1 }} />
                            Report Damaged
                          </MenuItem>
                          <Divider sx={{ borderStyle: 'dashed' }} />
                          <MenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseMenu(item.id);
                              handleOpenDeleteDialog(item.id, item.name);
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
                            Remove
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Box>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
        {filteredItems.length > 0 && (
          <TablePaginationCustom
            page={table.page}
            count={filteredItems.length}
            rowsPerPage={table.rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              table.onChangeRowsPerPage(event);
            }}
          />
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
          {/* Step 1: Source Selection - Only show when source not selected */}
          {!canSelectItems && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Where are the items coming from?
              </Typography>
              <RadioGroup
                value={itemSource}
                onChange={(e) => {
                  setItemSource(e.target.value as 'office' | 'site');
                  setSelectedSite(null);
                  setSelectedItems({});
                  setDialogSearchQuery('');
                }}
              >
                <Stack spacing={1}>
                  <FormControlLabel
                    value="office"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Eagle Green Office
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Add items from main office inventory
                        </Typography>
                      </Box>
                    }
                    sx={{
                      border: 1,
                      borderColor: (itemSource === 'office' as any) ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      p: 1.5,
                      m: 0,
                      bgcolor: (itemSource === 'office' as any) ? 'action.selected' : 'background.paper',
                    }}
                  />
                  <FormControlLabel
                    value="site"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Site (Pickup)
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Pick up items from a job site
                        </Typography>
                      </Box>
                    }
                    sx={{
                      border: 1,
                      borderColor: itemSource === 'site' ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      p: 1.5,
                      m: 0,
                      bgcolor: itemSource === 'site' ? 'action.selected' : 'background.paper',
                    }}
                  />
                </Stack>
              </RadioGroup>
            </Box>
          )}

          {/* Site Picker (shown when site is selected but site not chosen yet) */}
          {itemSource === 'site' && !selectedSite && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Select the site
              </Typography>
              <Autocomplete
                value={selectedSite}
                onChange={(_, newValue) => {
                  setSelectedSite(newValue);
                  setSelectedItems({});
                  setDialogSearchQuery('');
                }}
                options={sitesData || []}
                getOptionLabel={(option) => option.name || 'Unnamed Site'}
                loading={isLoadingSites}
                filterOptions={(options, { inputValue }) => {
                  const filterQuery = inputValue.toLowerCase().trim();
                  if (!filterQuery) return options;
                  
                  return options.filter((option) => {
                    const name = (option.name || '').toLowerCase();
                    const unitNumber = (option.unit_number || '').toLowerCase();
                    const streetNumber = (option.street_number || '').toLowerCase();
                    const streetName = (option.street_name || '').toLowerCase();
                    const city = (option.city || '').toLowerCase();
                    const province = (option.province || '').toLowerCase();
                    const postalCode = (option.postal_code || '').toLowerCase();
                    const displayAddress = (option.display_address || '').toLowerCase();
                    const fullAddress = [
                      option.unit_number,
                      option.street_number,
                      option.street_name,
                      option.city,
                      option.province,
                      option.postal_code,
                    ]
                      .filter(Boolean)
                      .join(' ')
                      .toLowerCase();
                    
                    return (
                      name.includes(filterQuery) ||
                      unitNumber.includes(filterQuery) ||
                      streetNumber.includes(filterQuery) ||
                      streetName.includes(filterQuery) ||
                      city.includes(filterQuery) ||
                      province.includes(filterQuery) ||
                      postalCode.includes(filterQuery) ||
                      displayAddress.includes(filterQuery) ||
                      fullAddress.includes(filterQuery)
                    );
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search for a site..."
                    placeholder="Type to search by name, address, unit number..."
                    required
                  />
                )}
                renderOption={(props, option) => {
                  const address = option.display_address || [
                    option.unit_number,
                    option.street_number,
                    option.street_name,
                    option.city,
                    option.province,
                    option.postal_code,
                  ]
                    .filter(Boolean)
                    .join(', ');
                  
                  return (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.name || 'Unnamed Site'}
                        </Typography>
                        {address && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                            {address}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
              />
            </Box>
          )}

          {/* Source indicator and change button - Show when source is selected */}
          {canSelectItems && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Label variant="soft" color="primary">
                  {itemSource === 'office' ? 'Eagle Green Office' : selectedSite?.name || 'Site'}
                </Label>
                {itemSource === 'site' && selectedSite && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {selectedSite.display_address || [
                      selectedSite.unit_number,
                      selectedSite.street_number,
                      selectedSite.street_name,
                      selectedSite.city,
                      selectedSite.province,
                    ].filter(Boolean).join(', ')}
                  </Typography>
                )}
              </Box>
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  setItemSource(null);
                  setSelectedSite(null);
                  setSelectedItems({});
                  setDialogSearchQuery('');
                }}
              >
                Change Source
              </Button>
            </Box>
          )}

          {/* Divider between source selection and item selection */}
          {canSelectItems && (
            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', px: 2 }}>
                Select Items
              </Typography>
            </Divider>
          )}

          {/* Step 2: Item Selection (only show when source is selected) */}
          {canSelectItems && (
            <>
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
                                      secondary={
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                          {item.sku && (
                                            <Typography component="span" variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                              SKU: {item.sku}
                                            </Typography>
                                          )}
                                          <Typography component="span" variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                            In stock: {item.quantity ?? 0}
                                          </Typography>
                                        </Box>
                                      }
                                      slotProps={{
                                        primary: { sx: { typography: 'subtitle2' } },
                                      }}
                                    />
                                  </Box>
                                </TableCell>
                                {itemSource === 'site' && (
                                  <TableCell align="right" sx={{ width: 56 }}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenSiteMenu(item.id, e);
                                      }}
                                    >
                                      <Iconify icon="eva:more-vertical-fill" />
                                    </IconButton>
                                    <Menu
                                      anchorEl={siteMenuAnchorEl[item.id]}
                                      open={Boolean(siteMenuAnchorEl[item.id])}
                                      onClose={() => handleCloseSiteMenu(item.id)}
                                      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                    >
                                      <MenuList>
                                        <MenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenReportStatusDialog(item.id, 'missing', item, true);
                                          }}
                                        >
                                          <Iconify icon="solar:danger-bold" sx={{ mr: 1 }} />
                                          Report Missing
                                        </MenuItem>
                                        <MenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenReportStatusDialog(item.id, 'damaged', item, true);
                                          }}
                                        >
                                          <Iconify icon="solar:danger-triangle-bold" sx={{ mr: 1 }} />
                                          Report Damaged
                                        </MenuItem>
                                      </MenuList>
                                    </Menu>
                                  </TableCell>
                                )}
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
                                {itemSource === 'site' && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenSiteMenu(item.id, e);
                                    }}
                                  >
                                    <Iconify icon="eva:more-vertical-fill" />
                                  </IconButton>
                                )}
                                {itemSource === 'site' && (
                                  <Menu
                                    anchorEl={siteMenuAnchorEl[item.id]}
                                    open={Boolean(siteMenuAnchorEl[item.id])}
                                    onClose={() => handleCloseSiteMenu(item.id)}
                                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                  >
                                    <MenuList>
                                      <MenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenReportStatusDialog(item.id, 'missing', item, true);
                                        }}
                                      >
                                        <Iconify icon="solar:danger-bold" sx={{ mr: 1 }} />
                                        Report Missing
                                      </MenuItem>
                                      <MenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenReportStatusDialog(item.id, 'damaged', item, true);
                                        }}
                                      >
                                        <Iconify icon="solar:danger-triangle-bold" sx={{ mr: 1 }} />
                                        Report Damaged
                                      </MenuItem>
                                    </MenuList>
                                  </Menu>
                                )}
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
                                      handleQuantityChange(id, inputValue);
                                    }}
                                    onBlur={() => {
                                      handleQuantityBlur(id, qty);
                                    }}
                                    inputProps={{
                                      min: 1,
                                      max: item.quantity || 999,
                                      style: { textAlign: 'center' },
                                    }}
                                    error={
                                      (() => {
                                        if (qty === '' || qty === 0) return false;
                                        const numValue = typeof qty === 'string' ? parseInt(qty, 10) : qty;
                                        return !Number.isNaN(numValue) && numValue > (item.quantity ?? 0);
                                      })()
                                    }
                                    helperText={
                                      (() => {
                                        if (qty === '' || qty === 0) return '';
                                        const numValue = typeof qty === 'string' ? parseInt(qty, 10) : qty;
                                        const maxQuantity = item.quantity ?? 0;
                                        if (!Number.isNaN(numValue) && numValue > maxQuantity) {
                                          return `Maximum available: ${maxQuantity}`;
                                        }
                                        return '';
                                      })()
                                    }
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
                                      onBlur={() => {
                                        handleQuantityBlur(id, qty);
                                      }}
                                      inputProps={{
                                        min: 1,
                                        max: item.quantity || 999,
                                        style: { textAlign: 'center' },
                                      }}
                                      error={
                                        (() => {
                                          if (qty === '' || qty === 0) return false;
                                          const numValue = typeof qty === 'string' ? parseInt(qty, 10) : qty;
                                          return !Number.isNaN(numValue) && numValue > (item.quantity ?? 0);
                                        })()
                                      }
                                      helperText={
                                        (() => {
                                          if (qty === '' || qty === 0) return '';
                                          const numValue = typeof qty === 'string' ? parseInt(qty, 10) : qty;
                                          const maxQuantity = item.quantity ?? 0;
                                          if (!Number.isNaN(numValue) && numValue > maxQuantity) {
                                            return `Max: ${maxQuantity}`;
                                          }
                                          return '';
                                        })()
                                      }
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
            </>
          )}

          {/* Message when source is not selected */}
          {!canSelectItems && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {itemSource === 'site' 
                  ? 'Please select a site above to view available inventory items.'
                  : 'Please select a source above to view available inventory items.'}
              </Typography>
            </Box>
          )}
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
            disabled={
              Object.keys(selectedItems).length === 0 ||
              (itemSource === 'site' && !selectedSite)
            }
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
              <Typography variant="h6">
                Bulk Adjust Inventory
              </Typography>
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
                {isWorkerView 
                  ? 'Update quantities for all inventory items at once. This will be recorded in the vehicle history.'
                  : 'Update quantities for all inventory items at once. This will be recorded as an audit in the vehicle history.'}
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

                // Submit audit/adjustment update
                await fetcher([
                  `/api/vehicles/${vehicleId}/inventory/audit`,
                  {
                    method: 'post',
                    data: { 
                      items: itemsToUpdate,
                      isAudit: false, // Always false for bulk adjustments (not supervisor audits)
                    },
                  },
                ]);

                toast.success(
                  isWorkerView 
                    ? `Inventory adjusted: ${itemsToUpdate.length} item${itemsToUpdate.length > 1 ? 's' : ''} updated`
                    : `Inventory audit completed: ${itemsToUpdate.length} item${itemsToUpdate.length > 1 ? 's' : ''} updated`
                );
                
                // Refresh inventory
                await queryClient.invalidateQueries({ queryKey: ['vehicle-inventory', vehicleId] });
                await queryClient.invalidateQueries({ queryKey: ['vehicle-history', vehicleId] });
                
                setAuditDialogOpen(false);
                setAuditQuantities({});
              } catch (err) {
                console.error('Failed to submit inventory adjustment:', err);
                toast.error(isWorkerView ? 'Failed to adjust inventory' : 'Failed to submit inventory audit');
              } finally {
                setIsSubmittingAudit(false);
              }
            }}
            disabled={isSubmittingAudit || inventoryItems.length === 0}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            size={isMobile ? 'large' : 'medium'}
            fullWidth={isMobile}
          >
            {isSubmittingAudit ? 'Saving...' : (isWorkerView ? 'Save Changes' : 'Save Audit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Status Dialog */}
      <Dialog open={reportStatusDialogOpen} onClose={handleCloseReportStatusDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify 
              icon={reportStatusType === 'missing' ? 'solar:danger-bold' : 'solar:danger-triangle-bold'} 
              width={24} 
              sx={{ color: reportStatusType === 'missing' ? 'error.main' : 'warning.main' }}
            />
            <Typography variant="h6">
              Report {reportStatusType === 'missing' ? 'Missing' : 'Damaged'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              How many items of <strong>{reportStatusItem?.name}</strong> are {reportStatusType}?
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Quantity"
              value={reportStatusQuantity}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d+$/.test(value)) {
                  setReportStatusQuantity(value);
                }
              }}
              inputProps={{
                min: 1,
                max: reportStatusItem?.maxQuantity || 999,
              }}
              error={
                reportStatusQuantity !== '' &&
                (Number.isNaN(parseInt(reportStatusQuantity, 10)) ||
                  parseInt(reportStatusQuantity, 10) <= 0 ||
                  parseInt(reportStatusQuantity, 10) > (reportStatusItem?.maxQuantity || 0))
              }
              helperText={
                reportStatusQuantity !== '' &&
                parseInt(reportStatusQuantity, 10) > (reportStatusItem?.maxQuantity || 0)
                  ? `Cannot exceed ${reportStatusItem?.maxQuantity} (in stock)`
                  : reportStatusItem?.maxQuantity !== undefined
                    ? `Maximum: ${reportStatusItem.maxQuantity}`
                    : ''
              }
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportStatusDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmReportStatus}
            disabled={
              !reportStatusQuantity ||
              Number.isNaN(parseInt(reportStatusQuantity, 10)) ||
              parseInt(reportStatusQuantity, 10) <= 0 ||
              parseInt(reportStatusQuantity, 10) > (reportStatusItem?.maxQuantity || 0)
            }
          >
            Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drop-off Dialog */}
      <Dialog open={dropOffDialogOpen} onClose={handleCloseDropOffDialog} maxWidth="lg" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 1, sm: 0 } }}>
            <Typography variant="h6">Drop-off Inventory Items</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {Object.keys(dropOffSelectedItems).length} selected
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
          {/* Step 1: Destination Selection */}
          {!canSelectDropOffItems && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Where are you dropping off the items?
              </Typography>
              <RadioGroup
                value={dropOffDestination}
                onChange={(e) => {
                  setDropOffDestination(e.target.value as 'office' | 'site');
                  setDropOffSite(null);
                  setDropOffSelectedItems({});
                  setDropOffDialogSearchQuery('');
                }}
              >
                <Stack spacing={1}>
                  <FormControlLabel
                    value="office"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Eagle Green Office
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Return items to main office inventory
                        </Typography>
                      </Box>
                    }
                    sx={{
                      border: 1,
                      borderColor: (dropOffDestination === 'office' as any) ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      p: 1.5,
                      m: 0,
                      bgcolor: (dropOffDestination === 'office' as any) ? 'action.selected' : 'background.paper',
                    }}
                  />
                  <FormControlLabel
                    value="site"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Site
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Drop off items at a job site
                        </Typography>
                      </Box>
                    }
                    sx={{
                      border: 1,
                      borderColor: dropOffDestination === 'site' ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      p: 1.5,
                      m: 0,
                      bgcolor: dropOffDestination === 'site' ? 'action.selected' : 'background.paper',
                    }}
                  />
                </Stack>
              </RadioGroup>
            </Box>
          )}

          {/* Site Picker (shown when site is selected but site not chosen yet) */}
          {dropOffDestination === 'site' && !dropOffSite && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Select the site
              </Typography>
              <Autocomplete
                value={dropOffSite}
                onChange={(_, newValue) => {
                  setDropOffSite(newValue);
                  setDropOffSelectedItems({});
                  setDropOffDialogSearchQuery('');
                }}
                options={dropOffSitesData || []}
                getOptionLabel={(option) => option.name || 'Unnamed Site'}
                loading={isLoadingDropOffSites}
                filterOptions={(options, { inputValue }) => {
                  const filterQuery = inputValue.toLowerCase().trim();
                  if (!filterQuery) return options;
                  
                  return options.filter((option) => {
                    const name = (option.name || '').toLowerCase();
                    const unitNumber = (option.unit_number || '').toLowerCase();
                    const streetNumber = (option.street_number || '').toLowerCase();
                    const streetName = (option.street_name || '').toLowerCase();
                    const city = (option.city || '').toLowerCase();
                    const province = (option.province || '').toLowerCase();
                    const postalCode = (option.postal_code || '').toLowerCase();
                    const displayAddress = (option.display_address || '').toLowerCase();
                    const fullAddress = [
                      option.unit_number,
                      option.street_number,
                      option.street_name,
                      option.city,
                      option.province,
                      option.postal_code,
                    ]
                      .filter(Boolean)
                      .join(' ')
                      .toLowerCase();
                    
                    return (
                      name.includes(filterQuery) ||
                      unitNumber.includes(filterQuery) ||
                      streetNumber.includes(filterQuery) ||
                      streetName.includes(filterQuery) ||
                      city.includes(filterQuery) ||
                      province.includes(filterQuery) ||
                      postalCode.includes(filterQuery) ||
                      displayAddress.includes(filterQuery) ||
                      fullAddress.includes(filterQuery)
                    );
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search for a site..."
                    placeholder="Type to search by name, address, unit number..."
                    required
                  />
                )}
                renderOption={(props, option) => {
                  const address = option.display_address || [
                    option.unit_number,
                    option.street_number,
                    option.street_name,
                    option.city,
                    option.province,
                    option.postal_code,
                  ]
                    .filter(Boolean)
                    .join(', ');
                  
                  return (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.name || 'Unnamed Site'}
                        </Typography>
                        {address && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                            {address}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
              />
            </Box>
          )}

          {/* Destination indicator and change button */}
          {canSelectDropOffItems && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Label variant="soft" color="primary">
                  {dropOffDestination === 'office' ? 'Eagle Green Office' : dropOffSite?.name || 'Site'}
                </Label>
                {dropOffDestination === 'site' && dropOffSite && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {dropOffSite.display_address || [
                      dropOffSite.unit_number,
                      dropOffSite.street_number,
                      dropOffSite.street_name,
                      dropOffSite.city,
                      dropOffSite.province,
                    ].filter(Boolean).join(', ')}
                  </Typography>
                )}
              </Box>
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  setDropOffDestination(null);
                  setDropOffSite(null);
                  setDropOffSelectedItems({});
                  setDropOffDialogSearchQuery('');
                }}
              >
                Change Destination
              </Button>
            </Box>
          )}

          {/* Divider between destination selection and item selection */}
          {canSelectDropOffItems && (
            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', px: 2 }}>
                Select Items to Drop-off
              </Typography>
            </Divider>
          )}

          {/* Step 2: Item Selection (only show when destination is selected) */}
          {canSelectDropOffItems && (
            <>
              <TextField
                fullWidth
                value={dropOffDialogSearchQuery}
                onChange={(e) => setDropOffDialogSearchQuery(e.target.value)}
                placeholder="Search vehicle inventory items..."
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
                {/* Left: Available Items in Vehicle */}
                <Box
                  sx={{
                    flex: 1,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    maxHeight: { xs: '40vh', md: '60vh' },
                    overflow: 'auto',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Available ({inventoryItems.filter((item) => {
                      if (dropOffDialogSearchQuery) {
                        return (
                          item.name.toLowerCase().includes(dropOffDialogSearchQuery.toLowerCase()) ||
                          item.sku?.toLowerCase().includes(dropOffDialogSearchQuery.toLowerCase())
                        );
                      }
                      return true;
                    }).length})
                  </Typography>
                  {isLoadingInventory ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Stack spacing={1}>
                      {inventoryItems
                        .filter((item) => {
                          if (dropOffDialogSearchQuery) {
                            return (
                              item.name.toLowerCase().includes(dropOffDialogSearchQuery.toLowerCase()) ||
                              item.sku?.toLowerCase().includes(dropOffDialogSearchQuery.toLowerCase())
                            );
                          }
                          return true;
                        })
                        .filter((item) => item.available > 0)
                        .map((item) => {
                          const isSelected = dropOffSelectedItems[item.id] !== undefined;
                          const selectedQty = isSelected
                            ? typeof dropOffSelectedItems[item.id] === 'string'
                              ? dropOffSelectedItems[item.id]
                              : String(dropOffSelectedItems[item.id])
                            : '';

                          return (
                            <Card
                              key={item.id}
                              sx={{
                                p: 1.5,
                                cursor: 'pointer',
                                border: 1,
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                                '&:hover': { borderColor: 'primary.main' },
                              }}
                              onClick={() => {
                                if (isSelected) {
                                  const next = { ...dropOffSelectedItems };
                                  delete next[item.id];
                                  setDropOffSelectedItems(next);
                                } else {
                                  setDropOffSelectedItems({
                                    ...dropOffSelectedItems,
                                    [item.id]: '1',
                                  });
                                }
                              }}
                            >
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => {}}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <InventoryItemImage
                                  coverUrl={item.coverUrl}
                                  name={item.name}
                                  isOutOfStock={false}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {item.name}
                                  </Typography>
                                  {item.sku && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                      SKU: {item.sku}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                    In stock: {item.available}
                                  </Typography>
                                </Box>
                                {isSelected && (
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={selectedQty}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || /^\d+$/.test(value)) {
                                        setDropOffSelectedItems({
                                          ...dropOffSelectedItems,
                                          [item.id]: value,
                                        });
                                      }
                                    }}
                                    onBlur={() => {
                                      const qtyValue = dropOffSelectedItems[item.id];
                                      if (qtyValue === '' || qtyValue === undefined) {
                                        const next = { ...dropOffSelectedItems };
                                        delete next[item.id];
                                        setDropOffSelectedItems(next);
                                      } else {
                                        const qty = typeof qtyValue === 'string' ? parseInt(qtyValue, 10) : qtyValue;
                                        if (Number.isNaN(qty) || qty <= 0) {
                                          const next = { ...dropOffSelectedItems };
                                          delete next[item.id];
                                          setDropOffSelectedItems(next);
                                        } else if (qty > item.available) {
                                          setDropOffSelectedItems({
                                            ...dropOffSelectedItems,
                                            [item.id]: String(item.available),
                                          });
                                        }
                                      }
                                    }}
                                    inputProps={{
                                      min: 1,
                                      max: item.available,
                                      style: { textAlign: 'center', width: 80 },
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    error={
                                      selectedQty !== '' &&
                                      (Number.isNaN(parseInt(String(selectedQty), 10)) ||
                                        parseInt(String(selectedQty), 10) <= 0 ||
                                        parseInt(String(selectedQty), 10) > item.available)
                                    }
                                  />
                                )}
                              </Stack>
                            </Card>
                          );
                        })}
                      {inventoryItems.filter((item) => {
                        if (dropOffDialogSearchQuery) {
                          return (
                            item.name.toLowerCase().includes(dropOffDialogSearchQuery.toLowerCase()) ||
                            item.sku?.toLowerCase().includes(dropOffDialogSearchQuery.toLowerCase())
                          );
                        }
                        return true;
                      }).filter((item) => item.available > 0).length === 0 && (
                        <EmptyContent
                          title="No items available"
                          description="All items in this vehicle have 0 quantity"
                          sx={{ py: 4 }}
                        />
                      )}
                    </Stack>
                  )}
                </Box>

                {/* Right: Selected Items */}
                <Box
                  sx={{
                    flex: 1,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    maxHeight: { xs: '40vh', md: '60vh' },
                    overflow: 'auto',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Selected ({Object.keys(dropOffSelectedItems).length})
                  </Typography>
                  {Object.keys(dropOffSelectedItems).length === 0 ? (
                    <EmptyContent
                      title="No items selected"
                      description="Select items from the left to drop off"
                      sx={{ py: 4 }}
                    />
                  ) : (
                    <Stack spacing={1}>
                      {Object.entries(dropOffSelectedItems).map(([inventoryId, qtyValue]) => {
                        const item = inventoryItems.find((i) => i.id === inventoryId);
                        if (!item) return null;
                        const qty = typeof qtyValue === 'string' ? (qtyValue === '' ? 1 : parseInt(qtyValue, 10)) : qtyValue;
                        const quantity = Number.isNaN(qty) || qty <= 0 ? 1 : qty;

                        return (
                          <Card key={inventoryId} sx={{ p: 1.5 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <InventoryItemImage
                                coverUrl={item.coverUrl}
                                name={item.name}
                                isOutOfStock={false}
                              />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {item.name}
                                </Typography>
                                {item.sku && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    SKU: {item.sku}
                                  </Typography>
                                )}
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                  Quantity: {quantity}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const next = { ...dropOffSelectedItems };
                                  delete next[inventoryId];
                                  setDropOffSelectedItems(next);
                                }}
                              >
                                <Iconify icon={"eva:close-fill" as any} />
                              </IconButton>
                            </Stack>
                          </Card>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
          <Button onClick={handleCloseDropOffDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmDropOff}
            disabled={
              !canSelectDropOffItems ||
              Object.keys(dropOffSelectedItems).length === 0 ||
              (dropOffDestination === 'site' && !dropOffSite)
            }
          >
            Drop-off {Object.keys(dropOffSelectedItems).length > 0 ? `(${Object.keys(dropOffSelectedItems).length})` : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
