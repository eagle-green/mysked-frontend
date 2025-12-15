import { useCallback } from 'react';
import { useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CustomerRateAssignment } from '../customer-rate-assignment';

// ----------------------------------------------------------------------

interface CustomerData {
  id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  qbo_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerRate {
  id: string;
  customer_id: string;
  position: string;
  service_id: string;
  service_name: string;
  qbo_item_id: string | null;
  service_type: string;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------

export function CustomerDetailView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _queryClient = useQueryClient();

  // Fetch customer details
  const { data: customerResponse, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => fetcher(endpoints.invoice.customerDetails(id!)),
    enabled: !!id,
  });

  // Fetch customer rates
  const { data: ratesResponse, isLoading: isLoadingRates } = useQuery({
    queryKey: ['customerRates', id],
    queryFn: () => fetcher(endpoints.invoice.customerRates(id!)),
    enabled: !!id,
  });

  const customer = customerResponse?.data as CustomerData | undefined;
  const rates = (ratesResponse?.data as CustomerRate[]) || [];

  const isLoading = isLoadingCustomer || isLoadingRates;

  const handleBack = useCallback(() => {
    router.push(paths.management.invoice.customers.list);
  }, [router]);

  if (isLoading) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (!customer) {
    return (
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="Customer Not Found"
          links={[
            { name: 'Management', href: paths.management.root },
            { name: 'Invoice', href: paths.management.invoice.root },
            { name: 'Customers', href: paths.management.invoice.customers.list },
            { name: 'Not Found' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Card sx={{ p: 3 }}>
          <Typography variant="body1">Customer not found.</Typography>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={handleBack}
            sx={{ mt: 2 }}
          >
            Back to Customers
          </Button>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Customer Details"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Invoice', href: paths.management.invoice.root },
          { name: 'Customers', href: paths.management.invoice.customers.list },
          { name: customer.name },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={handleBack}
          >
            Back
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {/* Customer Information Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Customer Information
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{customer.name || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Company Name
                </Typography>
                <Typography variant="body1">{customer.company_name || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Phone Number
                </Typography>
                <Typography variant="body1">{customer.phone || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                {customer.email ? (
                  <Box>
                    {customer.email
                      .split(',')
                      .map((email) => email.trim())
                      .filter((email) => email.length > 0)
                      .map((email, index, array) => (
                        <Typography
                          key={index}
                          variant="body1"
                          sx={{ display: 'block', mb: index < array.length - 1 ? 0.5 : 0 }}
                        >
                          {email}
                        </Typography>
                      ))}
                  </Box>
                ) : (
                  <Typography variant="body1">-</Typography>
                )}
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1">{customer.address || '-'}</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Rate Assignment Card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <CustomerRateAssignment customerId={id!} rates={rates as any} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}

