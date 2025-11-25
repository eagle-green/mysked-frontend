import { Suspense } from 'react';

import { DashboardContent } from 'src/layouts/dashboard';

import { VehicleAuditView } from 'src/sections/management/vehicle/view/vehicle-audit-view';

// ----------------------------------------------------------------------

export default function VehicleAuditPage() {
  return (
    <DashboardContent>
      <Suspense>
        <VehicleAuditView />
      </Suspense>
    </DashboardContent>
  );
}

