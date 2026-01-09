import type { IJobVehicleInventory, IEquipmentLeftAtSite } from 'src/types/timesheet';

import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Radio from '@mui/material/Radio';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type EquipmentItem = {
  vehicle_id: string;
  inventory_id: string;
  quantity: number;
  notes?: string;
  // For display purposes
  vehicle_type?: string;
  license_plate?: string;
  unit_number?: string;
  inventory_name?: string;
  sku?: string;
  cover_url?: string | null;
  inventory_type?: string;
  typical_application?: string | null;
  available_quantity?: number;
};

type Props = {
  timesheetId: string;
  jobVehiclesInventory: IJobVehicleInventory[];
  existingEquipmentLeft: IEquipmentLeftAtSite[];
  onSave: (equipment: EquipmentItem[]) => Promise<void>;
  isReadOnly: boolean;
  validationError?: string;
  onEquipmentLeftChange?: (value: 'yes' | 'no' | '') => void;
  onEquipmentChange?: (equipment: EquipmentItem[]) => void;
  onRefreshInventory?: () => Promise<any>;
};

export function TimesheetEquipmentLeftSection({
  timesheetId,
  jobVehiclesInventory,
  existingEquipmentLeft,
  onSave,
  isReadOnly,
  validationError,
  onEquipmentLeftChange,
  onEquipmentChange,
  onRefreshInventory,
}: Props) {
  const [hasEquipmentLeft, setHasEquipmentLeft] = useState<'yes' | 'no' | ''>(() => {
    // If there's existing equipment, default to 'yes', otherwise leave unselected ('')
    return existingEquipmentLeft.length > 0 ? 'yes' : '';
  });
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem[]>(() => {
    // Initialize from existing equipment left
    return existingEquipmentLeft.map((item) => {
      // Try to find the current available_quantity from job vehicles inventory
      const vehicle = jobVehiclesInventory.find((v) => v.vehicle_id === item.vehicle_id);
      const inventoryItem = vehicle?.inventory.find((inv) => inv.inventory_id === item.inventory_id);
      
      return {
        vehicle_id: item.vehicle_id,
        inventory_id: item.inventory_id,
        quantity: item.quantity,
        notes: item.notes || '',
        vehicle_type: item.vehicle_type,
        license_plate: item.license_plate,
        unit_number: item.unit_number,
        inventory_name: item.inventory_name,
        sku: item.sku,
        cover_url: item.cover_url,
        inventory_type: item.inventory_type,
        typical_application: item.typical_application,
        // Use current available_quantity if found, otherwise use the existing quantity as max
        available_quantity: inventoryItem?.available_quantity ?? item.quantity,
      };
    });
  });

  // Update state when existingEquipmentLeft changes (e.g., when data is fetched)
  useEffect(() => {
    if (existingEquipmentLeft.length > 0) {
      setHasEquipmentLeft('yes');
      onEquipmentLeftChange?.('yes');
      const equipmentItems = existingEquipmentLeft.map((item) => {
        const vehicle = jobVehiclesInventory.find((v) => v.vehicle_id === item.vehicle_id);
        const inventoryItem = vehicle?.inventory.find((inv) => inv.inventory_id === item.inventory_id);
        
        return {
          vehicle_id: item.vehicle_id,
          inventory_id: item.inventory_id,
          quantity: item.quantity,
          notes: item.notes || '',
          vehicle_type: item.vehicle_type,
          license_plate: item.license_plate,
          unit_number: item.unit_number,
          inventory_name: item.inventory_name,
          sku: item.sku,
          cover_url: item.cover_url,
          inventory_type: item.inventory_type,
          typical_application: item.typical_application,
          available_quantity: inventoryItem?.available_quantity ?? item.quantity,
        };
      });
      setSelectedEquipment(equipmentItems);
      onEquipmentChange?.(equipmentItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingEquipmentLeft, jobVehiclesInventory]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>([]);
  const [inventoryQuantities, setInventoryQuantities] = useState<Record<string, number>>({});
  const [inventorySearchQuery, setInventorySearchQuery] = useState<string>('');
  // Track selected items per vehicle to preserve selections when switching vehicles
  const [selectedItemsByVehicle, setSelectedItemsByVehicle] = useState<Record<string, { inventoryIds: string[]; quantities: Record<string, number> }>>({});
  // Track validation errors for quantity inputs (in cards - uses index)
  const [quantityErrors, setQuantityErrors] = useState<Record<number, string>>({});
  // Track validation errors for quantity inputs in dialog (uses inventory_id)
  const [dialogQuantityErrors, setDialogQuantityErrors] = useState<Record<string, string>>({});

  const handleRadioChange = useCallback((value: 'yes' | 'no') => {
    setHasEquipmentLeft(value);
    onEquipmentLeftChange?.(value);
    if (value === 'no') {
      setSelectedEquipment([]);
      onEquipmentChange?.([]);
    }
  }, [onEquipmentLeftChange, onEquipmentChange]);

  const handleOpenDialog = useCallback(async () => {
    // Refresh inventory data when opening dialog to ensure we have latest availability
    if (onRefreshInventory) {
      try {
        await onRefreshInventory();
      } catch (error) {
        console.error('Error refreshing inventory:', error);
        // Continue even if refresh fails
      }
    }
    
    // Only set default vehicle if there's exactly one vehicle
    let initialVehicleId = '';
    if (jobVehiclesInventory.length === 1) {
      initialVehicleId = jobVehiclesInventory[0].vehicle_id;
    }
    setSelectedVehicleId(initialVehicleId);
    // Always start fresh - don't restore old selections
    setSelectedInventoryIds([]);
    setInventoryQuantities({});
    setInventorySearchQuery('');
    setDialogQuantityErrors({});
    setDialogOpen(true);
  }, [jobVehiclesInventory, onRefreshInventory]);

  const handleCloseDialog = useCallback(() => {
    // Don't save selections when closing - only save when switching vehicles within the dialog
    setDialogOpen(false);
    setSelectedVehicleId('');
    setSelectedInventoryIds([]);
    setInventoryQuantities({});
    setInventorySearchQuery('');
    setDialogQuantityErrors({});
    // Clear all saved selections when closing the dialog
    setSelectedItemsByVehicle({});
  }, []);

  const handleAddEquipment = useCallback(() => {
    // Save current selections for the currently selected vehicle
    if (selectedVehicleId) {
      setSelectedItemsByVehicle((prev) => ({
        ...prev,
        [selectedVehicleId]: {
          inventoryIds: selectedInventoryIds,
          quantities: inventoryQuantities,
        },
      }));
    }

    // Build a combined selections map (including current UI state)
    const allVehiclesWithSelections = selectedVehicleId
      ? { ...selectedItemsByVehicle, [selectedVehicleId]: { inventoryIds: selectedInventoryIds, quantities: inventoryQuantities } }
      : selectedItemsByVehicle;

    // Validate availability before adding
    let hasInvalid = false;
    const newDialogErrors: Record<string, string> = {};
    Object.entries(allVehiclesWithSelections).forEach(([vehicleId, selections]) => {
      const vehicle = jobVehiclesInventory.find((v) => v.vehicle_id === vehicleId);
      if (!vehicle) return;
      selections.inventoryIds.forEach((inventoryId) => {
        const inv = vehicle.inventory.find((i) => i.inventory_id === inventoryId);
        const qty = selections.quantities[inventoryId] ?? 1;
        const available = inv?.available_quantity ?? 0;
        if (!inv || available <= 0 || qty > available) {
          hasInvalid = true;
          newDialogErrors[inventoryId] =
            available <= 0 ? 'Out of stock' : `Quantity cannot exceed available (${available})`;
        }
      });
    });
    if (hasInvalid) {
      setDialogQuantityErrors((prev) => ({ ...prev, ...newDialogErrors }));
      toast.error('Some selected items are out of stock or exceed available quantity.');
      return;
    }

    // Add items from ALL vehicles that have valid selections
    const allNewItems: EquipmentItem[] = [];
    Object.entries(allVehiclesWithSelections).forEach(([vehicleId, selections]) => {
      if (selections.inventoryIds.length === 0) return;
      const vehicle = jobVehiclesInventory.find((v) => v.vehicle_id === vehicleId);
      if (!vehicle) return;
      const vehicleItems: EquipmentItem[] = selections.inventoryIds.map((inventoryId) => {
        const inventoryItem = vehicle.inventory.find((inv) => inv.inventory_id === inventoryId);
        const qty = selections.quantities[inventoryId];
        const quantity = (typeof qty === 'number' && qty > 0) ? qty : 1;
        return {
          vehicle_id: vehicleId,
          inventory_id: inventoryId,
          quantity,
          notes: '',
          vehicle_type: vehicle.type,
          license_plate: vehicle.license_plate,
          unit_number: vehicle.unit_number,
          inventory_name: inventoryItem?.name || '',
          sku: inventoryItem?.sku || '',
          cover_url: inventoryItem?.cover_url,
          inventory_type: inventoryItem?.type || '',
          typical_application: inventoryItem?.typical_application,
          available_quantity: inventoryItem?.available_quantity || 0,
        };
      });
      allNewItems.push(...vehicleItems);
    });

    if (allNewItems.length === 0) return;

    const updatedEquipment = [...selectedEquipment, ...allNewItems];
    setSelectedEquipment(updatedEquipment);
    onEquipmentChange?.(updatedEquipment);
    
    // Clear all saved selections after adding
    setSelectedItemsByVehicle({});
    
    handleCloseDialog();
  }, [selectedEquipment, selectedVehicleId, selectedInventoryIds, inventoryQuantities, selectedItemsByVehicle, jobVehiclesInventory, handleCloseDialog, onEquipmentChange]);

  const handleRemoveEquipment = useCallback((index: number) => {
    const updatedEquipment = selectedEquipment.filter((_, i) => i !== index);
    setSelectedEquipment(updatedEquipment);
    onEquipmentChange?.(updatedEquipment);
  }, [selectedEquipment, onEquipmentChange]);

  const handleUpdateQuantity = useCallback((index: number, quantity: number) => {
    const item = selectedEquipment[index];
    if (!item) return;
    
    // Validate against available quantity
    const maxQuantity = item.available_quantity || 999;
    const validatedQuantity = Math.max(1, Math.min(quantity, maxQuantity));
    
    const updatedEquipment = selectedEquipment.map((eq, i) =>
      i === index ? { ...eq, quantity: validatedQuantity } : eq
    );
    setSelectedEquipment(updatedEquipment);
    onEquipmentChange?.(updatedEquipment);
  }, [selectedEquipment, onEquipmentChange]);


  const selectedVehicle = jobVehiclesInventory.find((v) => v.vehicle_id === selectedVehicleId);
  const allAvailableInventory = selectedVehicle?.inventory.filter(
    (inv) =>
      !selectedEquipment.some(
        (eq) => eq.vehicle_id === selectedVehicleId && eq.inventory_id === inv.inventory_id
      )
  ) || [];
  const availableInventory = allAvailableInventory.filter(
    (inv) =>
      inventorySearchQuery === '' ||
      inv.name.toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
      inv.sku.toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
      inv.type?.toLowerCase().includes(inventorySearchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }} data-equipment-left-section>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Equipment Left at Site
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Did you leave any equipment or inventory at the job site?
      </Typography>

      {/* Yes/No Radio Buttons */}
      <FormControl component="fieldset" required sx={{ mb: 3, display: 'block', width: '100%' }}>
        <RadioGroup
          row
          value={hasEquipmentLeft}
          onChange={(e) => handleRadioChange(e.target.value as 'yes' | 'no')}
        >
          <FormControlLabel
            value="yes"
            control={<Radio />}
            label="Yes"
            disabled={isReadOnly}
          />
          <FormControlLabel
            value="no"
            control={<Radio />}
            label="No"
            disabled={isReadOnly}
          />
        </RadioGroup>
        {validationError && (
          <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1 }}>
            {validationError}
          </Typography>
        )}
      </FormControl>

      {/* Equipment Selection Section */}
      {hasEquipmentLeft === 'yes' && (
        <Box sx={{ display: 'block', width: '100%' }}>
          {!isReadOnly && (
            <>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleOpenDialog}
                disabled={jobVehiclesInventory.length === 0}
                sx={{ 
                  mb: 2,
                  minHeight: { xs: 48, sm: 36.5 },
                  fontSize: { xs: '0.9375rem', sm: '0.875rem' },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Add Equipment
              </Button>
              {jobVehiclesInventory.length === 0 && (
                <Typography variant="body2" color="warning.main" sx={{ fontStyle: 'italic', mb: 2 }}>
                  No vehicles assigned to this job. Please assign vehicles to the job first.
                </Typography>
              )}
            </>
          )}

          {isReadOnly && jobVehiclesInventory.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
              No vehicles assigned to this job.
            </Typography>
          )}

          {/* Selected Equipment List */}
          {selectedEquipment.length > 0 && (
            <Stack spacing={2}>
              {selectedEquipment.map((item, index) => (
                <Card key={index} sx={{ p: 2, border: '1px solid', borderColor: 'divider', overflow: 'visible' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                    {/* Equipment Image */}
                    {item.cover_url ? (
                      <Avatar
                        src={item.cover_url}
                        variant="rounded"
                        sx={{ width: { xs: 50, sm: 60 }, height: { xs: 50, sm: 60 }, flexShrink: 0 }}
                      />
                    ) : (
                      <Avatar variant="rounded" sx={{ width: { xs: 50, sm: 60 }, height: { xs: 50, sm: 60 }, flexShrink: 0 }}>
                        <Iconify icon="solar:box-bold" width={32} />
                      </Avatar>
                    )}

                    {/* Equipment Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                        {item.inventory_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, wordBreak: 'break-word' }}>
                        SKU: {item.sku} • Type: {item.inventory_type ? item.inventory_type.charAt(0).toUpperCase() + item.inventory_type.slice(1) : ''}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip
                          label={(() => {
                            const vehicle = jobVehiclesInventory.find((v) => v.vehicle_id === item.vehicle_id);
                            const operatorName = vehicle?.operator_first_name && vehicle?.operator_last_name 
                              ? `${vehicle.operator_first_name} ${vehicle.operator_last_name}`
                              : '';
                            return `Vehicle: ${item.license_plate}${operatorName ? ` (${operatorName})` : ''}`;
                          })()}
                          size="small"
                          variant="soft"
                          color="info"
                        />
                        {item.typical_application && (
                          <Chip
                            label={item.typical_application}
                            size="small"
                            variant="soft"
                            color="default"
                          />
                        )}
                      </Stack>

                      {/* Available and Quantity */}
                      {item.available_quantity && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: { xs: 1, sm: 0 } }}>
                          Available: {item.available_quantity}
                        </Typography>
                      )}
                      <Box sx={{ display: { xs: 'block', sm: 'flex' }, gap: { sm: 2 }, alignItems: { sm: 'center' }, mb: 1 }}>
                        <TextField
                          type="number"
                          label="Quantity"
                          size="small"
                          value={item.quantity === 0 ? '' : item.quantity}
                          error={!!quantityErrors[index]}
                          helperText={quantityErrors[index]}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Clear error when user starts typing
                            setQuantityErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors[index];
                              return newErrors;
                            });
                            
                            // Allow empty string for deletion - store as 0 temporarily
                            if (inputValue === '') {
                              const updatedEquipment = selectedEquipment.map((eq, i) =>
                                i === index ? { ...eq, quantity: 0 } : eq
                              );
                              setSelectedEquipment(updatedEquipment);
                              return;
                            }
                            const numValue = parseInt(inputValue, 10);
                            if (!isNaN(numValue) && numValue >= 0) {
                              // Allow typing any number - show error if exceeds available
                              const updatedEquipment = selectedEquipment.map((eq, i) =>
                                i === index ? { ...eq, quantity: numValue } : eq
                              );
                              setSelectedEquipment(updatedEquipment);
                              
                              // Check if exceeds available quantity and show error
                              if (item.available_quantity && numValue > item.available_quantity) {
                                setQuantityErrors((prev) => ({
                                  ...prev,
                                  [index]: `Quantity cannot exceed available quantity (${item.available_quantity})`,
                                }));
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const inputValue = e.target.value;
                            const value = inputValue === '' ? 0 : parseInt(inputValue, 10);
                            
                            // Clear error
                            setQuantityErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors[index];
                              return newErrors;
                            });
                            
                            // Validate and set proper value
                            if (isNaN(value) || value < 1) {
                              handleUpdateQuantity(index, 1);
                            } else if (item.available_quantity && value > item.available_quantity) {
                              // Cap to available quantity on blur
                              handleUpdateQuantity(index, item.available_quantity);
                            } else {
                              // Valid value - ensure it's saved via handleUpdateQuantity
                              handleUpdateQuantity(index, value);
                            }
                          }}
                          disabled={isReadOnly}
                          inputProps={{ min: 1, max: item.available_quantity || 999 }}
                          sx={{ width: { xs: '100%', sm: 120 }, mt: { xs: 1, sm: 2 } }}
                        />
                      </Box>

                    </Box>

                    {/* Remove Button */}
                    {!isReadOnly && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveEquipment(index)}
                        sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'flex-start' } }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    )}
                  </Box>
                </Card>
              ))}
            </Stack>
          )}

          {selectedEquipment.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No equipment selected yet. Click "Add Equipment" to select items.
            </Typography>
          )}
        </Box>
      )}


      {/* Add Equipment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add Equipment Left at Site</DialogTitle>
        <DialogContent>
          {/* Vehicle Selection */}
          <FormControl fullWidth sx={{ mb: 3, mt: 1 }}>
            <InputLabel>Select Vehicle</InputLabel>
            <Select
              value={selectedVehicleId}
              onChange={(e) => {
                const newVehicleId = e.target.value;
                // Save current selections for the previous vehicle
                if (selectedVehicleId) {
                  setSelectedItemsByVehicle((prev) => ({
                    ...prev,
                    [selectedVehicleId]: {
                      inventoryIds: selectedInventoryIds,
                      quantities: inventoryQuantities,
                    },
                  }));
                }
                // Restore selections for the new vehicle (if any)
                const savedSelections = selectedItemsByVehicle[newVehicleId];
                setSelectedVehicleId(newVehicleId);
                setSelectedInventoryIds(savedSelections?.inventoryIds || []);
                setInventoryQuantities(savedSelections?.quantities || {});
              }}
              label="Select Vehicle"
            >
              {jobVehiclesInventory.map((vehicle) => {
                const typeDisplay = vehicle.type === 'highway_truck' ? 'HWY' : vehicle.type === 'lane_closure_truck' ? 'LCT' : vehicle.type;
                const operatorName = vehicle.operator_first_name && vehicle.operator_last_name 
                  ? `${vehicle.operator_first_name} ${vehicle.operator_last_name}`
                  : '';
                
                return (
                  <MenuItem key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                    {typeDisplay} - {vehicle.license_plate} {vehicle.unit_number} {operatorName && `(${operatorName})`}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Inventory Selection */}
          {selectedVehicleId && allAvailableInventory.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Select Equipment/Inventory Items:
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, SKU, or type..."
                value={inventorySearchQuery}
                onChange={(e) => setInventorySearchQuery(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
              {availableInventory.length > 0 ? (
                <Stack spacing={1}>
                {availableInventory.map((inv) => (
                  <Box
                    key={inv.inventory_id}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: selectedInventoryIds.includes(inv.inventory_id)
                        ? 'primary.main'
                        : 'divider',
                      borderRadius: 1,
                      cursor: (inv.available_quantity ?? 0) <= 0 ? 'not-allowed' : 'pointer',
                      opacity: (inv.available_quantity ?? 0) <= 0 ? 0.6 : 1,
                      bgcolor: selectedInventoryIds.includes(inv.inventory_id)
                        ? 'action.selected'
                        : 'transparent',
                      '&:hover': {
                        bgcolor: (inv.available_quantity ?? 0) <= 0 ? 'transparent' : 'action.hover',
                      },
                    }}
                    onClick={(e) => {
                      // Don't toggle if clicking on the quantity field
                      if ((e.target as HTMLElement).closest('.quantity-field')) {
                        return;
                      }
                      // Prevent selecting out-of-stock items
                      if ((inv.available_quantity ?? 0) <= 0) {
                        return;
                      }
                      setSelectedInventoryIds((prev) => {
                        const isSelected = prev.includes(inv.inventory_id);
                        if (isSelected) {
                          // Remove from quantities when unchecked
                          setInventoryQuantities((prevQty) => {
                            const newQty = { ...prevQty };
                            delete newQty[inv.inventory_id];
                            return newQty;
                          });
                          return prev.filter((id) => id !== inv.inventory_id);
                        } else {
                          // Set default quantity when checked
                          setInventoryQuantities((prevQty) => ({
                            ...prevQty,
                            [inv.inventory_id]: 1,
                          }));
                          return [...prev, inv.inventory_id];
                        }
                      });
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Checkbox
                        checked={selectedInventoryIds.includes(inv.inventory_id)}
                        onChange={() => {}}
                        disabled={(inv.available_quantity ?? 0) <= 0}
                      />
                      {inv.cover_url ? (
                        <Avatar src={inv.cover_url} variant="rounded" sx={{ width: 48, height: 48 }} />
                      ) : (
                        <Avatar variant="rounded" sx={{ width: 48, height: 48 }}>
                          <Iconify icon="solar:box-bold" width={24} />
                        </Avatar>
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">{inv.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          SKU: {inv.sku} • Available: {inv.available_quantity}
                        </Typography>
                        {(inv.available_quantity ?? 0) <= 0 && (
                          <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                            Out of stock
                          </Typography>
                        )}
                        {selectedInventoryIds.includes(inv.inventory_id) && (
                          <Box sx={{ mt: 2, display: { xs: 'block', sm: 'none' } }}>
                            <TextField
                              className="quantity-field"
                              type="number"
                              label="Qty"
                              value={inventoryQuantities[inv.inventory_id] === 0 ? '' : (inventoryQuantities[inv.inventory_id] ?? 1)}
                              error={!!dialogQuantityErrors[inv.inventory_id]}
                              helperText={dialogQuantityErrors[inv.inventory_id]}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                // Clear error when user starts typing
                                setDialogQuantityErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors[inv.inventory_id];
                                  return newErrors;
                                });
                                
                                // Allow empty string for deletion
                                if (inputValue === '') {
                                  setInventoryQuantities((prev) => ({
                                    ...prev,
                                    [inv.inventory_id]: 0,
                                  }));
                                  return;
                                }
                                const numValue = Number(inputValue);
                                if (!isNaN(numValue) && numValue >= 0) {
                                  setInventoryQuantities((prev) => ({
                                    ...prev,
                                    [inv.inventory_id]: numValue,
                                  }));
                                  
                                  // Check if exceeds available quantity and show error
                                  if (inv.available_quantity && numValue > inv.available_quantity) {
                                    setDialogQuantityErrors((prev) => ({
                                      ...prev,
                                      [inv.inventory_id]: `Quantity cannot exceed available quantity (${inv.available_quantity})`,
                                    }));
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const inputValue = e.target.value;
                                const value = inputValue === '' ? 0 : Number(inputValue);
                                
                                // Clear error
                                setDialogQuantityErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors[inv.inventory_id];
                                  return newErrors;
                                });
                                
                                // Validate and enforce min/max on blur
                                if (isNaN(value) || value < 1) {
                                  setInventoryQuantities((prev) => ({
                                    ...prev,
                                    [inv.inventory_id]: 1,
                                  }));
                                } else if (value > inv.available_quantity) {
                                  setInventoryQuantities((prev) => ({
                                    ...prev,
                                    [inv.inventory_id]: inv.available_quantity,
                                  }));
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              inputProps={{
                                min: 1,
                                max: inv.available_quantity,
                              }}
                              sx={{ width: { xs: '100%', sm: 120 } }}
                              size="small"
                            />
                          </Box>
                        )}
                      </Box>
                      {selectedInventoryIds.includes(inv.inventory_id) && (
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                          <TextField
                            className="quantity-field"
                            type="number"
                            label="Qty"
                            value={inventoryQuantities[inv.inventory_id] === 0 ? '' : (inventoryQuantities[inv.inventory_id] ?? 1)}
                            error={!!dialogQuantityErrors[inv.inventory_id]}
                            helperText={dialogQuantityErrors[inv.inventory_id]}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              // Clear error when user starts typing
                              setDialogQuantityErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors[inv.inventory_id];
                                return newErrors;
                              });
                              
                              // Allow empty string for deletion
                              if (inputValue === '') {
                                setInventoryQuantities((prev) => ({
                                  ...prev,
                                  [inv.inventory_id]: 0,
                                }));
                                return;
                              }
                              const numValue = Number(inputValue);
                              if (!isNaN(numValue) && numValue >= 0) {
                                setInventoryQuantities((prev) => ({
                                  ...prev,
                                  [inv.inventory_id]: numValue,
                                }));
                                
                                // Check if exceeds available quantity and show error
                                if (inv.available_quantity && numValue > inv.available_quantity) {
                                  setDialogQuantityErrors((prev) => ({
                                    ...prev,
                                    [inv.inventory_id]: `Quantity cannot exceed available quantity (${inv.available_quantity})`,
                                  }));
                                }
                              }
                            }}
                            onBlur={(e) => {
                              const inputValue = e.target.value;
                              const value = inputValue === '' ? 0 : Number(inputValue);
                              
                              // Clear error
                              setDialogQuantityErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors[inv.inventory_id];
                                return newErrors;
                              });
                              
                              // Validate and enforce min/max on blur
                              if (isNaN(value) || value < 1) {
                                setInventoryQuantities((prev) => ({
                                  ...prev,
                                  [inv.inventory_id]: 1,
                                }));
                              } else if (value > inv.available_quantity) {
                                setInventoryQuantities((prev) => ({
                                  ...prev,
                                  [inv.inventory_id]: inv.available_quantity,
                                }));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            inputProps={{
                              min: 1,
                              max: inv.available_quantity,
                            }}
                            sx={{ width: 80 }}
                            size="small"
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                  {inventorySearchQuery ? 'No items match your search.' : 'No available inventory items in this vehicle, or all items have already been added.'}
                </Typography>
              )}
            </>
          )}

          {selectedVehicleId && allAvailableInventory.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No available inventory items in this vehicle, or all items have already been added.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            size="large"
            fullWidth
            sx={{ 
              flex: 1,
              minHeight: { xs: 48, sm: 36 }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddEquipment}
            disabled={(() => {
              // Check if there are any selections across all vehicles
              const totalSelections = Object.values(selectedItemsByVehicle).reduce((sum, selections) => sum + selections.inventoryIds.length, 0);
              const currentSelections = selectedInventoryIds.length;
              return totalSelections === 0 && currentSelections === 0;
            })()}
            size="large"
            fullWidth
            sx={{ 
              flex: 1,
              minHeight: { xs: 48, sm: 36 }
            }}
          >
            Add Selected Items ({(() => {
              // Count total selections across all vehicles (including current)
              const totalSelections = Object.values(selectedItemsByVehicle).reduce((sum, selections) => sum + selections.inventoryIds.length, 0);
              const currentSelections = selectedInventoryIds.length;
              // Don't double count current vehicle if it's already saved in selectedItemsByVehicle
              const currentVehicleSaved = selectedVehicleId && selectedItemsByVehicle[selectedVehicleId];
              return currentVehicleSaved ? totalSelections : totalSelections + currentSelections;
            })()})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

