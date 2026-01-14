import { useParams } from 'react-router';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, usePathname, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { 
  useTable,
  emptyRows, 
  TableNoData, 
  TableEmptyRows, 
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';


// ----------------------------------------------------------------------

const TAB_PARAM = 'tab';
const HISTORY_FILTER_PARAM = 'historyFilter';

export function InventoryDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get(TAB_PARAM) ?? 'vehicles';
  const historyFilter = searchParams.get(HISTORY_FILTER_PARAM) ?? 'all';
  
  const createRedirectPath = (currentPath: string, query: string) => {
    const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
    return `${currentPath}?${queryString}`;
  };
  
  const createHistoryFilterPath = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(HISTORY_FILTER_PARAM, filter);
    return `${pathname}?${params.toString()}`;
  };
  
  // Initialize table hook BEFORE any conditional returns (Rules of Hooks)
  const vehiclesTable = useTable({ 
    defaultOrderBy: 'license_plate', 
    defaultRowsPerPage: 10,
    defaultDense: true,
  });
  
  // Search state for vehicles
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  
  const sitesTable = useTable({ 
    defaultOrderBy: 'name', 
    defaultRowsPerPage: 50,
    defaultDense: true,
  });

  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      if (!id) return undefined;
      const response = await fetcher(
        `${endpoints.management.inventory || '/api/inventory'}/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });

  const {
    data: vehiclesData,
    isLoading: vehiclesLoading,
  } = useQuery({
    queryKey: ['inventory-vehicles', id],
    queryFn: async () => {
      if (!id) return undefined;
      const response = await fetcher(
        `${endpoints.management.inventory || '/api/inventory'}/${id}/vehicles`
      );
      return response.data;
    },
    enabled: !!id,
  });
  
  const {
    data: sitesData,
    isLoading: sitesLoading,
  } = useQuery({
    queryKey: ['inventory-sites', id],
    queryFn: async () => {
      if (!id) return undefined;
      const response = await fetcher(
        `${endpoints.management.inventory || '/api/inventory'}/${id}/sites`
      );
      return response.data;
    },
    enabled: !!id,
  });
  
  const historyTable = useTable({ 
    defaultOrderBy: 'created_at', 
    defaultRowsPerPage: 25,
    defaultDense: true,
  });
  
  const {
    data: historyData,
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ['inventory-history', id, historyTable.page, historyTable.rowsPerPage],
    queryFn: async () => {
      if (!id) return undefined;
      const params = new URLSearchParams({
        limit: historyTable.rowsPerPage.toString(),
        offset: (historyTable.page * historyTable.rowsPerPage).toString(),
      });
      const response = await fetcher(
        `${endpoints.management.inventory || '/api/inventory'}/${id}/history?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!id,
  });

  // Filter transactions based on history filter - MUST be before conditional returns
  const allTransactions = useMemo(() => historyData?.transactions || [], [historyData?.transactions]);
  const transactions = useMemo(() => {
    if (historyFilter === 'all') return allTransactions;
    
    return allTransactions.filter((transaction: any) => {
      const type = transaction.transaction_type;
      const itemStatus = transaction.item_status;
      
      if (historyFilter === 'inventory') {
        // Inventory transactions (office to vehicle and office inventory adjustments)
        return type === 'office_to_vehicle' || type === 'office_inventory_adjustment';
      }
      if (historyFilter === 'drop-off') {
        // Drop-off transactions (vehicle to site)
        return type === 'vehicle_to_site';
      }
      if (historyFilter === 'pick-up') {
        // Pick-up transactions (site to vehicle)
        return type === 'site_to_vehicle';
      }
      if (historyFilter === 'missing') {
        // Missing status reports
        return type === 'site_to_site' && itemStatus === 'missing';
      }
      if (historyFilter === 'damaged') {
        // Damaged status reports
        return type === 'site_to_site' && itemStatus === 'damaged';
      }
      
      return true;
    });
  }, [allTransactions, historyFilter]);

  // Define data variables and hooks BEFORE any early returns (Rules of Hooks)
  const inventory = inventoryData;
  const allVehicles = useMemo(() => vehiclesData?.vehicles || [], [vehiclesData?.vehicles]);
  const allSites = sitesData?.sites || [];
  const historyTotalCount = historyData?.pagination?.total || 0;
  
  // Filter vehicles based on search query (must be before any early returns)
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearchQuery.trim()) return allVehicles;
    
    const query = vehicleSearchQuery.toLowerCase().trim();
    return allVehicles.filter((vehicle: any) => {
      const licensePlate = (vehicle.license_plate || '').toLowerCase();
      const vehicleInfo = (vehicle.info || '').toLowerCase();
      const unitNumber = (vehicle.unit_number || '').toLowerCase();
      const driverFirstName = (vehicle.assigned_driver_first_name || '').toLowerCase();
      const driverLastName = (vehicle.assigned_driver_last_name || '').toLowerCase();
      const driverFullName = `${driverFirstName} ${driverLastName}`.trim();
      const location = (vehicle.location || '').toLowerCase();
      
      return (
        licensePlate.includes(query) ||
        vehicleInfo.includes(query) ||
        unitNumber.includes(query) ||
        driverFirstName.includes(query) ||
        driverLastName.includes(query) ||
        driverFullName.includes(query) ||
        location.includes(query)
      );
    });
  }, [allVehicles, vehicleSearchQuery]);

  if (inventoryLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Inventory Details"
          links={[
            { name: 'Management' },
            { name: 'Inventory' },
            { name: 'Details' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading...
        </Box>
      </DashboardContent>
    );
  }

  if (inventoryError || !inventoryData) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Inventory Details"
          links={[
            { name: 'Management' },
            { name: 'Inventory' },
            { name: 'Details' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <h3>Error Loading Inventory Item</h3>
          <p>Failed to load inventory data.</p>
        </Box>
      </DashboardContent>
    );
  }

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  
  const formatTransactionDescription = (transaction: any) => {
    const qty = transaction.quantity || 0;
    const transactionType = transaction.transaction_type;
    
    // Handle site status reports (missing/damaged)
    if (transactionType === 'site_to_site' && transaction.item_status) {
      const statusLabel = transaction.item_status === 'missing' ? 'Missing' : transaction.item_status === 'damaged' ? 'Damaged' : transaction.item_status;
      const siteName = transaction.source_site_name || transaction.dest_site_name || 'site';
      // For status reports, quantity is negative (e.g., -1) because it's a deduction
      // Calculate quantity change: old = new + reported, new = quantity after deduction
      const reportedQty = Math.abs(Number(qty) || 0);
      // Without site inventory state, we can't calculate exact quantities
      // Show the quantity change using the reported quantity
      // For a transaction with quantity -1, show (1 → 0) assuming 1 was reported
      const quantityBefore = reportedQty;
      const quantityAfter = 0;
      return `${reportedQty} item${reportedQty !== 1 ? 's' : ''} reported as ${statusLabel.toLowerCase()} at ${siteName} (site inventory: ${quantityBefore} → ${quantityAfter})`;
    }
    
    // Handle office inventory adjustments
    if (transactionType === 'office_inventory_adjustment') {
      // Parse the notes to get old and new quantities (format: "Quantity adjusted from X to Y")
      const notes = transaction.notes || '';
      const match = notes.match(/from (\d+) to (\d+)/);
      if (match) {
        const oldQty = parseInt(match[1], 10);
        const newQty = parseInt(match[2], 10);
        return `Quantity adjusted (${oldQty} → ${newQty})`;
      }
      // Fallback: show quantity change
      const changeText = qty > 0 ? `+${qty}` : qty.toString();
      return `Quantity adjusted ${changeText}`;
    }
    
    if (transactionType === 'office_to_vehicle') {
      return `Added ${qty} to vehicle ${transaction.dest_vehicle_license || ''}`;
    }
    if (transactionType === 'site_to_vehicle') {
      return `Added ${qty} from site ${transaction.source_site_name || ''} to vehicle ${transaction.dest_vehicle_license || ''}`;
    }
    if (transactionType === 'vehicle_to_site') {
      return `Left ${qty} at site ${transaction.dest_site_name || ''} from vehicle ${transaction.source_vehicle_license || ''}`;
    }
    return `Transaction: ${qty} items`;
  };

  const VEHICLES_TABLE_HEAD = [
    { id: 'type', label: 'Type' },
    { id: 'license_plate', label: 'License Plate' },
    { id: 'unit_number', label: 'Unit Number' },
    { id: 'driver', label: 'Driver' },
    { id: 'vehicle_quantity', label: 'Qty', width: 80 },
    { id: 'status', label: 'Status', width: 100 },
  ];

  const SITES_TABLE_HEAD = [
    { id: 'name', label: 'Site Name' },
    { id: 'address', label: 'Address' },
    { id: 'unit_number', label: 'Unit Number' },
    { id: 'site_quantity', label: 'Qty', width: 80 },
    { id: 'status', label: 'Status', width: 100 },
  ];

  // Apply sorting for vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    const isAsc = vehiclesTable.order === 'asc';
    
    switch (vehiclesTable.orderBy) {
      case 'type':
        return isAsc 
          ? (a.type || '').localeCompare(b.type || '')
          : (b.type || '').localeCompare(a.type || '');
      case 'license_plate':
        return isAsc
          ? (a.license_plate || '').localeCompare(b.license_plate || '')
          : (b.license_plate || '').localeCompare(a.license_plate || '');
      case 'unit_number':
        return isAsc
          ? (a.unit_number || '').localeCompare(b.unit_number || '')
          : (b.unit_number || '').localeCompare(a.unit_number || '');
      case 'vehicle_quantity':
        return isAsc
          ? (a.vehicle_quantity || 0) - (b.vehicle_quantity || 0)
          : (b.vehicle_quantity || 0) - (a.vehicle_quantity || 0);
      case 'status':
        return isAsc
          ? (a.status || '').localeCompare(b.status || '')
          : (b.status || '').localeCompare(a.status || '');
      default:
        return 0;
    }
  });

  // Apply pagination for vehicles
  const paginatedVehicles = sortedVehicles.slice(
    vehiclesTable.page * vehiclesTable.rowsPerPage,
    vehiclesTable.page * vehiclesTable.rowsPerPage + vehiclesTable.rowsPerPage
  );

  // Apply sorting for sites
  const sortedSites = [...allSites].sort((a, b) => {
    const isAsc = sitesTable.order === 'asc';
    
    switch (sitesTable.orderBy) {
      case 'name':
        return isAsc
          ? (a.name || '').localeCompare(b.name || '')
          : (b.name || '').localeCompare(a.name || '');
      case 'address': {
        const addressA = `${a.street_number || ''} ${a.street_name || ''} ${a.city || ''}`.trim();
        const addressB = `${b.street_number || ''} ${b.street_name || ''} ${b.city || ''}`.trim();
        return isAsc
          ? addressA.localeCompare(addressB)
          : addressB.localeCompare(addressA);
      }
      case 'unit_number':
        return isAsc
          ? (a.unit_number || '').localeCompare(b.unit_number || '')
          : (b.unit_number || '').localeCompare(a.unit_number || '');
      case 'site_quantity':
        return isAsc
          ? (a.site_quantity || 0) - (b.site_quantity || 0)
          : (b.site_quantity || 0) - (a.site_quantity || 0);
      case 'status':
        return isAsc
          ? (a.site_inventory_status || '').localeCompare(b.site_inventory_status || '')
          : (b.site_inventory_status || '').localeCompare(a.site_inventory_status || '');
      default:
        return 0;
    }
  });

  // Apply pagination for sites
  const paginatedSites = sortedSites.slice(
    sitesTable.page * sitesTable.rowsPerPage,
    sitesTable.page * sitesTable.rowsPerPage + sitesTable.rowsPerPage
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Inventory Details"
        links={[
          { name: 'Management' },
          { name: 'Inventory', href: paths.management.inventory.list },
          { name: inventory?.name || 'Details' },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => router.push(paths.management.inventory.list)}
              startIcon={<Iconify icon="eva:arrowhead-left-fill" />}
            >
              Back
            </Button>
            <Button
              component={RouterLink}
              href={paths.management.inventory.edit(id!)}
              variant="contained"
              startIcon={<Iconify icon="solar:pen-bold" />}
            >
              Edit Item
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        {/* Inventory Item Details */}
        <Card>
          <Box sx={{ p: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Box sx={{ typography: 'h4', flex: 1 }}>{inventory.name}</Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {inventory.lct && (
                  <Label variant="soft" color="primary">
                    LCT
                  </Label>
                )}
                {inventory.hwy && (
                  <Label variant="soft" color="error">
                    HWY
                  </Label>
                )}
                {inventory.billable && (
                  <Tooltip title="Billable Item" arrow placement="top">
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: 'success.lighter',
                        color: 'success.main',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                      }}
                    >
                      $
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Image Section */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    width: 1,
                    aspectRatio: '1/1',
                    maxWidth: 320,
                    mx: 'auto', // Center horizontally
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'background.neutral',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: (themeParam) => `1px solid ${themeParam.palette.divider}`,
                  }}
                >
                  {inventory.cover_url ? (
                    <Box
                      component="img"
                      src={inventory.cover_url}
                      alt={inventory.name}
                      sx={{
                        width: 1,
                        height: 1,
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Box
                      component="svg"
                      xmlns="http://www.w3.org/2000/svg"
                      width={64}
                      height={64}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      sx={{ color: 'text.disabled' }}
                    >
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Details Section */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Stack spacing={3}>
                  {/* Basic Information */}
                  <Box>
                    <Box sx={{ typography: 'subtitle2', mb: 2, color: 'text.primary' }}>
                      Basic Information
                    </Box>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                          Type
                        </Box>
                        <Box sx={{ typography: 'body2' }}>
                          {inventory.type 
                            ? inventory.type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                            : '-'
                          }
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                          SKU
                        </Box>
                        <Box sx={{ typography: 'body2' }}>{inventory.sku}</Box>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                          Quantity
                        </Box>
                        <Box sx={{ typography: 'body2', fontWeight: 600 }}>
                          {inventory.quantity}
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                          Reorder Point
                        </Box>
                        <Box sx={{ typography: 'body2' }}>{inventory.reorder_point}</Box>
                      </Grid>
                    </Grid>
                    
                    {/* LCT/HWY Required Quantities - Second Row */}
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                          LCT Required Qty
                        </Box>
                        <Box sx={{ typography: 'body2', fontWeight: 600 }}>
                          {inventory.lct_required_qty || 0}
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                          HWY Required Qty
                        </Box>
                        <Box sx={{ typography: 'body2', fontWeight: 600 }}>
                          {inventory.hwy_required_qty || 0}
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {inventory.description && (
                      <Box sx={{ mt: 3 }}>
                        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                          Description
                        </Box>
                        <Box sx={{ typography: 'body2' }}>{inventory.description}</Box>
                      </Box>
                    )}
                  </Box>

                  {/* Sign-Specific Information */}
                  {inventory.type === 'sign' && (
                    <Box>
                      <Box sx={{ typography: 'subtitle2', mb: 2, color: 'text.primary' }}>
                        Sign Specifications
                      </Box>
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                            Width (mm)
                          </Box>
                          <Box sx={{ typography: 'body2' }}>{inventory.width_mm}</Box>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                            Height (mm)
                          </Box>
                          <Box sx={{ typography: 'body2' }}>{inventory.height_mm}</Box>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                            Reflectivity
                          </Box>
                          <Box sx={{ typography: 'body2' }}>
                            {inventory.reflectivity_astm_type 
                              ? `Type ${inventory.reflectivity_astm_type}`
                              : '-'
                            }
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                            MoT Approval
                          </Box>
                          <Box sx={{ typography: 'body2' }}>{inventory.mot_approval}</Box>
                        </Grid>
                      </Grid>
                      
                      {/* Typical Application - Full Width Row */}
                      <Grid container spacing={3} sx={{ mt: 2 }}>
                        <Grid size={{ xs: 12, sm: 12 }}>
                          <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 0.5 }}>
                            Typical Application
                          </Box>
                          <Box sx={{ typography: 'body2' }}>{inventory.typical_application}</Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* Vehicles and Sites with this item - Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2.5 }}>
            <Tabs value={selectedTab}>
              <Tab
                component={RouterLink}
                value="vehicles"
                label="Vehicles with this item"
                href={createRedirectPath(pathname, 'vehicles')}
              />
              <Tab
                component={RouterLink}
                value="sites"
                label="Sites with this item"
                href={createRedirectPath(pathname, 'sites')}
              />
              <Tab
                component={RouterLink}
                value="history"
                label="History"
                href={createRedirectPath(pathname, 'history')}
              />
            </Tabs>
          </Box>

          {selectedTab === 'vehicles' && (
            <>
              <Box sx={{ p: 3, pb: 2 }}>
                <Box sx={{ typography: 'h6', mb: 1 }}>Vehicles with this item</Box>
                <Box sx={{ typography: 'body2', color: 'text.secondary', mb: 2 }}>
                  {allVehicles.length === 0 
                    ? 'No vehicles currently have this inventory item.' 
                    : `${allVehicles.length} vehicle${allVehicles.length === 1 ? '' : 's'} have this item.`
                  }
                </Box>
                <TextField
                  fullWidth
                  value={vehicleSearchQuery}
                  onChange={(e) => {
                    setVehicleSearchQuery(e.target.value);
                    vehiclesTable.onResetPage(); // Reset to first page when searching
                  }}
                  placeholder="Search by license plate, vehicle info, unit number, driver, or location..."
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ maxWidth: 600 }}
                />
              </Box>

              <Box sx={{ position: 'relative' }}>
                <Scrollbar>
                  <Table size={vehiclesTable.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                    <TableHeadCustom
                      order={vehiclesTable.order}
                      orderBy={vehiclesTable.orderBy}
                      headCells={VEHICLES_TABLE_HEAD}
                      onSort={vehiclesTable.onSort}
                    />

                    <TableBody>
                      {paginatedVehicles.map((vehicle) => (
                        <TableRow key={vehicle.id} hover>
                          <TableCell>
                            {(() => {
                              const typeMap: Record<string, string> = {
                                highway_truck: 'HWY',
                                lane_closure_truck: 'LCT',
                              };
                              return typeMap[vehicle.type] || vehicle.type;
                            })()}
                          </TableCell>

                          <TableCell>
                            <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
                              <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                                <Link
                                  component={RouterLink}
                                  href={paths.management.vehicle.edit(vehicle.id)}
                                  color="primary"
                                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  {vehicle.license_plate}
                                </Link>
                                {vehicle.info && (
                                  <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
                                    {vehicle.info}
                                  </Box>
                                )}
                              </Stack>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Stack sx={{ typography: 'body2', alignItems: 'flex-start' }}>
                              <Box>{vehicle.unit_number || '-'}</Box>
                              {vehicle.location && (
                                <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
                                  {vehicle.location}
                                </Box>
                              )}
                            </Stack>
                          </TableCell>

                          <TableCell>
                            {vehicle.assigned_driver_first_name && vehicle.assigned_driver_last_name && (
                              <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                  src={vehicle.assigned_driver_photo_url ?? undefined}
                                  alt={vehicle.assigned_driver_first_name}
                                  sx={{ width: 32, height: 32 }}
                                >
                                  {vehicle.assigned_driver_first_name?.charAt(0).toUpperCase()}
                                </Avatar>
                                <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                                  {`${vehicle.assigned_driver_first_name} ${vehicle.assigned_driver_last_name}`}
                                </Stack>
                              </Box>
                            )}
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {vehicle.vehicle_quantity || 0}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Label
                              variant="soft"
                              color={
                                (vehicle.status === 'active' && 'success') ||
                                (vehicle.status === 'inactive' && 'error') ||
                                'default'
                              }
                            >
                              {vehicle.status}
                            </Label>
                          </TableCell>
                        </TableRow>
                      ))}

                      <TableEmptyRows
                        height={vehiclesTable.dense ? 56 : 56 + 20}
                        emptyRows={emptyRows(vehiclesTable.page, vehiclesTable.rowsPerPage, filteredVehicles.length)}
                      />

                      <TableNoData notFound={filteredVehicles.length === 0 && !vehiclesLoading} />
                    </TableBody>
                  </Table>
                </Scrollbar>
              </Box>

              <TablePaginationCustom
                page={vehiclesTable.page}
                dense={vehiclesTable.dense}
                count={filteredVehicles.length}
                rowsPerPage={vehiclesTable.rowsPerPage}
                onPageChange={vehiclesTable.onChangePage}
                onChangeDense={vehiclesTable.onChangeDense}
                onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  vehiclesTable.onChangeRowsPerPage(event);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </>
          )}

          {selectedTab === 'sites' && (
            <>
              <Box sx={{ p: 3, pb: 2 }}>
                <Box sx={{ typography: 'h6', mb: 1 }}>Sites with this item</Box>
                <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
                  {allSites.length === 0 
                    ? 'No sites currently have this inventory item.' 
                    : `${allSites.length} site${allSites.length === 1 ? '' : 's'} have this item.`
                  }
                </Box>
              </Box>

              <Box sx={{ position: 'relative' }}>
                <Scrollbar>
                  <Table size={sitesTable.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                    <TableHeadCustom
                      order={sitesTable.order}
                      orderBy={sitesTable.orderBy}
                      headCells={SITES_TABLE_HEAD}
                      onSort={sitesTable.onSort}
                    />

                    <TableBody>
                      {paginatedSites.map((site) => {
                        const address = [
                          site.street_number,
                          site.street_name,
                          site.city,
                          site.province,
                          site.postal_code,
                        ].filter(Boolean).join(' ');
                        
                        return (
                          <TableRow key={site.id} hover>
                            <TableCell>
                              <Link
                                component={RouterLink}
                                href={paths.management.customer.site.edit(site.id)}
                                color="primary"
                                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                {site.name}
                              </Link>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2">
                                {address || '-'}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2">
                                {site.unit_number || '-'}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {site.site_quantity || 0}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Label
                                variant="soft"
                                color={
                                  (site.site_inventory_status === 'active' && 'success') ||
                                  (site.site_inventory_status === 'missing' && 'warning') ||
                                  (site.site_inventory_status === 'damaged' && 'error') ||
                                  (site.site_inventory_status === 'inactive' && 'error') ||
                                  'default'
                                }
                              >
                                {site.site_inventory_status || 'active'}
                              </Label>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      <TableEmptyRows
                        height={sitesTable.dense ? 56 : 56 + 20}
                        emptyRows={emptyRows(sitesTable.page, sitesTable.rowsPerPage, allSites.length)}
                      />

                      <TableNoData notFound={allSites.length === 0 && !sitesLoading} />
                    </TableBody>
                  </Table>
                </Scrollbar>
              </Box>

              <TablePaginationCustom
                page={sitesTable.page}
                dense={sitesTable.dense}
                count={allSites.length}
                rowsPerPage={sitesTable.rowsPerPage}
                onPageChange={sitesTable.onChangePage}
                onChangeDense={sitesTable.onChangeDense}
                onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  sitesTable.onChangeRowsPerPage(event);
                }}
              />
            </>
          )}

          {selectedTab === 'history' && (
            <>
              {/* History Filter Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2.5 }}>
                <Tabs 
                  value={historyFilter} 
                  onChange={(e, newValue) => {
                    router.push(createHistoryFilterPath(newValue));
                    historyTable.onResetPage();
                  }}
                >
                  <Tab label="All" value="all" />
                  <Tab label="Inventory" value="inventory" />
                  <Tab label="Drop-off" value="drop-off" />
                  <Tab label="Pick-up" value="pick-up" />
                  <Tab label="Missing" value="missing" />
                  <Tab label="Damaged" value="damaged" />
                </Tabs>
              </Box>

              {historyLoading ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading history...
                  </Typography>
                </Box>
              ) : transactions.length === 0 ? (
                <Box sx={{ py: 5 }}>
                  <EmptyContent
                    title="No history"
                    description="No transaction history found for this inventory item."
                    sx={{ py: 10 }}
                  />
                </Box>
              ) : (
                <>
                  <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                    <Stack spacing={2}>
                      {transactions.map((transaction: any) => {
                        const userName = transaction.initiated_by_first_name && transaction.initiated_by_last_name
                          ? `${transaction.initiated_by_first_name} ${transaction.initiated_by_last_name}`
                          : 'System';
                        const nameParts = userName.split(' ').filter(Boolean);
                        const initial = nameParts[0]?.charAt(0).toUpperCase() || 'S';
                        const photoUrl = transaction.initiated_by_photo_url || null;
                        
                        const getTransactionColor = () => {
                          const type = transaction.transaction_type;
                          if (type === 'office_to_vehicle' || type === 'site_to_vehicle') return 'success.main';
                          if (type === 'vehicle_to_site') return 'warning.main';
                          if (type === 'office_inventory_adjustment') return 'info.main';
                          return 'divider';
                        };
                        
                        return (
                          <Box
                            key={transaction.id}
                            sx={{
                              p: 2,
                              borderRadius: 1,
                              bgcolor: 'background.neutral',
                              borderLeft: '3px solid',
                              borderColor: getTransactionColor(),
                            }}
                          >
                            <Stack spacing={1}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar
                                  src={photoUrl || undefined}
                                  alt={userName}
                                  sx={{ width: 32, height: 32, flexShrink: 0 }}
                                >
                                  {initial}
                                </Avatar>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                    {userName}
                                  </Typography>
                                  <Iconify
                                    icon="solar:clock-circle-bold"
                                    sx={{ fontSize: 18, color: 'text.secondary' }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDateTime(transaction.created_at)}
                                  </Typography>
                                </Stack>
                              </Stack>
                              <Box sx={{ pl: 5 }}>
                                <Typography variant="body2">
                                  {formatTransactionDescription(transaction)}
                                </Typography>
                                {transaction.notes && transaction.transaction_type !== 'site_to_site' && transaction.transaction_type !== 'office_inventory_adjustment' && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    Note: {transaction.notes}
                                  </Typography>
                                )}
                                {/* Don't show "From" and "To" for site status reports and office inventory adjustments */}
                                {transaction.transaction_type !== 'site_to_site' && transaction.transaction_type !== 'office_inventory_adjustment' && (transaction.source_vehicle_license || transaction.dest_vehicle_license || transaction.source_site_name || transaction.dest_site_name) && (
                                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                    {transaction.source_vehicle_license && (
                                      <Link
                                        component="a"
                                        href={transaction.source_vehicle_id ? `${paths.management.vehicle.edit(transaction.source_vehicle_id)}?tab=inventory` : '#'}
                                        variant="caption"
                                        color="primary"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        From: {transaction.source_vehicle_license}
                                      </Link>
                                    )}
                                    {transaction.dest_vehicle_license && (
                                      <Link
                                        component="a"
                                        href={transaction.destination_vehicle_id ? `${paths.management.vehicle.edit(transaction.destination_vehicle_id)}?tab=inventory` : '#'}
                                        variant="caption"
                                        color="primary"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        To: {transaction.dest_vehicle_license}
                                      </Link>
                                    )}
                                    {transaction.source_site_name && (
                                      <Link
                                        component="a"
                                        href={transaction.source_site_id ? `${paths.management.customer.site.edit(transaction.source_site_id)}?tab=inventory` : '#'}
                                        variant="caption"
                                        color="primary"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        From: {transaction.source_site_name}
                                      </Link>
                                    )}
                                    {transaction.dest_site_name && (
                                      <Link
                                        component="a"
                                        href={transaction.destination_site_id ? `${paths.management.customer.site.edit(transaction.destination_site_id)}?tab=inventory` : '#'}
                                        variant="caption"
                                        color="primary"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        To: {transaction.dest_site_name}
                                      </Link>
                                    )}
                                  </Stack>
                                )}
                              </Box>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>

                  <TablePaginationCustom
                    page={historyTable.page}
                    dense={historyTable.dense}
                    count={historyTotalCount}
                    rowsPerPage={historyTable.rowsPerPage}
                    onPageChange={historyTable.onChangePage}
                    onChangeDense={historyTable.onChangeDense}
                    onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      historyTable.onChangeRowsPerPage(event);
                    }}
                  />
                </>
              )}
            </>
          )}
        </Card>
      </Stack>
    </DashboardContent>
  );
}
