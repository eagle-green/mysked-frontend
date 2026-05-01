import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { Iconify } from 'src/components/iconify/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { PreTripInspectionTypeDialog } from '../component/pre-trip-inspection-list-modal';
import { AdminPreTripVehicleListComponent } from '../component/pre-trip-vehicle-table-list';
import { PreTripInspectionFormDialog } from '../component/pre-trip-inspection-create-modal';

//------------------------------------------------------------------

export function AdminPreTripVehicleListView() {
  const inspectionList = useBoolean();
  const inspectionTypeForm = useBoolean();

  const inspectionTypeList = [
    {
      id: 1,
      label: 'Engine Diagnostic',
      description: 'Detaild check of fluid levels, belt tension, and error codes',
      is_required: true,
      field_name: 'engine_diagnostic',
    },
    {
      id: 2,
      label: 'Cabin & Controls',
      description: 'Setbelt integrity, dashboard indicators, and AC functionality',
      is_required: false,
      field_name: 'cabin_controls',
    },
    {
      id: 3,
      label: 'Breaking System',
      description: 'Pad thickness, rotor condition, and hydraulic pressure test',
      is_required: true,
      field_name: 'cabin_controls',
    },
  ];

  const [selectedInspection, setSelectedInspection] = useState(null);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Management Pre Trip Vehicle"
          links={[
            { name: 'Management' },
            { name: 'Vehicle' },
            { name: 'Pre Trip Vehicle' },
            { name: 'List' },
          ]}
          action={
            <Button
              // component={RouterLink}
              // href={paths.management.vehicle.pre_trip_vehicle.create}
              variant="contained"
              startIcon={<Iconify icon="solar:eye-bold" />}
              onClick={inspectionList.onTrue}
            >
              View Inspection Type List
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <AdminPreTripVehicleListComponent />

        <PreTripInspectionTypeDialog
          title="Inspection Type List"
          open={inspectionList.value}
          onClose={inspectionList.onFalse}
          onSelect={(data) => {
            console.log(data);
            setSelectedInspection(data);
            inspectionTypeForm.onTrue();
          }}
          list={inspectionTypeList}
          action={
            <Button
              size="small"
              startIcon={<Iconify icon="mingcute:add-line" />}
              sx={{ alignSelf: 'flex-end', p: 1 }}
              onClick={inspectionTypeForm.onTrue}
            >
              Add New
            </Button>
          }
        />

        <PreTripInspectionFormDialog
          open={inspectionTypeForm.value}
          onClose={inspectionTypeForm.onFalse}
          onUpdateSuccess={async (data) => {
            // Close both dialogs immediately
            inspectionTypeForm.onFalse();
            console.log(data);
          }}
          currentData={selectedInspection}
        />
      </DashboardContent>
    </>
  );
}
