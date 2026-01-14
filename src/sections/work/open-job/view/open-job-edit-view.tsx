import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { JobNewEditForm } from '../open-job-new-edit-form';

// ----------------------------------------------------------------------

export function EditOpenJobView() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['openJob', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetcher(`${endpoints.work.job}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Also fetch user list to ensure it's available for employee options
  const { data: userListData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'job-creation'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.management.user}/job-creation`);
      return response.data.users;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading || isLoadingUsers) {
    return <LoadingScreen />;
  }

  if (isError || !data || !data.job) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit Open Job"
          links={[
            { name: 'Dashboard', href: '/' },
            { name: 'Work', href: '/works' },
            { name: 'Open Job', href: '/works/open-jobs/list' },
            { name: 'Edit' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>Job not found or error loading job data.</div>
      </DashboardContent>
    );
  }

  // Transform the data to match the expected format
  const jobData = {
    ...data.job,
    note: data.job.notes || '',
    start_date_time: data.job.start_time,
    end_date_time: data.job.end_time,
    company: data.job.company
      ? {
          ...data.job.company,
          fullAddress: (() => {
            // Format address: unit_number street_number street_name (first line), city province_code postal_code (second line)
            const streetAddress = [
              data.job.company.unit_number,
              data.job.company.street_number,
              data.job.company.street_name,
            ]
              .filter(Boolean)
              .join(' ');

            // Convert province name to code
            const getProvinceCode = (province: string) => {
              const provinceMap: { [key: string]: string } = {
                'British Columbia': 'BC',
                Alberta: 'AB',
                Saskatchewan: 'SK',
                Manitoba: 'MB',
                Ontario: 'ON',
                Quebec: 'QC',
                'New Brunswick': 'NB',
                'Nova Scotia': 'NS',
                'Prince Edward Island': 'PE',
                'Newfoundland and Labrador': 'NL',
                'Northwest Territories': 'NT',
                Nunavut: 'NU',
                Yukon: 'YT',
              };
              return provinceMap[province] || province;
            };

            const cityAddress = [
              data.job.company.city,
              getProvinceCode(data.job.company.province),
              data.job.company.postal_code,
            ]
              .filter(Boolean)
              .join(' ');

            return [streetAddress, cityAddress].filter(Boolean).join('\n');
          })(),
          phoneNumber: (() => {
            // Format phone number: convert +17783493433 to (778) 349-3433
            const phone = data.job.company.phoneNumber || data.job.company.contact_number || '';
            if (!phone) return '';
            const digits = phone.replace(/\D/g, '');
            if (digits.length === 11 && digits.startsWith('1')) {
              const withoutCountryCode = digits.substring(1);
              return `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
            }
            if (digits.length === 10) {
              return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
            }
            return phone;
          })(),
          contactInfo: (() => {
            const email = data.job.company.email || '';
            const phone = data.job.company.phoneNumber || data.job.company.contact_number || '';
            if (!phone) return email;
            const digits = phone.replace(/\D/g, '');
            let formattedPhone = phone;
            if (digits.length === 11 && digits.startsWith('1')) {
              const withoutCountryCode = digits.substring(1);
              formattedPhone = `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
            } else if (digits.length === 10) {
              formattedPhone = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
            }
            if (email && formattedPhone) {
              return `${email} | ${formattedPhone}`;
            } else if (email) {
              return email;
            } else if (formattedPhone) {
              return formattedPhone;
            }
            return '';
          })(),
        }
      : null,
    site: data.job.site
      ? {
          ...data.job.site,
          fullAddress: (() => {
            // Format address: unit_number street_number street_name (first line), city province_code postal_code (second line)
            const streetAddress = [
              data.job.site.unit_number,
              data.job.site.street_number,
              data.job.site.street_name,
            ]
              .filter(Boolean)
              .join(' ');

            // Convert province name to code
            const getProvinceCode = (province: string) => {
              const provinceMap: { [key: string]: string } = {
                'British Columbia': 'BC',
                Alberta: 'AB',
                Saskatchewan: 'SK',
                Manitoba: 'MB',
                Ontario: 'ON',
                Quebec: 'QC',
                'New Brunswick': 'NB',
                'Nova Scotia': 'NS',
                'Prince Edward Island': 'PE',
                'Newfoundland and Labrador': 'NL',
                'Northwest Territories': 'NT',
                Nunavut: 'NU',
                Yukon: 'YT',
              };
              return provinceMap[province] || province;
            };

            const cityAddress = [
              data.job.site.city,
              getProvinceCode(data.job.site.province),
              data.job.site.postal_code,
            ]
              .filter(Boolean)
              .join(' ');

            return [streetAddress, cityAddress].filter(Boolean).join('\n');
          })(),
          phoneNumber: (() => {
            // Format phone number: convert +17783493433 to (778) 349-3433
            const phone = data.job.site.phoneNumber || data.job.site.contact_number || '';
            if (!phone) return '';
            const digits = phone.replace(/\D/g, '');
            if (digits.length === 11 && digits.startsWith('1')) {
              const withoutCountryCode = digits.substring(1);
              return `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
            }
            if (digits.length === 10) {
              return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
            }
            return phone;
          })(),
          contactInfo: (() => {
            const email = data.job.site.email || '';
            const phone = data.job.site.phoneNumber || data.job.site.contact_number || '';
            if (!phone) return email;
            const digits = phone.replace(/\D/g, '');
            let formattedPhone = phone;
            if (digits.length === 11 && digits.startsWith('1')) {
              const withoutCountryCode = digits.substring(1);
              formattedPhone = `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
            } else if (digits.length === 10) {
              formattedPhone = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
            }
            if (email && formattedPhone) {
              return `${email} | ${formattedPhone}`;
            } else if (email) {
              return email;
            } else if (formattedPhone) {
              return formattedPhone;
            }
            return '';
          })(),
        }
      : null,
    client: data.job.client
      ? {
          ...data.job.client,
          fullAddress: (() => {
            // Format address: unit_number street_number street_name (first line), city province_code postal_code (second line)
            const streetAddress = [
              data.job.client.unit_number,
              data.job.client.street_number,
              data.job.client.street_name,
            ]
              .filter(Boolean)
              .join(' ');

            // Convert province name to code
            const getProvinceCode = (province: string) => {
              const provinceMap: { [key: string]: string } = {
                'British Columbia': 'BC',
                Alberta: 'AB',
                Saskatchewan: 'SK',
                Manitoba: 'MB',
                Ontario: 'ON',
                Quebec: 'QC',
                'New Brunswick': 'NB',
                'Nova Scotia': 'NS',
                'Prince Edward Island': 'PE',
                'Newfoundland and Labrador': 'NL',
                'Northwest Territories': 'NT',
                Nunavut: 'NU',
                Yukon: 'YT',
              };
              return provinceMap[province] || province;
            };

            const cityAddress = [
              data.job.client.city,
              getProvinceCode(data.job.client.province),
              data.job.client.postal_code,
            ]
              .filter(Boolean)
              .join(' ');

            return [streetAddress, cityAddress].filter(Boolean).join('\n');
          })(),
          phoneNumber: (() => {
            // Format phone number: convert +17783493433 to (778) 349-3433
            const phone = data.job.client.phoneNumber || data.job.client.contact_number || '';
            if (!phone) return '';
            const digits = phone.replace(/\D/g, '');
            if (digits.length === 11 && digits.startsWith('1')) {
              const withoutCountryCode = digits.substring(1);
              return `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
            }
            if (digits.length === 10) {
              return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
            }
            return phone;
          })(),
          unit_number: data.job.client.unit_number || '',
          email: data.job.client.email || '',
          contact_number: data.job.client.contact_number || data.job.client.phoneNumber || '',
          contactInfo: (() => {
            const email = data.job.client.email || '';
            const phone = data.job.client.phoneNumber || data.job.client.contact_number || '';
            if (!phone) return email;
            const digits = phone.replace(/\D/g, '');
            let formattedPhone = phone;
            if (digits.length === 11 && digits.startsWith('1')) {
              const withoutCountryCode = digits.substring(1);
              formattedPhone = `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
            } else if (digits.length === 10) {
              formattedPhone = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
            }
            if (email && formattedPhone) {
              return `${email} | ${formattedPhone}`;
            } else if (email) {
              return email;
            } else if (formattedPhone) {
              return formattedPhone;
            }
            return '';
          })(),
        }
      : null,
    workers: (data.job.workers || []).map((worker: any) => ({
      id: worker.id || worker.user_id, // Handle both id and user_id for backward compatibility
      position: worker.position,
      first_name: worker.first_name,
      last_name: worker.last_name,
      start_time: worker.start_time,
      end_time: worker.end_time,
      photo_url: worker.photo_url || '',
      status: worker.status,
    })),
    vehicles: (data.job.vehicles || []).map((vehicle: any) => {
      const operator = vehicle.operator
        ? {
            id: vehicle.operator.id,
            worker_index: vehicle.operator.worker_index,
            first_name: vehicle.operator.first_name,
            last_name: vehicle.operator.last_name,
            position:
              vehicle.operator.position ||
              data.job.workers[vehicle.operator.worker_index]?.position ||
              '',
            photo_url:
              vehicle.operator.photo_url ||
              data.job.workers[vehicle.operator.worker_index]?.photo_url ||
              '',
          }
        : {
            id: '',
            worker_index: null,
            first_name: '',
            last_name: '',
            position: '',
            photo_url: '',
          };

      // Ensure quantity is always set (default to 1 if missing)
      let quantity = vehicle.quantity;
      if (quantity === undefined || quantity === null || quantity === '' || isNaN(Number(quantity)) || Number(quantity) < 1) {
        quantity = 1;
      } else {
        quantity = Number(quantity);
      }

      return {
        type: vehicle.type,
        id: vehicle.id,
        license_plate: vehicle.license_plate,
        unit_number: vehicle.unit_number,
        quantity, // Always include quantity
        operator,
      };
    }),
    equipments: (data.job.equipments || []).map((item: any) => ({
      type: item.type,
      name: item.name,
      quantity: item.quantity,
    })),
    timesheet_manager_id: data.job.timesheet_manager_id || '',
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Open Job"
        links={[
          { name: 'Dashboard', href: '/' },
          { name: 'Work', href: '/works' },
          { name: 'Open Job', href: '/works/open-jobs/list' },
          { name: data.job?.job_number ? `#${data.job.job_number}` : 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <JobNewEditForm currentJob={jobData} userList={userListData} />
    </DashboardContent>
  );
}