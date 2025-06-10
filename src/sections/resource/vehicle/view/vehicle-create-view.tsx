import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { VehicleNewEditForm } from '../vehicle-new-edit-form';

// ----------------------------------------------------------------------

export function CreateVehicleView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new vehicle"
        links={[
          { name: 'Management' },
          { name: 'Resource' },
          { name: 'Vehicle' },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <VehicleNewEditForm />
    </DashboardContent>
  );
}
