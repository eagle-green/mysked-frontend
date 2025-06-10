import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { VehicleNewEditForm } from 'src/sections/resource/vehicle/vehicle-new-edit-form';
// ----------------------------------------------------------------------

export function EditVehicleView() {
  const { id } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      if (!id) return null;
      return fetcher(`${endpoints.vehicle}/${id}`);
    },
    enabled: !!id,
  });

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit a vehicle"
        links={[
          { name: 'Management' },
          { name: 'Resource' },
          { name: 'Vehicle' },
          { name: 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <VehicleNewEditForm currentData={data?.data?.vehicle} />
    </DashboardContent>
  );
}
