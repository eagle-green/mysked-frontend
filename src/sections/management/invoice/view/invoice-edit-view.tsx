import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InvoiceCreateEditForm } from '../invoice-create-edit-form';

// ----------------------------------------------------------------------

export function InvoiceEditView() {
  const { id } = useParams();

  const { data: invoiceResponse, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await fetcher(endpoints.invoice.detail(id!));
      return response.data;
    },
    enabled: !!id,
  });

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
      <CustomBreadcrumbs
        heading="Edit Invoice"
        links={[
          { name: 'Management' },
          { name: 'Invoice', href: paths.management.invoice.list },
          { name: `Invoice #${invoiceResponse.displayId || invoiceResponse.invoiceNumber}` },
        ]}
        sx={{ mb: 3 }}
      />

      <InvoiceCreateEditForm currentInvoice={invoiceResponse} allowCustomerEdit />
    </DashboardContent>
  );
}

