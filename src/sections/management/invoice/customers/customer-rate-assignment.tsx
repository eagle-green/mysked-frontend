import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';

import axiosInstance, { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface CustomerRate {
  id: string;
  customer_id: string;
  position: string;
  service_id: string;
  service_name: string;
  qbo_item_id: string | null;
  service_type: string;
  service_category: string | null;
  service_price: number | null;
  // Weekday rates
  weekday_regular_service_id: string | null;
  weekday_regular_service_name: string | null;
  weekday_regular_service_category: string | null;
  weekday_regular_service_price: number | null;
  weekday_overtime_service_id: string | null;
  weekday_overtime_service_name: string | null;
  weekday_overtime_service_category: string | null;
  weekday_overtime_service_price: number | null;
  weekday_double_time_service_id: string | null;
  weekday_double_time_service_name: string | null;
  weekday_double_time_service_category: string | null;
  weekday_double_time_service_price: number | null;
  // Saturday rates
  saturday_overtime_service_id: string | null;
  saturday_overtime_service_name: string | null;
  saturday_overtime_service_category: string | null;
  saturday_overtime_service_price: number | null;
  saturday_double_time_service_id: string | null;
  saturday_double_time_service_name: string | null;
  saturday_double_time_service_category: string | null;
  saturday_double_time_service_price: number | null;
  // Sunday & Holiday rates
  sunday_holiday_double_time_service_id: string | null;
  sunday_holiday_double_time_service_name: string | null;
  sunday_holiday_double_time_service_category: string | null;
  sunday_holiday_double_time_service_price: number | null;
  // Mobilization
  mobilization_service_id: string | null;
  mobilization_service_name: string | null;
  mobilization_service_category: string | null;
  mobilization_service_price: number | null;
  created_at: string;
  updated_at: string;
}

interface ServiceItem {
  id: string;
  name: string;
  type: string;
  category: string | null;
  price: number | null;
  qbo_item_id: string | null;
}

interface Props {
  customerId: string;
  rates: CustomerRate[];
  missingRateTypes?: Array<{ position: string; rateType: string }>;
  onRateSaved?: () => void;
}

const POSITIONS = ['LCT', 'TCP', 'HWY', 'Field Supervisor'] as const;

// ----------------------------------------------------------------------

export function CustomerRateAssignment({ customerId, rates, missingRateTypes = [], onRateSaved }: Props) {
  const queryClient = useQueryClient();
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  // Weekday rates
  const [selectedWeekdayRegularService, setSelectedWeekdayRegularService] = useState<ServiceItem | null>(null);
  const [selectedWeekdayOvertimeService, setSelectedWeekdayOvertimeService] = useState<ServiceItem | null>(null);
  const [selectedWeekdayDoubleTimeService, setSelectedWeekdayDoubleTimeService] = useState<ServiceItem | null>(null);
  // Saturday rates
  const [selectedSaturdayOvertimeService, setSelectedSaturdayOvertimeService] = useState<ServiceItem | null>(null);
  const [selectedSaturdayDoubleTimeService, setSelectedSaturdayDoubleTimeService] = useState<ServiceItem | null>(null);
  // Sunday & Holiday rates
  const [selectedSundayHolidayDoubleTimeService, setSelectedSundayHolidayDoubleTimeService] = useState<ServiceItem | null>(null);
  // Mobilization
  const [selectedMobilizationService, setSelectedMobilizationService] = useState<ServiceItem | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<string | null>(null);
  const confirmDeleteDialog = useBoolean();

  // Fetch services list
  const { data: servicesResponse } = useQuery({
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

  const services = useMemo(() => (servicesResponse?.data as ServiceItem[]) || [], [servicesResponse?.data]);

  // Mutation to upsert rate
  const upsertMutation = useMutation({
    mutationFn: async ({ 
      position, 
      weekdayRegularServiceId,
      weekdayOvertimeServiceId,
      weekdayDoubleTimeServiceId,
      saturdayOvertimeServiceId,
      saturdayDoubleTimeServiceId,
      sundayHolidayDoubleTimeServiceId,
      mobilizationServiceId,
    }: { 
      position: string; 
      weekdayRegularServiceId?: string | null;
      weekdayOvertimeServiceId?: string | null;
      weekdayDoubleTimeServiceId?: string | null;
      saturdayOvertimeServiceId?: string | null;
      saturdayDoubleTimeServiceId?: string | null;
      sundayHolidayDoubleTimeServiceId?: string | null;
      mobilizationServiceId?: string | null;
    }) => {
      const response = await axiosInstance.post(endpoints.invoice.customerRates(customerId), {
        position,
        weekday_regular_service_id: weekdayRegularServiceId || null,
        weekday_overtime_service_id: weekdayOvertimeServiceId || null,
        weekday_double_time_service_id: weekdayDoubleTimeServiceId || null,
        saturday_overtime_service_id: saturdayOvertimeServiceId || null,
        saturday_double_time_service_id: saturdayDoubleTimeServiceId || null,
        sunday_holiday_double_time_service_id: sundayHolidayDoubleTimeServiceId || null,
        mobilization_service_id: mobilizationServiceId || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerRates', customerId] });
      toast.success('Rate assigned successfully');
      setEditingPosition(null);
      setSelectedWeekdayRegularService(null);
      setSelectedWeekdayOvertimeService(null);
      setSelectedWeekdayDoubleTimeService(null);
      setSelectedSaturdayOvertimeService(null);
      setSelectedSaturdayDoubleTimeService(null);
      setSelectedSundayHolidayDoubleTimeService(null);
      setSelectedMobilizationService(null);
      // Trigger refetch in parent component
      if (onRateSaved) {
        onRateSaved();
      }
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Failed to assign rate');
    },
  });

  // Mutation to delete rate
  const deleteMutation = useMutation({
    mutationFn: async (position: string) => {
      const response = await axiosInstance.delete(
        `${endpoints.invoice.customerRates(customerId)}/${position}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerRates', customerId] });
      toast.success('Rate removed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Failed to remove rate');
    },
  });

  const handleEdit = useCallback((position: string) => {
    const existingRate = rates.find((r) => r.position === position);
    if (existingRate) {
      // Weekday regular service (use weekday_regular_service_id or fall back to service_id)
      const weekdayRegularServiceId = existingRate.weekday_regular_service_id || existingRate.service_id;
      const weekdayRegularService = services.find((s) => s.id === weekdayRegularServiceId);
      setSelectedWeekdayRegularService(weekdayRegularService || null);
      
      // Weekday overtime
      if (existingRate.weekday_overtime_service_id) {
        const weekdayOvertimeService = services.find((s) => s.id === existingRate.weekday_overtime_service_id);
        setSelectedWeekdayOvertimeService(weekdayOvertimeService || null);
      } else {
        setSelectedWeekdayOvertimeService(null);
      }

      // Weekday double time
      if (existingRate.weekday_double_time_service_id) {
        const weekdayDoubleTimeService = services.find((s) => s.id === existingRate.weekday_double_time_service_id);
        setSelectedWeekdayDoubleTimeService(weekdayDoubleTimeService || null);
      } else {
        setSelectedWeekdayDoubleTimeService(null);
      }

      // Saturday overtime
      if (existingRate.saturday_overtime_service_id) {
        const saturdayOvertimeService = services.find((s) => s.id === existingRate.saturday_overtime_service_id);
        setSelectedSaturdayOvertimeService(saturdayOvertimeService || null);
      } else {
        setSelectedSaturdayOvertimeService(null);
      }

      // Saturday double time
      if (existingRate.saturday_double_time_service_id) {
        const saturdayDoubleTimeService = services.find((s) => s.id === existingRate.saturday_double_time_service_id);
        setSelectedSaturdayDoubleTimeService(saturdayDoubleTimeService || null);
      } else {
        setSelectedSaturdayDoubleTimeService(null);
      }

      // Sunday/Holiday double time
      if (existingRate.sunday_holiday_double_time_service_id) {
        const sundayHolidayDoubleTimeService = services.find((s) => s.id === existingRate.sunday_holiday_double_time_service_id);
        setSelectedSundayHolidayDoubleTimeService(sundayHolidayDoubleTimeService || null);
      } else {
        setSelectedSundayHolidayDoubleTimeService(null);
      }

      // Mobilization
      if (existingRate.mobilization_service_id) {
        const mobilizationService = services.find((s) => s.id === existingRate.mobilization_service_id);
        setSelectedMobilizationService(mobilizationService || null);
      } else {
        setSelectedMobilizationService(null);
      }
    } else {
      setSelectedWeekdayRegularService(null);
      setSelectedWeekdayOvertimeService(null);
      setSelectedWeekdayDoubleTimeService(null);
      setSelectedSaturdayOvertimeService(null);
      setSelectedSaturdayDoubleTimeService(null);
      setSelectedSundayHolidayDoubleTimeService(null);
      setSelectedMobilizationService(null);
    }
    setEditingPosition(position);
  }, [rates, services]);

  const handleCancel = useCallback(() => {
    setEditingPosition(null);
    setSelectedWeekdayRegularService(null);
    setSelectedWeekdayOvertimeService(null);
    setSelectedWeekdayDoubleTimeService(null);
    setSelectedSaturdayOvertimeService(null);
    setSelectedSaturdayDoubleTimeService(null);
    setSelectedSundayHolidayDoubleTimeService(null);
    setSelectedMobilizationService(null);
  }, []);

  const handleSave = useCallback(
    (position: string) => {
      upsertMutation.mutate({
        position,
        weekdayRegularServiceId: selectedWeekdayRegularService?.id || null,
        weekdayOvertimeServiceId: selectedWeekdayOvertimeService?.id || null,
        weekdayDoubleTimeServiceId: selectedWeekdayDoubleTimeService?.id || null,
        saturdayOvertimeServiceId: selectedSaturdayOvertimeService?.id || null,
        saturdayDoubleTimeServiceId: selectedSaturdayDoubleTimeService?.id || null,
        sundayHolidayDoubleTimeServiceId: selectedSundayHolidayDoubleTimeService?.id || null,
        mobilizationServiceId: selectedMobilizationService?.id || null,
      });
    },
    [
      selectedWeekdayRegularService,
      selectedWeekdayOvertimeService,
      selectedWeekdayDoubleTimeService,
      selectedSaturdayOvertimeService,
      selectedSaturdayDoubleTimeService,
      selectedSundayHolidayDoubleTimeService,
      selectedMobilizationService,
      upsertMutation
    ]
  );

  const handleDeleteClick = useCallback(
    (position: string) => {
      setPositionToDelete(position);
      confirmDeleteDialog.onTrue();
    },
    [confirmDeleteDialog]
  );

  const handleConfirmDelete = useCallback(() => {
    if (positionToDelete) {
      deleteMutation.mutate(positionToDelete);
      confirmDeleteDialog.onFalse();
      setPositionToDelete(null);
    }
  }, [positionToDelete, deleteMutation, confirmDeleteDialog]);

  const getRateForPosition = (position: string) => rates.find((r) => r.position === position);

  // Helper function to normalize position for comparison
  const normalizePosition = (pos: string): string => pos.toUpperCase().replace(/\s+/g, '_');

  // Helper function to check if a rate field should have a red border
  const isRateFieldMissing = (position: string, rateType: string): boolean => {
    const normalizedPos = normalizePosition(position);
    // Check if this specific rate type is missing
    const hasSpecificMissing = missingRateTypes.some(
      (m) => normalizePosition(m.position) === normalizedPos && m.rateType === rateType
    );
    if (hasSpecificMissing) return true;
    
    // If position_missing is present (no rates at all), highlight all rate fields
    const hasPositionMissing = missingRateTypes.some(
      (m) => normalizePosition(m.position) === normalizedPos && m.rateType === 'position_missing'
    );
    if (hasPositionMissing) {
      // Highlight all rate fields when position_missing is present
      return true;
    }
    
    return false;
  };

  // Helper function to check if position has any missing rates
  const isPositionMissingRates = (position: string): boolean => {
    const normalizedPos = normalizePosition(position);
    return missingRateTypes.some(m => normalizePosition(m.position) === normalizedPos);
  };

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Product/Service Assignment by Position
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Assign specific Product/Service items to each position for this customer. This will be used
        for auto-populating invoices.
      </Typography>

      <Stack spacing={2}>
        {POSITIONS.map((position) => {
          const rate = getRateForPosition(position);
          const isEditing = editingPosition === position;

          return (
            <Box
              key={position}
              sx={{
                p: 2,
                border: 1,
                borderRadius: 1,
                borderColor: isPositionMissingRates(position) ? 'error.main' : 'divider',
                borderWidth: isPositionMissingRates(position) ? 2 : 1,
                bgcolor: 'background.neutral',
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2">{position}</Typography>
                  {!isEditing && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(position)}
                        disabled={upsertMutation.isPending || deleteMutation.isPending}
                      >
                        <Iconify icon={rate ? 'solar:pen-bold' : 'solar:add-circle-bold'} />
                      </IconButton>
                      {rate && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(position)}
                          disabled={upsertMutation.isPending || deleteMutation.isPending}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>

                {isEditing ? (
                  <Stack spacing={2}>
                    {/* Weekday Rates Section */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                        Weekday Rates (Monday-Friday)
                      </Typography>
                      <Stack spacing={2}>
                        <Autocomplete
                          fullWidth
                          options={services}
                          value={selectedWeekdayRegularService}
                          onChange={(event, newValue) => setSelectedWeekdayRegularService(newValue)}
                          getOptionLabel={(option) => {
                            if (option.category) {
                              return `${option.category}:${option.name}`;
                            }
                            return option.name;
                          }}
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
                              label="Weekday Regular (6am-5pm)"
                              placeholder="Search by name or category..."
                              error={isRateFieldMissing(position, 'weekday_regular')}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  ...(isRateFieldMissing(position, 'weekday_regular') && {
                                    '& fieldset': {
                                      borderColor: 'error.main',
                                      borderWidth: 2,
                                    },
                                  }),
                                },
                              }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
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
                            </li>
                          )}
                        />
                        
                        <Autocomplete
                          fullWidth
                          options={services}
                          value={selectedWeekdayOvertimeService}
                          onChange={(event, newValue) => setSelectedWeekdayOvertimeService(newValue)}
                          getOptionLabel={(option) => {
                            if (option.category) {
                              return `${option.category}:${option.name}`;
                            }
                            return option.name;
                          }}
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
                              label="Weekday Overtime (5pm-10pm)"
                              placeholder="Search by name or category..."
                              error={isRateFieldMissing(position, 'weekday_overtime')}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  ...(isRateFieldMissing(position, 'weekday_overtime') && {
                                    '& fieldset': {
                                      borderColor: 'error.main',
                                      borderWidth: 2,
                                    },
                                  }),
                                },
                              }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
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
                            </li>
                          )}
                        />
                        
                        <Autocomplete
                          fullWidth
                          options={services}
                          value={selectedWeekdayDoubleTimeService}
                          onChange={(event, newValue) => setSelectedWeekdayDoubleTimeService(newValue)}
                          getOptionLabel={(option) => {
                            if (option.category) {
                              return `${option.category}:${option.name}`;
                            }
                            return option.name;
                          }}
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
                              label="Weekday Double Time (10pm-6am)"
                              placeholder="Search by name or category..."
                              error={isRateFieldMissing(position, 'weekday_double_time')}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  ...(isRateFieldMissing(position, 'weekday_double_time') && {
                                    '& fieldset': {
                                      borderColor: 'error.main',
                                      borderWidth: 2,
                                    },
                                  }),
                                },
                              }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
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
                            </li>
                          )}
                        />
                      </Stack>
                    </Box>

                    {/* Divider between Weekday and Saturday */}
                    <Divider sx={{ my: 1 }} />

                    {/* Saturday Rates Section */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                        Saturday Rates
                      </Typography>
                      <Stack spacing={2}>
                        <Autocomplete
                          fullWidth
                          options={services}
                          value={selectedSaturdayOvertimeService}
                          onChange={(event, newValue) => setSelectedSaturdayOvertimeService(newValue)}
                          getOptionLabel={(option) => {
                            if (option.category) {
                              return `${option.category}:${option.name}`;
                            }
                            return option.name;
                          }}
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
                              label="Saturday Overtime (6am-5pm)"
                              placeholder="Search by name or category..."
                              error={isRateFieldMissing(position, 'saturday_overtime')}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  ...(isRateFieldMissing(position, 'saturday_overtime') && {
                                    '& fieldset': {
                                      borderColor: 'error.main',
                                      borderWidth: 2,
                                    },
                                  }),
                                },
                              }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
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
                            </li>
                          )}
                        />
                        
                        <Autocomplete
                          fullWidth
                          options={services}
                          value={selectedSaturdayDoubleTimeService}
                          onChange={(event, newValue) => setSelectedSaturdayDoubleTimeService(newValue)}
                          getOptionLabel={(option) => {
                            if (option.category) {
                              return `${option.category}:${option.name}`;
                            }
                            return option.name;
                          }}
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
                              label="Saturday Double Time (5pm-6am)"
                              placeholder="Search by name or category..."
                              error={isRateFieldMissing(position, 'saturday_double_time')}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  ...(isRateFieldMissing(position, 'saturday_double_time') && {
                                    '& fieldset': {
                                      borderColor: 'error.main',
                                      borderWidth: 2,
                                    },
                                  }),
                                },
                              }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
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
                            </li>
                          )}
                        />
                      </Stack>
                    </Box>

                    {/* Divider between Saturday and Sunday/Holiday */}
                    <Divider sx={{ my: 1 }} />

                    {/* Sunday & Statutory Holidays Rates Section */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                        Sunday & Statutory Holidays Rates
                      </Typography>
                      <Stack spacing={2}>
                        <Autocomplete
                          fullWidth
                          options={services}
                          value={selectedSundayHolidayDoubleTimeService}
                          onChange={(event, newValue) => setSelectedSundayHolidayDoubleTimeService(newValue)}
                          getOptionLabel={(option) => {
                            if (option.category) {
                              return `${option.category}:${option.name}`;
                            }
                            return option.name;
                          }}
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
                              label="Sunday/Holiday Double Time (All day)"
                              placeholder="Search by name or category..."
                              error={isRateFieldMissing(position, 'sunday_holiday_double_time')}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  ...(isRateFieldMissing(position, 'sunday_holiday_double_time') && {
                                    '& fieldset': {
                                      borderColor: 'error.main',
                                      borderWidth: 2,
                                    },
                                  }),
                                },
                              }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
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
                            </li>
                          )}
                        />
                      </Stack>
                    </Box>

                    {/* Divider before Mobilization */}
                    {(position === 'LCT' || position === 'HWY' || position === 'Field Supervisor') && (
                      <Divider sx={{ my: 1 }} />
                    )}

                    {/* Mobilization Service (for LCT, HWY, and Field Supervisor) */}
                    {(position === 'LCT' || position === 'HWY' || position === 'Field Supervisor') && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                          Mobilization Service
                        </Typography>
                        <Autocomplete
                          fullWidth
                          options={services}
                          value={selectedMobilizationService}
                          onChange={(event, newValue) => setSelectedMobilizationService(newValue)}
                          getOptionLabel={(option) => {
                            if (option.category) {
                              return `${option.category}:${option.name}`;
                            }
                            return option.name;
                          }}
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
                              label="Mobilization Service"
                              placeholder="Search by name or category..."
                              error={isRateFieldMissing(position, 'mobilization')}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  ...(isRateFieldMissing(position, 'mobilization') && {
                                    '& fieldset': {
                                      borderColor: 'error.main',
                                      borderWidth: 2,
                                    },
                                  }),
                                },
                              }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
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
                            </li>
                          )}
                        />
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleCancel}
                        disabled={upsertMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleSave(position)}
                        disabled={upsertMutation.isPending}
                      >
                        {upsertMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </Box>
                  </Stack>
                ) : (
                  <Box sx={{ width: '100%' }}>
                    {rate ? (
                      <Stack spacing={2.5}>
                        {/* Weekday Rates Section */}
                        {(rate.weekday_regular_service_name || rate.weekday_overtime_service_name || rate.weekday_double_time_service_name) && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                              Weekday Rates (Monday-Friday)
                            </Typography>
                            <Stack spacing={1}>
                              {/* Weekday Regular Service */}
                              {rate.weekday_regular_service_name && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                      Weekday Regular (6am-5pm)
                                    </Typography>
                                    <Typography variant="body2">
                                      {rate.weekday_regular_service_category ? `${rate.weekday_regular_service_category}: ${rate.weekday_regular_service_name}` : rate.weekday_regular_service_name}
                                    </Typography>
                                  </Box>
                                  {rate.weekday_regular_service_price !== null && rate.weekday_regular_service_price !== undefined && (
                                    <Typography variant="body2" sx={{ ml: 2, fontWeight: 'fontWeightMedium' }}>
                                      {fCurrency(rate.weekday_regular_service_price)}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                              
                              {/* Weekday Overtime Service */}
                              {rate.weekday_overtime_service_name && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                      Weekday Overtime (5pm-10pm)
                                    </Typography>
                                    <Typography variant="body2">
                                      {rate.weekday_overtime_service_category ? `${rate.weekday_overtime_service_category}: ${rate.weekday_overtime_service_name}` : rate.weekday_overtime_service_name}
                                    </Typography>
                                  </Box>
                                  {rate.weekday_overtime_service_price !== null && rate.weekday_overtime_service_price !== undefined && (
                                    <Typography variant="body2" sx={{ ml: 2, fontWeight: 'fontWeightMedium' }}>
                                      {fCurrency(rate.weekday_overtime_service_price)}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                              
                              {/* Weekday Double Time Service */}
                              {rate.weekday_double_time_service_name && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                      Weekday Double Time (10pm-6am)
                                    </Typography>
                                    <Typography variant="body2">
                                      {rate.weekday_double_time_service_category ? `${rate.weekday_double_time_service_category}: ${rate.weekday_double_time_service_name}` : rate.weekday_double_time_service_name}
                                    </Typography>
                                  </Box>
                                  {rate.weekday_double_time_service_price !== null && rate.weekday_double_time_service_price !== undefined && (
                                    <Typography variant="body2" sx={{ ml: 2, fontWeight: 'fontWeightMedium' }}>
                                      {fCurrency(rate.weekday_double_time_service_price)}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        )}
                        
                        {/* Divider between Weekday and Saturday */}
                        {(rate.weekday_regular_service_name || rate.weekday_overtime_service_name || rate.weekday_double_time_service_name) &&
                         (rate.saturday_overtime_service_name || rate.saturday_double_time_service_name) && (
                          <Divider sx={{ my: 1 }} />
                        )}
                        
                        {/* Saturday Rates Section */}
                        {(rate.saturday_overtime_service_name || rate.saturday_double_time_service_name) && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                              Saturday Rates
                            </Typography>
                            <Stack spacing={1}>
                              {/* Saturday Overtime Service */}
                              {rate.saturday_overtime_service_name && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                      Saturday Overtime (6am-5pm)
                                    </Typography>
                                    <Typography variant="body2">
                                      {rate.saturday_overtime_service_category ? `${rate.saturday_overtime_service_category}: ${rate.saturday_overtime_service_name}` : rate.saturday_overtime_service_name}
                                    </Typography>
                                  </Box>
                                  {rate.saturday_overtime_service_price !== null && rate.saturday_overtime_service_price !== undefined && (
                                    <Typography variant="body2" sx={{ ml: 2, fontWeight: 'fontWeightMedium' }}>
                                      {fCurrency(rate.saturday_overtime_service_price)}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                              
                              {/* Saturday Double Time Service */}
                              {rate.saturday_double_time_service_name && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                      Saturday Double Time (5pm-6am)
                                    </Typography>
                                    <Typography variant="body2">
                                      {rate.saturday_double_time_service_category ? `${rate.saturday_double_time_service_category}: ${rate.saturday_double_time_service_name}` : rate.saturday_double_time_service_name}
                                    </Typography>
                                  </Box>
                                  {rate.saturday_double_time_service_price !== null && rate.saturday_double_time_service_price !== undefined && (
                                    <Typography variant="body2" sx={{ ml: 2, fontWeight: 'fontWeightMedium' }}>
                                      {fCurrency(rate.saturday_double_time_service_price)}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        )}
                        
                        {/* Divider between Saturday and Sunday/Holiday */}
                        {(rate.saturday_overtime_service_name || rate.saturday_double_time_service_name) &&
                         rate.sunday_holiday_double_time_service_name && (
                          <Divider sx={{ my: 1 }} />
                        )}
                        
                        {/* Sunday & Statutory Holidays Rates Section */}
                        {rate.sunday_holiday_double_time_service_name && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                              Sunday & Statutory Holidays Rates
                            </Typography>
                            <Stack spacing={1}>
                              {/* Sunday/Holiday Double Time Service */}
                              {rate.sunday_holiday_double_time_service_name && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                      Sunday/Holiday Double Time (All day)
                                    </Typography>
                                    <Typography variant="body2">
                                      {rate.sunday_holiday_double_time_service_category ? `${rate.sunday_holiday_double_time_service_category}: ${rate.sunday_holiday_double_time_service_name}` : rate.sunday_holiday_double_time_service_name}
                                    </Typography>
                                  </Box>
                                  {rate.sunday_holiday_double_time_service_price !== null && rate.sunday_holiday_double_time_service_price !== undefined && (
                                    <Typography variant="body2" sx={{ ml: 2, fontWeight: 'fontWeightMedium' }}>
                                      {fCurrency(rate.sunday_holiday_double_time_service_price)}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        )}

                        {/* Divider before Mobilization */}
                        {rate.mobilization_service_name && (position === 'LCT' || position === 'HWY' || position === 'Field Supervisor') && (
                          <Divider sx={{ my: 1 }} />
                        )}

                        {/* Mobilization Service (for LCT, HWY, and Field Supervisor) */}
                        {rate.mobilization_service_name && (position === 'LCT' || position === 'HWY' || position === 'Field Supervisor') && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                              Mobilization Service
                            </Typography>
                            <Stack spacing={1}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                    Mobilization
                                  </Typography>
                                  <Typography variant="body2">
                                    {rate.mobilization_service_category ? `${rate.mobilization_service_category}: ${rate.mobilization_service_name}` : rate.mobilization_service_name}
                                  </Typography>
                                </Box>
                                {rate.mobilization_service_price !== null && rate.mobilization_service_price !== undefined && (
                                  <Typography variant="body2" sx={{ ml: 2, fontWeight: 'fontWeightMedium' }}>
                                    {fCurrency(rate.mobilization_service_price)}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </Box>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No service assigned
                      </Typography>
                    )}
                  </Box>
                )}
              </Stack>
            </Box>
          );
        })}
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialog.value} onClose={confirmDeleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove the rate for <strong>{positionToDelete}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={confirmDeleteDialog.onFalse}
            color="inherit"
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

