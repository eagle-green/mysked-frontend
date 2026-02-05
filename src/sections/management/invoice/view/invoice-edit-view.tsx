import { useQuery } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InvoiceCreateEditForm } from '../invoice-create-edit-form';

import type { InvoiceFormRef } from '../invoice-create-edit-form';

// ----------------------------------------------------------------------

export function InvoiceEditView() {
  const { id } = useParams();
  const formRef = useRef<InvoiceFormRef>(null);
  
  const [isEditingInvoiceNumber, setIsEditingInvoiceNumber] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const { data: invoiceResponse, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await fetcher(endpoints.invoice.detail(id!));
      return response.data;
    },
    enabled: !!id,
  });

  // Update local invoice number when invoice data loads
  useEffect(() => {
    if (invoiceResponse?.invoiceNumber) {
      setInvoiceNumber(invoiceResponse.invoiceNumber);
    }
  }, [invoiceResponse?.invoiceNumber]);

  const handleSaveInvoiceNumber = () => {
    if (!invoiceNumber.trim()) {
      toast.error('Invoice number cannot be empty');
      return;
    }
    
    // Update the form's invoice number field (no toast message)
    if (formRef.current) {
      formRef.current.formMethods.setValue('invoiceNumber', invoiceNumber, { shouldDirty: true });
    }
    
    setIsEditingInvoiceNumber(false);
  };

  const handleCancelEdit = () => {
    setInvoiceNumber(invoiceResponse?.invoiceNumber || '');
    setIsEditingInvoiceNumber(false);
  };

  if (isLoading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (error || !invoiceResponse) {
    return (
      <DashboardContent>
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Invoice not found!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            The invoice you&apos;re looking for doesn&apos;t exist or has been removed.
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <CustomBreadcrumbs
          heading="Edit Invoice"
          links={[
            { name: 'Management' },
            { name: 'Invoice', href: paths.management.invoice.list },
            { name: `Invoice #${invoiceResponse.displayId || invoiceResponse.invoiceNumber}` },
          ]}
          sx={{ mb: 0 }}
        />

        <Stack direction="row" alignItems="center" spacing={1}>
          {isEditingInvoiceNumber ? (
            <>
              <TextField
                size="small"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Invoice Number"
                sx={{ width: 150 }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveInvoiceNumber();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
              />
              <IconButton
                size="small"
                color="primary"
                onClick={handleSaveInvoiceNumber}
              >
                <Iconify icon="eva:checkmark-fill" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleCancelEdit}
              >
                <Iconify icon="mingcute:close-line" />
              </IconButton>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                Invoice #: {invoiceNumber || 'N/A'}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setIsEditingInvoiceNumber(true)}
                sx={{ ml: 1 }}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </>
          )}
        </Stack>
      </Stack>

      <InvoiceCreateEditForm ref={formRef} currentInvoice={invoiceResponse} allowCustomerEdit />
    </DashboardContent>
  );
}

