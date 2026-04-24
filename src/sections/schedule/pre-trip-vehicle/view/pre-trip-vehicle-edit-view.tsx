import dayjs from 'dayjs';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { PreTripVehicleEditForm } from '../pre-trip-vehicle-edit-form';

//-----------------------------------------------------
export function PreTripVehicleEditView() {
  const INSPECTION_DATA = [
    {
      field_name: 'air_brake_system',
      label: 'Air brake System',
      is_required: false,
      has_defect: '',
      detect_issues: {
        detect_type: '',
        notes: '',
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
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Vehicle Inspection Edit"
        links={[
          { name: 'My Schedule' },
          { name: 'Work' },
          { name: 'Vehicle Inspection List', href: paths.schedule.work.pre_trip_vehicle.list },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PreTripVehicleEditForm data={data} inspections={data.inspections} />
    </DashboardContent>
  );
}
