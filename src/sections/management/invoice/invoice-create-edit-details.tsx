import type { IInvoiceItem } from 'src/types/invoice';

import { sumBy } from 'es-toolkit';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useEffect, useCallback } from 'react';
import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { inputBaseClasses } from '@mui/material/InputBase';

import { fetcher, endpoints } from 'src/lib/axios';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import { InvoiceTotalSummary } from './invoice-total-summary';

// ----------------------------------------------------------------------

export const defaultItem: Omit<IInvoiceItem, 'id'> = {
  title: '',
  description: '',
  service: '',
  serviceDate: null,
  price: 0,
  quantity: 1,
  tax: '', // Empty string for select field
  taxName: undefined,
  taxRate: undefined,
  total: 0,
  workerName: '',
  position: '',
  shiftTimes: '',
  vehicleType: '',
  breakMinutes: null,
  travelMinutes: null,
};

const getFieldNames = (index: number) => ({
  title: `items[${index}].title`,
  description: `items[${index}].description`,
  service: `items[${index}].service`,
  serviceDate: `items[${index}].serviceDate`,
  quantity: `items[${index}].quantity`,
  price: `items[${index}].price`,
  tax: `items[${index}].tax`,
  taxName: `items[${index}].taxName`,
  taxRate: `items[${index}].taxRate`,
  total: `items[${index}].total`,
  workerName: `items[${index}].workerName`,
  position: `items[${index}].position`,
  shiftTimes: `items[${index}].shiftTimes`,
  vehicleType: `items[${index}].vehicleType`,
  breakMinutes: `items[${index}].breakMinutes`,
  travelMinutes: `items[${index}].travelMinutes`,
});

export function InvoiceCreateEditDetails() {
  const { control, setValue, getValues } = useFormContext();

  const { fields, append, insert, remove } = useFieldArray({ control, name: 'items' });

  // Use useWatch for reactive watching
  const discountType = useWatch({ control, name: 'discountType' }) || 'percent';
  const watchedItemsRaw = useWatch({ control, name: 'items' });
  const watchedDiscount = useWatch({ control, name: 'discount' }) || 0;

  // Fetch services for dropdown - only active services
  const { data: servicesResponse } = useQuery({
    queryKey: ['invoice-services'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '10000',
        status: 'active', // Only fetch active services
      });
      const response = await fetcher(`${endpoints.invoice.services}?${params.toString()}`);
      return response;
    },
  });

  const allServices = useMemo(
    () =>
      (servicesResponse?.data || []) as Array<{
        id: string;
        name: string;
        price: number | null;
        sales_description?: string | null;
        category?: string | null;
        status?: string;
        tax_code_id?: string | null;
      }>,
    [servicesResponse?.data]
  );

  // Filter to only active services and remove duplicates by ID
  const services = useMemo(() => {
    const activeServices = allServices.filter(
      (service) => service.status === 'active' || !service.status
    );
    // Remove duplicates by ID (in case there are duplicates)
    const uniqueServices = new Map<string, (typeof allServices)[0]>();
    activeServices.forEach((service) => {
      if (service.id && !uniqueServices.has(service.id)) {
        uniqueServices.set(service.id, service);
      }
    });
    return Array.from(uniqueServices.values()) as Array<{
      id: string;
      name: string;
      price: number | null;
      sales_description?: string | null;
      category?: string | null;
      status?: string;
      tax_code_id?: string | null;
    }>;
  }, [allServices]);

  // Memoize service names with unique keys (removing duplicates by name)
  // Format: "category:name" if category exists, otherwise just "name"
  const serviceNames = useMemo(() => {
    // Use a Set to remove duplicate names, keeping the first occurrence
    const seen = new Set<string>();
    const unique: string[] = [];
    services.forEach((service) => {
      if (service.name && !seen.has(service.name)) {
        seen.add(service.name);
        // Format as "category:name" if category exists
        const displayName = service.category ? `${service.category}:${service.name}` : service.name;
        unique.push(displayName);
      }
    });
    return unique;
  }, [services]);

  // Fetch tax codes for dropdown
  const { data: taxCodesResponse, error: taxCodesError } = useQuery({
    queryKey: ['invoice-tax-codes'],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: '1',
          rowsPerPage: '100',
          active: 'true',
        });
        const response = await fetcher(`${endpoints.invoice.taxCodes}?${params.toString()}`);
        return response;
      } catch (error) {
        console.error('Error in tax codes queryFn:', error);
        throw error;
      }
    },
    enabled: true, // Explicitly enable the query
  });

  // Debug logging
  useEffect(() => {
    if (taxCodesError) {
      console.error('Error fetching tax codes:', taxCodesError);
    }
  }, [taxCodesResponse, taxCodesError]);

  // Filter to only show active tax codes and exclude adjustment tax codes
  const taxCodes = useMemo(() => {
    const taxCodesData = taxCodesResponse?.data || [];
    const filtered = (
      taxCodesData as Array<{
        id: string;
        name: string;
        rate: number;
        active?: boolean;
      }>
    ).filter((tc) => {
      // Filter out inactive tax codes
      const isActive = tc.active === true || tc.active === undefined;
      if (!isActive) {
        return false;
      }

      // Filter out adjustment tax codes (these are for adjustments, not regular invoicing)
      const isAdjustment = tc.name.toLowerCase().includes('adjustment');
      if (isAdjustment) {
        return false;
      }

      return true;
    });
    return filtered;
  }, [taxCodesResponse]);

  // Calculate items from watched values - memoize to avoid dependency issues
  const items = useMemo(() => watchedItemsRaw || [], [watchedItemsRaw]);
  const discount = watchedDiscount;

  const subtotal = useMemo(() => sumBy(items, (item: IInvoiceItem) => (item.quantity || 0) * (item.price || 0)), [items]);

  // Calculate discount amount based on type
  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * discount) / 100;
    }
    return discount; // value type
  }, [subtotal, discount, discountType]);

  // Calculate total tax from all items
  const totalTax = useMemo(() => items.reduce((sum: number, item: IInvoiceItem) => {
      const itemSubtotal = (item.quantity || 0) * (item.price || 0);
      const taxCodeId = item.tax;
      const taxCode = taxCodes.find((tc) => tc.id === taxCodeId);
      const taxRate = taxCode?.rate || 0;
      const itemTax = (itemSubtotal * taxRate) / 100;
      return sum + itemTax;
    }, 0), [items, taxCodes]);

  const totalAmount = subtotal - discountAmount + totalTax;

  useEffect(() => {
    setValue('subtotal', subtotal, { shouldValidate: false });
    setValue('totalAmount', totalAmount, { shouldValidate: false });
    setValue('taxes', totalTax, { shouldValidate: false });
  }, [setValue, subtotal, totalAmount, discountAmount, totalTax]);

  // Group items by job number (extracted from description)
  const groupedItems = useMemo(() => {
    const groups = new Map<string, Array<{ item: any; index: number }>>();

    fields.forEach((item, index) => {
      const description = getValues(`items.${index}.description`) || '';
      // Extract job number from description (e.g., "LCT (Arrow Board Truck...)-25-10247")
      // Try multiple patterns to catch all job numbers
      let jobMatch = description.match(/-(\d{2}-\d{5})$/);
      if (!jobMatch) {
        // Try pattern without leading dash (e.g., "25-10247" at end)
        jobMatch = description.match(/(\d{2}-\d{5})$/);
      }
      if (!jobMatch) {
        // Try pattern in middle of description
        jobMatch = description.match(/-(\d{2}-\d{5})-/);
      }
      
      let jobNumber = jobMatch ? jobMatch[1] : null;
      
      // If description is empty, try to find job number from other items with same service date
      if (!jobNumber && !description) {
        const currentServiceDate = getValues(`items.${index}.serviceDate`);
        if (currentServiceDate) {
          // Look for other items with the same service date that have a job number
          for (let i = 0; i < fields.length; i++) {
            if (i === index) continue;
            const otherDescription = getValues(`items.${i}.description`) || '';
            const otherServiceDate = getValues(`items.${i}.serviceDate`);
            
            if (otherDescription && otherServiceDate) {
              // Check if service dates match
              const currentDate = new Date(currentServiceDate).toISOString().split('T')[0];
              const otherDate = new Date(otherServiceDate).toISOString().split('T')[0];
              
              if (currentDate === otherDate) {
                // Try to extract job number from this item's description
                let otherJobMatch = otherDescription.match(/-(\d{2}-\d{5})$/);
                if (!otherJobMatch) {
                  otherJobMatch = otherDescription.match(/(\d{2}-\d{5})$/);
                }
                if (!otherJobMatch) {
                  otherJobMatch = otherDescription.match(/-(\d{2}-\d{5})-/);
                }
                
                if (otherJobMatch) {
                  jobNumber = otherJobMatch[1];
                  break; // Found a job number, use it
                }
              }
            }
          }
        }
      }
      
      const finalJobNumber = jobNumber || 'Other';

      if (!groups.has(finalJobNumber)) {
        groups.set(finalJobNumber, []);
      }
      groups.get(finalJobNumber)!.push({ item, index });
    });

    // Sort groups by service date (older jobs first)
    const sortedGroups = Array.from(groups.entries()).sort(([jobA, itemsA], [jobB, itemsB]) => {
      if (jobA === 'Other') return 1;
      if (jobB === 'Other') return -1;

      // Get the first item's service date for each job to determine order
      const firstItemA = itemsA[0];
      const firstItemB = itemsB[0];

      if (firstItemA && firstItemB) {
        const dateA = getValues(`items.${firstItemA.index}.serviceDate`);
        const dateB = getValues(`items.${firstItemB.index}.serviceDate`);
        if (dateA && dateB) {
          // Older dates first (ascending order)
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        }
        // If one has a date and the other doesn't, prioritize the one with a date
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
      }

      // Fallback to job number comparison if dates are not available
      return jobA.localeCompare(jobB);
    });

    return sortedGroups;
  }, [fields, getValues]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Details:
      </Typography>

      <Stack spacing={3}>
        {groupedItems.map(([jobNumber, jobItems]) => {
          // Get service date from first item in the group
          const firstItem = jobItems[0];
          const serviceDate = firstItem ? getValues(`items.${firstItem.index}.serviceDate`) : null;
          const formattedDate = serviceDate
            ? new Date(serviceDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '';

          return (
            <Card key={jobNumber} sx={{ p: 2, bgcolor: 'background.neutral' }}>
              <Stack spacing={2}>
                {jobNumber !== 'Other' && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Job #{jobNumber}
                    </Typography>
                    {formattedDate && (
                      <Typography variant="caption" color="text.secondary">
                        Service Date: {formattedDate}
                      </Typography>
                    )}
                  </Box>
                )}

                <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={2}>
                  {jobItems.map(({ item, index }) => (
                    <InvoiceItem
                      key={item.id}
                      fieldNames={getFieldNames(index)}
                      onRemoveItem={() => remove(index)}
                      services={services}
                      serviceNames={serviceNames}
                      taxCodes={taxCodes}
                    />
                  ))}
                </Stack>

                {/* Add item button for this specific job */}
                {jobNumber !== 'Other' && (
                  <Button
                    size="small"
                    color="primary"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={() => {
                      // Set default tax code if available when adding new item
                      const newItem = { ...defaultItem };
                      if (taxCodes.length > 0) {
                        // Try to find GST first, otherwise use first available
                        const gstTaxCode = taxCodes.find(
                          (tc) => tc.name === 'GST' || (tc.name.includes('GST') && tc.rate === 5)
                        );
                        newItem.tax = gstTaxCode?.id || taxCodes[0].id || '';
                      }
                      // Set default title
                      newItem.title = 'New Item';
                      // Set description to empty - will be populated when service is selected
                      newItem.description = '';
                      // Set service date from the job's first item
                      if (firstItem) {
                        const jobServiceDate = getValues(`items.${firstItem.index}.serviceDate`);
                        if (jobServiceDate) {
                          newItem.serviceDate = jobServiceDate;
                        }
                      }
                      // Find the index after the last item in this job group
                      const lastItemInJob = jobItems[jobItems.length - 1];
                      const insertIndex = lastItemInJob ? lastItemInJob.index + 1 : fields.length;
                      // Insert the new item right after the last item of this job
                      insert(insertIndex, newItem);
                    }}
                    sx={{ mt: 1, alignSelf: 'flex-start' }}
                  >
                    Add item
                  </Button>
                )}
              </Stack>
            </Card>
          );
        })}
      </Stack>

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Box
        sx={{
          gap: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-end', md: 'center' },
        }}
      >
        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => {
            // Set default tax code if available when adding new item
            const newItem = { ...defaultItem };
            // Set default title to avoid validation error
            newItem.title = 'New Item';
            newItem.description = 'New Item';
            if (taxCodes.length > 0) {
              // Try to find GST first, otherwise use first available
              const gstTaxCode = taxCodes.find(
                (tc) => tc.name === 'GST' || (tc.name.includes('GST') && tc.rate === 5)
              );
              newItem.tax = gstTaxCode?.id || taxCodes[0].id || '';
            }
            append(newItem);
          }}
          sx={{ flexShrink: 0 }}
        >
          Add item
        </Button>

        <Box
          sx={{
            gap: 2,
            width: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-end', md: 'center' },
          }}
        >
          <Field.Select
            size="small"
            name="discountType"
            label="Discount Type"
            sx={{ maxWidth: { md: 180 } }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="percent">Discount percent</MenuItem>
            <MenuItem value="value">Discount value</MenuItem>
          </Field.Select>

          <Field.Text
            size="small"
            label={discountType === 'percent' ? 'Discount(%)' : 'Discount($)'}
            name="discount"
            type="number"
            sx={{ maxWidth: { md: 120 } }}
            slotProps={{
              inputLabel: { shrink: true },
              input:
                discountType === 'value'
                  ? {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>$</Box>
                        </InputAdornment>
                      ),
                    }
                  : undefined,
            }}
          />
        </Box>
      </Box>

      <InvoiceTotalSummary
        subtotal={subtotal}
        discount={discountAmount}
        discountType={discountType}
        tax={totalTax}
        totalAmount={totalAmount}
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

type InvoiceItemProps = {
  onRemoveItem: () => void;
  fieldNames: ReturnType<typeof getFieldNames>;
  services: Array<{
    id: string;
    name: string;
    price: number | null;
    sales_description?: string | null;
  }>;
  serviceNames: string[]; // Add serviceNames prop
  taxCodes: Array<{ id: string; name: string; rate: number }>;
};

export function InvoiceItem({
  onRemoveItem,
  fieldNames,
  services,
  serviceNames,
  taxCodes,
}: InvoiceItemProps) {
  const { getValues, setValue, watch } = useFormContext();

  // Watch price and quantity to react to changes
  const priceInput = watch(fieldNames.price) || 0;
  const quantityInput = watch(fieldNames.quantity) || 0;
  const taxCodeId = watch(fieldNames.tax) || '';

  // Read worker/position info from form values (not watched - only needed for display)
  const workerName = getValues(fieldNames.workerName) || '';
  const position = getValues(fieldNames.position) || '';
  const shiftTimes = getValues(fieldNames.shiftTimes) || '';
  const vehicleType = getValues(fieldNames.vehicleType) || '';
  const breakMinutes = getValues(fieldNames.breakMinutes) ?? null;
  const travelMinutes = getValues(fieldNames.travelMinutes) ?? null;

  // Calculate tax amount based on selected tax code
  const selectedTaxCode = useMemo(
    () => taxCodes.find((tc) => tc.id === taxCodeId),
    [taxCodes, taxCodeId]
  );
  const taxRate = selectedTaxCode?.rate || 0;
  const subtotal = Number(priceInput) * Number(quantityInput);
  const taxAmount = useMemo(() => (subtotal * taxRate) / 100, [subtotal, taxRate]);

  useEffect(() => {
    const totalValue = Number((subtotal + taxAmount).toFixed(2));
    setValue(fieldNames.total, totalValue);
  }, [fieldNames.total, subtotal, taxAmount, setValue]);

  const handleSelectService = useCallback(
    (option: string) => {
      // Extract service name from "category:name" format if present
      const serviceName = option.includes(':') ? option.split(':').slice(1).join(':') : option;
      const selectedService = services.find((service) => service.name === serviceName) as
        | {
            id: string;
            name: string;
            price: number | null;
            sales_description?: string | null;
            tax_code_id?: string | null;
          }
        | undefined;

      if (selectedService) {
        if (selectedService.price) {
          setValue(fieldNames.price, selectedService.price, { shouldValidate: true });
        }
        // Auto-populate description from sales_description, or use service name as fallback
        let serviceDescription = selectedService.sales_description || selectedService.name || '';
        
        // Check if there's already a job number in the description, preserve it
        const currentDescription = getValues(fieldNames.description) || '';
        const existingJobMatch = currentDescription.match(/-(\d{2}-\d{5})$/);
        if (existingJobMatch) {
          const jobNumber = existingJobMatch[1];
          // If description already has job number, just update the base description part
          serviceDescription = `${serviceDescription}-${jobNumber}`;
        } else {
          // Check if description is just a job number pattern (e.g., "-25-10247")
          const jobOnlyMatch = currentDescription.match(/^-(\d{2}-\d{5})$/);
          if (jobOnlyMatch) {
            const jobNumber = jobOnlyMatch[1];
            // Replace the temporary description with actual description + job number
            serviceDescription = `${serviceDescription}-${jobNumber}`;
          } else {
            // Try to find job number from other items with the same service date
            const currentServiceDate = getValues(fieldNames.serviceDate);
            if (currentServiceDate) {
              // Get all items to find one with the same service date
              const allItems = getValues('items') || [];
              const itemsWithSameDate = allItems.filter((item: any) => {
                if (!item.serviceDate) return false;
                const itemDate = new Date(item.serviceDate).toISOString().split('T')[0];
                const currentDate = new Date(currentServiceDate).toISOString().split('T')[0];
                return itemDate === currentDate;
              });
              
              // Find job number from items with same service date
              for (const item of itemsWithSameDate) {
                if (item.description) {
                  const jobMatch = item.description.match(/-(\d{2}-\d{5})$/);
                  if (jobMatch) {
                    const jobNumber = jobMatch[1];
                    serviceDescription = `${serviceDescription}-${jobNumber}`;
                    break;
                  }
                }
              }
            }
          }
        }
        
        setValue(fieldNames.description, serviceDescription, { shouldValidate: true });

        // Use service's tax code if available, otherwise fallback to GST or first available
        if (selectedService.tax_code_id) {
          // Use the service's tax code from QBO
          setValue(fieldNames.tax, selectedService.tax_code_id, { shouldValidate: true });
        } else {
          // Fallback: Set default tax to GST (5%) - always set a tax if available
          const gstTaxCode = taxCodes.find(
            (tc) => tc.name === 'GST' || (tc.name.includes('GST') && tc.rate === 5)
          );
          if (gstTaxCode) {
            setValue(fieldNames.tax, gstTaxCode.id, { shouldValidate: true });
          } else if (taxCodes.length > 0) {
            // Fallback to first available tax code if GST not found
            setValue(fieldNames.tax, taxCodes[0].id, { shouldValidate: true });
          }
        }
      }
    },
    [fieldNames.price, fieldNames.description, fieldNames.tax, fieldNames.serviceDate, setValue, getValues, services, taxCodes]
  );

  const handleClearService = useCallback(() => {
    setValue(fieldNames.quantity, defaultItem.quantity);
    setValue(fieldNames.price, defaultItem.price);
    setValue(fieldNames.total, defaultItem.total);
  }, [fieldNames.price, fieldNames.quantity, fieldNames.total, setValue]);

  return (
    <Box
      sx={{
        gap: 1.5,
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
      }}
    >
      {position && (
        <Box sx={{ width: 1, mb: 0.5 }}>
          {position === 'Mobilization' ? (
            // Mobilization: Show inline with bullets
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  fontStyle: 'italic',
                }}
              >
                {position}
              </Typography>
              {workerName && (
                <>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    •
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {workerName}
                  </Typography>
                </>
              )}
              {vehicleType && (
                <>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    •
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {vehicleType}
                  </Typography>
                </>
              )}
            </Stack>
          ) : (
            // Regular items: Show inline with bullets
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                }}
              >
                {position}
              </Typography>
              {workerName && (
                <>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    •
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {workerName}
                  </Typography>
                </>
              )}
              {shiftTimes && (
                <>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    •
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {shiftTimes}
                  </Typography>
                </>
              )}
              {breakMinutes !== null && breakMinutes !== undefined && breakMinutes > 0 && (
                <>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    •
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Break: {breakMinutes} min
                  </Typography>
                </>
              )}
              {travelMinutes !== null && travelMinutes !== undefined && travelMinutes > 0 && (
                <>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    •
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Travel: {travelMinutes} min
                  </Typography>
                </>
              )}
            </Stack>
          )}
        </Box>
      )}
      <Box
        sx={{
          gap: 2,
          width: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          flexWrap: 'wrap', // Always allow wrapping to prevent overflow
        }}
      >
        <Field.DatePicker
          name={fieldNames.serviceDate}
          label="Service Date"
          slotProps={{
            textField: {
              size: 'small',
            },
          }}
          sx={{
            flex: { md: '0 0 145px', xl: '0 0 145px' },
            minWidth: { md: 140, xl: 145 },
            maxWidth: { md: 160, xl: 160 },
          }}
        />

        <Field.Autocomplete
          key={`service-autocomplete-${fieldNames.service}`}
          size="small"
          name={fieldNames.service}
          label="Product/Service"
          options={serviceNames}
          freeSolo
          filterOptions={(options, { inputValue }) => {
            // If no input, return all options (limit to first 100 for performance)
            if (!inputValue || inputValue.trim() === '') {
              return options.slice(0, 100);
            }
            const searchTerm = inputValue.toLowerCase().trim();
            // Filter by both category and name (format is "category:name")
            const filtered = options.filter((option) => {
              if (!option || typeof option !== 'string') return false;
              const optionLower = option.toLowerCase();
              // Search in the full string (includes both category and name)
              return optionLower.includes(searchTerm);
            });

            return filtered;
          }}
          noOptionsText="No products/services found"
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return String(option || '');
          }}
          isOptionEqualToValue={(option, value) => {
            if (typeof option === 'string' && typeof value === 'string') {
              return option === value;
            }
            return String(option) === String(value);
          }}
          renderOption={(props, option) => {
            // Use option as key, but if there are duplicates, add index
            const { key, ...otherProps } = props;
            // Parse "category:name" format for display (split only on first colon)
            const displayOption = typeof option === 'string' ? option : String(option);
            const hasCategory = displayOption.includes(':');
            const [category, serviceName] = hasCategory
              ? [displayOption.split(':')[0], displayOption.split(':').slice(1).join(':')]
              : [null, displayOption];

            return (
              <li key={key || option} {...otherProps}>
                <Box
                  sx={{
                    width: '100%',
                    py: 0.5,
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    overflowWrap: 'break-word',
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                    {serviceName}
                  </Typography>
                  {category && (
                    <Typography variant="caption" color="text.secondary">
                      {category}
                    </Typography>
                  )}
                </Box>
              </li>
            );
          }}
          slotProps={{
            textfield: {
              slotProps: {
                inputLabel: { shrink: true },
              },
              placeholder: 'Search product/service...',
            },
          }}
          sx={{
            flex: { md: '1 1 200px', xl: '1 1 300px' }, // Flexible but with minimum base
            minWidth: { md: 350, xl: 350 },
            '& .MuiAutocomplete-input': {
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            },
          }}
          onChange={(_, newValue) => {
            const displayValue = typeof newValue === 'string' ? newValue : newValue || '';
            // Store the display format (category:name) in the form
            setValue(fieldNames.service, displayValue, { shouldValidate: true });
            if (displayValue) {
              handleSelectService(displayValue);
            } else {
              handleClearService();
            }
          }}
        />

        <Field.Text
          multiline
          maxRows={6}
          size="small"
          name={fieldNames.description}
          label="Description"
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{
            flex: { md: '2 1 400px', xl: '2 1 400px' }, // More flexible, can grow more than Product/Service
            minWidth: { md: 400, xl: 400 },
            // Force line break after description on laptop (md) only
            width: { md: '100%', xl: 'auto' },
            maxWidth: { md: '100%', xl: 'none' },
          }}
        />

        <Field.Text
          size="small"
          type="number"
          name={fieldNames.quantity}
          label="Qty"
          placeholder="0"
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{
            flex: { md: '0 1 auto', xl: '0 0 70px' }, // Flexible but won't grow on laptop
            minWidth: { md: 70, xl: 70 },
            maxWidth: { md: 90, xl: 80 },
          }}
        />

        <Field.Text
          size="small"
          type="number"
          name={fieldNames.price}
          label="Rate"
          placeholder="0.00"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>$</Box>
                </InputAdornment>
              ),
            },
            inputLabel: { shrink: true },
          }}
          sx={{
            flex: { md: '0 1 auto', xl: '0 0 110px' }, // Flexible but won't grow on laptop
            minWidth: { md: 110, xl: 110 },
            maxWidth: { md: 130, xl: 120 },
          }}
        />

        <Field.Select
          size="small"
          name={fieldNames.tax}
          label="Tax"
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{
            flex: { md: '0 1 auto', xl: '0 0 135px' }, // Flexible but won't grow on laptop
            minWidth: { md: 135, xl: 135 },
            maxWidth: { md: 160, xl: 135 },
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {taxCodes.map((taxCode) => (
            <MenuItem key={taxCode.id} value={taxCode.id}>
              {taxCode.name} ({taxCode.rate}%)
            </MenuItem>
          ))}
          {/* If current tax value exists but not in taxCodes list, add it as an option */}
          {(() => {
            const currentTaxValue = getValues(fieldNames.tax);
            const taxExistsInList = taxCodes.some((tc) => tc.id === currentTaxValue);
            if (currentTaxValue && !taxExistsInList) {
              return (
                <MenuItem key={currentTaxValue} value={currentTaxValue}>
                  Tax Code (ID: {String(currentTaxValue).substring(0, 8)}...)
                </MenuItem>
              );
            }
            return null;
          })()}
        </Field.Select>

        <Field.Text
          disabled
          size="small"
          name={fieldNames.total}
          type="number"
          label="Total"
          placeholder="0.00"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>$</Box>
                </InputAdornment>
              ),
            },
            inputLabel: { shrink: true },
          }}
          sx={{
            flex: { md: '0 1 auto', xl: '0 0 110px' }, // Flexible but won't grow on laptop
            minWidth: { md: 120, xl: 110 },
            maxWidth: { md: 140, xl: 120 },
            [`& .${inputBaseClasses.input}`]: { textAlign: { md: 'right' } },
          }}
        />
      </Box>

      <Button
        size="small"
        color="error"
        startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        onClick={onRemoveItem}
      >
        Remove
      </Button>
    </Box>
  );
}
