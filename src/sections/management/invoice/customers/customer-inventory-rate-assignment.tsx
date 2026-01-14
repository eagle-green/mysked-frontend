import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface CustomerInventoryRate {
  id: string;
  customer_id: string;
  inventory_id: string;
  unit_price: number;
  qbo_item_id: string | null;
  inventory_name: string;
  inventory_type: string;
  cover_url: string | null;
  qbo_item_name: string | null;
  created_at: string;
  updated_at: string;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  type: string;
  cover_url: string | null;
  billable: boolean;
}

interface QBOItem {
  id: string;
  name: string;
  category: string | null;
  type: string | null;
  price: number | null;
  qbo_item_id: string | null;
}

interface Props {
  customerId: string;
  rates: CustomerInventoryRate[];
  onRateSaved?: () => void;
}

// ----------------------------------------------------------------------

export function CustomerInventoryRateAssignment({ customerId, rates, onRateSaved }: Props) {
  const queryClient = useQueryClient();
  const [editingRate, setEditingRate] = useState<CustomerInventoryRate | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);
  const [selectedQBOItem, setSelectedQBOItem] = useState<QBOItem | null>(null);
  const confirmDeleteDialog = useBoolean();
  const [rateToDelete, setRateToDelete] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuRateId, setMenuRateId] = useState<string | null>(null);

  // Fetch billable inventory items
  const { data: inventoryResponse, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['billable-inventory'],
    queryFn: () =>
      fetcher([
        endpoints.management.inventory || '/api/inventory',
        {
          params: {
            page: 1,
            rowsPerPage: 1000,
            status: 'active',
          },
        },
      ]),
  });

  // Fetch QBO services/items for autocomplete
  const { data: qboServicesResponse, isLoading: isLoadingQBOServices } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: () =>
      fetcher([
        endpoints.invoice.services,
        {
          params: {
            page: 1,
            rowsPerPage: 1000,
            status: 'active',
          },
        },
      ]),
  });

  const allInventory = useMemo(() => {
    const inventory = (inventoryResponse?.data?.inventory as InventoryItem[]) || [];
    return inventory.filter((item) => item.billable === true);
  }, [inventoryResponse?.data?.inventory]);

  const qboItems = useMemo(() => {
    const allItems = (qboServicesResponse?.data as QBOItem[]) || [];
    // Return all items (inventory, service, non-inventory, etc.)
    return allItems;
  }, [qboServicesResponse?.data]);

  // Get inventory items that don't have rates yet
  const availableInventory = useMemo(() => {
    const rateInventoryIds = new Set(rates.map((rate) => rate.inventory_id));
    return allInventory.filter((item) => !rateInventoryIds.has(item.id));
  }, [allInventory, rates]);

  // Mutation to upsert rate
  const upsertMutation = useMutation({
    mutationFn: async ({ inventoryId, unitPrice: price, qboItemId: qboId }: { inventoryId: string; unitPrice: number; qboItemId?: string | null }) => fetcher([
        endpoints.invoice.customerInventoryRates(customerId),
        {
          method: 'POST',
          data: {
            inventory_id: inventoryId,
            unit_price: price,
            qbo_item_id: qboId || null,
          },
        },
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerInventoryRates', customerId] });
      toast.success('Inventory rate saved successfully');
      setEditingRate(null);
      setAddingNew(false);
      setSelectedInventory(null);
      setSelectedQBOItem(null);
      onRateSaved?.();
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Failed to save inventory rate');
    },
  });

  // Mutation to delete rate
  const deleteMutation = useMutation({
    mutationFn: async (rateId: string) => fetcher([
        endpoints.invoice.customerInventoryRates(customerId) + `/${rateId}`,
        {
          method: 'DELETE',
        },
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerInventoryRates', customerId] });
      toast.success('Inventory rate deleted successfully');
      confirmDeleteDialog.onFalse();
      setRateToDelete(null);
      onRateSaved?.();
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Failed to delete inventory rate');
    },
  });

  const handleEdit = useCallback((rate: CustomerInventoryRate) => {
    setEditingRate(rate);
    const inventory = allInventory.find((item) => item.id === rate.inventory_id);
    setSelectedInventory(inventory || null);
    
    // Find the QBO item if qbo_item_id exists
    if (rate.qbo_item_id) {
      const qboItem = qboItems.find((item) => item.qbo_item_id === rate.qbo_item_id);
      setSelectedQBOItem(qboItem || null);
    } else {
      setSelectedQBOItem(null);
    }
  }, [allInventory, qboItems]);

  const handleAddNew = useCallback(() => {
    setAddingNew(true);
    setEditingRate(null);
    setSelectedInventory(null);
    setSelectedQBOItem(null);
  }, []);

  const handleCancel = useCallback(() => {
    setEditingRate(null);
    setAddingNew(false);
    setSelectedInventory(null);
    setSelectedQBOItem(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedInventory) {
      toast.error('Please select an inventory item');
      return;
    }

    if (!selectedQBOItem) {
      toast.error('Please select a QuickBooks Online Item');
      return;
    }

    if (selectedQBOItem.price === null || selectedQBOItem.price === undefined) {
      toast.error('Selected QBO item does not have a price');
      return;
    }

    upsertMutation.mutate({
      inventoryId: selectedInventory.id,
      unitPrice: selectedQBOItem.price,
      qboItemId: selectedQBOItem.qbo_item_id || null,
    });
  }, [selectedInventory, selectedQBOItem, upsertMutation]);

  const handleCloseMenu = useCallback(() => {
    setMenuAnchor(null);
    setMenuRateId(null);
  }, []);

  const handleOpenMenu = useCallback((event: React.MouseEvent<HTMLElement>, rateId: string) => {
    setMenuAnchor(event.currentTarget);
    setMenuRateId(rateId);
  }, []);

  const handleMenuEdit = useCallback(() => {
    if (menuRateId) {
      const rate = rates.find((r) => r.id === menuRateId);
      if (rate) {
        handleEdit(rate);
      }
    }
    handleCloseMenu();
  }, [menuRateId, rates, handleEdit, handleCloseMenu]);

  const handleMenuDelete = useCallback(() => {
    if (menuRateId) {
      setRateToDelete(menuRateId);
      confirmDeleteDialog.onTrue();
    }
    handleCloseMenu();
  }, [menuRateId, confirmDeleteDialog, handleCloseMenu]);

  const handleConfirmDelete = useCallback(() => {
    if (rateToDelete) {
      deleteMutation.mutate(rateToDelete);
    }
  }, [rateToDelete, deleteMutation]);

  const isDialogOpen = editingRate !== null || addingNew;
  const dialogTitle = editingRate ? 'Edit Inventory Rate' : 'Add Inventory Rate';

  return (
    <>
      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Billable Items</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleAddNew}
            disabled={availableInventory.length === 0}
          >
            Add Item
          </Button>
        </Box>

        {rates.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No billable items configured for this customer.
              {availableInventory.length > 0 && ' Click "Add Item" to set pricing.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>QBO Item</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell width={100} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={rate.cover_url || undefined}
                          variant="rounded"
                          sx={{ width: 40, height: 40 }}
                        >
                          <Iconify icon="solar:inbox-bold" width={24} />
                        </Avatar>
                        <Typography variant="subtitle2">{rate.inventory_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {rate.inventory_type
                          ? rate.inventory_type.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {rate.qbo_item_name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">{fCurrency(rate.unit_price)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, rate.id)}
                        color={menuAnchor && menuRateId === rate.id ? 'inherit' : 'default'}
                      >
                        <Iconify icon="eva:more-vertical-fill" width={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Actions Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleMenuEdit}>
            <Iconify icon="solar:pen-bold" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleMenuDelete} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Autocomplete
              options={addingNew ? availableInventory : allInventory}
              getOptionLabel={(option) => `${option.name}${option.sku ? ` (${option.sku})` : ''}`}
              value={selectedInventory}
              onChange={(_, newValue) => setSelectedInventory(newValue)}
              disabled={!!editingRate}
              loading={isLoadingInventory}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Inventory Item"
                  required
                  helperText={editingRate ? 'Cannot change inventory item for existing rate' : 'Select a billable inventory item'}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src={option.cover_url || undefined}
                    variant="rounded"
                    sx={{ width: 32, height: 32 }}
                  >
                    <Iconify icon="solar:inbox-bold" width={20} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    {option.sku && (
                      <Typography variant="caption" color="text.secondary">
                        SKU: {option.sku}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            />

            <Autocomplete
              fullWidth
              options={qboItems}
              value={selectedQBOItem}
              onChange={(event, newValue) => setSelectedQBOItem(newValue)}
              loading={isLoadingQBOServices}
              getOptionLabel={(option) => 
                // Always return just the item name (no category prefix)
                 option.name || ''
              }
              filterOptions={(options, { inputValue }) => {
                if (!inputValue || inputValue.trim() === '') {
                  return options;
                }
                const searchTerm = inputValue.toLowerCase().trim();
                return options.filter((option) => {
                  const nameMatch = option.name?.toLowerCase().includes(searchTerm);
                  const categoryMatch = option.category?.toLowerCase().includes(searchTerm);
                  return nameMatch || categoryMatch;
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="QuickBooks Online Item"
                  placeholder="Search by name or category..."
                  required
                  helperText="Select a QBO inventory item for syncing"
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.category || '-'}
                      </Typography>
                    </Box>
                    {option.price !== null && option.price !== undefined && (
                      <Typography variant="body2" sx={{ ml: 2, fontWeight: 'fontWeightMedium' }}>
                        {fCurrency(option.price)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return false;
                // Match by qbo_item_id if available, otherwise by id
                if (option.qbo_item_id && value.qbo_item_id) {
                  return option.qbo_item_id === value.qbo_item_id;
                }
                return option.id === value.id;
              }}
            />

            {selectedQBOItem && selectedQBOItem.price !== null && selectedQBOItem.price !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Price:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 'fontWeightMedium' }}>
                  {fCurrency(selectedQBOItem.price)}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!selectedInventory || !selectedQBOItem || (selectedQBOItem?.price === null || selectedQBOItem?.price === undefined) || upsertMutation.isPending}
            startIcon={upsertMutation.isPending ? <CircularProgress size={16} /> : null}
          >
            {upsertMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialog.value} onClose={confirmDeleteDialog.onFalse}>
        <DialogTitle>Delete Inventory Rate</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this inventory rate? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmDeleteDialog.onFalse}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={16} /> : null}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
