import dayjs from 'dayjs';
import { useMemo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';

import { fetcher, endpoints } from 'src/lib/axios';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function InvoiceCreateEditStatusDate() {
  const { watch, setValue } = useFormContext();

  // Only watch specific fields needed for calculations (not all fields!)
  const currentTerms = watch('terms');
  const currentStore = watch('store');
  const invoiceDate = watch('createDate');
  const currentDueDate = watch('dueDate');

  // Fetch terms from QBO
  const { data: termsResponse, error: termsError } = useQuery({
    queryKey: ['invoice-terms'],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: '1',
          rowsPerPage: '100',
          active: 'true',
        });
        const response = await fetcher(`${endpoints.invoice.terms}?${params.toString()}`);
        return response;
      } catch (error) {
        console.error('Error in terms queryFn:', error);
        throw error;
      }
    },
    enabled: true, // Explicitly enable the query
  });

  // Fetch stores from QBO
  const { data: storesResponse, error: storesError } = useQuery({
    queryKey: ['invoice-stores'],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: '1',
          rowsPerPage: '100',
          active: 'true',
        });
        const response = await fetcher(`${endpoints.invoice.stores}?${params.toString()}`);
        return response;
      } catch (error) {
        console.error('Error in stores queryFn:', error);
        throw error;
      }
    },
    enabled: true, // Explicitly enable the query
  });

  // Debug logging
  useEffect(() => {
    if (termsError) {
      console.error('Error fetching terms:', termsError);
    }
    if (storesError) {
      console.error('Error fetching stores:', storesError);
    }
  }, [termsResponse, termsError, storesResponse, storesError]);

  const terms = useMemo(() => {
    const termsData = termsResponse?.data || [];
    const filtered = (
      termsData as Array<{
        id: string;
        name: string;
        description?: string | null;
        active?: boolean;
        due_days?: number | null;
      }>
    ).filter((term) => {
      // Backend already filters by active=true, but we'll keep this as a safety check
      const isActive = term.active === true || term.active === undefined;
      return isActive;
    });
    return filtered;
  }, [termsResponse]);

  const stores = useMemo(() => {
    const storesData = storesResponse?.data || [];
    const filtered = (
      storesData as Array<{
        id: string;
        name: string;
        description?: string | null;
        active?: boolean;
      }>
    ).filter((store) => {
      // Backend already filters by active=true, but we'll keep this as a safety check
      const isActive = store.active === true || store.active === undefined;
      return isActive;
    });
    return filtered;
  }, [storesResponse]);

  // Find "Net 30" term and set as default if terms is null
  const net30Term = useMemo(() => terms.find((term) => term.name === 'Net 30'), [terms]);

  // Get selected term for due date calculation
  const selectedTerm = useMemo(() => {
    if (!currentTerms) return null;
    return terms.find((term) => term.id === currentTerms) || null;
  }, [currentTerms, terms]);

  // Get selected term name for display
  const selectedTermName = useMemo(() => selectedTerm?.name || '', [selectedTerm]);

  // Get selected store for display
  const selectedStore = useMemo(() => {
    if (!currentStore) return null;
    return stores.find((store) => store.id === currentStore) || null;
  }, [currentStore, stores]);

  const selectedStoreName = useMemo(() => selectedStore?.name || '', [selectedStore]);

  useEffect(() => {
    // Set default to "Net 30" if terms is null and Net 30 term exists
    if (!currentTerms && net30Term) {
      setValue('terms', net30Term.id);
    }
  }, [currentTerms, net30Term, setValue]);

  // Calculate due date based on selected term and invoice date
  useEffect(() => {
    if (selectedTerm && selectedTerm.due_days && invoiceDate) {
      const invoiceDateObj = dayjs(invoiceDate);
      if (invoiceDateObj.isValid()) {
        const calculatedDueDate = invoiceDateObj.add(selectedTerm.due_days, 'day');
        // Only update if the calculated date is different from current due date
        const currentDueDateObj = currentDueDate ? dayjs(currentDueDate) : null;
        if (!currentDueDateObj || !currentDueDateObj.isSame(calculatedDueDate, 'day')) {
          setValue('dueDate', calculatedDueDate.format('YYYY-MM-DD'));
        }
      }
    }
  }, [selectedTerm, invoiceDate, currentDueDate, setValue]);

  return (
    <Box
      sx={{
        p: 3,
        gap: 2,
        display: 'flex',
        bgcolor: 'background.neutral',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          gap: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Field.Select
          fullWidth
          name="terms"
          label="Terms"
          slotProps={{
            inputLabel: { shrink: true },
            select: {
              renderValue: () => selectedTermName || 'None',
            },
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {terms.map((term) => (
            <MenuItem key={term.id} value={term.id}>
              <ListItemText
                primary={term.name}
                secondary={term.description || undefined}
                slotProps={{
                  primary: { noWrap: true, sx: { typography: 'body2' } },
                  secondary: { sx: { typography: 'caption', color: 'text.secondary' } },
                }}
              />
            </MenuItem>
          ))}
          {/* If current terms value exists but not in terms list, add it as an option */}
          {currentTerms && !selectedTerm && (
            <MenuItem key={currentTerms} value={currentTerms}>
              <ListItemText
                primary={`Term (ID: ${currentTerms.substring(0, 8)}...)`}
                slotProps={{
                  primary: { noWrap: true, sx: { typography: 'body2' } },
                }}
              />
            </MenuItem>
          )}
        </Field.Select>

        <Field.DatePicker name="createDate" label="Invoice Date" />
        <Field.DatePicker name="dueDate" label="Due date" />

        <Field.Text
          name="poNumber"
          label="Purchase Order"
          placeholder="Enter purchase order number"
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <Field.Text
          name="networkNumber"
          label="Network Number/FSA"
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <Field.Text name="approver" label="Approver" slotProps={{ inputLabel: { shrink: true } }} />

        <Field.Select
          fullWidth
          name="store"
          label="Store"
          required
          slotProps={{
            inputLabel: { shrink: true },
            select: {
              renderValue: () => selectedStoreName || '',
            },
          }}
        >
          <MenuItem value="">
            <em>Select a store</em>
          </MenuItem>
          {stores.map((store) => (
            <MenuItem key={store.id} value={store.id}>
              {store.name}
            </MenuItem>
          ))}
          {/* If current store value exists but not in stores list, add it as an option */}
          {currentStore && !selectedStore && (
            <MenuItem key={currentStore} value={currentStore}>
              Store (ID: {currentStore.substring(0, 8)}...)
            </MenuItem>
          )}
        </Field.Select>
      </Box>
    </Box>
  );
}
