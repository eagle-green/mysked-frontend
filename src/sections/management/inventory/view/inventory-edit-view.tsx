import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InventoryNewEditForm } from '../inventory-new-edit-form';

// ----------------------------------------------------------------------

export function InventoryEditView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const {
    data,
    isLoading,
    error,
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

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit inventory item"
          links={[
            { name: 'Management' },
            { name: 'Inventory', href: paths.management.inventory.list },
            { name: 'Edit' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Skeleton variant="rectangular" height={400} />
      </DashboardContent>
    );
  }

  if (error) {
    console.error('Error fetching inventory:', error);
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit inventory item"
          links={[
            { name: 'Management' },
            { name: 'Inventory', href: paths.management.inventory.list },
            { name: 'Edit' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Error Loading Inventory Item</h3>
          <p>Failed to load inventory data. Please check your authentication and try again.</p>
          <p>Error: {error?.message || 'Unknown error'}</p>
        </div>
      </DashboardContent>
    );
  }

  const inventory = data;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit inventory item"
        links={[
          { name: 'Management' },
          { name: 'Inventory', href: paths.management.inventory.list },
          { name: inventory?.name || 'Edit' },
        ]}
        action={
          <Button
            variant="contained"
            onClick={() => router.push(paths.management.inventory.list)}
            startIcon={<Iconify icon="eva:arrowhead-left-fill" />}
          >
            Back
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {inventory && <InventoryNewEditForm currentData={inventory} />}
    </DashboardContent>
  );
}


