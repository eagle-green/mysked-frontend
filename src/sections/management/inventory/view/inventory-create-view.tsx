import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InventoryNewEditForm } from '../inventory-new-edit-form';

// ----------------------------------------------------------------------

export function InventoryCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new inventory item"
        links={[
          { name: 'Management' },
          { name: 'Inventory' },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InventoryNewEditForm />
    </DashboardContent>
  );
}



