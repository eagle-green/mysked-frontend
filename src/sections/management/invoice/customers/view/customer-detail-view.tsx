import { Icon } from '@iconify/react';
import { useParams } from 'react-router';
import { lazy, Suspense, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, usePathname, useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CustomerInfoTab } from '../customer-info-tab';
import { CustomerProfileCover } from '../customer-profile-cover';

// Lazy load tab components
const CustomerRateAssignmentTab = lazy(() =>
  import('../customer-rate-assignment').then((module) => ({
    default: module.CustomerRateAssignment,
  }))
);

const CustomerInventoryRateAssignmentTab = lazy(() =>
  import('../customer-inventory-rate-assignment').then((module) => ({
    default: module.CustomerInventoryRateAssignment,
  }))
);

// Loading component for Suspense fallback
const TabLoadingFallback = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={100} sx={{ mb: 1 }} />
    <Skeleton variant="rectangular" height={100} />
  </Box>
);

// Preload functions for better UX
const preloadServiceRates = () => {
  import('../customer-rate-assignment');
};

const preloadBillableItems = () => {
  import('../customer-inventory-rate-assignment');
};

// ----------------------------------------------------------------------

const TAB_ITEMS = [
  {
    value: '',
    label: 'Customer Info',
    icon: <Icon width={24} icon="solar:user-bold" />,
  },
  {
    value: 'service-rates',
    label: 'Service Rates',
    icon: <Icon width={24} icon="solar:wallet-money-bold" />,
    onMouseEnter: preloadServiceRates,
  },
  {
    value: 'billable-items',
    label: 'Billable Items',
    icon: <Icon width={24} icon="solar:box-bold" />,
    onMouseEnter: preloadBillableItems,
  },
];

// ----------------------------------------------------------------------

const TAB_PARAM = 'tab';

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get(TAB_PARAM) ?? '';
  const { id } = useParams<{ id: string }>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _queryClient = useQueryClient();

  const createRedirectPath = (currentPath: string, query: string) => {
    const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
    return query ? `${currentPath}?${queryString}` : currentPath;
  };

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

  // Fetch customer inventory rates
  const { data: inventoryRatesResponse, isLoading: isLoadingInventoryRates } = useQuery({
    queryKey: ['customerInventoryRates', id],
    queryFn: () => fetcher(endpoints.invoice.customerInventoryRates(id!)),
    enabled: !!id,
  });

  const customer = customerResponse?.data as CustomerData | undefined;
  const rates = (ratesResponse?.data as CustomerRate[]) || [];
  const inventoryRates = (inventoryRatesResponse?.data as any[]) || [];

  const isLoading = isLoadingCustomer || isLoadingRates || isLoadingInventoryRates;

  const handleBack = useCallback(() => {
    router.push(paths.management.invoice.customers.list);
  }, [router]);

  if (isLoading) {
    return (
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="Customer Details"
          links={[
            { name: 'Management', href: paths.management.root },
            { name: 'Invoice', href: paths.management.invoice.root },
            { name: 'Customers', href: paths.management.invoice.customers.list },
            { name: 'Loading...' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <TabLoadingFallback />
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

      {customer && (
        <Card sx={{ mb: 3, height: { xs: 290, md: 180 }, position: 'relative' }}>
          <CustomerProfileCover
            name={customer.name}
            companyName={customer.company_name}
          />
          <Box
            sx={{
              width: 1,
              bottom: 0,
              zIndex: 9,
              px: { md: 3 },
              display: 'flex',
              position: 'absolute',
              bgcolor: 'background.paper',
              justifyContent: { xs: 'center', md: 'flex-end' },
            }}
          >
            <Tabs value={selectedTab}>
              {TAB_ITEMS.map((tab) => (
                <Tab
                  component={RouterLink}
                  key={tab.value}
                  value={tab.value}
                  icon={tab.icon}
                  label={tab.label}
                  href={createRedirectPath(pathname, tab.value)}
                  onMouseEnter={tab.onMouseEnter}
                />
              ))}
            </Tabs>
          </Box>
        </Card>
      )}

      {selectedTab === '' && customer && <CustomerInfoTab customer={customer} />}
      {selectedTab === 'service-rates' && customer && (
        <Suspense fallback={<TabLoadingFallback />}>
          <CustomerRateAssignmentTab customerId={id!} rates={rates as any} />
        </Suspense>
      )}
      {selectedTab === 'billable-items' && customer && (
        <Suspense fallback={<TabLoadingFallback />}>
          <CustomerInventoryRateAssignmentTab customerId={id!} rates={inventoryRates} />
        </Suspense>
      )}
    </DashboardContent>
  );
}

