import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EmployeeNewEditForm } from 'src/sections/employee/employee-new-edit-form';
// ----------------------------------------------------------------------

export function EmployeeEditView() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      if (!id) return null;
      return fetcher(`${endpoints.employee}/${id}`);
    },
    enabled: !!id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError || !data) return <div>Something went wrong.</div>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit an employee"
        links={[{ name: 'Management' }, { name: 'Employee' }, { name: 'Edit Employee' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EmployeeNewEditForm currentEmployee={data} />
    </DashboardContent>
  );
} 