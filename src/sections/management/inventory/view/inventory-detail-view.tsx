import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
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

export function InventoryDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  // Initialize table hook BEFORE any conditional returns (Rules of Hooks)
  const table = useTable({ 
    defaultOrderBy: 'license_plate', 
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

  const inventory = inventoryData;
  const allVehicles = vehiclesData?.vehicles || [];

  const TABLE_HEAD = [
    { id: 'type', label: 'Type' },
    { id: 'license_plate', label: 'License Plate' },
    { id: 'unit_number', label: 'Unit Number' },
    { id: 'driver', label: 'Driver' },
    { id: 'vehicle_quantity', label: 'Qty', width: 80 },
    { id: 'status', label: 'Status', width: 100 },
  ];

  // Apply sorting
  const sortedVehicles = [...allVehicles].sort((a, b) => {
    const isAsc = table.order === 'asc';
    
    switch (table.orderBy) {
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

  // Apply pagination
  const paginatedVehicles = sortedVehicles.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
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
              {(inventory.lct || inventory.hwy) && (
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
                </Box>
              )}
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

        {/* Vehicles with this item */}
        <Card>
          <Box sx={{ p: 3, pb: 2 }}>
            <Box sx={{ typography: 'h6', mb: 1 }}>Vehicles with this item</Box>
            <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
              {allVehicles.length === 0 
                ? 'No vehicles currently have this inventory item.' 
                : `${allVehicles.length} vehicle${allVehicles.length === 1 ? '' : 's'} have this item.`
              }
            </Box>
          </Box>

          <Box sx={{ position: 'relative' }}>
            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  onSort={table.onSort}
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
                    height={table.dense ? 56 : 56 + 20}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, allVehicles.length)}
                  />

                  <TableNoData notFound={allVehicles.length === 0 && !vehiclesLoading} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={allVehicles.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </Stack>
    </DashboardContent>
  );
}
