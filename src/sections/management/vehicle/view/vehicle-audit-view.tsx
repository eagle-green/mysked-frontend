import type { IVehicleItem } from 'src/types/vehicle';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher, endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TablePaginationCustom } from 'src/components/table';

// ----------------------------------------------------------------------

type VehicleInventoryItem = {
  id: string;
  name: string;
  sku?: string;
  coverUrl?: string;
  type?: string;
  status?: string;
  available: number;
  requiredQty: number;
};

type InventoryItemImageProps = {
  coverUrl?: string;
  name: string;
};

function InventoryItemImage({ coverUrl, name }: InventoryItemImageProps) {
  const [imageError, setImageError] = useState(false);
  const hasImage = coverUrl && coverUrl.trim() !== '' && !imageError;

  return hasImage ? (
    <Box
      component="img"
      src={coverUrl}
      alt={name}
      onError={() => setImageError(true)}
      sx={{
        width: 80,
        height: 80,
        flexShrink: 0,
        borderRadius: 1,
        objectFit: 'cover',
      }}
    />
  ) : (
    <Box
      sx={{
        width: 80,
        height: 80,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'action.hover',
        borderRadius: 1,
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

export function VehicleAuditView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<IVehicleItem | null>(null);
  const [auditQuantities, setAuditQuantities] = useState<Record<string, number | string>>({});
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<VehicleInventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  const table = useTable({
    defaultRowsPerPage: 25,
    defaultOrderBy: 'license_plate',
    defaultOrder: 'asc',
  });

  // Fetch vehicles assigned to workers (for field supervisors to audit)
  const { data: vehicleListData, isLoading } = useQuery({
    queryKey: [
      'vehicles-for-audit',
      table.page,
      table.rowsPerPage,
      table.orderBy,
      table.order,
      searchQuery,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(table.page + 1));
      params.set('rowsPerPage', String(table.rowsPerPage));
      params.set('orderBy', table.orderBy);
      params.set('order', table.order);
      params.set('status', 'active'); // Only show active vehicles
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const response = await fetcher(`${endpoints.management.vehicle}?${params.toString()}`);
      return response.data;
    },
  });

  const vehicles = (vehicleListData?.vehicles || []) as IVehicleItem[];
  const totalCount = vehicleListData?.pagination?.totalCount || 0;

  // Filter to only show vehicles with assigned drivers (workers' vehicles)
  const workerVehicles = vehicles.filter((v) => v.assigned_driver);

  const handleOpenAuditDialog = async (vehicle: IVehicleItem) => {
    setSelectedVehicle(vehicle);
    setIsLoadingInventory(true);
    setAuditDialogOpen(true);

    try {
      // Fetch vehicle inventory
      const inventoryResponse = await fetcher(
        `${endpoints.management.vehicle}/${vehicle.id}/inventory`
      );
      const inventory = inventoryResponse.data || [];

      const mapped: VehicleInventoryItem[] = inventory.map((r: any) => ({
        id: r.id,
        name: r.name,
        sku: r.sku,
        coverUrl: r.cover_url ?? r.coverUrl,
        type: r.type,
        status: r.status,
        available: Number(r.vehicle_quantity ?? 0),
        requiredQty: Number(r.required_quantity ?? 0),
      }));

      setInventoryItems(mapped);

      // Initialize audit quantities with current values
      const initialQuantities: Record<string, number | string> = {};
      mapped.forEach((item) => {
        initialQuantities[item.id] = String(item.available);
      });
      setAuditQuantities(initialQuantities);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      toast.error('Failed to load vehicle inventory');
      setAuditDialogOpen(false);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  const handleCloseAuditDialog = () => {
    if (!isSubmittingAudit) {
      setAuditDialogOpen(false);
      setSelectedVehicle(null);
      setAuditQuantities({});
      setInventoryItems([]);
    }
  };

  const handleSubmitAudit = async () => {
    if (!selectedVehicle) return;

    setIsSubmittingAudit(true);
    try {
      // Prepare items with changes
      const itemsToUpdate = Object.entries(auditQuantities)
        .map(([id, qtyValue]) => {
          const qty =
            typeof qtyValue === 'string' ? (qtyValue === '' ? 0 : parseInt(qtyValue, 10)) : qtyValue;
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
        handleCloseAuditDialog();
        setIsSubmittingAudit(false);
        return;
      }

      // Submit audit update (this is a supervisor audit, not a bulk adjustment)
      await fetcher([
        `/api/vehicles/${selectedVehicle.id}/inventory/audit`,
        {
          method: 'post',
          data: { 
            items: itemsToUpdate,
            isAudit: true, // True for supervisor audits from Audit Vehicles page
          },
        },
      ]);

      toast.success(
        `Inventory audit completed for ${selectedVehicle.license_plate}: ${itemsToUpdate.length} item${itemsToUpdate.length > 1 ? 's' : ''} updated`
      );

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['vehicles-for-audit'] });
      await queryClient.invalidateQueries({ queryKey: ['vehicle-inventory', selectedVehicle.id] });
      await queryClient.invalidateQueries({ queryKey: ['vehicle-history', selectedVehicle.id] });

      handleCloseAuditDialog();
    } catch (err) {
      console.error('Failed to submit audit:', err);
      toast.error('Failed to submit inventory audit');
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  return (
    <>
      <CustomBreadcrumbs
        heading="Audit Vehicles"
        links={[
          { name: 'Management' },
          { name: 'Vehicle' },
          { name: 'Audit Vehicles' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Box sx={{ p: { xs: 2, md: 3 }, pb: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Audit Worker Vehicles</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Review and audit inventory for vehicles assigned to workers
            </Typography>
          </Box>

          <TextField
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by license plate, unit number, or driver name..."
            size={isMobile ? 'small' : 'medium'}
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
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'relative' }}>
          <Scrollbar>
            <Table sx={{ minWidth: 960 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>License Plate</TableCell>
                  <TableCell>Unit Number</TableCell>
                  <TableCell>Assigned Driver</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : workerVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyContent
                        title={searchQuery ? 'No vehicles found' : 'No vehicles assigned to workers'}
                        description={
                          searchQuery
                            ? 'Try adjusting your search'
                            : 'Vehicles assigned to workers will appear here for auditing'
                        }
                        sx={{ py: 10 }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  workerVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {(() => {
                            switch (vehicle.type) {
                              case 'highway_truck':
                                return 'HWY';
                              case 'lane_closure_truck':
                                return 'LCT';
                              default:
                                return vehicle.type || '-';
                            }
                          })()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{vehicle.license_plate}</Typography>
                          {vehicle.info && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {vehicle.info}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{vehicle.unit_number || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        {vehicle.assigned_driver ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={vehicle.assigned_driver.photo_url ?? undefined}
                              alt={`${vehicle.assigned_driver.first_name} ${vehicle.assigned_driver.last_name}`}
                              sx={{ width: 32, height: 32, flexShrink: 0 }}
                            >
                              {vehicle.assigned_driver.first_name?.charAt(0).toUpperCase() ||
                                vehicle.assigned_driver.last_name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2">
                              {vehicle.assigned_driver.first_name} {vehicle.assigned_driver.last_name}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{vehicle.region || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Label
                          variant="soft"
                          color={
                            (vehicle.status === 'active' && 'success') ||
                            (vehicle.status === 'inactive' && 'error') ||
                            (vehicle.status === 'repair' && 'warning') ||
                            'default'
                          }
                        >
                          {vehicle.status || 'active'}
                        </Label>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Iconify icon={"solar:clipboard-check-bold" as any} />}
                          onClick={() => handleOpenAuditDialog(vehicle)}
                        >
                          Audit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Stack spacing={2} sx={{ p: 2 }}>
            {isLoading ? (
              [...Array(3)].map((_, index) => (
                <Card key={index} sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="50%" />
                    <Skeleton variant="rectangular" width="100%" height={36} sx={{ mt: 1 }} />
                  </Stack>
                </Card>
              ))
            ) : workerVehicles.length === 0 ? (
              <Box sx={{ py: 4 }}>
                <EmptyContent
                  title={searchQuery ? 'No vehicles found' : 'No vehicles assigned to workers'}
                  description={
                    searchQuery
                      ? 'Try adjusting your search'
                      : 'Vehicles assigned to workers will appear here for auditing'
                  }
                />
              </Box>
            ) : (
              workerVehicles.map((vehicle) => (
                <Card key={vehicle.id} sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {vehicle.license_plate}
                        </Typography>
                        {vehicle.info && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {vehicle.info}
                          </Typography>
                        )}
                        {vehicle.unit_number && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Unit: {vehicle.unit_number}
                          </Typography>
                        )}
                      </Box>
                      <Label
                        variant="soft"
                        color={
                          (vehicle.status === 'active' && 'success') ||
                          (vehicle.status === 'inactive' && 'error') ||
                          (vehicle.status === 'repair' && 'warning') ||
                          'default'
                        }
                      >
                        {vehicle.status || 'active'}
                      </Label>
                    </Box>

                    <Divider />

                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Type:
                        </Typography>
                        <Typography variant="body2">
                          {(() => {
                            switch (vehicle.type) {
                              case 'highway_truck':
                                return 'HWY';
                              case 'lane_closure_truck':
                                return 'LCT';
                              default:
                                return vehicle.type || '-';
                            }
                          })()}
                        </Typography>
                      </Box>
                      {vehicle.assigned_driver && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Driver:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={vehicle.assigned_driver.photo_url ?? undefined}
                              alt={`${vehicle.assigned_driver.first_name} ${vehicle.assigned_driver.last_name}`}
                              sx={{ 
                                width: 24, 
                                height: 24, 
                                flexShrink: 0,
                                fontSize: '0.65rem',
                                fontWeight: 500
                              }}
                            >
                              {vehicle.assigned_driver.first_name?.charAt(0).toUpperCase() ||
                                vehicle.assigned_driver.last_name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2">
                              {vehicle.assigned_driver.first_name} {vehicle.assigned_driver.last_name}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {vehicle.region && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Region:
                          </Typography>
                          <Typography variant="body2">{vehicle.region}</Typography>
                        </Box>
                      )}
                    </Stack>

                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<Iconify icon={"solar:clipboard-check-bold" as any} />}
                      onClick={() => handleOpenAuditDialog(vehicle)}
                      sx={{ mt: 1 }}
                    >
                      Audit Inventory
                    </Button>
                  </Stack>
                </Card>
              ))
            )}
          </Stack>
        </Box>

        <TablePaginationCustom
          page={table.page}
          count={totalCount}
          rowsPerPage={table.rowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      {/* Audit Inventory Dialog */}
      <Dialog
        open={auditDialogOpen}
        onClose={handleCloseAuditDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: { xs: 1, md: 2 } }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.5, md: 0 } }}>
              <Iconify icon={"solar:clipboard-check-bold" as any} width={24} />
              <Typography variant="h6">Audit Inventory</Typography>
            </Box>
            {selectedVehicle && (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', mt: { xs: 0.5, md: 0.5 }, pl: { xs: 0, md: 4 } }}
              >
                {selectedVehicle.license_plate} - {selectedVehicle.unit_number || 'N/A'}
                {selectedVehicle.assigned_driver &&
                  ` (${selectedVehicle.assigned_driver.first_name} ${selectedVehicle.assigned_driver.last_name})`}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
          {isLoadingInventory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography
                variant="body2"
                sx={{ mb: { xs: 2, md: 3 }, color: 'text.secondary', fontSize: { xs: '0.875rem', md: '0.875rem' } }}
              >
                Update quantities for all inventory items at once. This will be recorded as an
                audit in the vehicle history.
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
                      {inventoryItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3}>
                            <EmptyContent
                              title="No inventory items"
                              description="This vehicle has no inventory items assigned"
                              sx={{ py: 4 }}
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        inventoryItems.map((item) => (
                          <TableRow key={item.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <InventoryItemImage coverUrl={item.coverUrl} name={item.name} />
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </Box>

              {/* Mobile Card View */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {inventoryItems.length === 0 ? (
                  <EmptyContent
                    title="No inventory items"
                    description="This vehicle has no inventory items assigned"
                    sx={{ py: 4 }}
                  />
                ) : (
                  <Stack spacing={2}>
                    {inventoryItems.map((item) => (
                      <Card key={item.id} sx={{ p: 2 }}>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <InventoryItemImage coverUrl={item.coverUrl} name={item.name} />
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
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 2 }, gap: { xs: 1, md: 0 } }}>
          <Button
            onClick={handleCloseAuditDialog}
            disabled={isSubmittingAudit}
            size={isMobile ? 'large' : 'medium'}
            fullWidth={isMobile}
          >
            Cancel
          </Button>
            <Button
              variant="contained"
              onClick={handleSubmitAudit}
              disabled={isSubmittingAudit || inventoryItems.length === 0 || isLoadingInventory}
              startIcon={<Iconify icon={"solar:check-circle-bold" as any} />}
              size={isMobile ? 'large' : 'medium'}
              fullWidth={isMobile}
            >
              {isSubmittingAudit ? 'Saving...' : 'Save Audit'}
            </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

