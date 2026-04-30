import dayjs from 'dayjs';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { Iconify } from 'src/components/iconify/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { AdminPreTripVehicleDetailComponent } from '../component/pre-trip-vehicle-detail';

//------------------------------------------------------------------

export function AdminPreTripVehicleDetailView() {
  const INSPECTION_DATA = [
    {
      field_name: 'air_brake_system',
      label: 'Air brake System',
      is_required: false,
      has_defect: 'yes',
      detect_issues: {
        detect_type: 'major',
        notes: 'Test',
        photo: undefined,
      },
    },
    {
      field_name: 'cab',
      label: 'Cab',
      is_required: true,
      has_defect: '',
      detect_issues: {
        detect_type: '',
        notes: '',
        photo: undefined,
      },
    },
    {
      field_name: 'cargo_securement',
      label: 'Cargo Securement',
      is_required: true,
      has_defect: '',
      detect_issues: {
        detect_type: '',
        notes: '',
        photo: undefined,
      },
    },
    {
      field_name: 'steering',
      label: 'Steering',
      is_required: true,
      has_defect: '',
      detect_issues: {
        detect_type: '',
        notes: '',
        photo: undefined,
      },
    },
    {
      field_name: 'suspension_system',
      label: 'Suspension System',
      is_required: true,
      has_defect: '',
      detect_issues: {
        detect_type: '',
        notes: '',
        photo: undefined,
      },
    },
    {
      field_name: 'tires',
      label: 'Tires',
      is_required: true,
      has_defect: '',
      detect_issues: {
        detect_type: '',
        notes: '',
        photo: undefined,
      },
    },
  ];

  const data = {
    id: '1',
    job_id: '1',
    job: {
      job_number: 'JO-202604',
      job_start: dayjs().toISOString(),
      job_end: dayjs().add(9, 'hour').toISOString(),
    },
    driver: {
      displayName: 'Jerwin Fortillano',
      role: 'LCT',
      photo_url: null,
      status: 'active',
    },
    client: {
      displayName: 'EAGLEGREEN',
      role: 'LCT',
      photo_url: null,
    },
    customer: {
      displayName: 'Joe Drake -Excavating',
      role: 'LCT',
      photo_url: null,
    },
    vehicle: {
      license_plate: 'SR1384',
      info: 'Ford F150',
      year: '2016',
      vehicle_type: 'Lane Closure Truck',
      unit_no: '#004',
      location: 'New Westminster',
      SpareKey: true,
      WinterTire: true,
      TowHitch: true,
      status: 'Active',
    },
    site: {
      display_address: '123123, 56789, Alunan, Bacolod, New Brunswick, A1A 2C2, Philippines',
    },
    open_defects: 0,
    resolve_defects: 0,
    type: 'Pre-Trip',
    status: 'pending',
    created_at: dayjs().format('MM-DD-YYYY'),
    submitted_at: '',
    inspections: INSPECTION_DATA,
  };

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Management Pre Trip Vehicle"
          links={[
            { name: 'Management' },
            { name: 'Vehicle' },
            { name: 'Pre Trip Vehicle' },
            { name: 'Detail' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.management.vehicle.pre_trip_vehicle.list}
              variant="contained"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            >
              Back
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <AdminPreTripVehicleDetailComponent data={data} inspections={data.inspections} />
      </DashboardContent>
    </>
  );
}
