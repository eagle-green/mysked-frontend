import dayjs from 'dayjs';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components/router-link';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { Iconify } from 'src/components/iconify/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { IVehiclePicture } from 'src/types/vehicle-picture';

import { AdminPreTripVehicleDetailComponent } from '../component/pre-trip-vehicle-detail';

//------------------------------------------------------------------

export function AdminPreTripVehicleDetailView() {
  const INSPECTION_DATA = [
    {
      field_name: 'air_brake_system',
      label: 'Air brake System',
      is_required: false,
      has_defect: 'yes',
      description: 'Pad thickness, rotor condition, and hydraulic pressure test',
      detect_issues: {
        detect_type: 'major',
        notes:
          'During inspection of the air brake system, it was observed that the brake pad thickness is below the minimum allowable limit. The rotor surface shows signs of uneven wear and minor scoring. Additionally, the hydraulic pressure test indicates inconsistent pressure levels, suggesting possible leakage or internal system inefficiency',
        photo:
          '["https://res.cloudinary.com/djzqhekl3/image/upload/v1768615599/vehicles/8ca76ec4-dd35-4c90-8401-a906ded935bd/inside/inside_8ca76ec4-dd35-4c90-8401-a906ded935bd_1768615589_cqlmx5wqn.jpg", "https://res.cloudinary.com/djzqhekl3/image/upload/v1768615560/vehicles/8ca76ec4-dd35-4c90-8401-a906ded935bd/back/back_8ca76ec4-dd35-4c90-8401-a906ded935bd_1768615557_glp83y9tz.jpg", "https://res.cloudinary.com/djzqhekl3/image/upload/v1768615560/vehicles/8ca76ec4-dd35-4c90-8401-a906ded935bd/back/back_8ca76ec4-dd35-4c90-8401-a906ded935bd_1768615557_glp83y9tz.jpg", "https://res.cloudinary.com/djzqhekl3/image/upload/v1768615560/vehicles/8ca76ec4-dd35-4c90-8401-a906ded935bd/back/back_8ca76ec4-dd35-4c90-8401-a906ded935bd_1768615557_glp83y9tz.jpg"]',
      },
    },
    {
      field_name: 'cab',
      label: 'Cab',
      is_required: true,
      has_defect: 'yes',
      description: 'Cab Interior – Safety and Control Components Inspection',
      detect_issues: {
        detect_type: 'minor',
        notes:
          'During cab inspection, multiple defects were identified affecting driver safety and operational readiness. Issues include worn or non-functional seat belts, malfunctioning dashboard indicators, and poor visibility due to damaged or dirty windshield components',
        photo:
          '["https://res.cloudinary.com/djzqhekl3/image/upload/v1768615560/vehicles/8ca76ec4-dd35-4c90-8401-a906ded935bd/back/back_8ca76ec4-dd35-4c90-8401-a906ded935bd_1768615557_glp83y9tz.jpg"]',
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
    inspections: INSPECTION_DATA,
    status: 'pending',
    pictures: [
      {
        id: '534699c4-ff82-4b5f-8a54-57450469ff49',
        vehicle_id: '8ca76ec4-dd35-4c90-8401-a906ded935bd',
        section: 'inside',
        note: '',
        url: 'https://res.cloudinary.com/djzqhekl3/image/upload/v1768615599/vehicles/8ca76ec4-dd35-4c90-8401-a906ded935bd/inside/inside_8ca76ec4-dd35-4c90-8401-a906ded935bd_1768615589_cqlmx5wqn.jpg',
        uploaded_at: '2026-01-17T02:06:40.233Z',
        uploaded_by: {
          id: 'a980a0ab-d625-4e28-95be-afa0bc0d96aa',
          first_name: 'Mohsin',
          last_name: 'Ali',
          photo_url:
            'https://res.cloudinary.com/djzqhekl3/image/upload/v1761021382/users/a980a0ab-d625-4e28-95be-afa0bc0d96aa/profile_a980a0ab-d625-4e28-95be-afa0bc0d96aa.jpg',
        },
        file_name: 'image.jpg',
        file_size: 2665876,
        mime_type: 'image/jpeg',
      },
      {
        id: '534699c4-ff82-4b5f-8a54-57450469ff49',
        vehicle_id: '8ca76ec4-dd35-4c90-8401-a906ded935bd',
        section: 'inside',
        note: '',
        url: 'https://res.cloudinary.com/djzqhekl3/image/upload/v1768615560/vehicles/8ca76ec4-dd35-4c90-8401-a906ded935bd/back/back_8ca76ec4-dd35-4c90-8401-a906ded935bd_1768615557_glp83y9tz.jpg',
        uploaded_at: '2026-01-17T02:06:40.233Z',
        uploaded_by: {
          id: 'a980a0ab-d625-4e28-95be-afa0bc0d96aa',
          first_name: 'Mohsin',
          last_name: 'Ali',
          photo_url:
            'https://res.cloudinary.com/djzqhekl3/image/upload/v1761021382/users/a980a0ab-d625-4e28-95be-afa0bc0d96aa/profile_a980a0ab-d625-4e28-95be-afa0bc0d96aa.jpg',
        },
        file_name: 'image.jpg',
        file_size: 2665876,
        mime_type: 'image/jpeg',
      },
    ] as IVehiclePicture[],
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

        <AdminPreTripVehicleDetailComponent
          data={data}
          inspections={data.inspections}
          pictures={data.pictures}
        />
      </DashboardContent>
    </>
  );
}
